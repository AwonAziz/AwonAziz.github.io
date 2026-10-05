/**
 * ---------------------------------------------------------------------------
 *  System mark
 * ---------------------------------------------------------------------------
 *  A small, deterministic glyph derived from a system's slug, so each case study
 *  is visually identifiable in a browser tab, a bookmark bar, a screenshot or a
 *  link preview — anywhere the page itself is not on screen to be recognised.
 *
 *  It is derived, not drawn. The same rules the config uses to decide that a
 *  number has to be checkable apply here: the mark is a pure function of the
 *  slug, so it cannot drift from the system it belongs to, and two slugs cannot
 *  collide without the collision being visible on the index page. That is the
 *  line between a signature and an ornament.
 *
 *  FNV-1a rather than `hashCode()` or a random seed: it is four lines, it is
 *  stable across engines and versions, and unlike `String.prototype.hashCode` it
 *  does not depend on a host-defined algorithm. The avalanche is better than it
 *  needs to be for 32 bits, which is the point — adjacent slugs should not
 *  produce adjacent patterns.
 *
 *  Drawn in `currentColor` so it inherits the live accent and needs no second
 *  palette, and sized in `em` so it scales with whatever it sits inside.
 * ---------------------------------------------------------------------------
 */

/** FNV-1a, 32-bit. */
function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    // `Math.imul` keeps the multiply in 32-bit space; `hash * 16777619` would
    // silently become a float above 2^53 and lose the low bits that carry the
    // avalanche.
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const SIZE = 7;

export interface SystemMarkProps {
  slug: string;
  className?: string;
}

/**
 * `aria-hidden` unconditionally.
 *
 * The mark is a redundant encoding of a link that is already labelled with the
 * system's title. Announcing it would mean a screen-reader user hears the same
 * information twice per project, in a different form, with no additional
 * meaning — and the pattern itself is meaningless without the colour, which
 * assistive technology does not convey.
 */
export function SystemMark({ slug, className }: SystemMarkProps) {
  const seed = fnv1a(slug);

  // A flat bitfield, then read one bit per cell. 49 cells is more than 32 bits,
  // so the field is extended by a second mixed round rather than wrapping — a
  // wrap would mirror the pattern onto itself and make it visibly symmetric.
  const bits: boolean[] = [];
  let state = seed;
  while (bits.length < SIZE * SIZE) {
    for (let bit = 0; bit < 32 && bits.length < SIZE * SIZE; bit += 1) {
      bits.push(((state >>> bit) & 1) === 1);
    }
    if (bits.length < SIZE * SIZE) state = fnv1a(`${slug}:${bits.length}`);
  }

  const cells = bits.map((on, index) => {
    const x = index % SIZE;
    const y = (index - x) / SIZE;

    // One in nine is promoted to the full accent and slightly enlarged, so the
    // mark has a focal cell rather than reading as uniform noise. Which cell is
    // promoted is derived, not chosen.
    const focus = (state >>> 8) % 9 === 0;

    return (
      <rect
        key={`${x}-${y}`}
        x={x + 0.12}
        y={y + 0.12}
        width={0.76}
        height={0.76}
        rx={0.16}
        fill="currentColor"
        opacity={on ? (focus ? 0.95 : 0.34) : 0.07}
      />
    );
  });

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      style={{ display: "block", width: "1em", height: "1em" }}
    >
      {cells}
    </svg>
  );
}
