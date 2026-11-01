import { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Container from '../../ui/Container';
import Eyebrow from '../../ui/Eyebrow';
import PillButton from '../../ui/PillButton';
import HeroTitle from './HeroTitle';
import HeroImage from './HeroImage';
import ArrowDownIcon from '../../ui/ArrowDownIcon';
import profileImg from '../../../assets/images/profile-img.png';

gsap.registerPlugin(ScrollTrigger);

// ---- DISABLED: title shrinks into the navbar on scroll (kept here so it can be switched back on) ----
// /* Size of the "Rahul©" wordmark once it has shrunk into the navbar (px, font size of the name).
//    Smaller on phones, where the navbar also holds the badge, Menu and CV buttons. */
// const NAV_FONT_PX = 38;
// const NAV_FONT_PX_PHONE = 30;
// const navFontPx = () => (window.innerWidth < 480 ? NAV_FONT_PX_PHONE : NAV_FONT_PX);
// /* Nudge the small wordmark up (-) or down (+) inside the navbar, in px. */
// const NAV_NUDGE = 0;

/**
 * Hero
 * Landing section: oversized name, about blurb and primary CTAs
 * over a full-bleed portrait. Content is passed as props so a
 * different name/copy/image can be dropped in without editing markup.
 */
export default function Hero({
  name = 'Rahul',
  role = 'Creative Developer',
  bio = "Hello and welcome to my digital portfolio. I'm a Creative Developer dedicated to building engaging web experiences. Explore my portfolio.",
  image = profileImg,
  primaryCta = { label: 'Get in touch', href: '#contact' },
  secondaryCta = { label: 'View my works', href: '#projects' },
}) {
  const rootRef = useRef(null);
  // true once the title's intro animation is done: the WebGL liquid effect takes over from the DOM text
  const [titleReady, setTitleReady] = useState(false);
  // true once the whole intro is done: the portrait's hover distortion is switched on
  const [introDone, setIntroDone] = useState(false);
  // const slotRef = useRef(null); // DISABLED (nav shrink): invisible copy of the title that keeps the hero's layout
  // const markRef = useRef(null); // DISABLED (nav shrink): the real title: fixed, shrinks into the navbar on scroll

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => setIntroDone(true) });

      tl.from('.hero__name-part', {
        yPercent: 110,
        duration: 0.9,
        stagger: 0.06,
      })
        .from('.hero__mark', { autoAlpha: 0, scale: 0.6, duration: 0.6 }, '-=0.5')
        .call(() => setTitleReady(true))
        .from(
          '.hero__about, .hero__cta',
          { autoAlpha: 0, y: 16, duration: 0.6, stagger: 0.1 },
          '-=0.4'
        )
        .from('.hero__image', { autoAlpha: 0, scale: 1.06, duration: 1 }, '-=0.6');

      // ---- DISABLED: scroll-driven shrink of the title into the navbar. Uncomment this block, the refs,
      // the constants at the top and the old <h1>/slot markup below to bring it back. ----
      // /* ---- scroll: the big title shrinks into the navbar, and grows back on the way up ----
      //    The real title is position:fixed. Its start position/size match the invisible copy in the
      //    hero (slotRef); its end position/size sit inside the sticky navbar. The scrubbed tween
      //    is tied to scroll position, so scrolling back up reverses it smoothly (Lenis smooths the
      //    scroll itself, `scrub` adds a little extra easing on top). */
      // const mark = markRef.current;
      // const slot = slotRef.current;
      // const header = document.getElementById('site-header');
      // if (mark && slot) {
      //   const measure = () => {
      //     const r = slot.getBoundingClientRect();
      //     const namePx = parseFloat(getComputedStyle(mark.querySelector('.hero__name-part')).fontSize) || 320;
      //     const s = navFontPx() / namePx;
      //     const navH = header ? header.offsetHeight : 84;
      //     return {
      //       x: r.left,
      //       y0: r.top + window.scrollY,
      //       s,
      //       yNav: (navH - mark.offsetHeight * s) / 2 + NAV_NUDGE,
      //       dist: Math.max(160, slot.offsetHeight * 0.8), // scroll distance over which it shrinks
      //     };
      //   };
      //
      //   gsap.set(mark, { transformOrigin: '0 0' });
      //   const shrink = gsap
      //     .timeline({ paused: true, defaults: { ease: 'power2.inOut' } })
      //     .fromTo(
      //       mark,
      //       { x: () => measure().x, y: () => measure().y0, scale: 1 },
      //       { x: () => measure().x, y: () => measure().yNav, scale: () => measure().s }
      //     );
      //
      //   ScrollTrigger.create({
      //     animation: shrink,
      //     start: 0,
      //     end: () => measure().dist,
      //     scrub: 0.6,
      //     invalidateOnRefresh: true,
      //     onUpdate: (self) => {
      //       // the title is only clickable (back to top) once it is small
      //       mark.style.pointerEvents = self.progress > 0.98 ? 'auto' : 'none';
      //       // hairline under the navbar fades in as the title docks
      //       if (header) header.style.boxShadow = `0 1px 0 rgba(20,18,15,${(0.14 * self.progress).toFixed(3)})`;
      //     },
      //   });
      //
      //   // fonts change the title's size when they load, so re-measure then
      //   document.fonts?.ready.then(() => ScrollTrigger.refresh());
      // }
    }, rootRef);

    return () => {
      ctx.revert();
      // const header = document.getElementById('site-header');
      // if (header) header.style.boxShadow = '';
    };
  }, []);

  return (
    <section id="home" ref={rootRef} className="hero bg-bg">
      <Container className="flex items-start justify-between gap-10 pt-3 max-[860px]:flex-col max-[860px]:gap-5">
        {/* Hero title: now a normal in-flow heading (no longer fixed / shrinking into the navbar). */}
        <HeroTitle name={name} active={titleReady} />

        {/* DISABLED (nav shrink): old invisible slot copy of the title
        <div
          ref={slotRef}
          aria-hidden="true"
          className="invisible m-0 inline-flex items-start font-display font-extrabold leading-[0.86] tracking-[-0.04em] text-ink"
        >
          <span className="inline-block overflow-hidden">
            <span className="hero__name-size hero__name-slot inline-block font-body tracking-[-0.06em]">{name}</span>
          </span>
          <span className="hero__copy-size ml-[0.01em] -translate-y-[0.182em] font-body leading-none">©</span>
        </div>
        */}

       <div className="hero__about w-[var(--hero-about-w)] shrink-0 self-end max-[860px]:w-auto max-[860px]:self-start mb-[15px]">
       <Eyebrow>About me</Eyebrow>
       <p className="mt-2.5 text-base leading-[1.55] text-ink-soft">{bio}</p>
      </div>
      </Container>

      {/* DISABLED (nav shrink): old fixed title that rode along into the navbar. Uncomment together with the effect above.
      <h1
        ref={markRef}
        aria-label={name}
        className="pointer-events-none fixed left-0 top-0 z-50 m-0 inline-flex origin-top-left items-start font-display font-extrabold leading-[0.86] tracking-[-0.04em] text-ink will-change-transform"
      >
        <a href="#home" tabIndex={-1} className="inline-flex items-start">
          <span className="inline-block overflow-hidden">
            <span className="hero__name-part hero__name-size inline-block font-body tracking-[-0.06em]">{name}</span>
          </span>
          <span
            className="hero__mark hero__copy-size ml-[0.01em] -translate-y-[0.182em] font-body leading-none"
            aria-hidden="true"
          >
            ©
          </span>
        </a>
      </h1>
      */}

      <Container className="mt-9 mb-10 flex flex-wrap items-center justify-between gap-6 max-[860px]:justify-start">
        <div className="hero__cta font-mono font-bold flex flex-wrap gap-3.5">
          <PillButton as="a" href={primaryCta.href}>
            {primaryCta.label}
          </PillButton>
          <PillButton as="a" href={secondaryCta.href}>
            {secondaryCta.label}
          </PillButton>
        </div>
        <p className="m-0 inline-flex items-center gap-[0.4em] text-sm text-ink-soft max-[860px]:order-3">
          <span>( Scroll down</span>
          <ArrowDownIcon />
          {/* the design has the closing bracket snug against the arrow */}
          <span className="-ml-[0.22em]">)</span>
        </p>
      </Container>

      <HeroImage src={image} alt={`${name}, ${role}`} active={introDone} />
    </section>
  );
}