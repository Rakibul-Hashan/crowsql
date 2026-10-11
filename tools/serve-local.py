#!/usr/bin/env python3
"""Local test server that sends the same headers as production (OurSQL needs COOP/COEP, so `python -m http.server` is not enough).
Usage: python3 tools/serve-local.py [port]   then open http://localhost:8000"""
import os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSP_SH = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'"
CSP_CF = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'self'"
class H(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.wasm': 'application/wasm', '.mjs': 'text/javascript', '.webmanifest': 'application/manifest+json'}
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def end_headers(self):
        p = self.path.split('?')[0]
        for k, v in (('Cross-Origin-Opener-Policy', 'same-origin'), ('Cross-Origin-Embedder-Policy', 'require-corp'), ('Cross-Origin-Resource-Policy', 'same-origin'), ('X-Content-Type-Options', 'nosniff')): self.send_header(k, v)
        if p in ('/', '/index.html') or p.startswith('/shell/'): self.send_header('Content-Security-Policy', CSP_SH); self.send_header('Cache-Control', 'no-cache')
        elif p.startswith('/crowfoot/'): self.send_header('Content-Security-Policy', CSP_CF)
        super().end_headers()
    def log_message(self, *a): pass
if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f'Serving on http://localhost:{port}  (Ctrl+C to stop)'); ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
