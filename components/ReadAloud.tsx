"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  text: string;
  title: string; // shown in the lock-screen / notification player, where supported
  subtitle: string;
};

// Splits into chunks the Web Speech API handles reliably. Very long
// single utterances are prone to silently cutting off in Chrome; queuing
// shorter chunks is the standard workaround, and it also gives us
// pause/resume granularity.
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

export default function ReadAloud({ text, title, subtitle }: Props) {
  const [supported, setSupported] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [rateIndex, setRateIndex] = useState(1);
  const [chunkIndex, setChunkIndex] = useState(0);

  const chunksRef = useRef<string[]>([]);
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    chunksRef.current = chunkText(text);
    setChunkIndex(0);
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const clearResumeWorkaround = () => {
    if (resumeTimerRef.current) {
      clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  // Chrome sometimes silently pauses long-running speech synthesis.
  // Nudging resume() periodically is the widely-used workaround.
  const startResumeWorkaround = () => {
    clearResumeWorkaround();
    resumeTimerRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  };

  const speakFrom = useCallback(
    (index: number) => {
      const chunks = chunksRef.current;
      if (index >= chunks.length) {
        setPlaying(false);
        clearResumeWorkaround();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.rate = RATES[rateIndex];

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang === "en-IN") ??
        voices.find((v) => v.lang?.startsWith("en")) ??
        voices[0];
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        setChunkIndex(index);
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }
      };
      utterance.onend = () => speakFrom(index + 1);
      utterance.onerror = () => {
        setPlaying(false);
        clearResumeWorkaround();
      };

      window.speechSynthesis.speak(utterance);
    },
    [rateIndex]
  );

  const play = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setPlaying(true);
    startResumeWorkaround();
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
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  };

  const resume = () => {
    window.speechSynthesis.resume();
    setPlaying(true);
    startResumeWorkaround();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
  };

  const stop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setChunkIndex(0);
    clearResumeWorkaround();
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
      <button
        onClick={playing ? pause : chunkIndex > 0 ? resume : play}
        aria-label={playing ? "Pause read-aloud" : "Play read-aloud"}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-moss)] text-[var(--color-paper)] transition-opacity hover:opacity-90"
      >
        {playing ? "❙❙" : "▶"}
      </button>
      <span className="text-xs text-[var(--color-ink-soft)] min-w-[6ch]">{progressPct}%</span>
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
