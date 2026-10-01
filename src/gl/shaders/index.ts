import depthFrag from "./field.frag.glsl?raw";
import depthVert from "./field.vert.glsl?raw";
import lib from "./lib.glsl?raw";
import rainFrag from "./rain.frag.glsl?raw";
import rainVert from "./rain.vert.glsl?raw";

/**
 * Shaders are composed here rather than through a GLSL preprocessor plugin.
 * Vite's `?raw` import means there is no extra build step, no plugin version to
 * track, and the GLSL stays lintable and inspectable at the seam. The only cost
 * is one string concat per shader at module load.
 *
 * GLSL ES 1.00 (three.js `ShaderMaterial` default): `attribute` / `varying` /
 * `gl_FragColor`. Setting `glslVersion: GLSL3` would require rewriting every
 * declaration and buys nothing here.
 */
const preamble = lib;

export const depthVertexShader = `${preamble}\n${depthVert}`;
export const depthFragmentShader = `${preamble}\n${depthFrag}`;

/**
 * The rain is screen-space: its vertex stage bypasses every matrix, so the
 * fragment stage already runs in a flat 0..1 UV space with no world-space noise
 * to sample. It does still need `hash21` for per-column seeds and per-cell glyph
 * cycling, so the library is prepended here rather than duplicated in the
 * fragment source. Getting this wrong is silent — three.js fails the material,
 * logs to `console.error` and draws nothing, so the scene renders as an empty
 * black canvas with no exception anywhere in the stack.
 */
export const rainVertexShader = rainVert;
export const rainFragmentShader = `${preamble}\n${rainFrag}`;
