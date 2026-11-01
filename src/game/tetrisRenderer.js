import { COLS, HIDDEN_ROWS, VISIBLE_ROWS, SHAPES, CLEAR_MS } from './tetrisEngine.js';

/** Brand-colour block palette: dark enough to read on the light board. */
export const PIECE_COLORS = {
  I: '#e8460e',
  O: '#f2a33a',
  T: '#8f2c12',
  S: '#c1440e',
  Z: '#14120f',
  J: '#6f6a62',
  L: '#f2762f',
};

const ORANGE = '#ee5a24';
const INK = '#14120f';
const MUTED = '#7d7a74';
const PAPER = '#fffefb';
const FONT = 'Manrope, system-ui, -apple-system, "Segoe UI", sans-serif';

/** One block, drawn like the letters: a coloured card with a light outline. */
function block(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 0.5, y + 0.5, size - 1, size - 1);
  ctx.strokeStyle = 'rgba(255,255,255,0.34)';
  ctx.lineWidth = Math.max(1, size * 0.07);
  ctx.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
}

function text(ctx, str, x, y, { size, weight = 700, color = INK, align = 'left', baseline = 'top' }) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
}

function box(ctx, r, label, c) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(r.x + 0.75, r.y + 0.75, r.w - 1.5, r.h - 1.5);
  text(ctx, label, r.x + c * 0.4, r.y + c * 0.3, { size: Math.max(10, c * 0.42), color: MUTED });
}

/** Draw a piece type centred in a rectangle. */
function preview(ctx, type, rect, size) {
  const cells = SHAPES[type][0];
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const w = Math.max(...xs) - Math.min(...xs) + 1;
  const h = Math.max(...ys) - Math.min(...ys) + 1;
  const ox = rect.x + (rect.w - w * size) / 2 - Math.min(...xs) * size;
  const oy = rect.y + (rect.h - h * size) / 2 - Math.min(...ys) * size;
  cells.forEach(([x, y]) => block(ctx, Math.round(ox + x * size), Math.round(oy + y * size), size, PIECE_COLORS[type]));
}

const KEYS = [
  ['← →', 'move'],
  ['↑', 'rotate'],
  ['↓', 'soft drop'],
  ['space', 'drop'],
  ['C', 'hold'],
  ['P', 'pause'],
  ['Esc', 'exit'],
];

/**
 * renderGame
 * Draws the whole stage for one frame. Pure drawing: reads the engine, changes nothing.
 * `ui` = { countdown: 0-3, best: number }
 */
export function renderGame(ctx, engine, L, ui) {
  const c = L.cell;
  ctx.clearRect(0, 0, L.width, L.height);

  /* ---- field ---- */
  const f = L.field;
  ctx.fillStyle = PAPER;
  ctx.fillRect(f.x, f.y, f.w, f.h);
  ctx.strokeStyle = 'rgba(20,18,15,0.075)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < COLS; i += 1) {
    ctx.moveTo(f.x + i * c + 0.5, f.y);
    ctx.lineTo(f.x + i * c + 0.5, f.y + f.h);
  }
  for (let j = 1; j < VISIBLE_ROWS; j += 1) {
    ctx.moveTo(f.x, f.y + j * c + 0.5);
    ctx.lineTo(f.x + f.w, f.y + j * c + 0.5);
  }
  ctx.stroke();

  // locked blocks
  for (let ry = HIDDEN_ROWS; ry < engine.board.length; ry += 1) {
    for (let rx = 0; rx < COLS; rx += 1) {
      const type = engine.board[ry][rx];
      if (type) block(ctx, f.x + rx * c, f.y + (ry - HIDDEN_ROWS) * c, c, PIECE_COLORS[type]);
    }
  }

  // line-clear flash
  if (engine.status === 'clearing') {
    const phase = Math.floor((1 - engine.clearTimer / CLEAR_MS) * 5);
    ctx.fillStyle = phase % 2 === 0 ? '#ffffff' : '#ffb089';
    engine.clearingRows.forEach((ry) => {
      if (ry >= HIDDEN_ROWS) ctx.fillRect(f.x, f.y + (ry - HIDDEN_ROWS) * c, f.w, c);
    });
  }

  // ghost + active piece
  if (engine.piece) {
    const { type, rot, x } = engine.piece;
    const gy = engine.ghostY();
    ctx.strokeStyle = PIECE_COLORS[type];
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    SHAPES[type][rot].forEach(([cx, cy]) => {
      const row = gy + cy - HIDDEN_ROWS;
      if (row >= 0) ctx.strokeRect(f.x + (x + cx) * c + 2, f.y + row * c + 2, c - 4, c - 4);
    });
    ctx.globalAlpha = 1;
    SHAPES[type][rot].forEach(([cx, cy]) => {
      const row = engine.piece.y + cy - HIDDEN_ROWS;
      if (row >= 0) block(ctx, f.x + (x + cx) * c, f.y + row * c, c, PIECE_COLORS[type]);
    });
  }

  // frame
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 2;
  ctx.strokeRect(f.x - 1, f.y - 1, f.w + 2, f.h + 2);

  /* ---- countdown ---- */
  if (ui.countdown > 0) {
    text(ctx, String(ui.countdown), f.x + f.w / 2, f.y + f.h / 2, {
      size: c * 4.5,
      color: ORANGE,
      align: 'center',
      baseline: 'middle',
    });
  }

  /* ---- hold ---- */
  box(ctx, L.hold, 'HOLD', c);
  if (engine.held) {
    ctx.globalAlpha = engine.canHold ? 1 : 0.35;
    const area = { x: L.hold.x, y: L.hold.y + c * 0.9, w: L.hold.w, h: L.hold.h - c * 0.9 };
    preview(ctx, engine.held, area, Math.round(c * (L.narrow ? 0.7 : 0.78)));
    ctx.globalAlpha = 1;
  }

  /* ---- next ---- */
  box(ctx, L.next, 'NEXT', c);
  const slots = L.next.slots || 3;
  const slotH = (L.next.h - c * 0.9) / slots;
  engine.peek(slots).forEach((type, i) => {
    const area = { x: L.next.x, y: L.next.y + c * 0.9 + i * slotH, w: L.next.w, h: slotH };
    preview(ctx, type, area, Math.round(c * (L.narrow ? 0.7 : 0.78)));
  });

  /* ---- stats ---- */
  const s = L.stats;
  const items = [
    ['SCORE', engine.score.toLocaleString('en-US')],
    ['LEVEL', String(engine.level)],
    ['LINES', String(engine.lines)],
  ];
  items.forEach(([label, value], i) => {
    const y = s.y + i * s.step;
    if (s.compact) {
      text(ctx, label, s.x, y, { size: Math.max(9, c * 0.4), color: MUTED });
      text(ctx, value, s.x + s.w, y - 1, { size: Math.max(11, c * 0.55), align: 'right' });
    } else {
      text(ctx, label, s.x, y, { size: Math.max(10, c * 0.42), color: MUTED });
      text(ctx, value, s.x, y + c * 0.7, { size: Math.max(16, c * 0.95) });
    }
  });
  if (!L.narrow && ui.best > 0) {
    text(ctx, `BEST ${ui.best.toLocaleString('en-US')}`, s.x, s.y + 3 * s.step - c * 0.2, { size: Math.max(10, c * 0.42), color: MUTED });
  }

  /* ---- keys legend (wide, no touch pad) ---- */
  if (!L.narrow && !L.showPad) {
    const side = L.side;
    KEYS.forEach(([key, what], i) => {
      const y = side.y + i * c * 0.95;
      text(ctx, key, side.x, y, { size: Math.max(10, c * 0.44), color: INK });
      text(ctx, what, side.x + side.w, y, { size: Math.max(10, c * 0.44), color: MUTED, align: 'right', weight: 600 });
    });
  }
}