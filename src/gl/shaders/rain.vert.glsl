precision highp float;

varying vec2 vUv;

/**
 * Screen-space quad.
 *
 * The vertex stage ignores every matrix and writes clip coordinates directly.
 * That is what lets the rain live inside the *existing* perspective camera as a
 * single quad with `frustumCulled={false}` — no second render pass, no second
 * WebGL context, no per-frame CPU work. `PlaneGeometry(2, 2)` covers the whole
 * NDC range; `z = 1.0` puts it on the far plane, which is irrelevant because the
 * material disables depth testing and draws at `renderOrder = -100`.
 */
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}