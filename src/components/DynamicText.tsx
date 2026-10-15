/**
 * Texto que troca de palavra com as letras como objetos físicos: as letras em comum viajam até o novo lugar
 * num arco com mola, as que saem caem da linha de base e as que entram descem e pousam.
 *
 * Adaptado de kokonutui — Dynamic Text (https://kokonutui.com), por @dorianbaffier, licença MIT.
 * Mudanças: só o modo `morph`; sem Tailwind nem `cn`; o leitor de tela recebe a lista inteira uma vez (sem
 * anunciar cada troca); para depois de `rounds` voltas (conteúdo que se move sozinho por muito tempo precisa
 * parar, WCAG 2.2.2); com movimento reduzido mostra só a primeira palavra.
 */
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const splitGraphemes = (v: string) => (segmenter ? Array.from(segmenter.segment(v), (s) => s.segment) : Array.from(v));
const isBlank = (c: string) => c.trim() === '';
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

type Phase = 'rest' | 'travel' | 'drop' | 'fall' | 'fade';
type Glyph = {
  id: number;
  char: string;
  el: HTMLSpanElement | null;
  phase: Phase;
  leaving: boolean;
  delay: number;
  x: number;
  vx: number;
  tx: number;
  x0: number;
  arc: number;
  y: number;
  vy: number;
  ty: number;
  r: number;
  vr: number;
  tr: number;
  sq: number;
  vsq: number;
  o: number;
};
type Token = { char: string; x: number };
type GlyphView = { id: number; char: string };

const STEP = 1 / 120;
const damping = (k: number, zeta: number) => 2 * zeta * Math.sqrt(k);
const TRAVEL_K = 140;
const TRAVEL_C = damping(TRAVEL_K, 0.8);
const LIFT_K = 300;
const LIFT_C = damping(LIFT_K, 0.9);
const SQUASH_K = 1400;
const SQUASH_C = damping(SQUASH_K, 0.6);
const TILT_K = 140;
const TILT_C = damping(TILT_K, 0.7);
const WIDTH_K = 220;
const WIDTH_C = damping(WIDTH_K, 1);
const GRAVITY = 32; // em/s²
const DROP = 0.7;
const FALL_FADE = 0.9;
const LAND_SQUASH = -0.16;
const ENTER_STAGGER = 0.035;
const MAX_ENTER_SPREAD = 0.45;
const FADE_RATE = 7;

function paint(g: Glyph) {
  if (!g.el) return;
  const sy = 1 + g.sq;
  const sx = 1 - g.sq * 0.6;
  g.el.style.transform = `translate3d(${g.x.toFixed(2)}px, ${g.y.toFixed(2)}px, 0) rotate(${g.r.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
  g.el.style.opacity = g.o.toFixed(3);
}

function stepGlyph(g: Glyph, h: number, em: number) {
  if (g.phase === 'travel') {
    // arco raso com pico na metade: letras que se cruzam passam por cima e por baixo, não através
    const span = Math.abs(g.tx - g.x0);
    const p = span < 0.5 ? 1 : clamp01(1 - Math.abs(g.tx - g.x) / span);
    g.ty = g.arc * 4 * p * (1 - p);
    g.vx += (-TRAVEL_K * (g.x - g.tx) - TRAVEL_C * g.vx) * h;
    g.x += g.vx * h;
    g.vy += (-LIFT_K * (g.y - g.ty) - LIFT_C * g.vy) * h;
    g.y += g.vy * h;
    g.o = Math.min(1, g.o + FADE_RATE * h);
  } else if (g.phase === 'drop') {
    g.vy += GRAVITY * em * h;
    g.y += g.vy * h;
    if (g.y >= 0) {
      g.y = 0;
      g.vy = 0;
      g.sq = LAND_SQUASH; // pousa com um achatamento
      g.phase = 'rest';
    }
    g.o = clamp01(1 + g.y / (DROP * em));
  } else if (g.phase === 'fall') {
    g.vy += GRAVITY * em * h;
    g.y += g.vy * h;
    g.x += g.vx * h;
    g.vr += (-TILT_K * (g.r - g.tr) - TILT_C * g.vr) * h;
    g.r += g.vr * h;
    g.o = Math.min(g.o, clamp01(1 - g.y / (FALL_FADE * em)));
  } else if (g.phase === 'fade') {
    g.o = clamp01(g.o + (g.leaving ? -FADE_RATE : FADE_RATE) * h);
  }
  if (g.sq !== 0 || g.vsq !== 0) {
    g.vsq += (-SQUASH_K * g.sq - SQUASH_C * g.vsq) * h;
    g.sq += g.vsq * h;
    if (Math.abs(g.sq) < 0.001 && Math.abs(g.vsq) < 0.01) {
      g.sq = 0;
      g.vsq = 0;
    }
  }
}

const isGone = (g: Glyph) => g.leaving && g.o <= 0.002;

function settle(g: Glyph) {
  if (g.leaving) return !isGone(g);
  const arrived = Math.abs(g.x - g.tx) < 0.05 && Math.abs(g.vx) < 0.5 && Math.abs(g.y) < 0.05 && Math.abs(g.vy) < 0.5;
  if ((g.phase === 'travel' && arrived) || (g.phase === 'fade' && g.o >= 1)) {
    g.x = g.tx;
    g.y = 0;
    g.vx = 0;
    g.vy = 0;
    g.o = 1;
    g.phase = 'rest';
  }
  return g.phase !== 'rest' || g.sq !== 0;
}

class MorphEngine {
  glyphs: Glyph[] = [];
  order: Glyph[] = [];
  root: HTMLSpanElement | null = null;
  onChange: (() => void) | null = null;
  reduced = false;
  started = false;
  em = 16;
  w = 0;
  vw = 0;
  tw = 0;
  private nextId = 0;
  private raf = 0;
  private last = 0;
  private readonly refs = new Map<number, (el: HTMLSpanElement | null) => void>();

  views(): GlyphView[] {
    return this.glyphs.map((g) => ({ id: g.id, char: g.char }));
  }
  refFor(id: number) {
    let ref = this.refs.get(id);
    if (!ref) {
      ref = (el) => {
        const g = this.glyphs.find((x) => x.id === id);
        if (g) {
          g.el = el;
          paint(g);
        }
      };
      this.refs.set(id, ref);
    }
    return ref;
  }
  private create(t: Token): Glyph {
    const g: Glyph = { id: this.nextId++, char: t.char, el: null, phase: 'rest', leaving: false, delay: 0, x: t.x, vx: 0, tx: t.x, x0: t.x, arc: 0, y: 0, vy: 0, ty: 0, r: 0, vr: 0, tr: 0, sq: 0, vsq: 0, o: 1 };
    this.glyphs.push(g);
    return g;
  }
  update(tokens: Token[], width: number) {
    if (!this.started) {
      // primeira pintura: tudo no lugar, sem animação
      this.started = true;
      this.order = tokens.map((t) => this.create(t));
      this.w = width;
      this.tw = width;
      this.paintWidth();
      return;
    }
    const instant = this.reduced;
    const letters = new Map<string, Glyph[]>();
    for (const g of this.order) letters.set(g.char, [...(letters.get(g.char) ?? []), g]);
    const next: Glyph[] = [];
    let entering = 0;
    for (const t of tokens) {
      const old = letters.get(t.char)?.shift();
      if (old) {
        old.tx = t.x;
        if (instant) {
          old.x = t.x;
          old.y = 0;
          old.phase = old.o < 1 ? 'fade' : 'rest';
        } else if (!(old.phase === 'rest' && Math.abs(t.x - old.x) < 0.5)) {
          old.x0 = old.x;
          old.delay = 0;
          const distance = t.x - old.x;
          old.arc = -Math.sign(distance) * Math.min(0.22 * this.em, Math.abs(distance) * 0.14);
          old.phase = 'travel';
        } else old.x = t.x;
        next.push(old);
        continue;
      }
      const g = this.create(t);
      g.o = 0;
      if (instant) g.phase = 'fade';
      else {
        g.y = -DROP * this.em;
        g.phase = 'drop';
        g.delay = entering * ENTER_STAGGER;
      }
      entering++;
      next.push(g);
    }
    const spread = entering * ENTER_STAGGER;
    if (spread > MAX_ENTER_SPREAD) for (const g of next) g.delay *= MAX_ENTER_SPREAD / spread;
    for (const list of letters.values()) {
      for (const g of list) {
        g.leaving = true;
        g.delay = 0;
        if (instant) {
          g.phase = 'fade';
          continue;
        }
        // tomba para o lado em que está, 5-15°, e escorrega um pouco para lá
        const side = g.x + this.em * 0.3 < this.tw / 2 ? -1 : 1;
        g.tr = side * (5 + ((g.id * 7) % 11));
        g.vx = side * 0.4 * this.em;
        g.vy = Math.max(g.vy, 0);
        g.phase = 'fall';
      }
    }
    this.order = next;
    this.tw = width;
    if (instant) {
      this.w = width;
      this.vw = 0;
      this.paintWidth();
    }
  }
  place(tokens: Token[], width: number) {
    if (tokens.length !== this.order.length) return;
    tokens.forEach((t, i) => {
      const g = this.order[i];
      if (!g) return;
      g.tx = t.x;
      if (g.phase === 'rest') {
        g.x = t.x;
        paint(g);
      }
    });
    this.tw = width;
    if (!this.raf) {
      this.w = width;
      this.paintWidth();
    }
  }
  private paintWidth() {
    if (this.root) this.root.style.width = `${this.w.toFixed(2)}px`;
  }
  private stepWidth(dt: number) {
    if (Math.abs(this.w - this.tw) < 0.1 && Math.abs(this.vw) < 0.1) {
      if (this.w !== this.tw) {
        this.w = this.tw;
        this.vw = 0;
        this.paintWidth();
      }
      return false;
    }
    let t = dt;
    while (t > 1e-6) {
      const h = Math.min(STEP, t);
      this.vw += (-WIDTH_K * (this.w - this.tw) - WIDTH_C * this.vw) * h;
      this.w += this.vw * h;
      t -= h;
    }
    this.paintWidth();
    return true;
  }
  private readonly tick = (now: number) => {
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    let moving = false;
    for (const g of this.glyphs) {
      if (g.delay > 0) {
        g.delay -= dt;
        moving = true;
        continue;
      }
      let t = dt;
      while (t > 1e-6) {
        const h = Math.min(STEP, t);
        stepGlyph(g, h, this.em);
        t -= h;
      }
      if (settle(g)) moving = true;
      paint(g);
    }
    const resizing = this.stepWidth(dt);
    if (this.glyphs.some(isGone)) {
      for (const g of this.glyphs) if (isGone(g)) this.refs.delete(g.id);
      this.glyphs = this.glyphs.filter((g) => !isGone(g));
      this.onChange?.();
    }
    this.raf = moving || resizing ? requestAnimationFrame(this.tick) : 0;
  };
  kick() {
    if (!this.raf) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.tick);
    }
  }
  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}

function measureTokens(measure: HTMLElement, text: string) {
  const chars = splitGraphemes(text);
  const cells = measure.children;
  const tokens: Token[] = [];
  chars.forEach((char, i) => {
    const cell = cells[i] as HTMLElement | undefined;
    if (cell && !isBlank(char)) tokens.push({ char, x: cell.offsetLeft });
  });
  return { tokens, width: measure.offsetWidth };
}

function MorphLayer({ text, reducedRef }: { text: string; reducedRef: RefObject<boolean> }) {
  const chars = splitGraphemes(text);
  const rootRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<MorphEngine | null>(null);
  if (!engineRef.current) engineRef.current = new MorphEngine();
  const engine = engineRef.current;
  // servidor e primeiro render: texto em fluxo; depois de montar, letras posicionadas pela física
  const [live, setLive] = useState(false);
  const [views, setViews] = useState<GlyphView[]>([]);

  useIsoLayoutEffect(() => {
    engine.root = rootRef.current;
    engine.onChange = () => setViews(engine.views());
    setLive(true);
    return () => engine.stop();
  }, [engine]);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!(live && root && measure)) return;
    engine.em = Number.parseFloat(getComputedStyle(root).fontSize) || 16;
    engine.reduced = !!reducedRef.current;
    const { tokens, width } = measureTokens(measure, text);
    engine.update(tokens, width);
    setViews(engine.views());
    engine.kick();
  }, [engine, live, text, reducedRef]);

  // fontes carregando ou tamanho mudando reposicionam as letras
  useEffect(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!(live && root && measure)) return;
    const ro = new ResizeObserver(() => {
      engine.em = Number.parseFloat(getComputedStyle(root).fontSize) || 16;
      const { tokens, width } = measureTokens(measure, text);
      engine.place(tokens, width);
    });
    ro.observe(measure);
    return () => ro.disconnect();
  }, [engine, live, text]);

  return (
    <span className="dyn" ref={rootRef}>
      <span aria-hidden="true" className="dyn__measure" ref={measureRef}>
        {chars.map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </span>
      {live ? (
        <>
          <span aria-hidden="true" className="dyn__strut">
            {'​'}
          </span>
          {views.map((v) => (
            <span aria-hidden="true" className="dyn__glyph" key={v.id} ref={engine.refFor(v.id)}>
              {v.char}
            </span>
          ))}
        </>
      ) : (
        <span aria-hidden="true">
          {chars.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </span>
      )}
    </span>
  );
}

type Props = {
  words: string[];
  interval?: number;
  rounds?: number;
  className?: string;
  /** Controlado: mostra `words[index]` e só troca quando o índice muda (sem relógio próprio). */
  index?: number;
};

/** Alterna `words` com a animação de letras; para na primeira palavra depois de `rounds` voltas. */
export function DynamicText({ words, interval = 2400, rounds = 2, className, index: controlled }: Props) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const reducedRef = useRef(false);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const total = words.length * rounds; // termina de volta na primeira palavra
  const index = controlled ?? step % words.length;

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = rootRef.current;
    if (!el) return;
    let inView = false;
    const sync = () => setRunning(inView && document.visibilityState === 'visible');
    const io = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
      sync();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  useEffect(() => {
    if (controlled !== undefined || !running || reducedRef.current || words.length < 2 || step >= total) return;
    const id = setTimeout(() => setStep((s) => s + 1), interval);
    return () => clearTimeout(id);
  }, [controlled, running, step, total, interval, words.length]);

  return (
    <span className={className ? `dynamic-text ${className}` : 'dynamic-text'} ref={rootRef}>
      <span className="sr-only">{words.join(', ')}</span>
      <MorphLayer reducedRef={reducedRef} text={words[index] ?? ''} />
    </span>
  );
}
