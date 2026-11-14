/**
 * Bloom: flowers drawn in the terminal's chart language.
 * Each petal layer is a price line wrapped around a circle (a periodic random walk,
 * optionally stepped into candles) with the chart's fading area fill beneath it.
 * Chart gridlines become rings and spokes, order-book depth bars become the outer
 * stamens, and the stem is a price line climbing to the flower.
 */
export const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uSeed, uPetals, uVol, uLayers, uGrow, uStep, uStem, uGrid, uDepth, uFill, uWeight, uBgAlpha;
uniform vec3 uBg, uLine, uAlt, uInk;

const float TAU = 6.28318530718;

float hash(float n) { return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453); }

float vnoise(float x, float per) {
  float i = floor(x);
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash(mod(i, per) + per * 7.0), hash(mod(i + 1.0, per) + per * 7.0), f);
}

// A price walk that joins up around the circle. a is 0..1.
float price(float a, float layer) {
  float n = 96.0;
  a = mix(a, (floor(a * n) + 0.5) / n, uStep);
  float s = 0.0;
  float amp = 0.5;
  float per = 6.0;
  for (int i = 0; i < 5; i++) {
    s += amp * (vnoise(a * per + layer * 13.7, per) - 0.5);
    amp *= 0.55;
    per *= 2.0;
  }
  return s;
}

float easeOut(float t) { t = clamp(t, 0.0, 1.0); return 1.0 - pow(1.0 - t, 3.0); }

float radiusAt(float theta, float k, float base) {
  float dir = mod(k, 2.0) < 0.5 ? 1.0 : -1.0;
  float rot = k * 0.7 + dir * uTime * 0.02;
  float petal = pow(abs(cos(uPetals * 0.5 * (theta + rot))), 0.7);
  float a = fract((theta + dir * uTime * 0.008) / TAU);
  return base * (0.34 + 0.66 * petal) * (1.0 + uVol * 1.5 * price(a, k));
}

vec4 over(vec4 dst, vec3 c, float a) {
  a = clamp(a, 0.0, 1.0);
  return dst * (1.0 - a) + vec4(c * a, a);
}

void main() {
  float m = min(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / m;
  float px = 1.0 / m;
  vec2 c = vec2(0.0, uStem > 0.5 ? 0.08 : 0.0);
  vec2 q = p - c;
  float r = length(q);
  float theta = atan(q.y, q.x);
  float R0 = uStem > 0.5 ? 0.25 : 0.29;
  float lw = uWeight * 0.0011;
  float grow = easeOut(uGrow);

  vec4 col = vec4(uBg * uBgAlpha, uBgAlpha);

  // Chart grid: rings are price levels, spokes are time ticks.
  float gridR = R0 * 1.6 * grow;
  float ring = abs(fract(r / (R0 * 0.25) + 0.5) - 0.5) * (R0 * 0.25);
  float spokeA = abs(fract(theta / TAU * 24.0 + 0.5) - 0.5) / 24.0 * TAU * r;
  float g = max(1.0 - smoothstep(0.0, px * 1.2, ring), 1.0 - smoothstep(0.0, px * 1.2, spokeA));
  g *= (1.0 - smoothstep(gridR * 0.75, gridR, r)) * smoothstep(0.02, 0.06, r);
  col = over(col, uInk, g * 0.1 * uGrid);

  // Stem: a price line climbing from the bottom edge to the flower.
  if (uStem > 0.5) {
    float bottom = -0.5 * uRes.y / m;
    float t = (p.y - bottom) / (c.y - bottom);
    float sway = (price(t * 0.35 + 0.31, 9.0) - price(0.35 + 0.31, 9.0)) * 0.22 * (1.0 - t * t);
    float sx = c.x + sway;
    float inStem = step(0.0, t) * step(t, min(1.0, uGrow * 2.5));
    float d = abs(p.x - sx);
    col = over(col, uAlt, (1.0 - smoothstep(lw, lw + px * 1.5, d)) * inStem);
    // area under the stem line, like the chart fill
    float side = step(sx, p.x);
    col = over(col, uAlt, side * inStem * 0.1 * uFill * (1.0 - smoothstep(0.0, 0.07, d)));
  }

  // Order-book depth bars around the flower.
  float bars = 72.0;
  float slot = floor(theta / TAU * bars);
  float inSlot = abs(fract(theta / TAU * bars) - 0.5);
  float len = (0.1 + 0.3 * hash(slot + 400.0)) * R0 * grow;
  float b0 = R0 * 1.2 * grow;
  float bar = step(inSlot, 0.3) * step(b0, r) * step(r, b0 + len);
  vec3 barCol = q.x < 0.0 ? uAlt : uLine;
  col = over(col, barCol, bar * 0.4 * uDepth);

  // Petal layers, outermost first so inner layers sit on top.
  for (int i = 0; i < 6; i++) {
    float k = float(i);
    if (k >= uLayers) break;
    float order = uLayers - 1.0 - k;
    float gk = easeOut((uGrow - order * 0.1) / 0.6);
    float base = R0 * (1.0 - k * 0.15) * gk;
    float R = radiusAt(theta, k, base);
    float e = 0.004;
    float dR = (radiusAt(theta + e, k, base) - R) / e;
    float d = abs(r - R) / sqrt(1.0 + (dR * dR) / max(r * r, 1e-4));
    vec3 lc = mod(k, 2.0) < 0.5 ? uLine : uAlt;
    float inside = 1.0 - smoothstep(R - px, R + px, r);
    float fillA = uFill * mix(0.03, 0.42, pow(clamp(r / max(R, 1e-4), 0.0, 1.0), 2.5));
    col = over(col, uBg, inside * 0.55 * uBgAlpha);
    col = over(col, lc, inside * fillA);
    col = over(col, lc, (1.0 - smoothstep(lw, lw + px * 1.5, d)) * step(0.001, gk));
  }

  // Live dot at the centre, like the last-price marker.
  float pulse = fract(uTime * 0.5);
  col = over(col, uInk, (1.0 - smoothstep(0.0, px * 1.5, abs(r - 0.012 - 0.03 * pulse) - lw * 0.5)) * (1.0 - pulse) * 0.6 * grow);
  col = over(col, uInk, (1.0 - smoothstep(0.011, 0.011 + px * 1.5, r)) * grow);

  gl_FragColor = col;
}
`;
