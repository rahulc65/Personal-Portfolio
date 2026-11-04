import { useRef, useLayoutEffect, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, onIntroDone, prefersReducedMotion } from '../../../lib/gsap';
import Container from '../../ui/Container';
import Eyebrow from '../../ui/Eyebrow';
import PillButton from '../../ui/PillButton';
import HeroTitle from './HeroTitle';
import HeroImage from './HeroImage';
import ArrowDownIcon from '../../ui/ArrowDownIcon';
import profileImg from '../../../assets/images/profile-img.png';

const HOVER_BLACK = 'hover:bg-ink hover:border-ink hover:text-bg-raised';

export default function Hero({
  name = 'Rahul',
  role = 'Creative Developer',
  bio = "Hello and welcome to my digital portfolio. I'm a Creative Developer dedicated to building engaging web experiences. Explore my portfolio.",
  image = profileImg,
  primaryCta = { label: 'Get in touch', href: '#contact' },
  secondaryCta = { label: 'View my works', href: '#projects' },
}) {
  const rootRef = useRef(null);
  const bioRef = useRef(null);

  const [titleReady, setTitleReady] = useState(false);

  const [introDone, setIntroDone] = useState(false);

  useLayoutEffect(() => {

    if (prefersReducedMotion()) return undefined;

    let stopWaiting = () => {};
    let split = null;
    let revealed = false;

    const ctx = gsap.context(() => {
      const header = document.getElementById('site-header');

      /* ---------- bio: split into lines, each in its own mask ---------- */
      split = SplitText.create(bioRef.current, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true, // re-splits by itself if the text re-wraps (resize / font load)
        onSplit(self) {
          if (!revealed) gsap.set(self.lines, { yPercent: 115 });
        },
      });

      /* ---------- intro timeline (paused until the preloader curtain is lifting) ---------- */
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: 'expo.out' },
        onComplete: () => {
          setIntroDone(true);
          ScrollTrigger.refresh();
        },
      });

      if (header) tl.from(header, { autoAlpha: 0, y: -28, duration: 1.2, clearProps: 'opacity,visibility,transform' }, 0);

      tl.from(
        '.hero__name-part',
        { yPercent: 125, rotate: 8, transformOrigin: '0% 100%', duration: 1.6, clearProps: 'transform' },
        0.05
      )
        .from('.hero__mark', { scale: 0, rotate: -220, duration: 1.3, ease: 'back.out(1.5)' }, 0.55)
        .call(() => setTitleReady(true), null, 1.9)
        .from('.hero__eyebrow', { autoAlpha: 0, y: 14, duration: 1 }, 0.55)
        // bio lines: created when this point of the timeline is reached (the split lines can be re-made on resize)
        .call(
          () => {
            revealed = true;
            ctx.add(() => gsap.to(split.lines, { yPercent: 0, duration: 1.3, stagger: 0.09, ease: 'expo.out' }));
          },
          null,
          0.65
        )
        .from('.hero__btn', { autoAlpha: 0, y: 36, duration: 1.1, stagger: 0.1 }, 0.85)
        .from('.hero__scroll', { autoAlpha: 0, y: 20, duration: 1 }, 1.05)
        // portrait: wipe down from its top edge, while the photo itself settles from a zoom
        .from('.hero__image', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.7, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.25)
        .from('.hero__image img', { scale: 1.4, duration: 2.2, clearProps: 'transform' }, 0.25);

      stopWaiting = onIntroDone(() => tl.play());

      /* ---------- bobbing scroll arrow ---------- */
      gsap.to('.hero__arrow', { y: 4, duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true });
    }, rootRef);

    return () => {
      stopWaiting();
      split?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section id="home" ref={rootRef} className="hero bg-bg">
      <Container className="hero__top relative flex items-start justify-between gap-10 pt-3 max-[860px]:flex-col max-[860px]:gap-5">
        <HeroTitle name={name} active={titleReady} />

        <div className="hero__about w-[var(--hero-about-w)] shrink-0 self-end max-[860px]:w-auto max-[860px]:self-start mb-[15px]">
          <Eyebrow className="hero__eyebrow">About me</Eyebrow>
          <p ref={bioRef} className="mt-2.5 text-base leading-[1.55] text-ink-soft">
            {bio}
          </p>
        </div>
      </Container>

      <Container className="relative z-10 mt-9 mb-10 flex flex-wrap items-center justify-between gap-6 max-[860px]:justify-start">
        <div className="hero__cta font-mono font-bold flex flex-wrap gap-3.5">
          {/* the wrapper span only handles the entrance animation; the pill keeps its own CSS hover */}
          <span className="hero__btn inline-block">
            <PillButton as="a" href={primaryCta.href} className={HOVER_BLACK}>
              {primaryCta.label}
            </PillButton>
          </span>
          <span className="hero__btn inline-block">
            <PillButton as="a" href={secondaryCta.href} className={HOVER_BLACK}>
              {secondaryCta.label}
            </PillButton>
          </span>
        </div>
        <p className="hero__scroll m-0 inline-flex items-center gap-[0.4em] text-sm text-ink-soft max-[860px]:order-3">
          <span>( Scroll down</span>
          <span className="hero__arrow inline-flex">
            <ArrowDownIcon />
          </span>
          {/* the design has the closing bracket snug against the arrow */}
          <span className="-ml-[0.22em]">)</span>
        </p>
      </Container>

      <HeroImage src={image} alt={`${name}, ${role}`} active={introDone} />
    </section>
  );
}