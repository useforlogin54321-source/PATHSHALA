"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { recordActivity } from "@/lib/progress";
import ChatMarkdown from "./ChatMarkdown";
import { Close, Send } from "./Icons";

type Message = { role: "user" | "assistant"; content: string };

type Props = {
  unitContext: string;
  subjectName: string;
  unitTitle: string;
  onClose?: () => void;
};

const SUGGESTIONS = ["Explain this unit in simple words", "Give me an example", "Quiz me on the key terms"];

export default function ChatPanel({ unitContext, subjectName, unitTitle, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const question = (text ?? input).trim();
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
      <div className="flex items-start justify-between gap-2 border-b border-[var(--color-line)] py-2 pl-4 pr-2">
        <div className="py-1">
          <h2 className="text-sm font-medium text-[var(--color-ink)]">Ask about this unit</h2>
          <p className="text-xs text-[var(--color-ink-faint)]">
            Scoped to {unitTitle} — says so when a question is outside it.
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close assistant" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)]">
            <Close />
          </button>
        )}
      </div>

      <div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversation" className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div>
            <p className="text-sm text-[var(--color-ink-faint)]">
              Ask about a definition, an example, or one of the self-assessment questions.
            </p>
            <div className="mt-3 flex flex-col items-start gap-2">
              {SUGGESTIONS.map((q) => (
                <button key={q} onClick={() => send(q)} className="min-h-11 rounded-full border border-[var(--color-line-strong)] px-4 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-surface)]">
                  {q}
                </button>
              ))}
            </div>
          </div>
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
                  ? "ml-6 whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[var(--color-moss-soft)] px-3 py-2 text-sm text-[var(--color-ink)]"
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

      <div className="safe-bottom flex gap-2 border-t border-[var(--color-line)] px-3 pt-3">
        <label htmlFor="chat-input" className="sr-only">Your question</label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) send();
          }}
          placeholder="Ask a question…"
          enterKeyHint="send"
          className="min-w-0 flex-1 rounded-full border border-[var(--color-line-strong)] bg-[var(--color-surface-raised)] h-11 px-4 text-base"
        />
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => send()}
          disabled={loading || !input.trim()}
          aria-label="Send question"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-moss)] text-[var(--color-on-moss)] disabled:opacity-40"
        >
          <Send />
        </motion.button>
      </div>
    </div>
  );
}
