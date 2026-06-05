import { cn } from "@/lib/utils";

/**
 * Skip-to-content link — the first focusable element on every page (00_global.md §12).
 * Visually hidden until keyboard focus; jumps past the global header to #content.
 */
export function SkipToContent({ targetId = "content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "skip-to-content",
        "label-md fixed top-4 left-4 z-[100] rounded-pill bg-ink-100 px-4 py-3 text-paper no-underline",
        "pointer-events-none -translate-y-[calc(100%+2rem)] opacity-0",
        "transition-[transform,opacity] duration-150 motion-reduce:transition-none",
        "focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-ink-100",
      )}
    >
      Skip to content
    </a>
  );
}
