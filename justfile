# Dots and Lines Deluxe Justfile

default:
    @just --list

test:
    node --test tests/dots-engine.test.mjs

serve port="8096":
    python3 -m http.server {{port}}
