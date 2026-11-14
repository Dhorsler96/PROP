import { FRAG, VERT } from "./shader";

export const UNIFORMS = ["uRes", "uPos", "uTime", "uSeed", "uPetals", "uLayers", "uScale", "uCols", "uCover", "uDash", "uGrain", "uStem", "uGrow", "uInk", "uBg", "uMode", "uImgAspect", "uThresh", "uGain", "uInvert", "uImg"] as const;

export type BloomGl = { gl: WebGLRenderingContext; u: Record<string, WebGLUniformLocation | null> };

/** Compile the Bloom shader on a canvas. Returns null when WebGL is unavailable. */
export function initBloom(canvas: HTMLCanvasElement): BloomGl | null {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
    return sh;
  };
  try {
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u: Record<string, WebGLUniformLocation | null> = {};
    for (const name of UNIFORMS) u[name] = gl.getUniformLocation(prog, name);
    return { gl, u };
  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * Upload a threshold image as a small mipmapped greyscale texture. Downscaling first
 * averages the photo so each line step reads a calm brightness, and the tones are
 * stretched so flat, low-contrast photos still use every line weight.
 */
export function uploadThreshold(gl: WebGLRenderingContext, img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const c2d = c.getContext("2d");
  if (!c2d) return false;
  c2d.drawImage(img, 0, 0, 256, 256);
  const data = c2d.getImageData(0, 0, 256, 256);
  const d = data.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const l = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    d[i] = d[i + 1] = d[i + 2] = l;
    hist[l]++;
  }
  const total = d.length / 4;
  let lo = 0;
  let hi = 255;
  for (let acc = 0; lo < 255 && (acc += hist[lo]) < total * 0.03; lo++);
  for (let acc = 0; hi > 0 && (acc += hist[hi]) < total * 0.03; hi--);
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, ((d[i] - lo) / span) * 255));
  c2d.putImageData(data, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return true;
}

export function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.trim().replace("#", "").slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
