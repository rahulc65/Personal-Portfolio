import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

const { Engine, Bodies, Body, Composite, Constraint } = Matter;

const STEP = 1000 / 60; // fixed physics step (ms)
const MAX_SPEED = 38; // px per step, stops thrown chips tunnelling through walls
const DRAG_THRESHOLD = 6; // px of pointer travel before a press counts as a drag

const rand = (min, max) => min + Math.random() * (max - min);

const HEART_PATH =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

function Heart({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={HEART_PATH} />
    </svg>
  );
}

export default function GravityPile({ items, className = '' }) {
  const wrapRef = useRef(null);
  const elRefs = useRef([]);
  const [liked, setLiked] = useState(() => new Set());

  const toggleLike = (id) =>
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    const wrap = wrapRef.current;
    const els = elRefs.current.slice(0, items.length).filter(Boolean);
    if (!wrap || !els.length) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let engine = null;
    let bodies = [];
    let walls = [];
    let size = { w: 0, h: 0 };
    let signature = '';
    let drag = null;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let started = false;
    let resizeTimer = 0;
    const cleanups = [];

    /* ---------- world ---------- */

    const makeWalls = (w, h) => {
      const t = 400; // thick walls, so nothing can tunnel through
      const o = { isStatic: true, friction: 0.7, restitution: 0.2 };
      return [
        Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, o), // floor
        Bodies.rectangle(-t / 2, h / 2 - 1800, t, h + 4200, o), // left
        Bodies.rectangle(w + t / 2, h / 2 - 1800, t, h + 4200, o), // right
        Bodies.rectangle(w / 2, -3200, w + t * 2, t, o), // ceiling, far above the drop
      ];
    };

    const readSignature = () => els.map((el) => `${el.offsetWidth}x${el.offsetHeight}`).join('|');

    const sync = () => {
      for (let i = 0; i < bodies.length; i += 1) {
        const { position, angle } = bodies[i];
        const el = els[i];
        el.style.transform = `translate3d(${position.x - el.offsetWidth / 2}px, ${position.y - el.offsetHeight / 2}px, 0) rotate(${angle}rad)`;
        el.style.visibility = 'visible';
      }
    };

    const release = () => {
      if (!drag) return;
      if (engine) Composite.remove(engine.world, drag.constraint);
      els[drag.index]?.classList.remove('is-dragging');
      drag = null;
    };

    const build = (settleInstantly) => {
      release();
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      size = { w, h };
      signature = readSignature();

      engine = Engine.create({ positionIterations: 10, velocityIterations: 8 });
      engine.gravity.y = 1.5;

      walls = makeWalls(w, h);
      Composite.add(engine.world, walls);

      bodies = els.map((el, i) => {
        const bw = el.offsetWidth;
        const bh = el.offsetHeight;
        const isHeart = el.dataset.kind === 'heart';
        const x = rand(bw / 2 + 8, Math.max(bw / 2 + 9, w - bw / 2 - 8));
        const y = -70 - i * 60; // a column of chips above the panel, so they fall one after another
        const opts = {
          restitution: 0.28,
          friction: 0.5,
          frictionStatic: 0.7,
          frictionAir: 0.008,
          density: 0.002,
          angle: rand(-0.9, 0.9),
        };
        const body = isHeart
          ? Bodies.circle(x, y, bw / 2, opts)
          : Bodies.rectangle(x, y, bw, bh, { ...opts, chamfer: { radius: bh / 2 - 1 } });
        Body.setAngularVelocity(body, rand(-0.04, 0.04));
        return body;
      });
      Composite.add(engine.world, bodies);

      if (settleInstantly) {
        for (let s = 0; s < 800; s += 1) Engine.update(engine, STEP);
      }
      sync();
    };

    /** Panel height changed only: move the floor, keep the pile. */
    const resizeFloor = (w, h) => {
      Composite.remove(engine.world, walls);
      walls = makeWalls(w, h);
      Composite.add(engine.world, walls);
      size = { w, h };
    };

    /* ---------- loop ---------- */

    const step = () => {
      Engine.update(engine, STEP);
      for (const body of bodies) {
        const { x, y } = body.velocity;
        const speed = Math.hypot(x, y);
        if (speed > MAX_SPEED) Body.setVelocity(body, { x: (x / speed) * MAX_SPEED, y: (y / speed) * MAX_SPEED });
      }
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      acc += Math.min(now - last, 50);
      last = now;
      let n = 0;
      while (acc >= STEP && n < 3) {
        step();
        acc -= STEP;
        n += 1;
      }
      if (n === 3) acc = 0;
      sync();
    };

    const startLoop = () => {
      if (raf) return;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    };
    const stopLoop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    /* ---------- dragging ---------- */

    const toLocal = (e) => {
      const r = wrap.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    els.forEach((el, index) => {
      const onDown = (e) => {
        if (!engine || (e.pointerType === 'mouse' && e.button !== 0)) return;
        release();
        const body = bodies[index];
        const p = toLocal(e);
        const dx = p.x - body.position.x;
        const dy = p.y - body.position.y;
        const c = Math.cos(-body.angle);
        const s = Math.sin(-body.angle);
        const constraint = Constraint.create({
          pointA: { x: p.x, y: p.y },
          bodyB: body,
          pointB: { x: dx * c - dy * s, y: dx * s + dy * c }, // grab point in body space
          stiffness: 0.18,
          damping: 0.12,
          length: 0,
        });
        Composite.add(engine.world, constraint);
        el.setPointerCapture(e.pointerId);
        el.classList.add('is-dragging');
        drag = { index, pointerId: e.pointerId, constraint, sx: e.clientX, sy: e.clientY, moved: false };
      };

      const onMove = (e) => {
        if (!drag || drag.index !== index || e.pointerId !== drag.pointerId) return;
        const p = toLocal(e);
        drag.constraint.pointA.x = p.x;
        drag.constraint.pointA.y = p.y;
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > DRAG_THRESHOLD) drag.moved = true;
      };

      const onUp = (e) => {
        if (!drag || drag.index !== index || e.pointerId !== drag.pointerId) return;
        const wasTap = !drag.moved && e.type === 'pointerup';
        release();
        if (wasTap && el.dataset.kind === 'heart') toggleLike(el.dataset.id);
      };

      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
      cleanups.push(() => {
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
      });
    });

    /* ---------- start when scrolled into view, pause when off screen ---------- */

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!started) {
            started = true;
            build(reduceMotion); // reduced motion: skip the fall, show the settled pile
          }
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(wrap);

    /* ---------- resize ---------- */

    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!started) return;
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        if (w !== size.w || readSignature() !== signature) build(true);
        else if (h !== size.h) resizeFloor(w, h);
      }, 180);
    });
    ro.observe(wrap);

    return () => {
      clearTimeout(resizeTimer);
      stopLoop();
      io.disconnect();
      ro.disconnect();
      cleanups.forEach((fn) => fn());
      release();
      if (engine) {
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      }
    };
  }, [items]);

  return (
    <div
      ref={wrapRef}
      role="group"
      aria-label="Skill chips. Drag them around, or like the hearts."
      className={`gravity relative overflow-hidden ${className}`}
    >
      {items.map((item, i) => {
        const isHeart = item.kind === 'heart';
        const isLiked = liked.has(item.id);
        return (
          <div
            key={item.id}
            ref={(node) => {
              elRefs.current[i] = node;
            }}
            data-id={item.id}
            data-kind={item.kind}
            className={`gravity__item ${isHeart ? 'gravity__item--heart' : 'gravity__item--pill'}`}
            style={{ visibility: 'hidden' }}
          >
            {isHeart ? (
              <button
                type="button"
                aria-pressed={isLiked}
                aria-label={isLiked ? 'Unlike' : 'Like'}
                onClick={(e) => {
                  // Keyboard activation only (detail 0). Pointer taps are handled
                  // in the pointerup handler above, because of pointer capture.
                  if (e.detail === 0) toggleLike(item.id);
                }}
                className={`gravity__heart ${isLiked ? 'is-liked' : ''}`}
              >
                <Heart filled={isLiked} />
              </button>
            ) : (
              <span>{item.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
