import Container from '../../ui/Container';
import Eyebrow from '../../ui/Eyebrow';
import FooterPills from './FooterPills';

const linkCls =
  'font-mono text-[clamp(11px,0.95vw,13px)] leading-[1.2] text-white/80 underline-offset-[3px] transition-colors duration-200 hover:text-white hover:underline';
const headingCls = 'm-0 font-mono text-[clamp(15px,1.35vw,18px)] font-bold text-white';

const isExternal = (href) => /^https?:\/\//.test(href);

function LinkColumn({ title, links }) {
  return (
    <nav aria-label={title}>
      <h3 className={headingCls}>{title}</h3>
      <ul className="m-0 mt-[clamp(12px,1.5vw,19px)] flex list-none flex-col gap-[clamp(9px,0.9vw,12px)] p-0">
        {links.map(({ label, href }) => (
          <li key={label}>
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
 */
export default function Footer({ content }) {
  const { eyebrow, email, blurb, pages, elsewhere, address, watermark, pills } = content;

  // "RAHUL©" -> big word + small ©. If the data has no ©, the word just fills the width as before.
  const markChar = watermark.endsWith('©') ? '©' : '';
  const word = markChar ? watermark.slice(0, -1) : watermark;

  return (
    <footer id="footer" className="footer relative overflow-hidden text-white">
      <div className="footer__bg absolute inset-0" aria-hidden="true" />

      {/* the big faint word. textLength stretches it to the full width whatever the font does.
          The © is drawn separately, smaller and lifted to the cap line, like the hero's "Rahul©". */}
      <svg
        role="img"
        aria-label={watermark}
        viewBox="0 0 1000 215"
        className="pointer-events-none absolute bottom-0 left-1/2 block w-[calc(100%-clamp(48px,6.2vw,80px))] -translate-x-1/2 select-none"
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
            <Eyebrow className="text-white!">{eyebrow}</Eyebrow>
            <a
              href={`mailto:${email}`}
              className="mt-[clamp(14px,1.8vw,24px)] inline-block break-all font-mono text-[clamp(25px,3.5vw,52px)] font-medium leading-[1.1] tracking-[-0.015em] text-white underline decoration-2 underline-offset-[0.14em] transition-opacity duration-200 hover:opacity-80"
            >
              {email}
            </a>
            <p className="m-0 mt-[clamp(18px,2.4vw,32px)] max-w-[60ch] font-mono text-[clamp(11px,0.95vw,13px)] font-semibold leading-[1.55] text-white">
              {blurb}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-[26fr_31fr_43fr] md:gap-x-4">
            <LinkColumn title="Pages" links={pages} />
            <LinkColumn title="Elsewhere" links={elsewhere} />
            <div className="col-span-2 md:col-span-1">
              <h3 className={headingCls}>Address</h3>
              <div className="mt-[clamp(12px,1.5vw,19px)] flex flex-col gap-[clamp(9px,0.9vw,12px)]">
                <p className={`m-0 ${linkCls} hover:no-underline`}>
                  {address.emailLabel}{' '}
                  <a href={`mailto:${email}`} className="text-white/90 underline underline-offset-[3px] hover:text-white">
                    {email}
                  </a>
                </p>
                {address.lines.map((line) => (
                  <p key={line} className={`m-0 ${linkCls} hover:no-underline`}>
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