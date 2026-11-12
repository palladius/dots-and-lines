import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createGameState,
  claimSegment,
  undoMove,
  chooseBotMove,
  parseGridKey,
} from '../src/core/DotsEngine.js';
import { NeonBoardRenderer } from '../src/ui/NeonBoardRenderer.js';

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

