"use client";

import { Plus } from "lucide-react";

export function NavHeader() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6"
      style={{ mixBlendMode: "difference" }}
    >
      <a
        href="/"
        className="text-white text-2xl font-bold tracking-tighter lowercase"
      >
        mc
      </a>
      <button
        aria-label="Menu"
        className="text-white h-10 w-10 flex items-center justify-center"
      >
        <Plus size={24} strokeWidth={1.5} />
      </button>
    </header>
  );
}
