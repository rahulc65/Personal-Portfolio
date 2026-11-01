import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Chip from '../../ui/Chip';
import PillButton from '../../ui/PillButton';

// the liquid effect is tuned a little differently for the smaller cards than for the hero portrait
const CARD_FLOW = { falloff: 0.7, distort: 1.7, split: 1.0, shimmer: 0.22 };

// the floating "View Project" pill
const FOLLOW_SECONDS = 0.45; // how softly the pill trails the cursor (higher = lazier)
const EDGE_GAP = 12; // keep the pill this far (px) inside the image edges

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M4.5 11.5 11.5 4.5" />
      <path d="M5.5 4.5h6v6" />
    </svg>
  );
}

export default function ProjectCard({ project, view = 'grid' }) {
  const { title, image, stack = [], status, url, description } = project;
  const isList = view === 'list';
  const hostRef = useRef(null);
  const imgRef = useRef(null);
  const btnRef = useRef(null);
  const hasLink = Boolean(url);

  // hover: liquid distortion + RGB split on the mockup (replaces the old zoom-in)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let cancelled = false;
    let detach = null;
    const start = () => {
      import('../../../webgl/FlowmapImage').then(({ attachFlowmapImage }) => {
        if (cancelled || !hostRef.current || !imgRef.current) return;
        detach = attachFlowmapImage(hostRef.current, imgRef.current, CARD_FLOW);
      });
    };
    // load the effect when the browser is idle, so it never competes with the first paint
    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 4000 }) : setTimeout(start, 1500);
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
      detach?.();
    };
    // switching grid/list remounts the image box, so re-attach to the new one
  }, [view]);

  // floating "View Project" pill: hidden at rest, appears on hover and trails the cursor.
  // Touch screens (no hover) get it pinned in the top-right corner instead, always visible.
  useEffect(() => {
    const host = hostRef.current;
    const btn = btnRef.current;
    if (!host || !btn || !hasLink) return undefined;

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover) {
      btn.dataset.pinned = 'true';
      return undefined;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.set(btn, { xPercent: -50, yPercent: -50, scale: 0.6, autoAlpha: 0 });
    const xTo = gsap.quickTo(btn, 'x', { duration: reduced ? 0.01 : FOLLOW_SECONDS, ease: 'power3' });
    const yTo = gsap.quickTo(btn, 'y', { duration: reduced ? 0.01 : FOLLOW_SECONDS, ease: 'power3' });

    // cursor position inside the image, clamped so the whole pill stays inside the card
    const target = (e) => {
      const r = host.getBoundingClientRect();
      const hw = btn.offsetWidth / 2 + EDGE_GAP;
      const hh = btn.offsetHeight / 2 + EDGE_GAP;
      return {
        x: gsap.utils.clamp(hw, r.width - hw, e.clientX - r.left),
        y: gsap.utils.clamp(hh, r.height - hh, e.clientY - r.top),
      };
    };

    const onEnter = (e) => {
      const { x, y } = target(e);
      gsap.set(btn, { x, y }); // start right under the cursor, no fly-in from a corner
      xTo(x, x);
      yTo(y, y);
      gsap.to(btn, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(1.7)', overwrite: 'auto' });
    };
    const onMove = (e) => {
      const { x, y } = target(e);
      xTo(x);
      yTo(y);
    };
    const onLeave = () => {
      gsap.to(btn, { scale: 0.6, autoAlpha: 0, duration: 0.25, ease: 'power2.in', overwrite: 'auto' });
    };

    host.addEventListener('pointerenter', onEnter);
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave);
    return () => {
      host.removeEventListener('pointerenter', onEnter);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(btn);
    };
  }, [hasLink, view]);

  // the whole card is the link when a url is set; without one it renders exactly as before
  const Wrapper = hasLink ? 'a' : 'div';
  const linkProps = hasLink
    ? {
        href: url,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': `${title}: open the website in a new tab`,
      }
    : {};

  const media = (
    <div
      ref={hostRef}
      className={`relative aspect-[16/10] w-full overflow-hidden rounded-[6px] bg-[#0c0c0c] ${
        hasLink ? 'project-card__media' : ''
      }`}
    >
      <img ref={imgRef} src={image} alt={title} loading="lazy" className="h-full w-full object-cover" />

      {hasLink && (
        // decorative: the card link itself is what gets clicked, so the pill ignores the pointer
        <span ref={btnRef} aria-hidden="true" className="project-card__cta">
          View Project
          <span className="project-card__cta-arrow">
            <ArrowIcon />
          </span>
        </span>
      )}
    </div>
  );

  const chips = (
    <>
      {stack.map((tag) => (
        <Chip key={tag}>{tag}</Chip>
      ))}
    </>
  );
  const statusChip = status && <Chip tone={status.tone === 'accent' ? 'accent' : 'dark'}>{status.label}</Chip>;

  // ---------- list view: text on the left, image on the right, divider lines between rows ----------
  if (isList) {
    return (
      <article className="project-card group border-b border-line first:border-t">
        <Wrapper
          {...linkProps}
          className="grid grid-cols-1 items-top gap-7 py-[clamp(28px,4vw,48px)] text-inherit no-underline outline-offset-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-[clamp(32px,5vw,80px)]"
        >
          <div className="order-2 flex flex-col items-start md:order-1">
            <h3 className="m-0 font-mono text-[clamp(28px,3.4vw,46px)] font-bold uppercase leading-[1.05] tracking-[-0.02em]">
              {title}
            </h3>

            <div className="mt-4 flex flex-wrap gap-2">
              {chips}
              {statusChip}
            </div>

            {description && (
              <p className="m-0 mt-5 max-w-[520px] text-[clamp(15px,1.2vw,17px)] leading-[1.6] text-ink-soft">
                {description}
              </p>
            )}

            {hasLink && (
              // a span, not a link: the whole row is already the link
              <PillButton as="span" className="mt-7">
                Visit Project
              </PillButton>
            )}
          </div>

          <div className="order-1 md:order-2">{media}</div>
        </Wrapper>
      </article>
    );
  }

  // ---------- grid view ----------
  return (
    <article className="project-card group flex flex-col">
      <Wrapper {...linkProps} className="flex flex-col text-inherit no-underline outline-offset-4">
        {media}

        <div className="mt-[18px] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">{chips}</div>
          {statusChip}
        </div>

        <h3 className="mt-3.5 font-mono text-2xl font-bold uppercase tracking-[-0.015em] sm:text-[34px]">
          {title}
        </h3>
      </Wrapper>
    </article>
  );
}