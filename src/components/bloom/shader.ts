/**
 * Bloom backplates, after Karel Martens' line patterns: a flat brand colour with paper
 * grain, covered in continuous vertical lines. Each line steps between a few fixed
 * widths along its length (the terminal's candles and depth bars), and a flower
 * emerges where the lines swell and thin. Nothing is drawn as an outline.
 */
export const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `
precision highp float;
uniform vec2 uRes, uPos;
uniform float uTime, uSeed, uPetals, uLayers, uScale, uCols, uCover, uDash, uGrain, uStem, uGrow, uInk, uMode, uImgAspect, uThresh, uGain, uInvert;
uniform sampler2D uImg;
uniform vec3 uBg;

float h1(float n) { return fract(sin(n * 127.1 + uSeed * 31.7) * 43758.5453); }
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 17.3) * 43758.5453); }
float easeOut(float t) { t = clamp(t, 0.0, 1.0); return 1.0 - pow(1.0 - t, 3.0); }

// 0 outside; 1..6 petal layer (outer to inner); 8 stem; 9 centre.
float flower(vec2 p) {
  vec2 q = p - uPos;
  float r = length(q);
  float theta = atan(q.y, q.x);
  float R0 = 0.34 * uScale;
  float res = 0.0;
  if (uStem > 0.5 && q.y < 0.0) {
    float t = -q.y;
    float sway = sin(t * 5.0 + uSeed) * 0.035 * uScale * smoothstep(0.0, 0.3, t);
    float reach = 2.0 * easeOut(uGrow * 2.0);
    if (abs(q.x - sway) < 0.022 * uScale && t < reach) res = 8.0;
    // one leaf
    vec2 l = q - vec2(sway + 0.085 * uScale, -0.62 * uScale);
    l = vec2(l.x * 0.8 - l.y * 0.6, l.x * 0.6 + l.y * 0.8);
    if (length(l / vec2(0.1, 0.035)) < uScale * easeOut(uGrow * 1.5)) res = 8.0;
  }
  for (int i = 0; i < 6; i++) {
    float k = float(i);
    if (k >= uLayers) break;
    float order = uLayers - 1.0 - k;
    float gk = easeOut((uGrow - order * 0.1) / 0.6);
    float base = R0 * (1.0 - k / uLayers * 0.78) * gk;
    float R = base * (0.42 + 0.58 * pow(abs(cos(uPetals * 0.5 * (theta + k * 0.55 + uSeed))), 0.8));
    if (r < R) res = k + 1.0;
  }
  if (r < R0 * 0.09 * easeOut(uGrow)) res = 9.0;
  return res;
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  float m = min(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / m;
  float px = 1.0 / m;

  // Every column is one continuous line. Its width steps between a few fixed
  // weights along its length, and those steps carry the image.
  float cw = 1.0 / uCols;
  float ci = floor(p.x / cw);
  float fx = fract(p.x / cw);
  float ch = cw * mix(1.0, 5.0, uDash);
  float oy = h1(ci + 11.0) * ch + uTime * 0.012 * (h1(ci + 9.0) - 0.5);
  float y = p.y + oy;
  float ri = floor(y / ch);
  vec2 centre = vec2((ci + 0.5) * cw, (ri + 0.5) * ch - oy);

  float f = uMode > 0.5 ? 0.0 : flower(centre);
  float v;
  float jitter = 0.9;
  if (uMode > 0.5) {
    // Threshold image: its brightness sets the line weight. The image covers the plate.
    float A = uRes.x / uRes.y;
    vec2 ext = vec2(uRes.x, uRes.y) / m;
    vec2 size = uImgAspect > A ? vec2(ext.y * uImgAspect, ext.y) : vec2(ext.x, ext.x / uImgAspect);
    vec2 uv = (centre - uPos) / (size * uScale) + 0.5;
    uv.y = 1.0 - uv.y;
    float l = dot(texture2D(uImg, clamp(uv, 0.0, 1.0), 0.5).rgb, vec3(0.299, 0.587, 0.114));
    l = mix(l, 1.0 - l, uInvert);
    // The weights breathe slowly, like volume coming and going.
    l += (noise2(centre * 2.5 + vec2(0.0, uTime * 0.12)) - 0.5) * 0.14 * step(0.001, uTime);
    v = clamp((l - uThresh) * uGain + 0.5, 0.0, 1.0);
    v *= smoothstep(0.0, 0.35, uGrow + (1.0 - length(centre - uPos)) * uGrow * 2.0);
    jitter = 0.35;
  } else if (f < 0.5) {
    // Ground: slow drifts of weight, like volume across a session.
    v = uCover * (0.15 + 0.6 * noise2(centre * 2.2 + 20.0));
  } else if (f > 7.5) {
    v = 1.0;
  } else if (mod(f, 2.0) > 0.5) {
    v = 0.92;
  } else {
    v = 0.06;
  }
  float lvl = clamp(floor(v * 4.0 + (h2(vec2(ci, ri)) - 0.5) * jitter), 0.0, 3.0);
  float w = lvl < 0.5 ? 0.09 : lvl < 1.5 ? 0.28 : lvl < 2.5 ? 0.5 : 0.72;
  float bar = 1.0 - smoothstep(w * 0.5 * cw - px, w * 0.5 * cw + px, abs(fx - 0.5) * cw);

  // Contrast runs from tone on tone to full ink.
  float lum = dot(uBg, vec3(0.299, 0.587, 0.114));
  vec3 soft = lum < 0.2 ? mix(uBg, vec3(1.0), 0.1) : uBg * 0.84;
  vec3 ink = lum < 0.2 ? vec3(0.93, 0.92, 0.9) : vec3(0.1, 0.09, 0.08);
  vec3 col = mix(uBg, mix(soft, ink, uInk), bar);

  // Paper grain and the odd light fleck.
  float g = h2(floor(p * 900.0) + 0.5);
  col += (g - 0.5) * 0.065 * uGrain;
  float g2 = h2(floor(p * 260.0) + 7.5);
  col += (g2 - 0.5) * 0.04 * uGrain;
  float fleck = step(0.9992, h2(floor(p * vec2(520.0, 260.0)) + 3.5));
  col = mix(col, vec3(1.0, 0.97, 0.9), fleck * 0.55 * min(uGrain, 1.0));

  gl_FragColor = vec4(col, 1.0);
}
`;
