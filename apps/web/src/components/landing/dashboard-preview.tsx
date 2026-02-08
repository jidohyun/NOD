"use client";

import { useEffect, useRef } from "react";

export function DashboardPreview() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        }
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll(".reveal");
    elements?.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-nod-surface py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="reveal relative rounded-2xl border border-nod-border/60 bg-nod-surface-raised overflow-hidden shadow-2xl shadow-black/40">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-nod-border/40 bg-[#0D0D0F]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2 bg-white/[0.03] rounded-md px-4 py-1 max-w-xs w-full">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                <span className="text-[11px] text-white/25 font-mono">app.nod.dev/articles</span>
              </div>
            </div>
            <div className="w-16" />
          </div>

          {/* Dashboard mockup */}
          <div className="p-6 lg:p-8 min-h-[400px] lg:min-h-[500px]">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-sm bg-nod-gold/80 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-[#0A0A0B]">N</span>
                </div>
                <div className="h-4 w-24 rounded bg-white/[0.06]" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-28 rounded-md bg-white/[0.04] border border-white/[0.06]" />
                <div className="h-7 w-7 rounded-full bg-nod-gold/20" />
              </div>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Article cards */}
              {[
                {
                  title: "Understanding React Server Components",
                  status: "completed",
                  summary:
                    "RSC enables streaming UI with server-rendered components while keeping interactivity where it matters.",
                  concepts: ["React", "RSC", "Streaming"],
                },
                {
                  title: "Vector Databases Explained",
                  status: "completed",
                  summary:
                    "Embeddings turn text into vectors; similarity search retrieves related notes beyond exact keywords.",
                  concepts: ["pgvector", "Embeddings", "Cosine"],
                },
                {
                  title: "Building with FastAPI",
                  status: "analyzing",
                  summary:
                    "Learn ASGI fundamentals, dependency injection patterns, and how to ship typed APIs quickly.",
                  concepts: ["Python", "ASGI"],
                },
              ].map((article) => (
                <div
                  key={article.title}
                  className="rounded-xl border border-nod-border/40 bg-[#0D0D0F] p-5 hover:border-nod-gold/10 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        article.status === "completed"
                          ? "bg-emerald-400"
                          : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    <span className="font-mono text-[10px] text-white/25 uppercase tracking-wider">
                      {article.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-white/80 mb-3 leading-snug">
                    {article.title}
                  </h4>
                  <p className="text-[12px] leading-relaxed text-white/35 line-clamp-3 mb-4">
                    {article.summary}
                  </p>
                  {/* Concept tags */}
                  <div className="flex flex-wrap gap-1">
                    {article.concepts.map((concept) => (
                      <span
                        key={concept}
                        className="inline-block px-2 py-0.5 rounded-full bg-nod-gold/[0.06] border border-nod-gold/10 text-[10px] text-nod-gold/70 font-mono"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Similar articles section */}
            <div className="mt-6 rounded-xl border border-nod-border/40 bg-[#0D0D0F] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-violet-400/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60" />
                </div>
                <span className="font-mono text-[11px] text-white/30 uppercase tracking-wider">
                  Similar reads
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  "React Patterns Deep Dive",
                  "Next.js 16 Migration Guide",
                  "TypeScript 5.9 Features",
                  "Edge Computing Primer",
                ].map((title) => (
                  <div
                    key={title}
                    className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2"
                  >
                    <div className="w-1 h-6 rounded-full bg-violet-400/30" />
                    <span className="text-[12px] text-white/40">{title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Glow effect at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-nod-gold/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}
