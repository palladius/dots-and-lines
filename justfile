# Dots and Lines Deluxe Justfile

default:
    @just --list

test:
    node --test tests/dots-engine.test.mjs

# Dev server with Cache-Control: no-store (plain http.server lets Chrome run stale JS after git pull)
serve port="8096":
    python3 scripts/serve_nocache.py {{port}}

# E2E: play a full 3x3 game with real mouse clicks, then click "Riscatta Carta!" (browser=chrome|webkit)
e2e browser="chrome" port="8197":
    #!/usr/bin/env bash
    set -euo pipefail
    timeout 120 python3 scripts/serve_nocache.py {{port}} >/dev/null 2>&1 &
    SRV=$!
    trap 'kill $SRV 2>/dev/null || true' EXIT
    sleep 1
    timeout 100 uv run -q tests/e2e/redeem_card_e2e.py --url http://localhost:{{port}}/ --browser {{browser}}
