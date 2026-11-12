# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright>=1.45"]
# ///
"""🃏 E2E: play a full Dots & Lines game with REAL mouse clicks, then redeem the card by CLICKING it.

Why real mouse clicks (`page.mouse.click(x, y)`) and not `element.click()`/`dispatchEvent`:
synthetic clicks skip browser hit-testing, so they would "pass" even when the button is
`inert` underneath the Hall of Fame `<dialog>.showModal()` (the original bug).

Flow:
  1. Fresh browser context (no HTTP cache), open the app, pick 3x3 + 2P local, start a new game.
  2. Click EVERY segment midpoint on the <canvas> until the game is over.
  3. Wait for the Hall of Fame modal + the card reveal toast (a real dropped card).
  4. Real-mouse click "✨ Riscatta Carta!" -> expect "✅ Riscattata!" and the toast to disappear.
  5. Expect the card to be in the Album (`PuffinLogin.getUserCards`).

Usage:
  uv run tests/e2e/redeem_card_e2e.py --url http://localhost:8096/            # Chrome (default)
  uv run tests/e2e/redeem_card_e2e.py --url http://localhost:8096/ --browser webkit   # Safari engine (iPad)
  uv run tests/e2e/redeem_card_e2e.py --headed                                  # watch it play
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

TOAST = "#puffin-card-reveal-toast"


def log(msg: str) -> None:
    print(f"[e2e] {msg}", flush=True)


def segment_midpoints(page: Page) -> list[tuple[str, int, int, float, float]]:
    """Viewport (x, y) of every still-free segment midpoint, computed from the live renderer layout."""
    return page.evaluate(
        """() => {
          const app = window.dotsApp;
          const s = app.state, L = app.renderer.layout;
          const rect = app.renderer.canvas.getBoundingClientRect();
          const dot = (r, c) => ({ x: rect.left + L.originX + c * L.step, y: rect.top + L.originY + r * L.step });
          const out = [];
          for (let r = 0; r < s.dotRows; r++) for (let c = 0; c < s.boxCols; c++) if (!s.H[r][c]) {
            const a = dot(r, c), b = dot(r, c + 1); out.push(['h', r, c, (a.x + b.x) / 2, (a.y + b.y) / 2]);
          }
          for (let r = 0; r < s.boxRows; r++) for (let c = 0; c < s.dotCols; c++) if (!s.V[r][c]) {
            const a = dot(r, c), b = dot(r + 1, c); out.push(['v', r, c, (a.x + b.x) / 2, (a.y + b.y) / 2]);
          }
          return out;
        }"""
    )


def real_click(page: Page, locator, label: str) -> None:
    box = locator.bounding_box()
    assert box, f"{label}: element has no bounding box (not visible?)"
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    hit = page.evaluate(
        """([x, y]) => {
          // Walk into shadow roots to report what the browser would actually hit-test at (x, y).
          let el = document.elementFromPoint(x, y);
          while (el && el.shadowRoot) { const inner = el.shadowRoot.elementFromPoint(x, y); if (!inner || inner === el) break; el = inner; }
          return el ? (el.id || el.tagName) : null;
        }""",
        [x, y],
    )
    log(f"mouse.click {label} at ({x:.0f},{y:.0f}) -> hit-test target: {hit}")
    page.mouse.click(x, y)


def run(url: str, browser_name: str, headed: bool, shots: Path) -> int:
    shots.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        if browser_name == "webkit":
            browser = p.webkit.launch(headless=not headed)
        else:
            browser = p.chromium.launch(channel="chrome", headless=not headed)
        context = browser.new_context(viewport={"width": 1100, "height": 820})
        page = context.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        page.goto(url)
        page.wait_for_function("window.dotsApp && window.PuffinLogin")
        served_fix = page.evaluate(
            "fetch('./src/puffin-cards.js',{cache:'no-store'}).then(r=>r.text()).then(t=>t.includes('findTopModalDialog'))"
        )
        log(f"served puffin-cards.js contains the fix: {served_fix}")

        # 1. Start screen: 3x3 grid, 2P local, NEW GAME
        if page.locator("#start-screen").is_visible():
            page.locator("#mode-2p-btn").click()
            page.locator('[data-grid="3x3"]').click()
            page.locator("#start-new-game-btn").click()
        page.wait_for_function("window.dotsApp.state && window.dotsApp.state.gridKey === '3x3' || true")
        if page.evaluate("window.dotsApp.state.gridKey") != "3x3":
            page.evaluate("window.dotsApp.startNewGame('3x3', true)")
        page.wait_for_timeout(300)

        # 2. Play the whole game by clicking the canvas
        clicks = 0
        while not page.evaluate("window.dotsApp.state.isGameOver"):
            segs = segment_midpoints(page)
            assert segs, "no free segments left but game is not over?!"
            _, _, _, x, y = segs[0]
            before = page.evaluate("window.dotsApp.state.moveCount")
            page.mouse.click(x, y)
            page.wait_for_function(f"window.dotsApp.state.moveCount > {before}", timeout=3000)
            clicks += 1
            assert clicks < 200, "too many clicks"
        scores = page.evaluate("window.dotsApp.state.scores")
        log(f"game over after {clicks} canvas clicks, scores={scores}")

        # 3. Hall of Fame modal + card toast
        page.wait_for_function("document.getElementById('gameover-dialog').open", timeout=10000)
        toast = page.locator(TOAST)
        toast.wait_for(state="attached", timeout=10000)
        claim = toast.locator("#claim-toast-btn")
        claim.wait_for(state="visible", timeout=5000)
        card_title = toast.locator(".mtg-title").first.text_content().strip()
        parent = page.evaluate(f"(document.querySelector('{TOAST}').parentNode.id || document.querySelector('{TOAST}').parentNode.tagName)")
        log(f"card dropped: {card_title!r}; toast host parent: {parent}")
        page.wait_for_timeout(1500)  # let re-promote timers / animations settle, like a human would
        page.screenshot(path=str(shots / f"01-before-claim-{browser_name}.png"))

        # 4. REAL mouse click on "Riscatta Carta!" -> instant feedback, fly-to-Album animation, success, close
        real_click(page, claim, "✨ Riscatta Carta!")
        t_click = time.time()
        page.wait_for_function(
            f"""() => {{ const t = document.querySelector('{TOAST}'); const b = t && t.shadowRoot.getElementById('claim-toast-btn');
                return !t || (b && (b.classList.contains('is-claiming') || b.classList.contains('is-claimed'))); }}""",
            timeout=2000,
            polling=10,
        )
        feedback_ms = (time.time() - t_click) * 1000
        busy_label = claim.text_content().strip() if toast.count() else "(toast already gone)"
        log(f"feedback after {feedback_ms:.0f} ms: {busy_label!r}")
        page.screenshot(path=str(shots / f"02-claiming-{browser_name}.png"))
        page.wait_for_timeout(450)
        page.screenshot(path=str(shots / f"03-flying-{browser_name}.png"))
        page.wait_for_function(
            f"""() => {{ const t = document.querySelector('{TOAST}'); const b = t && t.shadowRoot.getElementById('claim-toast-btn');
                return b && b.textContent.includes('✅'); }}""",
            timeout=3000,
            polling=20,
        )
        label = claim.text_content().strip()
        log(f"success label after {(time.time() - t_click) * 1000:.0f} ms: {label!r}")
        page.screenshot(path=str(shots / f"04-claimed-{browser_name}.png"))
        try:
            toast.wait_for(state="detached", timeout=3000)
            closed = True
        except Exception:
            closed = False
        log(f"toast closed after claim: {closed} ({(time.time() - t_click) * 1000:.0f} ms after click)")

        # 5. Card is in the Album
        in_album = page.evaluate(
            """(title) => window.PuffinLogin.getUserCards({ player_id: 'ALL' })
                 .some(uc => { const t = (window.PuffinLogin.getCardsCatalog().find(c => c.card_id === uc.card_id) || {}).title || '';
                               return title.includes(t) && t; })""",
            card_title,
        )
        log(f"card present in Album: {in_album}")
        if errors:
            log(f"page errors: {errors}")
        browser.close()

    ok = bool(closed and label.startswith("✅") and in_album and feedback_ms < 300)
    log("✅ PASS" if ok else "❌ FAIL")
    return 0 if ok else 1


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", default="http://localhost:8096/")
    ap.add_argument("--browser", choices=["chrome", "webkit"], default="chrome")
    ap.add_argument("--headed", action="store_true")
    ap.add_argument("--shots", default="log/e2e", help="screenshot output dir")
    a = ap.parse_args()
    t0 = time.time()
    rc = run(a.url, a.browser, a.headed, Path(a.shots))
    log(f"done in {time.time() - t0:.1f}s")
    sys.exit(rc)


if __name__ == "__main__":
    main()
