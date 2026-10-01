import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { useMemo } from "react";
import { Vector2 } from "three";
import { getQuality } from "@/lib/quality";
import { scrollState } from "@/lib/scroll-store";

/**
 * ---------------------------------------------------------------------------
 *  Post chain
 * ---------------------------------------------------------------------------
 *  Deliberately restrained, and each effect earns its place:
 *
 *  - **Bloom** carries the whole neon register. The rain is already dim by
 *    design (16-23% opacity behind a scrim), so it needs a low threshold to
 *    glow at all, which means bloom has to be gentle enough not to halo every
 *    column.
 *
 *  - **Chromatic aberration** is nearly zero. This was the single most-changed
 *    value in the whole project. Green rain across a full viewport plus CA
 *    produces muddy fringes rather than a lens effect, and the smear was tuned
 *    back twice before that was understood. Bloom does the glow work instead.
 *
 *  - **Noise** kills gradient banding in the dark field and gives the flat
 *    background a surface. At 8% it is felt rather than seen.
 *
 *  - **Vignette** holds the eye off the extreme edges, where the rain is
 *    densest and the content is thinnest.
 *
 *  `offset` is mutated in place: postprocessing stores the same object
 *  reference in its uniform map and re-uploads it every frame, so there is no
 *  setter, no ref and no per-frame allocation.
 * ---------------------------------------------------------------------------
 */
export function PostChain() {
  const quality = getQuality();

  const offset = useMemo(() => new Vector2(0.0001, 0.0001), []);

  useFrame(() => {
    const magnitude = 0.0001 + Math.min(scrollState.speed, 1) * 0.0006;
    offset.set(magnitude * (0.7 + Math.abs(scrollState.direction) * 0.3), magnitude);
  });

  if (!quality.postFx) return null;

  return (
    <EffectComposer multisampling={quality.tier === "high" ? 4 : 0}>
      <Bloom
        intensity={quality.bloom * 1.15}
        /* Low threshold on purpose. The rain is deliberately dim (its own
           opacity is capped well under 1) and the base is now near-black, so a
           high threshold made almost nothing reach the bloom pass and the green
           read as flat paint rather than as light.

           The kernel stays MEDIUM even at high tier. LARGE smeared the glow far
           enough sideways that a bright head leaked out of the open right-hand
           third and landed in the text column — measured, not assumed: it was
           the worst-frame contrast, not the typical frame, that failed. */
        luminanceThreshold={0.08}
        luminanceSmoothing={0.55}
        kernelSize={KernelSize.MEDIUM}
        mipmapBlur
      />
      <ChromaticAberration offset={offset} radialModulation modulationOffset={0.42} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.075} />
      <Vignette eskil={false} offset={0.3} darkness={0.6} />
    </EffectComposer>
  );
}
