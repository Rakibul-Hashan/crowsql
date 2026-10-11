# Renders PNG icons from icon.svg with Playwright (run once; PNGs are committed in src/assets/icons).
import re, os
from playwright.sync_api import sync_playwright
D = os.path.join(os.getcwd(), 'src/assets/icons'); svg = open(f'{D}/icon.svg').read()
inner = re.sub(r'^<svg[^>]*>|</svg>$', '', svg.strip()); inner_nobg = inner.replace('<rect width="512" height="512" rx="112" fill="#0f766e"/>', '', 1)
mask = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0f766e"/><g transform="translate(51 51) scale(.8)">{inner_nobg}</g></svg>'
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, s, size in (('icon-192.png', svg, 192), ('icon-512.png', svg, 512), ('apple-touch-icon.png', mask, 180), ('icon-maskable-512.png', mask, 512)):
        pg = b.new_page(viewport={'width': size, 'height': size}); pg.set_content(f'<body style="margin:0">{s.replace("<svg ", f"<svg width={size} height={size} ", 1)}</body>'); pg.screenshot(path=f'{D}/{name}', omit_background=True)
    b.close()
