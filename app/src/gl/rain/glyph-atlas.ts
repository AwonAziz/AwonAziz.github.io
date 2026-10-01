import { CanvasTexture, ClampToEdgeWrapping, LinearFilter, SRGBColorSpace } from "three";

/**
 * ---------------------------------------------------------------------------
 *  Glyph atlas
 * ---------------------------------------------------------------------------
 *  The rain needs *real characters* on screen. Procedural noise only resembles
 *  the effect; a reviewer who has seen the film spots the difference instantly,
 *  and so does everyone else.
 *
 *  The reference implementation (Rezmason/matrix, 3.8k stars) ships an MSDF atlas
 *  pre-generated from a font recovered out of an Atari promotional SWF for
 *  *The Matrix: Path of the Neo*. MSDF is the right call in general — crisp at
 *  any DPR for one 3-channel texture fetch — but it needs a native `msdfgen`
 *  binary at build time, and that is not a dependency worth taking on for a
 *  background that sits behind a scrim at 16% opacity.
 *
 *  A runtime-rasterised bitmap atlas is the correct trade here:
 *    - no build step, no native binary, no new dependency
 *    - the atlas is sampled once per fragment, same as MSDF
 *    - cell size is known exactly at build time, so the raster size can be
 *      matched to the on-screen cell — which is the only case where a bitmap
 *      atlas blurs, and it does not apply
 *
 *  The glyph set is halfwidth katakana plus digits: the recognised shorthand for
 *  the effect. Notably it is NOT Latin alphanumerics — the eye reads Latin as
 *  "text I should be trying to read", which fights the actual content. Katakana
 *  reads as texture.
 */

/** Halfwidth katakana, digits, and a few technical marks for surface variation. */
const KATAKANA = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
const DIGITS = "0123456789";
const MARKS = "Z:<>=+*-_/\\|[]{}";

const ATLAS_COLUMNS = 16;
const ATLAS_ROWS = 8;
const CELL = 64;

/**
 * Detects whether the platform can actually draw halfwidth katakana.
 *
 * This matters more than it sounds. A headless Linux container, a locked-down
 * enterprise Windows image or a browser without a CJK font renders every
 * glyph as tofu — a row of identical empty boxes — which looks like a bug far
 * more obviously than a subtle blur would. The probe measures the advance
 * width of a real katakana character against a private-use codepoint that no
 * font implements; if they are identical, the fallback glyph is being used.
 */
function supportsKatakana(context: CanvasRenderingContext2D): boolean {
  context.font = `32px "JetBrains Mono", monospace`;
  const reference = context.measureText("\uFFFD").width;
  const katakana = context.measureText("ｱ").width;
  // A real glyph has its own advance; tofu renders at the notdef width.
  return katakana > 0 && Math.abs(katakana - reference) > 0.5;
}

/**
 * Builds the atlas once, on the client, and reuses it for the life of the page.
 *
 * The glyph count travels with the texture rather than being recomputed
 * separately: the charset actually drawn depends on the katakana probe, so
 * anything that re-derives it independently is a second source of truth waiting
 * to disagree with the first.
 */
let cached: GlyphAtlasData | null = null;

export interface GlyphAtlasData {
  texture: CanvasTexture;
  /** How many cells of the atlas are populated. */
  count: number;
  /** True when the halfwidth-katakana set was used. */
  katakana: boolean;
}

export function getGlyphAtlas(): GlyphAtlasData | null {
  if (cached) return cached;
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_COLUMNS * CELL;
  canvas.height = ATLAS_ROWS * CELL;

  const context = canvas.getContext("2d", { willReadFrequently: false });
  if (!context) return null;

  const hasKatakana = supportsKatakana(context);
  const charset = hasKatakana
    ? `${KATAKANA}${DIGITS}${MARKS}`
    : `${DIGITS}ABCDEFGHIJKLMNOPQRSTUVWXYZ${MARKS}`;
  const count = Math.min(charset.length, ATLAS_COLUMNS * ATLAS_ROWS);

  // Monospace at ~72% of the cell leaves room for the glyph's own side
  // bearings, so adjacent cells never bleed into each other when sampled.
  const fontSize = Math.round(CELL * 0.72);
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `${fontSize}px "JetBrains Mono", "MS Gothic", "Osaka-Mono", monospace`;

  for (let i = 0; i < count; i += 1) {
    const column = i % ATLAS_COLUMNS;
    const row = Math.floor(i / ATLAS_COLUMNS);
    context.fillText(charset.charAt(i), column * CELL + CELL / 2, row * CELL + CELL / 2);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  // Linear filtering, clamped. Nearest would make the glyphs visibly blocky at
  // low resolution; the atlas is drawn white-on-black so there is no hue to
  // shift at the edges.
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  cached = { texture, count, katakana: hasKatakana };
  return cached;
}

export const ATLAS_LAYOUT = {
  columns: ATLAS_COLUMNS,
  rows: ATLAS_ROWS,
  cell: CELL,
} as const;
