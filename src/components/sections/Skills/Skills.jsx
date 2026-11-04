import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '../../../lib/gsap';
import Eyebrow from '../../ui/Eyebrow';
import SkillList from './SkillList';
import GravityPile from './GravityPile';

/**
 * Skills
 * Left: heading + a scrollable list of skill groups.
 * Right: the gravity playground (see GravityPile, which has its own physics and is not touched here).
 * All content comes in as props (defaults live in data/skills.js).
 *
 * Motion (all GSAP):
 *  - the background slowly settles from a zoom while the section scrolls past (scrub)
 *  - when the section comes into view: the title is split into letters that rise out of a mask, the intro
 *    lines slide up, then each group title and its rows follow. Every row draws its divider line from
 *    left to right and its number counts up.
 */
export default function Skills({ intro, groups = [], gravityItems = [] }) {
  const scrollRef = useRef(null);
  const rootRef = useRef(null);

  // Lenis hijacks wheel events page-wide. Opt the list out of it so it scrolls
  // natively, but only while it actually overflows (otherwise the wheel would
  // be swallowed over a list that has nothing to scroll).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const update = () => {
      if (el.scrollHeight > el.clientHeight + 1) el.setAttribute('data-lenis-prevent', '');
      else el.removeAttribute('data-lenis-prevent');
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [groups]);

  /* ---------- motion ---------- */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const splits = [];

    const ctx = gsap.context(() => {
      const root = rootRef.current;

      // background: settles from a zoom as the section travels through the viewport
      gsap.fromTo(
        '.skills__bg',
        { scale: 1.25 },
        { scale: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } }
      );

      const title = root.querySelector('.skills__title');
      const intro = root.querySelector('.skills__intro');
      const groupTitles = gsap.utils.toArray('.skills__group-title');
      const groups = gsap.utils.toArray('.skills__group');

      // hidden start state
      gsap.set('.skills__eyebrow', { autoAlpha: 0, y: 16 });
      gsap.set([title, intro], { autoAlpha: 0 });
      gsap.set(groupTitles, { autoAlpha: 0, y: 24 });
      groups.forEach((group) => {
        gsap.set(group.querySelectorAll('.skills__row'), {
          autoAlpha: 0,
          y: 22,
          backgroundSize: '0% 1px',
          backgroundPosition: 'left bottom',
        });
      });

      const play = () => {
        // split now (not at mount) so the lines are measured with the final fonts
        const titleSplit = SplitText.create(title, { type: 'lines,chars', mask: 'lines' });
        const introSplit = SplitText.create(intro, { type: 'lines', mask: 'lines' });
        splits.push(titleSplit, introSplit);
        gsap.set(titleSplit.chars, { yPercent: 120 });
        gsap.set(introSplit.lines, { yPercent: 115 });
        gsap.set([title, intro], { autoAlpha: 1 });

        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.to('.skills__eyebrow', { autoAlpha: 1, y: 0, duration: 1 }, 0)
          .to(titleSplit.chars, { yPercent: 0, duration: 1.2, stagger: 0.035, onComplete: () => titleSplit.revert() }, 0.1)
          .to(introSplit.lines, { yPercent: 0, duration: 1.2, stagger: 0.07, onComplete: () => introSplit.revert() }, 0.35);

        groups.forEach((group, gi) => {
          const base = 0.65 + gi * 0.3;
          const rows = group.querySelectorAll('.skills__row');
          tl.to(group.querySelector('.skills__group-title'), { autoAlpha: 1, y: 0, duration: 1 }, base);

          tl.to(
            rows,
            {
              autoAlpha: 0.8, // matches the opacity-80 on the rows
              y: 0,
              duration: 1,
              stagger: 0.08,
            },
            base + 0.15
          ).to(
            rows,
            {
              backgroundSize: '100% 1px',
              duration: 1.4,
              ease: 'expo.inOut',
              stagger: 0.08,
              clearProps: 'backgroundSize,backgroundPosition',
            },
            base + 0.15
          );

          // numbers count up from 00
          rows.forEach((row, ri) => {
            const el = row.querySelector('.skills__value');
            const end = parseInt(el.textContent, 10);
            if (Number.isNaN(end)) return;
            const digits = el.textContent.length;
            const counter = { v: 0 };
            el.textContent = '0'.repeat(digits);
            tl.to(
              counter,
              {
                v: end,
                duration: 1.2,
                ease: 'power3.out',
                onUpdate: () => {
                  el.textContent = String(Math.round(counter.v)).padStart(digits, '0');
                },
              },
              base + 0.15 + ri * 0.08
            );
          });
        });
      };

      ScrollTrigger.create({
        trigger: root,
        start: 'top 70%',
        end: 'max', // still plays if the page was opened already scrolled past this section
        once: true,
        onEnter: () => ctx.add(play),
      });
    }, rootRef);

    return () => {
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="skills"
      ref={rootRef}
      className="skills relative flex flex-col overflow-hidden text-white lg:h-[97vh] lg:max-h-[920px] lg:flex-row"
    >
      <div className="skills__bg absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 flex min-h-0 flex-col px-5 pt-[clamp(32px,4.4vw,56px)] sm:px-8 lg:w-[clamp(340px,39%,580px)] lg:shrink-0 lg:pl-10 lg:pr-[clamp(24px,3vw,48px)]">
        <Eyebrow className="skills__eyebrow text-white!">Skills</Eyebrow>
        <h2 className="skills__title m-0 mt-[clamp(10px,1.4vw,18px)] font-mono text-[clamp(36px,4vw,60px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
          Skill Sets
        </h2>
        <p className="skills__intro m-0 mt-[clamp(12px,1.4vw,18px)] max-w-[50ch] font-mono text-[clamp(12px,1vw,14px)] leading-[1.5] text-white">
          {intro}
        </p>

        <div
          ref={scrollRef}
          className="skills__scroll mt-[clamp(24px,3.2vw,40px)] min-h-0 max-h-[380px] overflow-y-auto pb-16 pr-3 lg:max-h-none lg:flex-1"
        >
          {groups.map((group) => (
            <SkillList key={group.title} {...group} />
          ))}
        </div>
      </div>

      <GravityPile
        items={gravityItems}
        className="relative z-10 h-[clamp(420px,110vw,560px)] lg:h-auto lg:flex-1"
      />
    </section>
  );
}