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

export function InfoTooltip({ text, align = "start" }: Props) {
  return (
    <span className="group relative inline-flex items-center">
      <span
        tabIndex={0}
        className="ml-1 inline-flex h-3.5 w-3.5 shrink-0 cursor-help items-center justify-center rounded-full border border-zinc-400 text-[9px] font-bold leading-none text-zinc-500 outline-none hover:border-brand-violet hover:text-brand-violet focus-visible:border-brand-violet focus-visible:text-brand-violet"
        aria-label={text}
      >
        i
      </span>
      <span
        className={`pointer-events-none absolute bottom-full z-20 mb-2 w-52 rounded-md bg-brand-ink px-2.5 py-1.5 text-left text-xs font-normal normal-case text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${
          align === "end" ? "right-0" : "left-0"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
