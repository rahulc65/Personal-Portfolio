import { useState } from 'react';

const CARD_H = 68; // px, every card has the same height
const GAP = 10; // px between cards when expanded
const PEEK = 10; // px each stacked card peeks out below the one above
const PEEK_SCALE = 0.05; // each stacked card is this much narrower
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * CvStack
 * A stack of cards that fans out into a vertical list.
 *
 * Collapsed: the top card is fully visible, the next two peek out below it
 *            (slightly narrower), the rest hide behind them.
 * Expanded:  every card slides down to its own row, one after another, and the
 *            button text changes to "See less". Clicking again folds them back.
 *
 * Cards are absolutely positioned and only `transform`/`opacity` animate, plus
 * the wrapper height so everything below (the button) glides along.
 */
export default function CvStack({ entries = [] }) {
  const [open, setOpen] = useState(false);
  const n = entries.length;

  const openHeight = n * CARD_H + (n - 1) * GAP;
  const closedHeight = CARD_H + Math.min(n - 1, 2) * PEEK;

  return (
    <div>
      <div
        id="cv-stack"
        className="relative motion-reduce:!transition-none"
        style={{
          height: open ? openHeight : closedHeight,
          transition: `height 650ms ${EASE}`,
        }}
      >
        {entries.map((entry, i) => {
          const depth = Math.min(i, 2); // cards past the 3rd sit exactly behind the 3rd
          const transform = open
            ? `translateY(${i * (CARD_H + GAP)}px) scale(1)`
            : `translateY(${depth * PEEK}px) scale(${1 - depth * PEEK_SCALE})`;
          const hiddenBehind = !open && i > 2;
          // Open: cascade top to bottom. Close: fold back bottom to top.
          const delay = open ? i * 70 : (n - 1 - i) * 45;

          return (
            <article
              key={`${entry.role}-${i}`}
              aria-hidden={!open && i > 0 ? true : undefined}
              className="absolute left-0 top-0 flex w-full origin-top flex-col justify-center rounded-[6px] bg-white px-4 shadow-[0_2px_10px_rgba(20,18,15,0.14)] motion-reduce:!transition-none"
              style={{
                height: CARD_H,
                zIndex: n - i,
                transform,
                opacity: hiddenBehind ? 0 : 1,
                transition: `transform 650ms ${EASE} ${delay}ms, opacity 400ms ease ${delay}ms`,
              }}
            >
              <h4 className="m-0 font-mono text-[clamp(13px,1.1vw,15px)] font-bold text-ink">{entry.role}</h4>
              <div className="mt-1.5 flex items-baseline justify-between gap-3 font-mono text-[11px] text-ink-soft">
                <span>{entry.company}</span>
                <span className="tabular-nums">{entry.period}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-[clamp(22px,2.6vw,32px)] flex justify-center">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="cv-stack"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-ink bg-transparent py-[3px] pl-3 pr-[3px] font-mono text-[11px] font-medium text-ink transition-colors duration-300 hover:bg-ink hover:text-white"
        >
          <span>{open ? 'See less' : 'See all'}</span>
          <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-accent text-white">
            <svg
              width="9"
              height="9"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`transition-transform duration-500 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
              style={{ transitionTimingFunction: EASE }}
            >
              <path d="M2.5 4.5 6 8l3.5-3.5" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}