import { useEffect } from 'react';

/**
 * useScrollMarquee
 * Drives an infinite, seamless horizontal marquee with transforms only.
 *
 *  - idles at `baseSpeed` px/s, moving right to left
 *  - scrolling DOWN keeps it moving right to left and speeds it up
 *  - scrolling UP reverses it (left to right) and speeds it up
 *  - speed and direction are eased, so changes accelerate, brake and turn
 *    smoothly instead of snapping
 *  - only runs while the section is on screen
 *  - reduced motion: stays still
 *
 * @param {object} opts
 * @param {React.RefObject} opts.sectionRef  visible area (observed for visibility)
 * @param {React.RefObject} opts.trackRef    element that gets translated
 * @param {React.RefObject} opts.periodRef   ONE copy of the content; its width is the loop length
 * @param {number} [opts.baseSpeed=90]       idle speed, px/s
 * @param {number} [opts.boost=0.6]          px/s added per px/s of scroll velocity
 * @param {number} [opts.maxSpeed=2400]      speed cap, px/s
 * @param {any} [opts.deps]                  re-run when this changes (e.g. number of copies)
 */
export default function useScrollMarquee({
  sectionRef,
  trackRef,
  periodRef,
  baseSpeed = 90,
  boost = 0.6,
  maxSpeed = 2400,
  deps,
}) {
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const periodEl = periodRef.current;
    if (!section || !track || !periodEl) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let period = periodEl.offsetWidth;
    let x = 0;
    let dir = -1; // eased direction: -1 = right to left, +1 = left to right
    let dirTarget = -1;
    let vel = 0; // smoothed scroll velocity, px/s (positive = scrolling down)
    let lastY = window.scrollY;
    let last = 0;
    let raf = 0;

    const render = () => {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (dt <= 0 || period <= 0) return;

      const y = window.scrollY;
      const raw = (y - lastY) / dt;
      lastY = y;

      vel += (raw - vel) * (1 - Math.exp(-dt * 10)); // smooth the velocity
      if (Math.abs(vel) > 15) dirTarget = vel > 0 ? -1 : 1; // down = left, up = right
      dir += (dirTarget - dir) * (1 - Math.exp(-dt * 6)); // ease through zero when turning

      const speed = Math.min(baseSpeed + Math.abs(vel) * boost, maxSpeed);
      x += dir * speed * dt;

      x %= period; // wrap by exactly one copy: seamless
      if (x > 0) x -= period;
      render();
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      lastY = window.scrollY; // no velocity spike on re-entry
      vel = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), {
      rootMargin: '120px 0px',
    });
    io.observe(section);

    // Keep the loop length right when fonts load or the viewport resizes.
    const ro = new ResizeObserver(() => {
      period = periodEl.offsetWidth;
    });
    ro.observe(periodEl);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps, baseSpeed, boost, maxSpeed]);
}