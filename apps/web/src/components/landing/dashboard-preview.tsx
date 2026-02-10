"use client";

import Image from "next/image";
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-nod-gold/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="reveal relative rounded-2xl border border-white/[0.08] bg-[#0A0A0B] overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/[0.05] group">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
            </div>
            <div className="flex-1 flex justify-center px-4">
              <div className="flex items-center gap-2 bg-black/40 rounded-lg border border-white/[0.04] px-4 py-1.5 max-w-md w-full transition-colors group-hover:border-white/[0.08]">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <span className="text-[11px] text-white/40 font-mono tracking-wide">
                  app.nod.dev/articles
                </span>
              </div>
            </div>
            <div className="w-16" />
          </div>

          {/* Dashboard mockup */}
          <div className="p-6 lg:p-10 min-h-[400px] lg:min-h-[500px] bg-gradient-to-b from-[#0D0D0F] to-[#0A0A0B]">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 overflow-hidden rounded-lg border border-nod-gold/20 shadow-lg shadow-nod-gold/20">
                  <Image
                    src="/brand/nod-icon.png"
                    alt="NOD icon"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-white/80 font-medium leading-none">
                    Saved reads
                  </span>
                  <span className="text-[10px] text-white/35 font-mono leading-none">42 items</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 h-9 w-44 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  <span className="text-[11px] text-white/35 font-mono">Search: RSC</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-nod-gold/15 border border-nod-gold/25 flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-nod-gold">MP</span>
                </div>
              </div>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
              ].map((article, _i) => (
                <div
                  key={article.title}
                  className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6 hover:border-nod-gold/20 hover:bg-white/[0.04] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        article.status === "completed"
                          ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]"
                          : "bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                      }`}
                    />
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider font-medium">
                      {article.status}
                    </span>
                  </div>
                  <h4 className="text-[15px] font-medium text-white/90 mb-3 leading-snug">
                    {article.title}
                  </h4>
                  <p className="text-[13px] leading-relaxed text-white/40 line-clamp-3 mb-5">
                    {article.summary}
                  </p>
                  {/* Concept tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {article.concepts.map((concept) => (
                      <span
                        key={concept}
                        className="inline-block px-2.5 py-1 rounded-md bg-nod-gold/[0.08] border border-nod-gold/10 text-[10px] text-nod-gold/80 font-mono font-medium"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Similar articles section */}
            <div className="mt-8 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                </div>
                <span className="font-mono text-[11px] text-white/40 uppercase tracking-wider font-medium">
                  Similar reads
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  "React Patterns Deep Dive",
                  "Next.js 16 Migration Guide",
                  "TypeScript 5.9 Features",
                  "Edge Computing Primer",
                ].map((title) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-xl bg-black/20 border border-white/[0.04] px-4 py-3 hover:border-white/[0.1] hover:bg-white/[0.03] transition-colors cursor-pointer group/item"
                  >
                    <div className="w-1 h-8 rounded-full bg-violet-500/30 group-hover/item:bg-violet-500/50 transition-colors" />
                    <span className="text-[12px] text-white/50 group-hover/item:text-white/80 transition-colors font-medium">
                      {title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Glow effect at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-nod-gold/30 to-transparent blur-[1px]" />
        </div>
      </div>
    </section>
  );
}
