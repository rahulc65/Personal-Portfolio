import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TetrisEngine } from '../../../game/tetrisEngine.js';
import { renderGame } from '../../../game/tetrisRenderer.js';
import PixelButton from './PixelButton';

const BEST_KEY = 'portfolio:tetris-best';
const READY_MS = 3000; // 3 - 2 - 1 before the first piece

const readBest = () => {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeBest = (n) => {
  try {
    window.localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* storage can be unavailable (private mode); the best score just won't persist */
  }
};

const KEY_ACTIONS = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowUp: 'rotateCW',
  KeyW: 'rotateCW',
  KeyX: 'rotateCW',
  KeyZ: 'rotateCCW',
  Space: 'drop',
  KeyC: 'hold',
  ShiftLeft: 'hold',
  ShiftRight: 'hold',
  KeyP: 'pause',
  Escape: 'exit',
};

/* ---------- on-screen touch pad ---------- */

const svgProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const PAD_BUTTONS = {
  left: { label: 'Move left', hold: true, icon: <svg {...svgProps}><path d="M14 5l-7 7 7 7" /></svg> },
  right: { label: 'Move right', hold: true, icon: <svg {...svgProps}><path d="M10 5l7 7-7 7" /></svg> },
  down: { label: 'Soft drop', hold: true, icon: <svg {...svgProps}><path d="M5 10l7 7 7-7" /></svg> },
  rotateCW: { label: 'Rotate', icon: <svg {...svgProps}><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" /></svg> },
  drop: { label: 'Hard drop', icon: <svg {...svgProps}><path d="M6 5l6 6 6-6" /><path d="M6 12l6 6 6-6" /></svg> },
  hold: { label: 'Hold piece', icon: <span className="font-mono text-[11px] font-extrabold leading-none">HOLD</span> },
};

function TouchPad({ rect, order, columns, onPress, onRelease }) {
  return (
    <div
      className="absolute grid gap-[6px]"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {order.map((id) => {
        const def = PAD_BUTTONS[id];
        return (
          <button
            key={id}
            type="button"
            aria-label={def.label}
            className="grid touch-none select-none place-items-center rounded-[4px] border-[1.5px] border-[#ee5a24] bg-[#fffefb] text-[#e8460e] transition-colors duration-75 active:bg-[#e8460e] active:text-white"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              onPress(id);
            }}
            onPointerUp={() => def.hold && onRelease(id)}
            onPointerCancel={() => def.hold && onRelease(id)}
            onLostPointerCapture={() => def.hold && onRelease(id)}
          >
            {def.icon}
          </button>
        );
      })}
    </div>
  );
}

function Overlay({ rect, title, children }) {
  return (
    <div
      className="absolute flex flex-col items-center justify-center gap-3 bg-[#fffefb]/90 text-center font-mono backdrop-blur-[1px]"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    >
      <p className="m-0 text-[clamp(18px,2.2vw,26px)] font-extrabold tracking-[-0.02em] text-ink">{title}</p>
      {children}
    </div>
  );
}

/**
 * TetrisGame
 * The playable game that fills the expanded panel. It owns the loop, the keyboard
 * and touch input and the overlays; the rules live in game/tetrisEngine.js and the
 * drawing in game/tetrisRenderer.js.
 *
 *  - 3-2-1 countdown, then play. P pauses, Esc (or the Exit button) leaves.
 *  - it pauses by itself when scrolled out of view, the tab is hidden, or the
 *    window loses focus
 *  - arrow keys / space only steer the game while it is on screen, so the page
 *    scrolls normally otherwise
 *  - best score is kept in localStorage
 */
export default function TetrisGame({ layout, active, onExit }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const layoutRef = useRef(layout);
  const controlsRef = useRef(null);
  const onExitRef = useRef(onExit);
  const [shown, setShown] = useState(false);
  const [view, setView] = useState(() => ({ status: 'ready', score: 0, best: readBest() }));
  const [live, setLive] = useState('');

  // keep the latest props where the game loop (a long-lived closure) can read them
  useLayoutEffect(() => {
    layoutRef.current = layout;
    onExitRef.current = onExit;
  });

  // fade in
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // canvas backing store follows the layout (and the screen's pixel density)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = layout.width * dpr;
    canvas.height = layout.height * dpr;
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;
  }, [layout.width, layout.height]);

  // the game itself
  useEffect(() => {
    if (!active) return undefined;
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const engine = new TetrisEngine();
    const held = []; // directions currently held, most recent last

    let phase = 'ready'; // ready | playing | over
    let ready = READY_MS;
    let paused = false;
    let inView = true;
    let best = readBest();
    let raf = 0;
    let last = performance.now();

    root?.focus({ preventScroll: true });

    const status = () => (paused ? 'paused' : phase);
    const sync = () => setView({ status: status(), score: engine.score, best });

    const releaseAll = () => {
      held.length = 0;
      engine.setHorizontal(0);
      engine.setSoftDrop(false);
    };
    const dirFromHeld = () => (held.length ? (held[held.length - 1] === 'left' ? -1 : 1) : 0);

    const pause = () => {
      if (phase === 'over') return;
      paused = !paused;
      releaseAll();
      sync();
    };
    const restart = () => {
      engine.reset();
      phase = 'ready';
      ready = READY_MS;
      paused = false;
      releaseAll();
      setView({ status: 'ready', score: 0, best });
    };

    const press = (action) => {
      if (action === 'pause') return pause();
      if (action === 'exit') return onExitRef.current?.();
      if (paused || phase !== 'playing') return undefined;
      switch (action) {
        case 'left':
        case 'right':
          if (!held.includes(action)) held.push(action);
          engine.setHorizontal(dirFromHeld());
          break;
        case 'down':
          engine.setSoftDrop(true);
          break;
        case 'rotateCW':
          engine.rotate(1);
          break;
        case 'rotateCCW':
          engine.rotate(-1);
          break;
        case 'drop':
          engine.hardDrop();
          break;
        case 'hold':
          engine.hold();
          break;
        default:
      }
      return undefined;
    };
    const release = (action) => {
      if (action === 'left' || action === 'right') {
        const i = held.indexOf(action);
        if (i >= 0) held.splice(i, 1);
        engine.setHorizontal(dirFromHeld());
      } else if (action === 'down') {
        engine.setSoftDrop(false);
      }
    };
    controlsRef.current = { press, release, pause, restart };

    /* ---- keyboard ---- */
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (t && t.tagName === 'BUTTON' && e.code === 'Space') return; // let a focused button use space
      const action = KEY_ACTIONS[e.code];
      if (!action || !inView) return; // off screen: let the page scroll as usual
      e.preventDefault();
      if (!e.repeat) press(action);
    };
    const onKeyUp = (e) => {
      const action = KEY_ACTIONS[e.code];
      if (action) release(action);
    };
    const autoPause = () => {
      if (phase !== 'over' && !paused) pause();
    };
    const onVisibility = () => {
      if (document.hidden) autoPause();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', autoPause);
    document.addEventListener('visibilitychange', onVisibility);

    /* ---- pause when scrolled away ---- */
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.intersectionRatio >= 0.3;
        if (!inView) autoPause();
      },
      { threshold: [0, 0.3, 0.6, 1] }
    );
    if (root) io.observe(root);

    /* ---- the loop ---- */
    const announce = (message) => setLive(message);
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(now - last, 100);
      last = now;

      if (!paused) {
        if (phase === 'ready') {
          ready -= dt;
          if (ready <= 0) {
            engine.start();
            phase = 'playing';
            sync();
          }
        } else if (phase === 'playing') {
          engine.update(dt);
          engine.drainEvents().forEach((ev) => {
            if (ev.type === 'clear') announce(ev.lines === 4 ? 'Tetris! Four lines.' : `${ev.lines} line${ev.lines > 1 ? 's' : ''} cleared.`);
            if (ev.type === 'levelup') announce(`Level ${ev.level}.`);
            if (ev.type === 'over') {
              releaseAll();
              phase = 'over';
              best = Math.max(best, engine.score);
              writeBest(best);
              announce(`Game over. Score ${engine.score}.`);
              sync();
            }
          });
        }
      }

      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const dpr = canvas.width / layoutRef.current.width || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderGame(ctx, engine, layoutRef.current, { countdown: phase === 'ready' ? Math.ceil(ready / 1000) : 0, best });
      }
    };
    raf = requestAnimationFrame(frame);

    // Test hook: set window.__TETRIS_DEBUG__ = true before load to inspect the game.
    if (window.__TETRIS_DEBUG__) window.__tetris = { engine, pause, restart, press, release, getView: () => status() };

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', autoPause);
      document.removeEventListener('visibilitychange', onVisibility);
      controlsRef.current = null;
    };
  }, [active]);

  const L = layout;
  const call = (name) => (...args) => controlsRef.current?.[name]?.(...args);

  const padOrder = L.pad.columns === 3 ? ['left', 'down', 'right', 'rotateCW', 'drop', 'hold'] : ['left', 'right', 'down', 'rotateCW', 'drop', 'hold'];

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="group"
      aria-label="Tetris game"
      className="absolute inset-0 select-none outline-none"
      style={{ opacity: active && shown ? 1 : 0, transition: 'opacity 300ms ease' }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Tetris board. Arrow keys move and rotate, space drops, C holds, P pauses, Escape exits."
        className="absolute left-0 top-0"
      />

      <PixelButton
        label={view.status === 'paused' ? 'RESUME' : 'PAUSE'}
        icon={view.status === 'paused' ? 'play' : 'pause'}
        unit={L.unit}
        style={{ position: 'absolute', left: L.pause.x, top: L.pause.y }}
        onClick={(e) => {
          call('pause')();
          e.currentTarget.blur();
        }}
      />
      <PixelButton
        label="EXIT"
        icon="exit"
        variant="ghost"
        unit={L.unit}
        style={{
          position: 'absolute',
          top: L.exit.y,
          ...(L.exit.alignRight ? { right: L.width - L.exit.x } : { left: L.exit.x }),
        }}
        onClick={() => call('press')('exit')}
      />

      {L.showPad && <TouchPad rect={L.pad} order={padOrder} columns={L.pad.columns} onPress={call('press')} onRelease={call('release')} />}

      {view.status === 'paused' && (
        <Overlay rect={L.field} title="Paused">
          <PixelButton label="RESUME" icon="play" unit={L.unit * 1.15} onClick={() => call('pause')()} />
          <PixelButton label="EXIT" icon="exit" variant="ghost" unit={L.unit * 1.15} onClick={() => call('press')('exit')} />
        </Overlay>
      )}
      {view.status === 'over' && (
        <Overlay rect={L.field} title="Game over">
          <p className="m-0 text-[13px] leading-[1.5] text-ink">
            Score <strong>{view.score.toLocaleString('en-US')}</strong>
            <br />
            Best <strong>{view.best.toLocaleString('en-US')}</strong>
          </p>
          <PixelButton label="PLAY AGAIN" icon="again" unit={L.unit * 1.15} onClick={() => call('restart')()} />
          <PixelButton label="EXIT" icon="exit" variant="ghost" unit={L.unit * 1.15} onClick={() => call('press')('exit')} />
        </Overlay>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {live}
      </p>
    </div>
  );
}   