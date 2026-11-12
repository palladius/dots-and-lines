#!/usr/bin/env python3
"""Static dev server for Dots & Lines that sends `Cache-Control: no-store`.

Plain `python3 -m http.server` only sends `Last-Modified`, so browsers cache the ES modules
(`src/*.js`) heuristically and a normal reload keeps running STALE code after a `git pull`
(that's how the already-fixed "Riscatta Carta" bug looked "still broken" locally).

Usage: python3 scripts/serve_nocache.py [PORT]   (default 8096)
"""

import functools
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8096
    handler = functools.partial(NoCacheHandler, directory=".")
    with http.server.ThreadingHTTPServer(("", port), handler) as httpd:
        print(f"🟢 Dots & Lines (no-cache) on http://localhost:{port}/", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
