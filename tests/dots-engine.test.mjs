import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createGameState,
  claimSegment,
  undoMove,
  chooseBotMove,
  parseGridKey,
  getMoveTimeStats,
  stepSegmentCursor,
} from '../src/core/DotsEngine.js';
import { NeonBoardRenderer } from '../src/ui/NeonBoardRenderer.js';
import { PuffinLogin, validateAndNormalizeScorePayload } from '../src/puffin-login.js';

test('createGameState initializes 4x5 Paolo Classic grid (20 boxes, 49 segments) and 3x3 grid', () => {
  const s45 = createGameState('4x5');
  assert.equal(s45.boxCols, 4);
  assert.equal(s45.boxRows, 5);
  assert.equal(s45.dotCols, 5);
  assert.equal(s45.dotRows, 6);
  assert.equal(s45.totalBoxes, 20);
  assert.equal(s45.totalSegments, 6 * 4 + 5 * 5); // 24 + 25 = 49
  assert.equal(s45.currentTurn, 'p1');

  const s33 = parseGridKey('3x3');
  assert.equal(s33.boxCols, 3);
  assert.equal(s33.boxRows, 3);
});

test('claimSegment switches turns on normal moves and awards extra turn + combo when closing a box', () => {
  const state = createGameState('3x3');

  // P1 draws top of box (0,0)
  const r1 = claimSegment(state, 'h', 0, 0);
  assert.equal(r1.ok, true);
  assert.equal(r1.player, 'p1');
  assert.equal(r1.extraTurn, false);
  assert.equal(state.currentTurn, 'p2');

  // P2 draws bottom of box (0,0)
  const r2 = claimSegment(state, 'h', 1, 0);
  assert.equal(r2.ok, true);
  assert.equal(r2.player, 'p2');
  assert.equal(state.currentTurn, 'p1');

  // P1 draws left of box (0,0)
  const r3 = claimSegment(state, 'v', 0, 0);
  assert.equal(r3.ok, true);
  assert.equal(state.currentTurn, 'p2');

  // P2 closes box (0,0) by drawing right side V[0][1]!
  const r4 = claimSegment(state, 'v', 0, 1);
  assert.equal(r4.ok, true);
  assert.equal(r4.player, 'p2');
  assert.equal(r4.capturedBoxes.length, 1);
  assert.equal(r4.extraTurn, true);
  assert.equal(state.currentTurn, 'p2'); // Extra turn!
  assert.equal(state.scores.p2, 1);
  assert.equal(state.currentCombo, 1);
  assert.equal(state.maxCombo.p2, 1);
});

test('double box closure awards +2 points in a single move and increments combo by 2', () => {
  const state = createGameState('3x3');

  // Prepare box (0,0) and box (0,1) sharing V[0][1]
  claimSegment(state, 'h', 0, 0);
  claimSegment(state, 'h', 1, 0);
  claimSegment(state, 'v', 0, 0);
  claimSegment(state, 'h', 0, 1);
  claimSegment(state, 'h', 1, 1);
  claimSegment(state, 'v', 0, 2);

  const activePlayer = state.currentTurn;
  const res = claimSegment(state, 'v', 0, 1);
  assert.equal(res.ok, true);
  assert.equal(res.capturedBoxes.length, 2);
  assert.equal(res.extraTurn, true);
  assert.equal(state.scores[activePlayer], 2);
  assert.equal(state.currentCombo, 2);
  assert.equal(state.maxCombo[activePlayer], 2);
});

test('undoMove restores previous board, scores, combo, and turn accurately', () => {
  const state = createGameState('3x3');
  claimSegment(state, 'h', 0, 0);
  claimSegment(state, 'h', 1, 0);
  claimSegment(state, 'v', 0, 0);
  claimSegment(state, 'v', 0, 1); // P2 closes box (0,0)
  assert.equal(state.scores.p2, 1);
  assert.equal(state.currentTurn, 'p2');

  const u = undoMove(state);
  assert.equal(u.ok, true);
  assert.equal(state.scores.p2, 0);
  assert.equal(state.boxes[0][0], null);
  assert.equal(state.V[0][1], null);
  assert.equal(state.currentTurn, 'p2');
});

test('chooseBotMove immediately takes a 4th side when a box has 3 sides drawn', () => {
  const state = createGameState('3x3');
  claimSegment(state, 'h', 0, 0);
  claimSegment(state, 'h', 1, 0);
  claimSegment(state, 'v', 0, 0);
  // Now box (0,0) is missing only V[0][1]
  const botMove = chooseBotMove(state);
  assert.deepEqual(botMove, { type: 'v', r: 0, c: 1 });
});

test('GHI #1: NeonBoardRenderer fits all dots inside mobile board-stage viewports without clipping', () => {
  const viewports = [
    { width: 336, height: 390 }, // Compact Android mobile remaining board height
    { width: 360, height: 480 }, // Pixel 360x780 remaining board height
    { width: 388, height: 610 }, // Pixel 412x915 remaining board height
  ];
  const grids = ['3x3', '4x4', '4x5', '5x5', '6x6'];

  for (const vp of viewports) {
    for (const gridKey of grids) {
      const mockCanvas = {
        width: 0,
        height: 0,
        style: {},
        parentElement: {
          clientWidth: vp.width,
          clientHeight: vp.height,
          getBoundingClientRect: () => vp,
        },
        getContext: () => ({
          setTransform: () => {},
          clearRect: () => {},
        }),
      };

      const renderer = new NeonBoardRenderer(mockCanvas);
      const state = createGameState(gridKey);
      renderer.setState(state);

      const topLeft = renderer.getDotCoords(0, 0);
      const bottomRight = renderer.getDotCoords(state.dotRows - 1, state.dotCols - 1);

      assert.ok(topLeft.x >= renderer.layout.padX, `Left dots inside padX on ${gridKey}`);
      assert.ok(topLeft.y >= renderer.layout.padY, `Top dots inside padY on ${gridKey}`);
      assert.ok(
        bottomRight.x <= vp.width - renderer.layout.padX,
        `Right dots inside width on ${gridKey} (${bottomRight.x} <= ${vp.width - renderer.layout.padX})`
      );
      assert.ok(
        bottomRight.y <= vp.height - renderer.layout.padY,
        `Bottom dots inside height on ${gridKey} (${bottomRight.y} <= ${vp.height - renderer.layout.padY})`
      );
    }
  }
});

test('GHI #1: #game-shell removes intermediate rivalry-strip and status-line clutter', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const gameShellPart = html.split('<main class="app-shell" id="game-shell">')[1]?.split('</main>')[0] || '';
  assert.ok(gameShellPart.length > 0, '#game-shell exists');
  assert.ok(!gameShellPart.includes('class="rivalry-strip"'), 'No rivalry-strip inside #game-shell');
  assert.ok(!gameShellPart.includes('id="status-line"'), 'No status-line inside #game-shell');
  assert.ok(html.includes('height: 100dvh;'), '100dvh lock present');
});

test('getMoveTimeStats computes accurate average and max move times for P1 and P2 and respects undoMove', async () => {
  const t0 = 1_700_000_000_000;
  const state = createGameState('3x3', t0);

  // Move 1 by P1: takes 1500ms
  claimSegment(state, 'h', 0, 0, t0 + 1500);
  // Move 2 by P2: takes 3200ms
  claimSegment(state, 'h', 1, 0, t0 + 1500 + 3200);
  // Move 3 by P1: takes 2500ms
  claimSegment(state, 'v', 0, 0, t0 + 1500 + 3200 + 2500);
  // Move 4 by P2: takes 800ms
  claimSegment(state, 'v', 0, 1, t0 + 1500 + 3200 + 2500 + 800);

  const stats = getMoveTimeStats(state);
  assert.equal(stats.p1.moves, 2);
  assert.equal(stats.p1.avgMs, 2000); // (1500 + 2500) / 2
  assert.equal(stats.p1.maxMs, 2500);
  assert.equal(stats.p1.avgSec, 2);
  assert.equal(stats.p1.maxSec, 2.5);

  assert.equal(stats.p2.moves, 2);
  assert.equal(stats.p2.avgMs, 2000); // (3200 + 800) / 2
  assert.equal(stats.p2.maxMs, 3200);
  assert.equal(stats.p2.avgSec, 2);
  assert.equal(stats.p2.maxSec, 3.2);

  // Undo P2's 4th move -> P2 goes back to 1 move (3200ms)
  undoMove(state, t0 + 9000);
  const afterUndo = getMoveTimeStats(state);
  assert.equal(afterUndo.p2.moves, 1);
  assert.equal(afterUndo.p2.avgMs, 3200);
  assert.equal(afterUndo.p2.maxMs, 3200);

  // Verify PuffinLogin telemetry JSON includes avg_move_ms, max_move_ms, avg_move_sec, max_move_sec, and move_timing
  const dualRes = await PuffinLogin.submitDualMatchScore({
    appId: 'dots-and-lines',
    p1User: { id: 'ale', shortName: 'Ale' },
    p2User: { id: 'seby', shortName: 'Seby' },
    p1Boxes: 5,
    p2Boxes: 4,
    totalBoxes: 9,
    grid: '3x3',
    moves: 24,
    maxComboP1: 3,
    maxComboP2: 2,
    p1MoveStats: stats.p1,
    p2MoveStats: stats.p2,
    durationSec: 45,
    mode: '2p-local',
    skipCardDrop: true,
  });

  assert.equal(dualRes.p1Record.avg_move_ms, 2000);
  assert.equal(dualRes.p1Record.max_move_ms, 2500);
  assert.equal(dualRes.p1Record.avg_move_sec, 2);
  assert.equal(dualRes.p1Record.max_move_sec, 2.5);
  assert.equal(dualRes.p1Record.extra.opponent_avg_move_ms, 2000);
  assert.equal(dualRes.p1Record.extra.opponent_max_move_ms, 3200);
  assert.deepEqual(dualRes.p1Record.extra.move_timing.p1, {
    player_id: 'ale',
    moves: 2,
    avg_move_ms: 2000,
    max_move_ms: 2500,
    avg_move_sec: 2,
    max_move_sec: 2.5,
  });
  assert.deepEqual(dualRes.p2Record.extra.move_timing.p2, {
    player_id: 'seby',
    moves: 2,
    avg_move_ms: 2000,
    max_move_ms: 3200,
    avg_move_sec: 2,
    max_move_sec: 3.2,
  });

  const normalized = validateAndNormalizeScorePayload({
    game_id: 'dots-and-lines',
    player_id: 'ale',
    score: 850,
    avg_move_ms: 1850,
    max_move_ms: 4100,
  });
  assert.equal(normalized.avg_move_ms, 1850);
  assert.equal(normalized.max_move_ms, 4100);
  assert.equal(normalized.avg_move_sec, 1.85);
  assert.equal(normalized.max_move_sec, 4.1);
});

test('GHI #3: stepSegmentCursor navigates deterministically between segments without auto-advance magic', () => {
  for (const gridKey of ['3x3', '4x5', '5x5']) {
    const state = createGameState(gridKey);
    // Initial fallback cursor
    let cur = stepSegmentCursor(state, null, 'right');
    assert.deepEqual(cur, { type: 'h', r: 0, c: 0 });

    // Step right and left along top horizontal row
    cur = stepSegmentCursor(state, cur, 'right');
    assert.deepEqual(cur, { type: 'h', r: 0, c: 1 });
    cur = stepSegmentCursor(state, cur, 'left');
    assert.deepEqual(cur, { type: 'h', r: 0, c: 0 });

    // Wrap-around left from c=0 goes to c = boxCols - 1
    const wrappedLeft = stepSegmentCursor(state, cur, 'left');
    assert.deepEqual(wrappedLeft, { type: 'h', r: 0, c: state.boxCols - 1 });

    // Step down from h:0:0 goes to v:0:0 (left vertical edge of box (0,0))
    cur = stepSegmentCursor(state, { type: 'h', r: 0, c: 0 }, 'down');
    assert.deepEqual(cur, { type: 'v', r: 0, c: 0 });

    // Step right on vertical row goes to v:0:1 (right vertical edge of box (0,0))
    cur = stepSegmentCursor(state, cur, 'right');
    assert.deepEqual(cur, { type: 'v', r: 0, c: 1 });

    // Step down from v:0:1 goes to h:1:1, then left goes to h:1:0 (bottom horizontal edge of box (0,0))
    cur = stepSegmentCursor(state, cur, 'down');
    assert.deepEqual(cur, { type: 'h', r: 1, c: 1 });
    cur = stepSegmentCursor(state, cur, 'left');
    assert.deepEqual(cur, { type: 'h', r: 1, c: 0 });

    // Rotate toggles between h and v in place
    const rotated = stepSegmentCursor(state, { type: 'h', r: 0, c: 0 }, 'rotate');
    assert.deepEqual(rotated, { type: 'v', r: 0, c: 0 });
    assert.deepEqual(stepSegmentCursor(state, rotated, 'rotate'), { type: 'h', r: 0, c: 0 });

    // Claiming a segment does NOT move the cursor and stepping across claimed segments remains deterministic
    claimSegment(state, 'h', 0, 1);
    assert.deepEqual(stepSegmentCursor(state, { type: 'h', r: 0, c: 0 }, 'right'), {
      type: 'h',
      r: 0,
      c: 1,
    });
  }
});



