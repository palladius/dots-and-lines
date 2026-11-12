# Changelog

## [1.1.0] - 2026-11-12

### Added
- **⏱️ Per-Move Timing Stats & PuffinLogin Telemetry (`avg_move_ms` / `max_move_ms`)**:
  - Tracked exact elapsed time per move (`moveTimesMs.p1` and `moveTimesMs.p2`, undo-safe via `cloneBoardSnapshot`) and added [`getMoveTimeStats`](file:///Users/riccardo/git/dots-and-lines/src/core/DotsEngine.js) in `src/core/DotsEngine.js`.
  - Added side-by-side **Ale vs Seby** move timing cards (`#winner-timing-stats`) in the Game Over modal showing **Tempo Medio / mossa** (`⏱️ Media/mossa`) and **Tempo Max / mossa** (`🐢 Max/mossa`) plus total moves for each player.
  - Enriched `PuffinLogin.submitDualMatchScore` and `validateAndNormalizeScorePayload` (`src/puffin-login.js`) so the final high-score telemetry JSON includes `avg_move_ms`, `max_move_ms`, `avg_move_sec`, `max_move_sec`, `player_moves`, `opponent_avg_move_ms`, `opponent_max_move_ms`, and `move_timing: { p1, p2 }`.

## [1.0.1] - 2026-11-12

### Fixed
- **📱 Mobile Viewport Fit & Clean Gameplay Layout (Fixes #1)**:
  - Removed intermediate `.rivalry-strip` and `#status-line` clutter from `#game-shell` during active gameplay, keeping only the top bar + 2 PuffinLogin player cards at the top, the full-height neon dot grid in the middle, and `↩ Annulla` / `↻ Nuova partita` at the bottom (moved `2P Dual` / `vs Bot` switcher into the `⌂` start/menu overlay).
  - Locked `.app-shell` to `height: 100dvh; max-height: 100dvh; overflow: hidden;` with `flex: 1 1 0; min-height: 0;` on `.board-stage` and `position: absolute; inset: 0;` on `#dots-canvas`.
  - Updated `NeonBoardRenderer.resize()` with a `ResizeObserver` on `.board-stage` and `visualViewport` listener so all grid sizes (`3x3` to `6x6`) dynamically scale to fit 100% inside mobile viewports without clipping or scrolling.

## [1.0.0] - 2026-11-11

### Added
- **🔴🔵 Dots & Lines Deluxe (Pipopipette Neon Dual-Puffin Edition)**:
  - Inspired by Paolo's mobile Dots & Lines game (`assets/01-start-rules.jpg`..`05-gameplay-box-closed-tie.jpg`) and enhanced with **Dual PuffinLogin v2.1.0** (`player-slot="p1"` vs `player-slot="p2"`).
  - Supports 5 grid sizes (`3x3`, `4x4`, `4x5` Paolo Classic, `5x5`, `6x6`), 2P Dual local pass-and-play (*Ale vs Seby*, *Ale vs Papino Riccardo*, etc.) and 1P vs Smart CPU Bot.
  - High-DPI Neon Canvas renderer with breathing dots, laser line glow + white-hot core on latest segment, particle burst, shockwave rings, and Pixar avatar stamps inside conquered boxes.
  - Web Audio synthesizer with ascending `Do-Re-Mi-Fa-Sol-La-Si-Do` musical combo scale on consecutive box captures.
  - Cloud High Scores & Head-to-Head (`H2H`) rivalry stats persisted to `pvt-puffin-login` Firestore (`ror-goldie`).

