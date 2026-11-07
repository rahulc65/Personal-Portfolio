import { useState } from 'react';

/**
 * ConstructionScene
 * Line illustration for the "under construction" page: a crane hoisting a picture onto a monitor,
 * with a ladder, cactus, lamp, cone and barrier around it.
 *
 * Colours come from the site palette: ink for the line work, the accent orange for the one thing the
 * crane is lifting, soft orange tints for the floating icons, and a sage green for the plants.
 *
 * Motion is kept to three quiet things: the hoisted picture sways on its cable, the two gears turn and
 * the clock's minute hand ticks round. All of it is SMIL, and is left out for people who prefer reduced motion.
 */
const INK = '#14120f';
const ACCENT = '#c1440e';
const TINT = '#f3cdb6'; // pale orange fill (the monitor screen)
const SOFT = '#d98a63'; // soft orange line (floating icons, barrier)
const SAGE = '#b5c99a'; // plants
const PAPER = '#f6f5f1'; // matches --color-bg-raised

/* ---------- small geometry helpers ---------- */

/** Outline of a gear: `teeth` teeth between radius ri (valley) and ro (tip). */
function gearPath(cx, cy, teeth, ro, ri) {
  const step = (Math.PI * 2) / teeth;
  const pt = (r, a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  const parts = [];
  for (let i = 0; i < teeth; i += 1) {
    const a = i * step;
    parts.push(
      `${i === 0 ? 'M' : 'L'}${pt(ri, a - step * 0.3)}`,
      `L${pt(ro, a - step * 0.17)}`,
      `L${pt(ro, a + step * 0.17)}`,
      `L${pt(ri, a + step * 0.3)}`
    );
  }
  return `${parts.join(' ')}Z`;
}

/** Crane tower: two rails with a rung and an X brace in every cell. */
const TOWER = { left: 431, right: 453, top: 113, bottom: 427, cells: 15 };
function towerPath() {
  const { left, right, top, bottom, cells } = TOWER;
  const h = (bottom - top) / cells;
  const d = [];
  for (let i = 0; i <= cells; i += 1) {
    const y = (top + i * h).toFixed(2);
    d.push(`M${left} ${y}H${right}`);
  }
  for (let i = 0; i < cells; i += 1) {
    const y1 = (top + i * h).toFixed(2);
    const y2 = (top + (i + 1) * h).toFixed(2);
    d.push(`M${left} ${y1}L${right} ${y2}M${right} ${y1}L${left} ${y2}`);
  }
  return d.join('');
}

/** Crane jib (the horizontal arm): zig-zag between a top and a bottom rail. */
const JIB = { x1: 350, x2: 495, top: 135, bottom: 157, steps: 13 };
function jibPath() {
  const { x1, x2, top, bottom, steps } = JIB;
  const dx = (x2 - x1) / steps;
  const pts = [];
  for (let k = 0; k <= steps; k += 1) pts.push(`${(x1 + k * dx).toFixed(2)} ${k % 2 === 0 ? bottom : top}`);
  return `M${pts.join('L')}`;
}

const GEAR_BIG = { cx: 203, cy: 190 };
const GEAR_SMALL = { cx: 221, cy: 213 };
const CLOCK = { cx: 282, cy: 210 };

function usePrefersReducedMotion() {
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  return reduced;
}

const Plus = ({ x, y }) => <path d={`M${x - 3.5} ${y}H${x + 3.5}M${x} ${y - 3.5}V${y + 3.5}`} />;

export default function ConstructionScene({ className = '' }) {
  const still = usePrefersReducedMotion();

  return (
    <svg
      viewBox="0 0 530 340"
      role="img"
      aria-label="A crane lowers a picture onto a computer screen, with a ladder, a cactus and a traffic cone standing by"
      className={className}
      fill="none"
      stroke={INK}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* the drawing was laid out on a 630-wide canvas; this shifts it into the viewBox */}
      <g transform="translate(-50 -100)">
        {/* ---------- ground ---------- */}
        <path d="M62 428H563" />

        {/* ---------- floating icons (soft orange) ---------- */}
        <g stroke={SOFT} strokeWidth="2.6" fill={TINT}>
          <g>
            <path d={gearPath(GEAR_BIG.cx, GEAR_BIG.cy, 10, 16, 12)} />
            <circle cx={GEAR_BIG.cx} cy={GEAR_BIG.cy} r="5" fill={PAPER} />
            {!still && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${GEAR_BIG.cx} ${GEAR_BIG.cy}`}
                to={`360 ${GEAR_BIG.cx} ${GEAR_BIG.cy}`}
                dur="30s"
                repeatCount="indefinite"
              />
            )}
          </g>
          <g>
            <path d={gearPath(GEAR_SMALL.cx, GEAR_SMALL.cy, 8, 10.5, 7.8)} />
            <circle cx={GEAR_SMALL.cx} cy={GEAR_SMALL.cy} r="3" fill={PAPER} />
            {!still && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${GEAR_SMALL.cx} ${GEAR_SMALL.cy}`}
                to={`-360 ${GEAR_SMALL.cx} ${GEAR_SMALL.cy}`}
                dur="24s"
                repeatCount="indefinite"
              />
            )}
          </g>
        </g>

        {/* clock */}
        <circle cx={CLOCK.cx} cy={CLOCK.cy} r="17" fill={PAPER} stroke={SOFT} strokeWidth="3" />
        <path d={`M${CLOCK.cx} ${CLOCK.cy}L${CLOCK.cx + 6.5} ${CLOCK.cy + 4}`} strokeWidth="2.4" />
        <path d={`M${CLOCK.cx} ${CLOCK.cy}V${CLOCK.cy - 10}`} strokeWidth="2.4">
          {!still && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${CLOCK.cx} ${CLOCK.cy}`}
              to={`360 ${CLOCK.cx} ${CLOCK.cy}`}
              dur="12s"
              repeatCount="indefinite"
            />
          )}
        </path>
        <path d="M304 207H319M306 213H317" stroke={SOFT} strokeWidth="2.2" />

        {/* magnifier */}
        <circle cx="375" cy="238" r="11" fill={PAPER} stroke={SOFT} strokeWidth="3" />
        <path d="M367 246L358 255" stroke={SOFT} strokeWidth="4.5" />
        <path d="M370 235a6 6 0 0 1 5-4" stroke={SOFT} strokeWidth="2" />

        {/* ---------- sparkles, dashes and dots ---------- */}
        <g strokeWidth="2.4">
          <path d="M153 257H221M262 238H303M470 292H537M86 397H121" />
          <Plus x={270} y={146} />
          <Plus x={283} y={257} />
          <Plus x={152} y={326} />
          <Plus x={308} y={409} />
        </g>
        <circle cx="402" cy="197" r="1.9" fill={INK} stroke="none" />
        <circle cx="490" cy="335" r="1.9" fill={INK} stroke="none" />

        {/* little window and list icons beside the monitor */}
        <g strokeWidth="2.2">
          <rect x="146" y="282" width="11" height="9" rx="1.5" />
          <path d="M134 286H142M137 291H142" />
          <rect x="335" y="405" width="22" height="10" rx="1.5" />
          <path d="M339 410H346" />
        </g>

        {/* ---------- crane ---------- */}
        <g>
          {/* tower */}
          <path d={towerPath()} strokeWidth="1.8" />
          <path
            d={`M${TOWER.left} ${TOWER.top}V${TOWER.bottom}M${TOWER.right} ${TOWER.top}V${TOWER.bottom}`}
            strokeWidth="3"
          />
          {/* jib */}
          <path d={`M${JIB.x1} ${JIB.bottom}H${JIB.x2}M361 ${JIB.top}H${JIB.x2}M${JIB.x2} ${JIB.top}V${JIB.bottom}`} strokeWidth="3" />
          <path d={jibPath()} strokeWidth="1.8" />
          {/* trolley */}
          <rect x="322" y="160" width="70" height="7" rx="1" fill={TINT} stroke="none" />
        </g>

        {/* ---------- monitor ---------- */}
        <rect x="168" y="268" width="212" height="132" rx="9" fill={PAPER} />
        <rect x="177" y="277" width="194" height="114" rx="4" fill={TINT} stroke="none" />
        <path d="M236 362L270 322M250 366L284 330" stroke="#fff" strokeWidth="4" opacity="0.75" />
        <path d="M257 400V419M294 400V419" />
        <rect x="232" y="419" width="85" height="8" rx="4" fill={PAPER} />

        {/* ---------- ladder ---------- */}
        <path d="M184 326V427M208 326V427M184 341H208M184 356H208M184 371H208M184 386H208M184 401H208M184 416H208" strokeWidth="2.6" />

        {/* ---------- cactus + pot ---------- */}
        <g>
          {/* outline pass, then sage pass on top = one clean silhouette */}
          <g strokeWidth="15">
            <path d="M147 392V364" />
          </g>
          <g strokeWidth="11">
            <path d="M147 383H134V366M147 377H160V362" />
          </g>
          <g stroke={SAGE} strokeWidth="9.5">
            <path d="M147 392V364" />
          </g>
          <g stroke={SAGE} strokeWidth="5.5">
            <path d="M147 383H134V366M147 377H160V362" />
          </g>
        </g>
        <path d="M130 401L132 427H162L164 401Z" fill={PAPER} />
        <rect x="126" y="392" width="42" height="10" rx="2.5" fill={PAPER} />

        {/* ---------- street lamp + bush ---------- */}
        <path d="M407 327V427" />
        <rect x="399" y="303" width="16" height="24" rx="8" fill="#fff" />
        <path d="M393 311H389M421 311H425M394 304L391 301M420 304L423 301" strokeWidth="2" />
        <path d="M378 427C378 417 386 413 394 414C400 410 409 413 412 427Z" fill={SAGE} strokeWidth="2.6" />

        {/* ---------- traffic cone ---------- */}
        <path d="M466 427L475 392H484L493 427Z" fill={INK} />
        <path d="M472 405H487L489 413H470Z" fill={PAPER} stroke="none" />
        <path d="M463 427H496" strokeWidth="4" />

        {/* ---------- barrier ---------- */}
        <g stroke={SOFT} strokeWidth="3.2">
          <rect x="497" y="384" width="53" height="21" rx="2" fill={PAPER} />
          <path d="M508 405L503 384M522 405L517 384M536 405L531 384M549 405L545 384" strokeWidth="2.4" />
          <path d="M506 405V427M541 405V427" />
        </g>

        {/* ---------- the picture being lifted (swings from the trolley) ---------- */}
        <g>
          {!still && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-2.4 334 167;2.4 334 167;-2.4 334 167"
              keyTimes="0;0.5;1"
              calcMode="spline"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
              dur="6s"
              repeatCount="indefinite"
            />
          )}
          <path d="M334 167V249" strokeWidth="2" />
          <circle cx="334" cy="256" r="6.5" fill={INK} />
          <path d="M334 263V268M334 268L286.5 277M334 268L377.6 290" strokeWidth="2.4" />
          <g transform="rotate(8 328 312)">
            <rect x="282" y="283" width="92" height="58" rx="8" fill={ACCENT} />
            <rect x="291" y="292" width="74" height="40" rx="3" fill={TINT} strokeWidth="2" />
            <path d="M297 331L318 305L331 321L339 312L359 331Z" fill="#fff" strokeWidth="2" />
            <circle cx="349" cy="303" r="3.4" fill="#fff" strokeWidth="2" />
          </g>
        </g>
      </g>
    </svg>
  );
}