/**
 * Navegação com uma pílula líquida: ao trocar de item, a pílula se desfaz em gotas que voam e se juntam no
 * novo item (metaball em WebGL), com um realce que segue o hover.
 *
 * Adaptado de React Bits — GooeyNav (https://reactbits.dev), licença MIT.
 * Mudanças: TypeScript; item ativo controlado de fora (a seção visível na rolagem) e `-1` para nenhum (pílula
 * some); cores e tipografia vindas do CSS da página; sem moldura própria (o cabeçalho já é vidro); só no
 * desktop (a tela de pintura sai 72px da lista e alargaria a página no celular).
 */
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type MouseEvent } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const MAX_DROPS = 32;
const MAX_PILLS = 4;
const MARGIN = 72;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform float uRatio;
uniform vec4 uPills[${MAX_PILLS}];
uniform vec4 uHover;
uniform vec4 uDrops[${MAX_DROPS}];
uniform vec2 uTails[${MAX_DROPS}];
uniform vec3 uTints[${MAX_DROPS}];
uniform int uCount;
uniform float uSmooth;
uniform vec3 uPill;
uniform vec4 uHoverColor;
uniform float uShadow;
uniform float uAlpha;
out vec4 outColor;

float sdPill(vec2 p, vec4 box) {
  vec2 extent = max(box.zw, vec2(0.0));
  float r = min(extent.x, extent.y);
  vec2 q = abs(p - box.xy) - extent + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
vec4 blend(vec4 a, vec4 b, float k) {
  float h = clamp(0.5 + 0.5 * (b.w - a.w) / k, 0.0, 1.0);
  return vec4(mix(b.rgb, a.rgb, h), mix(b.w, a.w, h) - k * h * (1.0 - h));
}
vec4 field(vec2 p) {
  vec4 shape = vec4(uPill, 1e5);
  for (int i = 0; i < ${MAX_PILLS}; i++) {
    vec4 pill = uPills[i];
    if (pill.z <= 0.0) continue;
    shape = blend(shape, vec4(uPill, sdPill(p, pill)), uSmooth);
  }
  for (int i = 0; i < ${MAX_DROPS}; i++) {
    if (i >= uCount) break;
    vec4 drop = uDrops[i];
    if (drop.z <= 0.0) continue;
    float d = sdCapsule(p, drop.xy, drop.xy - uTails[i], drop.z);
    if (d > shape.w + uSmooth) continue;
    shape = blend(shape, vec4(uTints[i], d), uSmooth);
  }
  return shape;
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uRatio - gl_FragCoord.y) / uRatio;
  vec4 shape = field(p);
  float d = shape.w;
  float aa = max(fwidth(d), 0.35);
  float body = clamp(0.5 - d / aa, 0.0, 1.0);
  vec2 grad = vec2(dFdx(d), -dFdy(d));
  vec2 n = length(grad) > 0.0001 ? normalize(grad) : vec2(0.0, 1.0);
  float rim = (1.0 - smoothstep(0.0, 1.6, -d)) * max(0.0, -n.y) * 0.3;
  vec3 fill = mix(shape.rgb, vec3(1.0), rim) * (1.0 - 0.06 * max(0.0, n.y) * (1.0 - smoothstep(0.0, 6.0, -d)));
  float lifted = field(p - vec2(0.0, 3.0)).w;
  float shadow = (1.0 - smoothstep(-3.0, 9.0, lifted)) * uShadow * (1.0 - body);
  float hover = clamp(0.5 - sdPill(p, uHover) / aa, 0.0, 1.0) * uHoverColor.a;
  vec4 color = vec4(0.0, 0.0, 0.0, shadow);
  color = vec4(uHoverColor.rgb * hover, hover) + color * (1.0 - hover);
  // uAlpha < 1: pílula translúcida (vidro) em vez de cor chapada
  float a = body * uAlpha;
  color = vec4(fill * a, a) + color * (1.0 - a);
  outColor = color;
}
`;

type RGBA = [number, number, number, number];
const parse = (value: string): RGBA => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (m) {
    const hex = m[1].length === 3 ? m[1].replace(/./g, (d) => d + d) : m[1];
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    return [r, g, b, 1];
  }
  const rgba = /rgba?\(([^)]+)\)/i.exec(value);
  if (rgba) {
    const p = rgba[1].split(',').map((x) => parseFloat(x));
    return [p[0] / 255, p[1] / 255, p[2] / 255, p[3] ?? 1];
  }
  return [1, 1, 1, 1];
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const travelEase = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
const bezier = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};
const pillPath = (x: number, y: number, w: number, h: number) => {
  if (w <= 0.5 || h <= 0.5) return '';
  const r = Math.min(w, h) / 2;
  return `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`;
};

const UNIFORMS = ['uSize', 'uRatio', 'uPills', 'uHover', 'uDrops', 'uTails', 'uTints', 'uCount', 'uSmooth', 'uPill', 'uHoverColor', 'uShadow', 'uAlpha'] as const;
type Pipeline = { program: WebGLProgram; uniforms: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>; buffer: WebGLBuffer | null; position: number };

function build(gl: WebGL2RenderingContext): Pipeline | null {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)])) as Pipeline['uniforms'];
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  return { program, uniforms, buffer, position: gl.getAttribLocation(program, 'aPosition') };
}

type Rect = { x: number; y: number; w: number; h: number };
type PillState = { mass: number; scale: number; velocity: number; outgoing: number };
type Drop = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  size: number;
  given: number;
  source: number;
  index: number;
  leave: number;
  emerged: number;
  absorbed: number;
  state: 'waiting' | 'flying' | 'absorbing';
  start: number;
  duration: number;
  path: number[];
};

type Item = { label: string; href: string };
type Props = {
  items: Item[];
  /** Item ativo; -1 = nenhum (a pílula some). */
  activeIndex: number;
  onSelect?: (index: number) => void;
  /** Cor da pílula (o texto ativo usa `activeTextColor`). */
  color?: string;
  activeTextColor?: string;
  hoverColor?: string;
  /** Opacidade da pílula (1 = cor chapada; menor = vidro translúcido). */
  pillOpacity?: number;
  /** Força da sombra sob a pílula. */
  shadow?: number;
  animationTime?: number;
  particleCount?: number;
  timeVariance?: number;
  spread?: number;
  gooeyness?: number;
  wobble?: number;
  className?: string;
};

export function GooeyNav({
  items,
  activeIndex,
  onSelect,
  color = '#9DB0E8',
  activeTextColor = '#080D37',
  hoverColor = 'rgba(242, 246, 243, 0.1)',
  pillOpacity = 1,
  shadow = 0.4,
  animationTime = 600,
  particleCount = 15,
  timeVariance = 300,
  spread = 56,
  gooeyness = 0.5,
  wobble = 0.5,
  className = '',
}: Props) {
  const current = activeIndex >= 0 ? Math.min(activeIndex, items.length - 1) : -1;
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const overlayRef = useRef<HTMLUListElement>(null);
  const fallbackRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<{ go: (i: number) => void } | null>(null);
  const indexRef = useRef(current);
  indexRef.current = current;
  const settings = { animationTime, particleCount, timeVariance, spread, gooeyness, wobble, pillRgb: parse(color), hoverRgb: parse(hoverColor), shadow, pillOpacity };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useIsoLayoutEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const list = listRef.current;
    const overlay = overlayRef.current;
    const fallback = fallbackRef.current;
    if (!stage || !canvas || !list || !overlay || !fallback) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    const pipeline = gl ? build(gl) : null;
    fallback.style.display = pipeline ? 'none' : 'block';
    canvas.style.display = pipeline ? 'block' : 'none';

    const view = { width: 0, height: 0 };
    let rects: Rect[] = [];
    let target = -1;
    const pills = new Map<number, PillState>();
    const drops: Drop[] = [];
    const hover = { x: 0, y: 0, w: 0, h: 0, alpha: 0, index: -1 };
    const pillData = new Float32Array(MAX_PILLS * 4);
    const dropData = new Float32Array(MAX_DROPS * 4);
    const tailData = new Float32Array(MAX_DROPS * 2);
    const tintData = new Float32Array(MAX_DROPS * 3);
    let raf = 0;
    let last = 0;
    let disposed = false;

    const measure = () => {
      const box = stage.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      view.width = box.width;
      view.height = box.height;
      const ow = box.width + MARGIN * 2;
      const oh = box.height + MARGIN * 2;
      Object.assign(canvas.style, { left: `${-MARGIN}px`, top: `${-MARGIN}px`, width: `${ow}px`, height: `${oh}px` });
      const w = Math.max(1, Math.round(ow * ratio));
      const h = Math.max(1, Math.round(oh * ratio));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      rects = Array.from(list.children).map((item) => {
        const r = item.getBoundingClientRect();
        return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
      });
    };

    type Box = { cx: number; cy: number; hw: number; hh: number };
    type Blob = { x: number; y: number; r: number; tx: number; ty: number };
    // contorno da forma atual em retângulos de 1px de altura: recorta a lista com o texto escuro (sobre a pílula)
    const trace = (boxes: Box[], blobs: Blob[], smooth: number) => {
      const fieldAt = (x: number, y: number) => {
        let d = 1e5;
        const merge = (v: number) => {
          const h = clamp01(0.5 + (0.5 * (v - d)) / smooth);
          d = v + (d - v) * h - smooth * h * (1 - h);
        };
        for (const b of boxes) {
          const r = Math.min(b.hw, b.hh);
          const qx = Math.abs(x - b.cx) - b.hw + r;
          const qy = Math.abs(y - b.cy) - b.hh + r;
          merge(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r);
        }
        for (const b of blobs) {
          const px = x - b.x;
          const py = y - b.y;
          const bx = -b.tx;
          const by = -b.ty;
          const span = bx * bx + by * by;
          const h = span > 0.0001 ? clamp01((px * bx + py * by) / span) : 0;
          const v = Math.hypot(px - bx * h, py - by * h) - b.r;
          if (v > d + smooth) continue;
          merge(v);
        }
        return d;
      };
      const step = 2;
      const parts: string[] = [];
      for (let y = 0; y < view.height; y += 1) {
        const cy = y + 0.5;
        let prev = fieldAt(0, cy);
        let start: number | null = prev < 0 ? 0 : null;
        for (let x = step; x <= view.width + step; x += step) {
          const v = fieldAt(Math.min(x, view.width), cy);
          if (prev < 0 !== v < 0) {
            const cross = x - step + (step * prev) / (prev - v);
            if (v < 0) start = cross;
            else if (start !== null) {
              parts.push(`M${start.toFixed(1)},${y}H${cross.toFixed(1)}V${y + 1}H${start.toFixed(1)}Z`);
              start = null;
            }
          }
          prev = v;
        }
        if (start !== null) parts.push(`M${start.toFixed(1)},${y}H${view.width}V${y + 1}H${start.toFixed(1)}Z`);
      }
      return parts.join('');
    };

    const pill = (i: number) => {
      if (!pills.has(i)) pills.set(i, { mass: 0, scale: 0, velocity: 0, outgoing: 0 });
      return pills.get(i)!;
    };
    const shape = (i: number, amount: number) => {
      const r = rects[i];
      if (!r || amount <= 0.002) return null;
      const h = r.h * Math.min(1.08, 0.42 + 0.58 * Math.sqrt(Math.max(0, amount)));
      const w = Math.max(h, r.w * Math.max(0, amount) ** 0.75);
      return { x: r.x + r.w / 2 - w / 2, y: r.y + r.h / 2 - h / 2, w, h };
    };
    const plan = (drop: Drop, i: number, now: number, fresh: boolean) => {
      const s = settingsRef.current;
      const r = rects[i];
      if (!r) return;
      const reach = Math.max(0, s.spread);
      const ex = r.x + r.w / 2 + (Math.random() - 0.5) * r.w * 0.45;
      const ey = r.y + r.h / 2 + (Math.random() - 0.5) * r.h * 0.2;
      const base = Math.max(0.15, s.animationTime / 1000);
      const variance = (Math.random() - 0.5) * (Math.max(0, s.timeVariance) / 1000);
      const duration = Math.max(0.15, base * (0.62 + Math.random() * 0.32) + variance * 0.6);
      const out = Math.random() * Math.PI * 2;
      const into = Math.random() * Math.PI * 2;
      const burst = reach * (0.7 + Math.random() * 0.6);
      const swing = reach * (0.55 + Math.random() * 0.55);
      const carry = Math.min(duration / 3, 0.12);
      drop.index = i;
      drop.start = now;
      drop.duration = duration;
      drop.path = [
        drop.x,
        drop.y,
        fresh ? drop.x + Math.cos(out) * burst * 1.6 : drop.x + drop.vx * carry,
        fresh ? drop.y + Math.sin(out) * burst * 1.6 : drop.y + drop.vy * carry,
        ex + Math.cos(into) * swing * 1.5,
        ey + Math.sin(into) * swing * 1.5,
        ex,
        ey,
      ];
    };
    const emit = (from: number, to: number, now: number) => {
      const s = settingsRef.current;
      const source = pills.get(from);
      const r = rects[from];
      if (!source || !r || !rects[to]) return;
      const available = source.mass - source.outgoing;
      if (available <= 0.002) return;
      const room = MAX_DROPS - drops.length;
      const count = Math.min(room, Math.max(1, Math.round(Math.max(1, s.particleCount) * available)));
      if (count <= 0) return;
      const leaveWindow = Math.max(0.15, s.animationTime / 1000) * 0.16;
      for (let i = 0; i < count; i++) {
        const mass = available / count;
        source.outgoing += mass;
        drops.push({
          x: r.x + r.w / 2 + (Math.random() - 0.5) * r.w * 0.6,
          y: r.y + r.h / 2 + (Math.random() - 0.5) * r.h * 0.3,
          vx: 0,
          vy: 0,
          mass,
          size: 0.8 + Math.random() * 0.4,
          given: 0,
          source: from,
          index: to,
          leave: now + Math.random() * leaveWindow * 1000,
          emerged: 0,
          absorbed: 0,
          state: 'waiting',
          start: 0,
          duration: 0,
          path: [],
        });
      }
    };

    const render = () => {
      const s = settingsRef.current;
      const height = rects[target]?.h ?? rects[0]?.h ?? 36;
      const smooth = height * (0.18 + 0.5 * clamp01(s.gooeyness));
      const boxes: Box[] = [];
      const blobs: Blob[] = [];
      for (const [i, st] of pills) {
        const b = shape(i, st.scale);
        if (b) boxes.push({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, hw: b.w / 2, hh: b.h / 2 });
      }
      for (const d of drops) {
        if (d.state === 'waiting') continue;
        const radius = 0.26 * height * d.size * Math.min(d.emerged, 1 - d.absorbed);
        if (radius <= 0.05) continue;
        const speed = Math.hypot(d.vx, d.vy);
        const length = Math.min(radius * 1.1, speed * 0.018);
        blobs.push({ x: d.x, y: d.y, r: radius, tx: speed > 0.01 ? (d.vx / speed) * length : 0, ty: speed > 0.01 ? (d.vy / speed) * length : 0 });
      }
      if (boxes.length === 1 && !blobs.length) {
        const b = boxes[0];
        overlay.style.clipPath = `path('${pillPath(b.cx - b.hw, b.cy - b.hh, b.hw * 2, b.hh * 2)}')`;
      } else {
        overlay.style.clipPath = `path('${trace(boxes, blobs, smooth) || 'M0,0Z'}')`;
      }
      overlay.style.visibility = 'visible';

      if (!pipeline || !gl) {
        const b = target >= 0 ? shape(target, 1) : null;
        if (b) {
          fallback.style.transform = `translate(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px)`;
          fallback.style.width = `${b.w}px`;
          fallback.style.height = `${b.h}px`;
        }
        fallback.style.opacity = b ? String(s.pillOpacity) : '0';
        return;
      }
      let slot = 0;
      for (const b of boxes) {
        if (slot >= MAX_PILLS) break;
        pillData[slot * 4] = b.cx + MARGIN;
        pillData[slot * 4 + 1] = b.cy + MARGIN;
        pillData[slot * 4 + 2] = b.hw;
        pillData[slot * 4 + 3] = b.hh;
        slot += 1;
      }
      pillData.fill(0, slot * 4);
      let count = 0;
      for (const b of blobs) {
        if (count >= MAX_DROPS) break;
        dropData[count * 4] = b.x + MARGIN;
        dropData[count * 4 + 1] = b.y + MARGIN;
        dropData[count * 4 + 2] = b.r;
        dropData[count * 4 + 3] = 0;
        tailData[count * 2] = b.tx;
        tailData[count * 2 + 1] = b.ty;
        tintData[count * 3] = s.pillRgb[0];
        tintData[count * 3 + 1] = s.pillRgb[1];
        tintData[count * 3 + 2] = s.pillRgb[2];
        count += 1;
      }
      const { program, uniforms: u, buffer, position } = pipeline;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(u.uSize, view.width + MARGIN * 2, view.height + MARGIN * 2);
      gl.uniform1f(u.uRatio, canvas.width / Math.max(1, view.width + MARGIN * 2));
      gl.uniform4fv(u.uPills, pillData);
      gl.uniform4f(u.uHover, hover.x + MARGIN, hover.y + MARGIN, hover.w / 2, hover.h / 2);
      gl.uniform4fv(u.uDrops, dropData);
      gl.uniform2fv(u.uTails, tailData);
      gl.uniform3fv(u.uTints, tintData);
      gl.uniform1i(u.uCount, count);
      gl.uniform1f(u.uSmooth, smooth);
      gl.uniform3f(u.uPill, s.pillRgb[0], s.pillRgb[1], s.pillRgb[2]);
      gl.uniform4f(u.uHoverColor, s.hoverRgb[0], s.hoverRgb[1], s.hoverRgb[2], s.hoverRgb[3] * hover.alpha);
      gl.uniform1f(u.uShadow, s.shadow);
      gl.uniform1f(u.uAlpha, s.pillOpacity);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = (now: number) => {
      raf = 0;
      const s = settingsRef.current;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      const emergeTime = 0.09;
      const absorbTime = 0.12;
      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        if (drop.state === 'waiting') {
          if (now < drop.leave) continue;
          drop.state = 'flying';
          plan(drop, drop.index, now, true);
        }
        if (drop.state === 'flying') {
          drop.emerged = Math.min(1, drop.emerged + dt / emergeTime);
          const source = pills.get(drop.source);
          if (source && drop.given < drop.mass) {
            const step = Math.min(drop.mass * (dt / emergeTime), drop.mass - drop.given);
            source.mass = Math.max(0, source.mass - step);
            source.outgoing = Math.max(0, source.outgoing - step);
            drop.given += step;
          }
          const t = clamp01((now - drop.start) / 1000 / drop.duration);
          const e = travelEase(t);
          const [x0, y0, x1, y1, x2, y2, x3, y3] = drop.path;
          const x = bezier(x0, x1, x2, x3, e);
          const y = bezier(y0, y1, y2, y3, e);
          if (dt > 0) {
            drop.vx = (x - drop.x) / dt;
            drop.vy = (y - drop.y) / dt;
          }
          drop.x = x;
          drop.y = y;
          if (t >= 1) drop.state = 'absorbing';
        }
        if (drop.state === 'absorbing') {
          const step = Math.min(1 - drop.absorbed, dt / absorbTime);
          drop.absorbed += step;
          drop.vx *= 0.8;
          drop.vy *= 0.8;
          const host = pill(drop.index);
          host.mass = Math.min(1, host.mass + drop.mass * step);
          if (drop.absorbed >= 1) drops.splice(i, 1);
        }
      }
      // sem gotas no ar, nada está em trânsito: só o item ativo fica com pílula. Sem isso, trocas rápidas (ou o
      // menu apagando a pílula no meio de uma viagem) deixavam pedaços presos nos outros itens.
      if (drops.length === 0) {
        for (const [i, st] of pills) {
          st.outgoing = 0;
          if (i !== target) st.mass = 0;
          else if (st.mass < 1 && target >= 0) st.mass = 1;
        }
      }
      // mola de cada pílula: cresce até a massa recebida, com um pouco de balanço
      const zeta = reduced ? 1 : 1 - 0.72 * clamp01(s.wobble);
      const omega = 26;
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      for (const [i, st] of pills) {
        for (let n = 0; n < steps; n++) {
          st.velocity += (omega * omega * (st.mass - st.scale) - 2 * zeta * omega * st.velocity) * h;
          st.scale += st.velocity * h;
        }
        if (i !== target && st.mass <= 0.002 && st.outgoing <= 0.002 && Math.abs(st.scale) < 0.004) pills.delete(i);
      }
      if (hover.index >= 0 && rects[hover.index]) {
        const r = rects[hover.index];
        const k = 1 - Math.exp(-dt / 0.06);
        hover.x += (r.x + r.w / 2 - hover.x) * k;
        hover.y += (r.y + r.h / 2 - hover.y) * k;
        hover.w += (r.w - hover.w) * k;
        hover.h += (r.h - hover.h) * k;
      }
      const hoverGoal = hover.index >= 0 && hover.index !== target ? 1 : 0;
      hover.alpha += (hoverGoal - hover.alpha) * (1 - Math.exp(-dt / 0.08));
      render();

      const host = pills.get(target);
      const resting = drops.length === 0 && (target < 0 ? pills.size === 0 : pills.size === 1 && host && Math.abs(host.mass - host.scale) < 0.0008 && Math.abs(host.velocity) < 0.004);
      const hr = rects[hover.index];
      const hovering = Math.abs(hoverGoal - hover.alpha) > 0.003 || (hr && Math.abs(hr.x + hr.w / 2 - hover.x) + Math.abs(hr.w - hover.w) > 0.1);
      if (!resting || hovering) raf = requestAnimationFrame(frame);
      else {
        if (host) {
          host.mass = 1;
          host.scale = 1;
          host.velocity = 0;
        }
        hover.alpha = hoverGoal;
        render();
      }
    };
    const wake = () => {
      if (raf || disposed) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const settle = (i: number) => {
      pills.clear();
      drops.length = 0;
      target = i;
      if (i >= 0) {
        const st = pill(i);
        st.mass = 1;
        st.scale = 1;
        st.velocity = 0;
      }
      render();
    };
    const go = (i: number, animate: boolean) => {
      if (i === target) return;
      // sem item ativo: a pílula encolhe até sumir
      if (i < 0) {
        target = -1;
        for (const st of pills.values()) {
          st.mass = 0;
          st.outgoing = 0;
        }
        drops.length = 0;
        if (reduced) settle(-1);
        else wake();
        return;
      }
      if (!rects[i] || !animate || reduced || target < 0) {
        if (target < 0 && !reduced && rects[i]) {
          // aparece crescendo no próprio item
          target = i;
          pill(i).mass = 1;
          wake();
          return;
        }
        settle(i);
        return;
      }
      const now = performance.now();
      target = i;
      pill(i);
      for (const drop of drops) {
        drop.index = i;
        if (drop.state === 'flying') plan(drop, i, now, false);
        if (drop.state === 'absorbing') {
          drop.state = 'flying';
          drop.mass *= 1 - drop.absorbed;
          drop.absorbed = 0;
          plan(drop, i, now, false);
        }
      }
      for (const from of [...pills.keys()]) if (from !== i) emit(from, i, now);
      wake();
    };
    const onOver = (e: PointerEvent) => {
      const item = (e.target as Element).closest<HTMLElement>('[data-gooey-index]');
      if (!item || !list.contains(item)) return;
      const i = Number(item.dataset.gooeyIndex);
      const r = rects[i];
      if (!r) return;
      if (hover.alpha < 0.01) {
        hover.x = r.x + r.w / 2;
        hover.y = r.y + r.h / 2;
        hover.w = r.w;
        hover.h = r.h;
      }
      hover.index = i;
      wake();
    };
    const onLeave = () => {
      hover.index = -1;
      wake();
    };

    const ro = new ResizeObserver(() => {
      measure();
      if (!drops.length) settle(target);
      else render();
    });
    ro.observe(stage);
    ro.observe(list);
    list.addEventListener('pointerover', onOver);
    list.addEventListener('pointerleave', onLeave);
    measure();
    settle(indexRef.current);
    document.fonts?.ready.then(() => {
      if (disposed) return;
      measure();
      if (!drops.length) settle(target);
    });
    engineRef.current = { go: (i: number) => go(i, true) };

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      list.removeEventListener('pointerover', onOver);
      list.removeEventListener('pointerleave', onLeave);
      if (gl && pipeline) {
        gl.deleteBuffer(pipeline.buffer);
        gl.deleteProgram(pipeline.program);
      }
      engineRef.current = null;
    };
  }, [items.length]);

  useEffect(() => {
    engineRef.current?.go(current);
  }, [current]);

  const labels = (interactive: boolean) =>
    items.map((item, i) =>
      interactive ? (
        <li key={item.href} className="gooey-nav__item" data-gooey-index={i} data-active={i === current ? '' : undefined}>
          <a
            href={item.href}
            className={i === current ? 'gooey-nav__link is-active' : 'gooey-nav__link'}
            aria-current={i === current ? 'true' : undefined}
            onClick={(e: MouseEvent) => {
              if (e.defaultPrevented) return;
              onSelect?.(i);
            }}
          >
            {item.label}
          </a>
        </li>
      ) : (
        <li key={item.href} className="gooey-nav__item">
          <span className="gooey-nav__link">{item.label}</span>
        </li>
      ),
    );

  return (
    <div className={`gooey-nav ${className}`.trim()} style={{ '--gn-pill': color, '--gn-active-ink': activeTextColor } as CSSProperties}>
      <div ref={stageRef} className="gooey-nav__stage">
        <canvas ref={canvasRef} className="gooey-nav__canvas" aria-hidden="true" />
        <span ref={fallbackRef} className="gooey-nav__fallback" aria-hidden="true" />
        <ul ref={listRef} className="gooey-nav__list">
          {labels(true)}
        </ul>
        {/* cópia com o texto escuro, recortada no formato da pílula */}
        <ul ref={overlayRef} className="gooey-nav__list gooey-nav__list--active" aria-hidden="true">
          {labels(false)}
        </ul>
      </div>
    </div>
  );
}
