#!/usr/bin/env python3
"""Crowfoot production build. Needs: node 18+, `npm i tailwindcss@3 esbuild @fontsource/jetbrains-mono @fontsource/schibsted-grotesk`.
Run from the project root:  python3 src/build.py   ->  writes ./dist"""
import hashlib, json, os, re, shutil, subprocess, sys
ROOT = os.getcwd(); SRC = os.path.join(ROOT, 'src'); DIST = os.path.join(ROOT, 'dist'); BIN = os.path.join(ROOT, 'node_modules', '.bin')
VERSION = '3.2.0'
def run(*a): subprocess.run(a, check=True, cwd=ROOT)
def h(p): return hashlib.md5(open(p, 'rb').read()).hexdigest()[:8]
shutil.rmtree(DIST, ignore_errors=True)
for d in ('css', 'js', 'assets/fonts', 'assets/icons'): os.makedirs(os.path.join(DIST, d))
# fonts (latin subset, woff2)
for fam, pk in (('jetbrains-mono', 'jetbrains-mono'), ('schibsted-grotesk', 'schibsted-grotesk')):
    for w in (400, 500, 600, 700):
        shutil.copy(f'node_modules/@fontsource/{pk}/files/{fam}-latin-{w}-normal.woff2', f'{DIST}/assets/fonts/{fam}-{w}.woff2')
# css
run(f'{BIN}/tailwindcss', '-c', 'src/tailwind.config.js', '-i', 'src/css/tailwind.in.css', '-o', 'dist/css/tailwind.css', '--minify')
run(f'{BIN}/esbuild', 'src/css/app.css', '--minify', '--outfile=dist/css/app.css', '--log-level=warning')
run(f'{BIN}/esbuild', 'src/css/fonts.css', '--minify', '--outfile=dist/css/fonts.css', '--log-level=warning')
# js
run(f'{BIN}/esbuild', 'src/js/app.js', '--minify', '--target=es2019', '--outfile=dist/js/app.js', '--log-level=warning')
run(f'{BIN}/esbuild', 'src/js/pwa.js', '--minify', '--outfile=dist/js/pwa.js', '--log-level=warning')
# changelog generated from the in-app list
js = open(f'{SRC}/js/app.js', encoding='utf-8').read(); i = js.index('const CHANGELOG = ['); j = js.index('\n  ];', i)
out = subprocess.run(['node', '-e', "const a=eval(process.argv[1]);let m='# Changelog\\n\\nAll notable changes to Crowfoot ER Designer.\\n\\n';a.forEach(([v,x])=>{m+='## v'+v+'\\n'+x.map(t=>'- '+t).join('\\n')+'\\n\\n'});process.stdout.write(m)", js[i + len('const CHANGELOG = '):j + 4]], capture_output=True, text=True, check=True).stdout
open(f'{SRC}/CHANGELOG.md', 'w', encoding='utf-8').write(out)
# static
for f in ('manifest.webmanifest',): shutil.copy(f'{SRC}/{f}', f'{DIST}/{f}')
for f in os.listdir(f'{SRC}/assets/icons'): shutil.copy(f'{SRC}/assets/icons/{f}', f'{DIST}/assets/icons/{f}')
ver = {f: h(f'{DIST}/{f}') for f in ('css/fonts.css', 'css/tailwind.css', 'css/app.css', 'js/app.js', 'js/pwa.js')}
q = lambda f: f'{f}?v={ver[f]}'
body = open(f'{SRC}/body.html', encoding='utf-8').read()
html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Crowfoot – Free MySQL ER Diagram Designer</title>
<meta name="description" content="Design MySQL ER diagrams in Crow's Foot, Chen or UML notation. Import and export SQL, visualize queries, map ER to relational tables and practise normalization. Free, private, works offline.">
<meta name="theme-color" content="#0f766e" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b1220" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta property="og:title" content="Crowfoot ER Designer"><meta property="og:description" content="Free MySQL ER diagram designer and database design lab."><meta property="og:type" content="website">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="assets/icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
<link rel="preload" href="assets/fonts/schibsted-grotesk-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/schibsted-grotesk-600.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{q('css/fonts.css')}">
<link rel="stylesheet" href="{q('css/tailwind.css')}">
<link rel="stylesheet" href="{q('css/app.css')}">
</head>
<body>
{body}
<noscript><p style="padding:24px;font-family:system-ui">Crowfoot needs JavaScript to run. Please enable it and reload.</p></noscript>
<script src="{q('js/app.js')}" defer></script>
<script src="{q('js/pwa.js')}" defer></script>
</body>
</html>
'''
open(f'{DIST}/index.html', 'w', encoding='utf-8').write(html)
# service worker
shell = ['./', 'index.html', 'manifest.webmanifest', 'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/apple-touch-icon.png'] + [q(f) for f in ver] + [f'assets/fonts/{x}' for x in sorted(os.listdir(f'{DIST}/assets/fonts'))]
sw = open(f'{SRC}/sw.template.js', encoding='utf-8').read().replace('__VERSION__', VERSION + '-' + h(f'{DIST}/js/app.js')).replace('__SHELL__', json.dumps(shell))
open(f'{DIST}/sw.js', 'w', encoding='utf-8').write(sw)
for f in ('_headers', 'robots.txt', '.htaccess', 'README.md', 'CHANGELOG.md'):
    if os.path.exists(f'{SRC}/{f}'): shutil.copy(f'{SRC}/{f}', f'{DIST}/{f}')
tot = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(DIST) for f in fs)
print('built', DIST, 'total', tot // 1024, 'KB')
