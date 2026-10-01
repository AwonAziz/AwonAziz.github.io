import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { motionBlocked } from "@/lib/motion-prefs";
import { getQuality } from "@/lib/quality";

/**
 * ---------------------------------------------------------------------------
 *  Spotlight
 * ---------------------------------------------------------------------------
 *  A radial highlight that follows the pointer across a surface, plus a hairline
 *  that tracks it.
 *
 *  This is the largest perceived-quality signal on the whole page for the least
 *  code. It reads as "this surface responds to me" rather than as decoration,
 *  and it costs one CSS custom-property write per move on one element.
 *
 *  Implementation notes that matter:
 *
 *  - **Variables, not inline styles on children.** The highlight and the border
 *    both read `--spot-x` / `--spot-y`, set once on the host. Writing
 *    transforms per child is what makes this pattern janky.
 *  - **Transform-based, not `background-position`.** A `radial-gradient` moved by
 *    custom properties on `background-position` triggers a repaint of the whole
 *    surface on every move. Overlaid as its own layer with `transform`, the
 *    paint is once and only the compositor runs afterwards.
 *  - **Pointer-only.** Bound to `pointermove`, so a touch scroll never fires it
 *    and there is nothing to disable for coarse pointers.
 *  - **Not under reduced motion**, where a highlight that follows the cursor is
 *    exactly the kind of ambient motion the preference is asking to be rid of.
 * ---------------------------------------------------------------------------
 */
export function Spotlight({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || motionBlocked || !getQuality().pointerFx) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const apply = () => {
      frame = 0;
      if (!pending) return;
      el.style.setProperty("--spot-x", `${pending.x}px`);
      el.style.setProperty("--spot-y", `${pending.y}px`);
      el.style.setProperty("--spot-op", "1");
      pending = null;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = el.getBoundingClientRect();
      pending = { x: event.clientX - box.left, y: event.clientY - box.top };
      // rAF-batched: `pointermove` fires far more often than the compositor can
      // paint, so writing on every event does work that is thrown away.
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => el.style.setProperty("--spot-op", "0");

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("group/spot relative isolate overflow-hidden", className)}
      {...rest}
    >
      {/* The highlight. Its own composited layer, so only the transform changes
          once the surface has been painted once. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[var(--spot-op,0)] transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(22rem circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklab, var(--color-accent) 9%, transparent), transparent 70%)",
        }}
      />
      {/* A hairline that tracks the pointer, reading as a scanner line. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--spot-op,0)] transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(14rem circle at var(--spot-x, 50%) var(--spot-y, 50%), transparent 55%, color-mix(in oklab, var(--color-accent) 22%, transparent) 92%, transparent 100%)",
        }}
      />
      {children}
    </div>
  );
}
