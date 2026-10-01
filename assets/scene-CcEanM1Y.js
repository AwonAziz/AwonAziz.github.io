import{r as e}from"./rolldown-runtime-hePW80VL.js";import{C as t,S as n,T as r,_ as i,a,b as o,c as s,d as c,f as l,g as u,h as d,i as f,l as p,m,n as h,o as g,p as _,r as v,s as y,t as ee,u as b,v as x,x as S,y as C}from"./r3f-Bw1ovoNK.js";import{a as w,i as T,n as E,o as D,r as O,s as k,t as A}from"./index-CZpHp3k-.js";var j=e(r(),1);function M(){let[e,t]=(0,j.useState)(O);return(0,j.useEffect)(()=>{let e=()=>t(O()),n=T(e);return e(),n},[]),e}var N=`// ---------------------------------------------------------------------------
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
`,P=`// ---------------------------------------------------------------------------
//  Particle field — vertex
// ---------------------------------------------------------------------------
//  60k points, all animated on the GPU. Each particle is a cylindrical
//  coordinate drifting through a curl-ish noise field, so the CPU cost per
//  frame is a single uniform write regardless of particle count.
//
//  Scroll enters twice: \`uScroll\` (0..1 document progress) opens the field
//  outward and lifts it, \`uVelocity\` adds a tangential whip that decays to
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
`,F=`precision highp float;

/**
 * Shared hash / noise / rotation helpers.
 *
 * Concatenated ahead of every shader that needs it (see \`shaders/index.ts\`)
 * rather than preprocessed with a GLSL plugin: Vite's \`?raw\` import means no
 * build-step dependency, no plugin version to track, and the GLSL stays
 * lintable at the seam. The cost is one string concat per shader at module load.
 *
 * GLSL ES 1.00 throughout, which is three.js \`ShaderMaterial\`'s default:
 * \`attribute\` / \`varying\` / \`gl_FragColor\` rather than the ES 3.00 spellings.
 */

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

/** Value noise. Cheaper than simplex and visually indistinguishable at the
 *  scale it is used here — as low-frequency warp, not as a detail source. */
float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

  // NOTE: no trailing comma on the final argument. GLSL ES 1.00 — which is
  // three.js \`ShaderMaterial\`'s default — does not allow one, and the resulting
  // parse error takes the whole program down. It fails silently from the
  // caller's point of view: three.js logs to \`console.error\` and the mesh draws
  // nothing, so the symptom is an empty black canvas with nothing thrown.
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm(vec3 p, int octaves) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    sum += amplitude * vnoise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return sum;
}

mat2 rot2(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

/**
 * 3D simplex noise.
 *
 * Ashima Arts / Stefan Gustavson, public domain (MIT-licensed, attribution-free
 * as published). Included rather than substituting \`vnoise\` because the depth
 * field warps by it every frame and the two do not read the same at that
 * frequency: value noise's axis-aligned structure is visible once it is the
 * dominant input to motion rather than to shading.
 *
 * \`mod289\` / \`permute\` / \`taylorInvSqrt\` are the standard pre-helper chain.
 */
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}`,I=`precision highp float;

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
 *      \`wobble()\` warps the sawtooth's *period* rather than its amplitude.
 *
 *  Direction check: brightness peaks where \`t\` wraps to zero, and the row that
 *  satisfies that grows with time, so heads travel downward. Cells above a head
 *  have larger \`t\` and therefore lower brightness, so the trail fades upward —
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

  // Row 0 is the top of the screen. \`grid.y\` grows upward, so flip it.
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
}`,L=`precision highp float;

varying vec2 vUv;

/**
 * Screen-space quad.
 *
 * The vertex stage ignores every matrix and writes clip coordinates directly.
 * That is what lets the rain live inside the *existing* perspective camera as a
 * single quad with \`frustumCulled={false}\` — no second render pass, no second
 * WebGL context, no per-frame CPU work. \`PlaneGeometry(2, 2)\` covers the whole
 * NDC range; \`z = 1.0\` puts it on the far plane, which is irrelevant because the
 * material disables depth testing and draws at \`renderOrder = -100\`.
 */
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`,R=F,z=`${R}\n${P}`,B=`${R}\n${N}`,V=L,H=`${R}\n${I}`,U=t();function W(){let e=O(),t=(0,j.useRef)(null),r=(0,j.useMemo)(()=>{let t=e.particles,n=new m,r=new Float32Array(t*4),i=new Float32Array(t);for(let e=0;e<t;e+=1){let t=e*4;r[t]=Math.random()*Math.PI*2,r[t+1]=1.4+Math.sqrt(Math.random())*7.2,r[t+2]=(Math.random()-.5)*11,r[t+3]=Math.random(),i[e]=.35+Math.random()**2.6*1.3}return n.setAttribute(`position`,new x(new Float32Array(t*3),3)),n.setAttribute(`aSeed`,new x(r,4)),n.setAttribute(`aScale`,new x(i,1)),n},[e.particles]),a=(0,j.useMemo)(()=>({uTime:{value:0},uScroll:{value:0},uVelocity:{value:0},uSpeed:{value:0},uPixelRatio:{value:1},uPointScale:{value:1},uPointer:{value:new n},uPointerActive:{value:0},uColorLow:{value:new i(`#0c2b21`)},uColorMid:{value:new i(`#1f6b4d`)},uColorHigh:{value:new i(`#4fb489`)},uOpacity:{value:e.tier===`low`?.3:.42}}),[e.tier]),o=(0,j.useMemo)(()=>new S({vertexShader:z,fragmentShader:B,transparent:!0,depthWrite:!1,blending:2,uniforms:a}),[a]);return(0,j.useEffect)(()=>()=>{r.dispose(),o.dispose()},[r,o]),l((e,n)=>{let r=Math.min(n,1/20);a.uTime.value+=r,a.uScroll.value=D.progress,a.uVelocity.value=D.velocity,a.uSpeed.value=D.speed,a.uPixelRatio.value=e.gl.getPixelRatio(),a.uPointerActive.value+=(A.active-a.uPointerActive.value)*Math.min(1,r*3.2),a.uPointer.value.set(A.worldX,A.worldY),t.current&&(t.current.rotation.y+=r*.01)}),(0,U.jsx)(`points`,{ref:t,geometry:r,material:o,frustumCulled:!1,renderOrder:-50})}function te(){let e=O(),t=(0,j.useMemo)(()=>new n(1e-4,1e-4),[]);return l(()=>{let e=1e-4+Math.min(D.speed,1)*6e-4;t.set(e*(.7+Math.abs(D.direction)*.3),e)}),e.postFx?(0,U.jsxs)(v,{multisampling:e.tier===`high`?4:0,children:[(0,U.jsx)(ee,{intensity:e.bloom,luminanceThreshold:.16,luminanceSmoothing:.72,kernelSize:e.tier===`high`?y.LARGE:y.MEDIUM,mipmapBlur:!0}),(0,U.jsx)(h,{offset:t,radialModulation:!0,modulationOffset:.42}),(0,U.jsx)(f,{premultiply:!0,blendFunction:g.OVERLAY,opacity:.075}),(0,U.jsx)(a,{eskil:!1,offset:.3,darkness:.6})]}):null}var G=`ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ`,K=`0123456789`,q=`Z:<>=+*-_/\\|[]{}`,J=16,Y=8,X=64;function Z(e){e.font=`32px "JetBrains Mono", monospace`;let t=e.measureText(`�`).width,n=e.measureText(`ｱ`).width;return n>0&&Math.abs(n-t)>.5}var Q=null;function ne(){if(Q)return Q;if(typeof document>`u`)return null;let e=document.createElement(`canvas`);e.width=1024,e.height=512;let t=e.getContext(`2d`,{willReadFrequently:!1});if(!t)return null;let n=Z(t),r=n?`${G}${K}${q}`:`${K}ABCDEFGHIJKLMNOPQRSTUVWXYZ${q}`,i=Math.min(r.length,128),a=Math.round(X*.72);t.fillStyle=`#000`,t.fillRect(0,0,e.width,e.height),t.fillStyle=`#fff`,t.textAlign=`center`,t.textBaseline=`middle`,t.font=`${a}px "JetBrains Mono", "MS Gothic", "Osaka-Mono", monospace`;for(let e=0;e<i;e+=1){let n=e%J,i=Math.floor(e/J);t.fillText(r.charAt(e),n*X+X/2,i*X+X/2)}let s=new d(e);return s.colorSpace=o,s.minFilter=C,s.magFilter=C,s.wrapS=u,s.wrapT=u,s.generateMipmaps=!1,s.needsUpdate=!0,Q={texture:s,count:i,katakana:n},Q}var $={columns:J,rows:Y,cell:X},re=137.4;function ie({paused:e=!1,reduced:t=!1}){let r=O(),a=_(e=>e.size),o=(0,j.useMemo)(()=>ne(),[]),s=(0,j.useMemo)(()=>({uTime:{value:0},uGrid:{value:new n(80,40)},uAtlasGrid:{value:new n($.columns,$.rows)},uGlyphCount:{value:o?.count??0},uFallSpeed:{value:.42},uTrailLength:{value:14},uCycleRate:{value:.34},uOpacity:{value:r.rainOpacity},uHeadBoost:{value:1},uDither:{value:.045},uFrozen:{value:0},uScroll:{value:0},uVelocity:{value:0},uColorHead:{value:new i(`#f2fff8`)},uColorTail:{value:new i(`#1aff8c`)},uAtlas:{value:o?.texture}}),[o,r.rainOpacity]),c=(0,j.useMemo)(()=>new S({vertexShader:V,fragmentShader:H,uniforms:s,transparent:!0,blending:2,depthTest:!1,depthWrite:!1}),[s]);return(0,j.useEffect)(()=>()=>{c.dispose()},[c]),(0,j.useEffect)(()=>{let e=Math.max(12,Math.round(a.width/r.rainCell)),t=Math.max(8,Math.round(a.height/(r.rainCell*1.15)));s.uGrid.value.set(e,t),s.uOpacity.value=r.rainOpacity},[a.width,a.height,r.rainCell,r.rainOpacity,s]),(0,j.useEffect)(()=>{s.uGlyphCount.value=o?.count??0},[o,s]),l((n,r)=>{let i=t||e;if(s.uFrozen.value=+!!i,s.uScroll.value=D.progress,s.uVelocity.value=Math.min(Math.abs(D.velocity)/24,1),i){s.uTime.value=re;return}s.uTime.value+=Math.min(r,1/20)}),o?(0,U.jsx)(`mesh`,{material:c,frustumCulled:!1,renderOrder:-100,name:`matrix-rain`,children:(0,U.jsx)(`planeGeometry`,{args:[2,2]})}):null}function ae(){let e=_(e=>e.invalidate);return(0,j.useEffect)(()=>c(()=>e()),[e]),null}function oe(){let e=(0,j.useRef)(null);return l(()=>{let t=e.current;if(!t)return;let n=D.progress;t.setRGB(.026-n*.01,.047-n*.014,.044-n*.015)}),(0,U.jsx)(`color`,{ref:e,attach:`background`,args:[`#070c0b`]})}function se(){let[e,t]=(0,j.useState)(!0);return(0,j.useEffect)(()=>{let e=()=>t(!document.hidden);return document.addEventListener(`visibilitychange`,e),()=>document.removeEventListener(`visibilitychange`,e)},[]),e}function ce(){let e=M(),t=se(),[n,r]=(0,j.useState)(!1);return(0,j.useEffect)(()=>{let e=e=>{e.key===`Escape`&&!n&&r(!0)};return window.addEventListener(`keydown`,e),()=>window.removeEventListener(`keydown`,e)},[n]),(0,U.jsxs)(U.Fragment,{children:[(0,U.jsx)(`div`,{"aria-hidden":`true`,className:`pointer-events-none fixed inset-0 -z-10`,"data-scene":``,children:(0,U.jsxs)(b,{dpr:e.dpr,gl:{antialias:!1,alpha:!1,powerPreference:`high-performance`,stencil:!1,depth:!0},camera:{fov:50,near:.1,far:120,position:[0,0,9]},frameloop:t?`always`:`never`,performance:{min:.4},onCreated:({gl:e})=>{e.toneMapping=0,e.outputColorSpace=o},children:[(0,U.jsx)(ae,{}),(0,U.jsx)(oe,{}),(0,U.jsx)(ie,{paused:n,reduced:k}),(0,U.jsx)(W,{}),(0,U.jsx)(te,{}),(0,U.jsx)(p,{pixelated:!1}),(0,U.jsx)(s,{onDecline:()=>E()})]})}),(0,U.jsxs)(`button`,{type:`button`,onClick:()=>r(e=>!e),"aria-pressed":n,"data-cursor-label":n?`Run`:`Hold`,className:`group fixed right-4 bottom-4 z-90 flex items-center gap-2.5 rounded-pill border border-white/12 bg-canvas-raised/85 px-4 py-2.5 font-mono text-micro tracking-widest text-ink-faint backdrop-blur-md transition-colors duration-300 hover:border-accent/50 hover:text-ink md:right-6 md:bottom-6`,children:[(0,U.jsx)(`span`,{"aria-hidden":`true`,className:w(`status-dot`,k||n?`status-warn`:`status-ok animate-pulse-dot`)}),k?`motion reduced`:n?`rain paused`:`rain live`]})]})}export{ce as Scene};