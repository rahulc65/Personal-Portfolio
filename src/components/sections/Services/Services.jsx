import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '../../../lib/gsap';
import Container from '../../ui/Container';
import Eyebrow from '../../ui/Eyebrow';
import ServiceRow from './ServiceRow';

/**
 * Services
 * Header + a multi-open accordion. The first row starts open; opening a row
 * never closes the others (each row toggles on its own).
 *
 * Motion (all GSAP): the background settles from a zoom while the section scrolls past, the title rises
 * letter by letter, the intro slides up line by line, then the row lines draw in from left to right with
 * each row's content rising behind them. Opening a row is animated in ServiceRow.
 */
export default function Services({ intro, services = [] }) {
  const rootRef = useRef(null);
  const [openIds, setOpenIds] = useState(() => new Set(services[0] ? [services[0].id] : []));

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* ---------- motion ---------- */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const splits = [];

    const ctx = gsap.context((gctx) => {
      const root = rootRef.current;
      const eyebrow = root.querySelector('.services__eyebrow');
      const title = root.querySelector('.services__title');
      const intro = root.querySelector('.services__intro');
      const list = root.querySelector('.services__list');
      
      // background: settles from a zoom as the section travels through the viewport
      gsap.fromTo(
        '.services__bg',
        { scale: 1.25 },
        { scale: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } }
      );

      // hidden start states
      gsap.set(eyebrow, { autoAlpha: 0, y: 16 });
      gsap.set([title, intro], { autoAlpha: 0 });
      const lines = gsap.utils.toArray(list.querySelectorAll('.service__line'));
      const rows = Array.from(list.children);
      gsap.set(lines, { scaleX: 0 });
      gsap.set(rows, { autoAlpha: 0, y: 26 });

      // header: split now (not at mount) so the lines are measured with the final fonts
      ScrollTrigger.create({
        trigger: root,
        start: 'top 70%',
        end: 'max', // still plays if the page was opened already scrolled past this section
        once: true,
        onEnter: () =>
          gctx.add(() => {
            const titleSplit = SplitText.create(title, { type: 'lines,chars', mask: 'lines' });
            const introSplit = SplitText.create(intro, { type: 'lines', mask: 'lines' });
            splits.push(titleSplit, introSplit);
            gsap.set(titleSplit.chars, { yPercent: 120 });
            gsap.set(introSplit.lines, { yPercent: 115 });
            gsap.set([title, intro], { autoAlpha: 1 });

            gsap
              .timeline({ defaults: { ease: 'expo.out' } })
              .to(eyebrow, { autoAlpha: 1, y: 0, duration: 1 }, 0)
              .to(titleSplit.chars, { yPercent: 0, duration: 1.2, stagger: 0.035, onComplete: () => titleSplit.revert() }, 0.1)
              .to(introSplit.lines, { yPercent: 0, duration: 1.2, stagger: 0.07, onComplete: () => introSplit.revert() }, 0.35);
          }),
      });

      // rows
      ScrollTrigger.create({
        trigger: list,
        start: 'top 88%',
        end: 'max',
        once: true,
        onEnter: () =>
          gctx.add(() => {
            // the divider lines draw from left to right, each row's content rises just behind its line
            gsap.to(lines, { scaleX: 1, duration: 1.6, ease: 'expo.inOut', stagger: 0.16 });
            gsap.to(rows, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.16, delay: 0.25 });
          }),
      });
    }, rootRef);

    return () => {
      splits.forEach((sp) => sp.revert());
      ctx.revert();
    };
  }, []);

  return (
    <section id="services" ref={rootRef} className="services relative overflow-hidden text-white">
      <div className="services__bg absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 pb-[clamp(48px,6vw,88px)] pt-[clamp(32px,4.4vw,56px)]">
        <Container>
          <Eyebrow className="services__eyebrow text-white!">My services</Eyebrow>
          <h2 className="services__title m-0 mt-[clamp(10px,1.4vw,18px)] font-mono text-[clamp(36px,4vw,60px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
            Services
          </h2>
          <p className="services__intro m-0 mt-[clamp(12px,1.4vw,18px)] max-w-[50ch] font-mono text-[clamp(12px,1vw,14px)] leading-[1.5] text-white">
            {intro}
          </p>
        </Container>

        <Container className="mt-[clamp(32px,4.4vw,60px)]">
          <div className="services__list">
            {services.map((service, i) => (
              <ServiceRow
                key={service.id}
                service={service}
                index={i}
                open={openIds.has(service.id)}
                onToggle={() => toggle(service.id)}
              />
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}