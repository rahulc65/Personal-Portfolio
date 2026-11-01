import Container from '../../ui/Container';
import VideoChip from './VideoChip';
import HandwrittenWord from './HandwrittenWord';

/**
 * Headline
 * One big centred sentence built from inline pieces (text, video cards, an
 * animated handwritten word, an orange pill). Content lives in data/headline.js.
 */
export default function Headline({ segments = [] }) {
  const plainText = segments
    .map((s) => (s.type === 'text' || s.type === 'pill' ? s.value : s.type === 'script' ? s.label : ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <section id="headline" className="pb-[clamp(64px,10vw,90px)] pt-[clamp(64px,11vw,110px)]">
      <Container>
        <h2
          aria-label={plainText}
          className="m-0 mx-auto text-center font-body text-[clamp(26px,3.3vw,65px)] font-semibold leading-[1.4] tracking-[-0.025em] text-[#2e2c29] max-md:leading-[1.4]"
        >
          {segments.map((seg, i) => {
            switch (seg.type) {
              case 'video':
                return <VideoChip key={i} {...seg} />;
              case 'script':
                return <HandwrittenWord key={i} label={seg.label} script={seg.script} />;
              case 'pill':
                return (
                  <span
                    key={i}
                    className="mx-[0.02em] inline-block rounded-pill bg-accent px-[0.43em] align-middle leading-[1.32] text-white"
                  >
                    {seg.value}
                  </span>
                );
              case 'break':
                return <br key={i} className="max-md:hidden" />;
              default:
                return <span key={i}>{seg.value}</span>;
            }
          })}
        </h2>
      </Container>
    </section>
  );
}