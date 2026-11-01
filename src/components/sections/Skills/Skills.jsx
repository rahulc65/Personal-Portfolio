import { useEffect, useRef } from 'react';
import Eyebrow from '../../ui/Eyebrow';
import SkillList from './SkillList';
import GravityPile from './GravityPile';

/**
 * Skills
 * Left: heading + a scrollable list of skill groups.
 * Right: the gravity playground (see GravityPile).
 * All content comes in as props (defaults live in data/skills.js).
 */
export default function Skills({ intro, groups = [], gravityItems = [] }) {
  const scrollRef = useRef(null);

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

  return (
    <section
      id="skills"
      className="skills relative flex flex-col overflow-hidden text-white lg:h-[97vh] lg:max-h-[920px] lg:flex-row"
    >
      <div className="skills__bg absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 flex min-h-0 flex-col px-5 pt-[clamp(32px,4.4vw,56px)] sm:px-8 lg:w-[clamp(340px,39%,580px)] lg:shrink-0 lg:pl-10 lg:pr-[clamp(24px,3vw,48px)]">
        <Eyebrow className="text-white!">Skills</Eyebrow>
        <h2 className="m-0 mt-[clamp(10px,1.4vw,18px)] font-mono text-[clamp(36px,4vw,60px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
          Skill Sets
        </h2>
        <p className="m-0 mt-[clamp(12px,1.4vw,18px)] max-w-[50ch] font-mono text-[clamp(12px,1vw,14px)] leading-[1.5] text-white">
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
