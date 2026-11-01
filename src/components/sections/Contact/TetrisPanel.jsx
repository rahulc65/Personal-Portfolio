import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { FONT_BLOCK } from '../../../data/pixelFont';
import { computeGameLayout } from '../../../game/gameLayout.js';
import PixelLetter from './PixelLetter';
import PixelButton from './PixelButton';
import TetrisGame from './TetrisGame';
import { GLYPH_H, FRAME_BORDER, PANEL_PAD, layoutWord } from './tetrisLayout';

/* Fall timing: each letter steps down one row every STEP seconds, like gravity. */
const STEP = 0.03;
const STAGGER = 0.3; // the next piece spawns this long after the previous one

const lerp = (a, b, t) => a + (b - a) * t;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * TetrisPanel
 * The left half of the contact section.
 *
 *  idle      graph-paper board with the CONTACT ME letters and the PLAY GAME button.
 *            Scrolling into view drops the letters in, one piece at a time.
 *  entering  letters flash and clear like a finished line, the form fades out, and the
 *            panel grows to the right edge of the row (and a little taller)
 *  game      the board is now the playable Tetris stage
 *  exiting   the game fades out, the panel shrinks back, the form returns and the
 *            letters drop in again
 *
 * The panel's size is driven imperatively (GSAP + one apply(t) function, t: 0 = idle,
 * 1 = game) so React renders never fight the animation. It grows sideways using a
 * negative right margin, so the form's grid column keeps its place underneath.
 */
export default function TetrisPanel({
  word = 'CONTACT ME',
  cell,
  rowWidth,
  fill = false,
  mode,
  formRef,
  onPlay,
  onExit,
  onEntered,
  onExited,
}) {
  const panelRef = useRef(null);
  const frameRef = useRef(null);
  const boardRef = useRef(null);
  const playWrapRef = useRef(null);
  const playBtnRef = useRef(null);
  const letterRefs = useRef([]);
  const playedRef = useRef(false);
  const dropRef = useRef(null);
  const transitionRef = useRef(null);
  const modeRef = useRef(mode);
  const geoRef = useRef(null);
  const cbRef = useRef({});

  const { letters, cols, rows, letterRow } = useMemo(() => layoutWord(word), [word]);

  /* ---------- geometry: idle vs game ---------- */
  const [vh, setVh] = useState(() => window.innerHeight);
  const [touch] = useState(() => window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const gameLayout = useMemo(
    () => computeGameLayout(Math.max(300, rowWidth - PANEL_PAD * 2 - FRAME_BORDER), vh, touch),
    [rowWidth, vh, touch]
  );

  // fill: stacked (phone) layout, the panel spans the whole row so its edges line up with the form
  const idleGeo = { w: fill ? Math.max(rowWidth, cols * cell + PANEL_PAD * 2 + FRAME_BORDER) : cols * cell + PANEL_PAD * 2 + FRAME_BORDER, frameW: cols * cell, frameH: rows * cell, cell };
  const gameGeo = {
    w: rowWidth,
    frameW: gameLayout.cols * gameLayout.cell,
    frameH: gameLayout.rows * gameLayout.cell,
    cell: gameLayout.cell,
  };

  // Keep the latest values where GSAP callbacks and observers can read them.
  // Declared before the other layout effects so they always see fresh values.
  useLayoutEffect(() => {
    modeRef.current = mode;
    cbRef.current = { onEntered, onExited, formRef };
    geoRef.current = { idle: idleGeo, game: gameGeo };
  });

  /** t = 0 idle ... t = 1 game */
  const apply = useCallback((t) => {
    const panel = panelRef.current;
    const frame = frameRef.current;
    const board = boardRef.current;
    if (!panel || !frame || !board || !geoRef.current) return;
    const { idle, game } = geoRef.current;
    const w = lerp(idle.w, game.w, t);
    panel.style.width = `${w}px`;
    panel.style.marginRight = `${-(w - idle.w)}px`; // grow over the form's column, don't push it
    frame.style.width = `${lerp(idle.frameW, game.frameW, t)}px`;
    frame.style.height = `${lerp(idle.frameH, game.frameH, t)}px`;
    board.style.setProperty('--cell', `${lerp(idle.cell, game.cell, t)}px`);
  }, []);

  useLayoutEffect(() => {
    if (!cell) return;
    if (mode === 'idle') apply(0);
    else if (mode === 'game') apply(1);
  }, [cell, mode, apply, idleGeo.w, idleGeo.frameW, idleGeo.frameH, gameGeo.w, gameGeo.frameW, gameGeo.frameH, gameGeo.cell]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- the letter drop ---------- */
  const buildDrop = useCallback(
    ({ paused = false } = {}) => {
      const els = letterRefs.current.slice(0, letters.length).filter(Boolean);
      const rowsToFall = letterRow + GLYPH_H + 1; // from just above the board to the floor
      gsap.set(els, { y: -rowsToFall * cell, opacity: 1 });
      const tl = gsap.timeline({ paused });
      els.forEach((el, i) => {
        tl.to(
          el,
          {
            y: 0,
            duration: rowsToFall * STEP,
            ease: `steps(${rowsToFall})`, // exactly one cell per step
            onComplete: () =>
              gsap.fromTo(
                el,
                { filter: 'brightness(1.9)' },
                { filter: 'brightness(1)', duration: 0.35, ease: 'power2.out', clearProps: 'filter' }
              ),
          },
          i * STAGGER
        );
      });
      return tl;
    },
    [cell, letters, letterRow]
  );

  // first drop: when the board scrolls into view
  useEffect(() => {
    const board = boardRef.current;
    const els = letterRefs.current.slice(0, letters.length).filter(Boolean);
    if (!cell || !board || !els.length || modeRef.current !== 'idle') return undefined;

    if (prefersReducedMotion() || playedRef.current) {
      gsap.set(els, { y: 0, opacity: 1 });
      return undefined;
    }
    const tl = buildDrop({ paused: true });
    tl.eventCallback('onComplete', () => {
      playedRef.current = true;
    });
    dropRef.current = tl;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tl.play();
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(board);
    return () => {
      io.disconnect();
      tl.kill();
    };
  }, [cell, letters, buildDrop]);

  /* ---------- idle -> game ---------- */
  const runEnter = useCallback(() => {
    const els = letterRefs.current.slice(0, letters.length).filter(Boolean);
    const playWrap = playWrapRef.current;
    const form = cbRef.current.formRef?.current;
    dropRef.current?.kill();

    const finish = () => {
      apply(1);
      gsap.set(els, { opacity: 0 });
      gsap.set(playWrap, { opacity: 0 });
      if (form) gsap.set(form, { display: 'none' });
      cbRef.current.onEntered();
    };
    if (prefersReducedMotion()) {
      finish();
      return undefined;
    }

    // As the panel grows, scroll just enough to keep the whole stage on screen. The page only
    // gets taller as the panel does, so this has to happen during the growth, not before it.
    const keepInView = (t) => {
      const panel = panelRef.current;
      if (!panel) return;
      const { idle, game } = geoRef.current;
      const stageH = lerp(idle.frameH, game.frameH, t) + PANEL_PAD * 2 + FRAME_BORDER;
      const top = window.scrollY + panel.getBoundingClientRect().top;
      const wanted = top - Math.max(90, (window.innerHeight - stageH) / 2);
      if (wanted > window.scrollY) window.scrollTo(0, wanted);
    };

    const st = { t: 0 };
    const tl = gsap.timeline({ onComplete: finish });
    tl
      // the word "clears" like a finished line
      .to(els, { filter: 'brightness(1.9)', duration: 0.09, repeat: 3, yoyo: true, ease: 'none' }, 0)
      .to(els, { opacity: 0, y: `+=${cell * 1.5}`, duration: 0.32, stagger: 0.025, ease: 'power2.in' }, 0.4)
      .to(playWrap, { opacity: 0, duration: 0.25, ease: 'none' }, 0.05);
    if (form) tl.to(form, { opacity: 0, duration: 0.3, ease: 'power2.out' }, 0.1);
    tl.to(
      st,
      {
        t: 1,
        duration: 0.85,
        ease: 'power3.inOut',
        onUpdate: () => {
          apply(st.t);
          keepInView(st.t);
        },
      },
      0.75
    );
    transitionRef.current = tl;
    return undefined;
  }, [apply, cell, letters]);

  /* ---------- game -> idle ---------- */
  const runExit = useCallback(() => {
    const form = cbRef.current.formRef?.current;
    const playWrap = playWrapRef.current;

    const restore = () => {
      apply(0);
      gsap.set(playWrap, { opacity: 1 });
      if (form) {
        gsap.set(form, { clearProps: 'display' });
        gsap.fromTo(form, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      }
      cbRef.current.onExited();
      playBtnRef.current?.focus({ preventScroll: true });
      if (prefersReducedMotion()) {
        const els = letterRefs.current.slice(0, letters.length).filter(Boolean);
        gsap.set(els, { y: 0, opacity: 1 });
      } else {
        dropRef.current = buildDrop(); // the letters fall in again
      }
    };
    if (prefersReducedMotion()) {
      restore();
      return;
    }
    const st = { t: 1 };
    const tl = gsap.timeline({ onComplete: restore });
    tl.to(st, { t: 0, duration: 0.8, ease: 'power3.inOut', onUpdate: () => apply(st.t) }, 0.3);
    transitionRef.current = tl;
  }, [apply, buildDrop, letters]);

  useEffect(() => {
    if (mode === 'entering') runEnter();
    if (mode === 'exiting') runExit();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      transitionRef.current?.kill();
      dropRef.current?.kill();
    },
    []
  );

  if (!cell) return <div className="rounded-[3px] bg-[#f9f8f5]" style={{ height: 320 }} />;

  const buttonWidth = Math.max(9 * cell, 104);

  return (
    <div ref={panelRef} className="relative z-10 rounded-[3px] bg-[#f9f8f5]" style={{ padding: PANEL_PAD }}>
      <div ref={frameRef} className="mx-auto box-content rounded-[3px] border-[1.5px] border-[#ee5a24]">
        <div ref={boardRef} className="tetris-board relative h-full w-full overflow-hidden rounded-[2px]">
          {letters.map((letter, i) => (
            <PixelLetter
              key={`${letter.char}-${letter.col}`}
              glyph={FONT_BLOCK[letter.char]}
              cell={cell}
              innerRef={(node) => {
                letterRefs.current[i] = node;
              }}
              style={{ left: letter.col * cell, top: letterRow * cell }}
            />
          ))}

          <div ref={playWrapRef} inert={mode !== 'idle'} className="absolute" style={{ right: cell, top: cell }}>
            <PixelButton
              innerRef={playBtnRef}
              label="PLAY GAME"
              icon="play"
              width={buttonWidth}
              ariaLabel="Play game"
              onClick={onPlay}
            />
          </div>

          {(mode === 'game' || mode === 'exiting') && (
            <TetrisGame layout={gameLayout} active={mode === 'game'} onExit={onExit} />
          )}
        </div>
      </div>
    </div>
  );
}