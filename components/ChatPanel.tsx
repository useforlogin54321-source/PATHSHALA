"use client";

import { useState, useRef, useEffect } from "react";
import { recordActivityToday } from "@/lib/progress";

type Message = { role: "user" | "assistant"; content: string };

type Props = {
  unitContext: string;
  subjectName: string;
  unitTitle: string;
};

export default function ChatPanel({ unitContext, subjectName, unitTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    recordActivityToday();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          unitContext,
          subjectName,
          unitTitle,
        }),
      });
      const data = await res.json();
      const reply: string = data.reply ?? data.error ?? "Something went wrong.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Couldn't reach the assistant - check your connection." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-line)] px-4 py-3">
        <p className="font-[var(--font-sans)] text-sm font-medium text-[var(--color-ink)]">
          Ask about this unit
        </p>
        <p className="text-xs text-[var(--color-ink-faint)]">
          Scoped to {unitTitle} — won&apos;t answer beyond it without saying so.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-faint)]">
            Ask a question about this unit — a definition, an example, or help with one of the
            self-assessment questions.
          </p>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-6 rounded-2xl rounded-tr-sm bg-[var(--color-moss-soft)] px-3 py-2 text-sm text-[var(--color-ink)]"
                : "mr-6 rounded-2xl rounded-tl-sm bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-ink)]"
            }
          >
            {m.content}
          </div>
        ))}
        {loading ? (
          <div className="mr-6 rounded-2xl rounded-tl-sm bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-ink-faint)]">
            Thinking…
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 border-t border-[var(--color-line)] p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Ask a question…"
          className="flex-1 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-4 py-2 text-sm outline-none focus:border-[var(--color-moss)]"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-full bg-[var(--color-moss)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] disabled:opacity-40"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
