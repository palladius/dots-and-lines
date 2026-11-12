# Changelog

## [1.1.2] - 2026-11-12

### Added
- **🧪 Real E2E redeem test (`just e2e [chrome|webkit]`)**: `tests/e2e/redeem_card_e2e.py` plays a full 3x3 game by real mouse clicks on the canvas, waits for the Hall of Fame modal and the dropped card, then clicks "✨ Riscatta Carta!" with the real mouse (`page.mouse.click`, so browser hit-testing applies) and checks the toast closes and the card is in the Album. Passes on Chrome and WebKit (iPad engine).

### Fixed
- **🧊 Stale JS after `git pull` in local dev**: `just serve` now uses `scripts/serve_nocache.py` (`Cache-Control: no-store`). Plain `python3 -m http.server` only sends `Last-Modified`, so Chrome kept running the cached pre-fix `src/puffin-cards.js` after a normal reload (verified: `transferSize: 0`), which made the v1.0.3 "Riscatta Carta" fix look still broken.

## [1.1.1] - 2026-11-12

### Changed
- **👻 Ghost move preview**: the hover/swipe preview of a move that has NOT been played yet is now dashed, thinner, glow-less, white-outlined and animated (marching ants), so it can never be confused with a real solid neon line.
- **🖥️ Bot CPU color**: switched to dark terminal-phosphor green `#16A34A`.

## [1.1.0] - 2026-11-12

### Added
- **⏱️ Per-Move Timing Stats & PuffinLogin Telemetry (`avg_move_ms` / `max_move_ms`)**:
  - Tracked exact elapsed time per move (`moveTimesMs.p1` and `moveTimesMs.p2`, undo-safe via `cloneBoardSnapshot`) and added [`getMoveTimeStats`](file:///Users/riccardo/git/dots-and-lines/src/core/DotsEngine.js) in `src/core/DotsEngine.js`.
  - Added side-by-side **Ale vs Seby** move timing cards (`#winner-timing-stats`) in the Game Over modal showing **Tempo Medio / mossa** (`⏱️ Media/mossa`) and **Tempo Max / mossa** (`🐢 Max/mossa`) plus total moves for each player.
  - Enriched `PuffinLogin.submitDualMatchScore` and `validateAndNormalizeScorePayload` (`src/puffin-login.js`) so the final high-score telemetry JSON includes `avg_move_ms`, `max_move_ms`, `avg_move_sec`, `max_move_sec`, `player_moves`, `opponent_avg_move_ms`, `opponent_max_move_ms`, and `move_timing: { p1, p2 }`.
- **🏷️ Visible App Version Badge**: added the live app version (`v1.1.0`, synced from `./VERSION`) to the Start/Rules screen and gameplay header.

## [1.0.3] - 2026-11-12

### Fixed
- **🃏 "✨ Riscatta Carta!" button did nothing over the Hall of Fame**:
  - Root cause: `<dialog id="gameover-dialog">.showModal()` makes everything outside the dialog `inert` (even Top-Layer popovers), so every button on the card reveal toast (Riscatta, ✖, Album, Gira) silently ignored clicks.
  - `showPuffinCardRevealToast()` in `src/puffin-cards.js` now mounts the toast host inside the topmost open modal `<dialog>` and follows dialogs as they open/close (moving back to `<body>` when they close).
  - Redeeming is always "yes": the card is already saved to the Album when it unlocks. The button now shows `✅ Riscattata! Nel tuo Album`, fires a `puffin-card-claimed` event and then closes.

## [1.0.2] - 2026-11-12

### Fixed
- **🙈 No borrowed faces for unlogged players**: when P1/P2 are NOT logged in, conquered boxes now show only the neon slot color (cyan / magenta) — no more Ale/Seby Pixar faces stamped inside. `FALLBACK_P1/P2.avatar` is now `null`, `NeonBoardRenderer` skips the stamp when `isLogged === false`, and the winner banner hides the avatar image for unlogged winners.
- **💚 Bot CPU color**: changed from purple `#A855F7` (clashed with Kate's profile color) to neon green `#22C55E`, a color no family profile uses.

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

