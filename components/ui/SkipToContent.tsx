/**
 * Skip-to-content link — the first focusable element on every page (00_global.md §12).
 * Visually hidden until focused; jumps the user past the global header to #content.
 */
export function SkipToContent({ targetId = "content" }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="wheels-skip-link">
      Skip to content
    </a>
  );
}
