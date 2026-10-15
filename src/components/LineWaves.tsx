/**
 * Fundo de linhas onduladas: feixes de linhas que se deformam devagar e se curvam perto do cursor.
 *
 * Adaptado de React Bits — LineWaves (https://reactbits.dev), licença MIT.
 * Mudanças: WebGL direto em vez da biblioteca `ogl` (sem dependência nova); TypeScript; camada decorativa
 * dentro da seção (cursor lido da janela, não do canvas, que fica atrás do conteúdo); pausa fora da tela e
 * com a aba oculta; um quadro parado com movimento reduzido; cores da marca.
 */
import { useEffect, useRef } from 'react';

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uInnerLines;
uniform float uOuterLines;
uniform float uWarpIntensity;
uniform float uRotation;
uniform float uEdgeFadeWidth;
uniform float uColorCycleSpeed;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform float uEnableMouse;

#define HALF_PI 1.5707963

float hashF(float n) { return fract(sin(n * 127.1) * 43758.5453123); }
float smoothNoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hashF(i), hashF(i + 1.0), u);
}
float displaceA(float coord, float t) {
  return sin(coord * 2.123) * 0.2 + sin(coord * 3.234 + t * 4.345) * 0.1 + sin(coord * 0.589 + t * 0.934) * 0.5;
}
float displaceB(float coord, float t) {
  return sin(coord * 1.345) * 0.3 + sin(coord * 2.734 + t * 3.345) * 0.2 + sin(coord * 0.189 + t * 0.934) * 0.3;
}
vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  vec2 coords = gl_FragCoord.xy / uResolution.xy;
  coords = coords * 2.0 - 1.0;
  coords = rotate2D(coords, uRotation);
  float halfT = uTime * uSpeed * 0.5;
  float fullT = uTime * uSpeed;

  float mouseWarp = 0.0;
  if (uEnableMouse > 0.5) {
    vec2 mPos = rotate2D(uMouse * 2.0 - 1.0, uRotation);
    float mDist = length(coords - mPos);
    mouseWarp = uMouseInfluence * exp(-mDist * mDist * 4.0);
  }

  float warpAx = coords.x + displaceA(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpAy = coords.y - displaceA(coords.x * cos(fullT) * 1.235, halfT) * uWarpIntensity;
  float warpBx = coords.x + displaceB(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpBy = coords.y - displaceB(coords.x * sin(fullT) * 1.235, halfT) * uWarpIntensity;
  vec2 fieldA = vec2(warpAx, warpAy);
  vec2 fieldB = vec2(warpBx, warpBy);
  vec2 blended = mix(fieldA, fieldB, mix(fieldA, fieldB, 0.5));

  float fadeTop = smoothstep(uEdgeFadeWidth, uEdgeFadeWidth + 0.4, blended.y);
  float fadeBottom = smoothstep(-uEdgeFadeWidth, -(uEdgeFadeWidth + 0.4), blended.y);
  float vMask = 1.0 - max(fadeTop, fadeBottom);
  float tileCount = mix(uOuterLines, uInnerLines, vMask);
  float scaledY = blended.y * tileCount;
  float nY = smoothNoise(abs(scaledY));
  float ridge = pow(step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)), 5.0);

  float lines = 0.0;
  for (float i = 1.0; i < 3.0; i += 1.0) lines += pow(max(fract(scaledY), fract(-scaledY)), i * 2.0);
  float pattern = vMask * lines;

  float cycleT = fullT * uColorCycleSpeed;
  float r = (pattern + lines * ridge) * (cos(blended.y + cycleT * 0.234) * 0.5 + 1.0);
  float g = (pattern + vMask * ridge) * (sin(blended.x + cycleT * 1.745) * 0.5 + 1.0);
  float b = (pattern + lines * ridge) * (cos(blended.x + cycleT * 0.534) * 0.5 + 1.0);
  vec3 col = (r * uColor1 + g * uColor2 + b * uColor3) * uBrightness;
  gl_FragColor = vec4(col, clamp(length(col), 0.0, 1.0));
}
`;

const hexToVec3 = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
};

type Props = {
  speed?: number;
  innerLineCount?: number;
  outerLineCount?: number;
  warpIntensity?: number;
  /** Graus. */
  rotation?: number;
  edgeFadeWidth?: number;
  colorCycleSpeed?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  mouseInfluence?: number;
  className?: string;
};

export function LineWaves({
  speed = 0.3,
  innerLineCount = 32,
  outerLineCount = 36,
  warpIntensity = 1,
  rotation = -45,
  edgeFadeWidth = 0,
  colorCycleSpeed = 1,
  brightness = 0.2,
  color1 = '#ffffff',
  color2 = '#ffffff',
  color3 = '#ffffff',
  mouseInfluence = 2,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!canvas || !gl) return;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(program, n);
    const uTime = u('uTime');
    const uRes = u('uResolution');
    const uMouse = u('uMouse');
    gl.uniform1f(u('uSpeed'), speed);
    gl.uniform1f(u('uInnerLines'), innerLineCount);
    gl.uniform1f(u('uOuterLines'), outerLineCount);
    gl.uniform1f(u('uWarpIntensity'), warpIntensity);
    gl.uniform1f(u('uRotation'), (rotation * Math.PI) / 180);
    gl.uniform1f(u('uEdgeFadeWidth'), edgeFadeWidth);
    gl.uniform1f(u('uColorCycleSpeed'), colorCycleSpeed);
    gl.uniform1f(u('uBrightness'), brightness);
    gl.uniform3fv(u('uColor1'), hexToVec3(color1));
    gl.uniform3fv(u('uColor2'), hexToVec3(color2));
    gl.uniform3fv(u('uColor3'), hexToVec3(color3));
    gl.uniform1f(u('uMouseInfluence'), mouseInfluence);
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gl.uniform1f(u('uEnableMouse'), fine && !reduce ? 1 : 0);
    gl.clearColor(0, 0, 0, 0);

    const mouse = [0.5, 0.5];
    const target = [0.5, 0.5];
    let raf = 0;
    let visible = true;
    let t0 = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform3f(uRes, canvas.width, canvas.height, canvas.width / canvas.height);
    };
    const draw = (now: number) => {
      gl.uniform1f(uTime, (now - t0) * 0.001);
      mouse[0] += 0.05 * (target[0] - mouse[0]);
      mouse[1] += 0.05 * (target[1] - mouse[1]);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      draw(now);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && visible && !reduce) raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = canvas.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      target[0] = inside ? (e.clientX - r.left) / r.width : 0.5;
      target[1] = inside ? 1 - (e.clientY - r.top) / r.height : 0.5;
    };

    resize();
    t0 = performance.now() - 4000; // começa já com as linhas em movimento, não no padrão inicial
    draw(performance.now());
    canvas.classList.add('is-ready');
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      start();
    });
    io.observe(canvas);
    const onVis = () => start();
    document.addEventListener('visibilitychange', onVis);
    if (fine && !reduce) window.addEventListener('pointermove', onMove, { passive: true });
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      // sem loseContext: no StrictMode o React remonta e reaproveitaria um contexto perdido
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
    // os parâmetros são fixos por seção
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={className ? `bg-waves ${className}` : 'bg-waves'} aria-hidden="true" />;
}
