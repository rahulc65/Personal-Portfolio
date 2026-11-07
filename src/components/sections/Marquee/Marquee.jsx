import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../../lib/gsap';
import useScrollMarquee from '../../../hooks/useScrollMarquee';

const ICON_PROPS = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  'aria-hidden': true,
};

/** Thin outline icons, drawn to match the design. */
const ICONS = {
  sun: (
    <svg {...ICON_PROPS}>
      <circle cx="24" cy="24" r="7" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line key={deg} x1="24" y1="9" x2="24" y2="13.5" transform={`rotate(${deg} 24 24)`} />
      ))}
    </svg>
  ),
  hash: (
    <svg {...ICON_PROPS}>
      <line x1="19" y1="8" x2="15" y2="40" />
      <line x1="33" y1="8" x2="29" y2="40" />
      <line x1="9" y1="18" x2="40" y2="18" />
      <line x1="8" y1="30" x2="39" y2="30" />
    </svg>
  ),
  asterisk: (
    <svg {...ICON_PROPS}>
      {[0, 60, 120].map((deg) => (
        <line key={deg} x1="24" y1="8" x2="24" y2="40" transform={`rotate(${deg} 24 24)`} />
      ))}
    </svg>
  ),
};

/**
 * Marquee
 * Infinite scroller band. The content is rendered in as many identical copies
 * as needed to cover the screen, and the hook (useScrollMarquee) slides them
 * and wraps by one copy's width, so the loop never shows a seam.
 * Scroll down: faster, right to left. Scroll up: faster, left to right.
 *
 * GSAP layer (the sliding itself stays in the hook, which owns the track's transform):
 *  - the band is wiped open from left to right, and its words / icons rise in one by one
 *  - while you scroll, the whole band leans (skew) with the scroll speed and eases back when you stop
 */
export default function Marquee({ items = [] }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const periodRef = useRef(null);
  const [copies, setCopies] = useState(3);

  // Enough copies to cover the viewport plus one spare for the wrap.
  useEffect(() => {
    const section = sectionRef.current;
    const period = periodRef.current;
    if (!section || !period) return undefined;
    const update = () => {
      const w = period.offsetWidth;
      if (w > 0) setCopies(Math.max(2, Math.ceil(section.clientWidth / w) + 1));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(section);
    ro.observe(period);
    return () => ro.disconnect();
  }, [items]);

  useScrollMarquee({ sectionRef, trackRef, periodRef, deps: copies });

  /* ---------- GSAP: entrance + scroll skew ---------- */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const section = sectionRef.current;
    let onScrollEnd = null;

    const ctx = gsap.context((gctx) => {
      const skewEl = section.querySelector('.marquee__skew');
      const items = gsap.utils.toArray(section.querySelectorAll('.marquee__text, .marquee__icon'));

      // entrance
      gsap.set(section, { clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.set(items, { yPercent: 115 });
      ScrollTrigger.create({
        trigger: section,
        start: 'top 92%',
        end: 'max', // still plays if the page was opened already scrolled past the band
        once: true,
        onEnter: () =>
          gctx.add(() => {
            gsap.to(section, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' });
            gsap.to(items, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: { each: 0.06 }, delay: 0.35 });
          }),
      });

      // scroll skew: lean with the scroll velocity, ease back to flat when scrolling stops
      const skewTo = gsap.quickTo(skewEl, 'skewX', { duration: 0.6, ease: 'power3' });
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => skewTo(gsap.utils.clamp(-7, 7, self.getVelocity() / -350)),
      });
      onScrollEnd = () => skewTo(0);
      ScrollTrigger.addEventListener('scrollEnd', onScrollEnd);
    }, sectionRef);

    return () => {
      if (onScrollEnd) ScrollTrigger.removeEventListener('scrollEnd', onScrollEnd);
      ctx.revert();
    };
  }, []);

  const label = items
    .filter((item) => item.type === 'text')
    .map((item) => item.value)
    .join(', ');

  return (
    <section ref={sectionRef} id="marquee" aria-label={label} className="relative overflow-hidden">
      <div className="marquee__bg absolute inset-0" aria-hidden="true" />
      <p className="sr-only">{label}</p>

      {/* the wrapper is what leans with the scroll speed; the track inside is moved by useScrollMarquee */}
      <div className="marquee__skew relative z-10">
      <div ref={trackRef} aria-hidden="true" className="relative z-10 flex w-max will-change-transform">
        {Array.from({ length: copies }, (_, c) => (
          <div key={c} ref={c === 0 ? periodRef : undefined} className="flex shrink-0 items-center">
            {items.map((item, i) =>
              item.type === 'icon' ? (
                <span key={i} className="marquee__icon">
                  {ICONS[item.name]}
                </span>
              ) : (
                <span key={i} className="marquee__text">
                  {item.value}
                </span>
              )
            )}
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}