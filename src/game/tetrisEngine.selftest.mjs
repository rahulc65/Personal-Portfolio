// Run with:  node src/game/tetrisEngine.selftest.mjs
// Plain-node checks of the Tetris rules (no test framework needed).
import assert from 'node:assert/strict';
import { TetrisEngine, SHAPES, gravityMs, COLS, ROWS, HIDDEN_ROWS, LOCK_DELAY, MAX_LOCK_RESETS, CLEAR_MS, PIECE_TYPES } from './tetrisEngine.js';

let passed = 0;
const test = (name, fn) => {
  fn();
  passed += 1;
  console.log('  ok  ' + name);
};

// small seeded RNG so runs are repeatable
const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const fresh = (seed = 1) => {
  const e = new TetrisEngine({ rng: seeded(seed) });
  e.start();
  return e;
};
const setPiece = (e, type, rot = 0, x = 3, y = 0) => {
  e.piece = { type, rot, x, y };
  e.lowestY = y;
  e.lockTimer = 0;
  e.lockResets = 0;
};
const fillRow = (e, row, gapCols = []) => {
  for (let x = 0; x < COLS; x += 1) e.board[row][x] = gapCols.includes(x) ? null : 'Z';
};

test('shapes: every piece has 4 cells in all 4 rotations; T rotates back to start', () => {
  for (const t of PIECE_TYPES) for (let r = 0; r < 4; r += 1) assert.equal(SHAPES[t][r].length, 4);
  assert.deepEqual(SHAPES.T[0], [[1, 0], [0, 1], [1, 1], [2, 1]]);
  assert.deepEqual(SHAPES.T[1], [[1, 0], [1, 1], [2, 1], [1, 2]]); // SRS "R" state
});

test('7-bag: each run of 7 pieces holds all 7 types', () => {
  const e = fresh(7);
  const seq = [e.piece.type];
  for (let i = 0; i < 20; i += 1) seq.push(e._takeNext());
  for (let b = 0; b < 2; b += 1) assert.equal(new Set(seq.slice(b * 7, b * 7 + 7)).size, 7);
});

test('spawn: pieces appear centred and one row down; board starts empty', () => {
  const e = fresh();
  assert.equal(e.status, 'playing');
  assert.equal(e.piece.y, 1);
  assert.ok(e.board.every((row) => row.every((c) => c === null)));
});

test('movement stops at the walls', () => {
  const e = fresh();
  setPiece(e, 'T');
  for (let i = 0; i < 20; i += 1) e.move(-1);
  assert.equal(Math.min(...SHAPES.T[0].map(([x]) => e.piece.x + x)), 0);
  for (let i = 0; i < 20; i += 1) e.move(1);
  assert.equal(Math.max(...SHAPES.T[0].map(([x]) => e.piece.x + x)), COLS - 1);
});

test('hard drop lands on the floor, scores 2 per row, and spawns the next piece', () => {
  const e = fresh();
  setPiece(e, 'O', 0, 3, 1);
  const startY = e.piece.y;
  e.hardDrop();
  const bottom = ROWS - 1;
  assert.equal(e.board[bottom][4], 'O');
  assert.equal(e.board[bottom][5], 'O');
  assert.equal(e.board[bottom - 1][4], 'O');
  // O covers matrix rows 0-1, so it fell from y=1 to y=ROWS-2: (ROWS-2-startY) rows
  assert.equal(e.score, 2 * (ROWS - 2 - startY));
  assert.ok(e.piece && e.status === 'playing');
});

test('line clear: single line scores 100 and the stack drops one row', () => {
  const e = fresh();
  fillRow(e, ROWS - 1, [0, 1, 2, 3]);
  e.board[ROWS - 2][9] = 'J'; // something above, to watch it fall
  setPiece(e, 'I', 0, 0, 1); // horizontal I: fills cols 0-3 of the bottom row
  e.hardDrop();
  assert.equal(e.status, 'clearing');
  e.update(CLEAR_MS + 1);
  assert.equal(e.status, 'playing');
  assert.equal(e.lines, 1);
  assert.equal(e.score, 100 + 2 * (ROWS - 2 - 1)); // line + hard-drop rows (I's cells are on matrix row 1: y goes 1 -> ROWS-2)
  assert.equal(e.board[ROWS - 1][9], 'J'); // fell down
  assert.equal(e.board[ROWS - 2][9], null);
});

test('four lines at once (a "Tetris") scores 800 x level', () => {
  const e = fresh();
  for (let r = ROWS - 4; r < ROWS; r += 1) fillRow(e, r, [9]);
  setPiece(e, 'I', 1, 7, 0); // vertical I; its column is matrix col 2 -> board col 9
  e.hardDrop();
  assert.equal(e.clearingRows.length, 4);
  const before = e.score;
  e.update(CLEAR_MS + 1);
  assert.equal(e.score - before, 800);
  assert.equal(e.lines, 4);
});

test('level goes up every 10 lines and gravity gets faster', () => {
  const e = fresh();
  e.lines = 9;
  fillRow(e, ROWS - 1, [0, 1, 2, 3]);
  setPiece(e, 'I', 0, 0, 1);
  e.hardDrop();
  e.update(CLEAR_MS + 1);
  assert.equal(e.level, 2);
  assert.ok(gravityMs(2) < gravityMs(1));
  assert.equal(Math.round(gravityMs(1)), 1000);
  assert.ok(gravityMs(15) < 20);
});

test('combo: back-to-back clears add a bonus', () => {
  const e = fresh();
  fillRow(e, ROWS - 1, [0, 1, 2, 3]);
  setPiece(e, 'I', 0, 0, 1);
  e.hardDrop();
  e.update(CLEAR_MS + 1);
  fillRow(e, ROWS - 1, [0, 1, 2, 3]);
  setPiece(e, 'I', 0, 0, 1);
  const before = e.score;
  e.hardDrop();
  e.update(CLEAR_MS + 1);
  const gained = e.score - before;
  assert.ok(gained >= 100 * e.level + 50, 'second clear should include a combo bonus, got ' + gained);
});

test('rotation: wall kick lets a vertical I rotate next to the wall', () => {
  const e = fresh();
  setPiece(e, 'I', 1, -2, 5); // vertical I hugging the left wall (its column is matrix col 2 -> x=0)
  assert.equal(e.rotate(1), true); // would be out of bounds without a kick
  assert.ok(e.piece.x + Math.min(...SHAPES.I[e.piece.rot].map(([x]) => x)) >= 0);
});

test('rotation: O never rotates; blocked rotations fail without moving the piece', () => {
  const e = fresh();
  setPiece(e, 'O');
  assert.equal(e.rotate(1), false);
  setPiece(e, 'T', 0, 3, 3);
  // wall the piece in so no kick can fit
  for (let y = 0; y < ROWS; y += 1) for (let x = 0; x < COLS; x += 1) e.board[y][x] = 'Z';
  for (const [x, y] of SHAPES.T[0]) e.board[3 + y][3 + x] = null;
  const snap = JSON.stringify(e.piece);
  assert.equal(e.rotate(1), false);
  assert.equal(JSON.stringify(e.piece), snap);
});

test('hold: swaps once per piece, then is locked until the next piece', () => {
  const e = fresh();
  const first = e.piece.type;
  assert.equal(e.hold(), true);
  assert.equal(e.held, first);
  const second = e.piece.type;
  assert.equal(e.hold(), false); // already used on this piece
  e.hardDrop(); // lock -> next piece, hold available again
  assert.equal(e.hold(), true);
  assert.equal(e.piece.type, first);
  assert.equal(e.held === second || e.held != null, true);
});

test('gravity pulls the piece down; soft drop is faster and scores', () => {
  const e = fresh();
  setPiece(e, 'T', 0, 3, 1);
  e.update(gravityMs(1) + 1);
  assert.equal(e.piece.y, 2);
  const y0 = e.piece.y;
  e.setSoftDrop(true);
  e.update(100);
  assert.ok(e.piece.y - y0 >= 2, 'soft drop should move several rows in 100ms');
  assert.ok(e.score >= 2);
});

test('lock delay: a resting piece locks after LOCK_DELAY, and moves can reset it a limited number of times', () => {
  const e = fresh();
  setPiece(e, 'O', 0, 3, ROWS - 2); // resting on the floor
  e.update(LOCK_DELAY - 50);
  assert.ok(e.piece, 'still alive just before the delay');
  e.update(100);
  assert.ok(!e.piece || e.status !== 'playing' || e.board[ROWS - 1].some(Boolean), 'locked after the delay');

  const f = fresh();
  setPiece(f, 'O', 0, 3, ROWS - 2);
  let rounds = 0;
  while (rounds < MAX_LOCK_RESETS * 3) {
    f.update(LOCK_DELAY - 20); // always just short of locking
    if (f.board[ROWS - 1].some(Boolean)) break; // it locked
    f.move(rounds % 2 ? -1 : 1); // wiggle: restarts the timer, up to the cap
    rounds += 1;
  }
  assert.ok(f.board[ROWS - 1].some(Boolean), 'infinite stalling is capped; the piece must lock eventually');
  assert.ok(rounds >= MAX_LOCK_RESETS, 'moves should reset the timer at least MAX_LOCK_RESETS times, got ' + rounds);
  assert.ok(rounds <= MAX_LOCK_RESETS + 2, 'and not much more than that, got ' + rounds);
});

test('auto-repeat: holding a direction moves once, waits (DAS), then repeats', () => {
  const e = fresh();
  setPiece(e, 'O', 0, 3, 5);
  e.setHorizontal(1);
  assert.equal(e.piece.x, 4); // immediate
  e.update(100);
  assert.equal(e.piece.x, 4); // still waiting for DAS
  e.update(200);
  assert.ok(e.piece.x >= 6, 'repeating after DAS');
  e.setHorizontal(0);
  const x = e.piece.x;
  e.update(500);
  assert.equal(e.piece.x, x);
});

test('game over: a blocked spawn ends the game; further input does nothing', () => {
  const e = fresh();
  for (let y = 0; y < 6; y += 1) fillRow(e, y, [0]);
  e.hardDrop(); // lock the current piece, next spawn is blocked
  assert.equal(e.status, 'over');
  const snap = e.score;
  e.move(1); e.rotate(1); e.hardDrop(); e.update(1000);
  assert.equal(e.score, snap);
  assert.ok(e.drainEvents().some((ev) => ev.type === 'over'));
});

test('lock out: a piece locked entirely in the hidden rows ends the game', () => {
  const e = fresh();
  for (let y = HIDDEN_ROWS; y < ROWS; y += 1) fillRow(e, y, [0]);
  setPiece(e, 'O', 0, 3, 0);
  e.hardDrop();
  assert.equal(e.status, 'over');
});

test('ghost: lands where a hard drop would', () => {
  const e = fresh();
  setPiece(e, 'T', 0, 3, 1);
  const gy = e.ghostY();
  e.hardDrop();
  assert.equal(e.board[gy + 1][4], 'T'); // T's top nub sits at matrix (1,0)... centre row at gy+1
});

console.log(`\n${passed} engine checks passed`);
