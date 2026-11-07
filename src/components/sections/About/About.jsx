import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '../../../lib/gsap';
import Container from '../../ui/Container';
import Eyebrow from '../../ui/Eyebrow';
import CvStack from './CvStack';
import useFlowmapHover from '../../../hooks/Useflowmaphover';

import developmentImg from '../../../assets/images/about-me-images/rahul_portrait_img.webp'
// hover liquid effect on the portrait (every knob lives in IMAGE_FLOW_OPTIONS in webgl/FlowmapImage.js)
const PORTRAIT_FLOW = { falloff: 0.6, distort: 1.9, split: 0.9, shimmer: 0.18 };

const icon = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const LinkedInIcon = () => (
  <svg {...icon}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = () => (
  <svg {...icon}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

/**
 * About section
 * Left: original portrait with social badges and condensed CV.
 * Right: personal story and resume button.
 *
 * Motion (all GSAP): the title rises letter by letter, the intro slides up line by line, the portrait is
 * wiped open while the photo settles from a zoom (social chips pop in after), the CV block fades up
 * (CvStack keeps its own card animation), every story paragraph reveals line by line as it scrolls in,
 * and the resume button rises last.
 */

export default function About({
  intro,
  paragraphs = [],
  cv = [],
  links = {},
  image,
  imageAlt = 'Rahul portrait',
}) {
  // Use the imported portrait by default.
  // A custom image passed through the `image` prop takes priority.
  const portraitImage = image || developmentImg;

  const rootRef = useRef(null);
  const portraitHostRef = useRef(null);
  const portraitImgRef = useRef(null);
  useFlowmapHover(portraitHostRef, portraitImgRef, PORTRAIT_FLOW);

  /* ---------- motion ---------- */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const splits = [];

    const ctx = gsap.context((gctx) => {
      const root = rootRef.current;
      const one = (sel) => root.querySelector(sel);
      const all = (sel) => gsap.utils.toArray(root.querySelectorAll(sel));

      const eyebrow = one('.about__eyebrow');
      const title = one('.about__title');
      const intro = one('.about__intro');
      const portrait = one('.about__portrait');
      const portraitImg = portrait?.querySelector('img');
      const chips = all('.about__social a');
      const cvTitle = one('.about__cv-title');
      const cv = one('.about__cv');
      const paras = all('.about__para');
      const resume = one('.about__resume');

      // when(el, start, fn): run fn once, the first time `el` reaches `start` (also if the page opened further down)
      const when = (el, start, fn) =>
        el &&
        ScrollTrigger.create({ trigger: el, start, end: 'max', once: true, onEnter: () => gctx.add(fn) });

      /* hidden start states */
      gsap.set(eyebrow, { autoAlpha: 0, y: 16 });
      gsap.set([title, intro], { autoAlpha: 0 });
      if (portrait) gsap.set(portrait, { clipPath: 'inset(0% 0% 100% 0%)' });
      if (portraitImg) gsap.set(portraitImg, { scale: 1.3 });
      gsap.set(chips, { autoAlpha: 0, y: 14 });
      gsap.set([cvTitle, cv], { autoAlpha: 0, y: 26 });
      gsap.set(paras, { autoAlpha: 0 });
      gsap.set(resume, { autoAlpha: 0, y: 24 });

      /* header */
      when(root, 'top 75%', () => {
        // split now (not at mount) so the lines are measured with the final fonts
        const titleSplit = SplitText.create(title, { type: 'lines,chars', mask: 'lines' });
        const introSplit = SplitText.create(intro, { type: 'lines', mask: 'lines' });
        splits.push(titleSplit, introSplit);
        gsap.set(titleSplit.chars, { yPercent: 120 });
        gsap.set(introSplit.lines, { yPercent: 115 });
        gsap.set([title, intro], { autoAlpha: 1 });

        gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .to(eyebrow, { autoAlpha: 1, y: 0, duration: 1 }, 0)
          .to(titleSplit.chars, { yPercent: 0, duration: 1.2, stagger: 0.04, onComplete: () => titleSplit.revert() }, 0.1)
          .to(introSplit.lines, { yPercent: 0, duration: 1.2, stagger: 0.07, onComplete: () => introSplit.revert() }, 0.35);
      });

      /* portrait */
      when(portrait, 'top 85%', () => {
        gsap
          .timeline()
          .to(portrait, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
          .to(portraitImg, { scale: 1, duration: 2, ease: 'expo.out', clearProps: 'transform' }, 0)
          .to(chips, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.1 }, 1);
      });

      /* condensed CV */
      when(cvTitle, 'top 92%', () => {
        gsap.to([cvTitle, cv], { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12 });
      });

      /* story paragraphs: each one reveals line by line when it comes into view */
      paras.forEach((p) => {
        when(p, 'top 90%', () => {
          const split = SplitText.create(p, { type: 'lines', mask: 'lines' });
          splits.push(split);
          gsap.set(split.lines, { yPercent: 110 });
          gsap.set(p, { autoAlpha: 1 });
          gsap.to(split.lines, {
            yPercent: 0,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.05,
            onComplete: () => split.revert(),
          });
        });
      });

      /* resume button */
      when(resume, 'top 96%', () => {
        gsap.to(resume, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' });
      });
    }, rootRef);

    return () => {
      splits.forEach((sp) => sp.revert());
      ctx.revert();
    };
  }, []);

  return (
    <section id="about" ref={rootRef} className="py-[clamp(56px,8vw,60px)]">
      <Container>
        <Eyebrow className="about__eyebrow text-[12px]!">
          My story
        </Eyebrow>

        <h2 className="about__title m-0 mt-[clamp(8px,1vw,14px)] font-mono text-[clamp(36px,4vw,60px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
          About me
        </h2>

        <p className="about__intro m-0 mt-[clamp(10px,1.2vw,16px)] max-w-[50ch] font-mono text-[clamp(11px,0.9vw,13px)] leading-[1.5] text-ink">
          {intro}
        </p>
      </Container>

      <Container className="mt-[clamp(32px,4.4vw,50px)] grid items-start gap-[clamp(36px,5vw,72px)] md:grid-cols-[minmax(0,0.74fr)_minmax(0,1fr)]">
        {/* Left column */}
        <div>
          {/* Portrait image */}
          <div ref={portraitHostRef} className="about__portrait relative aspect-[1/0.9] w-full overflow-hidden rounded-[8px] bg-[#e0401a]">
            <img
              ref={portraitImgRef}
              src={portraitImage}
              alt={imageAlt}
              className="h-full w-full object-cover"
            />

            {/* Social media links */}
            {/* z-10: the social chips stay above the hover effect canvas */}
            <div className="about__social absolute bottom-[clamp(10px,1.4vw,16px)] right-[clamp(10px,1.4vw,16px)] z-10 flex items-center gap-2 text-white">
              {links.linkedin && (
                <a
                  href={links.linkedin.href}
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-[34px] items-center gap-1.5 rounded-pill border border-white/45 bg-black/25 px-3 font-mono text-[11px] font-medium backdrop-blur-sm transition-colors duration-300 hover:bg-white hover:text-accent"
                >
                  <LinkedInIcon />
                  <span>{links.linkedin.label}</span>
                </a>
              )}

              {links.instagram && (
                <a
                  href={links.instagram.href}
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-[34px] w-[34px] place-items-center rounded-full border border-white/45 bg-black/25 backdrop-blur-sm transition-colors duration-300 hover:bg-white hover:text-accent"
                >
                  <InstagramIcon />
                </a>
              )}
            </div>
          </div>

          {/* Condensed CV */}
          <h3 className="about__cv-title m-0 mt-[clamp(24px,3vw,40px)] font-mono text-[clamp(14px,1.2vw,17px)] font-bold text-ink">
            My Condensed CV
          </h3>

          <div className="about__cv mt-[clamp(14px,1.6vw,22px)] px-[clamp(8px,1.4vw,18px)]">
            <CvStack entries={cv} />
          </div>
        </div>

        {/* Right column */}
        <div className="max-w-[82ch]">
          {paragraphs.map((text) => (
            <p
              key={text.slice(0, 24)}
              className="about__para m-0 mb-[1.35em] font-mono text-[clamp(13px,1.1vw,16px)] leading-[1.55] text-ink"
            >
              {text}
            </p>
          ))}

          {/* Resume button */}
          {links.resume && (
            <a
              href={links.resume}
              className="about__resume group mt-[clamp(8px,1vw,14px)] inline-flex items-center gap-2.5 rounded-pill border border-ink py-[4px] pl-[18px] pr-[4px] font-mono text-[12px] font-medium text-ink transition-colors duration-300 hover:bg-ink hover:text-white"
            >
              <span>Resume</span>

              <span className="grid h-[24px] w-[24px] place-items-center rounded-full bg-accent text-white">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:rotate-45"
                >
                  <path d="M3 9 9 3M4 3h5v5" />
                </svg>
              </span>
            </a>
          )}
        </div>
      </Container>
    </section>
  );
}