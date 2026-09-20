"use client";

import { MotionConfig } from "motion/react";

// Applies to every animation in the app: if the OS-level "reduce motion"
// preference is on, Motion automatically swaps transforms/opacity
// animations for instant changes. Belt-and-suspenders alongside the
// prefers-reduced-motion CSS override in globals.css.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
