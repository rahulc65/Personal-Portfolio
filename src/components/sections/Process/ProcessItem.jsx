import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../../lib/gsap';


export default function ProcessItem({ step, open, onToggle }) {
  const { id, number, title, description, tags = [] } = step;
  const headerId = `process-${id}-header`;
  const panelId = `process-${id}-panel`;
  const bodyRef = useRef(null);
  const wasOpen = useRef(open);

  // opening a step: the text and then the tags fade up while the panel grows
  useEffect(() => {
    const opened = open && !wasOpen.current;
    wasOpen.current = open;
    if (!opened || prefersReducedMotion() || !bodyRef.current) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.process__desc',
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: 0.12 }
      );
      gsap.fromTo(
        '.process__tag',
        { autoAlpha: 0, y: 14, scale: 0.9 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05, delay: 0.25 }
      );
    }, bodyRef);
    return () => ctx.revert();
  }, [open]);

  return (
    <div className="process__row border-b border-ink/25">
      <h3 className="m-0">
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center gap-[clamp(18px,3.2vw,40px)] bg-transparent py-[clamp(12px,1.7vw,25px)] text-left font-mono"
        >
          <span className="w-[clamp(32px,3.4vw,44px)] shrink-0 text-[clamp(15px,1.5vw,24px)] font-mono font-bold text-ink-soft/70">
            {number}
          </span>
          <span className="flex-1 text-[clamp(26px,3vw,45px)] font-mono font-semibold leading-none tracking-[-0.02em] text-ink">
            {title}
          </span>
          <span aria-hidden="true" className="relative block h-[14px] w-[14px] shrink-0">
            <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-ink" />
            <span
              className={`absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 rounded-full bg-ink transition-transform duration-300 ease-brand ${
                open ? 'scale-y-0' : 'scale-y-100'
              }`}
            />
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows] duration-500 ease-brand ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div ref={bodyRef} className="border-ink/25 pb-[clamp(16px,2vw,24px)]">
            <p className="process__desc m-0 max-w-[80ch] font-mono text-[clamp(12px,1vw,15px)] leading-[1.55] text-ink">
              {description}
            </p>
            {tags.length > 0 && (
              <ul className="m-0 max-w-[80ch] mt-[clamp(14px,1.6vw,20px)] flex list-none flex-wrap gap-2 p-0">
                {tags.map((tag, i) => (
                  <li
                    key={`${tag}-${i}`}
                    className="process__tag rounded-pill border border-ink px-3.5 py-[5px] font-mono text-[clamp(11px,0.9vw,12.5px)] font-medium leading-none text-ink"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}