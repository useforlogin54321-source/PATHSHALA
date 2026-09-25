"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  audioUrl: string | null | undefined;
  title: string; // shown in the lock-screen / notification player
  subtitle: string;
};

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
const SKIP_SECONDS = 10;

// Real pre-generated audio through a normal <audio> element - the
// reliable, well-supported pattern for background/lock-screen playback,
// unlike live in-browser speech synthesis (see the README for why this
// replaced the original SpeechSynthesis-based approach).
export default function AudioPlayer({ audioUrl, title, subtitle }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [rateIndex, setRateIndex] = useState(1);
  const [ready, setReady] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setReady(false);
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = RATES[rateIndex];
  }, [rateIndex]);

  if (!audioUrl) return null;

  function play() {
    audioRef.current?.play();
  }
  function pause() {
    audioRef.current?.pause();
  }
  function toggle() {
    playing ? pause() : play();
  }
  function skip(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || Infinity, audio.currentTime + seconds));
  }
  function seekToRatio(ratio: number) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
  }
  function handleBarClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    seekToRatio((e.clientX - rect.left) / rect.width);
  }

  function setupMediaSession() {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist: subtitle, album: "Pathshala" });
    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("seekbackward", () => skip(-SKIP_SECONDS));
    navigator.mediaSession.setActionHandler("seekforward", () => skip(SKIP_SECONDS));
  }

  return (
    <div className="relative flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-3 py-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onCanPlay={() => setReady(true)}
        onPlay={() => {
          setPlaying(true);
          setupMediaSession();
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
        }}
        onPause={() => {
          setPlaying(false);
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.duration) setProgress(el.currentTime / el.duration);
        }}
        className="hidden"
      />

      <button
        onClick={() => skip(-SKIP_SECONDS)}
        disabled={!ready}
        aria-label={`Back ${SKIP_SECONDS} seconds`}
        className="flex h-7 w-7 items-center justify-center rounded-full text-xs text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface)] disabled:opacity-40"
      >
        ⟲{SKIP_SECONDS}
      </button>

      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        {playing ? (
          <motion.span
            className="absolute inset-0 rounded-full bg-[var(--color-moss)]"
            animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        ) : null}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggle}
          disabled={!ready}
          aria-label={playing ? "Pause" : "Play"}
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-moss)] text-[var(--color-paper)] disabled:opacity-50"
        >
          {playing ? "❙❙" : "▶"}
        </motion.button>
      </div>

      <button
        onClick={() => skip(SKIP_SECONDS)}
        disabled={!ready}
        aria-label={`Forward ${SKIP_SECONDS} seconds`}
        className="flex h-7 w-7 items-center justify-center rounded-full text-xs text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface)] disabled:opacity-40"
      >
        {SKIP_SECONDS}⟳
      </button>

      {/* Tap anywhere on this bar to jump straight to that point. */}
      <div
        ref={barRef}
        onClick={handleBarClick}
        className="h-4 w-14 shrink-0 cursor-pointer sm:w-20"
      >
        <div className="mt-[7px] h-1.5 overflow-hidden rounded-full bg-[var(--color-line)]">
          <motion.div
            className="h-full bg-[var(--color-moss)]"
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setSpeedMenuOpen((v) => !v)}
          className="rounded-full px-2 py-1 text-xs font-medium text-[var(--color-ochre)] hover:bg-[var(--color-surface)]"
          aria-label="Change playback speed"
        >
          {RATES[rateIndex]}×
        </button>
        <AnimatePresence>
          {speedMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSpeedMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 z-20 mb-2 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-raised)] shadow-lg"
              >
                {RATES.map((rate, i) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setRateIndex(i);
                      setSpeedMenuOpen(false);
                    }}
                    className={`block w-full px-4 py-1.5 text-right text-xs whitespace-nowrap ${
                      i === rateIndex
                        ? "bg-[var(--color-moss-soft)] font-medium text-[var(--color-ink)]"
                        : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    {rate}×
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
