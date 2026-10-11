# Crowfoot ER Designer

Free MySQL ER diagram designer and database design lab. Static site: no server, no database, no external requests. Your diagrams stay in your browser.

## Deploy
Upload the contents of this folder to any static host (Netlify, Cloudflare Pages, Vercel, GitHub Pages, Apache, nginx). `_headers` (Netlify / Cloudflare Pages) and `.htaccess` (Apache) add caching and security headers. For nginx, copy the same headers into your `server` block. HTTPS is needed for install-to-home-screen and offline mode.

## Layout
- `index.html`: page shell
- `css/`: `fonts.css` (local fonts), `tailwind.css` (compiled utilities), `app.css` (app styles)
- `js/`: `app.js` (the app), `pwa.js` (offline registration)
- `assets/`: fonts (woff2) and icons
- `sw.js`, `manifest.webmanifest`: offline and install support
- `src/`: readable sources and the build script

## Rebuild
Needs Node 18+ and Python 3. From the folder that contains `src/`:
`npm i tailwindcss@3 esbuild @fontsource/jetbrains-mono @fontsource/schibsted-grotesk && python3 src/build.py`
The output is written to `dist/`. Edit only files in `src/`.

## Files that change often
`css/*` and `js/*` use a content hash in the URL (`?v=...`), so browsers always fetch the new file after a rebuild while old files stay cached for a year.
