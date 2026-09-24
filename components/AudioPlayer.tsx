"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

type Props = {
  audioUrl: string | null | undefined;
  title: string; // shown in the lock-screen / notification player
  subtitle: string;
};

const RATES = [0.85, 1, 1.15, 1.3];

// Real pre-generated audio through a normal <audio> element - the
// reliable, well-supported pattern for background/lock-screen playback,
// unlike live in-browser speech synthesis (see the ReadAloud component
// this replaces, and the notes in the README on why).
export default function AudioPlayer({ audioUrl, title, subtitle }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [rateIndex, setRateIndex] = useState(1);
  const [ready, setReady] = useState(false);

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
  function cycleRate() {
    setRateIndex((i) => (i + 1) % RATES.length);
  }

  function setupMediaSession() {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist: subtitle, album: "Pathshala" });
    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    });
    navigator.mediaSession.setActionHandler("seekforward", () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(
          audioRef.current.duration || Infinity,
          audioRef.current.currentTime + 10
        );
      }
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-4 py-2">
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
          onClick={toggle}
          disabled={!ready}
          aria-label={playing ? "Pause" : "Play"}
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-moss)] text-[var(--color-paper)] disabled:opacity-50"
        >
          {playing ? "❙❙" : "▶"}
        </motion.button>
      </div>

      <div className="h-1 w-16 overflow-hidden rounded-full bg-[var(--color-line)]">
        <motion.div
          className="h-full bg-[var(--color-moss)]"
          animate={{ width: `${Math.round(progress * 100)}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>

      <button
        onClick={cycleRate}
        className="text-xs font-medium text-[var(--color-ochre)] hover:underline"
        aria-label="Change playback speed"
      >
        {RATES[rateIndex]}×
      </button>
    </div>
  );
}
