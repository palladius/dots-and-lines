# Changelog

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

