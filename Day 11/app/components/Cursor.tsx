"use client";

import { useEffect, useRef } from "react";

export function Cursor() {
  const ref = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const hovered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      hovered.current = !!t.closest("a, button, [data-cursor-hover]");
      el.style.transform = `translate3d(${current.current.x - 16}px, ${
        current.current.y - 16
      }px, 0) scale(${hovered.current ? 2.5 : 1})`;
    };

    let raf = 0;
    const tick = () => {
      const lerp = 0.18;
      current.current.x += (target.current.x - current.current.x) * lerp;
      current.current.y += (target.current.y - current.current.y) * lerp;
      el.style.transform = `translate3d(${current.current.x - 16}px, ${
        current.current.y - 16
      }px, 0) scale(${hovered.current ? 2.5 : 1})`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-8 w-8 rounded-full border border-black bg-white md:block"
      style={{
        mixBlendMode: "difference",
        transition: "transform 300ms var(--ease-studio)",
        willChange: "transform",
      }}
    />
  );
}
