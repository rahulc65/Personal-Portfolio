import { COLS, VISIBLE_ROWS } from './tetrisEngine.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * computeGameLayout
 * Works out how big the blocks are and where everything sits in the game stage.
 * Everything is laid out in whole cells (so it lines up with the graph-paper grid)
 * and returned in pixels.
 *
 *  wide stage   [ hold / stats / buttons ]  [ 10 x 20 field ]  [ next / keys or pad ]
 *  narrow stage buttons on top, hold + stats + next, the field, then the touch pad
 *
 * @param innerWidth  px available for the stage frame
 * @param viewportH   window height, so the stage never gets taller than the screen
 * @param touch       the device is touch-first: show the on-screen buttons (narrow screens always get them)
 */
export function computeGameLayout(innerWidth, viewportH, touch) {
  const narrow = innerWidth < 640;
  const showPad = touch || narrow;
  const rows = narrow ? 34 : 22;
  const byHeight = Math.floor((narrow ? viewportH - 135 : viewportH - 150) / rows); // leave room for the navbar + panel padding
  // wide: hold column (7) + field + next column (7) + a little air; narrow: field + 3 cells of margin
  const byWidth = Math.floor(innerWidth / (narrow ? COLS + 3 : COLS + 16));
  const cell = clamp(Math.min(byHeight, byWidth, narrow ? 28 : 30), narrow ? 10 : 12, narrow ? 28 : 30);
  const cols = Math.floor(innerWidth / cell);
  const c = cell;
  const fx = Math.floor((cols - COLS) / 2);

  const unit = clamp(c * 0.095, 2.2, 3.2); // px per pixel-font unit, shared by every game button
  const layout = { narrow, showPad, cell, cols, rows, unit, width: cols * c, height: rows * c };

  if (!narrow) {
    Object.assign(layout, {
      field: { x: fx * c, y: c, w: COLS * c, h: VISIBLE_ROWS * c },
      hold: { x: (fx - 7) * c, y: c, w: 5 * c, h: 5 * c },
      stats: { x: (fx - 7) * c, y: 7 * c, w: 5 * c, step: 3 * c, compact: false },
      pause: { x: (fx - 7) * c, y: 16.4 * c },
      exit: { x: (fx - 7) * c, y: 18.9 * c },
      next: { x: (fx + COLS + 2) * c, y: c, w: 5 * c, h: 13 * c },
      side: { x: (fx + COLS + 2) * c, y: 15 * c, w: 5 * c, h: 6 * c }, // keys legend, or the touch pad
      pad: { x: (fx + COLS + 2) * c, y: 15 * c, w: 5 * c, h: 6 * c, columns: 2 },
    });
  } else {
    Object.assign(layout, {
      pause: { x: c, y: c },
      exit: { x: cols * c - c, y: c, alignRight: true }, // x is the right edge
      hold: { x: c, y: 4 * c, w: 4 * c, h: 4 * c },
      next: { x: (cols - 5) * c, y: 4 * c, w: 4 * c, h: 4 * c, slots: 1 },
      stats: { x: 5.6 * c, y: 4 * c, w: (cols - 11.2) * c, step: 1.4 * c, compact: true },
      field: { x: fx * c, y: 9 * c, w: COLS * c, h: VISIBLE_ROWS * c },
      pad: { x: c, y: 30 * c, w: (cols - 2) * c, h: 4 * c, columns: 3 },
    });
  }
  return layout;
}