// ---------------------------------------------------------------------------
//  Particle field — vertex
// ---------------------------------------------------------------------------
//  60k points, all animated on the GPU. Each particle is a cylindrical
//  coordinate drifting through a curl-ish noise field, so the CPU cost per
//  frame is a single uniform write regardless of particle count.
//
//  Scroll enters twice: `uScroll` (0..1 document progress) opens the field
//  outward and lifts it, `uVelocity` adds a tangential whip that decays to
//  zero on its own when the user stops. Nothing here reads from React.
// ---------------------------------------------------------------------------

attribute vec4 aSeed;   // x: angle, y: radius, z: height, w: random phase
attribute float aScale; // per-particle size multiplier

uniform float uTime;
uniform float uScroll;
uniform float uVelocity;
uniform float uSpeed;      // normalised 0..1
uniform float uPixelRatio;
uniform float uPointScale; // global size multiplier
uniform vec2  uPointer;    // world-space pointer, z unused
uniform float uPointerActive;
uniform float uSwirl;

varying float vDepth;
varying float vGlow;
varying float vSeed;

// Cheap curl-ish rotation: one simplex sample drives angular drift, a second
// drives vertical bob. Two samples is the sweet spot between cost and the
// "alive" feel — three is indistinguishable on screen.
float angularNoise(vec3 p) {
  return snoise(p);
}

void main() {
  float phase = aSeed.w;
  float radius = aSeed.y;
  float height = aSeed.z;

  // Domain-warped angle.
  float nAngle = angularNoise(vec3(phase * 31.4, uTime * 0.11, phase * 7.7));
  float nHeight = angularNoise(vec3(phase * 11.9 + 4.0, uTime * 0.07, 3.1));

  // Scroll pushes the ring outward and stretches it vertically: reading as
  // "the field is being pulled apart" rather than "the field is moving".
  float expand = 1.0 + uScroll * 0.85 + abs(uVelocity) * 0.0012;
  radius *= expand;

  float angle = aSeed.x + uTime * (0.045 + nAngle * 0.055) * (1.0 + uSwirl * 0.4)
    + uScroll * (0.55 + nAngle * 0.5);

  height += uScroll * 3.2 + uTime * (0.11 + nHeight * 0.16) + nAngle * 0.4;

  vec3 pos = vec3(cos(angle) * radius, height, sin(angle) * radius);

  // Tangential whip driven by scroll momentum.
  vec3 tangent = vec3(-sin(angle), 0.0, cos(angle));
  pos += tangent * uVelocity * 0.045;

  // Pointer repulsion — inverse square, clamped so it never explodes.
  vec2 toPointer = pos.xz - uPointer;
  float dist = length(toPointer);
  float influence = uPointerActive * (0.9 / (1.0 + dist * dist * 1.6));
  pos.xz += normalize(toPointer + 1e-5) * influence * 2.4;
  pos.y += influence * 0.6;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float distFromCamera = -mv.z;
  // Deliberately small. The field is depth behind text, not a bokeh layer —
  // at the previous size the nearest particles became soft discs a dozen pixels
  // across, which read as smudges and artefacts rather than as atmosphere.
  gl_PointSize = aScale * uPointScale * uPixelRatio * (7.0 / max(distFromCamera, 0.6));

  vDepth = clamp(1.0 - distFromCamera / 34.0, 0.0, 1.0);
  // Hotter where the field is compressed by scroll, cooler at the rim.
  vGlow = 0.28 + uSpeed * 0.6 + nAngle * 0.22 + uPointerActive * influence * 1.1;
  vSeed = phase;
}
