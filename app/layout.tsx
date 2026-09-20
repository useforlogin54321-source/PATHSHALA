import type { Metadata, Viewport } from "next";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/700.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import MotionProvider from "@/components/MotionProvider";

export const metadata: Metadata = {
  title: "Pathshala — BCA study companion",
  description:
    "A syllabus-first study companion for BCA: read your units, ask questions scoped to what you're studying, and listen along like a podcast.",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pathshala",
  },
};

export const viewport: Viewport = {
  themeColor: "#5b7a5a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
