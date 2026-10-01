// ---------------------------------------------------------------------------
//  Particle field — fragment
// ---------------------------------------------------------------------------
//  Additively blended soft discs. The ramp runs violet → cyan → acid so the
//  field has a legible cool-to-hot axis tied to scroll speed, which reads as
//  "energy" without needing a colour picker.
// ---------------------------------------------------------------------------

varying float vDepth;
varying float vGlow;
varying float vSeed;

uniform vec3 uColorLow;
uniform vec3 uColorMid;
uniform vec3 uColorHigh;
uniform float uOpacity;

void main() {
  // Signed distance to the point sprite's edge, anti-aliased by the derivative
  // so points stay crisp at any DPR.
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float alpha = 1.0 - smoothstep(0.18, 0.5, d);
  if (alpha < 0.002) discard;

  float t = clamp(vGlow, 0.0, 1.0);
  vec3 color = mix(uColorLow, uColorMid, smoothstep(0.0, 0.55, t));
  color = mix(color, uColorHigh, smoothstep(0.55, 1.0, t));

  // Depth falloff keeps the far side of the field from turning into fog.
  float depthFade = smoothstep(0.0, 0.35, vDepth);
  // A few particles get a per-point twinkle so the field isn't uniform.
  float twinkle = 0.75 + 0.25 * sin(vSeed * 120.0);

  gl_FragColor = vec4(color * (0.55 + t * 1.35), alpha * depthFade * uOpacity * twinkle);
}
