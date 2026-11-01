import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Eyebrow from '../../ui/Eyebrow';
import Container from '../../ui/Container';
import PillButton from '../../ui/PillButton';
import ProjectCard from './ProjectCard';

gsap.registerPlugin(ScrollTrigger);

export default function Projects({
  projects = [],
  intro = "A collection of ideas, experiments, and creations brought to life through design and code. Here's a little glimpse into what I create.",
  viewprojectCta = { label: 'View all projects', href: '/projects' }
}) {
  const [view, setView] = useState('grid');
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.project-card', {
        autoAlpha: 0,
        y: 40,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: '.projects__grid',
          start: 'top 85%',
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, [view]);

  const toggleBase =
    'rounded-pill border px-[18px] py-2.5 text-[13px] font-semibold uppercase tracking-[0.02em] cursor-pointer transition-colors duration-250 ease-brand';

  return (
    <section id="projects" ref={rootRef} className="py-[clamp(48px,8vw,60px)]">
      <Container className="mb-[clamp(40px,6vw,72px)] flex items-start justify-between gap-12 max-[860px]:flex-col max-[860px]:gap-6">
        <div>
          <Eyebrow>Featured Projects</Eyebrow>
          <div className="mt-3.5 inline-flex gap-2.5" role="tablist" aria-label="Project layout">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'grid'}
              onClick={() => setView('grid')}
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
              onClick={() => setView('list')}
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

        <p className="m-0 max-w-[700px] text-[clamp(20px,2.4vw,28px)] leading-[1.35] tracking-[-0.01em]">
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

      <Container
           className="pt-10">
      <PillButton as="a" href={viewprojectCta.href}>
        {viewprojectCta.label}
      </PillButton>
      </Container>
    </section>
  );
}