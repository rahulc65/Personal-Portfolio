import { useMemo } from 'react';
import { FONT_4X5, ICONS_3X5, glyphCells } from '../../../data/pixelFont';

const VB_H = 15;
const TEXT_Y = 5; // labels are 5 rows tall, centred in 15
const PAD_X = 6;
const ICON_W = 3;
const ICON_GAP = 3;
const SPACE_W = 3;

/** Lay a label (and optional icon) out as pixels; returns the cells and the SVG width. */
function layoutButton(label, icon) {
  const cells = [];
  let x = PAD_X;
  if (icon && ICONS_3X5[icon]) {
    glyphCells(ICONS_3X5[icon]).forEach((c) => cells.push({ x: x + c.x, y: TEXT_Y + c.y }));
    x += ICON_W + ICON_GAP;
  }
  for (const ch of label.toUpperCase()) {
    if (ch === ' ') {
      x += SPACE_W;
      continue;
    }
    const glyph = FONT_4X5[ch];
    if (!glyph) continue;
    glyphCells(glyph).forEach((c) => cells.push({ x: x + c.x, y: TEXT_Y + c.y }));
    x += glyph[0].length + 1;
  }
  return { cells, width: x - 1 + PAD_X };
}

/**
 * PixelButton
 * An 8-bit style button: notched corners and a bitmap label (plus optional icon),
 * drawn as one small SVG that scales to the `width` it is given (or `unit` px per SVG unit).
 *   variant "solid": orange body, white label (turns black on hover)
 *   variant "ghost": light body, orange label (fills orange on hover)
 */
export default function PixelButton({
  label,
  icon,
  width,
  unit,
  variant = 'solid',
  onClick,
  ariaLabel,
  className = '',
  style,
  innerRef,
}) {
  const { cells, width: vbW } = useMemo(() => layoutButton(label, icon), [label, icon]);
  const ghost = variant === 'ghost';
  const pxWidth = unit ? Math.round(vbW * unit) : width; // unit: px per SVG unit, keeps letters one size across buttons

  return (
    <button
      ref={innerRef}
      type="button"
      aria-label={ariaLabel || label}
      onClick={onClick}
      className={`group block cursor-pointer border-0 bg-transparent p-0 transition-transform duration-100 active:translate-y-px focus-visible:outline-[#14120f] ${className}`}
      style={{ width: pxWidth, aspectRatio: `${vbW} / ${VB_H}`, ...style }}
    >
      <svg viewBox={`0 0 ${vbW} ${VB_H}`} shapeRendering="crispEdges" aria-hidden="true" className="block h-full w-full">
        <path
          d={`M1 0H${vbW - 1}V1H${vbW}V${VB_H - 1}H${vbW - 1}V${VB_H}H1V${VB_H - 1}H0V1H1Z`}
          className={
            ghost
              ? 'fill-[#fffefb] transition-colors duration-150 group-hover:fill-[#e8460e]'
              : 'fill-[#e8460e] transition-colors duration-150 group-hover:fill-[#14120f]'
          }
        />
        <rect
          x="1.5"
          y="1.5"
          width={vbW - 3}
          height={VB_H - 3}
          fill="none"
          stroke={ghost ? '#e8460e' : 'rgba(255,255,255,0.28)'}
          strokeWidth="1"
        />
        {cells.map(({ x, y }) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="1"
            height="1"
            className={ghost ? 'fill-[#e8460e] transition-colors duration-150 group-hover:fill-white' : 'fill-white'}
          />
        ))}
      </svg>
    </button>
  );
}