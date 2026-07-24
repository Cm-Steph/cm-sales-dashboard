"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  /**
   * Which edge of the icon the tooltip box hangs from. "start" (default)
   * extends rightward -- use for things near the left edge of the screen.
   * "end" extends leftward -- use for things near the right edge (e.g.
   * right-aligned table columns), so the box never runs off-screen.
   */
  align?: "start" | "end";
}

// Click/tap-to-toggle rather than CSS hover -- hover (and even
// focus-within on a non-native-focusable element) doesn't reliably fire
// on tap across mobile browsers, which is why this was reported as
// showing "no info" on a phone.
export function InfoTooltip({ text, align = "start" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleOutside(event: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-1 inline-flex h-3.5 w-3.5 shrink-0 cursor-help items-center justify-center rounded-full border border-zinc-400 text-[9px] font-bold leading-none text-zinc-500 outline-none hover:border-brand-violet hover:text-brand-violet focus-visible:border-brand-violet focus-visible:text-brand-violet"
        aria-label={text}
        aria-expanded={open}
      >
        i
      </button>
      {open && (
        <span
          className={`absolute bottom-full z-20 mb-2 w-52 rounded-md bg-brand-ink px-2.5 py-1.5 text-left text-xs font-normal normal-case text-white shadow-lg ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
