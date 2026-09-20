"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { recordActivity } from "@/lib/progress";
import ChatMarkdown from "./ChatMarkdown";

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
    recordActivity("asked");

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
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={
                m.role === "user"
                  ? "ml-6 rounded-2xl rounded-tr-sm bg-[var(--color-moss-soft)] px-3 py-2 text-sm text-[var(--color-ink)]"
                  : "mr-6 rounded-2xl rounded-tl-sm bg-[var(--color-surface-raised)] px-3 py-2 text-[var(--color-ink)]"
              }
            >
              {m.role === "assistant" ? <ChatMarkdown content={m.content} /> : m.content}
            </motion.div>
          ))}
          {loading ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mr-6 flex items-center gap-1 rounded-2xl rounded-tl-sm bg-[var(--color-surface-raised)] px-3 py-2.5"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-faint)]"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
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
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-full bg-[var(--color-moss)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] disabled:opacity-40"
        >
          Ask
        </motion.button>
      </div>
    </div>
  );
}
