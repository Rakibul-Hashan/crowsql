/* Switches between Crowfoot and OurSQL. Each app stays loaded (and keeps its state) once opened; OurSQL's large engine loads only when first opened. */
(function () {
  'use strict';
  var APPS = ['crowfoot', 'oursql'], KEY = 'shell.tab.v1';
  var NOTE = { crowfoot: 'Loading Crowfoot…', oursql: 'Loading OurSQL… the database engine is about 17 MB, first visit only.' };
  var load = document.getElementById('loading'), txt = document.getElementById('loading-text');
  function frame(a) { return document.getElementById('app-' + a); }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function show(a, push) {
    if (APPS.indexOf(a) < 0) a = 'crowfoot';
    APPS.forEach(function (n) {
      var f = frame(n), on = n === a; f.hidden = !on;
      var t = document.getElementById('tab-' + n); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
    });
    var f = frame(a);
    if (!f.getAttribute('src')) {
      txt.textContent = NOTE[a]; load.hidden = false;
      f.addEventListener('load', function () { load.hidden = true; }, { once: true });
      f.setAttribute('src', f.dataset.src);
    } else { load.hidden = true; }
    try { localStorage.setItem(KEY, a); } catch (e) {}
    if (push && location.hash !== '#' + a) history.replaceState(null, '', '#' + a);
    document.title = (a === 'oursql' ? 'OurSQL' : 'Crowfoot') + ' · Crowfoot + OurSQL';
  }
  document.querySelector('.tabs').addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) show(b.dataset.app, true); });
  document.querySelector('.tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var cur = APPS.findIndex(function (n) { return document.getElementById('tab-' + n).getAttribute('aria-selected') === 'true'; });
    var nx = APPS[(cur + (e.key === 'ArrowRight' ? 1 : APPS.length - 1)) % APPS.length]; show(nx, true); document.getElementById('tab-' + nx).focus();
  });
  window.addEventListener('hashchange', function () { show(location.hash.slice(1), false); });

  /* Database -> ERD: asks OurSQL for the CREATE TABLE statements of the open database and hands them to Crowfoot. */
  var erd = document.getElementById('btn-erd'), toastEl = document.getElementById('toast'), tt;
  function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(tt); tt = setTimeout(function () { toastEl.hidden = true; }, 7000); }
  function waitFor(test, ms) { return new Promise(function (res, rej) { var t0 = Date.now(); (function poll() { try { if (test()) return res(); } catch (e) {} if (Date.now() - t0 > ms) return rej(new Error('timeout')); setTimeout(poll, 250); })(); }); }
  function askSchema(f) {
    return new Promise(function (res, rej) {
      var done = false;
      function on(e) { if (e.origin !== location.origin || e.source !== f.contentWindow || !e.data || e.data.type !== 'cf:schema') return; done = true; removeEventListener('message', on); res(e.data); }
      addEventListener('message', on); f.contentWindow.postMessage({ type: 'cf:get-schema' }, location.origin);
      setTimeout(function () { if (!done) { removeEventListener('message', on); rej(new Error('timeout')); } }, 20000);
    });
  }
  erd.addEventListener('click', async function () {
    erd.disabled = true;
    try {
      show('oursql', true); var f = frame('oursql');
      await waitFor(function () { var st = f.contentDocument && f.contentDocument.body && f.contentDocument.body.dataset.engineState; return st && st !== 'loading'; }, 90000);
      var r = await askSchema(f);
      if (r.error === 'no-database') { toast('Open a database in OurSQL first (click its name in the left list), then press Database → ERD again.'); return; }
      if (r.error === 'no-tables') { toast('The database "' + r.db + '" has no tables yet.'); return; }
      if (r.error) { toast('Could not read the schema: ' + r.error); return; }
      show('crowfoot', true); var c = frame('crowfoot');
      await waitFor(function () { return c.contentDocument && c.contentDocument.readyState === 'complete' && c.contentDocument.getElementById('app'); }, 20000);
      c.contentWindow.postMessage({ type: 'cf:import-sql', sql: r.sql, name: r.db }, location.origin);
      toast('Opened "' + r.db + '" (' + r.count + ' table' + (r.count === 1 ? '' : 's') + ') in Crowfoot. Press Undo there to bring back your previous diagram.');
    } catch (e) { toast('OurSQL did not respond in time. Open the OurSQL tab, wait until it finishes loading, then try again.'); }
    finally { erd.disabled = false; }
  });
  show(location.hash.slice(1) || stored() || 'crowfoot', true);
})();
