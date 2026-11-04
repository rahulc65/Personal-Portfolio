import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '../../../lib/gsap';
import Container from '../../ui/Container';
import Eyebrow from '../../ui/Eyebrow';
import ProcessItem from './ProcessItem';
import ProcessMedia from './ProcessMedia';
import glassImage from '../../../assets/images/process-glass.jpg';

/**
 * Process
 * Motion (all GSAP):
 *  - the big statement is split into words that light up one by one as you scroll through it (scrubbed)
 *  - the accordion rows rise in, one after another
 *  - the image frame is wiped open (clip-path)
 *  - (in ProcessItem) opening a step fades its text and tags in; the film-strip roll in ProcessMedia is untouched
 */
export default function Process({ statement = [], steps = [], image = glassImage, imageAlt = '' }) {
  const rootRef = useRef(null);
  const [openId, setOpenId] = useState(steps[0]?.id ?? null);
  // The image follows the last step that was opened. Collapsing everything keeps that image on screen
  // (instead of rolling the film back to the first one).
  const [shownId, setShownId] = useState(steps[0]?.id ?? null);

  const activeIndex = Math.max(0, steps.findIndex((s) => s.id === shownId));

  const toggle = (id) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (next) setShownId(next);
  };

  /* ---------- motion ---------- */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let split = null;

    const ctx = gsap.context(() => {
      const root = rootRef.current;
      const statement = root.querySelector('.process__statement');
      const rows = gsap.utils.toArray(root.querySelectorAll('.process__row'));
      const list = root.querySelector('.process__list');
      const media = root.querySelector('.process__media');
      const eyebrow = root.querySelector('.process__eyebrow');

      // statement: words go from faint to full ink while the paragraph scrolls through the screen
      split = SplitText.create(statement, { type: 'words' });
      // SplitText turns every word into an inline-block, and each one would inherit the statement's
      // text-indent (24%, from global.css), which is what scrambled the spacing. Reset it on the words.
      gsap.set(split.words, { textIndent: 0 });
      gsap.fromTo(
        split.words,
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.12,
          scrollTrigger: { trigger: statement, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 },
        }
      );

      // accordion rows + label
      gsap.set(rows, { autoAlpha: 0, y: 36 });
      gsap.set(eyebrow, { autoAlpha: 0, y: 16 });
      ScrollTrigger.create({
        trigger: list,
        start: 'top 85%',
        end: 'max',
        once: true,
        onEnter: () =>
          ctx.add(() => {
            gsap.to(eyebrow, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' });
            gsap.to(rows, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12, delay: 0.1 });
          }),
      });

      // image frame: wiped open from the top
      if (media) {
        gsap.set(media, { clipPath: 'inset(0% 0% 100% 0%)' });
        ScrollTrigger.create({
          trigger: media,
          start: 'top 85%',
          end: 'max',
          once: true,
          onEnter: () =>
            ctx.add(() =>
              gsap.to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' })
            ),
        });
      }
    }, rootRef);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section id="process" ref={rootRef} className="py-[clamp(56px,8vw,80px)]">
      <Container>
        <p className="process__statement m-0 font-mono color-[#2C2C2C] text-[clamp(26px,4.4vw,64px)] font-bold leading-[1.12] tracking-[-0.03em]">
          {statement.map((part, i) =>
            typeof part === 'string' ? (
              <span key={i}>{part}</span>
            ) : (
              <span key={i} className="text-accent">
                {part.accent}
              </span>
            )
          )}
        </p>
      </Container>

      <Container className="mt-[clamp(40px,6vw,88px)] grid items-start gap-[clamp(32px,6vw,96px)] md:grid-cols-[1.12fr_1fr]">
        <div>
          <Eyebrow className="process__eyebrow text-[12px]!">Process</Eyebrow>
          <div className="process__list mt-[clamp(12px,1.6vw,20px)] border-t border-ink/25">
            {steps.map((step) => (
              <ProcessItem
                key={step.id}
                step={step}
                open={openId === step.id}
                onToggle={() => toggle(step.id)}
              />
            ))}
          </div>
        </div>

        <ProcessMedia steps={steps} activeIndex={activeIndex} fallbackImage={image} fallbackAlt={imageAlt} />
      </Container>
    </section>
  );
}