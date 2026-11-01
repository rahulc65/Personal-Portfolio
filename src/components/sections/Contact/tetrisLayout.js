import { FONT_BLOCK } from '../../../data/pixelFont';

/**
 * Board geometry for the Tetris panel, in cells.
 * The board is exactly as wide as the word needs, so any word fits.
 */
export const PANEL_PAD = 13; // px between the panel edge and the orange frame
export const FRAME_BORDER = 3; // px, both sides of the frame border together
export const GLYPH_H = 5; // rows
export const LETTER_GAP = 1; // empty columns between letters
export const SPACE_W = 2; // extra empty columns for a space
export const MARGIN_COLS = 1; // empty columns left and right of the word
export const BOTTOM_ROWS = 2; // empty rows under the word
const ASPECT = 1.74; // board width / height, like the original design

/**
 * layoutWord("CONTACT ME") ->
 *   letters:   [{ char, col }]  where each letter starts
 *   cols/rows: board size in cells
 *   letterRow: the row the letters lock into
 */
export function layoutWord(word) {
  const letters = [];
  let col = MARGIN_COLS;
  for (const char of word.toUpperCase()) {
    if (char === ' ') {
      col += SPACE_W;
      continue;
    }
    const glyph = FONT_BLOCK[char];
    if (!glyph) continue;
    letters.push({ char, col });
    col += glyph[0].length + LETTER_GAP;
  }
  const cols = col - LETTER_GAP + MARGIN_COLS;
  const rows = Math.round(cols / ASPECT);
  return { letters, cols, rows, letterRow: rows - GLYPH_H - BOTTOM_ROWS };
}