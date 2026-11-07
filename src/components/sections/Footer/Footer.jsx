import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '../../../lib/gsap';
import Container from '../../ui/Container';
import Eyebrow from '../../ui/Eyebrow';
import FooterPills from './FooterPills';

const linkCls =
  'font-mono text-[clamp(11px,0.95vw,13px)] leading-[1.2] text-white/80 underline-offset-[3px] transition-colors duration-200 hover:text-white hover:underline';
const headingCls = 'footer__head m-0 font-mono text-[clamp(15px,1.35vw,18px)] font-bold text-white';

const isExternal = (href) => /^https?:\/\//.test(href);

function LinkColumn({ title, links }) {
  return (
    <nav aria-label={title}>
      <h3 className={headingCls}>{title}</h3>
      <ul className="m-0 mt-[clamp(12px,1.5vw,19px)] flex list-none flex-col gap-[clamp(9px,0.9vw,12px)] p-0">
        {links.map(({ label, href }) => (
          <li key={label} className="footer__item">
            <a
              href={href}
              className={linkCls}
              {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Footer
 * Gradient footer: contact email and blurb on the left, three link columns on the
 * right, a huge faint word across the bottom, and the falling pills on top.
 * Content comes from data/footer.js.
 *
 * Motion (GSAP): the background settles from a zoom and the giant faint word rises up from the bottom edge as
 * the footer scrolls into view (scrubbed). Then the "Get in touch" label fades up, the email is wiped open
 * left to right, the blurb slides up line by line, and the column headings and links rise in one by one.
 * The falling pills (FooterPills / Gravitypile) keep their own physics and are untouched.
 */
export default function Footer({ content }) {
  const { eyebrow, email, blurb, pages, elsewhere, address, watermark, pills } = content;
  const rootRef = useRef(null);

  /* ---------- motion ---------- */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const splits = [];

    const ctx = gsap.context((gctx) => {
      const root = rootRef.current;
      const eyebrowEl = root.querySelector('.footer__eyebrow');
      const emailEl = root.querySelector('.footer__email');
      const blurbEl = root.querySelector('.footer__blurb');
      const heads = gsap.utils.toArray(root.querySelectorAll('.footer__head'));
      const items = gsap.utils.toArray(root.querySelectorAll('.footer__item'));

      // scrubbed: background settles, the giant word rises from the bottom edge (the footer clips it)
      const scrub = { trigger: root, start: 'top bottom', end: 'bottom bottom', scrub: true };
      gsap.fromTo('.footer__bg', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: scrub });
      gsap.fromTo('.footer__mark', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: scrub });

      // hidden start states
      gsap.set(eyebrowEl, { autoAlpha: 0, y: 16 });
      gsap.set(emailEl, { clipPath: 'inset(0% 100% 0% 0%)', y: 22 });
      gsap.set(blurbEl, { autoAlpha: 0 });
      gsap.set(heads, { autoAlpha: 0, y: 18 });
      gsap.set(items, { autoAlpha: 0, y: 16 });

      const play = () => {
        // split now (not at mount) so the lines are measured with the final fonts
        const blurbSplit = SplitText.create(blurbEl, { type: 'lines', mask: 'lines' });
        splits.push(blurbSplit);
        gsap.set(blurbSplit.lines, { yPercent: 115 });
        gsap.set(blurbEl, { autoAlpha: 1 });

        gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .to(eyebrowEl, { autoAlpha: 1, y: 0, duration: 1 }, 0)
          .to(emailEl, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.15)
          .to(blurbSplit.lines, { yPercent: 0, duration: 1.2, stagger: 0.07, onComplete: () => blurbSplit.revert() }, 0.5)
          .to(heads, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.5)
          .to(items, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.06 }, 0.7);
      };

      ScrollTrigger.create({
        trigger: root,
        start: 'top 75%',
        end: 'max', // still plays if the page was opened already at the bottom
        once: true,
        onEnter: () => gctx.add(play),
      });
    }, rootRef);

    return () => {
      splits.forEach((sp) => sp.revert());
      ctx.revert();
    };
  }, []);

  // "RAHUL©" -> big word + small ©. If the data has no ©, the word just fills the width as before.
  const markChar = watermark.endsWith('©') ? '©' : '';
  const word = markChar ? watermark.slice(0, -1) : watermark;

  return (
    <footer id="footer" ref={rootRef} className="footer relative overflow-hidden text-white">
      <div className="footer__bg absolute inset-0" aria-hidden="true" />

      {/* the big faint word. textLength stretches it to the full width whatever the font does.
          The © is drawn separately, smaller and lifted to the cap line, like the hero's "Rahul©". */}
      <svg
        role="img"
        aria-label={watermark}
        viewBox="0 0 1000 215"
        className="footer__mark pointer-events-none absolute bottom-0 left-1/2 block w-[calc(100%-clamp(48px,6.2vw,80px))] -translate-x-1/2 select-none"
      >
        <text
          x="0"
          y="236"
          textLength={markChar ? 836 : 1000}
          lengthAdjust="spacingAndGlyphs"
          fontSize="290"
          fontWeight="800"
          fill="rgba(255,255,255,0.17)"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {word}
        </text>
        {markChar && (
          <text
            x="820" /* where the © starts: word width + a small gap */
            y="155" /* baseline: lifts it so its top sits level with the top of the letters */
            textLength="155" /* its width, so the row still ends exactly at the right edge */
            lengthAdjust="spacingAndGlyphs"
            fontSize="165" /* about half the letter size, same ratio as the hero */
            fontWeight="800"
            fill="rgba(255,255,255,0.17)"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {markChar}
          </text>
        )}
      </svg>

      <Container className="relative z-10">
        <div className="grid gap-[clamp(36px,5vw,48px)] pb-[clamp(150px,17vw,250px)] max-sm:pb-[250px] pt-[clamp(56px,7vw,100px)] md:grid-cols-[1fr_0.96fr] md:gap-10">
          <div>
            <Eyebrow className="footer__eyebrow text-white!">{eyebrow}</Eyebrow>
            <a
              href={`mailto:${email}`}
              className="footer__email mt-[clamp(14px,1.8vw,24px)] inline-block break-all font-mono text-[clamp(25px,3.5vw,52px)] font-medium leading-[1.1] tracking-[-0.015em] text-white underline decoration-2 underline-offset-[0.14em] transition-opacity duration-200 hover:opacity-80"
            >
              {email}
            </a>
            <p className="footer__blurb m-0 mt-[clamp(18px,2.4vw,32px)] max-w-[60ch] font-mono text-[clamp(11px,0.95vw,13px)] font-semibold leading-[1.55] text-white">
              {blurb}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-[26fr_31fr_43fr] md:gap-x-4">
            <LinkColumn title="Pages" links={pages} />
            <LinkColumn title="Elsewhere" links={elsewhere} />
            <div className="col-span-2 md:col-span-1">
              <h3 className={headingCls}>Address</h3>
              <div className="mt-[clamp(12px,1.5vw,19px)] flex flex-col gap-[clamp(9px,0.9vw,12px)]">
                <p className={`footer__item m-0 ${linkCls} hover:no-underline`}>
                  {address.emailLabel}{' '}
                  <a href={`mailto:${email}`} className="text-white/90 underline underline-offset-[3px] hover:text-white">
                    {email}
                  </a>
                </p>
                {address.lines.map((line) => (
                  <p key={line} className={`footer__item m-0 ${linkCls} hover:no-underline`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>

      <FooterPills pills={pills} />
    </footer>
  );
}