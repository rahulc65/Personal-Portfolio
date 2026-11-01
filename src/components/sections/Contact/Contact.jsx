import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import Container from '../../ui/Container';
import TetrisPanel from './TetrisPanel';
import ContactForm from './ContactForm';
import { FRAME_BORDER, PANEL_PAD, layoutWord } from './tetrisLayout';

const GAP = 40; // px between the panel and the form on wide screens
const PANEL_SHARE = 0.62; // how much of the row the panel may take on wide screens

/**
 * Contact
 * Left: the Tetris-style panel. Right: the contact form.
 * The panel is sized in whole pixels per cell, so this component measures the row
 * and picks the biggest cell that fits; the panel then takes exactly the width it
 * needs and the form gets the rest.
 *
 * It also owns the game mode:
 *   idle -> entering (Play clicked) -> game -> exiting (Exit clicked) -> idle
 * TetrisPanel does the animating and tells us when each transition has finished.
 */
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