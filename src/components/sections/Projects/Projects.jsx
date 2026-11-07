import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '../../../lib/gsap';
import Eyebrow from '../../ui/Eyebrow';
import Container from '../../ui/Container';
import PillButton from '../../ui/PillButton';
import ProjectCard from './ProjectCard';

export default function Projects({
  projects = [],
  intro = "A collection of ideas, experiments, and creations brought to life through design and code. Here's a little glimpse into what I create.",
  viewprojectCta = { label: 'View all projects', href: '/projects' }
}) {
  const [view, setView] = useState('grid');
  const rootRef = useRef(null);
  const switching = useRef(false);
  const firstRun = useRef(true);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let split = null;

    const ctx = gsap.context((gctx) => {
      gsap.from('.projects__eyebrow, .projects__toggle', {
        autoAlpha: 0,
        y: 24,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.projects__head', start: 'top 85%', end: 'max', once: true },
      });

      split = SplitText.create('.projects__intro', {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.3,
            ease: 'expo.out',
            stagger: 0.08,
            scrollTrigger: { trigger: '.projects__intro', start: 'top 88%', end: 'max', once: true },
          });
        },
      });

      gsap.from('.projects__cta', {
        autoAlpha: 0,
        y: 30,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.projects__cta', start: 'top 98%', end: 'max', once: true },
      });
    }, rootRef);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const grid = root.querySelector('.projects__grid');
    if (grid) gsap.set(grid, { autoAlpha: 1, y: 0 }); // undo the fade-down of a layout switch
    switching.current = false;

    if (prefersReducedMotion()) return undefined;

    const splits = [];

    const ctx = gsap.context((gctx) => {
      // make a card fully visible again (used if its reveal animation ever fails)
      const showNow = (card) => {
        card.querySelectorAll('[data-reveal]').forEach((el) => {
          gsap.set(el, { clearProps: 'clipPath,opacity,visibility,transform,y' });
        });
        const img = card.querySelector('[data-reveal="media"] img');
        if (img) gsap.set(img, { clearProps: 'transform' });
      };

      const play = (card) => {
        const media = card.querySelector('[data-reveal="media"]');
        const img = media?.querySelector('img');
        const title = card.querySelector('[data-reveal="title"]');
        const meta = card.querySelectorAll('[data-reveal="meta"]');

        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

        if (media) {
          tl.to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' }, 0);
          if (img) tl.to(img, { scale: 1, duration: 1.9, clearProps: 'transform' }, 0);
        }

        if (title) {
          const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
          splits.push(split);
          gsap.set(split.lines, { yPercent: 115 });
          gsap.set(title, { autoAlpha: 1 });
          tl.to(split.lines, { yPercent: 0, duration: 1.1, stagger: 0.08, onComplete: () => split.revert() }, 0.3);
        }

        if (meta.length) tl.to(meta, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.45);
      };

      gsap.utils.toArray('.project-card').forEach((card) => {
        const media = card.querySelector('[data-reveal="media"]');
        const img = media?.querySelector('img');
        const title = card.querySelector('[data-reveal="title"]');
        const meta = card.querySelectorAll('[data-reveal="meta"]');

        // hidden start state
        if (media) gsap.set(media, { clipPath: 'inset(0% 0% 100% 0%)' });
        if (img) gsap.set(img, { scale: 1.35 });
        if (title) gsap.set(title, { autoAlpha: 0 });
        if (meta.length) gsap.set(meta, { autoAlpha: 0, y: 22 });

        ScrollTrigger.create({
          trigger: card,
          start: 'top 88%',
          end: 'max', 
          once: true,
          onEnter: () =>
            gctx.add(() => {
              // GSAP leaves its global context stuck if a callback throws, so never let one escape.
              try {
                play(card);
              } catch (err) {
                console.error('Project reveal failed:', err);
                showNow(card);
              }
            }),
        });
      });
    }, rootRef);

    if (!firstRun.current) ScrollTrigger.refresh();
    firstRun.current = false;

    return () => {
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, [view]);

  const changeView = (next) => {
    if (next === view || switching.current) return;
    if (prefersReducedMotion()) {
      setView(next);
      return;
    }
    const gridEl = rootRef.current?.querySelector('.projects__grid');
    if (!gridEl) {
      setView(next);
      return;
    }
    switching.current = true;
    gsap.to(gridEl, {
      autoAlpha: 0,
      y: 24,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => setView(next),
    });
  };

  const toggleBase =
    'rounded-pill border px-[18px] py-2.5 text-[13px] font-semibold uppercase tracking-[0.02em] cursor-pointer transition-colors duration-250 ease-brand';

  return (
    <section id="projects" ref={rootRef} className="py-[clamp(48px,8vw,60px)]">
      <Container className="projects__head mb-[clamp(40px,6vw,72px)] flex items-start justify-between gap-12 max-[860px]:flex-col max-[860px]:gap-6">
        <div>
          <Eyebrow className="projects__eyebrow">Featured Projects</Eyebrow>
          <div className="projects__toggle mt-3.5 inline-flex gap-2.5" role="tablist" aria-label="Project layout">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'grid'}
              onClick={() => changeView('grid')}
              className={`${toggleBase} ${
                view === 'grid'
                  ? 'border-accent bg-accent text-white'
                  : 'bg-transparent text-ink'
              }`}
            >
              Grid view
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'list'}
              onClick={() => changeView('list')}
              className={`${toggleBase} ${
                view === 'list'
                  ? 'border-accent bg-accent text-white'
                  : 'bg-transparent text-ink'
              }`}
            >
              List view
            </button>
          </div>
        </div>

        <p className="projects__intro m-0 w-[48%] text-[clamp(20px,2.4vw,28px)] leading-[1.35] tracking-[-0.01em]">
          {intro}
        </p>
      </Container>

      <Container
        className={`projects__grid grid ${
          view === 'grid'
            ? 'grid-cols-1 gap-x-6 gap-y-7 sm:gap-x-12 sm:gap-y-12 md:grid-cols-2'
            : 'grid-cols-1 gap-0' // list rows bring their own spacing + divider lines
        }`}
      >
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} view={view} />
        ))}
      </Container>

      <Container className="projects__cta pt-10">
        <PillButton as="a" href={viewprojectCta.href}>
          {viewprojectCta.label}
        </PillButton>
      </Container>
    </section>
  );
}