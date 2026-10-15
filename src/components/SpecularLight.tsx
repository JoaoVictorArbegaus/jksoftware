/**
 * Reflexo especular do botão: uma faixa de luz percorre a borda arredondada e vai até o ponto mais perto do
 * cursor quando ele se aproxima; ao clicar, a luz pulsa.
 *
 * Adaptado de React Bits — SpecularButton (https://reactbits.dev), licença MIT.
 * Mudanças: em vez de um <button> próprio, é uma camada (<canvas>) que se encaixa no botão ou link pai, para
 * manter os nossos botões de vidro e links; TypeScript; só liga com mouse e fora do movimento reduzido (a
 * camada sai 24px do botão e alargaria a página no celular).
 */
import { useEffect, useRef } from 'react';

const PAD = 24;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uRadius;
uniform float uPx;
uniform float uSpot;
uniform vec2 uEntry;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform vec2 uWindow;
uniform float uThickness;
uniform float uGlow;
out vec4 outColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float loopPosition(vec2 p, vec2 b, float r) {
  vec2 inner = b - r;
  float arc = 1.5707963 * r;
  float quarter = inner.x + inner.y + arc;
  vec2 a = abs(p);
  vec2 q = a - inner;
  float s = q.x > 0.0 && q.y > 0.0
    ? inner.y + atan(q.y, q.x) * r
    : (q.x > q.y ? min(a.y, inner.y) : inner.y + arc + inner.x - min(a.x, inner.x));
  if (p.x < 0.0) s = p.y >= 0.0 ? 2.0 * quarter - s : 2.0 * quarter + s;
  else if (p.y < 0.0) s = 4.0 * quarter - s;
  return s / max(4.0 * quarter, 0.0001);
}

float lobe(float position, float center) {
  float gap = abs(fract(position - center + 0.5) - 0.5);
  return 1.0 - smoothstep(uWindow.x, uWindow.x + uWindow.y, gap);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = roundedBox(p, uHalf, uRadius);
  float position = loopPosition(p, uHalf, uRadius);
  float key = lobe(position, uSpot);
  float back = lobe(position, uSpot + 0.5);
  float streak = key + back * 0.45;
  float width = max(uThickness * uPx * mix(1.0, max(key, back), 0.6), 0.35);
  float band = smoothstep(-width - 0.6, -width + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float hair = smoothstep(-uPx - 0.6, -uPx + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float inside = 1.0 - smoothstep(-0.6, 0.6, d);
  vec2 pool = (p - uEntry) / (uHalf.y * vec2(1.6, 1.1));
  float glow = streak * 0.2 * exp(-abs(d + width * 0.5) / (5.0 * uPx)) + inside * 0.08 * exp(-dot(pool, pool));
  float light = clamp((band * streak + glow * uGlow) * uIntensity, 0.0, 1.0);
  vec4 base = vec4(uBaseColor, 1.0) * hair * 0.6;
  outColor = vec4(uLineColor, 1.0) * light + base * (1.0 - light);
}`;

const UNIFORMS = ['uCenter', 'uHalf', 'uRadius', 'uPx', 'uSpot', 'uEntry', 'uLineColor', 'uBaseColor', 'uIntensity', 'uWindow', 'uThickness', 'uGlow'] as const;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const wrap = (v: number) => v - Math.floor(v);

/** Posição (0 a 1) de um ponto ao longo do contorno do retângulo arredondado. */
function loopPosition(x: number, y: number, halfX: number, halfY: number, r: number) {
  const innerX = halfX - r;
  const innerY = halfY - r;
  const arc = (Math.PI / 2) * r;
  const quarter = innerX + innerY + arc;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const qx = ax - innerX;
  const qy = ay - innerY;
  let s: number;
  if (qx > 0 && qy > 0) s = innerY + Math.atan2(qy, qx) * r;
  else if (qx > qy) s = Math.min(ay, innerY);
  else s = innerY + arc + innerX - Math.min(ax, innerX);
  if (x < 0) s = y >= 0 ? 2 * quarter - s : 2 * quarter + s;
  else if (y < 0) s = 4 * quarter - s;
  return wrap(s / Math.max(4 * quarter, 0.0001));
}

/** Ponto do contorno correspondente a uma posição (0 a 1). */
function rimPoint(position: number, halfX: number, halfY: number, r: number): [number, number] {
  const innerX = halfX - r;
  const innerY = halfY - r;
  const arc = (Math.PI / 2) * r;
  const quarter = innerX + innerY + arc;
  let s = wrap(position) * 4 * quarter;
  let signX = 1;
  let signY = 1;
  if (s > 3 * quarter) {
    s = 4 * quarter - s;
    signY = -1;
  } else if (s > 2 * quarter) {
    s -= 2 * quarter;
    signX = -1;
    signY = -1;
  } else if (s > quarter) {
    s = 2 * quarter - s;
    signX = -1;
  }
  let x = innerX - (s - innerY - arc);
  let y = halfY;
  if (s <= innerY) {
    x = halfX;
    y = s;
  } else if (s <= innerY + arc) {
    const angle = (s - innerY) / Math.max(r, 0.0001);
    x = innerX + Math.cos(angle) * r;
    y = innerY + Math.sin(angle) * r;
  }
  return [x * signX, y * signY];
}

function link(gl: WebGL2RenderingContext) {
  const make = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s;
    gl.deleteShader(s);
    return null;
  };
  const vertex = make(gl.VERTEX_SHADER, VERTEX);
  const fragment = make(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

type Props = {
  /** Raio dos cantos do botão (999 = pílula). */
  radius?: number;
  lineColor?: [number, number, number];
  baseColor?: [number, number, number];
  intensity?: number;
  idleIntensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  glow?: number;
  proximity?: number;
};

export function SpecularLight({
  radius = 999,
  lineColor = [0.91, 1, 0.98],
  baseColor = [0.37, 0.56, 0.58],
  intensity = 1,
  idleIntensity = 0.35,
  shineSize = 10,
  shineFade = 34,
  thickness = 1.2,
  glow = 1,
  proximity = 250,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const button = canvas?.parentElement;
    if (!canvas || !button) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const reduce = false;
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) return;
    const program = link(gl);
    if (!program) return;
    canvas.classList.add('is-on');
    const u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)])) as Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const view = { width: 1, height: 1, ratio: 1 };
    const pointer = { x: 0, y: 0, known: false };
    const state = { spot: 0, level: 0, press: 0, ready: false };
    let raf = 0;
    let last = 0;
    let visible = true;

    const corner = () => Math.min(radius, view.width / 2, view.height / 2);
    // em repouso, a luz fica no canto superior esquerdo
    const restSpot = () => {
      const r = corner();
      const inset = r * (1 - Math.SQRT1_2);
      return loopPosition(inset - view.width / 2, view.height / 2 - inset, view.width / 2, view.height / 2, r);
    };
    const aim = () => {
      if (!pointer.known) return null;
      const rect = button.getBoundingClientRect();
      const scale = rect.width / view.width || 1;
      const halfX = view.width / 2;
      const halfY = view.height / 2;
      const x = (pointer.x - rect.left - rect.width / 2) / scale;
      const y = (rect.top + rect.height / 2 - pointer.y) / scale;
      const distance = Math.hypot(Math.max(Math.abs(x) - halfX, 0), Math.max(Math.abs(y) - halfY, 0));
      const t = clamp(1 - distance / proximity, 0, 1);
      const near = t * t * (3 - 2 * t);
      const nearest = loopPosition(x, y, halfX, halfY, corner());
      if (distance > 0) return { spot: nearest, near };
      // dentro do botão: a luz balança um pouco em volta do repouso, conforme a posição do cursor
      const depth = clamp(Math.min(halfX - Math.abs(x), halfY - Math.abs(y)) / (halfY * 0.8), 0, 1);
      const sway = restSpot() - (x / halfX) * 0.06 - (y / halfY) * 0.02;
      const offset = sway - nearest - Math.round(sway - nearest);
      return { spot: wrap(nearest + offset * depth * depth * (3 - 2 * depth)), near };
    };
    const draw = () => {
      const { width, height } = view;
      const sx = canvas.width / (width + PAD * 2);
      const sy = canvas.height / (height + PAD * 2);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(u.uCenter, (PAD + width / 2) * sx, (PAD + height / 2) * sy);
      gl.uniform2f(u.uHalf, (width / 2) * sx, (height / 2) * sy);
      const r = corner();
      gl.uniform1f(u.uRadius, r * sx);
      gl.uniform1f(u.uPx, view.ratio);
      const [rx, ry] = rimPoint(state.spot, width / 2, height / 2, r);
      const pull = 1 - Math.min(0.35 * (height / 2), Math.hypot(rx, ry)) / Math.max(Math.hypot(rx, ry), 0.0001);
      gl.uniform1f(u.uSpot, state.spot);
      gl.uniform2f(u.uEntry, rx * pull * sx, ry * pull * sy);
      gl.uniform3fv(u.uLineColor, lineColor);
      gl.uniform3fv(u.uBaseColor, baseColor);
      gl.uniform1f(u.uIntensity, intensity * (state.level + state.press * 0.8));
      gl.uniform2f(u.uWindow, shineSize / 360 + state.press * 0.06, shineFade / 360 + 0.0001);
      gl.uniform1f(u.uThickness, thickness);
      gl.uniform1f(u.uGlow, glow);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };
    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const target = aim();
      if (!state.ready) {
        state.spot = restSpot();
        state.level = idleIntensity;
        state.ready = true;
      }
      let diff = (target && target.near > 0 ? target.spot : restSpot()) - state.spot;
      diff -= Math.round(diff);
      state.spot = wrap(state.spot + diff * (1 - Math.exp(-dt * (reduce ? 60 : 8))));
      const level = idleIntensity + (1 - idleIntensity) * (target ? target.near : 0);
      state.level += (level - state.level) * (1 - Math.exp(-dt * 7));
      state.press *= Math.exp(-dt * 5);
      draw();
      const settling = Math.abs(diff) > 0.0002 || Math.abs(level - state.level) > 0.001 || state.press > 0.002;
      if (settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const wake = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };
    const measure = (entry?: ResizeObserverEntry) => {
      const box = entry?.borderBoxSize?.[0];
      view.width = Math.max(1, box ? box.inlineSize : button.offsetWidth);
      view.height = Math.max(1, box ? box.blockSize : button.offsetHeight);
      view.ratio = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.max(1, Math.round((view.width + PAD * 2) * view.ratio));
      canvas.height = Math.max(1, Math.round((view.height + PAD * 2) * view.ratio));
      if (state.ready) draw();
      wake();
    };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.known = true;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.known = true;
      if (!reduce) state.press = 1;
      wake();
    };
    const onLeave = () => {
      pointer.known = false;
      wake();
    };

    const ro = new ResizeObserver((entries) => measure(entries[entries.length - 1]));
    ro.observe(button);
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    });
    io.observe(button);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    button.addEventListener('pointerdown', onDown);
    measure();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      button.removeEventListener('pointerdown', onDown);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      canvas.classList.remove('is-on');
    };
    // as cores e medidas são fixas por botão
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="specular__light" aria-hidden="true" />;
}
