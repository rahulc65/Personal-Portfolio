import { useEffect, useRef } from 'react';
import Matter from 'matter-js';

const { Engine, Bodies, Body, Composite, Constraint } = Matter;

const STEP = 1000 / 60; // fixed physics step (ms)
const MAX_SPEED = 38; // px per step, stops thrown chips tunnelling through walls
const DRAG_THRESHOLD = 6; // px of pointer travel before a press counts as a drag

const rand = (min, max) => min + Math.random() * (max - min);

/**
 * useGravityWorld
 * Real rigid-body physics (matter-js) driving plain DOM elements.
 *  - the elements drop in once, the first time the container scrolls into view
 *  - they collide, stack, bounce and settle on the floor of the container
 *  - every element can be grabbed, dragged and thrown
 * The DOM element is only a skin: its measured size becomes the body, and its
 * transform is rewritten from the body every frame.
 *
 * Shape of each body comes from the element: data-shape="circle" makes a circle,
 * anything else a pill (a rounded rectangle). Elements should start with
 * visibility:hidden; the hook reveals each one on its first frame.
 *
 * @param {object}   opts
 * @param {React.RefObject} opts.wrapRef   the container (the world's walls and floor)
 * @param {React.RefObject} opts.elRefs    ref to an array of the elements, in drop order
 * @param {number}   opts.count            how many elements to use from elRefs
 * @param {any}      opts.deps             re-run the world when this changes (e.g. the items array)
 * @param {(el: HTMLElement) => void} [opts.onTap]  called when an element is tapped (pressed without dragging)
 * @param {number}   [opts.threshold=0.3]  how much of the container must be visible to start / keep running
 */
export default function useGravityWorld({ wrapRef, elRefs, count, deps, onTap, threshold = 0.3 }) {
  const onTapRef = useRef(onTap);
  useEffect(() => {
    onTapRef.current = onTap;
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const els = elRefs.current.slice(0, count).filter(Boolean);
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
        const x = rand(bw / 2 + 8, Math.max(bw / 2 + 9, w - bw / 2 - 8));
        const y = -70 - i * 60; // a column of elements above the container, so they fall one after another
        const opts = {
          restitution: 0.28,
          friction: 0.5,
          frictionStatic: 0.7,
          frictionAir: 0.008,
          density: 0.002,
          angle: rand(-0.9, 0.9),
        };
        const body =
          el.dataset.shape === 'circle'
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

    /** Container height changed only: move the floor, keep the pile. */
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
        if (wasTap) onTapRef.current?.(el);
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
      { threshold }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps, count, threshold]);
}