import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '../../../lib/gsap';
import Container from '../../ui/Container';
import VideoChip from './VideoChip';
import HandwrittenWord from './HandwrittenWord';

/**
 * Headline
 * One big centred sentence built from inline pieces (text, video cards, an
 * animated handwritten word, an orange pill). Content lives in data/headline.js.
 *
 * Motion (all GSAP): when the sentence scrolls into view the words rise and fade in one by one, the video
 * cards pop in (see VideoChip), the orange "memorable." pill is wiped open from left to right, and the
 * handwritten word keeps writing itself (HandwrittenWord, untouched).
 */
export default function Headline({ segments = [] }) {
  const rootRef = useRef(null);
  const plainText = segments
    .map((s) => (s.type === 'text' || s.type === 'pill' ? s.value : s.type === 'script' ? s.label : ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

  /* ---------- motion ---------- */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const splits = [];

    const ctx = gsap.context(() => {
      const root = rootRef.current;
      const heading = root.querySelector('.headline__h');
      const texts = gsap.utils.toArray(root.querySelectorAll('.headline__text'));
      const pill = root.querySelector('.headline__pill');

      // hidden start state (the video cards hide themselves, see VideoChip)
      gsap.set(texts, { autoAlpha: 0 });
      if (pill) gsap.set(pill, { clipPath: 'inset(0% 100% 0% 0%)' });

      const play = () => {
        // only the plain text pieces are split: the video cards, the handwriting and the pill are left alone
        const split = SplitText.create(texts, { type: 'words', reduceWhiteSpace: false });
        splits.push(split);
        gsap.set(split.words, { autoAlpha: 0, y: '0.55em' });
        gsap.set(texts, { autoAlpha: 1 });

        const tl = gsap.timeline();
        tl.to(split.words, {
          autoAlpha: 1,
          y: 0,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.04,
          onComplete: () => split.revert(),
        });
        if (pill) {
          tl.to(pill, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', clearProps: 'clipPath' }, '-=0.8');
        }
      };

      ScrollTrigger.create({
        trigger: heading,
        start: 'top 80%',
        end: 'max', // still plays if the page was opened already scrolled past the sentence
        once: true,
        onEnter: () => ctx.add(play),
      });
    }, rootRef);

    return () => {
      splits.forEach((sp) => sp.revert());
      ctx.revert();
    };
  }, []);

  return (
    <section id="headline" ref={rootRef} className="pb-[clamp(64px,10vw,90px)] pt-[clamp(64px,11vw,110px)]">
      <Container>
        <h2
          aria-label={plainText}
          className="headline__h m-0 mx-auto text-center font-body text-[clamp(26px,3.3vw,65px)] font-semibold leading-[1.4] tracking-[-0.025em] text-[#2e2c29] max-md:leading-[1.4]"
        >
          {segments.map((seg, i) => {
            switch (seg.type) {
              case 'video':
                return <VideoChip key={i} {...seg} />;
              case 'script':
                return <HandwrittenWord key={i} label={seg.label} script={seg.script} />;
              case 'pill':
                return (
                  <span
                    key={i}
                    className="headline__pill mx-[0.02em] inline-block rounded-pill bg-accent px-[0.43em] align-middle leading-[1.32] text-white"
                  >
                    {seg.value}
                  </span>
                );
              case 'break':
                return <br key={i} className="max-md:hidden" />;
              default:
                return (
                  <span key={i} className="headline__text">
                    {seg.value}
                  </span>
                );
            }
          })}
        </h2>
      </Container>
    </section>
  );
}