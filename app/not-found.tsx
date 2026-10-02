import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
      <h1 className="font-[var(--font-serif)] text-2xl font-semibold">That page isn&apos;t in your syllabus</h1>
      <p className="mt-2 text-[var(--color-ink-soft)]">The link may be old, or the unit hasn&apos;t been added yet.</p>
      <Link href="/" className="mx-auto mt-6 inline-flex min-h-12 items-center rounded-full bg-[var(--color-moss)] px-6 font-medium text-[var(--color-on-moss)]">
        Back to subjects
      </Link>
    </main>
  );
}
