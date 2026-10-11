/* Crowfoot service worker: cache-first app shell so the app opens instantly and works offline. */
const CACHE = 'crowfoot-3.2.0-5300a3f7';
const SHELL = ["./", "index.html", "manifest.webmanifest", "assets/icons/icon.svg", "assets/icons/icon-192.png", "assets/icons/apple-touch-icon.png", "css/fonts.css?v=ffe4261e", "css/tailwind.css?v=d9b7603d", "css/app.css?v=01218903", "js/app.js?v=5300a3f7", "js/pwa.js?v=982e88f7", "assets/fonts/jetbrains-mono-400.woff2", "assets/fonts/jetbrains-mono-500.woff2", "assets/fonts/jetbrains-mono-600.woff2", "assets/fonts/jetbrains-mono-700.woff2", "assets/fonts/schibsted-grotesk-400.woff2", "assets/fonts/schibsted-grotesk-500.woff2", "assets/fonts/schibsted-grotesk-600.woff2", "assets/fonts/schibsted-grotesk-700.woff2"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('crowfoot-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: false }).then(hit => hit || fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => r.mode === 'navigate' ? caches.match('index.html') : Response.error())));
});
