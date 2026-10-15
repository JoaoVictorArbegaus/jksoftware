/**
 * Fundo de padrão ondulado: uma grade de pontos (ou cruzes, ou linhas) desenha uma superfície que ondula,
 * com luz e brilho; o cursor deixa um rastro de ondulação e um clique solta uma onda.
 *
 * Adaptado de React Bits — PatternWaves (https://reactbits.dev), licença MIT.
 * Mudanças: WebGL2 direto em vez da biblioteca `ogl` (sem dependência nova); TypeScript; sem o padrão de
 * caracteres (atlas de letras); camada decorativa da seção com cores da marca; pausa fora da tela; parado e
 * sem ondulação do cursor com movimento reduzido.
 */
import { useEffect, useRef } from 'react';

type Preset = { pattern: 'dot' | 'plus' | 'line'; wave: 'silk' | 'swell' | 'ripple'; spacing: number; markSize: number; depth: number; light: number; shine: number; contrast: number; speed: number; scale: number; direction: number };

const PRESETS: Record<'silk' | 'ocean' | 'pond' | 'lines' | 'mesh', Preset> = {
  silk: { pattern: 'dot', wave: 'silk', spacing: 9, markSize: 0.95, depth: 0.95, light: 0, shine: 0.8, contrast: 1.2, speed: 0.35, scale: 1, direction: 20 },
  ocean: { pattern: 'dot', wave: 'swell', spacing: 10, markSize: 0.9, depth: 0.42, light: 0, shine: 1, contrast: 1.2, speed: 0.5, scale: 1, direction: 100 },
  pond: { pattern: 'dot', wave: 'ripple', spacing: 10, markSize: 0.9, depth: 0.55, light: 0, shine: 1.2, contrast: 1.2, speed: 0.5, scale: 1, direction: 35 },
  lines: { pattern: 'line', wave: 'silk', spacing: 12, markSize: 0.42, depth: 0.9, light: 0, shine: 0.6, contrast: 1.2, speed: 0.3, scale: 1, direction: 20 },
  mesh: { pattern: 'plus', wave: 'silk', spacing: 14, markSize: 0.8, depth: 0.95, light: 0, shine: 1, contrast: 1.45, speed: 0.4, scale: 1.1, direction: 325 },
};
const PATTERNS = { dot: 0, plus: 2, line: 3 } as const;
const WAVES = { silk: 0, swell: 1, ripple: 2 } as const;
const FADES = { none: 0, edges: 1, center: 2, bottom: 3, top: 4 } as const;
const WAVE_UNIT = 520;
const RIPPLE_CELL = 8;
const RIPPLE_RATE = 60;
const PIXEL_BUDGET = 4.5e6;
const INTRO_SECONDS = 2;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const luminance = (c: number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const hexToRgba = (hex: string): [number, number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255, 1];
};

const PASS_VERTEX = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FIELD_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uSize;
uniform float uDpr;
uniform vec2 uOrigin;
uniform vec2 uPitch;
uniform int uWave;
uniform float uTime;
uniform float uUnit;
uniform vec2 uHeading;
uniform float uAmp;
uniform float uDepth;
uniform vec3 uLight;
uniform float uShine;
uniform float uContrast;
uniform float uInk;
uniform float uOpacity;
uniform int uFade;
uniform float uFadeSize;
uniform float uAppear;
uniform sampler2D tRipple;
uniform float uRipple;
out vec4 fragColor;
const float FOLDS = 5.5;

uvec3 scramble(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
vec3 lattice(vec3 corner) {
  uvec3 h = scramble(uvec3(ivec3(corner) + 4096));
  return vec3(h & 65535u) / 32767.5 - 1.0;
}
float gradientNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = p - i;
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n000 = dot(lattice(i), f);
  float n100 = dot(lattice(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0));
  float n010 = dot(lattice(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0));
  float n110 = dot(lattice(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0));
  float n001 = dot(lattice(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0));
  float n101 = dot(lattice(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0));
  float n011 = dot(lattice(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0));
  float n111 = dot(lattice(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y), mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}
float surface(vec2 p, float t) {
  if (uWave == 0) {
    vec2 side = vec2(-uHeading.y, uHeading.x);
    float u = dot(p, uHeading);
    float v = dot(p, side);
    float bend = gradientNoise(vec3(v * 0.85, u * 0.3, t * 0.05)) * 1.7 + 0.4 * sin(v * 1.6 + t * 0.2);
    float phase = u * FOLDS + bend - t * 0.45;
    float swell = 0.6 + 0.4 * gradientNoise(vec3(u * 0.55 + 3.0, v * 0.45, t * 0.04));
    float fold = sin(phase) + 0.32 * sin(2.0 * phase + 1.3);
    float ripple = 0.16 * sin(u * FOLDS * 2.5 + bend * 1.9 - t * 0.9 + 2.1);
    return (fold + ripple) * swell;
  }
  if (uWave == 1) {
    float bend = gradientNoise(vec3(p * 0.6, t * 0.05)) * 0.6;
    float phase = dot(p, uHeading) * 15.0 + bend * 2.2 - t * 1.4;
    float swell = sin(phase) + 0.3 * sin(2.0 * phase - 0.8);
    float roll = 0.75 + 0.25 * gradientNoise(vec3(p * 0.9 + 11.0, t * 0.05));
    return 0.8 * swell * roll;
  }
  float r = length(p + uHeading * 1.2);
  float bend = gradientNoise(vec3(p * 1.2, t * 0.05)) * 0.1;
  return sin((r + bend) * 9.0 - t * 1.8) * (0.45 + 0.55 * exp(-(r - 0.6) * 0.8));
}
float heightAt(vec2 css) {
  float h = surface((css - 0.5 * uSize) / uUnit, uTime) * uAmp;
  if (uRipple > 0.0) h += texture(tRipple, css / uSize).r * uRipple;
  return h;
}
void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 center = uOrigin + (cell + 0.5) * uPitch;
  vec2 css = center / uDpr;
  vec2 uv = css / uSize;
  float e = max(uPitch.y / uDpr, 4.0);
  float h = heightAt(css);
  float hx = (heightAt(css + vec2(e, 0.0)) - heightAt(css - vec2(e, 0.0))) / (2.0 * e);
  float hy = (heightAt(css + vec2(0.0, e)) - heightAt(css - vec2(0.0, e))) / (2.0 * e);
  vec2 grad = vec2(hx, hy) * uUnit * uDepth * 0.4;
  vec3 n = normalize(vec3(-grad, 1.0));
  float diffuse = clamp(dot(n, uLight), 0.0, 1.0);
  vec3 halfway = normalize(uLight + vec3(0.0, 0.0, 1.0));
  float spec = pow(clamp(dot(n, halfway), 0.0, 1.0), 160.0) * uShine * 1.15;
  float hollow = 0.7 + 0.3 * clamp(h * 0.5 + 0.5, 0.0, 1.0);
  float tone = clamp(diffuse * hollow * 0.78 + spec, 0.0, 1.0);
  tone = clamp((tone - 0.42) * uContrast + 0.42, 0.0, 1.0);
  float level = uInk > 0.5 ? pow(clamp(1.0 - tone / 0.46, 0.0, 1.0), 2.4) * 0.72 : pow(tone, 2.2);
  float emphasis = uInk > 0.5 ? smoothstep(0.55, 0.95, level) : clamp(spec * 1.6, 0.0, 1.0);
  float fade = 1.0;
  vec2 c = uv * 2.0 - 1.0;
  if (uFade == 1) fade = 1.0 - smoothstep(1.0 - uFadeSize, 1.18, length(c));
  else if (uFade == 2) fade = mix(0.05, 1.0, smoothstep(0.08, 0.08 + uFadeSize, length(c * vec2(1.0, 1.35))));
  else if (uFade == 3) fade = smoothstep(0.0, uFadeSize, uv.y);
  else if (uFade == 4) fade = smoothstep(0.0, uFadeSize, 1.0 - uv.y);
  float reach = length(css - 0.5 * uSize) / max(0.5 * length(uSize), 1.0);
  float appear = smoothstep(reach - 0.05, reach + 0.3, uAppear * 1.35);
  float alpha = uOpacity * fade * appear * (0.22 + 0.78 * level);
  float lift = clamp(h * uDepth * 0.42, -0.48, 0.48);
  fragColor = vec4(level, alpha, emphasis, lift + 0.5);
}
`;

const RIPPLE_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D tState;
uniform vec2 uTexel;
uniform vec2 uSize;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uImpulse;
uniform float uDamping;
out vec4 fragColor;
void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec2 state = texture(tState, uv).rg;
  float left = texture(tState, uv - vec2(uTexel.x, 0.0)).r;
  float right = texture(tState, uv + vec2(uTexel.x, 0.0)).r;
  float below = texture(tState, uv - vec2(0.0, uTexel.y)).r;
  float above = texture(tState, uv + vec2(0.0, uTexel.y)).r;
  float next = ((left + right + below + above) * 0.5 - state.g) * uDamping;
  vec2 p = uv * uSize;
  vec2 segment = uTo - uFrom;
  float along = clamp(dot(p - uFrom, segment) / max(dot(segment, segment), 1e-4), 0.0, 1.0);
  float d = length(p - uFrom - segment * along) / uRadius;
  next -= uImpulse * exp(-d * d * 2.0);
  fragColor = vec4(next, state.r, 0.0, 1.0);
}
`;

const MARK_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D tField;
uniform vec2 uOrigin;
uniform vec2 uPitch;
uniform vec2 uGrid;
uniform int uPattern;
uniform float uMarkSize;
uniform float uStroke;
uniform vec3 uColor;
uniform vec3 uAccent;
out vec4 fragColor;
float box(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float coverage(vec2 local, float level) {
  float span = uPitch.y * uMarkSize;
  if (uPattern == 0) return clamp(0.5 - (length(local) - 0.5 * span * max(sqrt(level), 0.14)), 0.0, 1.0);
  float arm = 0.5 * span * mix(0.3, 1.0, level);
  float width = 0.5 * uStroke;
  return clamp(0.5 - min(box(local, vec2(arm, width), width), box(local, vec2(width, arm), width)), 0.0, 1.0);
}
vec4 lineInk(vec2 rel) {
  float fx = rel.x / uPitch.x - 0.5;
  float c0 = clamp(floor(fx), 0.0, uGrid.x - 1.0);
  float c1 = min(c0 + 1.0, uGrid.x - 1.0);
  float t = clamp(fx - c0, 0.0, 1.0);
  float row = floor(rel.y / uPitch.y);
  vec4 ink = vec4(0.0);
  for (int k = -1; k <= 1; k++) {
    float cy = row + float(k);
    if (cy < 0.0 || cy >= uGrid.y) continue;
    vec4 a = texelFetch(tField, ivec2(int(c0), int(cy)), 0);
    vec4 b = texelFetch(tField, ivec2(int(c1), int(cy)), 0);
    vec4 f = mix(a, b, t);
    if (f.g < 0.002) continue;
    float y = (cy + 0.5 + f.a - 0.5) * uPitch.y;
    float slope = (b.a - a.a) * uPitch.y / uPitch.x;
    float thickness = max(uStroke, uPitch.y * uMarkSize * f.r);
    float d = abs(rel.y - y) / sqrt(1.0 + slope * slope) - 0.5 * thickness;
    float alpha = clamp(0.5 - d, 0.0, 1.0) * f.g;
    if (alpha > ink.a) ink = vec4(mix(uColor, uAccent, f.b) * alpha, alpha);
  }
  return ink;
}
void main() {
  vec2 rel = gl_FragCoord.xy - uOrigin;
  vec4 ink = vec4(0.0);
  if (uPattern == 3) {
    ink = lineInk(rel);
  } else {
    float cx = floor(rel.x / uPitch.x);
    float row = floor(rel.y / uPitch.y);
    if (cx >= 0.0 && cx < uGrid.x) {
      for (int k = -1; k <= 1; k++) {
        float cy = row + float(k);
        if (cy < 0.0 || cy >= uGrid.y) continue;
        vec4 f = texelFetch(tField, ivec2(int(cx), int(cy)), 0);
        if (f.g < 0.002) continue;
        vec2 center = (vec2(cx, cy) + 0.5) * uPitch + vec2(0.0, (f.a - 0.5) * uPitch.y);
        float alpha = coverage(rel - center, f.r) * f.g;
        if (alpha > ink.a) ink = vec4(mix(uColor, uAccent, f.b) * alpha, alpha);
      }
    }
  }
  fragColor = ink;
}
`;

type Target = { fb: WebGLFramebuffer; tex: WebGLTexture; width: number; height: number };

type Props = {
  preset?: keyof typeof PRESETS;
  /** Cor das marcas (hex). O fundo é transparente: a seção aparece por trás. */
  color?: string;
  opacity?: number;
  fade?: keyof typeof FADES;
  fadeSize?: number;
  speed?: number;
  cursorSize?: number;
  cursorStrength?: number;
  className?: string;
};

export function PatternWaves({ preset = 'silk', color = '#1E5260', opacity = 1, fade = 'edges', fadeSize = 0.5, speed, cursorSize = 50, cursorStrength = 0.6, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
    if (!canvas || !gl) return;
    const s = { ...PRESETS[preset], ...(speed !== undefined ? { speed } : {}) };
    const rgba = hexToRgba(color);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interactive = !reduce;

    // ---------- helpers de WebGL (o que o `ogl` fazia) ----------
    const program = (frag: string) => {
      const make = (type: number, src: string) => {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        return sh;
      };
      const p = gl.createProgram()!;
      gl.attachShader(p, make(gl.VERTEX_SHADER, PASS_VERTEX));
      gl.attachShader(p, make(gl.FRAGMENT_SHADER, frag));
      gl.bindAttribLocation(p, 0, 'position');
      gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const fieldProg = program(FIELD_FRAGMENT);
    const rippleProg = program(RIPPLE_FRAGMENT);
    const markProg = program(MARK_FRAGMENT);
    if (!fieldProg || !rippleProg || !markProg) return;
    const loc = (p: WebGLProgram) => {
      const cache = new Map<string, WebGLUniformLocation | null>();
      return (n: string) => {
        if (!cache.has(n)) cache.set(n, gl.getUniformLocation(p, n));
        return cache.get(n)!;
      };
    };
    const F = loc(fieldProg);
    const R = loc(rippleProg);
    const M = loc(markProg);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const makeTexture = (w: number, h: number, half: boolean) => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const filter = half ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (half) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      return tex;
    };
    const makeTarget = (w: number, h: number, half = false): Target => {
      const tex = makeTexture(w, h, half);
      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { fb, tex, width: w, height: h };
    };
    const dispose = (t: Target) => {
      gl.deleteFramebuffer(t.fb);
      gl.deleteTexture(t.tex);
    };
    const blank = makeTexture(1, 1, false);
    const draw = (prog: WebGLProgram, target: Target | null, clear = true) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
      gl.viewport(0, 0, target ? target.width : canvas.width, target ? target.height : canvas.height);
      if (clear) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const bindTex = (unit: number, tex: WebGLTexture) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
    };

    const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
    let fieldTarget = makeTarget(1, 1);
    let ripple: { width: number; height: number; read: Target; write: Target } | null = null;
    let width = 1;
    let height = 1;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let intro = 0;
    let visible = true;
    let alive = true;
    let rippleUntil = 0;
    let rippleLive = false;
    let rippleClock = 0;
    const pointer = { x: 0, y: 0, inside: false, placed: false, lastX: 0, lastY: 0, burst: 0 };

    const buildRipple = () => {
      if (!floatTargets) return;
      const w = clamp(Math.ceil(width / RIPPLE_CELL), 4, 512);
      const h = clamp(Math.ceil(height / RIPPLE_CELL), 4, 512);
      if (ripple && ripple.width === w && ripple.height === h) return;
      if (ripple) {
        dispose(ripple.read);
        dispose(ripple.write);
      }
      ripple = { width: w, height: h, read: makeTarget(w, h, true), write: makeTarget(w, h, true) };
      rippleLive = false;
    };
    const clearRipple = () => {
      if (!ripple) return;
      for (const t of [ripple.read, ripple.write]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
        gl.viewport(0, 0, t.width, t.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    const resize = () => {
      width = Math.max(1, canvas.clientWidth);
      height = Math.max(1, canvas.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)));
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      buildRipple();
      start();
    };

    const stepRipple = (dt: number) => {
      if (!ripple) return;
      rippleClock = Math.min(rippleClock + dt * RIPPLE_RATE, 4);
      const strength = clamp(cursorStrength, 0, 1);
      const moved = Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY);
      let impulse = (pointer.inside ? Math.min(moved / 14, 1) * 0.35 * strength : 0) + pointer.burst * strength;
      pointer.burst = 0;
      gl.useProgram(rippleProg);
      gl.uniform2f(R('uTexel'), 1 / ripple.width, 1 / ripple.height);
      gl.uniform2f(R('uSize'), width, height);
      gl.uniform2f(R('uFrom'), pointer.lastX, height - pointer.lastY);
      gl.uniform2f(R('uTo'), pointer.x, height - pointer.y);
      gl.uniform1f(R('uRadius'), clamp(cursorSize, 8, 400));
      gl.uniform1f(R('uDamping'), 0.975);
      gl.uniform1i(R('tState'), 0);
      while (rippleClock >= 1) {
        rippleClock -= 1;
        bindTex(0, ripple.read.tex);
        gl.uniform1f(R('uImpulse'), impulse);
        draw(rippleProg, ripple.write, false);
        const next = ripple.read;
        ripple.read = ripple.write;
        ripple.write = next;
        impulse = 0;
      }
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive) return;
      const dt = Math.min(0.05, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      const moving = !reduce && s.speed !== 0;
      if (moving) time += dt * s.speed;
      intro = reduce ? 1 : Math.min(1, intro + dt / INTRO_SECONDS);
      const appear = 1 - Math.pow(1 - clamp(intro / 0.75, 0, 1), 3);
      const rise = clamp((intro - 0.1) / 0.9, 0, 1);
      const amp = rise * rise * (3 - 2 * rise);

      const rippling = interactive && !!ripple && cursorStrength > 0;
      if (rippling && pointer.inside && !pointer.placed) {
        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
        pointer.placed = true;
      }
      if (rippling && (pointer.inside || pointer.burst > 0)) rippleUntil = now + 5000;
      const rippleActive = rippling && now < rippleUntil;
      if (rippleActive) {
        stepRipple(dt);
        rippleLive = true;
      } else if (rippleLive) {
        clearRipple();
        rippleLive = false;
      }

      const patternIndex = PATTERNS[s.pattern];
      const cw = canvas.width;
      const ch = canvas.height;
      const dpr = cw / width;
      const pitchY = Math.max(4, Math.round(clamp(s.spacing, 4, 120) * dpr));
      const pitchX = patternIndex === 3 ? Math.max(2, Math.round(pitchY / 4)) : pitchY;
      const cols = Math.min(4096, Math.ceil(cw / pitchX) + 1);
      const rows = Math.min(4096, Math.ceil(ch / pitchY) + 2);
      const origin = [Math.floor((cw - cols * pitchX) / 2), Math.floor((ch - rows * pitchY) / 2)];
      if (fieldTarget.width !== cols || fieldTarget.height !== rows) {
        dispose(fieldTarget);
        fieldTarget = makeTarget(cols, rows);
      }
      const heading = (s.direction * Math.PI) / 180;
      const lightAngle = ((s.direction + 180 + clamp(s.light, -90, 90)) * Math.PI) / 180;
      // fundo transparente: marcas escuras viram "tinta" (claro = sem marca), como no original
      const ink = luminance(rgba) < 0.5;

      gl.useProgram(fieldProg);
      gl.uniform2f(F('uSize'), width, height);
      gl.uniform1f(F('uDpr'), dpr);
      gl.uniform2f(F('uOrigin'), origin[0], origin[1]);
      gl.uniform2f(F('uPitch'), pitchX, pitchY);
      gl.uniform1i(F('uWave'), WAVES[s.wave]);
      gl.uniform1f(F('uTime'), time);
      gl.uniform1f(F('uUnit'), WAVE_UNIT * clamp(s.scale, 0.2, 5));
      gl.uniform2f(F('uHeading'), Math.cos(heading), Math.sin(heading));
      gl.uniform1f(F('uAmp'), amp);
      gl.uniform1f(F('uDepth'), clamp(s.depth, 0, 1.5));
      gl.uniform3f(F('uLight'), Math.cos(lightAngle) * 0.78, Math.sin(lightAngle) * 0.78, 0.62);
      gl.uniform1f(F('uShine'), clamp(s.shine, 0, 2));
      gl.uniform1f(F('uContrast'), clamp(s.contrast, 0.3, 3));
      gl.uniform1f(F('uInk'), ink ? 1 : 0);
      gl.uniform1f(F('uOpacity'), clamp(opacity, 0, 1));
      gl.uniform1i(F('uFade'), FADES[fade]);
      gl.uniform1f(F('uFadeSize'), clamp(fadeSize, 0.05, 1));
      gl.uniform1f(F('uAppear'), appear);
      gl.uniform1i(F('tRipple'), 0);
      bindTex(0, ripple && rippleLive ? ripple.read.tex : blank);
      gl.uniform1f(F('uRipple'), rippleLive ? 0.32 : 0);
      draw(fieldProg, fieldTarget);

      gl.useProgram(markProg);
      gl.uniform1i(M('tField'), 0);
      bindTex(0, fieldTarget.tex);
      gl.uniform2f(M('uOrigin'), origin[0], origin[1]);
      gl.uniform2f(M('uPitch'), pitchX, pitchY);
      gl.uniform2f(M('uGrid'), cols, rows);
      gl.uniform1i(M('uPattern'), patternIndex);
      gl.uniform1f(M('uMarkSize'), clamp(s.markSize, 0.05, 1));
      gl.uniform1f(M('uStroke'), patternIndex === 3 ? 0.9 * dpr : Math.max(1.1 * dpr, pitchY * 0.08));
      const tint = ink ? 0 : 1;
      const blend = ink ? 0.35 : 0.55;
      gl.uniform3f(M('uColor'), rgba[0], rgba[1], rgba[2]);
      gl.uniform3f(M('uAccent'), rgba[0] + (tint - rgba[0]) * blend, rgba[1] + (tint - rgba[1]) * blend, rgba[2] + (tint - rgba[2]) * blend);
      draw(markProg, null);

      if (visible && !document.hidden && (moving || intro < 1 || rippleActive)) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || !visible || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const locate = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= r.width && y <= r.height };
    };
    const onMove = (e: PointerEvent) => {
      const p = locate(e);
      pointer.x = p.x;
      pointer.y = p.y;
      if (p.inside !== pointer.inside) pointer.placed = false;
      pointer.inside = p.inside && e.pointerType === 'mouse';
      if (pointer.inside) start();
    };
    const onDown = (e: PointerEvent) => {
      const p = locate(e);
      if (!p.inside || (e.target as Element).closest?.('a, button, input, select, textarea, label')) return;
      pointer.x = p.x;
      pointer.y = p.y;
      if (!pointer.inside) {
        pointer.lastX = p.x;
        pointer.lastY = p.y;
      }
      pointer.burst = 1.2;
      start();
    };
    const onLeave = () => {
      pointer.inside = false;
      pointer.placed = false;
      start();
    };
    const onVis = () => {
      if (!document.hidden) start();
    };
    if (interactive) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('blur', onLeave);
    }
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      start();
    });
    io.observe(canvas);
    resize();
    canvas.classList.add('is-ready');

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      if (ripple) {
        dispose(ripple.read);
        dispose(ripple.write);
      }
      dispose(fieldTarget);
      gl.deleteTexture(blank);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      [fieldProg, rippleProg, markProg].forEach((p) => gl.deleteProgram(p));
      // sem loseContext: no StrictMode o React remonta e reaproveitaria um contexto perdido
    };
    // os parâmetros são fixos por seção
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={className ? `bg-waves ${className}` : 'bg-waves'} aria-hidden="true" />;
}
