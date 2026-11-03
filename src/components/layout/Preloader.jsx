import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion, markIntroDone } from '../../lib/gsap';
import { lockScroll, unlockScroll } from '../../lib/scroll';

/* ------------------------------------------------------------------------------------------------
   Preloader
   Dark full-screen curtain: a greeting cycles through a few languages while a big counter runs
   0 -> 100. When the counter is done (and the fonts are in) the curtain lifts up with a curved bottom
   edge that flattens as it leaves, and the Hero intro starts underneath it.

   Edit GREETINGS / SHOW_ONCE_PER_SESSION below to taste.
   ------------------------------------------------------------------------------------------------ */
const GREETINGS = ['Hello', 'Namaskaram', 'Hola', 'Bonjour', 'Hello'];
const COUNT_SECONDS = 2.4;
const SHOW_ONCE_PER_SESSION = false; // true = only on the first visit of a browser session

const seen = () => {
  try {
    return sessionStorage.getItem('preloader-seen') === '1';
  } catch {
    return false;
  }
};
const remember = () => {
  try {
    sessionStorage.setItem('preloader-seen', '1');
  } catch {
    /* private mode: ignore */
  }
};

export default function Preloader() {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const skip = prefersReducedMotion() || (SHOW_ONCE_PER_SESSION && seen());

    if (skip) {
      root.style.display = 'none';
      markIntroDone();
      return undefined;
    }

    // always start the page from the top, so the Hero intro is what you see
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    lockScroll();

    let cancelled = false;

    const ctx = gsap.context(() => {
      const counter = { v: 0 };
      const countEl = root.querySelector('.preloader__count');
      const barEl = root.querySelector('.preloader__bar');
      const words = gsap.utils.toArray('.preloader__word');

      gsap.set(barEl, { scaleX: 0, transformOrigin: '0% 50%' });
      gsap.set(words, { yPercent: 110 });

      /* ---------- exit: counter + brand slide away, the curtain lifts ---------- */
      const exit = gsap.timeline({ paused: true, defaults: { ease: 'expo.inOut' } });
      exit
        .to('.preloader__count-inner', { yPercent: -110, duration: 0.8, ease: 'expo.in' }, 0)
        .to('.preloader__fade', { autoAlpha: 0, y: -20, duration: 0.6, ease: 'power2.in', stagger: 0.05 }, 0)
        .to(root, { yPercent: -100, duration: 1.3 }, 0.55)
        .to('.preloader__curve', { scaleY: 0, duration: 1.3, transformOrigin: '50% 0%' }, 0.55)
        // release the page + start the Hero while the curtain is still on its way out
        .call(
          () => {
            unlockScroll();
            markIntroDone();
            if (SHOW_ONCE_PER_SESSION) remember();
          },
          null,
          1.15
        )
        .set(root, { display: 'none' });

      /* ---------- count up + greetings ---------- */
      const intro = gsap.timeline();
      intro
        .from('.preloader__fade', { autoAlpha: 0, y: 20, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0)
        .to(
          counter,
          {
            v: 100,
            duration: COUNT_SECONDS,
            ease: 'power2.inOut',
            onUpdate: () => {
              countEl.textContent = String(Math.round(counter.v)).padStart(3, '0');
              gsap.set(barEl, { scaleX: counter.v / 100 });
            },
            onComplete: () => {
              // never lift the curtain before the fonts are in, or the Hero text would jump
              const fontsReady = document.fonts?.ready ?? Promise.resolve();
              fontsReady.then(() => {
                if (!cancelled) exit.play();
              });
            },
          },
          0
        );

      // greetings: each word rises in, holds, rises out (the last one stays until the exit)
      const step = COUNT_SECONDS / words.length;
      words.forEach((word, i) => {
        const t = i * step;
        intro.to(word, { yPercent: 0, duration: 0.55, ease: 'expo.out' }, t);
        if (i < words.length - 1) intro.to(word, { yPercent: -110, duration: 0.45, ease: 'expo.in' }, t + step - 0.35);
      });
    }, root);

    return () => {
      cancelled = true;
      ctx.revert();
      unlockScroll();
    };
  }, []);

  return (
    <div ref={rootRef} className="preloader fixed inset-0 z-[100]" role="presentation" aria-hidden="true">
      <div className="absolute inset-0 flex flex-col justify-between bg-ink p-5 text-bg-raised sm:p-8 lg:p-10">
        {/* top row */}
        <div className="preloader__fade flex items-start justify-between font-mono text-sm font-semibold">
          <span className="font-body text-[26px] font-extrabold leading-none tracking-[-0.06em]">Rahul©</span>
          <span className="text-bg-raised/60">( Portfolio — 2026 )</span>
        </div>

        {/* greeting */}
        <div className="relative h-[clamp(48px,9vw,120px)] overflow-hidden">
          {GREETINGS.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="preloader__word absolute inset-0 flex items-center font-display text-[clamp(40px,8vw,110px)] font-bold leading-none tracking-[-0.04em]"
            >
              <span className="mr-4 inline-block h-[0.14em] w-[0.14em] shrink-0 rounded-full bg-accent" />
              {word}
            </span>
          ))}
        </div>

        {/* counter + progress line */}
        <div>
          <div className="overflow-hidden">
            <div className="preloader__count-inner flex items-end justify-between">
              <span className="preloader__count font-display text-[clamp(90px,22vw,340px)] font-bold leading-[0.8] tracking-[-0.06em] tabular-nums">
                000
              </span>
              <span className="mb-2 font-mono text-[clamp(18px,3vw,40px)] font-semibold text-accent">%</span>
            </div>
          </div>
          <div className="preloader__fade mt-5 h-px w-full bg-bg-raised/20">
            <div className="preloader__bar h-full w-full bg-accent" />
          </div>
        </div>
      </div>

      {/* the curved lower edge: flattens while the curtain lifts */}
      <div
        className="preloader__curve absolute left-0 top-full w-full bg-ink"
        style={{ height: '10vw', borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
      />
    </div>
  );
}