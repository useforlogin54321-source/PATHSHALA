"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
      <h1 className="font-[var(--font-serif)] text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-[var(--color-ink-soft)]">Your progress is safe on this device. Try again in a moment.</p>
      <button onClick={reset} className="mx-auto mt-6 min-h-12 rounded-full bg-[var(--color-moss)] px-6 font-medium text-[var(--color-on-moss)]">
        Try again
      </button>
    </main>
  );
}
