import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';

/* ------------------------------------------------------------------------------------------------
   Two separate navbars, nothing morphs between them:

   1. HERO BAR   a plain full-width bar at the very top of the page. It lives in the normal page flow, so it
                 simply scrolls away with the page. No animation, nothing to clip.
   2. FLOATING   a rounded floating card (wordmark + the same buttons). It stays hidden while the hero bar is
      CARD       on screen. Further down the page it slides in when you scroll UP and slides away when you
                 scroll DOWN. It only ever uses transform + opacity (no clipping), so shadows and edges are
                 never cut off.

   Both bars share one "expanded" state, so the links stay out when the card takes over from the hero bar.
   ------------------------------------------------------------------------------------------------ */
const MIN_DELTA = 4; // ignore tiny scroll jitters (trackpads, Lenis easing)
const SHOW_MS = 650; // the card slides in
const HIDE_MS = 380; // ... and away a little quicker
const SHOW_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // fast start, long soft landing
const HIDE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

/** Tracks the scroll: is the floating card in the hero zone (hidden), and should it show right now? */
function useFloatingNav(heroBarRef) {
  const [visible, setVisible] = useState(false);
  const [inHero, setInHero] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = Math.max(0, window.scrollY);
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY); // iOS rubber-banding can report negatives
      const heroEnd = heroBarRef.current ? heroBarRef.current.offsetHeight : 84; // where the hero bar has scrolled away
      if (y < heroEnd) {
        // the hero bar is on screen: the card stays out of the way
        setInHero(true);
        setVisible(false);
        lastY.current = y;
        return;
      }
      setInHero(false);
      const delta = y - lastY.current;
      if (Math.abs(delta) >= MIN_DELTA) {
        setVisible(delta < 0); // up = show, down = hide
        lastY.current = y;
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // the page may have been restored part-way down
    return () => window.removeEventListener('scroll', onScroll);
  }, [heroBarRef]);

  return { visible, inHero, reveal: () => setVisible(true) };
}

/* ------------------------------------------------------------------------------------------------
   Expanding nav links
   Collapsed:  ( 3 )  [ Menu ]  [ Download CV ]
   Expanded:   ( 0 )  [ About me ] [ Resume ] [ Contact ]  [ Download CV ]
   - the badge counts the links that are still tucked away (3 collapsed, 0 expanded)
   - hovering the badge turns the number into an arrow: "<" = expand to the left, ">" = shrink back
   - clicking Menu or the badge (collapsed) expands, clicking the badge (expanded) shrinks
   - hovering a pill turns it orange
   ------------------------------------------------------------------------------------------------ */
const NAV_LINKS = [
  { label: 'About me', href: '#about' },
  { label: 'Resume', href: 'RESUME' }, // resolved to the CV file below
  { label: 'Contact', href: '#contact' },
];

const EXPAND_MS = 650;
const EXPAND_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const NARROW = '(max-width: 520px)';

// one dark pill, orange on hover / keyboard focus (the design's hover state). Its size comes from the
// .nav-pill class in global.css (plain media queries, so the phone sizes always cascade in order).
const PILL =
  'nav-pill inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-ink font-semibold text-bg-raised ' +
  'transition-colors duration-[250ms] ease-brand hover:bg-accent focus-visible:bg-accent ' +
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white';

function useMedia(query) {
  return useSyncExternalStore(
    (notify) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', notify);
      return () => m.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

/** A slot in the row that grows from 0 to its natural width (and back). Closed slots are inert. */
function Slot({ open, ms, children, className = '', ...rest }) {
  return (
    <div
      className={`grid ${className}`}
      inert={!open}
      style={{ gridTemplateColumns: open ? '1fr' : '0fr', transition: `grid-template-columns ${ms}ms ${EXPAND_EASE}` }}
      {...rest}
    >
      <div className="min-w-0 overflow-hidden">
        <div
          className="flex items-center gap-2 pl-2 sm:gap-3 sm:pl-3 max-[360px]:gap-1.5 max-[360px]:pl-1.5"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateX(0)' : 'translateX(18px)',
            transition: `opacity ${ms * 0.55}ms ease ${open ? ms * 0.2 : 0}ms, transform ${ms}ms ${EXPAND_EASE}`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** The "Rahul©" wordmark of the floating card. Shrinks away while the links are out on a narrow card. */
function LogoSlot({ open, ms }) {
  return (
    <div
      className="grid"
      inert={!open}
      style={{ gridTemplateColumns: open ? '1fr' : '0fr', transition: `grid-template-columns ${ms}ms ${EXPAND_EASE}` }}
    >
      <div className="min-w-0 overflow-hidden py-1.5">
        <a
          href="#home"
          aria-label="Rahul, back to the top"
          className="flex w-max items-start whitespace-nowrap font-body text-[26px] font-extrabold leading-[0.86] tracking-[-0.06em] text-ink max-sm:text-[22px]"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateX(0)' : 'translateX(-14px)',
            transition: `opacity ${ms * 0.55}ms ease ${open ? ms * 0.2 : 0}ms, transform ${ms}ms ${EXPAND_EASE}`,
          }}
        >
          <span>Rahul</span>
          <span className="ml-[0.01em] -translate-y-[0.182em] text-[0.75em] leading-none tracking-normal">©</span>
        </a>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M12 3.5v11M7.5 10.5L12 15l4.5-4.5M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** badge + Menu / links + Download CV. Used by both bars; the expanded state is owned by <Navbar>. */
function NavCluster({ expanded, setExpanded, links, notificationCount, onMenuClick, cvHref, resumeHref, ms }) {
  const linksId = useId();
  const narrow = useMedia(NARROW);

  // the badge counts the links that are still hidden: all of them when collapsed, none when expanded
  const count = expanded ? 0 : (notificationCount ?? links.length);
  // on narrow phones there is no room for the Download CV pill next to three links: it steps aside
  const downloadOpen = !(expanded && narrow);

  return (
    <div className="flex items-center" data-expanded={expanded}>
      {/* the badge: a count that turns into an arrow on hover ("<" expands, ">" shrinks) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={linksId}
        aria-label={expanded ? 'Collapse navigation' : `Expand navigation, ${links.length} more links`}
        className="group/badge grid h-[40px] w-[40px] shrink-0 cursor-pointer place-items-center rounded-full bg-accent text-[15px] font-semibold text-white transition-transform duration-300 ease-brand hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink max-sm:h-8 max-sm:w-8 max-sm:text-[13px]"
      >
        <span
          key={count}
          aria-hidden="true"
          className="col-start-1 row-start-1 tabular-nums transition-[opacity,scale] duration-300 ease-brand group-hover/badge:scale-50 group-hover/badge:opacity-0 group-focus-visible/badge:scale-50 group-focus-visible/badge:opacity-0 motion-safe:animate-[nav-count-pop_450ms_cubic-bezier(0.22,1,0.36,1)]"
        >
          {count}
        </span>
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className={`col-start-1 row-start-1 scale-50 opacity-0 transition-[opacity,scale,rotate] duration-300 ease-brand group-hover/badge:scale-100 group-hover/badge:opacity-100 group-focus-visible/badge:scale-100 group-focus-visible/badge:opacity-100 max-sm:h-[17px] max-sm:w-[17px] ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          <path d="M14.5 5.5L8 12l6.5 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* collapsed: one Menu pill */}
      <Slot open={!expanded} ms={ms}>
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            onMenuClick?.();
          }}
          aria-expanded={expanded}
          aria-controls={linksId}
          className={`${PILL} cursor-pointer`}
        >
          Menu
        </button>
      </Slot>

      {/* expanded: the links the Menu pill was hiding */}
      <Slot open={expanded} ms={ms} id={linksId}>
        {links.map((link, i) => {
          const isResume = link.href === 'RESUME';
          return (
            <a
              key={link.label}
              href={isResume ? (resumeHref ?? cvHref) : link.href}
              {...(isResume ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={PILL}
              style={{ transitionDelay: expanded && ms ? `${i * 60}ms, 0ms` : undefined }}
            >
              {link.label}
            </a>
          );
        })}
      </Slot>

      <Slot open={downloadOpen} ms={ms}>
        <a href={cvHref} aria-label="Download CV" className={`${PILL} nav-pill--icon gap-2.5`}>
          <span className="max-sm:sr-only">Download CV</span>
          <DownloadIcon />
        </a>
      </Slot>
    </div>
  );
}

export default function Navbar({ notificationCount, onMenuClick, cvHref = '#', resumeHref, links = NAV_LINKS }) {
  const heroBarRef = useRef(null);
  const { visible, inHero, reveal } = useFloatingNav(heroBarRef);
  const [expanded, setExpanded] = useState(false);
  const [reduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  // the wordmark steps aside while the links are out and the card is too narrow to hold both
  const tablet = useMedia('(max-width: 799px)');

  // Escape shrinks the bar again
  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (e) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const ms = reduceMotion ? 0 : EXPAND_MS;
  const slide = reduceMotion ? 0 : visible ? SHOW_MS : HIDE_MS;
  const slideEase = visible ? SHOW_EASE : HIDE_EASE;
  const cluster = { expanded, setExpanded, links, notificationCount, onMenuClick, cvHref, resumeHref, ms };

  return (
    <>
      {/* 1) HERO BAR: in the page flow, scrolls away with the page */}
      <header id="site-header" ref={heroBarRef} className="nav-panel">
        <div className="ml-auto">
          <NavCluster {...cluster} />
        </div>
      </header>

      {/* 2) FLOATING CARD: separate bar, only outside the hero zone, slides in on scroll up / away on scroll down */}
      <div
        className="nav-float fixed inset-x-3 top-3 z-40 will-change-transform sm:inset-x-5 sm:top-4"
        inert={inHero}
        onFocusCapture={reveal} // keyboard users tabbing into the card always get it back
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-130%) scale(0.98)',
          transition: `transform ${slide}ms ${slideEase}, opacity ${slide * 0.7}ms ease`,
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <div className="nav-card">
          <LogoSlot open={!(expanded && tablet)} ms={ms} />
          <div className="ml-auto">
            <NavCluster {...cluster} />
          </div>
        </div>
      </div>
    </>
  );
}