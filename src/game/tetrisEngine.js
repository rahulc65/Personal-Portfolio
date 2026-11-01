/**
 * tetrisEngine
 * The rules of Tetris, with no DOM and no React, so it can be tested on its own.
 *
 * Follows the modern "guideline" game:
 *  - 10 x 20 visible board (+2 hidden rows above it)
 *  - 7 pieces dealt from a shuffled "bag" (every piece appears once per 7)
 *  - SRS rotation with wall kicks
 *  - hold (once per piece), next queue, ghost piece
 *  - gravity speeds up every 10 lines
 *  - lock delay with a limited number of resets
 *  - soft drop (+1 per row), hard drop (+2 per row)
 *  - line clears 100 / 300 / 500 / 800 x level, plus a small combo bonus
 *  - sideways auto-repeat (DAS / ARR) for held left/right
 *
 * Drive it by calling update(dtMs) every frame and the action methods on input.
 */

export const COLS = 20; // board width in cells (was 10). Change this one number to resize the field.
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;
export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const LOCK_DELAY = 500; // ms a grounded piece may sit before locking
export const MAX_LOCK_RESETS = 15; // moves/rotations that can restart the lock timer
export const DAS = 150; // ms before a held direction starts repeating
export const ARR = 35; // ms between repeats
export const CLEAR_MS = 260; // line-clear flash
const LINE_POINTS = [0, 100, 300, 500, 800];
const MAX_LEVEL = 20;

/* ---------- piece shapes (SRS) ---------- */

const BASE = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
};

const rotateCW = (m) => {
  const n = m.length;
  return m.map((_, y) => m.map((__, x) => m[n - 1 - x][y]));
};

const toCells = (m) => {
  const cells = [];
  m.forEach((row, y) => row.forEach((v, x) => v && cells.push([x, y])));
  return cells;
};

/** SHAPES[type][rotation] = [[x, y], ...] relative to the piece's top-left. */
export const SHAPES = Object.fromEntries(
  Object.entries(BASE).map(([type, m0]) => {
    const states = [m0];
    for (let i = 0; i < 3; i += 1) states.push(rotateCW(states[i]));
    return [type, states.map(toCells)];
  })
);

/* Wall kick tests, from the SRS guideline. Written with y pointing UP; the engine
   flips y when applying them. Key is "fromRotation toRotation". */
const KICKS_JLSTZ = {
  '01': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '10': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '12': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '21': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '23': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '32': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '30': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '03': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const KICKS_I = {
  '01': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '10': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '12': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '21': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '23': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '32': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '30': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '03': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

/** Milliseconds per row of gravity at a level (guideline curve). */
export const gravityMs = (level) => Math.max(1000 * Math.pow(0.8 - (level - 1) * 0.007, level - 1), 1);

/** Board cells [{x, y}] covered by a piece at a position. */
export const pieceCells = (type, rot, x, y) => SHAPES[type][rot].map(([cx, cy]) => ({ x: x + cx, y: y + cy }));

/* ---------- the engine ---------- */

export class TetrisEngine {
  /** @param {{ rng?: () => number }} [options] rng returns [0,1); inject a seeded one for tests. */
  constructor({ rng = Math.random } = {}) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.bag = [];
    this.queue = [];
    this.piece = null; // { type, rot, x, y }
    this.held = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.status = 'idle'; // idle | playing | clearing | over
    this.clearingRows = [];
    this.clearTimer = 0;
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = 0;
    this.hDir = 0;
    this.dasTimer = 0;
    this.dasCharged = false;
    this.arrTimer = 0;
    this.soft = false;
    this.events = [];
    this._fillQueue();
  }

  start() {
    this.reset();
    this.status = 'playing';
    this._spawn(this._takeNext());
  }

  /* ----- queries ----- */

  /** The next `n` piece types. */
  peek(n = 3) {
    return this.queue.slice(0, n);
  }

  /** Row where the current piece would land if dropped. */
  ghostY() {
    if (!this.piece) return 0;
    const { type, rot, x } = this.piece;
    let y = this.piece.y;
    while (this._fits(type, rot, x, y + 1)) y += 1;
    return y;
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }

  /* ----- input ----- */

  /** -1 left, 1 right, 0 released. Moves once immediately, then auto-repeats. */
  setHorizontal(dir) {
    if (dir === this.hDir) return;
    this.hDir = dir;
    this.dasTimer = 0;
    this.dasCharged = false;
    this.arrTimer = 0;
    if (dir !== 0) this.move(dir);
  }

  setSoftDrop(on) {
    this.soft = Boolean(on);
  }

  move(dx) {
    if (this.status !== 'playing' || !this.piece) return false;
    const moved = this._tryMove(dx, 0);
    if (moved) this._manipulated();
    return moved;
  }

  /** dir: 1 clockwise, -1 counter-clockwise. */
  rotate(dir) {
    if (this.status !== 'playing' || !this.piece) return false;
    const { type, rot, x, y } = this.piece;
    if (type === 'O') return false;
    const next = (rot + dir + 4) % 4;
    const tests = (type === 'I' ? KICKS_I : KICKS_JLSTZ)[`${rot}${next}`];
    for (const [dx, dy] of tests) {
      if (this._fits(type, next, x + dx, y - dy)) {
        this.piece.rot = next;
        this.piece.x = x + dx;
        this.piece.y = y - dy;
        if (this.piece.y > this.lowestY) {
          this.lowestY = this.piece.y;
          this.lockResets = 0;
        }
        this._manipulated();
        this.events.push({ type: 'rotate' });
        return true;
      }
    }
    return false;
  }

  hardDrop() {
    if (this.status !== 'playing' || !this.piece) return;
    let rows = 0;
    while (this._tryMove(0, 1)) rows += 1;
    this.score += rows * 2;
    this.events.push({ type: 'drop', rows });
    this._lock();
  }

  hold() {
    if (this.status !== 'playing' || !this.piece || !this.canHold) return false;
    const current = this.piece.type;
    const next = this.held ?? this._takeNext();
    this.held = current;
    this._spawn(next);
    this.canHold = false; // after spawn, which does not touch it
    this.events.push({ type: 'hold' });
    return true;
  }

  /* ----- time ----- */

  update(dt) {
    if (this.status === 'idle' || this.status === 'over') return;

    if (this.status === 'clearing') {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) this._finishClear();
      return;
    }
    if (!this.piece) return;

    // sideways auto-repeat
    if (this.hDir !== 0) {
      this.dasTimer += dt;
      if (!this.dasCharged && this.dasTimer >= DAS) {
        this.dasCharged = true;
        this.arrTimer = ARR; // first repeat happens straight away
      }
      if (this.dasCharged) {
        this.arrTimer += dt;
        while (this.arrTimer >= ARR) {
          this.arrTimer -= ARR;
          this.move(this.hDir);
        }
      }
    }

    // gravity
    const g = gravityMs(this.level);
    const interval = this.soft ? Math.min(g, Math.max(g / 20, 15)) : g;
    this.dropTimer += dt;
    while (this.dropTimer >= interval) {
      this.dropTimer -= interval;
      if (this._tryMove(0, 1)) {
        if (this.soft) this.score += 1;
      } else {
        this.dropTimer = 0;
        break;
      }
    }

    // lock delay
    const { type, rot, x, y } = this.piece;
    if (!this._fits(type, rot, x, y + 1)) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) this._lock();
    } else {
      this.lockTimer = 0;
    }
  }

  /* ----- internals ----- */

  _fits(type, rot, x, y) {
    for (const [cx, cy] of SHAPES[type][rot]) {
      const bx = x + cx;
      const by = y + cy;
      if (bx < 0 || bx >= COLS || by < 0 || by >= ROWS) return false;
      if (this.board[by][bx]) return false;
    }
    return true;
  }

  _tryMove(dx, dy) {
    const { type, rot, x, y } = this.piece;
    if (!this._fits(type, rot, x + dx, y + dy)) return false;
    this.piece.x = x + dx;
    this.piece.y = y + dy;
    if (this.piece.y > this.lowestY) {
      this.lowestY = this.piece.y; // reached a new lowest row: lock resets refill
      this.lockResets = 0;
    }
    return true;
  }

  /** A successful move/rotation: if the piece is resting, restart its lock timer (limited). */
  _manipulated() {
    const { type, rot, x, y } = this.piece;
    if (!this._fits(type, rot, x, y + 1) && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets += 1;
    }
  }

  _fillQueue() {
    while (this.queue.length < 7) {
      const bag = [...PIECE_TYPES];
      for (let i = bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(this.rng() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.queue.push(...bag);
    }
  }

  _takeNext() {
    const type = this.queue.shift();
    this._fillQueue();
    return type;
  }

  _spawn(type) {
    this.piece = { type, rot: 0, x: Math.floor((COLS - 4) / 2), y: 0 };
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = 0;
    if (!this._fits(type, 0, 3, 0)) {
      this._gameOver();
      return;
    }
    if (this._fits(type, 0, 3, 1)) this.piece.y = 1; // appears one row down, like the guideline
    this.lowestY = this.piece.y;
  }

  _lock() {
    const { type, rot, x, y } = this.piece;
    const cells = pieceCells(type, rot, x, y);
    cells.forEach((c) => {
      this.board[c.y][c.x] = type;
    });
    this.events.push({ type: 'lock' });
    this.piece = null;
    this.canHold = true;

    if (cells.every((c) => c.y < HIDDEN_ROWS)) {
      this._gameOver(); // locked completely above the visible board
      return;
    }

    const full = [];
    this.board.forEach((row, ry) => {
      if (row.every(Boolean)) full.push(ry);
    });
    if (full.length) {
      this.status = 'clearing';
      this.clearingRows = full;
      this.clearTimer = CLEAR_MS;
      this.combo += 1;
      this.events.push({ type: 'clear', lines: full.length });
      return;
    }
    this.combo = -1;
    this._spawn(this._takeNext());
  }

  _finishClear() {
    const n = this.clearingRows.length;
    const kept = this.board.filter((_, ry) => !this.clearingRows.includes(ry));
    const fresh = Array.from({ length: n }, () => Array(COLS).fill(null));
    this.board = [...fresh, ...kept];
    this.clearingRows = [];

    this.score += LINE_POINTS[Math.min(n, 4)] * this.level + (this.combo > 0 ? 50 * this.combo * this.level : 0);
    this.lines += n;
    const nextLevel = Math.min(MAX_LEVEL, Math.floor(this.lines / 10) + 1);
    if (nextLevel > this.level) this.events.push({ type: 'levelup', level: nextLevel });
    this.level = nextLevel;

    this.status = 'playing';
    this._spawn(this._takeNext());
  }

  _gameOver() {
    this.status = 'over';
    this.piece = null;
    this.hDir = 0;
    this.soft = false;
    this.events.push({ type: 'over' });
  }
}