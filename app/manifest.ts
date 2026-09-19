import type { MetadataRoute } from "next";

// Next.js's native manifest convention: this is auto-detected, served at
// /manifest.webmanifest, and linked in <head> automatically - no need to
// reference it manually from layout.tsx metadata. Replaces the old
// hand-written public/manifest.json.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Pathshala — BCA Study Companion",
    short_name: "Pathshala",
    description:
      "A syllabus-first study companion for BCA: read your units, ask questions scoped to what you're studying, and listen along like a podcast.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#eef0ea",
    theme_color: "#5b7a5a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
