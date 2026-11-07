import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../../lib/gsap';
import Container from '../../ui/Container';
import TetrisPanel from './TetrisPanel';
import ContactForm from './ContactForm';
import { FRAME_BORDER, PANEL_PAD, layoutWord } from './tetrisLayout';

const GAP = 40; // px between the panel and the form on wide screens
const PANEL_SHARE = 0.62; // how much of the row the panel may take on wide screens


export default function Contact({ word, serviceOptions = [], config }) {
  const rowRef = useRef(null);
  const formRef = useRef(null);
  const [cell, setCell] = useState(0);
  const [rowWidth, setRowWidth] = useState(0);
  const [stacked, setStacked] = useState(false);
  const [mode, setMode] = useState('idle');
  const { cols } = useMemo(() => layoutWord(word), [word]);

  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return undefined;
    const measure = () => {
      const wide = window.matchMedia('(min-width: 768px)').matches;
      const available = wide ? (el.clientWidth - GAP) * PANEL_SHARE : el.clientWidth;
      const fit = Math.floor((available - PANEL_PAD * 2 - FRAME_BORDER) / cols);
      setCell(Math.max(4, Math.min(24, fit)));
      setRowWidth(el.clientWidth);
      setStacked(!wide);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols]);

  /* ---------- entrance motion ---------- */
  // wait until the cell size is known: before that TetrisPanel renders a placeholder box, not the real panel
  const ready = cell > 0;
  useLayoutEffect(() => {
    if (!ready || prefersReducedMotion()) return undefined;
    const panel = rowRef.current?.firstElementChild;
    const form = formRef.current;
    if (!panel || !form) return undefined;
    // every direct child of the <form> except the hidden honeypot field
    const fields = gsap.utils.toArray(form.querySelectorAll('form > *:not([aria-hidden="true"])'));

    const ctx = gsap.context((gctx) => {
      gsap.set(panel, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.set(fields, { autoAlpha: 0, y: 34 });

      ScrollTrigger.create({
        trigger: panel,
        start: 'top 90%',
        end: 'max', // still plays if the page was opened already scrolled past this section
        once: true,
        onEnter: () =>
          gctx.add(() =>
            gsap.to(panel, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out', clearProps: 'clipPath' })
          ),
      });

      ScrollTrigger.create({
        trigger: form,
        start: 'top 88%',
        end: 'max',
        once: true,
        onEnter: () =>
          gctx.add(() =>
            gsap.to(fields, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12, clearProps: 'transform' })
          ),
      });
    }, rowRef);

    return () => ctx.revert();
  }, [ready]);

  return (
    <section id="contact" className="pt-[clamp(48px,5vw,40px)] pb-[clamp(48px,6vw,60px)]">
      <h2 className="sr-only">Contact me</h2>
      <Container>
        <div ref={rowRef} className="grid items-start gap-7 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
          <TetrisPanel
            word={word}
            cell={cell}
            rowWidth={rowWidth}
            fill={stacked}
            mode={mode}
            formRef={formRef}
            onPlay={() => setMode((m) => (m === 'idle' ? 'entering' : m))}
            onExit={() => setMode((m) => (m === 'game' ? 'exiting' : m))}
            onEntered={() => setMode('game')}
            onExited={() => setMode('idle')}
          />
          <div ref={formRef} className="min-w-0">
            <ContactForm serviceOptions={serviceOptions} config={config} />
          </div>
        </div>
      </Container>
    </section>
  );
}