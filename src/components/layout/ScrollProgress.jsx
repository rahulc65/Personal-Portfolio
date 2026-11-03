import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';

/** A thin accent line at the very top of the page that fills as you scroll. */
export default function ScrollProgress() {
  const barRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        barRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.25,
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] w-full bg-accent"
      style={{ transformOrigin: '0% 50%' }}
    />
  );
}