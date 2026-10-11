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
  show(location.hash.slice(1) || stored() || 'crowfoot', true);
})();
