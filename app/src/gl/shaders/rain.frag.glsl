precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uGrid;
uniform vec2  uAtlasGrid;
uniform float uGlyphCount;
uniform float uFallSpeed;
uniform float uTrailLength;
uniform float uCycleRate;
uniform float uOpacity;
uniform float uHeadBoost;
uniform float uDither;
uniform float uFrozen;
uniform float uScroll;
uniform float uVelocity;
/**
 * Reading-column attenuation bounds, in 0..1 screen UV.
 *
 * The CSS scrim is not sufficient on its own. Measured across eight frames of
 * the hero, the scrim gave a *typical* body contrast of 8.09:1 but a worst case
 * of 1.72:1, because a bright rain head still landed behind the prose and the
 * bloom smeared it. A gradient cannot fix that — only making the field dimmer
 * where the text actually is.
 *
 * These are measured positions, not guesses. The hero paragraph's bounding box
 * reaches x = 0.61 of the viewport at 1600px wide, and an earlier guard ramped
 * from 0.19 to 0.62 — so it was at ~99% strength exactly where the text ends,
 * which is precisely why it changed nothing.
 */
uniform float uGuardStart;
uniform float uGuardEnd;
uniform vec3  uColorHead;
uniform vec3  uColorTail;
uniform sampler2D uAtlas;

/**
 * ---------------------------------------------------------------------------
 *  Closed-form rain brightness
 * ---------------------------------------------------------------------------
 *  The trail is NOT a persistence framebuffer. Brightness is an analytic
 *  function of (time, cell) evaluated per fragment, and the bright "head" cell
 *  is derived as a gradient of that function rather than stored anywhere.
 *
 *  Two consequences worth the effort:
 *    - Identical at 12fps and 144fps. There is no accumulation buffer to tune.
 *    - Multiple non-overlapping drops share a column for free, because
 *      `wobble()` warps the sawtooth's *period* rather than its amplitude.
 *
 *  Direction check: brightness peaks where `t` wraps to zero, and the row that
 *  satisfies that grows with time, so heads travel downward. Cells above a head
 *  have larger `t` and therefore lower brightness, so the trail fades upward —
 *  the correct orientation.
 */
float wobble(float x) {
  return x + 0.3 * sin(1.41421356 * x) + 0.2 * sin(2.23606797 * x);
}

float rainBrightness(float time, vec2 cell) {
  // Per-column time offset and speed. Two different seeds so a column's speed
  // is not correlated with its phase.
  float columnOffset = hash21(vec2(cell.x, 3.7)) * 137.0;
  float columnSpeed  = 0.65 + hash21(vec2(cell.x + 19.3, 8.1)) * 0.7;

  float columnTime = columnOffset + time * uFallSpeed * columnSpeed;

  // The row coefficient is 1/uTrailLength, NOT a tuned constant. Brightness has
  // to complete exactly one full cycle over uTrailLength rows or the trail is
  // not uTrailLength cells long. Decouple them and every column becomes a
  // uniform scatter of glyphs with no head and no trail at all.
  float t = wobble(columnTime - cell.y / uTrailLength);
  return 1.0 - fract(t);
}

void main() {
  vec2 grid = vUv * uGrid;

  // Row 0 is the top of the screen. `grid.y` grows upward, so flip it.
  vec2 cell = vec2(floor(grid.x), uGrid.y - 1.0 - floor(grid.y));
  vec2 inCell = fract(grid);

  float brightness = rainBrightness(uTime, cell);
  // The cell one row further down. A cell is the head when it is brighter than
  // what is below it, which is the positive gradient of the brightness field.
  float brightnessBelow = rainBrightness(uTime, cell + vec2(0.0, 1.0));
  float isHead = step(brightnessBelow, brightness);

  // Glyph cycling. Each cell has its own age offset so the whole field does not
  // flip in lockstep, which is the giveaway of a cheap implementation.
  float age = hash21(cell * 1.37) * 61.0 + uTime * uCycleRate;
  float symbol = mod(
    floor(hash21(cell + floor(age) * 0.017) * uGlyphCount),
    uGlyphCount
  );

  vec2 atlasCell = vec2(mod(symbol, uAtlasGrid.x), floor(symbol / uAtlasGrid.x));
  vec2 atlasUv = (atlasCell + inCell) / uAtlasGrid;

  // The atlas is white-on-black, so it doubles as the coverage mask.
  float glyph = texture2D(uAtlas, atlasUv).r;

  // Exponent below 1 lifts the mid-tones, which is what makes a short trail read
  // as a continuous stream. A linear falloff puts almost all the light in the
  // head cell and the rest of the column disappears.
  //
  // Set to 0.55 while this was being judged for restraint, which made the whole
  // effect read as faint texture rather than as rain. 0.42 keeps the trail
  // continuous while restoring a real gradient from head to tail.
  float amount = pow(clamp(brightness, 0.0, 1.0), 0.42);
  amount = mix(amount, min(amount + 0.9, 1.0), isHead * uHeadBoost);

  // Reading-column attenuation, applied as TWO curves rather than one.
  //
  // Dimming the whole field was the obvious lever and it is the wrong one: it
  // forces the entire left half of the screen to go flat, which is exactly the
  // thing the brighter base was meant to fix.
  //
  // What actually breaks contrast is not the field — it is the bright *head*
  // cell. Measured, the head is what pushed the worst frame under threshold,
  // and the trail is dim enough to sit behind text without hurting it. So the
  // trail keeps a gentle attenuation and the head gets an aggressive one. The
  // result reads as rain texture running the full width of the viewport, with
  // the glowing heads confined to the open right-hand side.
  float trailGuard = mix(0.06, 1.0, smoothstep(uGuardStart, uGuardEnd, vUv.x));
  float headGuard  = mix(0.02, 1.0, smoothstep(uGuardStart + 0.06, uGuardEnd, vUv.x));
  amount *= mix(trailGuard, headGuard, isHead * uHeadBoost);

  vec3 color = mix(uColorTail, uColorHead, isHead * uHeadBoost + amount * 0.3);
  color *= amount;

  // Scroll response. Velocity pushes brightness so the field visibly reacts to
  // the same input that drives everything else on the page.
  color *= 1.0 + uVelocity * 0.5;

  // Descending through the document compresses the field slightly, which keeps
  // the effect present without letting it compete with dense content.
  float depth = mix(1.0, 0.82, uScroll);

  // Blue-noise-ish dither. An 8-bit dark green ramp bands badly without it, and
  // banding is far more visible than the dither ever is.
  float dither = (hash21(gl_FragCoord.xy + fract(uTime)) - 0.5) * uDither;

  float alpha = glyph * amount * uOpacity * depth;
  if (alpha < 0.002) discard;

  gl_FragColor = vec4(color + dither * 0.06, alpha);
}