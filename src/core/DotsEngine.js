/**
 * DotsEngine.js — Pure Combinatorial Engine for Dots & Lines Deluxe (Pipopipette Neon)
 *
 * Supports rectangular & square box grids:
 * - '3x3': 3 cols × 3 rows = 9 boxes (4×4 dots)
 * - '4x4': 4 cols × 4 rows = 16 boxes (5×5 dots)
 * - '4x5': 4 cols × 5 rows = 20 boxes (5×6 dots — Paolo's Classic Mobile Layout!)
 * - '5x5': 5 cols × 5 rows = 25 boxes (6×6 dots)
 * - '6x6': 6 cols × 6 rows = 36 boxes (7×7 dots)
 */

export const GRID_PRESETS = Object.freeze({
  '3x3': { key: '3x3', boxCols: 3, boxRows: 3, labelIt: 'Piccola (3×3)', labelEn: 'Small (3×3)' },
  '4x4': { key: '4x4', boxCols: 4, boxRows: 4, labelIt: 'Quadrata (4×4)', labelEn: 'Square (4×4)' },
  '4x5': { key: '4x5', boxCols: 4, boxRows: 5, labelIt: 'Classica Paolo (4×5)', labelEn: 'Paolo Classic (4×5)' },
  '5x5': { key: '5x5', boxCols: 5, boxRows: 5, labelIt: 'Grande (5×5)', labelEn: 'Large (5×5)' },
  '6x6': { key: '6x6', boxCols: 6, boxRows: 6, labelIt: 'Epica (6×6)', labelEn: 'Epic (6×6)' },
});

export function parseGridKey(gridKey = '4x5') {
  const clean = String(gridKey || '4x5').trim().toLowerCase();
  if (GRID_PRESETS[clean]) return GRID_PRESETS[clean];
  const m = clean.match(/^(\d+)x(\d+)$/);
  if (m) {
    const boxCols = Math.max(2, Math.min(8, Number(m[1])));
    const boxRows = Math.max(2, Math.min(8, Number(m[2])));
    return {
      key: `${boxCols}x${boxRows}`,
      boxCols,
      boxRows,
      labelIt: `${boxCols}×${boxRows}`,
      labelEn: `${boxCols}×${boxRows}`,
    };
  }
  return GRID_PRESETS['4x5'];
}

export function createGameState(gridKey = '4x5') {
  const preset = parseGridKey(gridKey);
  const { boxCols, boxRows } = preset;
  const dotCols = boxCols + 1;
  const dotRows = boxRows + 1;

  // H[r][c]: horizontal segment at row r (0..boxRows), col c (0..boxCols-1)
  const H = Array.from({ length: dotRows }, () =>
    Array.from({ length: boxCols }, () => null)
  );
  // V[r][c]: vertical segment at row r (0..boxRows-1), col c (0..boxCols)
  const V = Array.from({ length: boxRows }, () =>
    Array.from({ length: dotCols }, () => null)
  );
  // boxes[r][c]: box at row r (0..boxRows-1), col c (0..boxCols-1)
  const boxes = Array.from({ length: boxRows }, () =>
    Array.from({ length: boxCols }, () => null)
  );

  const totalSegments = dotRows * boxCols + boxRows * dotCols;
  const totalBoxes = boxCols * boxRows;

  return {
    gridKey: preset.key,
    boxCols,
    boxRows,
    dotCols,
    dotRows,
    totalSegments,
    totalBoxes,
    H,
    V,
    boxes,
    currentTurn: 'p1',
    scores: { p1: 0, p2: 0 },
    currentCombo: 0,
    maxCombo: { p1: 0, p2: 0 },
    moveCount: 0,
    lastMove: null,
    isGameOver: false,
    winner: null, // 'p1' | 'p2' | 'tie' | null
    startedAt: new Date().toISOString(),
    endedAt: null,
    history: [],
  };
}

function cloneBoardSnapshot(state) {
  return {
    H: state.H.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
    V: state.V.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
    boxes: state.boxes.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
    currentTurn: state.currentTurn,
    scores: { ...state.scores },
    currentCombo: state.currentCombo,
    maxCombo: { ...state.maxCombo },
    moveCount: state.moveCount,
    lastMove: state.lastMove ? { ...state.lastMove } : null,
    isGameOver: state.isGameOver,
    winner: state.winner,
    endedAt: state.endedAt,
  };
}

export function countBoxSides(state, r, c) {
  if (r < 0 || r >= state.boxRows || c < 0 || c >= state.boxCols) return 0;
  let sides = 0;
  if (state.H[r][c]) sides += 1;
  if (state.H[r + 1][c]) sides += 1;
  if (state.V[r][c]) sides += 1;
  if (state.V[r][c + 1]) sides += 1;
  return sides;
}

export function isBoxComplete(state, r, c) {
  return countBoxSides(state, r, c) === 4;
}

export function canClaimSegment(state, type, r, c) {
  if (!state || state.isGameOver) return false;
  const cleanType = String(type || '').toLowerCase();
  if (cleanType === 'h') {
    if (r < 0 || r >= state.dotRows || c < 0 || c >= state.boxCols) return false;
    return state.H[r][c] === null;
  }
  if (cleanType === 'v') {
    if (r < 0 || r >= state.boxRows || c < 0 || c >= state.dotCols) return false;
    return state.V[r][c] === null;
  }
  return false;
}

/**
 * Claims a segment ('h' or 'v') at (r, c) for `state.currentTurn`.
 * Mutates `state` in place (pushing undo snapshot to `state.history`) and returns an outcome descriptor.
 */
export function claimSegment(state, type, r, c) {
  const cleanType = String(type || '').toLowerCase();
  if (!canClaimSegment(state, cleanType, r, c)) {
    return { ok: false, reason: 'invalid_or_taken' };
  }

  // Save snapshot for Undo
  state.history.push(cloneBoardSnapshot(state));

  const player = state.currentTurn;
  const moveIndex = state.moveCount + 1;
  state.moveCount = moveIndex;

  const segRecord = { owner: player, moveIndex };
  if (cleanType === 'h') {
    state.H[r][c] = segRecord;
  } else {
    state.V[r][c] = segRecord;
  }

  // Check adjacent boxes that share this segment
  const candidateBoxes = [];
  if (cleanType === 'h') {
    if (r > 0) candidateBoxes.push([r - 1, c]);
    if (r < state.boxRows) candidateBoxes.push([r, c]);
  } else {
    if (c > 0) candidateBoxes.push([r, c - 1]);
    if (c < state.boxCols) candidateBoxes.push([r, c]);
  }

  const capturedBoxes = [];
  for (const [br, bc] of candidateBoxes) {
    if (!state.boxes[br][bc] && isBoxComplete(state, br, bc)) {
      state.boxes[br][bc] = {
        owner: player,
        moveIndex,
        comboStep: state.currentCombo + capturedBoxes.length + 1,
      };
      state.scores[player] += 1;
      capturedBoxes.push({ r: br, c: bc, owner: player, comboStep: state.boxes[br][bc].comboStep });
    }
  }

  let extraTurn = false;
  if (capturedBoxes.length > 0) {
    extraTurn = true;
    state.currentCombo += capturedBoxes.length;
    if (state.currentCombo > state.maxCombo[player]) {
      state.maxCombo[player] = state.currentCombo;
    }
  } else {
    state.currentCombo = 0;
    state.currentTurn = player === 'p1' ? 'p2' : 'p1';
  }

  const claimedTotal = state.scores.p1 + state.scores.p2;
  if (claimedTotal >= state.totalBoxes) {
    state.isGameOver = true;
    state.endedAt = new Date().toISOString();
    if (state.scores.p1 > state.scores.p2) {
      state.winner = 'p1';
    } else if (state.scores.p2 > state.scores.p1) {
      state.winner = 'p2';
    } else {
      state.winner = 'tie';
    }
  }

  state.lastMove = {
    type: cleanType,
    r,
    c,
    player,
    moveIndex,
    capturedBoxes,
    extraTurn,
    comboCount: state.currentCombo,
  };

  return {
    ok: true,
    player,
    type: cleanType,
    r,
    c,
    moveIndex,
    capturedBoxes,
    extraTurn,
    comboCount: state.currentCombo,
    nextTurn: state.currentTurn,
    isGameOver: state.isGameOver,
    winner: state.winner,
  };
}

export function undoMove(state) {
  if (!state || !Array.isArray(state.history) || state.history.length === 0) {
    return { ok: false };
  }
  const prev = state.history.pop();
  state.H = prev.H;
  state.V = prev.V;
  state.boxes = prev.boxes;
  state.currentTurn = prev.currentTurn;
  state.scores = prev.scores;
  state.currentCombo = prev.currentCombo;
  state.maxCombo = prev.maxCombo;
  state.moveCount = prev.moveCount;
  state.lastMove = prev.lastMove;
  state.isGameOver = prev.isGameOver;
  state.winner = prev.winner;
  state.endedAt = prev.endedAt;
  return { ok: true, currentTurn: state.currentTurn, moveCount: state.moveCount };
}

export function listAvailableSegments(state) {
  const list = [];
  for (let r = 0; r < state.dotRows; r++) {
    for (let c = 0; c < state.boxCols; c++) {
      if (!state.H[r][c]) list.push({ type: 'h', r, c });
    }
  }
  for (let r = 0; r < state.boxRows; r++) {
    for (let c = 0; c < state.dotCols; c++) {
      if (!state.V[r][c]) list.push({ type: 'v', r, c });
    }
  }
  return list;
}

function getAdjacentBoxesForSegment(state, seg) {
  const boxes = [];
  if (seg.type === 'h') {
    if (seg.r > 0) boxes.push([seg.r - 1, seg.c]);
    if (seg.r < state.boxRows) boxes.push([seg.r, seg.c]);
  } else {
    if (seg.c > 0) boxes.push([seg.r, seg.c - 1]);
    if (seg.c < state.boxCols) boxes.push([seg.r, seg.c]);
  }
  return boxes;
}

/**
 * Smart CPU Bot AI for 1P vs Bot mode:
 * 1. If any segment completes 1 or 2 boxes (3 sides already drawn), take it immediately (preferring 2-box double captures!).
 * 2. Otherwise, prefer "safe" segments where neither adjacent box currently has 2 sides drawn (so it won't become 3 sides for the opponent).
 * 3. If all remaining segments are unsafe (endgame chain), pick the segment that gives away the fewest immediate 3-side boxes.
 */
export function chooseBotMove(state) {
  const available = listAvailableSegments(state);
  if (available.length === 0) return null;

  const scoringMoves = [];
  const safeMoves = [];
  const riskyMoves = [];

  for (const seg of available) {
    const adj = getAdjacentBoxesForSegment(state, seg);
    const sideCounts = adj.map(([br, bc]) => countBoxSides(state, br, bc));
    const closesCount = sideCounts.filter((cnt) => cnt === 3).length;
    const givesThirdSideCount = sideCounts.filter((cnt) => cnt === 2).length;

    if (closesCount > 0) {
      scoringMoves.push({ ...seg, closesCount });
    } else if (givesThirdSideCount === 0) {
      safeMoves.push(seg);
    } else {
      riskyMoves.push({ ...seg, givesThirdSideCount });
    }
  }

  if (scoringMoves.length > 0) {
    scoringMoves.sort((a, b) => b.closesCount - a.closesCount);
    return { type: scoringMoves[0].type, r: scoringMoves[0].r, c: scoringMoves[0].c };
  }

  if (safeMoves.length > 0) {
    const pick = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    return { type: pick.type, r: pick.r, c: pick.c };
  }

  riskyMoves.sort((a, b) => a.givesThirdSideCount - b.givesThirdSideCount);
  return { type: riskyMoves[0].type, r: riskyMoves[0].r, c: riskyMoves[0].c };
}
