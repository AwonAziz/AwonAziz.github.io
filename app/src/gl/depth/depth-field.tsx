import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  type IUniform,
  type Points,
  ShaderMaterial,
  Vector2,
} from "three";
import { pointer } from "@/lib/pointer";
import { getQuality } from "@/lib/quality";
import { scrollState } from "@/lib/scroll-store";
import { depthFragmentShader, depthVertexShader } from "../shaders";

/**
 * ---------------------------------------------------------------------------
 *  Depth field
 * ---------------------------------------------------------------------------
 *  Sits between the rain and the content as a parallax layer, and does two jobs
 *  that decoration cannot:
 *
 *    - It gives the rain something to fall *through*, which is the difference
 *      between "green text scrolling past" and an atmosphere with depth.
 *    - It is the only element that reacts to the pointer, so the page has a
 *      physical affordance without a custom cursor lying on top of the text.
 *
 *  All motion is computed in the vertex shader from per-particle seeds, so the
 *  per-frame CPU cost is a handful of uniform writes regardless of particle
 *  count. Doubling the budget costs GPU time rather than main-thread time, which
 *  is the right trade on a page where the main thread is also running GSAP and
 *  reconciling React.
 * ---------------------------------------------------------------------------
 */
interface DepthUniforms {
  [uniform: string]: IUniform;
  uTime: IUniform<number>;
  uScroll: IUniform<number>;
  uVelocity: IUniform<number>;
  uSpeed: IUniform<number>;
  uPixelRatio: IUniform<number>;
  uPointScale: IUniform<number>;
  uPointer: IUniform<Vector2>;
  uPointerActive: IUniform<number>;
  uColorLow: IUniform<Color>;
  uColorMid: IUniform<Color>;
  uColorHigh: IUniform<Color>;
  uOpacity: IUniform<number>;
}

export function DepthField() {
  const quality = getQuality();
  const pointsRef = useRef<Points>(null);

  const geometry = useMemo(() => {
    const count = quality.particles;
    const g = new BufferGeometry();

    // Cylindrical seeds. A ring distribution rather than a cube is what makes
    // the field read as a *structure* instead of as static.
    const seeds = new Float32Array(count * 4);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const o = i * 4;
      seeds[o] = Math.random() * Math.PI * 2; // angle
      // sqrt keeps areal density uniform. Without it the field has a visibly
      // dense core and a hollow rim, which reads as a sphere rather than a field.
      seeds[o + 1] = 1.4 + Math.sqrt(Math.random()) * 7.2; // radius
      seeds[o + 2] = (Math.random() - 0.5) * 11; // height
      seeds[o + 3] = Math.random(); // phase
      // Heavy-tailed size distribution: mostly small, a few larger anchors.
      // The tail is short on purpose — a long tail is what produced the
      // foreground bokeh discs.
      scales[i] = 0.35 + Math.random() ** 2.6 * 1.3;
    }

    g.setAttribute("position", new Float32BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aSeed", new Float32BufferAttribute(seeds, 4));
    g.setAttribute("aScale", new Float32BufferAttribute(scales, 1));
    return g;
  }, [quality.particles]);

  const uniforms = useMemo<DepthUniforms>(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uVelocity: { value: 0 },
      uSpeed: { value: 0 },
      uPixelRatio: { value: 1 },
      uPointScale: { value: 1 },
      uPointer: { value: new Vector2() },
      uPointerActive: { value: 0 },
      // One hue family, three values, all below the page accent. The field is depth,
      // not a colour source: it sits *under* the rain and the type, and a bright
      // particle competing with either of them is a particle doing the wrong job.
      uColorLow: { value: new Color("#0c2b21") },
      uColorMid: { value: new Color("#1f6b4d") },
      uColorHigh: { value: new Color("#4fb489") },
      uOpacity: { value: quality.tier === "low" ? 0.3 : 0.42 },
    }),
    [quality.tier],
  );

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: depthVertexShader,
        fragmentShader: depthFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms,
      }),
    [uniforms],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20); // clamp after a tab-switch stall

    uniforms.uTime.value += dt;
    uniforms.uScroll.value = scrollState.progress;
    uniforms.uVelocity.value = scrollState.velocity;
    uniforms.uSpeed.value = scrollState.speed;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    // Ease the pointer weight so the field does not snap when the pointer
    // enters or leaves the window.
    uniforms.uPointerActive.value +=
      (pointer.active - uniforms.uPointerActive.value) * Math.min(1, dt * 3.2);
    uniforms.uPointer.value.set(pointer.worldX, pointer.worldY);

    // A whisper of counter-rotation keeps the field alive when the page is idle.
    // A static background reads as a broken one, which is the fastest way to
    // make an expensive scene look cheap.
    if (pointsRef.current) pointsRef.current.rotation.y += dt * 0.01;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      // The field spans a tall volume; culling would pop the whole thing out
      // whenever the camera swung past the uncomputed bounding sphere.
      frustumCulled={false}
      renderOrder={-50}
    />
  );
}
