import { glyphCells } from '../../../data/pixelFont';

/**
 * PixelLetter
 * One big letter drawn as grid cells (one SVG unit = one board cell), so it
 * lines up exactly with the grid lines. Every cell is a little "card" with a
 * lighter outline, like a Tetris block.
 */
export default function PixelLetter({ glyph, cell, className = '', style, innerRef }) {
  const cols = glyph[0].length;
  const rows = glyph.length;
  return (
    <svg
      ref={innerRef}
      aria-hidden="true"
      viewBox={`0 0 ${cols} ${rows}`}
      width={cols * cell}
      height={rows * cell}
      shapeRendering="crispEdges"
      className={`absolute will-change-transform ${className}`}
      style={style}
    >
      {glyphCells(glyph).map(({ x, y }) => (
        <rect
          key={`${x}-${y}`}
          x={x + 0.06}
          y={y + 0.06}
          width="0.88"
          height="0.88"
          fill="var(--tetris-orange)"
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="0.1"
        />
      ))}
    </svg>
  );
}