/**
 * Texto que é digitado na tela, com cursor que pisca quando para e ritmo natural (hesitações e rajadas).
 *
 * Adaptado de kokonutui — Typewriter (https://kokonutui.com), por @dorianbaffier, licença MIT.
 * Mudanças: sem Tailwind, `cn` nem `motion.span`; o HTML pré-renderizado (e a página sem JS) traz o texto
 * completo, que só some para ser digitado quando o JS assume; sem erros de digitação nem modo de seleção;
 * leitor de tela recebe o texto inteiro uma vez.
 */
import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../hooks/useLandingEffects';

type Props = {
  /** Frases na ordem; a última fica na tela. */
  phrases: string[];
  typingSpeed?: number;
  deleteSpeed?: number;
  startDelay?: number;
  pauseBeforeDelete?: number;
  className?: string;
};

const CARET_IDLE_MS = 500;

/** Gerador com semente (Park-Miller), de 0 a 1: toda visita digita no mesmo ritmo. */
function createRandom(seed: number) {
  let state = (Math.abs(Math.floor(seed)) % 2_147_483_646) + 1;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
}

function typingDelay(speed: number, random: () => number) {
  const roll = random();
  if (roll < 0.1) return speed * 2; // hesitação
  if (roll > 0.9) return speed * 0.5; // rajada
  return speed * (0.6 + random() * 0.8);
}

export function TypeWriter({ phrases, typingSpeed = 42, deleteSpeed = 26, startDelay = 700, pauseBeforeDelete = 1100, className }: Props) {
  const finalText = phrases[phrases.length - 1] ?? '';
  // Servidor e primeiro render: texto final completo (SEO e página sem JS). O JS limpa e digita.
  const [text, setText] = useState(finalText);
  const [typing, setTyping] = useState(false);
  const caretRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const random = createRandom(7);
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let idle: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => {
          timers.delete(t);
          if (stopped) reject(new Error('parado'));
          else resolve();
        }, ms);
        timers.add(t);
      });
    // cada tecla segura o cursor aceso; ele volta a piscar quando para
    const keystroke = () => {
      const caret = caretRef.current;
      if (!caret) return;
      caret.dataset.idle = 'false';
      clearTimeout(idle);
      idle = setTimeout(() => (caret.dataset.idle = 'true'), CARET_IDLE_MS);
    };

    const run = async () => {
      setTyping(true);
      setText('');
      await wait(startDelay);
      for (let p = 0; p < phrases.length; p++) {
        const phrase = phrases[p];
        for (let i = 1; i <= phrase.length; i++) {
          setText(phrase.slice(0, i));
          keystroke();
          await wait(typingDelay(typingSpeed, random));
        }
        if (p === phrases.length - 1) break;
        await wait(pauseBeforeDelete);
        for (let i = phrase.length - 1; i >= 0; i--) {
          setText(phrase.slice(0, i));
          keystroke();
          await wait(deleteSpeed);
        }
      }
    };

    // começa quando aparece na tela
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      run().catch(() => {});
    });
    if (rootRef.current) io.observe(rootRef.current);
    return () => {
      stopped = true;
      io.disconnect();
      timers.forEach(clearTimeout);
      clearTimeout(idle);
    };
    // as frases são fixas na página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // data-state="idle": com JS e sem movimento reduzido, o CSS esconde o texto até a digitação começar (sem piscar)
    <span ref={rootRef} className={className ? `typewriter ${className}` : 'typewriter'} data-state={typing ? 'typing' : 'idle'}>
      <span className="sr-only">{finalText}</span>
      <span className="typewriter__box" aria-hidden="true">
        {/* todas as frases ocupam a mesma célula, invisíveis: a caixa já nasce na largura final, sem pular */}
        {phrases.map((p, i) => (
          <span key={i} className="typewriter__sizer">
            {p}
          </span>
        ))}
        <span className="typewriter__live">
          {text}
          {typing && (
            <span className="typewriter__caret-wrap">
              <span ref={caretRef} className="typewriter__caret" data-idle="true" />
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
