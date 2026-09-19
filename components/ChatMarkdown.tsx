import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// Assistant chat replies render through here so structure (lists, bold
// terms, code, tables) actually shows up instead of raw markdown
// characters. Kept deliberately plain - no big headings, matches the
// chat bubble's small, narrow footprint rather than the main reading view.
const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-[var(--color-ink)]">{children}</strong>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  code: ({ children, className }) => {
    const isBlock = Boolean(className); // block code gets a language className from remark; inline doesn't
    if (isBlock) {
      return <code className="font-mono text-[0.8em]">{children}</code>;
    }
    return (
      <code className="rounded bg-[var(--color-surface)] px-1 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-[var(--color-surface)] p-2.5 text-[var(--color-ink)] last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-[var(--color-line)]">{children}</thead>,
  th: ({ children }) => <th className="px-2 py-1 font-medium text-[var(--color-ink)]">{children}</th>,
  td: ({ children }) => (
    <td className="border-t border-[var(--color-line)] px-2 py-1 align-top">{children}</td>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-[var(--color-ochre)] underline">
      {children}
    </a>
  ),
};

export default function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
