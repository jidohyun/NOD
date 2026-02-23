"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

export function LandingSvgAutoCursor() {
  const cursorRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const cursor = cursorRef.current;
      if (!cursor) {
        return;
      }

      if (
        window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      const moveX = gsap.quickTo(cursor, "x", { duration: 0.22, ease: "power3.out" });
      const moveY = gsap.quickTo(cursor, "y", { duration: 0.22, ease: "power3.out" });

      const onMove = (event: MouseEvent) => {
        moveX(event.clientX - 20);
        moveY(event.clientY - 20);
      };

      const onHover = () => {
        gsap.to(cursor, { scale: 1.35, duration: 0.18, ease: "power2.out" });
      };

      const onLeave = () => {
        gsap.to(cursor, { scale: 1, duration: 0.22, ease: "power2.out" });
      };

      const hoverTargets = document.querySelectorAll("a, button, [data-cursor-target]");

      window.addEventListener("mousemove", onMove, { passive: true });
      hoverTargets.forEach((target) => {
        target.addEventListener("mouseenter", onHover);
        target.addEventListener("mouseleave", onLeave);
      });

      return () => {
        window.removeEventListener("mousemove", onMove);
        hoverTargets.forEach((target) => {
          target.removeEventListener("mouseenter", onHover);
          target.removeEventListener("mouseleave", onLeave);
        });
      };
    },
    { scope: cursorRef }
  );

  return (
    <svg
      ref={cursorRef}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className="pointer-events-none fixed left-0 top-0 z-[80] hidden mix-blend-screen md:block"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="cursorPulse" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(232,185,49,0.85)" />
          <stop offset="70%" stopColor="rgba(232,185,49,0.2)" />
          <stop offset="100%" stopColor="rgba(232,185,49,0)" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#cursorPulse)" />
      <circle cx="20" cy="20" r="5.5" fill="rgba(232,185,49,0.95)" />
      <circle cx="20" cy="20" r="10" fill="none" stroke="rgba(232,185,49,0.75)" strokeWidth="1" />
    </svg>
  );
}
