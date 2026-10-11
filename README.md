# Crowfoot + OurSQL

One site, two workspaces, nothing changed inside either app:

- **Crowfoot** (`crowfoot/`): MySQL ER diagram designer, v3.1.
- **OurSQL** (`oursql/`): browser-local MariaDB workspace, v1.3.3.

`index.html` is a thin shell with two tabs. Each app opens in its own frame, keeps its own state, and OurSQL's 17 MB database engine loads only the first time you open its tab.

## Host it (important)
OurSQL needs the headers `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. Use a host that lets you set headers:

| Host | Config file already included |
| :--- | :--- |
| Vercel | `vercel.json` |
| Cloudflare Pages, Netlify | `_headers` |

**GitHub Pages cannot set these headers.** On GitHub Pages the shell and Crowfoot work, but the OurSQL tab will not start its database engine.

Both apps share one origin, so they must stay on the same domain. Their saved data uses different keys and does not clash.

## Test locally
`python3 tools/serve-local.py` then open http://localhost:8000. A plain `python -m http.server` is not enough, because it does not send the headers OurSQL needs.

## Layout
- `index.html`, `shell/`: the tab shell (new)
- `crowfoot/`: Crowfoot production build (unchanged)
- `oursql/`: OurSQL `public/` folder (unchanged)
- `crowfoot-source/`: Crowfoot sources and build script. After rebuilding, copy the new `dist/` contents into `crowfoot/`.
- `licenses/`: GPL-2.0 text and third-party notices from OurSQL

## Updating one app
Replace only that app's folder (`crowfoot/` or `oursql/`) and push. The other app is untouched.

## License
OurSQL is GPL-2.0 (MariaDB engine and phpMyAdmin theme assets). If you distribute this combined site, publish it under GPL-2.0-compatible terms and keep the notices in `licenses/` and `oursql/`. This is not legal advice.

## Changes made only for hosting
The apps' own `_headers`, `.htaccess` and `vercel.json` files were removed from their folders and replaced by the root `_headers` and `vercel.json`. Crowfoot's frame rule changed from "never framed" to "framed by this site only", so the shell can show it. No app code was changed.
