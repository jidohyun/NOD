"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MARKDOWN_COMPONENTS: NonNullable<React.ComponentProps<typeof ReactMarkdown>["components"]> = {
  h1: ({ children }) => <h3 className="mt-4 first:mt-0 text-base font-semibold">{children}</h3>,
  h2: ({ children }) => <h4 className="mt-3 first:mt-0 text-sm font-semibold">{children}</h4>,
  h3: ({ children }) => <h5 className="mt-3 first:mt-0 text-sm font-semibold">{children}</h5>,
  p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
  ul: ({ children }) => <ul className="mt-2 list-disc pl-5 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal pl-5 space-y-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-3 border-l-2 pl-3 text-muted-foreground">{children}</blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mt-3 overflow-x-auto rounded bg-muted p-3 text-xs">{children}</pre>
  ),
};

export function ArticleMarkdownNote({ markdownNote }: { markdownNote: string }) {
  const normalized = markdownNote.replace(/\\n/g, "\n");
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
