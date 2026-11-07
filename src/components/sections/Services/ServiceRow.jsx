import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '../../../lib/gsap';
import ServiceThumb from './ServiceThumb';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * ServiceRow
 * The open / close of the panel is still the CSS animation below. GSAP adds the polish:
 *  - the row's divider line is a real element: it draws from left to right (entrance, driven by Services),
 *    and a bright line draws over it on hover (and stays drawn while the row is open)
 *  - when a row opens: the whole picture card swipes down into place while the photo settles
 *    from a zoom, the heading rises line by line, the text fades up and the category chips pop in one by one
 *  - the row that is open on page load plays this when it scrolls into view
 */
export default function ServiceRow({ service, index, open, onToggle }) {
  const { id, title, description, tags = [], more, image } = service;
  const number = `(${String(index + 1).padStart(3, '0')})`;
  const panelId = `service-${id}-panel`;
  const rowRef = useRef(null);
  const prevOpen = useRef(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const root = rowRef.current;
    const changed = prevOpen.current !== null && prevOpen.current !== open; // user toggled (not the first render)
    prevOpen.current = open;

    let split = null;

    const ctx = gsap.context((gctx) => {
      const thumb = root.querySelector('.service__thumb');
      const img = root.querySelector('.service__thumb img');
      const heading = root.querySelector('.service__title');
      const desc = root.querySelector('.service__desc');
      const catTitle = root.querySelector('.service__cat');
      const tagEls = gsap.utils.toArray(root.querySelectorAll('.service__tag'));

      // everything starts "not shown yet"
      const hide = () => {
        gsap.set(thumb, { clipPath: 'inset(0% 0% 100% 0%)', yPercent: -30 });
        if (img) gsap.set(img, { scale: 1.3 });
        gsap.set(heading, { autoAlpha: 0 });
        gsap.set([desc, catTitle], { autoAlpha: 0, y: 16 });
        gsap.set(tagEls, { autoAlpha: 0, y: 14, scale: 0.85 });
      };

      const show = () => {
        hide();
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

        // picture card: the whole container swipes down into place (wiped open from its top edge while it slides
        // down), and the photo inside settles from a zoom
        tl.to(
          thumb,
          { clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0, duration: 1.3, ease: 'expo.inOut', clearProps: 'clipPath,transform' },
          0
        );
        if (img) tl.to(img, { scale: 1, duration: 1.9, clearProps: 'transform' }, 0);

        // heading: lines rise out of a mask
        split = SplitText.create(heading, { type: 'lines', mask: 'lines' });
        gsap.set(split.lines, { yPercent: 115 });
        gsap.set(heading, { autoAlpha: 1 });
        tl.to(split.lines, { yPercent: 0, duration: 1.1, stagger: 0.08, onComplete: () => split?.revert() }, 0.2);

        tl.to(desc, { autoAlpha: 1, y: 0, duration: 1 }, 0.4)
          .to(catTitle, { autoAlpha: 1, y: 0, duration: 1 }, 0.5)
          .to(tagEls, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.05 }, 0.6);
      };

      if (!open) {
        // closing (or closed on load): reset once the panel has finished folding away
        gsap.delayedCall(changed ? 0.7 : 0, hide);
      } else if (changed) {
        hide();
        gsap.delayedCall(0.25, () => gctx.add(show)); // let the panel start growing first
      } else {
        // open on page load: wait until the row scrolls into view
        hide();
        ScrollTrigger.create({
          trigger: root,
          start: 'top 88%',
          end: 'max',
          once: true,
          onEnter: () => gctx.add(show),
        });
      }
    }, rowRef);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, [open]);

  return (
    <div
      ref={rowRef}
      className={`group/row relative transition-colors duration-500 [--pad:clamp(18px,2vw,26px)] ${
        open ? '' : 'hover:bg-white/[0.03]'
      }`}
    >
      <div className="service__inner grid grid-cols-[52px_minmax(0,1fr)_34px] items-start sm:grid-cols-[clamp(64px,16%,360px)_minmax(0,1fr)_34px] py-[var(--pad)] md:grid-cols-[minmax(110px,24%)_minmax(0,1fr)_44px]">
        {/* number */}
        <span className="flex h-[34px] items-center font-mono text-[clamp(15px,1.45vw,19px)] font-bold text-white/60">
          {number}
        </span>

        {/* main cell: closed title and open layout share it */}
        <div className="grid">
          {/* closed title (visual only; the toggle button carries the accessible name) */}
          <span
            aria-hidden="true"
            className="pointer-events-none flex h-[34px] items-center font-mono text-[clamp(17px,2.1vw,30px)] font-bold leading-none tracking-[-0.01em] text-white [grid-area:1/1] md:absolute md:inset-x-0 md:top-[var(--pad)] md:justify-center"
            style={{
              opacity: open ? 0 : 1,
              transform: open ? 'translateY(-6px)' : 'translateY(0)',
              transition: `opacity 350ms ease ${open ? '0ms' : '250ms'}, transform 600ms ${EASE}`,
            }}
          >
            {title}
          </span>

          {/* open layout */}
          <div
            id={panelId}
            role="region"
            aria-label={title}
            inert={!open}
            className="grid [grid-area:1/1] motion-reduce:!transition-none"
            style={{
              gridTemplateRows: open ? '1fr' : '0fr',
              transition: `grid-template-rows 650ms ${EASE}`,
            }}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                className="grid items-start gap-[clamp(16px,2.4vw,40px)] md:grid-cols-[clamp(100px,13.8vw,200px)_minmax(0,1fr)_minmax(0,1fr)]"
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(14px)',
                  transition: `opacity 450ms ease ${open ? '200ms' : '0ms'}, transform 650ms ${EASE} ${open ? '120ms' : '0ms'}`,
                }}
              >
                <ServiceThumb src={image} alt={image ? title : ''} className="service__thumb max-w-[240px] md:max-w-none" />

                <div>
                  <h3 className="service__title m-0 max-w-[16ch] font-mono text-[clamp(18px,1.95vw,28px)] font-bold leading-[1.1] tracking-[-0.01em] text-white">
                    {title}
                  </h3>
                  <p className="service__desc m-0 mt-[clamp(10px,1.2vw,16px)] max-w-[34ch] font-mono text-[clamp(11px,0.95vw,13px)] leading-[1.5] text-white">
                    {description}
                  </p>
                </div>

                <div>
                  <p className="service__cat m-0 font-mono text-[14px] text-white">Categories</p>
                  <ul className="m-0 mt-3 flex max-w-[28ch] list-none flex-wrap gap-y-[7px] gap-x-[6px] p-0 md:max-w-[34ch]">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="service__tag rounded-pill bg-white px-3 py-[4px] font-mono text-[11px] font-semibold leading-[1.3] text-accent"
                      >
                        {tag}
                      </li>
                    ))}
                    {more && (
                      <li className="service__tag grid px-2 py-[4px] place-items-center rounded-pill bg-white font-mono text-[11px] font-bold text-accent">
                        {more}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* toggle: when closed its ::after stretches over the whole row, so the
            entire row is clickable; when open only the circle is. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={title}
          onClick={onToggle}
          className={`group relative grid h-[34px] w-[34px] cursor-pointer place-items-center justify-self-end rounded-full border-[1.5px] border-white bg-transparent text-white transition-colors duration-300 hover:bg-white hover:text-accent focus-visible:outline-white ${
            open ? '' : 'after:absolute after:inset-y-[calc(var(--pad)*-1)] after:right-0 after:-left-[2000px] after:content-[""]'
          }`}
        >
          <span aria-hidden="true" className="relative block h-[12px] w-[12px]">
            <span className="absolute left-0 top-1/2 h-[1.8px] w-full -translate-y-1/2 rounded-full bg-current" />
            <span
              className="absolute left-1/2 top-0 h-full w-[1.8px] -translate-x-1/2 rounded-full bg-current transition-transform duration-300"
              style={{ transform: `translateX(-50%) scaleY(${open ? 0 : 1})` }}
            />
          </span>
        </button>
      </div>

      {/* divider line: draws in on entrance (Services), bright line draws over it on hover / while open */}
      <span
        aria-hidden="true"
        className="service__line pointer-events-none absolute bottom-0 left-0 h-px w-full bg-white/35"
        style={{ transformOrigin: '0% 50%' }}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left bg-white transition-[scale] duration-[900ms] ease-brand ${
          open ? 'scale-x-100' : 'scale-x-0 group-hover/row:scale-x-100'
        }`}
      />
    </div>
  );
}