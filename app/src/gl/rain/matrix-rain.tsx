import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  Color,
  type IUniform,
  ShaderMaterial,
  type Texture,
  Vector2,
} from "three";
import { getQuality } from "@/lib/quality";
import { scrollState } from "@/lib/scroll-store";
import { rainFragmentShader, rainVertexShader } from "../shaders";
import { ATLAS_LAYOUT, getGlyphAtlas } from "./glyph-atlas";

/**
 * ---------------------------------------------------------------------------
 *  Matrix digital rain
 * ---------------------------------------------------------------------------
 *  Runs inside the *existing* perspective camera as a single screen-space quad.
 *  No second WebGL context, no second render pass, and the per-frame CPU cost is
 *  a handful of uniform writes — which keeps it off the INP path entirely,
 *  because GPU fill does not block input.
 *
 *  Three things make this effect hostile to a page that has to be *read*, and
 *  all three are handled explicitly rather than by dimming the effect and
 *  hoping:
 *
 *   1. **Peak brightness is capped.** The rain sits at 16-23% opacity behind a
 *      legibility scrim. The glyphs are decorative and are explicitly exempt
 *      from WCAG 1.4.3; the body copy is not, and 1.4.3 measures contrast against
 *      "the background behind the text" — which here is a moving target.
 *
 *   2. **The text region is unconditionally legible, not conditionally.** Every
 *      section carries its own scrim, so contrast does not depend on whether a
 *      bright head happens to be passing behind a word. That is the difference
 *      between meeting 1.4.3 and usually meeting it.
 *
 *   3. **There is a pause control and a frozen reduced-motion state.** A looping
 *      background animation running alongside other content is a WCAG 2.2.2
 *      Level A exposure, and pause-on-hover does *not* satisfy the criterion.
 *      Reduced motion freezes one frame rather than blanking the canvas, because
 *      a static rain field still reads as intentional while an empty black
 *      canvas reads as broken.
 * ---------------------------------------------------------------------------
 */

interface RainUniforms {
  [uniform: string]: IUniform;
  uTime: IUniform<number>;
  uGrid: IUniform<Vector2>;
  uAtlasGrid: IUniform<Vector2>;
  uGlyphCount: IUniform<number>;
  uFallSpeed: IUniform<number>;
  uTrailLength: IUniform<number>;
  uCycleRate: IUniform<number>;
  uOpacity: IUniform<number>;
  uHeadBoost: IUniform<number>;
  uDither: IUniform<number>;
  uFrozen: IUniform<number>;
  uScroll: IUniform<number>;
  uVelocity: IUniform<number>;
  uColorHead: IUniform<Color>;
  uColorTail: IUniform<Color>;
  uAtlas: IUniform<Texture | undefined>;
}

/**
 * A fixed, pleasant-looking phase for the frozen frame. Chosen so the columns
 * are staggered rather than synchronised — a static field with every head at the
 * same row reads as a broken shader rather than a paused one.
 */
const FROZEN_TIME = 137.4;

export function MatrixRain({
  paused = false,
  reduced = false,
}: {
  /** User-facing pause control (WCAG 2.2.2). */
  paused?: boolean;
  /** `prefers-reduced-motion`. Freezes rather than blanks. */
  reduced?: boolean;
}) {
  const quality = getQuality();
  const size = useThree((state) => state.size);
  const atlas = useMemo(() => getGlyphAtlas(), []);

  const uniforms = useMemo<RainUniforms>(
    () => ({
      uTime: { value: 0 },
      uGrid: { value: new Vector2(80, 40) },
      uAtlasGrid: { value: new Vector2(ATLAS_LAYOUT.columns, ATLAS_LAYOUT.rows) },
      uGlyphCount: { value: atlas?.count ?? 0 },
      // Long trails. A short trail reads as a scatter of characters with a
      // brighter one somewhere; the trail is what makes it rain.
      uFallSpeed: { value: 0.42 },
      uTrailLength: { value: 14 },
      // ~1 glyph change every three seconds per cell, unsynchronised. Faster
      // cycling reads as static rather than as falling text.
      uCycleRate: { value: 0.34 },
      uOpacity: { value: quality.rainOpacity },
      uHeadBoost: { value: 1 },
      uDither: { value: 0.045 },
      uFrozen: { value: 0 },
      uScroll: { value: 0 },
      uVelocity: { value: 0 },
      // Head near-white, trail a saturated phosphor. The head being the only
      // near-white cell is what makes the effect read as light through a medium
      // rather than as green noise.
      uColorHead: { value: new Color("#f2fff8") },
      uColorTail: { value: new Color("#1aff8c") },
      uAtlas: { value: atlas?.texture },
    }),
    [atlas, quality.rainOpacity],
  );

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: rainVertexShader,
        fragmentShader: rainFragmentShader,
        uniforms,
        transparent: true,
        // Additive (`one` / `one`) is what makes glyphs accumulate into light
        // rather than stack into mud where columns overlap.
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      }),
    [uniforms],
  );

  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );

  // Grid recomputed on resize only. Cell height is fixed in CSS pixels so the
  // glyphs keep a constant size regardless of viewport, and a wider screen just
  // gets more columns.
  useEffect(() => {
    const columns = Math.max(12, Math.round(size.width / quality.rainCell));
    const rows = Math.max(8, Math.round(size.height / (quality.rainCell * 1.15)));
    uniforms.uGrid.value.set(columns, rows);
    uniforms.uOpacity.value = quality.rainOpacity;
  }, [size.width, size.height, quality.rainCell, quality.rainOpacity, uniforms]);

  useEffect(() => {
    uniforms.uGlyphCount.value = atlas?.count ?? 0;
  }, [atlas, uniforms]);

  useFrame((_state, delta) => {
    const frozen = reduced || paused;

    uniforms.uFrozen.value = frozen ? 1 : 0;
    uniforms.uScroll.value = scrollState.progress;
    uniforms.uVelocity.value = Math.min(Math.abs(scrollState.velocity) / 24, 1);

    if (frozen) {
      // Hold one deterministic frame. Still rendered, still on-brand, inert.
      uniforms.uTime.value = FROZEN_TIME;
      return;
    }

    // Clamped after a tab-switch stall, so returning to the tab does not
    // teleport the rain forward by however long the user was away.
    uniforms.uTime.value += Math.min(delta, 1 / 20);
  });

  // No atlas, so no WebGL, so render nothing rather than a broken quad.
  if (!atlas) return null;

  return (
    <mesh material={material} frustumCulled={false} renderOrder={-100} name="matrix-rain">
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
