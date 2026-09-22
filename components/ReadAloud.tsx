"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";

type Props = {
  text: string;
  title: string; // shown in the lock-screen / notification player, where supported
  subtitle: string;
};

// Splits into chunks the Web Speech API handles reliably. Very long
// single utterances are prone to silently cutting off; queuing shorter
// chunks is the standard workaround, and it also gives us pause/resume
// and skip-forward granularity.
function chunkText(text: string): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + " " + sentence).length > 220 && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

const RATES = [0.85, 1, 1.15, 1.3];
const STALL_CHECK_MS = 4000;
const STALL_THRESHOLD_MS = 8000;
const MAX_NUDGES_BEFORE_SKIP = 3;

export default function ReadAloud({ text, title, subtitle }: Props) {
  const [supported, setSupported] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [rateIndex, setRateIndex] = useState(1);
  const [chunkIndex, setChunkIndex] = useState(0);

  const chunksRef = useRef<string[]>([]);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProgressRef = useRef(Date.now());
  const nudgeCountRef = useRef(0);
  const playingRef = useRef(false); // avoids stale closures inside the interval
  const currentIndexRef = useRef(0); // ditto - the interval must never read stale React state

  useEffect(() => {
    const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(hasSpeech);
    chunksRef.current = chunkText(text);
    setChunkIndex(0);

    // Voices often load asynchronously - if getVoices() is called before
    // they're ready it returns an empty list, which is harmless here
    // since we just fall back to the browser's default voice, but
    // warming it up early means the *first* play() is more likely to
    // get a real voice on the first try.
    if (hasSpeech) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const clearWatchdog = () => {
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  const markProgress = () => {
    lastProgressRef.current = Date.now();
    nudgeCountRef.current = 0;
    setStalled(false);
  };

  // Recovery-only watchdog. Some browsers (mostly desktop Chrome) can
  // silently stall long-running speech synthesis after several seconds.
  // The old version of this nudged pause()/resume() unconditionally
  // every 10s regardless of whether playback was healthy - which is
  // itself a likely cause of audible stutter/"buffering" on platforms
  // that don't have the underlying bug (this was rewritten after
  // exactly that report). Now it only intervenes when there's been no
  // real progress for a while, and gives up on a chunk (skipping to the
  // next one) rather than hanging forever if nudging doesn't help.
  const startWatchdog = () => {
    clearWatchdog();
    lastProgressRef.current = Date.now();
    nudgeCountRef.current = 0;
    watchdogRef.current = setInterval(() => {
      if (!playingRef.current) return;
      const stalledFor = Date.now() - lastProgressRef.current;
      if (stalledFor < STALL_THRESHOLD_MS) return;

      if (nudgeCountRef.current >= MAX_NUDGES_BEFORE_SKIP) {
        // Nudging isn't helping - move on rather than hang indefinitely.
        nudgeCountRef.current = 0;
        setStalled(false);
        window.speechSynthesis.cancel();
        speakFrom(currentIndexRef.current + 1);
        return;
      }

      setStalled(true);
      nudgeCountRef.current += 1;
      lastProgressRef.current = Date.now(); // give the nudge a moment to take effect
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, STALL_CHECK_MS);
  };

  function pickVoice(): SpeechSynthesisVoice | undefined {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return undefined;
    // Prefer on-device voices. Some Chrome voices are "remote" (server-
    // synthesized) - SpeechSynthesisVoice.localService is false for
    // those - and that's the most likely cause of buffering-style
    // stalls even on a good connection, since it depends on Google's
    // TTS backend rather than the device itself.
    const local = voices.filter((v) => v.localService);
    const pool = local.length > 0 ? local : voices;
    return pool.find((v) => v.lang === "en-IN") ?? pool.find((v) => v.lang?.startsWith("en")) ?? pool[0];
  }

  const speakFrom = useCallback(
    (index: number) => {
      const chunks = chunksRef.current;
      if (index >= chunks.length) {
        setPlaying(false);
        playingRef.current = false;
        clearWatchdog();
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.rate = RATES[rateIndex];
      currentIndexRef.current = index;
      const voice = pickVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        setChunkIndex(index);
        markProgress();
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }
      };
      utterance.onboundary = () => {
        markProgress(); // word-level progress signal where the voice supports it
      };
      utterance.onend = () => speakFrom(index + 1);
      utterance.onerror = (e) => {
        // Fires with "interrupted"/"canceled" from our own cancel()
        // calls (stop, skip, switching subtopics) - not a real failure.
        if (e.error === "interrupted" || e.error === "canceled") return;
        setPlaying(false);
        playingRef.current = false;
        clearWatchdog();
      };

      window.speechSynthesis.speak(utterance);
    },
    [rateIndex]
  );

  const play = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setPlaying(true);
    playingRef.current = true;
    startWatchdog();
    speakFrom(chunkIndex);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: subtitle,
        album: "Pathshala",
      });
      navigator.mediaSession.setActionHandler("play", () => resume());
      navigator.mediaSession.setActionHandler("pause", () => pause());
      navigator.mediaSession.setActionHandler("stop", () => stop());
    }
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setPlaying(false);
    playingRef.current = false;
    clearWatchdog();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  };

  const resume = () => {
    window.speechSynthesis.resume();
    setPlaying(true);
    playingRef.current = true;
    startWatchdog();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
  };

  const stop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    playingRef.current = false;
    setStalled(false);
    setChunkIndex(0);
    currentIndexRef.current = 0;
    clearWatchdog();
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
    }
  };

  const cycleRate = () => {
    setRateIndex((i) => (i + 1) % RATES.length);
  };

  if (!supported) {
    return (
      <p className="text-sm text-[var(--color-ink-faint)]">
        Read-aloud isn&apos;t supported in this browser.
      </p>
    );
  }

  const progressPct =
    chunksRef.current.length > 0 ? Math.round((chunkIndex / chunksRef.current.length) * 100) : 0;

  return (
    <div className="flex items-center gap-3 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-4 py-2">
      <div className="relative flex h-8 w-8 items-center justify-center">
        {playing ? (
          <motion.span
            className="absolute inset-0 rounded-full bg-[var(--color-moss)]"
            animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        ) : null}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={playing ? pause : chunkIndex > 0 ? resume : play}
          aria-label={playing ? "Pause read-aloud" : "Play read-aloud"}
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-moss)] text-[var(--color-paper)]"
        >
          {playing ? "❙❙" : "▶"}
        </motion.button>
      </div>
      <span className="text-xs text-[var(--color-ink-soft)] min-w-[6ch]">
        {stalled ? "recovering…" : `${progressPct}%`}
      </span>
      <button
        onClick={cycleRate}
        className="text-xs font-medium text-[var(--color-ochre)] hover:underline"
        aria-label="Change playback speed"
      >
        {RATES[rateIndex]}×
      </button>
      {chunkIndex > 0 || playing ? (
        <button
          onClick={stop}
          className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-rust)]"
        >
          stop
        </button>
      ) : null}
    </div>
  );
}
