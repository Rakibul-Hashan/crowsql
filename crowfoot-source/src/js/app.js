(() => {
'use strict';

/* =====================================================================
   Small helpers
   ===================================================================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const uid = p => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-2);
const NS = 'http://www.w3.org/2000/svg';
const BT = '`';

const ICON = (() => {
  const mk = p => (s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  return {
    plus: mk('<path d="M12 5v14M5 12h14"/>'),
    minus: mk('<path d="M5 12h14"/>'),
    trash: mk('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/>'),
    key: mk('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>'),
    undo: mk('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>'),
    redo: mk('<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>'),
    fit: mk('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    arrange: mk('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    download: mk('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'),
    upload: mk('<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>'),
    sun: mk('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>'),
    moon: mk('<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>'),
    panel: mk('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>'),
    copy: mk('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>'),
    swap: mk('<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
    table: mk('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>'),
    note: mk('<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/>'),
    x: mk('<path d="M6 6l12 12M18 6L6 18"/>'),
    up: mk('<path d="M6 15l6-6 6 6"/>'),
    down: mk('<path d="M6 9l6 6 6-6"/>'),
    check: mk('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    help: mk('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.7-1.5 1.2-1.5 2.3M12 17.2v.1"/>'),
    edit: mk('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
    link: mk('<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>'),
    diamond: mk('<path d="M12 3l9 9-9 9-9-9z"/>'),
    grip: (s = 12) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>`,
    resize: (s = 14) => `<svg viewBox="0 0 14 14" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5L5 12M12 9l-3 3"/></svg>`
  };
})();

/* =====================================================================
   Constants & relationship symbols
   ===================================================================== */
const ROW_H = 28, HEAD_H = 38, FOOT_H = 26, MIN_W = 200;
const STORE = 'crowfoot.diagram.v1', PREF = 'crowfoot.prefs.v1';
const COLORS = ['#2f6fed', '#0f9d78', '#c7791a', '#d6453d', '#7c4dd6', '#c93d8c', '#0e8fa6', '#55657a', '#5d8a14', '#d9611e'];
const NOTE_COLORS = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff', '#fed7aa'];
const TYPES = ['INT','BIGINT','SMALLINT','TINYINT','MEDIUMINT','DECIMAL(10,2)','FLOAT','DOUBLE','BIT(1)','BOOLEAN','CHAR(36)','VARCHAR(255)','TINYTEXT','TEXT','MEDIUMTEXT','LONGTEXT','BINARY(16)','VARBINARY(255)','BLOB','LONGBLOB','DATE','TIME','DATETIME','TIMESTAMP','YEAR','JSON',"ENUM('a','b')","SET('a','b')",'GEOMETRY','POINT'];
const ACTIONS = ['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION', 'SET DEFAULT'];

/* Each symbol is drawn in local coordinates: x grows away from the table edge. */
const CARDS = {
  'exactly-one': { name: 'Exactly one', uml: '1',    g: '<path d="M9 -8V8M15 -8V8"/>' },
  'zero-one':    { name: 'Zero or one', uml: '0..1', g: '<path d="M9 -8V8"/><circle class="gf" cx="19" cy="0" r="5"/>' },
  'one':         { name: 'One',         uml: '1',    g: '<path d="M12 -8V8"/>' },
  'many':        { name: 'Many',        uml: '*',    g: '<path d="M0 -9L14 0L0 9"/>' },
  'one-many':    { name: 'One or many', uml: '1..*', g: '<path d="M0 -9L14 0L0 9M19 -8V8"/>' },
  'zero-many':   { name: 'Zero or many',uml: '0..*', g: '<path d="M0 -9L14 0L0 9"/><circle class="gf" cx="24" cy="0" r="5"/>' }
};
const CARD_ORDER = ['exactly-one', 'zero-one', 'one', 'many', 'one-many', 'zero-many'];
const isMany = k => k === 'many' || k === 'one-many' || k === 'zero-many';
const cardIcon = k => `<svg class="gl" viewBox="-6 -13 62 26" width="62" height="26" aria-hidden="true"><path d="M0 0H56"/>${CARDS[k].g}<path d="M0 -11V11" style="stroke-width:3"/></svg>`;

/* =====================================================================
   State
   ===================================================================== */
let S;                                   // the diagram (undoable)
let view = { x: 60, y: 50, z: 1 };        // pan / zoom (not undoable)
let SEL = { type: null, id: null, col: null };
let hist = [], hi = -1;
let editing = false, drag = null, spaceDown = false, modal = null, pop = null;
let lastClose = { anchor: null, t: 0 };
let prefs = { wheel: 'zoom', panel: true, theme: null };

const vp = $('#viewport'), world = $('#world'), linksEl = $('#links'), nodesEl = $('#nodes'), tablesEl = $('#tables'), overlayEl = $('#overlay'), insp = $('#inspector');

const T = id => S.tables.find(t => t.id === id);
const getRel = id => S.rels.find(r => r.id === id);
const getNote = id => S.notes.find(n => n.id === id);
const ENT_H = 46;
const getNode = id => S.rnodes.find(n => n.id === id);
const own = id => T(id) || getNode(id);
const isOv = () => S.attrView === 'ovals';
const HH = () => isOv() ? ENT_H : HEAD_H;
const tH = t => isOv() ? ENT_H : HEAD_H + t.cols.length * ROW_H + FOOT_H;
const rowY = (t, i) => isOv() ? t.y + ENT_H / 2 : t.y + HEAD_H + i * ROW_H + ROW_H / 2;
const snapV = v => S.snap ? Math.round(v / 10) * 10 : v;
const normType = s => String(s).replace(/^[a-z]+/i, m => m.toUpperCase());
const uniqueName = (arr, base) => { let n = base, i = 2; const has = x => arr.some(a => a.name.toLowerCase() === x.toLowerCase()); while (has(n)) n = base + '_' + i++; return n; };
const singular = n => {
  n = String(n).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  if (/ies$/.test(n)) return n.replace(/ies$/, 'y');
  if (/(ss|us|is)$/.test(n)) return n;
  if (/(sses|xes|ches|shes|zes)$/.test(n)) return n.replace(/es$/, '');
  if (/s$/.test(n)) return n.replace(/s$/, '');
  return n;
};
function fkCols(tid) { const s = new Set(); S.rels.forEach(r => { if (r.from.t === tid) s.add(r.from.c); }); return s; }

function mkCol(name, type, flags = '', def = '', comment = '') {
  const f = flags.split(' ');
  return { id: uid('c_'), name, type, pk: f.includes('pk'), nn: f.includes('nn') || f.includes('pk'), uq: f.includes('uq'), ai: f.includes('ai'), un: f.includes('un'), def, comment, kind: 'simple', expr: '', pkp: false, parts: [], ox: null, oy: null };
}
function mkTable(name, x, y, color, cols, comment = '') {
  return { id: uid('t_'), name, x, y, w: 260, color, comment, engine: 'InnoDB', charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci', cols: cols.map(c => mkCol(...c)) };
}
function defaultCards(cc) {
  const pkCount = 1;
  return { fc: (cc.uq || (cc.pk && pkCount === 1)) ? 'zero-one' : 'zero-many', tc: (cc.nn || cc.pk) ? 'exactly-one' : 'zero-one' };
}
function mkRel(from, to, fc, tc, extra = {}) {
  return Object.assign({ id: uid('r_'), from, to, fc, tc, label: '', style: '', dashed: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE', fs: '', ts: '', bend: null, shape: 'diamond' }, extra);
}
const col = (t, name) => t.cols.find(c => c.name === name);

function sampleDiagram() {
  const users = mkTable('users', 60, 60, COLORS[0], [
    ['id', 'INT', 'pk ai un'], ['email', 'VARCHAR(190)', 'nn uq'], ['display_name', 'VARCHAR(120)', 'nn'],
    ['password_hash', 'CHAR(60)', 'nn'], ['created_at', 'TIMESTAMP', 'nn', 'CURRENT_TIMESTAMP']]);
  const profiles = mkTable('user_profiles', 60, 340, COLORS[4], [
    ['user_id', 'INT', 'pk un'], ['bio', 'TEXT', ''], ['avatar_url', 'VARCHAR(255)', '']]);
  const orders = mkTable('orders', 440, 60, COLORS[1], [
    ['id', 'INT', 'pk ai un'], ['user_id', 'INT', 'nn un'], ['status', "ENUM('pending','paid','shipped','cancelled')", 'nn', 'pending'],
    ['total', 'DECIMAL(10,2)', 'nn'], ['placed_at', 'DATETIME', '']]);
  const items = mkTable('order_items', 440, 350, COLORS[2], [
    ['order_id', 'INT', 'pk un'], ['product_id', 'INT', 'pk un'], ['quantity', 'INT', 'nn un', '1'], ['unit_price', 'DECIMAL(10,2)', 'nn']]);
  const cats = mkTable('categories', 820, 60, COLORS[5], [
    ['id', 'INT', 'pk ai un'], ['parent_id', 'INT', 'un'], ['name', 'VARCHAR(120)', 'nn']]);
  const prods = mkTable('products', 820, 290, COLORS[6], [
    ['id', 'INT', 'pk ai un'], ['category_id', 'INT', 'un'], ['sku', 'VARCHAR(40)', 'nn uq'], ['title', 'VARCHAR(200)', 'nn'],
    ['price', 'DECIMAL(10,2)', 'nn'], ['stock', 'INT', 'nn un', '0']]);
  const rels = [
    mkRel({ t: orders.id, c: col(orders, 'user_id').id }, { t: users.id, c: col(users, 'id').id }, 'zero-many', 'exactly-one', { label: 'places', onDelete: 'RESTRICT' }),
    mkRel({ t: profiles.id, c: col(profiles, 'user_id').id }, { t: users.id, c: col(users, 'id').id }, 'zero-one', 'exactly-one', { onDelete: 'CASCADE' }),
    mkRel({ t: items.id, c: col(items, 'order_id').id }, { t: orders.id, c: col(orders, 'id').id }, 'zero-many', 'exactly-one', { onDelete: 'CASCADE' }),
    mkRel({ t: items.id, c: col(items, 'product_id').id }, { t: prods.id, c: col(prods, 'id').id }, 'zero-many', 'exactly-one', { label: 'contains' }),
    mkRel({ t: prods.id, c: col(prods, 'category_id').id }, { t: cats.id, c: col(cats, 'id').id }, 'zero-many', 'zero-one', { onDelete: 'SET NULL' }),
    mkRel({ t: cats.id, c: col(cats, 'parent_id').id }, { t: cats.id, c: col(cats, 'id').id }, 'zero-many', 'zero-one', { label: 'parent of', onDelete: 'SET NULL' })
  ];
  const notes = [{ id: uid('n_'), x: 60, y: 540, w: 270, h: 96, color: NOTE_COLORS[0], text: 'Double-click any name, type or line to edit it. Drag a dot from one column onto another to connect them.' }];
  return { name: 'Shop schema', notation: 'crow', lineStyle: 'curved', grid: true, snap: true, showTypes: true, tables: [users, profiles, orders, items, cats, prods], rels, notes };
}

const KINDS = ['simple', 'multi', 'derived', 'composite'];
function normCol(c) {
  return { id: c.id || uid('c_'), name: String(c.name || 'column'), type: String(c.type || 'INT'), pk: !!c.pk, nn: !!c.nn || !!c.pk || !!c.pkp, uq: !!c.uq, ai: !!c.ai, un: !!c.un, def: c.def == null ? '' : String(c.def), comment: c.comment || '', check: c.check || '',
    kind: KINDS.includes(c.kind) ? c.kind : 'simple', expr: c.expr || '', pkp: !!c.pkp,
    parts: Array.isArray(c.parts) ? c.parts.map(p => ({ id: p.id || uid('p_'), name: String(p.name || 'part'), type: String(p.type || 'VARCHAR(100)') })) : [],
    ox: c.ox != null && isFinite(+c.ox) ? +c.ox : null, oy: c.oy != null && isFinite(+c.oy) ? +c.oy : null };
}
function normalize(o) {
  const LS = ['curved', 'orthogonal', 'straight'];
  const s = { name: o.name || 'Untitled diagram', notation: ['uml', 'chen'].includes(o.notation) ? o.notation : 'crow', lineStyle: LS.includes(o.lineStyle) ? o.lineStyle : 'curved', grid: o.grid !== false, snap: o.snap !== false, showTypes: o.showTypes !== false, tables: [], rels: [], notes: [], rnodes: [], attrView: o.attrView === 'ovals' ? 'ovals' : 'rows', hideFk: o.hideFk !== false };
  (o.tables || []).forEach(t => s.tables.push({
    id: t.id || uid('t_'), name: String(t.name || 'table'), x: +t.x || 0, y: +t.y || 0, w: clamp(+t.w || 260, MIN_W, 900),
    color: t.color || COLORS[0], comment: t.comment || '', weak: !!t.weak, engine: t.engine || 'InnoDB', charset: t.charset || 'utf8mb4', collation: t.collation || 'utf8mb4_unicode_ci',
    cols: (t.cols || []).map(normCol)
  }));
  (o.rels || []).forEach(r => {
    if (!r || !r.from || !r.to) return;
    const A = s.tables.find(t => t.id === r.from.t), B = s.tables.find(t => t.id === r.to.t);
    if (!A || !B || !A.cols.some(c => c.id === r.from.c) || !B.cols.some(c => c.id === r.to.c)) return;
    s.rels.push({ id: r.id || uid('r_'), from: { t: r.from.t, c: r.from.c }, to: { t: r.to.t, c: r.to.c }, fc: CARDS[r.fc] ? r.fc : 'zero-many', tc: CARDS[r.tc] ? r.tc : 'exactly-one', label: r.label || '', style: LS.includes(r.style) ? r.style : '', dashed: !!r.dashed, onDelete: ACTIONS.includes(r.onDelete) ? r.onDelete : 'RESTRICT', onUpdate: ACTIONS.includes(r.onUpdate) ? r.onUpdate : 'CASCADE', fs: r.fs === 'l' || r.fs === 'r' ? r.fs : '', ts: r.ts === 'l' || r.ts === 'r' ? r.ts : '', bend: r.bend && isFinite(r.bend.x) && isFinite(r.bend.y) ? { x: +r.bend.x, y: +r.bend.y } : null, shape: ['diamond', 'double', 'triangle'].includes(r.shape) ? r.shape : 'diamond' });
  });
  (o.notes || []).forEach(n => s.notes.push({ id: n.id || uid('n_'), x: +n.x || 0, y: +n.y || 0, w: clamp(+n.w || 200, 120, 700), h: clamp(+n.h || 100, 60, 600), text: String(n.text || ''), color: n.color || NOTE_COLORS[0] }));
  (o.rnodes || []).forEach(n => s.rnodes.push({
    id: n.id || uid('g_'), x: +n.x || 0, y: +n.y || 0, name: String(n.name == null ? '' : n.name), kind: n.kind === 'isa' ? 'isa' : 'rel',
    shape: ['diamond', 'double', 'triangle'].includes(n.shape) ? n.shape : 'diamond', assoc: !!n.assoc, agg: !!n.agg, dc: n.dc === 'o' ? 'o' : 'd', total: !!n.total,
    ends: (n.ends || []).filter(e => e && s.tables.some(t => t.id === e.t)).map(e => ({ t: e.t, agg: e.agg || '', card: CARDS[e.card] ? e.card : 'zero-many', role: String(e.role || '') })),
    cols: (n.cols || []).map(normCol)
  }));
  return s;
}

/* =====================================================================
   History + persistence
   ===================================================================== */
let saveT = null;
function scheduleSave() {
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify({ S, view })); } catch (e) {} }, 300);
}
function savePrefs() { try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch (e) {} }
function commit() {
  const s = JSON.stringify(S);
  if (s !== hist[hi]) {
    hist = hist.slice(0, hi + 1); hist.push(s);
    if (hist.length > 120) hist.shift();
    hi = hist.length - 1;
  }
  scheduleSave(); updateUndo();
}
function loadSnapshot(s) {
  S = JSON.parse(s);
  if (SEL.type === 'table' && !T(SEL.id)) SEL = { type: null, id: null, col: null };
  if (SEL.type === 'rel' && !getRel(SEL.id)) SEL = { type: null, id: null, col: null };
  if (SEL.type === 'note' && !getNote(SEL.id)) SEL = { type: null, id: null, col: null };
  closePop(); render(); updateUndo(); scheduleSave();
}
function undo() { if (hi > 0) { hi--; loadSnapshot(hist[hi]); } }
function redo() { if (hi < hist.length - 1) { hi++; loadSnapshot(hist[hi]); } }
function updateUndo() { $('#btnUndo').disabled = hi <= 0; $('#btnRedo').disabled = hi >= hist.length - 1; }

/* =====================================================================
   Geometry: where relationship lines start, end and how they travel
   ===================================================================== */
function relEnds(r) {
  const a = T(r.from.t), b = T(r.to.t); if (!a || !b) return null;
  const ia = a.cols.findIndex(c => c.id === r.from.c), ib = b.cols.findIndex(c => c.id === r.to.c);
  if (ia < 0 || ib < 0) return null;
  let s1 = 'r', s2 = 'r';
  if (a !== b) {
    if (a.x + a.w + 56 <= b.x) { s1 = 'r'; s2 = 'l'; }
    else if (b.x + b.w + 56 <= a.x) { s1 = 'l'; s2 = 'r'; }
  }
  if (r.fs) s1 = r.fs;
  if (r.ts) s2 = r.ts;
  const p1 = { x: s1 === 'r' ? a.x + a.w : a.x, y: rowY(a, ia) };
  const p2 = { x: s2 === 'r' ? b.x + b.w : b.x, y: rowY(b, ib) };
  return { a, b, p1, p2, s1, s2 };
}
function rounded(pts, r) {
  const P = pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);
  if (P.length < 3) return 'M' + P.map(p => p.x + ' ' + p.y).join('L');
  let d = `M${P[0].x} ${P[0].y}`;
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i - 1], b = P[i], c = P[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    d += `L${b.x + (a.x - b.x) / l1 * rr} ${b.y + (a.y - b.y) / l1 * rr}Q${b.x} ${b.y} ${b.x + (c.x - b.x) / l2 * rr} ${b.y + (c.y - b.y) / l2 * rr}`;
  }
  const L = P[P.length - 1];
  return d + `L${L.x} ${L.y}`;
}
const unit = (x, y) => { const L = Math.hypot(x, y) || 1; return { x: x / L, y: y / L }; };
function pathLen(d) {
  try { const mp = $('#mp'); mp.setAttribute('d', d); const L = mp.getTotalLength(); return isFinite(L) ? L : 0; } catch (e) { return 0; }
}
function clampVx(v, e) {
  const lim = (x, p, s) => s === 'r' ? Math.max(x, p.x + 24) : Math.min(x, p.x - 24);
  return lim(lim(v, e.p1, e.s1), e.p2, e.s2);
}
/* The path of one relationship. `m0` is the natural middle of the line, `bend` is the user's offset from it. */
function linkGeom(r) {
  const e = relEnds(r); if (!e) return null;
  let style = r.style || S.lineStyle;
  const { p1, p2, s1, s2 } = e, d1 = s1 === 'r' ? 1 : -1, d2 = s2 === 'r' ? 1 : -1;
  if (style === 'straight' && s1 === s2) style = 'orthogonal';
  const has = !!r.bend, bend = r.bend || { x: 0, y: 0 };
  let d, u1, u2, mid, m0, len1 = 0;
  if (style === 'orthogonal') {
    u1 = { x: d1, y: 0 }; u2 = { x: d2, y: 0 };
    const bx = s1 !== s2 ? (p1.x + p2.x) / 2 : (d1 === 1 ? Math.max(p1.x, p2.x) + 40 : Math.min(p1.x, p2.x) - 40);
    m0 = { x: bx, y: (p1.y + p2.y) / 2 };
    const vx = has ? clampVx(bx + bend.x, e) : bx;
    d = rounded([p1, { x: vx, y: p1.y }, { x: vx, y: p2.y }, p2], 10);
    mid = { x: vx, y: m0.y }; len1 = Math.abs(vx - p1.x) + Math.abs(m0.y - p1.y);
  } else if (style === 'straight') {
    m0 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const W = { x: m0.x + bend.x, y: m0.y + bend.y };
    u1 = unit(W.x - p1.x, W.y - p1.y); u2 = unit(W.x - p2.x, W.y - p2.y);
    d = has ? `M${p1.x} ${p1.y}L${W.x} ${W.y}L${p2.x} ${p2.y}` : `M${p1.x} ${p1.y}L${p2.x} ${p2.y}`;
    mid = W; len1 = has ? Math.hypot(W.x - p1.x, W.y - p1.y) : 0;
  } else {
    u1 = { x: d1, y: 0 }; u2 = { x: d2, y: 0 };
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const k = s1 === s2 ? clamp(dist * 0.4 + 64, 76, 160) : clamp(dist * 0.5, 56, 180);
    m0 = { x: (p1.x + p2.x) / 2 + 0.375 * k * (d1 + d2), y: (p1.y + p2.y) / 2 };
    if (!has) {
      d = `M${p1.x} ${p1.y}C${p1.x + d1 * k} ${p1.y} ${p2.x + d2 * k} ${p2.y} ${p2.x} ${p2.y}`; mid = m0;
    } else {
      const W = { x: m0.x + bend.x, y: m0.y + bend.y };
      const vert = s1 === s2, tx = vert ? 0 : ((p2.x >= p1.x) ? 1 : -1), ty = vert ? ((p2.y >= p1.y) ? 1 : -1) : 0;
      const k1 = clamp(Math.hypot(W.x - p1.x, W.y - p1.y) / 2, 34, 140), k2 = clamp(Math.hypot(W.x - p2.x, W.y - p2.y) / 2, 34, 140);
      const a1 = `M${p1.x} ${p1.y}C${p1.x + d1 * k1} ${p1.y} ${W.x - tx * k1} ${W.y - ty * k1} ${W.x} ${W.y}`;
      d = a1 + `C${W.x + tx * k2} ${W.y + ty * k2} ${p2.x + d2 * k2} ${p2.y} ${p2.x} ${p2.y}`;
      mid = W; len1 = pathLen(a1);
    }
  }
  return { d, p1, p2, u1, u2, e, mid, m0, len1, style };
}
function glyph(card, p, u) {
  const ang = Math.atan2(u.y, u.x) * 180 / Math.PI;
  return `<g class="gl" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})">${CARDS[card].g}</g>`;
}
function textMark(txt, p, u) {
  return `<text class="mult" x="${(p.x + u.x * 22).toFixed(1)}" y="${(p.y + u.y * 22 - 8).toFixed(1)}" text-anchor="middle">${esc(txt)}</text>`;
}
function chenText(card, isTo, both) {
  const N = both && isTo ? 'M' : 'N';
  return { 'exactly-one': '1', 'one': '1', 'zero-one': '0,1', 'many': N, 'one-many': '1,' + N, 'zero-many': '0,' + N }[card];
}
function endMark(r, isTo, g) {
  const card = isTo ? r.tc : r.fc, p = isTo ? g.p2 : g.p1, u = isTo ? g.u2 : g.u1;
  if (S.notation === 'crow') return glyph(card, p, u);
  if (S.notation === 'chen') return textMark(chenText(card, isTo, isMany(r.fc) && isMany(r.tc)), p, u);
  return textMark(CARDS[card].uml, p, u);
}
const LBL_FONT = '500 11.5px "Schibsted Grotesk", system-ui, sans-serif';
function chenShapeHTML(r, g) {
  const m = g.mid, txt = r.label || (r.shape === 'triangle' ? 'ISA' : 'has'), tw = textW(txt, LBL_FONT);
  const f = n => n.toFixed(1);
  let inner;
  if (r.shape === 'triangle') {
    const w = Math.max(70, tw + 38), h = 52;
    inner = `<polygon points="${f(m.x)},${f(m.y - h / 2)} ${f(m.x + w / 2)},${f(m.y + h / 2)} ${f(m.x - w / 2)},${f(m.y + h / 2)}"/><text x="${f(m.x)}" y="${f(m.y + 14)}" text-anchor="middle">${esc(txt)}</text>`;
  } else {
    const w = Math.max(78, tw + 46), h = 46, dia = (w2, h2) => `<polygon points="${f(m.x)},${f(m.y - h2 / 2)} ${f(m.x + w2 / 2)},${f(m.y)} ${f(m.x)},${f(m.y + h2 / 2)} ${f(m.x - w2 / 2)},${f(m.y)}"/>`;
    inner = dia(w, h) + (r.shape === 'double' ? dia(w - 16, h - 10) : '') + `<text x="${f(m.x)}" y="${f(m.y + 4)}" text-anchor="middle">${esc(txt)}</text>`;
  }
  return `<g class="rel-label chen-shape" data-rl="${r.id}">${inner}</g>`;
}
/* Everything drawn for one relationship except the invisible hit area. Shared by the canvas and the image export. */
function relInner(r, g) {
  const chen = S.notation === 'chen';
  let h = `<path class="link${r.dashed ? ' dash' : ''}" d="${g.d}"/>`;
  if (chen) {
    const L = pathLen(g.d);
    if (L > 0) {
      const a = g.len1 > 0 ? Math.min(g.len1, L) : L / 2, mand = k => k === 'exactly-one' || k === 'one-many';
      const dd = da => `<path class="link2" d="${g.d}" stroke-dasharray="${da}"/><path class="link2i" d="${g.d}" stroke-dasharray="${da}"/>`;
      if (mand(r.tc)) h += dd(`${a.toFixed(1)} ${(L * 2).toFixed(1)}`);
      if (mand(r.fc)) h += dd(`0 ${a.toFixed(1)} ${L.toFixed(1)} ${L.toFixed(1)}`);
    }
  }
  h += endMark(r, false, g) + endMark(r, true, g);
  if (chen) h += chenShapeHTML(r, g);
  else if (r.label) {
    const m = g.mid, w = textW(r.label, LBL_FONT) + 16;
    h += `<g class="rel-label" data-rl="${r.id}"><rect x="${(m.x - w / 2).toFixed(1)}" y="${(m.y - 10).toFixed(1)}" width="${w.toFixed(1)}" height="20" rx="6"/><text x="${m.x.toFixed(1)}" y="${(m.y + 4).toFixed(1)}" text-anchor="middle">${esc(r.label)}</text></g>`;
  }
  return h;
}
const cvs = document.createElement('canvas'); let cctx = null; try { cctx = cvs.getContext('2d'); } catch (e) {}
function textW(str, font) { try { if (cctx) { cctx.font = font; return cctx.measureText(str).width; } } catch (e) {} return String(str).length * 6.6; }

/* =====================================================================
   Rendering
   ===================================================================== */
function entHTML(t) {
  const hp = side => `<span class="port port-${side}" data-port="head" data-side="${side}" data-t="${t.id}"></span>`;
  return `<div class="tbl ent${t.weak ? ' weak' : ''}" data-t="${t.id}" style="left:${t.x}px;top:${t.y}px;width:${t.w}px">
    <div class="tbl-h" data-t="${t.id}" style="background:${esc(t.color)}" title="${esc(t.comment || '')}">${hp('l')}
      <button class="dot" data-act="color" title="Change colour" aria-label="Change colour"></button>
      <span class="tbl-name" data-edit="tname">${esc(t.name)}</span>
      <span class="hact"><button data-act="addcol" title="Add attribute" aria-label="Add attribute">${ICON.plus(14)}</button><button data-act="deltbl" title="Delete entity" aria-label="Delete entity">${ICON.trash(14)}</button></span>${hp('r')}
    </div><div class="rsz" data-rsz="table" title="Drag to resize">${ICON.resize()}</div></div>`;
}
function tableHTML(t) {
  if (isOv()) return entHTML(t);
  const fks = fkCols(t.id);
  const rows = t.cols.map(c => {
    const fk = fks.has(c.id);
    const kchip = { multi: 'MV', derived: 'DRV', composite: 'CMP' }[c.kind || 'simple'] || '';
    const flags = [kchip, c.pkp ? 'PKP' : '', c.uq && !c.pk ? 'UQ' : '', c.ai ? 'AI' : '', c.un ? 'UN' : '', c.nn && !c.pk ? 'NN' : ''].filter(Boolean).map(f => `<i class="chip">${f}</i>`).join('');
    const ports = side => `<span class="port port-${side}" data-port="row" data-side="${side}" data-t="${t.id}" data-c="${c.id}"></span>`;
    return `<div class="row" data-t="${t.id}" data-c="${c.id}">${ports('l')}
      <span class="grip" data-grip="1" title="Drag to reorder">${ICON.grip(11)}</span>
      <span class="kb" data-act="pk" title="Toggle primary key"><span class="${c.pk ? 'k-pk' : 'k-off'}">${ICON.key(13)}</span>${fk ? '<i class="chip fkc">FK</i>' : ''}</span>
      <span class="cname${c.pk ? ' pk' : ''}${c.pkp ? ' pkp' : ''}${c.kind === 'derived' ? ' drv' : ''}" data-edit="cname">${esc(c.name)}</span>
      ${S.showTypes ? `<span class="ctype" data-edit="ctype">${esc(c.type)}</span>` : ''}
      <span class="flags">${flags}</span>${ports('r')}</div>`;
  }).join('');
  const hp = side => `<span class="port port-${side}" data-port="head" data-side="${side}" data-t="${t.id}"></span>`;
  return `<div class="tbl${t.weak ? ' weak' : ''}" data-t="${t.id}" style="left:${t.x}px;top:${t.y}px;width:${t.w}px">
    <div class="tbl-h" data-t="${t.id}" style="background:${esc(t.color)}" title="${esc(t.comment || '')}">${hp('l')}
      <button class="dot" data-act="color" title="Change colour" aria-label="Change colour"></button>
      <span class="tbl-name" data-edit="tname">${esc(t.name)}</span>
      <span class="hact"><button data-act="addcol" title="Add column" aria-label="Add column">${ICON.plus(14)}</button><button data-act="deltbl" title="Delete table" aria-label="Delete table">${ICON.trash(14)}</button></span>${hp('r')}
    </div>${rows}
    <div class="tbl-f" data-act="addcol">${ICON.plus(12)} Add column</div>
    <div class="rsz" data-rsz="table" title="Drag to resize">${ICON.resize()}</div>
  </div>`;
}
function noteHTML(n) {
  return `<div class="note" data-n="${n.id}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px;background:${esc(n.color)}">
    <div class="note-t" data-edit="note">${esc(n.text)}</div><div class="rsz" data-rsz="note">${ICON.resize()}</div></div>`;
}
const OVAL_FONT = '500 11.5px "JetBrains Mono", ui-monospace, monospace';
const f1 = n => n.toFixed(1);
const CARD_LETTERS = ['N', 'M', 'P', 'Q', 'R', 'S'];
function nodeSize(n) {
  const txt = n.name || (n.kind === 'isa' ? 'ISA' : 'has'), tw = textW(txt, LBL_FONT);
  if (n.shape === 'triangle') return { w: Math.max(84, tw + 48), h: 62 };
  let w = Math.max(92, tw + 56), h = 54;
  if (n.assoc) { w += 22; h += 14; }
  return { w, h };
}
function nodeEdge(n, sz, q) {
  const dx = q.x - n.x, dy = q.y - n.y; if (!dx && !dy) return { x: n.x, y: n.y };
  const t = (n.assoc || n.shape === 'triangle') ? 1 / Math.max(Math.abs(dx) / (sz.w / 2), Math.abs(dy) / (sz.h / 2)) : 1 / (Math.abs(dx) / (sz.w / 2) + Math.abs(dy) / (sz.h / 2));
  return { x: n.x + dx * t, y: n.y + dy * t };
}
function entAnchor(t, from) {
  const hh = HH(), h = tH(t);
  const c = [{ x: t.x, y: t.y + hh / 2 }, { x: t.x + t.w, y: t.y + hh / 2 }, { x: t.x + t.w / 2, y: t.y }, { x: t.x + t.w / 2, y: t.y + h }];
  return c.reduce((b, p) => Math.hypot(p.x - from.x, p.y - from.y) < Math.hypot(b.x - from.x, b.y - from.y) ? p : b);
}
function chenTextN(card, letter) { return { 'exactly-one': '1', 'one': '1', 'zero-one': '0,1', 'many': letter, 'one-many': '1,' + letter, 'zero-many': '0,' + letter }[card]; }
/* Positions of every attribute oval (entities in oval view, and relationship nodes). Shared by drawing, hit tests and bounds. */
function nodeGeo() {
  const G = { ovals: [], extents: [] }, ext = (x, y, w, h) => G.extents.push({ x1: x - w / 2 - 12, y1: y - h / 2 - 12, x2: x + w / 2 + 12, y2: y + h / 2 + 12 });
  const addOvals = (o, isEnt, cx, cy, hw, hh) => {
    const fk = isEnt ? fkCols(o.id) : null;
    const list = isEnt ? o.cols.filter(c => !(S.hideFk && fk.has(c.id))) : o.cols, n = list.length;
    list.forEach((c, i) => {
      let x, y;
      if (c.ox != null && c.oy != null && isFinite(c.ox) && isFinite(c.oy)) { x = cx + c.ox; y = cy + c.oy; }
      else { const th = -Math.PI / 2 + i * 2 * Math.PI / Math.max(n, 1), rx = hw + 90 + Math.max(0, n - 6) * 8, ry = hh + 64 + Math.max(0, n - 6) * 8; x = cx + Math.cos(th) * rx; y = cy + Math.sin(th) * ry; }
      const w = Math.max(58, textW(c.name, OVAL_FONT) + 28), h = 30, parts = [];
      if (c.kind === 'composite' && c.parts && c.parts.length) {
        const base = Math.atan2(y - cy, x - cx), m = c.parts.length;
        c.parts.forEach((p, j) => { const a = base + (j - (m - 1) / 2) * 0.66, pw = Math.max(50, textW(p.name, OVAL_FONT) + 24), d = w / 2 + pw / 2 + 36; parts.push({ p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, w: pw, h: 26 }); ext(x + Math.cos(a) * d, y + Math.sin(a) * d, pw, 26); });
      }
      G.ovals.push({ o, c, ownerId: o.id, cx, cy, x, y, w, h, parts }); ext(x, y, w + 8, h + 8);
    });
  };
  if (isOv()) S.tables.forEach(t => addOvals(t, true, t.x + t.w / 2, t.y + ENT_H / 2, t.w / 2, ENT_H / 2));
  S.rnodes.forEach(n => { const sz = nodeSize(n); addOvals(n, false, n.x, n.y, sz.w / 2, sz.h / 2); ext(n.x, n.y, sz.w, sz.h + 20); });
  return G;
}
function ovalMarkup(it) {
  const { c, x, y, w, h } = it, k = c.kind || 'simple', sel = SEL.col === c.id && (SEL.id === it.ownerId);
  let s = `<g class="oval${sel ? ' sel' : ''}" data-o="${it.ownerId}" data-c="${c.id}">`;
  if (k === 'multi') s += `<ellipse class="oshape" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(w / 2 + 5)}" ry="${f1(h / 2 + 5)}"/>`;
  s += `<ellipse class="oshape${k === 'derived' ? ' dashed' : ''}" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(w / 2)}" ry="${f1(h / 2)}"/><text x="${f1(x)}" y="${f1(y + 4)}" text-anchor="middle">${esc(c.name)}</text>`;
  if (c.pk || c.pkp) { const tw = textW(c.name, OVAL_FONT); s += `<line class="ul${c.pk ? '' : ' dashed'}" x1="${f1(x - tw / 2)}" x2="${f1(x + tw / 2)}" y1="${f1(y + 8)}" y2="${f1(y + 8)}"/>`; }
  s += '</g>';
  for (const pt of it.parts) s += `<g class="opart"><ellipse class="oshape" cx="${f1(pt.x)}" cy="${f1(pt.y)}" rx="${f1(pt.w / 2)}" ry="${f1(pt.h / 2)}"/><text x="${f1(pt.x)}" y="${f1(pt.y + 4)}" text-anchor="middle">${esc(pt.p.name)}</text></g>`;
  return s;
}
function rnodeShape(n, sz, sel) {
  const isa = n.kind === 'isa', txt = n.name || (isa ? 'ISA' : 'has'), cx = n.x, cy = n.y;
  const dw = n.assoc ? sz.w - 22 : sz.w, dh = n.assoc ? sz.h - 14 : sz.h;
  let s = `<g class="rn${sel ? ' sel' : ''}" data-n="${n.id}">`;
  if (n.assoc) s += `<rect class="rshape" x="${f1(cx - sz.w / 2)}" y="${f1(cy - sz.h / 2)}" width="${f1(sz.w)}" height="${f1(sz.h)}"/>`;
  const dia = (w, h) => `<polygon class="rshape" points="${f1(cx)},${f1(cy - h / 2)} ${f1(cx + w / 2)},${f1(cy)} ${f1(cx)},${f1(cy + h / 2)} ${f1(cx - w / 2)},${f1(cy)}"/>`;
  if (n.shape === 'triangle') s += `<polygon class="rshape" points="${f1(cx)},${f1(cy - sz.h / 2)} ${f1(cx + sz.w / 2)},${f1(cy + sz.h / 2)} ${f1(cx - sz.w / 2)},${f1(cy + sz.h / 2)}"/><text x="${f1(cx)}" y="${f1(cy + 14)}" text-anchor="middle">${esc(txt)}</text>`;
  else { s += dia(dw, dh); if (n.shape === 'double') s += dia(dw - 16, dh - 10); s += `<text x="${f1(cx)}" y="${f1(cy + 4)}" text-anchor="middle">${esc(txt)}</text>`; }
  if (isa) s += `<text class="mult" x="${f1(cx)}" y="${f1(cy + sz.h / 2 + 14)}" text-anchor="middle">${n.dc === 'o' ? 'o' : 'd'}</text>`;
  const lx = cx - sz.w / 2, rx = cx + sz.w / 2;
  s += `<circle class="rport" data-n="${n.id}" data-px="${f1(lx)}" data-py="${f1(cy)}" data-dir="-1" cx="${f1(lx)}" cy="${f1(cy)}" r="6"><title>Drag to a table to add a participant</title></circle><circle class="rport" data-n="${n.id}" data-px="${f1(rx)}" data-py="${f1(cy)}" data-dir="1" cx="${f1(rx)}" cy="${f1(cy)}" r="6"><title>Drag to a table to add a participant</title></circle></g>`;
  return s;
}
function nodesMarkup() {
  const G = nodeGeo(); let lines = '', shapes = '';
  for (const it of G.ovals) {
    lines += `<line class="alink" x1="${f1(it.cx)}" y1="${f1(it.cy)}" x2="${f1(it.x)}" y2="${f1(it.y)}"/>`;
    for (const pt of it.parts) lines += `<line class="alink" x1="${f1(it.x)}" y1="${f1(it.y)}" x2="${f1(pt.x)}" y2="${f1(pt.y)}"/>`;
    shapes += ovalMarkup(it);
  }
  for (const n of S.rnodes) {
    const sz = nodeSize(n), isa = n.kind === 'isa', sel = SEL.type === 'rnode' && SEL.id === n.id; let many = 0;
    for (const e of n.ends) {
      const t = T(e.t); if (!t) continue;
      const p = (e.agg && window.__aggEdge && window.__aggEdge(e.agg, n)) || entAnchor(t, n), q = nodeEdge(n, sz, p), dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const seg = cls => `<line class="${cls}" x1="${f1(p.x)}" y1="${f1(p.y)}" x2="${f1(q.x)}" y2="${f1(q.y)}"/>`;
      lines += seg('plink'); let mand, txt = '';
      if (isa) mand = !!n.total && e.role === 'super';
      else { mand = e.card === 'exactly-one' || e.card === 'one-many'; txt = chenTextN(e.card, isMany(e.card) ? CARD_LETTERS[many++ % CARD_LETTERS.length] : ''); }
      if (mand) lines += seg('plink2') + seg('plink2i');
      if (txt) lines += `<text class="mult" x="${f1(p.x + ux * 20 - uy * 11)}" y="${f1(p.y + uy * 20 + ux * 11)}" text-anchor="middle">${esc(txt)}</text>`;
      if (e.role && !isa) lines += `<text class="role" x="${f1((p.x + q.x) / 2 - uy * 12)}" y="${f1((p.y + q.y) / 2 + ux * 12)}" text-anchor="middle">${esc(e.role)}</text>`;
    }
    shapes += rnodeShape(n, sz, sel);
  }
  return lines + shapes;
}
function renderNodes() { nodesEl.innerHTML = nodesMarkup(); }
function nodeCSS(v) {
  return `.alink{stroke:${v.link};stroke-width:1.3;fill:none}.plink{stroke:${v.link};stroke-width:1.7;fill:none}.plink2{stroke:${v.link};stroke-width:5.6;fill:none}.plink2i{stroke:${v.bg};stroke-width:2;fill:none}`
    + `.oshape{fill:${v.tbl};stroke:${v.link};stroke-width:1.5}.oshape.dashed{stroke-dasharray:5 4}`
    + `.oval text,.opart text{font:500 11.5px ${v.mono};fill:${v.ink};pointer-events:none}`
    + `.ul{stroke:${v.ink};stroke-width:1.2}.ul.dashed{stroke-dasharray:3 2}`
    + `.rshape{fill:${v.tbl};stroke:${v.link};stroke-width:1.7;stroke-linejoin:round}`
    + `.rn text{font:600 12px ${v.ui};fill:${v.ink};pointer-events:none}.role{font:italic 500 11px ${v.ui};fill:${v.muted}}.opart{pointer-events:none}`;
}
function injectNodeCSS() {
  const st = document.createElement('style');
  st.textContent = nodeCSS({ link: 'var(--link)', bg: 'var(--bg)', tbl: 'var(--tbl)', ink: 'var(--ink)', muted: 'var(--muted)', mono: 'var(--mono)', ui: 'var(--ui)' });
  document.head.appendChild(st);
}
function setKind(c, k) {
  c.kind = k;
  if (k === 'composite' && !(c.parts || []).length) c.parts = [{ id: uid('p_'), name: 'part_1', type: 'VARCHAR(100)' }, { id: uid('p_'), name: 'part_2', type: 'VARCHAR(100)' }];
  if (k !== 'simple') { c.pk = false; c.pkp = false; c.uq = false; c.ai = false; }
}
function syncIsaKeys(n) {
  const sup = n.ends.find(e => e.role === 'super'), st = sup && T(sup.t); if (!st) return;
  const sp = st.cols.filter(c => c.pk && (c.kind || 'simple') === 'simple'); if (!sp.length) return;
  let added = 0;
  for (const e of n.ends) {
    if (e === sup) continue; const sub = T(e.t); if (!sub || sub.cols.some(c => c.pk)) continue;
    sp.forEach((p, i) => { sub.cols.splice(i, 0, { id: uid('c_'), name: uniqueName(sub.cols, p.name), type: p.type, pk: true, nn: true, uq: false, ai: false, un: p.un, def: '', comment: '', kind: 'simple', expr: '', pkp: false, parts: [], ox: null, oy: null }); added++; });
  }
  if (added) toast('Added the supertype key to each subtype.');
}
function addEnd(n, tid) {
  const t = T(tid); if (!n || !t) return;
  const isa = n.kind === 'isa';
  if (isa && n.ends.some(e => e.t === tid)) { toast('That table is already part of this ISA.'); return; }
  const k = n.ends.length;
  n.ends.push({ t: tid, card: isa ? 'exactly-one' : (k === 1 ? 'exactly-one' : 'zero-many'), role: isa ? (n.ends.some(e => e.role === 'super') ? 'sub' : 'super') : '' });
  if (isa) syncIsaKeys(n);
  SEL = { type: 'rnode', id: n.id, col: null }; render(); commit();
}
function addRnode(type, x, y) {
  const isa = type === 'isa';
  const n = { id: uid('g_'), x: snapV(x), y: snapV(y), name: isa ? 'ISA' : (type === 'assoc' ? 'enrolls' : 'has'), kind: isa ? 'isa' : 'rel', shape: 'diamond', assoc: type === 'assoc', dc: 'd', total: false, ends: [], cols: [] };
  S.rnodes.push(n); SEL = { type: 'rnode', id: n.id, col: null }; render(); commit();
  toast('Drag from the dot on the shape to a table to add participants.');
}
function deleteRnode(id) {
  const n = getNode(id); if (!n) return;
  S.rnodes = S.rnodes.filter(x => x.id !== id); if (SEL.id === id) SEL = { type: null, id: null, col: null };
  render(); commit(); toast('Relationship deleted.', 'Undo', undo);
}
function floatEdit(x, y, w, value, commitFn) {
  if (editing) return; editing = true;
  const inp = document.createElement('input'); inp.className = 'inl'; inp.value = value; inp.spellcheck = false;
  inp.style.cssText = `position:absolute;left:${x - w / 2}px;top:${y - 13}px;width:${w}px;height:26px;text-align:center;z-index:9;font:500 12px var(--ui)`;
  tablesEl.appendChild(inp); inp.focus(); inp.select();
  let cancelled = false;
  inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') { ev.preventDefault(); inp.blur(); } if (ev.key === 'Escape') { cancelled = true; inp.blur(); } });
  inp.addEventListener('pointerdown', ev => ev.stopPropagation());
  inp.addEventListener('blur', () => { editing = false; if (!cancelled) { commitFn(inp.value.trim()); commit(); } inp.remove(); render(); }, { once: true });
}
function editOval(oid, cid) {
  const it = nodeGeo().ovals.find(x => x.ownerId === oid && x.c.id === cid);
  if (!it) { toast('Hidden attributes can be edited in the inspector.'); return; }
  floatEdit(it.x, it.y, Math.max(120, it.w + 24), it.c.name, v => { if (v) it.c.name = v; });
}
function editRnodeName(id) { const n = getNode(id); if (n) floatEdit(n.x, n.y, 130, n.name, v => { n.name = v; }); }
function selectOval(el) { const o = own(el.dataset.o); if (o) select(T(o.id) ? 'table' : 'rnode', o.id, el.dataset.c); }
function startMoveOval(e, el) {
  const it = nodeGeo().ovals.find(x => x.ownerId === el.dataset.o && x.c.id === el.dataset.c); if (!it) return;
  const c = it.c, o0 = { x: it.x - it.cx, y: it.y - it.cy };
  beginDrag(e, { move: (ev, dx, dy) => { let ox = o0.x + dx / view.z, oy = o0.y + dy / view.z; if (S.snap && !ev.altKey) { ox = Math.round(ox / 5) * 5; oy = Math.round(oy / 5) * 5; } c.ox = ox; c.oy = oy; renderLinks(); }, up: (ev, moved) => { if (moved) commit(); } });
}
function startMoveRNode(e, nid) {
  const n = getNode(nid); if (!n) return; const o = { x: n.x, y: n.y };
  beginDrag(e, { move: (ev, dx, dy) => { let nx = o.x + dx / view.z, ny = o.y + dy / view.z; if (S.snap && !ev.altKey) { nx = Math.round(nx / 10) * 10; ny = Math.round(ny / 10) * 10; } n.x = nx; n.y = ny; renderLinks(); }, up: (ev, moved) => { if (moved) commit(); } });
}
function startConnectNode(e, port) {
  const nid = port.dataset.n, start = { x: +port.dataset.px, y: +port.dataset.py }, dir = +port.dataset.dir;
  select('rnode', nid); document.body.classList.add('connecting');
  beginDrag(e, {
    move: ev => { showPreview(start, dir, toWorld(ev)); markDrop(ev); },
    up: (ev, moved) => { document.body.classList.remove('connecting'); clearDrop(); const pv = $('#pv'); if (pv) pv.style.display = 'none'; if (!moved) return; const tg = resolveTarget(ev); if (tg && tg.t) addEnd(getNode(nid), tg.t); }
  });
}
function renderTables() {
  if (editing) return;
  tablesEl.innerHTML = S.tables.map(tableHTML).join('') + S.notes.map(noteHTML).join('');
  applySelection();
}
function renderLinks() {
  let h = '';
  for (const r of S.rels) {
    const g = linkGeom(r); if (!g) continue;
    const sel = SEL.type === 'rel' && SEL.id === r.id;
    h += `<g class="rel${sel ? ' sel' : ''}" data-r="${r.id}"><path class="link-hit" d="${g.d}"/>${relInner(r, g)}</g>`;
  }
  linksEl.innerHTML = h;
  renderNodes();
}
function renderOverlay() {
  let h = '';
  if (SEL.type === 'rel') {
    const r = getRel(SEL.id), g = r && linkGeom(r);
    if (g) {
      h += `<circle class="handle" data-end="from" cx="${g.p1.x}" cy="${g.p1.y}" r="6.5"><title>Drag to move this end to another column or side</title></circle><circle class="handle" data-end="to" cx="${g.p2.x}" cy="${g.p2.y}" r="6.5"><title>Drag to move this end to another column or side</title></circle>`;
      if (S.notation !== 'chen' && !r.label) h += `<rect class="wph" x="${g.mid.x - 5.5}" y="${g.mid.y - 5.5}" width="11" height="11" rx="2.5" transform="rotate(45 ${g.mid.x} ${g.mid.y})"><title>Drag to bend or move the line. Double-click to reset.</title></rect>`;
    }
  }
  overlayEl.innerHTML = h + '<path id="pv" class="pv" d="" style="display:none"/>';
}
function applySelection() {
  $$('.tbl.sel,.note.sel,.rel.sel,.rn.sel,.oval.sel').forEach(el => el.classList.remove('sel'));
  $$('.row.row-sel').forEach(el => el.classList.remove('row-sel'));
  if (SEL.type === 'table') {
    const el = $(`.tbl[data-t="${SEL.id}"]`, tablesEl); if (el) el.classList.add('sel');
    if (SEL.col) { const r = $(`.row[data-c="${SEL.col}"]`, tablesEl); if (r) r.classList.add('row-sel'); }
  } else if (SEL.type === 'note') {
    const el = $(`.note[data-n="${SEL.id}"]`, tablesEl); if (el) el.classList.add('sel');
  } else if (SEL.type === 'rel') {
    const el = $(`.rel[data-r="${SEL.id}"]`, linksEl); if (el) el.classList.add('sel');
  }
  else if (SEL.type === 'rnode') { const el = $(`.rn[data-n="${SEL.id}"]`, nodesEl); if (el) el.classList.add('sel'); }
  if (SEL.col && (SEL.type === 'table' || SEL.type === 'rnode')) { const o = $(`.oval[data-c="${SEL.col}"]`, nodesEl); if (o) o.classList.add('sel'); }
  renderOverlay();
}
function select(type, id = null, c = null) {
  SEL = { type, id, col: c };
  applySelection(); renderInspector();
}
function updateEmpty() { $('#empty').style.display = (S.tables.length || S.notes.length) ? 'none' : 'flex'; }
function syncTopbar() {
  if (document.activeElement !== $('#diagName')) $('#diagName').value = S.name;
  $('#selNotation').value = S.notation; $('#selLine').value = S.lineStyle; $('#selAttr').value = S.attrView;
  vp.classList.toggle('nogrid', !S.grid);
}
function render() { renderTables(); renderLinks(); renderOverlay(); renderInspector(); updateEmpty(); syncTopbar(); }
function renderCanvas() { renderTables(); renderLinks(); renderOverlay(); updateEmpty(); }

function applyView() {
  world.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.z})`;
  vp.style.backgroundSize = `${20 * view.z}px ${20 * view.z}px`;
  vp.style.backgroundPosition = `${view.x}px ${view.y}px`;
  $('#zLabel').textContent = Math.round(view.z * 100) + '%';
  scheduleSave();
}
function toWorld(e) { const r = vp.getBoundingClientRect(); return { x: (e.clientX - r.left - view.x) / view.z, y: (e.clientY - r.top - view.y) / view.z }; }
function zoomAt(f, cx, cy) {
  const r = vp.getBoundingClientRect(); const mx = cx - r.left, my = cy - r.top;
  const z2 = clamp(view.z * f, 0.05, 3);
  view.x = mx - (mx - view.x) * (z2 / view.z); view.y = my - (my - view.y) * (z2 / view.z); view.z = z2; applyView();
}
function bounds() {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  const add = (a, b, c, d) => { x1 = Math.min(x1, a); y1 = Math.min(y1, b); x2 = Math.max(x2, c); y2 = Math.max(y2, d); };
  S.tables.forEach(t => add(t.x, t.y, t.x + t.w, t.y + tH(t)));
  S.notes.forEach(n => add(n.x, n.y, n.x + n.w, n.y + n.h));
  nodeGeo().extents.forEach(r => add(r.x1, r.y1, r.x2, r.y2));
  return x1 === Infinity ? null : { x1, y1, x2, y2 };
}
function fitView() {
  const b = bounds(), r = vp.getBoundingClientRect();
  if (!b) { view = { x: r.width / 2 - 130, y: r.height / 2 - 100, z: 1 }; applyView(); return; }
  const pad = 70, w = b.x2 - b.x1, h = b.y2 - b.y1;
  const z = clamp(Math.min((r.width - pad * 2) / w, (r.height - pad * 2) / h), 0.05, 1.2);
  view.z = z; view.x = (r.width - w * z) / 2 - b.x1 * z; view.y = (r.height - h * z) / 2 - b.y1 * z; applyView();
}
function viewCenter() { const r = vp.getBoundingClientRect(); return toWorld({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }); }

/* =====================================================================
   Data operations
   ===================================================================== */
function addCol(t, p = {}) {
  const c = { id: uid('c_'), name: p.name || uniqueName(t.cols, 'column'), type: p.type || 'VARCHAR(255)', pk: !!p.pk, nn: !!p.nn || !!p.pk, uq: !!p.uq, ai: !!p.ai, un: !!p.un, def: p.def || '', comment: p.comment || '', kind: 'simple', expr: '', pkp: false, parts: [], ox: null, oy: null };
  t.cols.push(c); return c;
}
function addTable(x, y, name) {
  const t = { id: uid('t_'), name: uniqueName(S.tables, name || 'new_table'), x: snapV(x), y: snapV(y), w: 260, color: COLORS[S.tables.length % COLORS.length], comment: '', engine: 'InnoDB', charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci', cols: [] };
  t.cols.push({ id: uid('c_'), name: 'id', type: 'INT', pk: true, nn: true, uq: false, ai: true, un: true, def: '', comment: '' });
  S.tables.push(t); return t;
}
function newTableAt(x, y) {
  let tx = x, ty = y;
  while (S.tables.some(t => Math.abs(t.x - snapV(tx)) < 20 && Math.abs(t.y - snapV(ty)) < 20)) { tx += 30; ty += 30; }
  const t = addTable(tx, ty);
  SEL = { type: 'table', id: t.id, col: null }; render(); commit(); editTableName(t.id);
}
function deleteTable(id) {
  const t = T(id); if (!t) return;
  S.rels = S.rels.filter(r => r.from.t !== id && r.to.t !== id);
  S.rnodes.forEach(n => { n.ends = n.ends.filter(e => e.t !== id); });
  S.tables = S.tables.filter(x => x.id !== id);
  if (SEL.id === id) SEL = { type: null, id: null, col: null };
  render(); commit(); toast(`Deleted table "${t.name}"`, 'Undo', undo);
}
function deleteCol(tid, cid) {
  const t = own(tid); if (!t) return;
  const c = t.cols.find(x => x.id === cid); if (!c) return;
  S.rels = S.rels.filter(r => !((r.from.t === tid && r.from.c === cid) || (r.to.t === tid && r.to.c === cid)));
  t.cols = t.cols.filter(x => x.id !== cid);
  if (SEL.col === cid) SEL.col = null;
  render(); commit(); toast(`Deleted "${c.name}"`, 'Undo', undo);
}
function moveCol(tid, cid, dir) {
  const t = own(tid); const i = t.cols.findIndex(c => c.id === cid), j = i + dir;
  if (i < 0 || j < 0 || j >= t.cols.length) return;
  const [c] = t.cols.splice(i, 1); t.cols.splice(j, 0, c); render(); commit();
}
function dupCol(tid, cid) {
  const t = own(tid); const i = t.cols.findIndex(c => c.id === cid); if (i < 0) return;
  const c = JSON.parse(JSON.stringify(t.cols[i])); c.id = uid('c_'); c.pk = false; c.pkp = false; c.uq = false; c.ai = false; c.ox = null; c.oy = null;
  (c.parts || []).forEach(p => p.id = uid('p_'));
  c.name = uniqueName(t.cols, c.name + '_copy'); t.cols.splice(i + 1, 0, c);
  SEL = { type: T(tid) ? 'table' : 'rnode', id: tid, col: c.id }; render(); commit();
}
function dupTable(id) {
  const t = T(id); if (!t) return;
  const n = JSON.parse(JSON.stringify(t)); n.id = uid('t_'); n.name = uniqueName(S.tables, t.name + '_copy'); n.x += 40; n.y += 40;
  n.cols.forEach(c => c.id = uid('c_')); S.tables.push(n);
  SEL = { type: 'table', id: n.id, col: null }; render(); commit();
}
function newFkCol(child, parent, pc) {
  return addCol(child, { name: uniqueName(child.cols, singular(parent.name) + '_' + pc.name), type: pc.type, un: pc.un, nn: true });
}
function connect(src, dst) {
  const A = T(src.t), B = T(dst.t); if (!A || !B) return null;
  let pc = dst.c ? B.cols.find(c => c.id === dst.c) : (B.cols.find(c => c.pk) || B.cols[0]);
  if (!pc) pc = addCol(B, { name: 'id', type: 'INT', pk: true, ai: true, un: true });
  let cc = src.c ? A.cols.find(c => c.id === src.c) : newFkCol(A, B, pc);
  if (!cc || !pc) return null;
  if (A === B && cc === pc) { toast('Pick a different column to make a self-reference.'); return null; }
  const dup = S.rels.find(r => r.from.t === A.id && r.from.c === cc.id && r.to.t === B.id && r.to.c === pc.id);
  if (dup) { toast('That relationship already exists.'); select('rel', dup.id); return dup; }
  if (src.c && (cc.type !== pc.type || !!cc.un !== !!pc.un)) { cc.type = pc.type; cc.un = pc.un; toast(`Column "${cc.name}" now matches the parent type (${pc.type}).`); }
  const cards = defaultCards(cc);
  const rel = mkRel({ t: A.id, c: cc.id }, { t: B.id, c: pc.id }, cards.fc, cards.tc);
  S.rels.push(rel); SEL = { type: 'rel', id: rel.id, col: null }; render(); commit(); return rel;
}

/* =====================================================================
   Inline editing
   ===================================================================== */
function startEdit(el, o) {
  if (editing || !el) return;
  editing = true;
  const inp = document.createElement(o.multi ? 'textarea' : 'input');
  inp.className = 'inl'; inp.value = o.value; inp.spellcheck = false; inp.autocomplete = 'off';
  if (o.list) inp.setAttribute('list', o.list);
  el.textContent = ''; el.appendChild(inp); inp.focus(); if (!o.multi) inp.select();
  let cancelled = false, goNext = false;
  inp.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape') { cancelled = true; inp.blur(); }
    else if (o.multi) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); inp.blur(); } }
    else if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    else if (e.key === 'Tab') { e.preventDefault(); goNext = !e.shiftKey && !!o.next; inp.blur(); }
  });
  inp.addEventListener('pointerdown', e => e.stopPropagation());
  inp.addEventListener('dblclick', e => e.stopPropagation());
  inp.addEventListener('blur', () => {
    editing = false;
    if (!cancelled) { o.commit(o.multi ? inp.value : inp.value.trim()); commit(); }
    render();
    if (goNext && !cancelled) o.next();
  }, { once: true });
}
function editTableName(tid) {
  const t = T(tid), el = $(`.tbl[data-t="${tid}"] [data-edit="tname"]`, tablesEl); if (!t || !el) return;
  startEdit(el, { value: t.name, commit: v => { if (v) t.name = v; } });
}
function editCol(tid, cid, kind) {
  if (isOv() && kind === 'cname') { editOval(tid, cid); return; }
  const t = T(tid), c = t && t.cols.find(x => x.id === cid); if (!c) return;
  const el = $(`.row[data-c="${cid}"] [data-edit="${kind}"]`, tablesEl); if (!el) return;
  const idx = t.cols.indexOf(c);
  if (kind === 'cname') {
    startEdit(el, { value: c.name, commit: v => { if (v) c.name = v; }, next: S.showTypes ? () => editCol(tid, cid, 'ctype') : null });
  } else {
    startEdit(el, {
      value: c.type, list: 'mysql-types', commit: v => { if (v) c.type = normType(v); },
      next: () => {
        if (idx < t.cols.length - 1) editCol(tid, t.cols[idx + 1].id, 'cname');
        else { const n = addCol(t); SEL = { type: 'table', id: tid, col: n.id }; render(); commit(); editCol(tid, n.id, 'cname'); }
      }
    });
  }
}
function editNote(nid) {
  const n = getNote(nid), el = $(`.note[data-n="${nid}"] [data-edit="note"]`, tablesEl); if (!n || !el) return;
  startEdit(el, { value: n.text, multi: true, commit: v => { n.text = v; } });
}
function editRelLabel(rid) {
  const r = getRel(rid), g = r && linkGeom(r); if (!g || editing) return;
  editing = true; const m = g.mid;
  const inp = document.createElement('input');
  inp.className = 'inl'; inp.value = r.label || ''; inp.placeholder = 'Label'; inp.setAttribute('aria-label', 'Relationship label');
  inp.style.cssText = `position:absolute;left:${m.x - 70}px;top:${m.y - 13}px;width:140px;height:26px;text-align:center;z-index:9;font:500 12px var(--ui)`;
  tablesEl.appendChild(inp); inp.focus(); inp.select();
  let cancelled = false;
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } if (e.key === 'Escape') { cancelled = true; inp.blur(); } });
  inp.addEventListener('pointerdown', e => e.stopPropagation());
  inp.addEventListener('blur', () => { editing = false; if (!cancelled) { r.label = inp.value.trim(); commit(); } inp.remove(); render(); }, { once: true });
}

/* =====================================================================
   Popovers, menus, modals, toast
   ===================================================================== */
function openPop(html, x, y, opts = {}) {
  closePop();
  const el = document.createElement('div'); el.className = 'pop'; el.innerHTML = html; document.body.appendChild(el);
  const r = el.getBoundingClientRect();
  el.style.left = clamp(x, 8, Math.max(8, innerWidth - r.width - 8)) + 'px';
  el.style.top = clamp(y, 8, Math.max(8, innerHeight - r.height - 8)) + 'px';
  pop = { el, opts }; return el;
}
function closePop() { if (pop) { pop.el.remove(); pop = null; } }
document.addEventListener('pointerdown', e => {
  if (!pop || pop.el.contains(e.target)) return;
  const a = pop.opts.anchor;
  lastClose = { anchor: a && a.contains(e.target) ? a : null, t: Date.now() };
  closePop();
}, true);
function openMenu(x, y, items, anchor) {
  if (anchor && lastClose.anchor === anchor && Date.now() - lastClose.t < 600) return;
  const html = '<div class="p-1.5" style="min-width:210px">' + items.map((it, i) => it.sep ? '<div class="msep"></div>' :
    `<button class="menu-item${it.danger ? ' danger' : ''}" data-mi="${i}"${it.disabled ? ' disabled' : ''}><span style="width:15px;display:inline-flex">${it.on ? ICON.check(15) : (it.icon ? ICON[it.icon](15) : '')}</span><span>${esc(it.label)}</span>${it.kbd ? `<kbd>${esc(it.kbd)}</kbd>` : ''}</button>`).join('') + '</div>';
  const el = openPop(html, x, y, { anchor });
  el.addEventListener('click', e => { const b = e.target.closest('[data-mi]'); if (!b) return; const it = items[+b.dataset.mi]; closePop(); if (it.act) it.act(); });
}
function openModal(title, body, foot) {
  closeModal();
  const el = document.createElement('div'); el.className = 'modal-back';
  el.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-h"><h2>${esc(title)}</h2><button class="btn icon-btn" data-close aria-label="Close">${ICON.x(16)}</button></div><div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div>`;
  el.addEventListener('pointerdown', e => { if (e.target === el) closeModal(); });
  el.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
  document.body.appendChild(el); modal = el; return el;
}
function closeModal() { if (modal) { modal.remove(); modal = null; } }
let toastT = null;
function toast(msg, label, fn) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${label ? `<button type="button">${esc(label)}</button>` : ''}`;
  el.classList.add('show'); clearTimeout(toastT);
  const b = $('button', el); if (b) b.addEventListener('click', () => { el.classList.remove('show'); if (fn) fn(); });
  toastT = setTimeout(() => el.classList.remove('show'), 4600);
}

/* ---------- relationship editor (used in popover and inspector) ---------- */
const TOTAL = { 'zero-one': 'exactly-one', 'zero-many': 'one-many', 'many': 'one-many', 'one': 'exactly-one' };
const PARTIAL = { 'exactly-one': 'zero-one', 'one': 'zero-one', 'one-many': 'zero-many' };
function partHTML(r) {
  const row = (key, t) => { const tot = /^(exactly-one|one|one-many)$/.test(r[key]), v = tot ? PARTIAL[r[key]] : TOTAL[r[key]];
    return `<div class="flex items-center gap-1.5 mt-1.5"><span class="mono text-[12px] flex-1">${esc(t ? t.name : '?')}</span><button type="button" class="chipbtn" data-rel="${key}" data-v="${TOTAL[r[key]] || r[key]}" aria-pressed="${tot}" style="${tot ? 'background:var(--accent);color:var(--on-accent)' : ''}">Total</button><button type="button" class="chipbtn" data-rel="${key}" data-v="${PARTIAL[r[key]] || r[key]}" aria-pressed="${!tot}" style="${!tot ? 'background:var(--accent);color:var(--on-accent)' : ''}">Partial</button></div>`; };
  return `<div class="mt-3"><div class="lbl">Participation (min. cardinality)</div>${row('fc', T(r.from.t))}${row('tc', T(r.to.t))}<div class="muted text-[11.5px] mt-1">Total = every row must take part (1). Partial = optional (0).</div></div>`;
}
function relEditorHTML(r) { return relEditorHTML0(r) + partHTML(r); }
function relEditorHTML0(r) {
  const A = T(r.from.t), B = T(r.to.t), ca = A && A.cols.find(c => c.id === r.from.c), cb = B && B.cols.find(c => c.id === r.to.c);
  if (!A || !B || !ca || !cb) return '<p class="text-[13px]">This relationship points at a missing column.</p>';
  const sideRow = key => `<div class="flex items-center gap-1.5 mt-2"><span class="lbl" style="margin:0">Attach to</span>${[['', 'Auto'], ['l', 'Left side'], ['r', 'Right side']].map(x => `<button type="button" class="tog${(r[key] || '') === x[0] ? ' on' : ''}" style="font-family:var(--ui);font-size:11px" data-rel="${key}" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>`;
  const endRow = (key, t, c, role) => `<div><div class="lbl flex items-center justify-between gap-2"><span>Symbol at <span class="mono" style="color:var(--ink)">${esc(t.name)}.${esc(c.name)}</span></span><span style="font-weight:500">${role}</span></div>
    <div class="grid grid-cols-3 gap-1.5">${CARD_ORDER.map(k => `<button type="button" class="cardbtn${r[key] === k ? ' on' : ''}" data-rel="${key}" data-v="${k}" title="${CARDS[k].name} (${CARDS[k].uml})">${cardIcon(k)}<span>${CARDS[k].name}</span></button>`).join('')}</div>${sideRow(key === 'fc' ? 'fs' : 'ts')}</div>`;
  const opt = (vals, cur) => vals.map(v => `<option value="${esc(v[0])}"${v[0] === cur ? ' selected' : ''}>${esc(v[1])}</option>`).join('');
  const act = ACTIONS.map(a => [a, a]);
  const preset = (id, l) => `<button type="button" class="chipbtn" data-rel="preset" data-v="${id}">${l}</button>`;
  const canJ = isMany(r.fc) && isMany(r.tc);
  return `<div class="mb-3"><div class="text-[14px] font-semibold">Relationship</div>
      <div class="text-[12px] muted mono" style="word-break:break-all">${esc(A.name)}.${esc(ca.name)} → ${esc(B.name)}.${esc(cb.name)}</div></div>
    <div class="lbl">Quick type</div>
    <div class="flex flex-wrap gap-1.5 mb-3">${preset('n1', 'Many to one')}${preset('11', 'One to one')}${preset('1n', 'One to many')}${preset('nm', 'Many to many')}</div>
    <div class="space-y-3">${endRow('fc', A, ca, 'child, holds the foreign key')}${endRow('tc', B, cb, 'parent, referenced')}</div>
    <div class="grid grid-cols-2 gap-2.5 mt-3.5">
      <label class="col-span-2 block"><div class="lbl">Label</div><input class="fld w-full" data-relf="label" value="${esc(r.label)}" placeholder="e.g. places, belongs to" spellcheck="false"></label>
      <label class="block"><div class="lbl">Line style</div><select class="fld w-full" data-relf="style">${opt([['', 'Use default'], ['curved', 'Curved'], ['orthogonal', 'Right-angle'], ['straight', 'Straight']], r.style)}</select></label>
      <label class="flex items-end gap-2 pb-1.5 text-[13px]"><input type="checkbox" class="chk" data-relf="dashed" ${r.dashed ? 'checked' : ''}><span>Dashed (non-identifying)</span></label>
      <label class="block"><div class="lbl">On delete</div><select class="fld w-full" data-relf="onDelete">${opt(act, r.onDelete)}</select></label>
      <label class="block"><div class="lbl">On update</div><select class="fld w-full" data-relf="onUpdate">${opt(act, r.onUpdate)}</select></label>
    </div>
    <div class="mt-3.5"><div class="lbl">Diamond shape (Chen notation)</div>
      <div class="flex flex-wrap items-center gap-1.5"><select class="fld" data-relf="shape" style="width:150px">${opt([['diamond', 'Diamond'], ['double', 'Double diamond'], ['triangle', 'Triangle']], r.shape)}</select>
      <button type="button" class="chipbtn" data-rel="lbl" data-v="has">HAS</button><button type="button" class="chipbtn" data-rel="lbl" data-v="isa">ISA</button></div></div>
    ${canJ ? '<p class="text-[12px] muted mt-3" style="line-height:1.45">A many-to-many link can\'t be a single MySQL foreign key. Create a junction table to make it real.</p>' : ''}
    <div class="flex flex-wrap gap-2 mt-3.5">
      <button type="button" class="btn bordered" data-rel="swap">${ICON.swap(15)}Swap direction</button>
      ${r.bend ? '<button type="button" class="btn bordered" data-rel="resetbend">Reset line shape</button>' : ''}${(r.fs || r.ts) ? '<button type="button" class="btn bordered" data-rel="autosides">Auto sides</button>' : ''}
      ${canJ ? `<button type="button" class="btn bordered" data-rel="junction">${ICON.table(15)}Create junction table</button>` : ''}
      <button type="button" class="btn bordered danger" data-rel="del">${ICON.trash(15)}Delete</button>
    </div>`;
}
function openRelPop(rid, x, y) {
  const r = getRel(rid); if (!r) return;
  openPop(`<div class="p-3.5" style="width:372px;max-width:92vw" data-rid="${rid}">${relEditorHTML(r)}</div>`, x + 12, y + 12);
}
function swapRel(r) {
  const f = r.from; r.from = r.to; r.to = f; const c = r.fc; r.fc = r.tc; r.tc = c; const s = r.fs; r.fs = r.ts; r.ts = s; r.bend = null;
}
function makeJunction(r) {
  const A = T(r.from.t), B = T(r.to.t), ca = A.cols.find(c => c.id === r.from.c), cb = B.cols.find(c => c.id === r.to.c);
  const j = { id: uid('t_'), name: uniqueName(S.tables, A.name + '_' + B.name), x: snapV((A.x + B.x) / 2 + 30), y: snapV((A.y + B.y) / 2 + 40), w: 260, color: COLORS[7], comment: '', engine: 'InnoDB', charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci', cols: [] };
  const c1 = { id: uid('c_'), name: singular(A.name) + '_' + ca.name, type: ca.type, pk: true, nn: true, uq: false, ai: false, un: ca.un, def: '', comment: '' };
  let n2 = singular(B.name) + '_' + cb.name; if (n2 === c1.name) n2 += '_2';
  const c2 = { id: uid('c_'), name: n2, type: cb.type, pk: true, nn: true, uq: false, ai: false, un: cb.un, def: '', comment: '' };
  j.cols.push(c1, c2); S.tables.push(j);
  S.rels = S.rels.filter(x => x.id !== r.id);
  const r1 = mkRel({ t: j.id, c: c1.id }, { t: A.id, c: ca.id }, 'zero-many', 'exactly-one', { onDelete: 'CASCADE' });
  const r2 = mkRel({ t: j.id, c: c2.id }, { t: B.id, c: cb.id }, 'zero-many', 'exactly-one', { onDelete: 'CASCADE' });
  S.rels.push(r1, r2); closePop(); SEL = { type: 'table', id: j.id, col: null }; render(); commit();
  toast(`Created junction table "${j.name}".`);
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-rel]'); if (!b) return;
  const host = b.closest('[data-rid]'); if (!host) return;
  const r = getRel(host.dataset.rid); if (!r) return;
  const k = b.dataset.rel, v = b.dataset.v;
  if (k === 'fc' || k === 'tc') r[k] = v;
  else if (k === 'fs' || k === 'ts') r[k] = v;
  else if (k === 'lbl') { if (v === 'has') r.label = 'has'; else { r.label = 'ISA'; r.fc = 'zero-one'; r.tc = 'exactly-one'; } }
  else if (k === 'resetbend') r.bend = null;
  else if (k === 'autosides') { r.fs = ''; r.ts = ''; }
  else if (k === 'preset') {
    const P = { n1: ['zero-many', 'exactly-one'], '11': ['zero-one', 'exactly-one'], '1n': ['exactly-one', 'zero-many'], nm: ['zero-many', 'zero-many'] }[v];
    r.fc = P[0]; r.tc = P[1];
  }
  else if (k === 'swap') swapRel(r);
  else if (k === 'junction') { makeJunction(r); return; }
  else if (k === 'del') { S.rels = S.rels.filter(x => x.id !== r.id); closePop(); SEL = { type: null, id: null, col: null }; render(); commit(); toast('Relationship deleted.', 'Undo', undo); return; }
  commit(); renderLinks(); renderOverlay();
  host.innerHTML = relEditorHTML(r);
  if (SEL.type === 'rel') applySelection();
});
document.addEventListener('input', e => {
  const f = e.target.closest && e.target.closest('[data-relf]'); if (!f) return;
  const host = f.closest('[data-rid]'); const r = host && getRel(host.dataset.rid); if (!r) return;
  r[f.dataset.relf] = f.type === 'checkbox' ? f.checked : f.value;
  renderLinks(); renderOverlay(); applySelection();
});
document.addEventListener('change', e => { if (e.target.closest && e.target.closest('[data-relf]')) commit(); });

/* =====================================================================
   Inspector
   ===================================================================== */
const TG_T = [['pk', 'PK', 'Primary key'], ['pkp', 'PKP', 'Partial key (weak entity)'], ['nn', 'NN', 'NOT NULL'], ['uq', 'UQ', 'UNIQUE'], ['ai', 'AI', 'AUTO_INCREMENT'], ['un', 'UN', 'UNSIGNED']];
const TG_R = [['nn', 'NN', 'NOT NULL']];
const KIND_OPTS = [['simple', 'Simple'], ['multi', 'Multivalued'], ['derived', 'Derived'], ['composite', 'Composite']];
const optHTML = (arr, cur) => arr.map(v => `<option value="${esc(v[0])}"${v[0] === cur ? ' selected' : ''}>${esc(v[1])}</option>`).join('');
function renderInspector() {
  const st = insp.scrollTop; let h = '';
  if (SEL.type === 'table' && T(SEL.id)) h = inspTable(T(SEL.id));
  else if (SEL.type === 'rel' && getRel(SEL.id)) h = `<div class="p-4" data-rid="${SEL.id}">${relEditorHTML(getRel(SEL.id))}</div>`;
  else if (SEL.type === 'rnode' && getNode(SEL.id)) h = inspRnode(getNode(SEL.id));
  else if (SEL.type === 'note' && getNote(SEL.id)) h = inspNote(getNote(SEL.id));
  else h = inspDiagram();
  insp.innerHTML = h; insp.scrollTop = st;
}
function inspDiagram() {
  const row = (label, key, on) => `<label class="flex items-center justify-between gap-3 text-[13px]"><span>${label}</span><input type="checkbox" class="chk" data-d="${key}" ${on ? 'checked' : ''}></label>`;
  return `<div class="p-4 space-y-6">
    <section><h3 class="ph">Canvas</h3><div class="space-y-3">
      ${row('Snap to grid', 'snap', S.snap)}${row('Show dot grid', 'grid', S.grid)}${row('Show column types', 'showTypes', S.showTypes)}${row('Hide foreign keys in oval view', 'hideFk', S.hideFk)}
      <label class="flex items-center justify-between gap-3 text-[13px]"><span>Mouse wheel</span><select class="fld" style="width:120px" data-p="wheel"><option value="zoom"${prefs.wheel === 'zoom' ? ' selected' : ''}>Zooms</option><option value="pan"${prefs.wheel === 'pan' ? ' selected' : ''}>Scrolls</option></select></label>
    </div></section>
    <section><h3 class="ph">This diagram</h3>
      <p class="text-[13px] muted" style="line-height:1.5">${S.tables.length} table${S.tables.length === 1 ? '' : 's'}, ${S.rels.length} link${S.rels.length === 1 ? '' : 's'}, ${S.rnodes.length} relationship node${S.rnodes.length === 1 ? '' : 's'}, ${S.notes.length} note${S.notes.length === 1 ? '' : 's'}. Saved automatically in this browser.</p>
      <div class="flex flex-wrap gap-2 mt-3"><button class="btn bordered" data-insp="sql">${ICON.copy(15)}View SQL</button><button class="btn bordered" data-insp="import">${ICON.upload(15)}Import SQL</button></div></section>
    <section><h3 class="ph">Editing on the canvas</h3><ul class="guide">
      <li>Double-click a table name, column name or type to edit it. Press Tab to jump to the next field.</li>
      <li>Hover a column and drag its dot onto another column to connect them. Drag from a table header to also create the foreign key column.</li>
      <li>Double-click a line to change its end symbols, label and style. Select a line and drag its round handles to move an end, or the diamond handle to bend it.</li>
      <li>Relationship menu: add a diamond, an ISA or an associative entity, then drag the dot on the shape onto each table. Three or more tables make it n-ary. Attributes go on the shape itself.</li>
      <li>Attributes menu: Chen ovals shows every attribute as an oval you can drag. Right-click an attribute to make it a key, partial key, multivalued, derived or composite.</li>
      <li>Right-click any table, column, line or shape for more actions. Double-click empty canvas to add a table.</li>
    </ul></section></div>`;
}
function colCard(o, c, i, isRn, fks) {
  const k = c.kind || 'simple', selc = SEL.col === c.id, extra = selc || c.def || c.comment, tg = isRn ? TG_R : TG_T;
  const parts = k === 'composite' ? `<div class="mt-1.5 space-y-1">${(c.parts || []).map(p => `<div class="flex gap-1.5" data-pid="${p.id}"><input class="fld mono flex-1" data-pf="name" value="${esc(p.name)}" aria-label="Part name" spellcheck="false"><input class="fld mono" style="width:104px" data-pf="type" list="mysql-types" value="${esc(p.type)}" aria-label="Part type" spellcheck="false"><button type="button" class="mini danger" data-pdel title="Remove part">${ICON.x(13)}</button></div>`).join('')}<button type="button" class="btn bordered" data-padd>${ICON.plus(13)}Add part</button></div>` : '';
  const expr = k === 'derived' ? `<input class="fld mono w-full mt-1.5" data-cf="expr" value="${esc(c.expr || '')}" placeholder="Expression, e.g. TIMESTAMPDIFF(YEAR, birth_date, CURDATE())" spellcheck="false">` : '';
  return `<div class="colcard${selc ? ' sel' : ''}" data-cid="${c.id}">
    <div class="flex gap-1.5"><input class="fld mono flex-1" data-cf="name" value="${esc(c.name)}" aria-label="Name" spellcheck="false"><input class="fld mono" style="width:118px" data-cf="type" list="mysql-types" value="${esc(c.type)}" aria-label="Type" spellcheck="false"></div>
    <div class="flex items-center gap-1 mt-1.5 flex-wrap"><select class="fld" style="width:108px;height:24px;font-size:11.5px" data-cf="kind" aria-label="Attribute kind">${optHTML(KIND_OPTS, k)}</select>${tg.map(g => `<button type="button" class="tog${c[g[0]] ? ' on' : ''}" data-tg="${g[0]}" title="${g[2]}">${g[1]}</button>`).join('')}${fks && fks.has(c.id) ? '<span class="chip fkc" style="margin-left:2px">FK</span>' : ''}
      <span class="flex-1"></span>
      <button type="button" class="mini" data-ca="up" title="Move up"${i === 0 ? ' disabled style="opacity:.3"' : ''}>${ICON.up(14)}</button><button type="button" class="mini" data-ca="down" title="Move down"${i === o.cols.length - 1 ? ' disabled style="opacity:.3"' : ''}>${ICON.down(14)}</button><button type="button" class="mini" data-ca="dup" title="Duplicate">${ICON.copy(14)}</button><button type="button" class="mini danger" data-ca="del" title="Delete">${ICON.trash(14)}</button></div>
    ${expr}${parts}
    ${extra ? `<div class="grid grid-cols-2 gap-1.5 mt-1.5"><input class="fld mono" data-cf="def" value="${esc(c.def)}" placeholder="Default" spellcheck="false"><input class="fld" data-cf="comment" value="${esc(c.comment)}" placeholder="Comment" spellcheck="false"></div><input class="fld mono mt-1.5" style="width:100%" data-cf="check" value="${esc(c.check)}" placeholder="CHECK, e.g. price > 0" spellcheck="false">` : ''}
  </div>`;
}
function inspTable(t) {
  const fks = fkCols(t.id), cols = t.cols.map((c, i) => colCard(t, c, i, false, fks)).join('');
  const rels = S.rels.filter(r => r.from.t === t.id || r.to.t === t.id).map(r => {
    const A = T(r.from.t), B = T(r.to.t), ca = A && A.cols.find(c => c.id === r.from.c), cb = B && B.cols.find(c => c.id === r.to.c); if (!ca || !cb) return '';
    return `<button type="button" class="menu-item mono" style="font-size:12px" data-insp="selrel" data-id="${r.id}">${ICON.link(14)}<span style="word-break:break-all">${esc(A.name)}.${esc(ca.name)} → ${esc(B.name)}.${esc(cb.name)}</span></button>`;
  }).join('');
  const nodes = S.rnodes.filter(n => n.ends.some(e => e.t === t.id)).map(n => `<button type="button" class="menu-item" style="font-size:12.5px" data-insp="selnode" data-id="${n.id}">${ICON.diamond(14)}<span>${esc(n.name || (n.kind === 'isa' ? 'ISA' : 'has'))}</span></button>`).join('');
  const opts = (arr, cur) => arr.map(v => `<option${v === cur ? ' selected' : ''}>${esc(v)}</option>`).join('');
  return `<div class="p-4 space-y-5" data-tid="${t.id}">
    <div class="flex items-center justify-between"><h3 class="ph" style="margin:0">Table</h3>
      <div class="flex gap-1"><button class="btn icon-btn" data-insp="duptbl" title="Duplicate table (Ctrl+D)" aria-label="Duplicate table">${ICON.copy(15)}</button><button class="btn icon-btn danger" data-insp="deltbl" title="Delete table" aria-label="Delete table">${ICON.trash(15)}</button></div></div>
    <div class="space-y-3">
      <label class="block"><div class="lbl">Name</div><input class="fld mono w-full" data-f="name" value="${esc(t.name)}" spellcheck="false"></label>
      <div><div class="lbl">Header colour</div><div class="flex flex-wrap items-center gap-1.5">${COLORS.map(c => `<button type="button" class="sw${t.color === c ? ' on' : ''}" data-tcolor="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}<input type="color" class="sw" style="padding:0;background:none" data-f="color" value="${esc(t.color)}" aria-label="Custom colour"></div></div>
      <label class="block"><div class="lbl">Comment</div><input class="fld w-full" data-f="comment" value="${esc(t.comment)}" placeholder="What is stored here?"></label>
      <label class="flex items-center gap-2 text-[13px]"><input type="checkbox" class="chk" data-f="weak" ${t.weak ? 'checked' : ''}> Weak entity (double border)</label>
      <div class="grid grid-cols-3 gap-2">
        <label class="block"><div class="lbl">Engine</div><select class="fld w-full" data-f="engine">${opts(['InnoDB', 'MyISAM', 'MEMORY', 'ARCHIVE'], t.engine)}</select></label>
        <label class="block"><div class="lbl">Charset</div><select class="fld w-full" data-f="charset">${opts(['utf8mb4', 'utf8mb3', 'latin1', 'ascii'], t.charset)}</select></label>
        <label class="block"><div class="lbl">Collation</div><select class="fld w-full" data-f="collation">${opts(['utf8mb4_unicode_ci', 'utf8mb4_0900_ai_ci', 'utf8mb4_general_ci', 'utf8mb4_bin', 'latin1_swedish_ci'], t.collation)}</select></label>
      </div>
    </div>
    <div><div class="flex items-center justify-between mb-2"><h3 class="ph" style="margin:0">Attributes (${t.cols.length})</h3><button class="btn bordered" data-insp="addcol">${ICON.plus(14)}Add</button></div>
      <div class="space-y-2">${cols || '<p class="text-[13px] muted">No attributes yet.</p>'}</div></div>
    ${rels ? `<div><h3 class="ph">Links</h3><div>${rels}</div></div>` : ''}
    ${nodes ? `<div><h3 class="ph">Relationship nodes</h3><div>${nodes}</div></div>` : ''}
  </div>`;
}
function inspRnode(n) {
  const isa = n.kind === 'isa';
  const ends = n.ends.map((e, i) => {
    const t = T(e.t); if (!t) return '';
    return `<div class="colcard" data-ei="${i}"><div class="flex items-center gap-1.5"><span class="mono flex-1" style="font-size:12.5px;word-break:break-all">${esc(t.name)}</span>
      ${isa ? `<select class="fld" style="width:104px;height:26px" data-ef="role" aria-label="Role">${optHTML([['super', 'Supertype'], ['sub', 'Subtype']], e.role)}</select>` : `<input class="fld" style="width:96px;height:26px" data-ef="role" value="${esc(e.role || '')}" placeholder="Role" aria-label="Role name">`}
      <button type="button" class="mini danger" data-eend="del" title="Remove participant">${ICON.x(13)}</button></div>
      ${isa ? '' : `<select class="fld w-full mt-1.5" style="height:26px" data-ef="card" aria-label="Cardinality">${CARD_ORDER.map(k => `<option value="${k}"${e.card === k ? ' selected' : ''}>${CARDS[k].name} (${CARDS[k].uml})</option>`).join('')}</select>`}</div>`;
  }).join('');
  const cols = n.cols.map((c, i) => colCard(n, c, i, true, null)).join('');
  return `<div class="p-4 space-y-5" data-rnid="${n.id}">
    <div class="flex items-center justify-between"><h3 class="ph" style="margin:0">${isa ? 'ISA hierarchy' : 'Relationship'}</h3><button class="btn icon-btn danger" data-insp="delrnode" title="Delete" aria-label="Delete">${ICON.trash(15)}</button></div>
    <div class="space-y-3">
      <label class="block"><div class="lbl">Name</div><input class="fld w-full" data-f="name" value="${esc(n.name)}" placeholder="${isa ? 'ISA' : 'has'}" spellcheck="false"></label>
      <div class="grid grid-cols-2 gap-2">
        <label class="block"><div class="lbl">Type</div><select class="fld w-full" data-f="kind">${optHTML([['rel', 'Relationship'], ['isa', 'ISA (specialization)']], n.kind)}</select></label>
        <label class="block"><div class="lbl">Shape</div><select class="fld w-full" data-f="shape">${optHTML([['diamond', 'Diamond'], ['double', 'Double diamond'], ['triangle', 'Triangle']], n.shape)}</select></label>
      </div>
      ${isa ? `<div class="grid grid-cols-2 gap-2 items-end"><label class="block"><div class="lbl">Subtypes are</div><select class="fld w-full" data-f="dc">${optHTML([['d', 'Disjoint (d)'], ['o', 'Overlapping (o)']], n.dc)}</select></label>
        <label class="flex items-center gap-2 text-[13px] pb-1.5"><input type="checkbox" class="chk" data-f="total" ${n.total ? 'checked' : ''}> Total</label></div>`
      : `<label class="flex items-center gap-2 text-[13px]"><input type="checkbox" class="chk" data-f="assoc" ${n.assoc ? 'checked' : ''}> Associative entity (box around the diamond)</label>`}
    </div>
    <div><h3 class="ph">Participants (${n.ends.length})</h3><div class="space-y-2">${ends || '<p class="text-[13px] muted" style="line-height:1.5">None yet. Drag from the dot on the shape to a table, or pick one below.</p>'}</div>
      <select class="fld w-full mt-2" data-addend aria-label="Add participant"><option value="">Add a table…</option>${S.tables.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div>
    ${isa ? '' : `<div><div class="flex items-center justify-between mb-2"><h3 class="ph" style="margin:0">Relationship attributes (${n.cols.length})</h3><button class="btn bordered" data-insp="addcol">${ICON.plus(14)}Add</button></div><div class="space-y-2">${cols || '<p class="text-[13px] muted">None. Attributes of the relationship itself, like a grade or a start date, go here.</p>'}</div></div>`}
  </div>`;
}
function inspNote(n) {
  return `<div class="p-4 space-y-4" data-nid="${n.id}"><div class="flex items-center justify-between"><h3 class="ph" style="margin:0">Note</h3><button class="btn icon-btn danger" data-insp="delnote" aria-label="Delete note">${ICON.trash(15)}</button></div>
    <label class="block"><div class="lbl">Text</div><textarea class="fld w-full" rows="6" data-nf="text">${esc(n.text)}</textarea></label>
    <div><div class="lbl">Colour</div><div class="flex flex-wrap gap-1.5">${NOTE_COLORS.map(c => `<button type="button" class="sw${n.color === c ? ' on' : ''}" data-ncolor="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}</div></div></div>`;
}
const ownerOf = el => { const h = el.closest && el.closest('[data-tid],[data-rnid]'); return h ? (h.dataset.tid ? T(h.dataset.tid) : getNode(h.dataset.rnid)) : null; };
const cardCol = (o, el) => { const c = el.closest('[data-cid]'); return c ? o.cols.find(x => x.id === c.dataset.cid) : null; };
insp.addEventListener('input', e => {
  const el = e.target, nHost = el.closest('[data-nid]');
  if (el.dataset.nf && nHost) { getNote(nHost.dataset.nid).text = el.value; renderCanvas(); return; }
  const o = ownerOf(el); if (!o) return;
  if (el.dataset.f) { o[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value; renderCanvas(); }
  else if (el.dataset.pf) { const c = cardCol(o, el), pt = c.parts.find(x => x.id === el.closest('[data-pid]').dataset.pid); pt[el.dataset.pf] = el.value; renderCanvas(); }
  else if (el.dataset.cf) { const c = cardCol(o, el); if (el.dataset.cf !== 'kind') { c[el.dataset.cf] = el.value; renderCanvas(); } }
  else if (el.dataset.ef) { const i = +el.closest('[data-ei]').dataset.ei; o.ends[i][el.dataset.ef] = el.value; renderCanvas(); }
});
insp.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.d) { S[el.dataset.d] = el.checked; render(); commit(); return; }
  if (el.dataset.p) { prefs[el.dataset.p] = el.value; savePrefs(); return; }
  const o = ownerOf(el); if (!o) { commit(); return; }
  if (el.dataset.addend !== undefined) { if (el.value) addEnd(o, el.value); return; }
  if (el.dataset.cf === 'type') { const c = cardCol(o, el); c.type = normType(el.value.trim() || 'INT'); el.value = c.type; renderCanvas(); }
  else if (el.dataset.cf === 'name' && !el.value.trim()) { const c = cardCol(o, el); c.name = 'column'; el.value = 'column'; renderCanvas(); }
  else if (el.dataset.cf === 'kind') { const c = cardCol(o, el); setKind(c, el.value); SEL.col = c.id; render(); commit(); return; }
  else if (el.dataset.f === 'name' && T(o.id) && !el.value.trim()) { o.name = 'table'; el.value = 'table'; renderCanvas(); }
  else if (el.dataset.f === 'color') renderInspector();
  else if (el.dataset.f === 'kind') {
    if (o.kind === 'isa') { if (!o.ends.some(x => x.role === 'super') && o.ends[0]) o.ends[0].role = 'super'; o.ends.forEach(x => { if (x.role !== 'super') x.role = 'sub'; }); if (!o.name || o.name === 'has') o.name = 'ISA'; syncIsaKeys(o); }
    else { o.ends.forEach(x => { x.role = ''; }); if (o.name === 'ISA') o.name = 'has'; }
    render(); commit(); return;
  }
  else if (['shape', 'assoc', 'dc', 'total'].includes(el.dataset.f)) { render(); commit(); return; }
  else if (el.dataset.ef === 'role' && o.kind === 'isa') {
    const i = +el.closest('[data-ei]').dataset.ei; if (o.ends[i].role === 'super') o.ends.forEach((x, j) => { if (j !== i) x.role = 'sub'; });
    syncIsaKeys(o); render(); commit(); return;
  }
  commit();
});
insp.addEventListener('focusin', e => {
  const card = e.target.closest('[data-cid]'); if (!card || (SEL.type !== 'table' && SEL.type !== 'rnode') || SEL.col === card.dataset.cid) return;
  SEL.col = card.dataset.cid; $$('.colcard.sel', insp).forEach(x => x.classList.remove('sel')); card.classList.add('sel'); applySelection();
});
insp.addEventListener('click', e => {
  const o = ownerOf(e.target), isT = !!(o && T(o.id) === o);
  const tg = e.target.closest('[data-tg]');
  if (tg && o) { const c = cardCol(o, tg), k = tg.dataset.tg; c[k] = !c[k]; if (k === 'pk' && c.pk) { c.nn = true; c.pkp = false; } if (k === 'pkp' && c.pkp) { c.nn = true; c.pk = false; } SEL.col = c.id; render(); commit(); return; }
  const ca = e.target.closest('[data-ca]');
  if (ca && o) { const c = cardCol(o, ca), a = ca.dataset.ca; SEL.col = c.id; if (a === 'up') moveCol(o.id, c.id, -1); else if (a === 'down') moveCol(o.id, c.id, 1); else if (a === 'dup') dupCol(o.id, c.id); else deleteCol(o.id, c.id); return; }
  const padd = e.target.closest('[data-padd]');
  if (padd && o) { const c = cardCol(o, padd); c.parts = c.parts || []; c.parts.push({ id: uid('p_'), name: 'part_' + (c.parts.length + 1), type: 'VARCHAR(100)' }); renderInspector(); renderCanvas(); commit(); return; }
  const pdel = e.target.closest('[data-pdel]');
  if (pdel && o) { const c = cardCol(o, pdel), pid = pdel.closest('[data-pid]').dataset.pid; c.parts = c.parts.filter(x => x.id !== pid); renderInspector(); renderCanvas(); commit(); return; }
  const ed = e.target.closest('[data-eend]');
  if (ed && o) { o.ends.splice(+ed.closest('[data-ei]').dataset.ei, 1); render(); commit(); return; }
  const sw = e.target.closest('[data-tcolor]'); if (sw && o && isT) { o.color = sw.dataset.tcolor; render(); commit(); return; }
  const nsw = e.target.closest('[data-ncolor]'), nHost = e.target.closest('[data-nid]');
  if (nsw && nHost) { getNote(nHost.dataset.nid).color = nsw.dataset.ncolor; render(); commit(); return; }
  const a = e.target.closest('[data-insp]'); if (!a) return;
  switch (a.dataset.insp) {
    case 'sql': showSQL(); break;
    case 'import': showImport(); break;
    case 'selrel': select('rel', a.dataset.id); break;
    case 'selnode': select('rnode', a.dataset.id); break;
    case 'duptbl': dupTable(o.id); break;
    case 'deltbl': deleteTable(o.id); break;
    case 'delrnode': deleteRnode(o.id); break;
    case 'delnote': S.notes = S.notes.filter(n => n.id !== nHost.dataset.nid); SEL = { type: null, id: null, col: null }; render(); commit(); break;
    case 'addcol': { const c = addCol(o); SEL.col = c.id; render(); commit(); const inp = $(`[data-cid="${c.id}"] [data-cf="name"]`, insp); if (inp) { inp.focus(); inp.select(); } break; }
  }
});

/* =====================================================================
   Pointer interaction on the canvas
   ===================================================================== */
function beginDrag(e, d) {
  drag = d; d.sx = e.clientX; d.sy = e.clientY; d.moved = false;
  window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
}
function onMove(e) {
  if (!drag) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (!drag.moved && Math.hypot(dx, dy) < 3) return;
  drag.moved = true; drag.move(e, dx, dy);
}
function onUp(e) {
  window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
  const d = drag; drag = null; if (d && d.up) d.up(e, d.moved);
}
function startPan(e) {
  const o = { x: view.x, y: view.y }; vp.classList.add('panning');
  beginDrag(e, { move: (ev, dx, dy) => { view.x = o.x + dx; view.y = o.y + dy; applyView(); }, up: () => vp.classList.remove('panning') });
}
function startMoveTable(e, el) {
  const t = T(el.dataset.t); if (!t) return; const o = { x: t.x, y: t.y };
  beginDrag(e, {
    move: (ev, dx, dy) => {
      let nx = o.x + dx / view.z, ny = o.y + dy / view.z;
      if (S.snap && !ev.altKey) { nx = Math.round(nx / 10) * 10; ny = Math.round(ny / 10) * 10; }
      t.x = nx; t.y = ny; el.style.left = nx + 'px'; el.style.top = ny + 'px'; renderLinks(); renderOverlay();
    },
    up: (ev, moved) => { if (moved) commit(); }
  });
}
function startMoveNote(e, el) {
  const n = getNote(el.dataset.n); if (!n) return; const o = { x: n.x, y: n.y };
  beginDrag(e, {
    move: (ev, dx, dy) => {
      let nx = o.x + dx / view.z, ny = o.y + dy / view.z;
      if (S.snap && !ev.altKey) { nx = Math.round(nx / 10) * 10; ny = Math.round(ny / 10) * 10; }
      n.x = nx; n.y = ny; el.style.left = nx + 'px'; el.style.top = ny + 'px';
    },
    up: (ev, moved) => { if (moved) commit(); }
  });
}
function startResize(e, handle) {
  const kind = handle.dataset.rsz, host = handle.closest(kind === 'table' ? '.tbl' : '.note');
  const obj = kind === 'table' ? T(host.dataset.t) : getNote(host.dataset.n); if (!obj) return;
  const o = { w: obj.w, h: obj.h };
  beginDrag(e, {
    move: (ev, dx, dy) => {
      let w = o.w + dx / view.z; if (S.snap) w = Math.round(w / 10) * 10;
      obj.w = clamp(w, kind === 'table' ? MIN_W : 120, 900); host.style.width = obj.w + 'px';
      if (kind === 'note') { let h = o.h + dy / view.z; if (S.snap) h = Math.round(h / 10) * 10; obj.h = clamp(h, 60, 600); host.style.height = obj.h + 'px'; }
      renderLinks(); renderOverlay();
    },
    up: (ev, moved) => { if (moved) commit(); }
  });
}
function startReorder(e, grip) {
  const row = grip.closest('.row'), t = T(row.dataset.t), cid = row.dataset.c; if (!t) return;
  SEL = { type: 'table', id: t.id, col: cid }; applySelection(); renderInspector();
  beginDrag(e, {
    move: ev => {
      const p = toWorld(ev); const idx = clamp(Math.floor((p.y - t.y - HEAD_H) / ROW_H), 0, t.cols.length - 1);
      const cur = t.cols.findIndex(c => c.id === cid);
      if (idx !== cur) { const [c] = t.cols.splice(cur, 1); t.cols.splice(idx, 0, c); renderTables(); renderLinks(); renderOverlay(); }
    },
    up: (ev, moved) => { if (moved) { commit(); renderInspector(); } }
  });
}
function resolveTarget(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY); if (!el) return null;
  const rn = el.closest('.rn'); if (rn) return { n: rn.dataset.n };
  const tb = el.closest('.tbl'); if (!tb) return null;
  const rect = tb.getBoundingClientRect(), row = el.closest('.row');
  return { t: tb.dataset.t, c: row ? row.dataset.c : null, side: e.clientX < rect.left + rect.width / 2 ? 'l' : 'r' };
}
function showPreview(start, dir, p) {
  const pv = $('#pv'); if (!pv) return;
  pv.setAttribute('d', `M${start.x} ${start.y}C${start.x + dir * 70} ${start.y} ${p.x} ${p.y} ${p.x} ${p.y}`); pv.style.display = '';
}
function clearDrop() { $$('.drop').forEach(x => x.classList.remove('drop')); }
function markDrop(e) {
  clearDrop(); const el = document.elementFromPoint(e.clientX, e.clientY); if (!el) return;
  const rn = el.closest('.rn'); if (rn) { rn.classList.add('drop'); return; }
  const row = el.closest('.row'); if (row) { row.classList.add('drop'); return; }
  const tb = el.closest('.tbl'); if (tb) tb.classList.add('drop');
}
function startConnect(e, port) {
  const kind = port.dataset.port, tid = port.dataset.t, cid = port.dataset.c || null, side = port.dataset.side, t = T(tid); if (!t) return;
  const ci = cid ? t.cols.findIndex(c => c.id === cid) : -1;
  const start = { x: side === 'r' ? t.x + t.w : t.x, y: kind === 'row' && ci >= 0 ? rowY(t, ci) : t.y + HH() / 2 };
  select('table', tid, cid); document.body.classList.add('connecting');
  beginDrag(e, {
    move: ev => { showPreview(start, side === 'r' ? 1 : -1, toWorld(ev)); markDrop(ev); },
    up: (ev, moved) => {
      document.body.classList.remove('connecting'); clearDrop(); const pv = $('#pv'); if (pv) pv.style.display = 'none';
      if (!moved) return; const tg = resolveTarget(ev); if (tg && tg.n) addEnd(getNode(tg.n), tid); else if (tg) connect({ t: tid, c: cid }, tg);
    }
  });
}
function startBend(e, rid) {
  const r = getRel(rid), g = r && linkGeom(r); if (!g) return;
  beginDrag(e, {
    move: (ev, dx, dy) => {
      const p = toWorld(ev); let ax = p.x, ay = p.y;
      if (S.snap && !ev.altKey) { ax = Math.round(ax / 10) * 10; ay = Math.round(ay / 10) * 10; }
      if (g.style === 'orthogonal') { ax = clampVx(ax, g.e); r.bend = { x: ax - g.m0.x, y: 0 }; }
      else r.bend = { x: ax - g.m0.x, y: ay - g.m0.y };
      renderLinks(); renderOverlay();
    },
    up: (ev, moved) => { if (moved) commit(); }
  });
}
function startReconnect(e, handle) {
  const end = handle.dataset.end, r = getRel(SEL.id), g = r && linkGeom(r); if (!g) return;
  const fixed = end === 'from' ? g.p2 : g.p1, dir = end === 'from' ? g.u2.x : g.u1.x;
  document.body.classList.add('connecting');
  beginDrag(e, {
    move: ev => { showPreview(fixed, dir || 1, toWorld(ev)); markDrop(ev); },
    up: (ev, moved) => {
      document.body.classList.remove('connecting'); clearDrop(); const pv = $('#pv'); if (pv) pv.style.display = 'none';
      if (!moved) return; const tg = resolveTarget(ev); if (!tg) return;
      const B = T(tg.t); if (!B) return;
      if (end === 'to') {
        const keep = !tg.c && tg.t === r.to.t;
        const pc = keep ? B.cols.find(c => c.id === r.to.c) : tg.c ? B.cols.find(c => c.id === tg.c) : (B.cols.find(c => c.pk) || B.cols[0]);
        if (!pc) return; r.to = { t: B.id, c: pc.id }; r.ts = tg.side;
      } else {
        const parent = T(r.to.t), pcol = parent && parent.cols.find(c => c.id === r.to.c); if (!pcol) return;
        const keep = !tg.c && tg.t === r.from.t;
        const cc = keep ? B.cols.find(c => c.id === r.from.c) : tg.c ? B.cols.find(c => c.id === tg.c) : newFkCol(B, parent, pcol);
        if (!cc) return; r.from = { t: B.id, c: cc.id }; r.fs = tg.side;
      }
      render(); commit();
    }
  });
}

vp.addEventListener('pointerdown', e => {
  if (e.target.closest('[data-ui]') || e.target.closest('input,textarea,select')) return;
  if (e.button === 2) return;
  if (e.button === 1 || spaceDown) { e.preventDefault(); startPan(e); return; }
  const handle = e.target.closest('.handle'); if (handle) { startReconnect(e, handle); return; }
  const port = e.target.closest('.port'); if (port) { startConnect(e, port); return; }
  const rsz = e.target.closest('.rsz'); if (rsz) { startResize(e, rsz); return; }
  const grip = e.target.closest('[data-grip]'); if (grip) { startReorder(e, grip); return; }
  const rport = e.target.closest('.rport'); if (rport) { startConnectNode(e, rport); return; }
  const ov = e.target.closest('.oval'); if (ov) { selectOval(ov); startMoveOval(e, ov); return; }
  const rn = e.target.closest('.rn'); if (rn) { if (SEL.type !== 'rnode' || SEL.id !== rn.dataset.n) select('rnode', rn.dataset.n); startMoveRNode(e, rn.dataset.n); return; }
  const tbl = e.target.closest('.tbl');
  if (tbl) {
    const row = e.target.closest('.row');
    if (e.target.closest('[data-act]')) { if (SEL.id !== tbl.dataset.t || SEL.type !== 'table') select('table', tbl.dataset.t, row ? row.dataset.c : null); return; }
    if (SEL.type !== 'table' || SEL.id !== tbl.dataset.t || SEL.col !== (row ? row.dataset.c : null)) select('table', tbl.dataset.t, row ? row.dataset.c : null);
    startMoveTable(e, tbl); return;
  }
  const note = e.target.closest('.note');
  if (note) { if (SEL.type !== 'note' || SEL.id !== note.dataset.n) select('note', note.dataset.n); startMoveNote(e, note); return; }
  const wph = e.target.closest('.wph'); if (wph) { startBend(e, SEL.id); return; }
  const lbl = e.target.closest('.rel-label'); if (lbl) { const id = lbl.dataset.rl; if (SEL.type !== 'rel' || SEL.id !== id) select('rel', id); startBend(e, id); return; }
  const rel = e.target.closest('.rel');
  if (rel) { const id = rel.dataset.r || (rel.closest('.rel') || {}).dataset.r || rel.dataset.rl; if (SEL.type !== 'rel' || SEL.id !== id) select('rel', id); return; }
  if (SEL.type) select(null);
  startPan(e);
});
vp.addEventListener('wheel', e => {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey || prefs.wheel === 'zoom') zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY);
  else { view.x -= e.deltaX; view.y -= e.deltaY; applyView(); }
}, { passive: false });

tablesEl.addEventListener('click', e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  const tbl = a.closest('.tbl'), t = T(tbl.dataset.t); if (!t) return;
  if (a.dataset.act === 'pk') { const c = t.cols.find(x => x.id === a.closest('.row').dataset.c); c.pk = !c.pk; if (c.pk) c.nn = true; render(); commit(); }
  else if (a.dataset.act === 'addcol') { const c = addCol(t); SEL = { type: 'table', id: t.id, col: c.id }; render(); commit(); editCol(t.id, c.id, 'cname'); }
  else if (a.dataset.act === 'deltbl') deleteTable(t.id);
  else if (a.dataset.act === 'color') openColorPop(t, e.clientX, e.clientY);
});
function openColorPop(t, x, y) {
  const el = openPop(`<div class="p-2.5 grid grid-cols-5 gap-2">${COLORS.map(c => `<button type="button" class="sw${t.color === c ? ' on' : ''}" data-color="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}</div>`, x, y + 8);
  el.addEventListener('click', ev => { const b = ev.target.closest('[data-color]'); if (!b) return; t.color = b.dataset.color; closePop(); render(); commit(); });
}

vp.addEventListener('dblclick', e => {
  if (e.target.closest('.wph')) { const r = getRel(SEL.id); if (r && r.bend) { r.bend = null; renderLinks(); renderOverlay(); commit(); } return; }
  if (e.target.closest('input,textarea,select,[data-ui],.port,.rport,.handle,.rsz')) return;
  const ed = e.target.closest('[data-edit]');
  if (ed) {
    const kind = ed.dataset.edit;
    if (kind === 'tname') editTableName(ed.closest('.tbl').dataset.t);
    else if (kind === 'cname' || kind === 'ctype') { const row = ed.closest('.row'); editCol(row.dataset.t, row.dataset.c, kind); }
    else if (kind === 'note') editNote(ed.closest('.note').dataset.n);
    return;
  }
  if (e.target.closest('[data-act]')) return;
  const ovd = e.target.closest('.oval'); if (ovd) { editOval(ovd.dataset.o, ovd.dataset.c); return; }
  const rnd = e.target.closest('.rn'); if (rnd) { editRnodeName(rnd.dataset.n); return; }
  const lbl = e.target.closest('.rel-label'); if (lbl) { editRelLabel(lbl.dataset.rl); return; }
  const rel = e.target.closest('.rel'); if (rel) { select('rel', rel.dataset.r); openRelPop(rel.dataset.r, e.clientX, e.clientY); return; }
  const tbl = e.target.closest('.tbl');
  if (tbl) {
    const row = e.target.closest('.row');
    if (row) editCol(row.dataset.t, row.dataset.c, 'cname'); else if (e.target.closest('.tbl-h')) editTableName(tbl.dataset.t);
    return;
  }
  const note = e.target.closest('.note'); if (note) { editNote(note.dataset.n); return; }
  const p = toWorld(e); newTableAt(p.x - 130, p.y - 19);
});

vp.addEventListener('contextmenu', e => {
  e.preventDefault(); closePop();
  const row = e.target.closest('.row'), tbl = e.target.closest('.tbl'), note = e.target.closest('.note'), rel = e.target.closest('.rel');
  const X = e.clientX, Y = e.clientY;
  const oval = e.target.closest('.oval'), rnx = e.target.closest('.rn');
  if (oval) {
    const owner = own(oval.dataset.o), c = owner && owner.cols.find(x => x.id === oval.dataset.c); if (!c) return;
    selectOval(oval); const isT = !!T(owner.id), kd = (k, label) => ({ label, on: (c.kind || 'simple') === k, act: () => { setKind(c, k); render(); commit(); } });
    openMenu(X, Y, [
      { label: 'Rename attribute', icon: 'edit', act: () => editOval(owner.id, c.id) }, { sep: 1 },
      ...(isT ? [{ label: 'Key attribute (underlined)', on: c.pk, act: () => { c.pk = !c.pk; if (c.pk) { c.nn = true; c.pkp = false; c.kind = 'simple'; } render(); commit(); } }, { label: 'Partial key (dashed underline)', on: c.pkp, act: () => { c.pkp = !c.pkp; if (c.pkp) { c.pk = false; c.nn = true; c.kind = 'simple'; } render(); commit(); } }] : []),
      kd('simple', 'Simple'), kd('multi', 'Multivalued (double oval)'), kd('derived', 'Derived (dashed oval)'), kd('composite', 'Composite (sub-attributes)'), { sep: 1 },
      { label: 'Reset position', icon: 'undo', disabled: c.ox == null, act: () => { c.ox = null; c.oy = null; render(); commit(); } },
      { label: 'Delete attribute', icon: 'trash', danger: true, act: () => deleteCol(owner.id, c.id) }
    ]);
  } else if (rnx) {
    const n = getNode(rnx.dataset.n); select('rnode', n.id); const sh = (k, label) => ({ label, on: n.shape === k, act: () => { n.shape = k; render(); commit(); } });
    openMenu(X, Y, [
      { label: 'Rename', icon: 'edit', act: () => editRnodeName(n.id) },
      { label: 'Add attribute', icon: 'plus', act: () => { const c = addCol(n); SEL = { type: 'rnode', id: n.id, col: c.id }; render(); commit(); editOval(n.id, c.id); } }, { sep: 1 },
      sh('diamond', 'Diamond'), sh('double', 'Double diamond'), sh('triangle', 'Triangle'),
      ...(n.kind === 'rel' ? [{ label: 'Associative entity (boxed)', on: n.assoc, act: () => { n.assoc = !n.assoc; render(); commit(); } }] : [
        { label: 'Disjoint (d)', on: n.dc === 'd', act: () => { n.dc = 'd'; render(); commit(); } }, { label: 'Overlapping (o)', on: n.dc === 'o', act: () => { n.dc = 'o'; render(); commit(); } },
        { label: 'Total specialization', on: n.total, act: () => { n.total = !n.total; render(); commit(); } }]),
      { sep: 1 }, { label: 'Delete', icon: 'trash', danger: true, act: () => deleteRnode(n.id) }
    ]);
  } else if (row && tbl) {
    const t = T(tbl.dataset.t), c = t.cols.find(x => x.id === row.dataset.c); select('table', t.id, c.id);
    const tog = (k, label) => ({ label, on: c[k], act: () => { c[k] = !c[k]; if (k === 'pk' && c.pk) c.nn = true; render(); commit(); } });
    const kd = (k, label) => ({ label, on: (c.kind || 'simple') === k, act: () => { setKind(c, k); render(); commit(); } });
    openMenu(X, Y, [
      { label: 'Rename column', icon: 'edit', act: () => editCol(t.id, c.id, 'cname') },
      { label: 'Change type', icon: 'edit', act: () => editCol(t.id, c.id, 'ctype'), disabled: !S.showTypes },
      { sep: 1 }, tog('pk', 'Primary key'), tog('pkp', 'Partial key'), tog('nn', 'Not null'), tog('uq', 'Unique'), tog('ai', 'Auto increment'), tog('un', 'Unsigned'),
      { sep: 1 }, kd('simple', 'Simple attribute'), kd('multi', 'Multivalued'), kd('derived', 'Derived'), kd('composite', 'Composite'),
      { sep: 1 },
      { label: 'Move up', icon: 'up', act: () => moveCol(t.id, c.id, -1) }, { label: 'Move down', icon: 'down', act: () => moveCol(t.id, c.id, 1) },
      { label: 'Duplicate column', icon: 'copy', act: () => dupCol(t.id, c.id) },
      { label: 'Delete column', icon: 'trash', danger: true, act: () => deleteCol(t.id, c.id) }
    ]);
  } else if (tbl) {
    const t = T(tbl.dataset.t); select('table', t.id);
    openMenu(X, Y, [
      { label: 'Rename table', icon: 'edit', act: () => editTableName(t.id) },
      { label: 'Add column', icon: 'plus', act: () => { const c = addCol(t); SEL = { type: 'table', id: t.id, col: c.id }; render(); commit(); editCol(t.id, c.id, 'cname'); } },
      { label: 'Change colour', icon: 'edit', act: () => openColorPop(t, X, Y) },
      { label: 'Weak entity (double border)', on: t.weak, act: () => { t.weak = !t.weak; render(); commit(); } },
      { label: 'Duplicate table', icon: 'copy', kbd: 'Ctrl+D', act: () => dupTable(t.id) },
      { sep: 1 }, { label: 'Delete table', icon: 'trash', danger: true, act: () => deleteTable(t.id) }
    ]);
  } else if (note) {
    const n = getNote(note.dataset.n); select('note', n.id);
    openMenu(X, Y, [{ label: 'Edit text', icon: 'edit', act: () => editNote(n.id) }, { sep: 1 }, { label: 'Delete note', icon: 'trash', danger: true, act: () => { S.notes = S.notes.filter(x => x.id !== n.id); SEL = { type: null, id: null, col: null }; render(); commit(); } }]);
  } else if (rel) {
    const r = getRel(rel.dataset.r); select('rel', r.id);
    openMenu(X, Y, [
      { label: 'Edit relationship', icon: 'edit', act: () => openRelPop(r.id, X, Y) },
      { label: r.label ? 'Edit label' : 'Add label', icon: 'edit', act: () => editRelLabel(r.id) },
      { label: 'Swap direction', icon: 'swap', act: () => { swapRel(r); render(); commit(); } },
      { label: 'Reset line shape', icon: 'undo', disabled: !r.bend, act: () => { r.bend = null; render(); commit(); } },
      { label: 'Auto-attach sides', icon: 'link', disabled: !(r.fs || r.ts), act: () => { r.fs = ''; r.ts = ''; render(); commit(); } },
      { sep: 1 }, { label: 'Delete relationship', icon: 'trash', danger: true, act: () => { S.rels = S.rels.filter(x => x.id !== r.id); SEL = { type: null, id: null, col: null }; render(); commit(); } }
    ]);
  } else {
    const p = toWorld(e); select(null);
    openMenu(X, Y, [
      { label: 'Add table here', icon: 'table', act: () => newTableAt(p.x - 130, p.y - 19) },
      { label: 'Add note here', icon: 'note', act: () => addNoteAt(p.x, p.y) },
      { sep: 1 }, { label: 'Auto-arrange tables', icon: 'arrange', act: arrange }, { label: 'Fit to screen', icon: 'fit', kbd: 'F', act: fitView }
    ]);
  }
});

/* =====================================================================
   Layout, notes
   ===================================================================== */
function addNoteAt(x, y) {
  const n = { id: uid('n_'), x: snapV(x), y: snapV(y), w: 200, h: 100, color: NOTE_COLORS[S.notes.length % NOTE_COLORS.length], text: 'New note' };
  S.notes.push(n); SEL = { type: 'note', id: n.id, col: null }; render(); commit(); editNote(n.id);
}
function layout(tabs, ox, oy) {
  const ids = new Set(tabs.map(t => t.id)), adj = new Map(tabs.map(t => [t.id, new Set()]));
  S.rels.forEach(r => { if (r.from.t !== r.to.t && ids.has(r.from.t) && ids.has(r.to.t)) { adj.get(r.from.t).add(r.to.t); adj.get(r.to.t).add(r.from.t); } });
  const seen = new Set(), comps = [], singles = [];
  const order = tabs.slice().sort((a, b) => adj.get(b.id).size - adj.get(a.id).size);
  for (const root of order) {
    if (seen.has(root.id)) continue;
    const layers = []; let frontier = [root.id]; seen.add(root.id);
    while (frontier.length) { layers.push(frontier); const next = []; for (const id of frontier) for (const n of adj.get(id)) if (!seen.has(n)) { seen.add(n); next.push(n); } frontier = next; }
    if (layers.length === 1 && layers[0].length === 1) singles.push(T(root.id)); else comps.push(layers);
  }
  const big = isOv(), GX = big ? 380 : 120, GY = big ? 280 : 50; let cy = oy;
  for (const layers of comps) {
    let cx = ox, compH = 0;
    for (const layer of layers) {
      let y = cy, maxW = 0;
      for (const id of layer) { const t = T(id); t.x = cx; t.y = y; y += tH(t) + GY; maxW = Math.max(maxW, t.w); }
      compH = Math.max(compH, y - cy); cx += maxW + GX;
    }
    cy += compH + 30;
  }
  let rx = ox, rowH = 0, count = 0;
  for (const t of singles) {
    if (count && count % 4 === 0) { cy += rowH + GY; rx = ox; rowH = 0; }
    t.x = rx; t.y = cy; rx += t.w + GX; rowH = Math.max(rowH, tH(t)); count++;
  }
}
function arrange() {
  if (!S.tables.length) return; layout(S.tables, 40, 40);
  S.rnodes.forEach(n => { const ts = n.ends.map(e => T(e.t)).filter(Boolean); if (ts.length) { n.x = snapV(ts.reduce((a, t) => a + t.x + t.w / 2, 0) / ts.length); n.y = snapV(ts.reduce((a, t) => a + t.y + HH() / 2, 0) / ts.length); } });
  render(); commit(); fitView();
}

/* =====================================================================
   SQL export
   ===================================================================== */
function fmtDefault(v) {
  v = String(v).trim();
  if (/^(NULL|CURRENT_TIMESTAMP(\(\d*\))?|NOW\(\)|TRUE|FALSE|-?\d+(\.\d+)?|\(.*\)|'.*')$/i.test(v)) return v;
  return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
}
function genSQL(o = {}) {
  const q = n => BT + String(n).replace(/`/g, '``') + BT;
  const lit = x => "'" + String(x).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
  const numeric = /^(TINYINT|SMALLINT|MEDIUMINT|INT|INTEGER|BIGINT|DECIMAL|NUMERIC|FLOAT|DOUBLE|REAL)\b/i;
  const kindOf = c => c.kind || 'simple';
  const uns = c => (c.un && numeric.test(c.type)) ? ' UNSIGNED' : '';
  const pkOf = t => t.cols.filter(c => (c.pk || c.pkp) && kindOf(c) === 'simple');
  const out = [`-- ${S.name}`, `-- Generated by Crowfoot on ${new Date().toISOString().slice(0, 10)}`, '', 'SET NAMES utf8mb4;', 'SET FOREIGN_KEY_CHECKS = 0;', ''];
  const notes = [], alters = [], used = new Set(), tableNames = new Set(S.tables.map(t => t.name.toLowerCase()));
  const fkName = base => { const b = base.slice(0, 58); let n = b, i = 2; while (used.has(n)) n = b + '_' + i++; used.add(n); return n; };
  const fkAlter = (child, ccols, parent, pcols, del, upd) => alters.push(`ALTER TABLE ${q(child)}\n  ADD CONSTRAINT ${q(fkName('fk_' + child + '_' + ccols[0]))} FOREIGN KEY (${ccols.map(q).join(', ')}) REFERENCES ${q(parent)} (${pcols.map(q).join(', ')})\n  ON DELETE ${del} ON UPDATE ${upd};`);
  const tail = t => `) ENGINE=${t.engine || 'InnoDB'} DEFAULT CHARSET=${t.charset || 'utf8mb4'} COLLATE=${t.collation || 'utf8mb4_unicode_ci'}${t.comment ? ' COMMENT=' + lit(t.comment) : ''};`;
  const colLines = (label, cols) => {
    const L = [];
    for (const c of cols) {
      const k = kindOf(c);
      if (k === 'multi') continue;
      if (k === 'derived') {
        if (c.expr && c.expr.trim()) L.push(`  ${q(c.name)} ${c.type || 'INT'} GENERATED ALWAYS AS (${c.expr.trim()}) VIRTUAL${c.comment ? ' COMMENT ' + lit(c.comment) : ''}`);
        else notes.push(`-- Derived attribute ${label}.${c.name} is not stored. Add an expression to generate it.`);
        continue;
      }
      if (k === 'composite') {
        if (!(c.parts || []).length) notes.push(`-- Composite attribute ${label}.${c.name} has no parts and was skipped.`);
        (c.parts || []).forEach(pt => L.push(`  ${q(c.name + '_' + pt.name)} ${pt.type || 'VARCHAR(100)'} ${c.nn ? 'NOT NULL' : 'NULL'}`));
        continue;
      }
      let l = `  ${q(c.name)} ${c.type || 'INT'}`;
      l += uns(c) + ((c.nn || c.pk || c.pkp) ? ' NOT NULL' : ' NULL');
      if (c.def !== '' && c.def != null) l += ' DEFAULT ' + fmtDefault(c.def);
      if (c.ai) l += ' AUTO_INCREMENT';
      if (c.check && c.check.trim()) l += ' CHECK (' + c.check.trim().replace(/;+$/, '') + ')';
      if (c.comment) l += ' COMMENT ' + lit(c.comment);
      L.push(l);
    }
    return L;
  };
  // 1. entities
  for (const t of S.tables) {
    const lines = colLines(t.name, t.cols);
    if (!lines.length) { notes.push(`-- Table ${t.name} has no stored columns and was skipped.`); continue; }
    const pks = pkOf(t);
    if (pks.length) lines.push(`  PRIMARY KEY (${pks.map(c => q(c.name)).join(', ')})`);
    t.cols.filter(c => c.uq && !c.pk && kindOf(c) === 'simple').forEach(c => lines.push(`  UNIQUE KEY ${q(('uq_' + t.name + '_' + c.name).slice(0, 64))} (${q(c.name)})`));
    if (o.drop) out.push(`DROP TABLE IF EXISTS ${q(t.name)};`);
    out.push(`CREATE TABLE ${q(t.name)} (`, lines.join(',\n'), tail(t), '');
  }
  // 2. multivalued attributes get their own table
  for (const t of S.tables) for (const c of t.cols.filter(x => kindOf(x) === 'multi')) {
    const pks = pkOf(t);
    if (!pks.length) { notes.push(`-- Multivalued attribute ${t.name}.${c.name} needs a primary key on ${t.name} before it can get its own table.`); continue; }
    const tn = t.name + '_' + c.name, f = pks.map(p => ({ name: singular(t.name) + '_' + p.name, p }));
    const lines = f.map(x => `  ${q(x.name)} ${x.p.type}${uns(x.p)} NOT NULL`);
    lines.push(`  ${q(c.name)} ${c.type || 'VARCHAR(255)'} NOT NULL`, `  PRIMARY KEY (${[...f.map(x => q(x.name)), q(c.name)].join(', ')})`);
    if (o.drop) out.push(`DROP TABLE IF EXISTS ${q(tn)};`);
    out.push(`CREATE TABLE ${q(tn)} (`, lines.join(',\n'), tail(t), ''); tableNames.add(tn.toLowerCase());
    fkAlter(tn, f.map(x => x.name), t.name, pks.map(p => p.name), 'CASCADE', 'CASCADE');
  }
  // 3. relationship nodes (diamonds)
  const pending = [];
  for (const n of S.rnodes.filter(x => x.kind !== 'isa')) {
    const label = n.name || 'relationship', ends = n.ends.map(e => ({ e, t: T(e.t) })).filter(x => x.t);
    if (ends.length < 2) { notes.push(`-- Relationship "${label}" needs at least two participants and was skipped.`); continue; }
    const bad = ends.find(x => !pkOf(x.t).length);
    if (bad) { notes.push(`-- Relationship "${label}": table ${bad.t.name} has no primary key, so it was skipped.`); continue; }
    const maxOne = k => k === 'exactly-one' || k === 'one' || k === 'zero-one';
    const one = ends.length === 2 && !n.assoc ? ends.filter(x => maxOne(x.e.card)) : [];
    if (one.length) {
      const parent = one.length === 2 ? ends[1] : one[0], child = one.length === 2 ? ends[0] : ends.find(x => x !== one[0]);
      const f = pkOf(parent.t).map(p => ({ name: singular(parent.t.name) + '_' + p.name, p })), nn = parent.e.card === 'exactly-one';
      const parts = [];
      f.forEach(x => { if (!child.t.cols.some(c => c.name.toLowerCase() === x.name.toLowerCase())) parts.push(`ADD COLUMN ${q(x.name)} ${x.p.type}${uns(x.p)} ${nn ? 'NOT NULL' : 'NULL'}`); });
      colLines(label, n.cols).forEach(l => { const m = /^\s*`((?:[^`]|``)+)`/.exec(l); if (m && !child.t.cols.some(c => c.name === m[1])) parts.push('ADD COLUMN ' + l.trim()); });
      if (one.length === 2) parts.push(`ADD UNIQUE KEY ${q(fkName('uq_' + child.t.name + '_' + f[0].name))} (${f.map(x => q(x.name)).join(', ')})`);
      parts.push(`ADD CONSTRAINT ${q(fkName('fk_' + child.t.name + '_' + f[0].name))} FOREIGN KEY (${f.map(x => q(x.name)).join(', ')}) REFERENCES ${q(parent.t.name)} (${pkOf(parent.t).map(p => q(p.name)).join(', ')}) ON DELETE RESTRICT ON UPDATE CASCADE`);
      pending.push(`-- Relationship "${label}" is stored as a foreign key in ${q(child.t.name)}.\nALTER TABLE ${q(child.t.name)}\n  ${parts.join(',\n  ')};`);
    } else {
      let tn = label.trim().replace(/\s+/g, '_').toLowerCase() || 'relationship', base = tn, i = 2; while (tableNames.has(tn.toLowerCase())) tn = base + '_' + i++; tableNames.add(tn.toLowerCase());
      const names = new Set(), fcols = [], links = [];
      for (const x of ends) {
        const pk = pkOf(x.t), mine = [];
        for (const p of pk) { let nm = (x.e.role ? x.e.role.trim().replace(/\s+/g, '_').toLowerCase() : singular(x.t.name)) + '_' + p.name, b = nm, k = 2; while (names.has(nm)) nm = b + '_' + k++; names.add(nm); mine.push(nm); fcols.push({ name: nm, p }); }
        links.push({ t: x.t, mine, pk });
      }
      const lines = fcols.map(x => `  ${q(x.name)} ${x.p.type}${uns(x.p)} NOT NULL`);
      colLines(label, n.cols).forEach(l => lines.push(l));
      lines.push(`  PRIMARY KEY (${fcols.map(x => q(x.name)).join(', ')})`);
      const t0 = ends[0].t;
      if (o.drop) out.push(`DROP TABLE IF EXISTS ${q(tn)};`);
      out.push(`CREATE TABLE ${q(tn)} (`, lines.join(',\n'), tail(t0), '');
      links.forEach(l => fkAlter(tn, l.mine, l.t.name, l.pk.map(p => p.name), 'CASCADE', 'CASCADE'));
    }
  }
  // 4. ordinary FK links
  for (const r of S.rels) {
    const A = T(r.from.t), B = T(r.to.t); if (!A || !B) continue;
    const ca = A.cols.find(c => c.id === r.from.c), cb = B.cols.find(c => c.id === r.to.c); if (!ca || !cb) continue;
    if (isMany(r.fc) && isMany(r.tc)) { notes.push(`-- Many-to-many between ${q(A.name)}.${q(ca.name)} and ${q(B.name)}.${q(cb.name)}: add a junction table, no foreign key emitted.`); continue; }
    fkAlter(A.name, [ca.name], B.name, [cb.name], r.onDelete, r.onUpdate);
  }
  alters.push(...pending);
  // 5. ISA hierarchies
  for (const n of S.rnodes.filter(x => x.kind === 'isa')) {
    const sup = n.ends.find(e => e.role === 'super'), st = sup && T(sup.t);
    if (!st) { notes.push('-- An ISA hierarchy has no supertype and was skipped.'); continue; }
    const sp = pkOf(st);
    notes.push(`-- ISA ${st.name}: ${n.dc === 'o' ? 'overlapping' : 'disjoint'}, ${n.total ? 'total' : 'partial'} specialization.`);
    for (const e of n.ends) {
      if (e === sup) continue; const sub = T(e.t); if (!sub) continue; const kp = pkOf(sub);
      if (sp.length && kp.length === sp.length) fkAlter(sub.name, kp.map(c => c.name), st.name, sp.map(c => c.name), 'CASCADE', 'CASCADE');
      else notes.push(`-- ISA: ${sub.name} needs a primary key matching ${st.name} (${sp.map(c => c.name).join(', ')}) to link to its supertype.`);
    }
  }
  out.push(...alters.flatMap(a => [a, '']));
  if (notes.length) out.push(...notes, '');
  out.push('SET FOREIGN_KEY_CHECKS = 1;', '');
  return out.join('\n');
}
function showSQL() {
  const el = openModal('MySQL schema', `<label class="flex items-center gap-2 text-[13px] mb-2.5"><input type="checkbox" class="chk" id="sqlDrop"> Include DROP TABLE IF EXISTS</label><textarea class="code" id="sqlOut" readonly spellcheck="false"></textarea>`,
    `<button class="btn bordered" id="sqlCopy">${ICON.copy(15)}Copy</button><button class="btn solid" id="sqlDl">${ICON.download(15)}Download</button>`);
  const out = $('#sqlOut', el), upd = () => { out.value = genSQL({ drop: $('#sqlDrop', el).checked }); };
  upd(); $('#sqlDrop', el).addEventListener('change', upd);
  $('#sqlCopy', el).addEventListener('click', () => copyText(out.value));
  $('#sqlDl', el).addEventListener('click', () => saveFile(fileBase() + '.sql', out.value, 'text/plain'));
}
async function copyText(s) {
  try { await navigator.clipboard.writeText(s); toast('Copied to clipboard.'); return; } catch (e) {}
  try { const ta = $('#sqlOut') || document.createElement('textarea'); if (!ta.isConnected) { ta.value = s; document.body.appendChild(ta); } ta.select(); document.execCommand('copy'); if (!$('#sqlOut')) ta.remove(); toast('Copied to clipboard.'); }
  catch (e) { toast('Select the text and copy it manually.'); }
}
const fileBase = () => (S.name || 'diagram').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'diagram';
async function saveFile(name, data, mime) {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const dl = await window.claude.use('downloads');
      if (dl) {
        let fn = name; if (/\.sql$/i.test(fn)) fn += '.txt';
        await dl.save({ filename: fn, data }); toast('Saved ' + fn + (fn !== name ? ' (rename to .sql after saving)' : '')); return;
      }
    }
  } catch (err) { if (err && err.code === 'declined') return; }
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* =====================================================================
   SQL import
   ===================================================================== */
function splitTop(str, sep) {
  const out = []; let depth = 0, qt = null, cur = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (qt) { cur += ch; if (ch === '\\' && qt !== BT) cur += str[++i] || ''; else if (ch === qt) { if (str[i + 1] === qt) cur += str[++i]; else qt = null; } continue; }
    if (ch === "'" || ch === '"' || ch === BT) { qt = ch; cur += ch; continue; }
    if (ch === '(') depth++; else if (ch === ')') depth--;
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur); return out;
}
const IDENT = '(?:[`"\\[][^`"\\]]+[`"\\]]|[\\w$]+)';
const ident = s => { s = String(s).trim(); const m = s.match(/(?:[`"\[]([^`"\]]+)[`"\]]|([\w$]+))\s*$/); return m ? (m[1] || m[2]) : s; };
const identList = s => s.replace(/\(\s*\d+\s*\)/g, '').split(',').map(x => ident(x.replace(/\s+(ASC|DESC)\s*$/i, ''))).filter(Boolean);
function parseFKTail(rest) {
  const d = /ON\s+DELETE\s+(RESTRICT|CASCADE|SET\s+NULL|NO\s+ACTION|SET\s+DEFAULT)/i.exec(rest), u = /ON\s+UPDATE\s+(RESTRICT|CASCADE|SET\s+NULL|NO\s+ACTION|SET\s+DEFAULT)/i.exec(rest);
  const fix = m => m ? m[1].toUpperCase().replace(/\s+/g, ' ') : null;
  return { onDelete: fix(d) || 'RESTRICT', onUpdate: fix(u) || 'RESTRICT' };
}
function parseSQL(sql) {
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, '').replace(/^\s*#.*$/gm, '');
  const tables = [], fks = [];
  const fkRe = new RegExp('(?:CONSTRAINT\\s+' + IDENT + '\\s+)?FOREIGN\\s+KEY\\s*(?:' + IDENT + '\\s*)?\\(([^)]*)\\)\\s*REFERENCES\\s+(' + IDENT + '(?:\\s*\\.\\s*' + IDENT + ')?)\\s*\\(([^)]*)\\)([^,;]*)', 'i');
  for (const st of splitTop(sql, ';')) {
    const hm = new RegExp('^\\s*CREATE\\s+(?:TEMPORARY\\s+)?TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(' + IDENT + '(?:\\s*\\.\\s*' + IDENT + ')?)\\s*\\(', 'i').exec(st);
    if (hm) {
      const open = hm[0].length - 1; let depth = 0, qt = null, close = -1;
      for (let i = open; i < st.length; i++) {
        const ch = st[i];
        if (qt) { if (ch === qt) qt = null; continue; }
        if (ch === "'" || ch === '"' || ch === BT) { qt = ch; continue; }
        if (ch === '(') depth++; else if (ch === ')') { depth--; if (depth === 0) { close = i; break; } }
      }
      if (close < 0) continue;
      const body = st.slice(open + 1, close), tail = st.slice(close + 1);
      const t = { name: ident(hm[1]), cols: [], pk: [], uq: [], engine: (/ENGINE\s*=?\s*(\w+)/i.exec(tail) || [])[1] || 'InnoDB', charset: (/(?:CHARSET|CHARACTER\s+SET)\s*=?\s*(\w+)/i.exec(tail) || [])[1] || 'utf8mb4', collation: (/COLLATE\s*=?\s*(\w+)/i.exec(tail) || [])[1] || '', comment: ((/COMMENT\s*=?\s*'((?:[^']|'')*)'/i.exec(tail) || [])[1] || '').replace(/''/g, "'") };
      for (const raw of splitTop(body, ',')) {
        const def = raw.trim(); if (!def) continue; let m;
        if ((m = /^(?:CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY\s*(?:\w+\s*)?\(([^)]*)\)/i.exec(def))) { t.pk.push(...identList(m[1])); continue; }
        if ((m = /^(?:CONSTRAINT\s+\S+\s+)?UNIQUE(?:\s+(?:KEY|INDEX))?\s*(?:[`"\w$]+\s*)?\(([^)]*)\)/i.exec(def))) { const l = identList(m[1]); if (l.length === 1) t.uq.push(l[0]); continue; }
        if (/^(KEY|INDEX|FULLTEXT|SPATIAL|CHECK|PERIOD)\b/i.test(def)) continue;
        if ((m = fkRe.exec(def)) && /^(CONSTRAINT|FOREIGN)/i.test(def)) {
          const cs = identList(m[1]), rs = identList(m[3]), tr = parseFKTail(m[4]);
          cs.forEach((c, i) => fks.push({ table: t.name, col: c, rtable: ident(m[2]), rcol: rs[i] || rs[0], ...tr })); continue;
        }
        const dm = new RegExp('^\\s*(' + IDENT + ')\\s+([\\s\\S]*)$').exec(def); if (!dm) continue;
        const name = ident(dm[1]), rest = dm[2];
        const tm = /^([a-z]+(?:\s+precision)?(?:\s*\([^)]*\))?)/i.exec(rest);
        const type = normType((tm ? tm[1] : 'VARCHAR(255)').replace(/\s+/g, ' '));
        const dflt = /\bDEFAULT\s+('(?:[^'\\]|\\.|'')*'|\([^)]*\)|[^\s,]+(?:\([^)]*\))?)/i.exec(rest);
        let dv = dflt ? dflt[1] : ''; if (/^NULL$/i.test(dv)) dv = ''; else if (/^'.*'$/s.test(dv)) dv = dv.slice(1, -1).replace(/''/g, "'");
        const cm = /\bCOMMENT\s+'((?:[^'\\]|\\.|'')*)'/i.exec(rest);
        let chk = ''; { const ck = /\bCHECK\s*\(/i.exec(rest); if (ck) { let d = 1, i = ck.index + ck[0].length; const st = i; while (i < rest.length && d) { if (rest[i] === '(') d++; else if (rest[i] === ')') d--; i++; } if (!d) chk = rest.slice(st, i - 1).trim(); } }
        const c = { name, type, pk: /\bPRIMARY\s+KEY\b/i.test(rest), nn: /\bNOT\s+NULL\b/i.test(rest), uq: /\bUNIQUE(\s+KEY)?\b/i.test(rest), ai: /\bAUTO_INCREMENT\b/i.test(rest), un: /\bUNSIGNED\b/i.test(rest), def: dv, comment: cm ? cm[1].replace(/''/g, "'") : '', check: chk };
        const im = new RegExp('\\bREFERENCES\\s+(' + IDENT + '(?:\\s*\\.\\s*' + IDENT + ')?)\\s*\\(([^)]*)\\)([^,]*)', 'i').exec(rest);
        if (im) fks.push({ table: t.name, col: name, rtable: ident(im[1]), rcol: identList(im[2])[0], ...parseFKTail(im[3]) });
        t.cols.push(c);
      }
      tables.push(t); continue;
    }
    const am = new RegExp('^\\s*ALTER\\s+TABLE\\s+(' + IDENT + '(?:\\s*\\.\\s*' + IDENT + ')?)\\s+([\\s\\S]*)$', 'i').exec(st);
    if (am) {
      const tn = ident(am[1]);
      for (const part of splitTop(am[2], ',')) {
        const m = fkRe.exec(part); if (!m) continue; const cs = identList(m[1]), rs = identList(m[3]), tr = parseFKTail(m[4]);
        cs.forEach((c, i) => fks.push({ table: tn, col: c, rtable: ident(m[2]), rcol: rs[i] || rs[0], ...tr }));
      }
    }
  }
  return { tables, fks };
}
function importSQL(sql, append) {
  const res = parseSQL(sql);
  if (!res.tables.length) { toast('No CREATE TABLE statements found.'); return false; }
  const prev = S;
  let oldB = null;
  if (append && prev.tables.length) oldB = bounds();
  const base = append ? S : { name: 'Imported schema', notation: S.notation, lineStyle: S.lineStyle, grid: S.grid, snap: S.snap, showTypes: S.showTypes, tables: [], rels: [], notes: [], rnodes: [], attrView: S.attrView, hideFk: S.hideFk };
  S = base; const added = [];
  for (const p of res.tables) {
    const pks = new Set(p.pk.map(x => x.toLowerCase())), uqs = new Set(p.uq.map(x => x.toLowerCase()));
    const t = { id: uid('t_'), name: append ? uniqueName(S.tables, p.name) : p.name, x: 0, y: 0, w: 260, color: COLORS[(S.tables.length) % COLORS.length], comment: p.comment, engine: p.engine, charset: p.charset, collation: p.collation || 'utf8mb4_unicode_ci', cols: [] };
    for (const c of p.cols) { const pk = c.pk || pks.has(c.name.toLowerCase()); t.cols.push({ id: uid('c_'), name: c.name, type: c.type, pk, nn: c.nn || pk, uq: c.uq || uqs.has(c.name.toLowerCase()), ai: c.ai, un: c.un, def: c.def, comment: c.comment, check: c.check || '' }); }
    S.tables.push(t); added.push(t);
  }
  let skipped = 0;
  for (const f of res.fks) {
    const find = n => added.find(t => t.name.toLowerCase() === n.toLowerCase()) || S.tables.find(t => t.name.toLowerCase() === n.toLowerCase());
    const A = find(f.table), B = find(f.rtable);
    const ca = A && A.cols.find(c => c.name.toLowerCase() === f.col.toLowerCase()), cb = B && B.cols.find(c => c.name.toLowerCase() === (f.rcol || '').toLowerCase());
    if (!ca || !cb) { skipped++; continue; }
    const cards = defaultCards(ca);
    S.rels.push(mkRel({ t: A.id, c: ca.id }, { t: B.id, c: cb.id }, cards.fc, cards.tc, { onDelete: f.onDelete, onUpdate: f.onUpdate }));
  }
  layout(added, oldB ? oldB.x2 + 140 : 40, oldB ? oldB.y1 : 40);
  SEL = { type: null, id: null, col: null };
  render(); commit(); fitView();
  toast(`Imported ${added.length} table${added.length === 1 ? '' : 's'}${skipped ? ` (${skipped} foreign key${skipped === 1 ? '' : 's'} could not be matched)` : ''}.`);
  return true;
}
function showImport() {
  const el = openModal('Import MySQL schema',
    `<p class="text-[13px] muted mb-2.5" style="line-height:1.5">Paste CREATE TABLE statements (mysqldump output works). Foreign keys become relationships.</p>
     <textarea class="code" id="impSql" spellcheck="false" placeholder="CREATE TABLE users (&#10;  id INT UNSIGNED NOT NULL AUTO_INCREMENT,&#10;  email VARCHAR(190) NOT NULL,&#10;  PRIMARY KEY (id)&#10;);"></textarea>
     <label class="flex items-center gap-2 text-[13px] mt-3"><input type="checkbox" class="chk" id="impAppend"> Add to the current diagram instead of replacing it</label>`,
    `<button class="btn bordered" id="impFile">${ICON.upload(15)}Choose .sql file</button><button class="btn solid" id="impGo">Import</button>`);
  $('#impFile', el).addEventListener('click', () => $('#fileSql').click());
  $('#impGo', el).addEventListener('click', () => { if (importSQL($('#impSql', el).value, $('#impAppend', el).checked)) closeModal(); });
  setTimeout(() => $('#impSql', el).focus(), 30);
}
$('#fileSql').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const txt = await f.text(), ta = $('#impSql'); if (ta) ta.value = txt; else importSQL(txt, false);
});

/* =====================================================================
   JSON + image export
   ===================================================================== */
function exportJSON() { saveFile(fileBase() + '.json', JSON.stringify({ app: 'crowfoot', version: 1, diagram: S }, null, 2), 'application/json'); }
$('#fileJson').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const o = JSON.parse(await f.text()); const d = o.diagram || o;
    if (!d || !Array.isArray(d.tables)) throw new Error('bad');
    S = normalize(d); SEL = { type: null, id: null, col: null }; hist = []; hi = -1; render(); commit(); fitView(); toast('Diagram loaded.');
  } catch (err) { toast('That file is not a Crowfoot diagram.'); }
});
function buildSVG() {
  const b = bounds(); if (!b) return null;
  const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim() || '#888';
  const C = { bg: v('--bg'), tbl: v('--tbl'), line: v('--line'), ink: v('--ink'), muted: v('--muted'), link: v('--link'), gold: v('--gold'), fk: v('--fk'), row: v('--rowline') };
  const FONT = `'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace`, PAD = 56, EXTRA = 70;
  const x0 = b.x1 - PAD - EXTRA, y0 = b.y1 - PAD, W = Math.ceil(b.x2 - b.x1 + PAD * 2 + EXTRA * 2), H = Math.ceil(b.y2 - b.y1 + PAD * 2);
  let links = '', tbls = '';
  const AG = (window.__aggRects ? window.__aggRects() : []).map(a => `<rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" rx="14" fill="none" stroke="${C.gold}" stroke-width="2" stroke-dasharray="8 5"/><text x="${a.x + 14}" y="${a.y - 6}" font-family="${FONT}" font-size="11" font-weight="700" fill="${C.gold}">${esc(a.label)}</text>`).join('');
  const fit = (s, maxW, font) => { s = String(s); if (textW(s, font) <= maxW) return s; while (s.length > 1 && textW(s + '…', font) > maxW) s = s.slice(0, -1); return s + '…'; };
  for (const r of S.rels) {
    const g = linkGeom(r); if (!g) continue;
    links += `<g>${relInner(r, g)}</g>`;
  }
  for (const t of S.tables) {
    if (isOv()) {
      if (t.weak) tbls += `<rect x="${t.x - 4}" y="${t.y - 4}" width="${t.w + 8}" height="${ENT_H + 8}" rx="13" fill="${C.tbl}" stroke="${C.line}"/>`;
      tbls += `<rect x="${t.x}" y="${t.y}" width="${t.w}" height="${ENT_H}" rx="10" fill="${esc(t.color)}"/><text x="${t.x + t.w / 2}" y="${t.y + ENT_H / 2 + 5}" text-anchor="middle" font-family="${FONT}" font-size="13.5" font-weight="700" fill="#fff">${esc(fit(t.name, t.w - 24, `700 13.5px ${FONT}`))}</text>`;
      continue;
    }
    const h = HEAD_H + t.cols.length * ROW_H + 8, fks = fkCols(t.id);
    if (t.weak) tbls += `<rect x="${t.x - 4}" y="${t.y - 4}" width="${t.w + 8}" height="${h + 8}" rx="13" fill="${C.tbl}" stroke="${C.line}"/>`;
    tbls += `<rect x="${t.x}" y="${t.y}" width="${t.w}" height="${h}" rx="10" fill="${C.tbl}" stroke="${C.line}"/>`;
    tbls += `<path d="M${t.x} ${t.y + HEAD_H}V${t.y + 10}Q${t.x} ${t.y} ${t.x + 10} ${t.y}H${t.x + t.w - 10}Q${t.x + t.w} ${t.y} ${t.x + t.w} ${t.y + 10}V${t.y + HEAD_H}Z" fill="${esc(t.color)}"/>`;
    tbls += `<text x="${t.x + 14}" y="${t.y + 24}" font-family="${FONT}" font-size="13.5" font-weight="700" fill="#fff">${esc(fit(t.name, t.w - 28, `700 13.5px ${FONT}`))}</text>`;
    t.cols.forEach((c, i) => {
      const ry = t.y + HEAD_H + i * ROW_H, ty = ry + ROW_H / 2 + 4;
      tbls += `<line x1="${t.x}" x2="${t.x + t.w}" y1="${ry}" y2="${ry}" stroke="${C.row}"/>`;
      const tag = (c.pk ? 'PK' : '') + (fks.has(c.id) ? (c.pk ? ' FK' : 'FK') : '');
      if (tag) tbls += `<text x="${t.x + 12}" y="${ty}" font-family="${FONT}" font-size="9" font-weight="700" fill="${c.pk ? C.gold : C.fk}">${tag}</text>`;
      const flags = [{ multi: 'MV', derived: 'DRV', composite: 'CMP' }[c.kind || 'simple'] || '', c.pkp ? 'PKP' : '', c.uq && !c.pk ? 'UQ' : '', c.ai ? 'AI' : '', c.un ? 'UN' : '', c.nn && !c.pk ? 'NN' : ''].filter(Boolean).join(' ');
      let rx = t.x + t.w - 12; const EM = window.__mode || 'p';
      if (flags && EM !== 'c') { tbls += `<text x="${rx}" y="${ty}" text-anchor="end" font-family="${FONT}" font-size="9" font-weight="700" fill="${C.muted}">${flags}</text>`; rx -= textW(flags, `700 9px ${FONT}`) + 10; }
      if (S.showTypes && EM === 'p') { const ty2 = fit(c.type, 110, `12px ${FONT}`); tbls += `<text x="${rx}" y="${ty}" text-anchor="end" font-family="${FONT}" font-size="12" fill="${C.muted}">${esc(ty2)}</text>`; rx -= textW(ty2, `12px ${FONT}`) + 12; }
      tbls += `<text x="${t.x + 46}" y="${ty}" font-family="${FONT}" font-size="12" ${c.pk ? 'font-weight="700"' : ''} fill="${C.ink}">${esc(fit(c.name, rx - (t.x + 46), `12px ${FONT}`))}</text>`;
    });
  }
  let notes = '';
  for (const n of S.notes) {
    notes += `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6" fill="${esc(n.color)}"/>`;
    const words = n.text.split(/(\s+)/); let line = '', y = n.y + 24; const lines = [];
    for (const w of words) { if (/\n/.test(w)) { lines.push(line); line = ''; continue; } if (textW(line + w, '500 12.5px system-ui') > n.w - 24 && line) { lines.push(line); line = w.trimStart(); } else line += w; }
    lines.push(line);
    for (const l of lines) { if (y > n.y + n.h - 8) break; notes += `<text x="${n.x + 12}" y="${y}" font-family="system-ui,sans-serif" font-size="12.5" font-weight="500" fill="#2a2410">${esc(l)}</text>`; y += 18; }
  }
  const css = `.link{fill:none;stroke:${C.link};stroke-width:1.7}.dash{stroke-dasharray:7 5}.link2{fill:none;stroke:${C.link};stroke-width:5.6}.link2i{fill:none;stroke:${C.bg};stroke-width:2}.gl{fill:none;stroke:${C.link};stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.gl .gf{fill:${C.bg}}.mult{font:600 11px ${FONT};fill:${C.link}}.rel-label rect{fill:${C.tbl};stroke:${C.line}}.rel-label text{font:500 11.5px system-ui,sans-serif;fill:${C.ink}}.chen-shape polygon{fill:${C.tbl};stroke:${C.link};stroke-width:1.7;stroke-linejoin:round}.chen-shape text{font:600 12px system-ui,sans-serif;fill:${C.ink}}` + nodeCSS({ link: C.link, bg: C.bg, tbl: C.tbl, ink: C.ink, muted: C.muted, mono: FONT, ui: 'system-ui,sans-serif' });
  return { w: W, h: H, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${x0} ${y0} ${W} ${H}"><style>${css}</style><rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="${C.bg}"/>${AG}${notes}${links}${nodesMarkup()}${tbls}</svg>` };
}
function exportSVG() { const o = buildSVG(); if (!o) return toast('Nothing to export yet.'); saveFile(fileBase() + '.svg', o.svg, 'image/svg+xml'); }
function exportPNG() {
  const o = buildSVG(); if (!o) return toast('Nothing to export yet.');
  const img = new Image();
  img.onload = () => {
    const sc = Math.min(2, 8000 / Math.max(o.w, o.h)), c = document.createElement('canvas'); c.width = Math.round(o.w * sc); c.height = Math.round(o.h * sc);
    const ctx = c.getContext('2d'); ctx.scale(sc, sc); ctx.drawImage(img, 0, 0, o.w, o.h);
    c.toBlob(b => b ? saveFile(fileBase() + '.png', b, 'image/png') : toast('Could not create the image.'), 'image/png');
  };
  img.onerror = () => toast('Could not create the image.');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(o.svg);
}

/* =====================================================================
   Toolbar, keyboard, theme, help
   ===================================================================== */
function newDiagram() { S = normalize({ name: 'Untitled diagram' }); SEL = { type: null, id: null, col: null }; hist = []; hi = -1; render(); commit(); fitView(); }
function loadSample() { S = normalize(sampleDiagram()); SEL = { type: null, id: null, col: null }; hist = []; hi = -1; render(); commit(); fitView(); }
function setTheme(t) { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); prefs.theme = t; savePrefs(); themeIcon(); }
function effTheme() { return document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
function themeIcon() { $('#btnTheme').innerHTML = effTheme() === 'dark' ? ICON.sun(17) : ICON.moon(17); }
function showHelp() {
  const rows = [['Double-click a name or type', 'Edit it in place'], ['Tab while editing', 'Jump to the next field, or add a column'], ['Drag a column dot onto another column', 'Create a relationship'], ['Drag from a table header dot', 'Connect and add the foreign key column'], ['Double-click a line', 'Change end symbols, label, style, actions'], ['Select a line, drag an end handle', 'Move that end to another column or the other side of the table'], ['Drag the diamond handle or the label', 'Bend or move the line (double-click handle to reset)'], ['Symbols menu: Chen (diamonds)', 'Textbook HAS / ISA diamonds with 1, N, M'], ['Drag the grip left of a column', 'Reorder columns'], ['Double-click empty canvas', 'Add a table'], ['Right-click', 'Context menu for tables, columns, lines'], ['Space + drag, or middle mouse', 'Pan the canvas'], ['Mouse wheel / Ctrl + wheel', 'Zoom (wheel behaviour is in the inspector)'], ['Relationship menu', 'Add diamond relationships, ISA and associative entities'], ['Drag the dot on a diamond onto a table', 'Add a participant (3 or more makes it n-ary)'], ['Attributes menu: Chen ovals', 'Show attributes as ovals and drag them anywhere'], ['Alt while dragging', 'Move without snapping'], ['Ctrl+Z / Ctrl+Shift+Z', 'Undo / redo'], ['Ctrl+D', 'Duplicate selected table'], ['Delete', 'Delete selected column, line, note or table'], ['N / F / + / -', 'New table / fit view / zoom']];
  openModal('Shortcuts and tips', `<div class="grid gap-y-2.5" style="grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);column-gap:18px;font-size:13px">${rows.map(r => `<div>${esc(r[0])}</div><div class="muted">${esc(r[1])}</div>`).join('')}</div>`);
}
$('#icoTable').innerHTML = ICON.table(16); $('#icoNote').innerHTML = ICON.note(16); $('#icoArrange').innerHTML = ICON.arrange(16); $('#icoFit').innerHTML = ICON.fit(16); $('#icoDl').innerHTML = ICON.download(16);
$('#btnUndo').innerHTML = ICON.undo(17); $('#btnRedo').innerHTML = ICON.redo(17); $('#btnHelp').innerHTML = ICON.help(17); $('#btnPanel').innerHTML = ICON.panel(17);
$('#icoRel').innerHTML = ICON.diamond(16); $('#zOut').innerHTML = ICON.minus(15); $('#zIn').innerHTML = ICON.plus(15);
$('#mysql-types').innerHTML = TYPES.map(t => `<option value="${esc(t)}"></option>`).join('');

$('#btnTable').addEventListener('click', () => { const c = viewCenter(); newTableAt(c.x - 130, c.y - 60); });
$('#btnNote').addEventListener('click', () => { const c = viewCenter(); addNoteAt(c.x - 100, c.y - 50); });
$('#btnUndo').addEventListener('click', undo); $('#btnRedo').addEventListener('click', redo);
$('#btnArrange').addEventListener('click', arrange); $('#btnFit').addEventListener('click', fitView);
$('#zIn').addEventListener('click', () => { const r = vp.getBoundingClientRect(); zoomAt(1.2, r.left + r.width / 2, r.top + r.height / 2); });
$('#zOut').addEventListener('click', () => { const r = vp.getBoundingClientRect(); zoomAt(1 / 1.2, r.left + r.width / 2, r.top + r.height / 2); });
$('#zLabel').addEventListener('click', () => { const r = vp.getBoundingClientRect(); zoomAt(1 / view.z, r.left + r.width / 2, r.top + r.height / 2); });
$('#btnTheme').addEventListener('click', () => setTheme(effTheme() === 'dark' ? 'light' : 'dark'));
$('#btnHelp').addEventListener('click', showHelp);
$('#btnPanel').addEventListener('click', () => { insp.classList.toggle('closed'); prefs.panel = !insp.classList.contains('closed'); savePrefs(); });
$('#selNotation').addEventListener('change', e => { S.notation = e.target.value; renderLinks(); commit(); });
$('#selLine').addEventListener('change', e => { S.lineStyle = e.target.value; S.rels.forEach(r => r.style = ''); render(); commit(); });
$('#selAttr').addEventListener('change', e => { S.attrView = e.target.value; render(); commit(); toast(S.attrView === 'ovals' ? 'Oval view on. Use Arrange to give the ovals room.' : 'Table row view on.'); });
$('#btnRel').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(), mk = t => () => { const c = viewCenter(); addRnode(t, c.x, c.y); }; openMenu(r.left, r.bottom + 6, [
  { label: 'Relationship (diamond)', icon: 'diamond', act: mk('rel') },
  { label: 'Associative entity', icon: 'table', act: mk('assoc') },
  { label: 'ISA (specialization)', icon: 'link', act: mk('isa') }
], e.currentTarget); });
$('#diagName').addEventListener('input', e => { S.name = e.target.value; });
$('#diagName').addEventListener('change', () => commit());
$('#diagName').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
$('#emptyTable').addEventListener('click', () => { const c = viewCenter(); newTableAt(c.x - 130, c.y - 60); });
$('#emptyImport').addEventListener('click', showImport);
$('#emptySample').addEventListener('click', loadSample);
$('#btnFile').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); openMenu(r.left, r.bottom + 6, [
  { label: 'New diagram', icon: 'plus', act: () => { newDiagram(); } },
  { label: 'Open sample schema', icon: 'table', act: loadSample },
  { sep: 1 },
  { label: 'Import SQL…', icon: 'upload', act: showImport },
  { label: 'Open JSON file…', icon: 'upload', act: () => $('#fileJson').click() }
], e.currentTarget); });
$('#btnExport').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); openMenu(Math.max(8, r.right - 220), r.bottom + 6, [
  { label: 'MySQL SQL…', icon: 'copy', act: showSQL },
  { label: 'PNG image', icon: 'download', act: exportPNG },
  { label: 'SVG image', icon: 'download', act: exportSVG },
  { label: 'Diagram JSON', icon: 'download', act: exportJSON }
], e.currentTarget); });

window.addEventListener('keydown', e => {
  const tag = (e.target.tagName || ''), typing = /INPUT|TEXTAREA|SELECT/.test(tag) || e.target.isContentEditable;
  if (e.key === 'Escape') { if (modal) closeModal(); else if (pop) closePop(); else if (!typing && SEL.type) select(null); return; }
  if (e.code === 'Space' && !typing && document.activeElement === document.body) { spaceDown = true; vp.classList.add('space'); e.preventDefault(); return; }
  if (typing || modal) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (mod && k === 'y') { e.preventDefault(); redo(); }
  else if (mod && k === 'd') { e.preventDefault(); if (SEL.type === 'table') dupTable(SEL.id); }
  else if (mod) return;
  else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (SEL.type === 'table') { e.preventDefault(); SEL.col && !e.shiftKey ? deleteCol(SEL.id, SEL.col) : deleteTable(SEL.id); }
    else if (SEL.type === 'rnode') { e.preventDefault(); SEL.col ? deleteCol(SEL.id, SEL.col) : deleteRnode(SEL.id); }
    else if (SEL.type === 'rel') { e.preventDefault(); S.rels = S.rels.filter(r => r.id !== SEL.id); SEL = { type: null, id: null, col: null }; render(); commit(); }
    else if (SEL.type === 'note') { e.preventDefault(); S.notes = S.notes.filter(n => n.id !== SEL.id); SEL = { type: null, id: null, col: null }; render(); commit(); }
  }
  else if (e.key === 'F2') { if (SEL.type === 'table') SEL.col ? editCol(SEL.id, SEL.col, 'cname') : editTableName(SEL.id); else if (SEL.type === 'rel') editRelLabel(SEL.id); else if (SEL.type === 'note') editNote(SEL.id); else if (SEL.type === 'rnode') editRnodeName(SEL.id); }
  else if (k === 'n') { e.preventDefault(); const c = viewCenter(); newTableAt(c.x - 130, c.y - 60); }
  else if (k === 'f') fitView();
  else if (e.key === '+' || e.key === '=') $('#zIn').click();
  else if (e.key === '-') $('#zOut').click();
});
window.addEventListener('keyup', e => { if (e.code === 'Space') { spaceDown = false; vp.classList.remove('space'); } });
window.addEventListener('resize', closePop);

/* =====================================================================
   Boot
   ===================================================================== */
(function init() {
  try { const p = JSON.parse(localStorage.getItem(PREF) || 'null'); if (p) prefs = Object.assign(prefs, p); } catch (e) {}
  if (prefs.theme) document.documentElement.setAttribute('data-theme', prefs.theme);
  themeIcon(); injectNodeCSS();
  if (matchMedia('(max-width:900px)').matches) insp.classList.add('closed'); else if (!prefs.panel) insp.classList.add('closed');
  let loaded = false;
  try {
    const o = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (o && o.S && Array.isArray(o.S.tables)) { S = normalize(o.S); if (o.view && isFinite(o.view.z)) view = o.view; loaded = true; }
  } catch (e) {}
  if (!loaded) S = normalize(sampleDiagram());
  hist = [JSON.stringify(S)]; hi = 0;
  render(); updateUndo(); applyView();
  if (!loaded) fitView();
})();

/* =====================================================================
   v2 additions: touch gestures, schema checker, data dictionary, query visualizer
   ===================================================================== */
(function v2() {
  const st = document.createElement('style');
  st.textContent = `
  #world.qv .tbl:not(.qhit){opacity:.14;transition:opacity .15s}
  #world.qv .rel:not(.qhit),#world.qv .rel-label:not(.qhit){opacity:.08}
  #world.qv .tbl.qhit{outline:2px solid var(--accent);outline-offset:3px;border-radius:8px}
  #world.qv .rel.qhit{filter:drop-shadow(0 0 3px var(--accent))}
  .zc{position:absolute;top:10px;right:10px;display:flex;flex-direction:column;gap:6px;z-index:20}
  .zc .btn{width:40px;height:40px;padding:0;justify-content:center;font-size:20px;background:var(--panel);border-color:var(--line);box-shadow:var(--shadow)}
  #qp{position:absolute;left:0;right:0;bottom:0;z-index:25;background:var(--panel);border-top:1px solid var(--line);box-shadow:var(--shadow);max-height:55%;display:none;flex-direction:column;user-select:text;-webkit-user-select:text;touch-action:pan-y}
  #qp.open{display:flex} #qp .qb{padding:10px 12px;overflow:auto;display:flex;flex-direction:column;gap:8px}
  #qp textarea{width:100%;min-height:84px;font-family:var(--mono);font-size:13px}
  .qt{width:100%;border-collapse:collapse;font-size:12px} .qt td,.qt th{padding:4px 6px;border-bottom:1px solid var(--rowline);text-align:left;vertical-align:top}
  .qok{color:var(--accent)} .qwn{color:var(--gold)} .qer{color:var(--danger)}
  .aggbox{position:absolute;border:2px dashed var(--accent);border-radius:14px;background:color-mix(in srgb,var(--accent) 5%,transparent);pointer-events:none;z-index:0}
  .aggbox span{position:absolute;top:-10px;left:14px;background:var(--panel);padding:0 6px;font:600 11px var(--ui);color:var(--accent)}
  @keyframes fx-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  @keyframes fx-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
  @keyframes fx-fade{from{opacity:0}to{opacity:1}}
  @keyframes fx-flash{0%,100%{box-shadow:0 0 0 0 transparent}30%{box-shadow:0 0 0 6px var(--accent)}}
  @keyframes fx-glow{0%,100%{filter:drop-shadow(0 0 2px var(--accent))}50%{filter:drop-shadow(0 0 7px var(--accent))}}
  .modal-back{animation:fx-fade .18s ease both}
  .modal{animation:fx-pop .22s cubic-bezier(.2,.8,.3,1) both}
  #qp.open{animation:fx-up .25s cubic-bezier(.2,.8,.3,1) both}
  #qOut>*,#tlRes>*,#nfOut>*{animation:fx-up .28s ease both}
  .qt tr{animation:fx-fade .3s ease both}
  .aggbox{animation:fx-pop .35s ease both}
  .zc .btn,.btn,.chipbtn{transition:transform .12s ease,background-color .15s ease,box-shadow .15s ease}
  .btn:active,.chipbtn:active{transform:scale(.94)}
  .zc{animation:fx-fade .4s ease both}
  #world.smooth{transition:transform .28s cubic-bezier(.2,.8,.3,1)}
  #world.qv .tbl{transition:opacity .25s ease,outline-color .25s ease}
  #world.qv .tbl.qhit{animation:fx-flash .9s ease 1}
  #world.qv .rel.qhit{animation:fx-glow 1.8s ease-in-out infinite}
  .tbl.flash{animation:fx-flash 1.1s ease 1}
  @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
  .topbar{width:100%;max-width:100vw;min-width:0}
  .tb-menu{display:none}
  .topbar.wrap{flex-wrap:wrap;height:auto!important;row-gap:4px;padding-top:6px;padding-bottom:6px;overflow-x:hidden}
  .topbar.wrap .tb-spacer,.topbar.wrap .sep{display:none}
  .topbar.compact{gap:2px;padding-left:6px;padding-right:6px}
  .topbar.compact .tb-menu{display:inline-flex}
  .topbar.compact .tb-sec,.topbar.compact .tb-logo{display:none}
  .topbar.compact.open{flex-wrap:wrap;height:auto!important;max-height:62vh;overflow-y:auto;row-gap:6px;padding-top:6px;padding-bottom:6px}
  .topbar.compact.open .tb-sec{display:flex}
  .topbar.compact.open .tb-spacer,.topbar.compact.open .sep{display:none}
  .topbar.compact.open #diagName{flex:1 1 100%;width:100%}
  .topbar.compact.open label.tb-sec{flex:1 1 44%;justify-content:space-between}
  @media (max-width:900px){
    .btn{min-height:38px}
    .fld,select.fld,textarea.fld,input.fld{font-size:16px}
    .modal-back{padding:0;align-items:flex-end}
    .modal{width:100%;max-height:92dvh;border-radius:16px 16px 0 0}
    .modal-b{overflow-x:auto}
    .modal-f{flex-wrap:wrap}.modal-f .btn{flex:1 1 150px;justify-content:center}
    #qp{max-height:62%;padding-bottom:env(safe-area-inset-bottom,0px)}
    .zc{top:8px;right:8px}
  }
  .flowdot{fill:var(--accent);pointer-events:none;filter:drop-shadow(0 0 3px var(--accent))}
  #btnAnim[aria-pressed="true"]{background:var(--accent);color:var(--on-accent)}
  #world.mode-c .ctype,#world.mode-c .row .chip,#world.mode-l .ctype{display:none!important}
  @media (max-width:900px){.zc .btn{width:44px;height:44px}}`;
  document.head.appendChild(st);

  /* ---- touch: pinch-zoom + two-finger pan ---- */
  const ptrs = new Map(); let pinch = null;
  vp.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || e.target.closest('[data-ui],input,textarea,select')) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      if (drag) onUp(e);
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
    if (ptrs.size >= 2) e.stopImmediatePropagation();
  }, true);
  window.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1, cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      zoomAt(d / pinch.d, cx, cy); view.x += cx - pinch.cx; view.y += cy - pinch.cy; applyView();
      pinch = { d, cx, cy }; e.stopImmediatePropagation();
    }
  }, true);
  const endPtr = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; };
  window.addEventListener('pointerup', endPtr, true); window.addEventListener('pointercancel', endPtr, true);

  const smooth = () => { world.classList.add('smooth'); clearTimeout(smooth.t); smooth.t = setTimeout(() => world.classList.remove('smooth'), 400); };
  const zc = document.createElement('div'); zc.className = 'zc'; zc.setAttribute('data-ui', '');
  zc.innerHTML = `<button class="btn" data-z="in" aria-label="Zoom in">+</button><button class="btn" data-z="out" aria-label="Zoom out">&minus;</button><button class="btn" data-z="fit" aria-label="Fit to screen">${ICON.fit(18)}</button>`;
  zc.addEventListener('click', e => {
    const b = e.target.closest('[data-z]'); if (!b) return; const r = vp.getBoundingClientRect();
    smooth(); if (b.dataset.z === 'fit') fitView(); else zoomAt(b.dataset.z === 'in' ? 1.25 : 0.8, r.left + r.width / 2, r.top + r.height / 2);
  });
  vp.appendChild(zc);

  /* ---- helpers ---- */
  const baseType = c => (String(c.type).replace(/\(.*\)/, '').toUpperCase() + (c.un ? ' UNSIGNED' : '')).trim();
  const colOf = (t, n) => t && t.cols.find(c => c.name.toLowerCase() === String(n).toLowerCase());
  const dl = (name, text, mime) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  function focusTables(ids) {
    const ts = ids.map(T).filter(Boolean); if (!ts.length) return; const r = vp.getBoundingClientRect(), pad = 60;
    const x1 = Math.min(...ts.map(t => t.x)), y1 = Math.min(...ts.map(t => t.y)), x2 = Math.max(...ts.map(t => t.x + t.w)), y2 = Math.max(...ts.map(t => t.y + tH(t)));
    smooth(); const z = clamp(Math.min((r.width - pad * 2) / (x2 - x1), (r.height * 0.55 - pad) / (y2 - y1)), 0.1, 1.2);
    view.z = z; view.x = (r.width - (x2 - x1) * z) / 2 - x1 * z; view.y = 30 - y1 * z; applyView();
  }

  /* ---- schema checker (textbook design checks) ---- */
  const RESERVED = 'order group select table index key user rank condition read write'.split(' ');
  function lint() {
    const out = [], add = (lvl, t, msg) => out.push({ lvl, t, msg });
    const linked = new Set(); S.rels.forEach(r => { linked.add(r.from.t); linked.add(r.to.t); });
    S.tables.forEach(t => {
      if (!t.cols.some(c => c.pk)) add('er', t.name, 'No primary key (entity integrity).');
      if (S.tables.length > 1 && !linked.has(t.id)) add('wn', t.name, 'Not connected to any relationship.');
      if (RESERVED.includes(t.name.toLowerCase())) add('wn', t.name, 'Reserved or risky MySQL word as table name.');
      const seen = {}, stems = {};
      t.cols.forEach(c => {
        const k = c.name.toLowerCase(); if (seen[k]) add('er', t.name, 'Duplicate column ' + c.name); seen[k] = 1;
        const m = /^(.*?)_?\d+$/.exec(c.name); if (m && m[1]) (stems[m[1]] = stems[m[1]] || []).push(c.name);
        if (/_id$/i.test(c.name) && !c.pk && !S.rels.some(r => r.from.t === t.id && r.from.c === c.id)) add('wn', t.name + '.' + c.name, 'Looks like a foreign key but has no relationship.');
        if (c.pk && !c.nn) add('wn', t.name + '.' + c.name, 'Primary key column should be NOT NULL.');
      });
      Object.keys(stems).forEach(k => { if (stems[k].length > 1) add('wn', t.name, 'Repeating group ' + stems[k].join(', ') + ' (violates 1NF).'); });
    });
    S.rels.forEach(r => {
      const A = T(r.from.t), B = T(r.to.t); if (!A || !B) return; const a = colOf(A, (A.cols.find(c => c.id === r.from.c) || {}).name), b = B.cols.find(c => c.id === r.to.c);
      const ac = A.cols.find(c => c.id === r.from.c); if (!ac || !b) return;
      if (baseType(ac) !== baseType(b)) add('er', A.name + '.' + ac.name, `FK type ${baseType(ac)} differs from ${B.name}.${b.name} (${baseType(b)}).`);
    });
    const TOT = /^(exactly-one|one|one-many)$/;
    S.tables.filter(t => t.weak).forEach(t => {
      if (!t.cols.some(c => c.pkp)) add('er', t.name, 'Weak entity has no partial key (discriminator).');
      const rs = S.rels.filter(r => r.from.t === t.id || r.to.t === t.id);
      if (!rs.length) { add('er', t.name, 'Weak entity has no identifying relationship to an owner.'); return; }
      const idr = rs.filter(r => TOT.test(r.from.t === t.id ? r.fc : r.tc));
      if (!idr.length) add('er', t.name, 'No relationship with total participation of the weak entity (identifying relationship needs it).');
      idr.forEach(r => { if (r.from.t !== t.id) return; const c = t.cols.find(x => x.id === r.from.c), o = T(r.to.t);
        if (c && !c.pk && !c.pkp) add('wn', t.name + '.' + c.name, 'Owner key (' + (o ? o.name : '?') + ') should be part of the weak entity key.'); });
    });
    const pairs = {};
    S.rels.forEach(r => { const k = [r.from.t, r.to.t].sort().join('|'); (pairs[k] = pairs[k] || []).push(r); });
    Object.keys(pairs).forEach(k => pairs[k].forEach(r => {
      const A = T(r.from.t), B = T(r.to.t); if (!A || !B || (r.label || '').trim()) return;
      if (r.from.t === r.to.t) add('wn', A.name, 'Recursive relationship needs a role/label (e.g. manages, reports to).');
      else if (pairs[k].length > 1) add('wn', A.name + ' – ' + B.name, 'Several relationships between these tables: give each a label so the roles are clear.');
    }));
    (S.rnodes || []).forEach(m => m.ends.forEach(e => { if (e.agg && !(S.rnodes.find(x => x.id === e.agg) || {}).agg) add('er', m.name || 'relationship', 'Points at an aggregation that no longer exists.'); }));
    const seenR = {};
    S.rels.forEach(r => {
      const A = T(r.from.t), B = T(r.to.t); if (!A || !B) return;
      const k = [r.from.t + ':' + r.from.c, r.to.t + ':' + r.to.c].sort().join('|');
      if (seenR[k]) add('wn', A.name + ' – ' + B.name, 'Duplicate relationship between the same columns.'); seenR[k] = 1;
      if (/many/.test(r.fc) && /many/.test(r.tc)) add('wn', A.name + ' – ' + B.name, 'Direct many-to-many: add an associative (junction) table before generating SQL.');
    });
    return out;
  }
  function dictionary() {
    let md = '# Data dictionary: ' + S.name + '\n';
    S.tables.forEach(t => {
      md += `\n## ${t.name}\n\n| Column | Type | Key | Null | Default | Comment |\n|---|---|---|---|---|---|\n`;
      t.cols.forEach(c => {
        const fk = S.rels.find(r => r.from.t === t.id && r.from.c === c.id), ref = fk && T(fk.to.t), rc = ref && ref.cols.find(x => x.id === fk.to.c);
        const key = [c.pk ? 'PK' : '', fk && rc ? `FK→${ref.name}.${rc.name}` : '', c.uq ? 'UQ' : ''].filter(Boolean).join(', ');
        md += `| ${c.name} | ${c.type}${c.un ? ' UNSIGNED' : ''} | ${key} | ${c.nn ? 'NO' : 'YES'} | ${c.def || ''} | ${String(c.comment || '').replace(/\|/g, '/')} |\n`;
      });
    });
    return md;
  }
  function openTools() {
    const el = openModal('Schema tools', `
      <div class="lbl">Find table</div><input class="fld" id="tlFind" style="width:100%" placeholder="Type to search tables and columns" spellcheck="false"><div id="tlRes" class="mt-1.5 flex flex-wrap gap-1.5"></div>
      <div class="lbl mt-3">Relationship degree</div><div id="tlDeg" style="overflow-x:auto"></div><div class="lbl mt-3">Inheritance (ISA)</div><div id="tlIsa"></div><div class="lbl mt-3">Aggregation</div><div id="tlAgg"></div><div class="lbl mt-3">Design checks</div><div id="tlLint"></div><div class="lbl mt-3">Keys</div><div id="tlKeys" style="overflow-x:auto"></div>`,
      `<button class="btn bordered" id="tlMd">${ICON.download(15)}Data dictionary (.md)</button><button class="btn bordered" id="tlFocus">Clear query highlight</button>`);
    const DN = n => ({ 1: 'Unary', 2: 'Binary', 3: 'Ternary' }[n] || n + '-ary');
    const dr = [];
    S.rels.forEach(r => { const A = T(r.from.t), B = T(r.to.t); if (A && B) dr.push([r.label || '(unnamed)', r.from.t === r.to.t ? [A.name] : [A.name, B.name], r.from.t === r.to.t ? 1 : 2]); });
    (S.rnodes || []).filter(n => n.kind === 'rel').forEach(n => dr.push([n.name || '(unnamed)', n.ends.map(e => (T(e.t) || {}).name || '?'), n.ends.length]));
    $('#tlDeg', el).innerHTML = dr.length ? `<table class="qt"><tr><th>Relationship</th><th>Participants</th><th>Degree</th></tr>${dr.map(x => `<tr><td>${esc(x[0])}</td><td class="mono">${esc(x[1].join(', '))}</td><td>${x[2]} (${DN(x[2])})</td></tr>`).join('')}</table>` : '<div class="muted text-[13px]">No relationships yet.</div>';
    const isa = (S.rnodes || []).filter(n => n.kind === 'isa').map(n => { const sp = T((n.ends.find(e => e.role === 'super') || {}).t); if (!sp) return ''; const subs = n.ends.filter(e => e.role !== 'super').map(e => T(e.t)).filter(Boolean);
      return `<div class="text-[12.5px] mb-2"><b class="mono">${esc(sp.name)}</b> <span class="muted">(${n.dc === 'o' ? 'overlapping' : 'disjoint'}, ${n.total ? 'total' : 'partial'})</span>${subs.map(u => `<div class="mono" style="padding-left:12px">↳ ${esc(u.name)}: <span class="muted">inherits ${esc(sp.cols.map(c => c.name).join(', ') || '—')}</span>${u.cols.length ? ' + own ' + esc(u.cols.map(c => c.name).join(', ')) : ''}</div>`).join('') || '<div class="muted" style="padding-left:12px">No subtypes</div>'}</div>`; }).join('');
    $('#tlIsa', el).innerHTML = isa || '<div class="muted text-[13px]">No ISA hierarchies yet.</div>';
    const ag = (S.rnodes || []).filter(n => n.kind === 'rel' && !n.assoc);
    const aggHTML = () => ag.length ? ag.map(n => `<div class="flex items-center gap-2 mb-1"><span class="mono text-[12.5px] flex-1">${esc(n.name || '(unnamed relationship)')}</span><button class="chipbtn" data-agg="${n.id}" style="${n.agg ? 'background:var(--accent);color:var(--on-accent)' : ''}">${n.agg ? 'Aggregated' : 'Aggregate'}</button></div>`).join('') + '<div class="muted text-[11.5px]">Draws a dashed box around a relationship and its participants so it can be treated as one unit.</div>' + (ag.some(n => n.agg) ? `<div class="lbl mt-2">Relate an aggregation to a table</div><div class="flex flex-wrap gap-1.5 items-center"><select class="fld" id="agA">${ag.filter(n => n.agg).map(n => `<option value="${n.id}">${esc(n.name || '(unnamed)')}</option>`).join('')}</select><select class="fld" id="agT">${S.tables.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select><button class="btn solid" data-aggnew="1">Create relationship</button></div>` : '') : '<div class="muted text-[13px]">Add a diamond relationship first.</div>';
    $('#tlAgg', el).innerHTML = aggHTML();
    $('#tlAgg', el).addEventListener('click', ev => { const nb = ev.target.closest('[data-aggnew]');
      if (nb) { ev.stopPropagation(); const a = S.rnodes.find(x => x.id === $('#agA', el).value), tb = T($('#agT', el).value), at = a && T((a.ends[0] || {}).t); if (!a || !tb || !at) return;
        S.rnodes.push({ id: uid('g_'), x: Math.round((a.x + tb.x + tb.w / 2) / 2), y: Math.round((a.y + tb.y) / 2) - 60, name: 'relates', kind: 'rel', shape: 'diamond', assoc: false, agg: false, dc: 'd', total: false, ends: [{ t: at.id, agg: a.id, card: 'zero-many', role: '' }, { t: tb.id, agg: '', card: 'zero-many', role: '' }], cols: [] });
        commit(); render(); closeModal(); toast('Relationship created between the aggregation and ' + tb.name); return; }
      const b = ev.target.closest('[data-agg]'); if (!b) return; ev.stopPropagation(); const n = S.rnodes.find(x => x.id === b.dataset.agg); n.agg = !n.agg; let cl = 0; if (!n.agg) S.rnodes.forEach(m => m.ends.forEach(e => { if (e.agg === n.id) { e.agg = ''; cl++; } })); commit(); render(); if (cl) toast(cl + ' relationship end(s) detached from the removed aggregation'); $('#tlAgg', el).innerHTML = aggHTML(); });
    const nm = t => t.cols.filter(c => c.pk).map(c => c.name);
    $('#tlKeys', el).innerHTML = `<table class="qt"><tr><th>Table</th><th>Primary key</th><th>Other candidate keys</th></tr>${S.tables.map(t => { const pk = nm(t), cand = t.cols.filter(c => c.uq && c.nn && !c.pk).map(c => c.name), weak = t.cols.filter(c => c.uq && !c.nn && !c.pk).map(c => c.name);
      return `<tr><td class="mono">${esc(t.name)}</td><td class="mono ${pk.length ? '' : 'qer'}">${pk.length ? '(' + esc(pk.join(', ')) + ')' : 'none'}</td><td class="mono">${cand.map(c => '(' + esc(c) + ')').join(' ') || '—'}${weak.length ? `<div class="qwn">UNIQUE but nullable: ${esc(weak.join(', '))}</div>` : ''}</td></tr>`; }).join('')}</table><div class="muted text-[11.5px] mt-1">Candidate key = minimal unique, NOT NULL column set. Any superset of one is a superkey.</div>`;
    const res = lint();
    $('#tlLint', el).innerHTML = res.length ? `<table class="qt">${res.map(x => `<tr><td class="${x.lvl === 'er' ? 'qer' : 'qwn'}">${x.lvl === 'er' ? 'Error' : 'Warn'}</td><td class="mono">${esc(x.t)}</td><td>${esc(x.msg)}</td></tr>`).join('')}</table>` : '<div class="qok text-[13px]">No issues found.</div>';
    $('#tlFind', el).addEventListener('input', ev => {
      const q = ev.target.value.trim().toLowerCase();
      const m = q ? S.tables.filter(t => t.name.toLowerCase().includes(q) || t.cols.some(c => c.name.toLowerCase().includes(q))).slice(0, 30) : [];
      $('#tlRes', el).innerHTML = m.map(t => `<button class="chipbtn" data-go="${t.id}">${esc(t.name)}</button>`).join('');
    });
    el.addEventListener('click', ev => {
      const g = ev.target.closest('[data-go]'); if (g) { closeModal(); focusTables([g.dataset.go]); select('table', g.dataset.go); setTimeout(() => { const d = $('.tbl[data-t="' + g.dataset.go + '"]', world); if (d) { d.classList.add('flash'); setTimeout(() => d.classList.remove('flash'), 1200); } }, 300); }
    });
    $('#tlMd', el).onclick = () => dl((S.name || 'schema').replace(/\W+/g, '_') + '_dictionary.md', dictionary(), 'text/markdown');
    $('#tlFocus', el).onclick = () => { setQV(null); closeModal(); };
  }

  /* ---- query visualizer ---- */
  let QV = null;
  function applyQV() {
    world.classList.toggle('qv', !!QV);
    $$('.tbl', world).forEach(e => e.classList.toggle('qhit', !!QV && QV.tables.has(e.dataset.t)));
    $$('.rel,.rel-label', world).forEach(e => { const id = e.dataset.r || e.dataset.rl || (e.closest('[data-r]') || { dataset: {} }).dataset.r; e.classList.toggle('qhit', !!QV && QV.rels.has(id)); });
  }
  function setQV(v) { QV = v; applyQV(); }
  new MutationObserver(() => { if (QV) applyQV(); }).observe(world, { childList: true, subtree: true });

  function analyze(sql) {
    const q = sql.replace(/--.*$/gm, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/"(?:[^"\\]|\\.)*"/g, "''").replace(/`/g, '');
    const msgs = [], al = {}, tabs = new Set(), rels = new Set(), edges = [], connected = new Set();
    const add = (lvl, m) => msgs.push({ lvl, m });
    const NOT = '(?!(?:inner|left|right|cross|full|natural|join|straight_join|using|on|where|group|order|limit|having|union)\\b)';
    const fromRe = /\bfrom\b([\s\S]*?)(?=\bwhere\b|\bgroup\s+by\b|\border\s+by\b|\blimit\b|\bhaving\b|\bunion\b|[;)]|$)/gi; let m;
    while ((m = fromRe.exec(q))) {
      const seg = m[1].replace(/\bon\b[\s\S]*?(?=\b(?:inner|left|right|cross|full|natural|straight_join|join)\b|$)/gi, ' ').replace(/\busing\s*\([^)]*\)/gi, ' ');
      const ir = new RegExp('(?:^|\\bjoin\\b|,)\\s*(\\w+)(?:\\s+(?:as\\s+)?' + NOT + '(\\w+))?', 'gi'); let k;
      while ((k = ir.exec(seg))) {
        const t = S.tables.find(x => x.name.toLowerCase() === k[1].toLowerCase());
        if (!t) { if (!/^select$/i.test(k[1])) add('er', `Unknown table "${k[1]}".`); continue; }
        tabs.add(t.id); al[t.name.toLowerCase()] = t; if (k[2]) al[k[2].toLowerCase()] = t;
      }
    }
    if (!tabs.size) add('er', 'No known tables found in FROM / JOIN.');
    const joins = (q.match(/\bjoin\b/gi) || []).length, conds = (q.match(/\b(on|using)\b/gi) || []).length, cross = (q.match(/\bcross\s+join\b/gi) || []).length;
    if (joins - cross > conds) add('wn', 'A JOIN has no ON/USING condition (Cartesian product).');
    const eq = /(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/g;
    while ((m = eq.exec(q))) {
      const A = al[m[1].toLowerCase()], B = al[m[3].toLowerCase()]; if (!A || !B) continue;
      const ca = colOf(A, m[2]), cb = colOf(B, m[4]);
      if (!ca) { add('er', `Unknown column ${A.name}.${m[2]}.`); continue; } if (!cb) { add('er', `Unknown column ${B.name}.${m[4]}.`); continue; }
      const r = S.rels.find(r => (r.from.t === A.id && r.from.c === ca.id && r.to.t === B.id && r.to.c === cb.id) || (r.from.t === B.id && r.from.c === cb.id && r.to.t === A.id && r.to.c === ca.id));
      const any = r || S.rels.find(r => (r.from.t === A.id && r.to.t === B.id) || (r.from.t === B.id && r.to.t === A.id));
      let status = 'ok'; if (r) rels.add(r.id); else if (any) { rels.add(any.id); status = 'wn'; } else status = 'wn';
      connected.add(A.id); connected.add(B.id);
      edges.push({ txt: `${A.name}.${ca.name} = ${B.name}.${cb.name}`, status, note: r ? 'Matches defined relationship' : any ? 'Tables are related, but on different columns' : 'No relationship defined in the diagram' });
    }
    const usingRe = /\bjoin\b\s+(\w+)[\s\S]*?\busing\s*\(([^)]*)\)/gi;
    while ((m = usingRe.exec(q))) { const t = al[m[1].toLowerCase()]; if (t) connected.add(t.id); }
    if (tabs.size > 1) tabs.forEach(id => { if (!connected.has(id) && joins) add('wn', `${T(id).name} is not linked by any join condition.`); });
    if (tabs.size > 1 && !joins && !edges.length) add('wn', 'Several tables with no join condition.');
    const sel = (/\bselect\b([\s\S]*?)\bfrom\b/i.exec(q) || [])[1] || ''; const cols = []; let depth = 0, cur = '';
    for (const ch of sel) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { cols.push(cur); cur = ''; } else cur += ch; } if (cur.trim()) cols.push(cur);
    const outc = [], list = [...tabs].map(T);
    cols.forEach(raw => {
      const s = raw.replace(/^\s*(distinct|all)\s+/i, '').trim(); if (!s) return;
      const as = /\s+as\s+(\w+)\s*$/i.exec(s), body = s.replace(/\s+as\s+\w+\s*$/i, '').trim();
      if (body === '*') { list.forEach(t => t.cols.forEach(c => outc.push([t.name + '.' + c.name, c.type]))); return; }
      let x = /^(\w+)\.\*$/.exec(body); if (x) { const t = al[x[1].toLowerCase()]; if (t) t.cols.forEach(c => outc.push([t.name + '.' + c.name, c.type])); else add('er', `Unknown alias "${x[1]}".`); return; }
      x = /^(\w+)\.(\w+)$/.exec(body);
      if (x) { const t = al[x[1].toLowerCase()], c = colOf(t, x[2]); if (!t) add('er', `Unknown alias "${x[1]}".`); else if (!c) add('er', `Unknown column ${t.name}.${x[2]}.`); else outc.push([as ? as[1] : t.name + '.' + c.name, c.type]); return; }
      x = /^\w+$/.exec(body);
      if (x) { const hits = list.filter(t => colOf(t, body)); if (hits.length === 1) outc.push([as ? as[1] : body, colOf(hits[0], body).type]); else add(hits.length ? 'wn' : 'er', hits.length ? `Column "${body}" is ambiguous (${hits.map(t => t.name).join(', ')}).` : `Unknown column "${body}".`); return; }
      outc.push([as ? as[1] : body.slice(0, 40), /\bcount\s*\(/i.test(body) ? 'BIGINT' : /\b(sum|avg)\s*\(/i.test(body) ? 'DECIMAL' : 'expression']);
    });
    return { tabs, rels, edges, msgs, outc };
  }
  const qp = document.createElement('div'); qp.id = 'qp'; qp.setAttribute('data-ui', '');
  qp.innerHTML = `<div class="flex items-center gap-2 px-3 py-2 border-b" style="border-color:var(--line)"><strong class="text-[13px]">Query visualizer</strong><span class="muted text-[12px] flex-1">Highlights the tables and relationships a SELECT uses</span><button class="btn solid" id="qRun">Visualize</button><button class="btn bordered" id="qClr">Clear</button><button class="btn icon-btn" id="qX" aria-label="Close">${ICON.x(16)}</button></div>
  <div class="qb"><textarea class="fld" id="qIn" spellcheck="false" placeholder="SELECT o.id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id"></textarea><div id="qOut"></div></div>`;
  qp.addEventListener('wheel', e => e.stopPropagation()); vp.appendChild(qp);
  function runQ() {
    const sql = $('#qIn', qp).value.trim(); if (!sql) return;
    const a = analyze(sql), ids = [...a.tabs];
    setQV(a.tabs.size ? { tables: a.tabs, rels: a.rels } : null);
    const sc = { ok: 'qok', wn: 'qwn', er: 'qer' };
    $('#qOut', qp).innerHTML =
      `<div class="text-[12.5px]"><b>Tables used:</b> ${ids.map(i => `<span class="mono">${esc(T(i).name)}</span>`).join(' → ') || 'none'}</div>` +
      (a.edges.length ? `<table class="qt"><tr><th>Join condition</th><th>Check</th></tr>${a.edges.map(x => `<tr><td class="mono">${esc(x.txt)}</td><td class="${sc[x.status]}">${esc(x.note)}</td></tr>`).join('')}</table>` : '') +
      (a.msgs.length ? `<div class="text-[12.5px]">${a.msgs.map(x => `<div class="${sc[x.lvl]}">${x.lvl === 'er' ? 'Error: ' : 'Warning: '}${esc(x.m)}</div>`).join('')}</div>` : '') +
      (a.outc.length ? `<div class="lbl" style="margin:4px 0 0">Result shape (${a.outc.length} columns)</div><div style="overflow-x:auto"><table class="qt"><tr>${a.outc.map(c => `<th class="mono">${esc(c[0])}</th>`).join('')}</tr><tr>${a.outc.map(c => `<td class="muted mono">${esc(c[1])}</td>`).join('')}</tr></table></div>` : '');
    if (ids.length) focusTables(ids);
  }
  $('#qRun', qp).onclick = runQ;
  $('#qClr', qp).onclick = () => { $('#qIn', qp).value = ''; $('#qOut', qp).innerHTML = ''; setQV(null); };
  $('#qX', qp).onclick = () => { qp.classList.remove('open'); setQV(null); };
  const bar = $('#btnFile'), mk = (id, txt, fn) => { const b = document.createElement('button'); b.className = 'btn'; b.id = id; b.textContent = txt; b.onclick = fn; bar.parentNode.insertBefore(b, bar); };
  mk('btnQuery', 'Query', () => { qp.classList.toggle('open'); if (!qp.classList.contains('open')) setQV(null); else $('#qIn', qp).focus(); });
  mk('btnTools', 'Tools', openTools);
  function createMulti() {
    let n = 0;
    S.tables.slice().forEach(o => {
      const pks = o.cols.filter(c => c.pk); if (!pks.length) return;
      o.cols.filter(c => c.kind === 'multi').forEach((c, i) => {
        const t = addTable(o.x + o.w + 60, o.y + i * 140, o.name + '_' + c.name); t.cols = [];
        const fks = pks.map(k => addCol(t, { name: o.name + '_' + k.name, type: String(k.type).replace(/\s*auto_increment/i, ''), pk: true, un: k.un }));
        addCol(t, { name: c.name, type: c.type, pk: true });
        fks.forEach((f, j) => S.rels.push(mkRel({ t: t.id, c: f.id }, { t: o.id, c: pks[j].id }, 'zero-many', 'exactly-one')));
        o.cols = o.cols.filter(x => x !== c); n++;
      });
    });
    if (n) { SEL = { type: null, id: null, col: null }; render(); commit(); }
    closeModal(); toast(n ? n + ' table(s) created from multivalued attributes' : 'No multivalued attributes with a keyed owner found');
  }
  function openRel() {
    const rows = [], notes = [], extra = [];
    S.tables.forEach(t => {
      if (t.weak) {
        const TOTR = /^(exactly-one|one|one-many)$/;
        const r = S.rels.find(r => (r.from.t === t.id || r.to.t === t.id) && r.from.t !== r.to.t && TOTR.test(r.from.t === t.id ? r.fc : r.tc));
        const o = r && T(r.from.t === t.id ? r.to.t : r.from.t);
        if (!o) { notes.push(t.name + ': weak entity has no identifying relationship to an owner.'); return; }
        const fkc = r.from.t === t.id && t.cols.find(c => c.id === r.from.c);
        const opk = o.cols.filter(c => c.pk).map(c => o.name + '_' + c.name);
        if (!fkc && !opk.length) { notes.push(`${t.name}: owner ${o.name} has no primary key.`); return; }
        const own = t.cols.filter(c => (c.kind || 'simple') !== 'derived' && (c.kind || 'simple') !== 'multi' && c !== fkc).map(c => c.pkp ? '<u>' + esc(c.name) + '</u>' : esc(c.name));
        const fk = fkc ? ['<u>' + esc(fkc.name) + '</u>'] : opk.map(x => '<u>' + esc(x) + '</u>');
        rows.push(`<div class="mono text-[13px] mb-1.5">${esc(t.name)}(${[...fk, ...own].join(', ')}) <span class="muted">weak: FK ${esc(fkc ? fkc.name : opk.join(', '))} → ${esc(o.name)}</span> <span class="muted" style="font-style:italic"> · Rule: weak entity → owner key + partial key</span></div>`);
        return;
      }
      const cols = [];
      t.cols.forEach(c => {
        const k = c.kind || 'simple', nm = esc(c.name), u = x => c.pk ? '<u>' + x + '</u>' : x;
        if (k === 'derived') notes.push(`${t.name}.${c.name}: derived, not stored (computed when needed).`);
        else if (k === 'multi') {
          const pks = t.cols.filter(x => x.pk).map(x => t.name + '_' + x.name);
          if (!pks.length) notes.push(`${t.name}.${c.name}: multivalued, but ${t.name} has no primary key to reference.`);
          else extra.push(`<div class="mono text-[13px] mb-1.5">${esc(t.name + '_' + c.name)}(${[...pks, c.name].map(x => '<u>' + esc(x) + '</u>').join(', ')}) <span class="muted">FK (${esc(pks.join(', '))}) → ${esc(t.name)}</span> <span class="muted" style="font-style:italic"> · Rule: multivalued → own table</span></div>`);
        }
        else if (k === 'composite' && c.parts && c.parts.length) c.parts.forEach(q => cols.push(esc(c.name + '_' + q.name)));
        else cols.push(u(nm));
      });
      rows.push(`<div class="mono text-[13px] mb-1.5">${esc(t.name)}(${cols.join(', ')}) <span class="muted" style="font-style:italic"> · Rule: entity → table</span></div>`);
    });
    rows.push(...extra);
    const rm = [], jt = [];
    const endInfo = e => {
      const an = e.agg && (S.rnodes || []).find(x => x.id === e.agg);
      if (an) { const ts = an.ends.map(x => T(x.t)).filter(Boolean); return { name: an.name || ts.map(t => t.name).join('_'), cols: ts.flatMap(t => t.cols.filter(c => c.pk).map(c => t.name + '_' + c.name)), agg: true }; }
      const t = T(e.t); return t && { name: t.name, cols: t.cols.filter(c => c.pk).map(c => t.name + '_' + c.name) };
    };
    const jrow = (nm, k1, k2, attrs, a, b) => `<div class="mono text-[13px] mb-1.5">${esc(nm)}(${[k1, k2].map(x => '<u>' + esc(x) + '</u>').concat(attrs.map(esc)).join(', ')}) <span class="muted">FKs: ${esc(k1)} → ${esc(a)}, ${esc(k2)} → ${esc(b)}</span> <span class="muted" style="font-style:italic"> · Rule: M:N → junction table</span></div>`;
    S.rels.forEach(r => {
      const A = T(r.from.t), B = T(r.to.t), ca = A && A.cols.find(c => c.id === r.from.c), cb = B && B.cols.find(c => c.id === r.to.c); if (!ca || !cb) return;
      const fm = /many/.test(r.fc), tm = /many/.test(r.tc), ref = `${esc(A.name)}.${esc(ca.name)} → ${esc(B.name)}.${esc(cb.name)}`; let kind, msg, cls = 'qok';
      if (fm && tm) { kind = 'M:N'; msg = 'junction table created below'; const k1 = A.name + '_' + ca.name, k2 = B.name + '_' + cb.name; jt.push(jrow(r.label ? A.name + '_' + B.name + ' (' + r.label + ')' : A.name + '_' + B.name, k1 === k2 ? k1 + '_1' : k1, k2, [], A.name, B.name)); }
      else if (fm) { kind = 'N:1'; msg = `FK ${esc(ca.name)} in ${esc(A.name)} ✓`; }
      else if (tm) { kind = '1:N'; msg = `FK belongs in ${esc(B.name)}, but the line puts it in ${esc(A.name)}: use Swap direction`; cls = 'qwn'; }
      else { kind = '1:1'; msg = `FK ${esc(ca.name)} in ${esc(A.name)} must be UNIQUE${ca.uq || ca.pk ? ' ✓' : ' (not set yet)'}`; if (!(ca.uq || ca.pk)) cls = 'qwn'; }
      rm.push(`<div class="text-[12.5px] mb-1"><span class="mono">${ref}</span> <b>${kind}</b> <span class="${cls}">${msg}</span></div>`);
    });
    (S.rnodes || []).filter(n => n.kind === 'rel' && !n.assoc && n.ends.length === 2 && n.ends.every(e => /many/.test(e.card))).forEach(n => {
      const A = endInfo(n.ends[0]), B = endInfo(n.ends[1]); if (!A || !B) return;
      const ka = A.cols, kb = B.cols;
      if (!ka.length || !kb.length) { notes.push(`${n.name || 'M:N relationship'}: ${!ka.length ? A.name : B.name} has no primary key.`); return; }
      jt.push(jrow(n.name || A.name + '_' + B.name, ka.join(', '), kb.join(', '), n.cols.map(c => c.name), A.name + (A.agg ? ' (aggregation)' : ''), B.name + (B.agg ? ' (aggregation)' : '')));
    });
    if (jt.length) rows.push('<div class="lbl mt-3">Junction tables (M:N)</div>' + jt.join(''));
    const nt = [];
    (S.rnodes || []).filter(n => n.kind === 'rel' && !n.assoc && n.ends.length > 2).forEach(n => {
      const ps = n.ends.map(e => ({ t: endInfo(e), many: /many/.test(e.card) })); if (ps.some(x => !x.t)) return;
      const bad = ps.find(x => !x.t.cols.length); if (bad) { notes.push(`${n.name || 'n-ary relationship'}: ${bad.t.name} has no primary key.`); return; }
      const keys = ps.map(x => ({ many: x.many, t: x.t, cols: x.t.cols }));
      const anyMany = keys.some(k => k.many), inKey = k => !anyMany || k.many;
      const all = keys.flatMap(k => k.cols.map(c => inKey(k) ? '<u>' + esc(c) + '</u>' : esc(c))).concat(n.cols.map(c => esc(c.name)));
      nt.push(`<div class="mono text-[13px] mb-1.5">${esc(n.name || ps.map(x => x.t.name).join('_'))}(${all.join(', ')}) <span class="muted">${n.ends.length}-ary; FKs → ${esc(ps.map(x => x.t.name).join(', '))}${keys.some(k => !inKey(k)) ? '; "one" side keys are not in the key' : ''}</span> <span class="muted" style="font-style:italic"> · Rule: n-ary → one table</span></div>`);
    });
    if (nt.length) rows.push('<div class="lbl mt-3">N-ary relationships</div>' + nt.join(''));
    const store = c => (c.kind || 'simple') !== 'derived' && (c.kind || 'simple') !== 'multi';
    const L = (t, extraPk) => t.cols.filter(store).map(c => c.pk ? '<u>' + esc(c.name) + '</u>' : esc(c.name));
    const line = (nm, cols, note) => `<div class="mono text-[12.5px] mb-1">${esc(nm)}(${cols.join(', ')})${note ? ' <span class="muted">' + note + '</span>' : ''}</div>`;
    const isa = [];
    (S.rnodes || []).filter(n => n.kind === 'isa').forEach(n => {
      const sp = T((n.ends.find(e => e.role === 'super') || {}).t), subs = n.ends.filter(e => e.role !== 'super').map(e => T(e.t)).filter(Boolean);
      if (!sp || !subs.length) return; const pk = sp.cols.filter(c => c.pk).map(c => '<u>' + esc(c.name) + '</u>'), disj = n.dc !== 'o';
      if (!pk.length) { notes.push(`${sp.name}: supertype has no primary key for ISA mapping.`); return; }
      const own = u => u.cols.filter(c => !c.pk && store(c)).map(c => esc(c.name));
      isa.push(`<div class="text-[12.5px] mt-2"><b>${esc(sp.name)}</b> <span class="muted">(${disj ? 'disjoint' : 'overlapping'}, ${n.total ? 'total' : 'partial'})</span></div>` +
        `<div class="lbl" style="margin:4px 0 2px">A. Table per entity</div>${line(sp.name, L(sp))}${subs.map(u => line(u.name, [...pk, ...own(u)], 'FK → ' + esc(sp.name))).join('')}` +
        `<div class="lbl" style="margin:4px 0 2px">B. Single table</div>${line(sp.name, [...L(sp), disj ? 'type' : subs.map(u => 'is_' + esc(u.name)).join(', '), ...subs.flatMap(own)], 'NULL for rows of other types')}` +
        `<div class="lbl" style="margin:4px 0 2px">C. Subtypes only</div>` + (n.total && disj ? subs.map(u => line(u.name, [...L(sp), ...own(u)])).join('') : '<div class="qwn text-[12px]">Needs total + disjoint specialization (otherwise rows are lost or duplicated).</div>'));
    });
    if (isa.length) rows.push('<div class="lbl mt-3">Specialization (ISA): compare strategies</div>' + isa.join(''));
    if (rm.length) rows.push('<div class="lbl mt-3">Relationships (1:1 and 1:N / N:1)</div>' + rm.join(''));
    const mel = openModal('ER → Relational (steps 1–7)', `<div class="lbl">Rule: each regular entity becomes a table. Composite attributes become one column per component. Derived attributes are dropped. Each multivalued attribute becomes its own table: the owner's key plus the value, both together as the key. Primary keys underlined.</div>${rows.join('') || '<div class="muted">No tables.</div>'}${notes.length ? `<div class="lbl mt-3">Deferred / skipped</div><ul class="guide">${notes.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`, `<button class="btn solid" id="mkMulti">Create multivalued tables</button><button class="btn solid" id="mkJunc">Create junction tables</button><button class="btn bordered" id="mkTxt">Download .txt</button>`);
    $('#mkTxt', mel).onclick = () => {
      const c = mel.cloneNode(true); c.querySelectorAll('button,[aria-label="Close"]').forEach(x => x.remove());
      const h = c.innerHTML.replace(/<u>(.*?)<\/u>/g, '*$1*').replace(/<\/(div|li|tr)>/g, '\n').replace(/<\/t[dh]>/g, ' | ').replace(/<[^>]+>/g, ''), ta = document.createElement('textarea'); ta.innerHTML = h;
      dl((S.name || 'schema').replace(/\W+/g, '_') + '_relational.txt', 'Relational schema: ' + (S.name || '') + '\n(*x* = primary key)\n\n' + ta.value.replace(/\n{3,}/g, '\n\n').trim() + '\n', 'text/plain');
    };
    $('#mkMulti', mel).onclick = createMulti;
    $('#mkJunc', mel).onclick = () => { const m = S.rels.filter(r => isMany(r.fc) && isMany(r.tc)); m.forEach(makeJunction); closeModal(); toast(m.length ? m.length + ' junction table(s) created' : 'No many-to-many lines to convert'); };
  }
  mk('btnRelational', 'Relational', openRel);
  function aggRects() {
    return (S.rnodes || []).filter(n => n.kind === 'rel' && n.agg).map(n => {
      const ts = n.ends.map(e => T(e.t)).filter(Boolean); if (!ts.length) return null; const pd = 26;
      const x1 = Math.min(n.x - 60, ...ts.map(t => t.x)) - pd, y1 = Math.min(n.y - 40, ...ts.map(t => t.y)) - pd, x2 = Math.max(n.x + 60, ...ts.map(t => t.x + t.w)) + pd, y2 = Math.max(n.y + 40, ...ts.map(t => t.y + tH(t))) + pd;
      return { id: n.id, x: x1, y: y1, w: x2 - x1, h: y2 - y1, label: n.name || 'aggregation' };
    }).filter(Boolean);
  }
  window.__aggRects = aggRects;
  window.__aggEdge = (id, n) => {
    const r = aggRects().find(a => a.id === id); if (!r) return null;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2, dx = n.x - cx, dy = n.y - cy; if (!dx && !dy) return null;
    const k = Math.min(dx ? (r.w / 2) / Math.abs(dx) : Infinity, dy ? (r.h / 2) / Math.abs(dy) : Infinity);
    return k >= 1 ? null : { x: cx + dx * k, y: cy + dy * k };
  };
  function drawAgg() {
    $$('.aggbox', world).forEach(e => e.remove());
    aggRects().forEach(a => { const d = document.createElement('div'); d.className = 'aggbox'; d.style.cssText = `left:${a.x}px;top:${a.y}px;width:${a.w}px;height:${a.h}px`; d.innerHTML = `<span>${esc(a.label)}</span>`; world.insertBefore(d, world.firstChild); });
    aggObs.takeRecords();
  }
  const aggObs = new MutationObserver(drawAgg); aggObs.observe(world, { childList: true }); drawAgg();
  const NF = { attrs: '', fds: '', x: '' };
  const toSet = str => str.split(/[\s,]+/).map(x => x.trim()).filter(Boolean);
  const parseFDs = txt => txt.split(/[\n;]+/).map(l => l.trim()).filter(Boolean).map(l => { const m = l.split(/->|→/); return m.length === 2 ? { l: toSet(m[0]), r: toSet(m[1]), raw: l } : { bad: l }; });
  function closure(X, fds) {
    const cl = new Set(X), steps = []; let ch = true;
    while (ch) { ch = false; fds.forEach(f => { if (f.bad || !f.l.every(a => cl.has(a))) return; const add = f.r.filter(a => !cl.has(a)); if (add.length) { add.forEach(a => cl.add(a)); steps.push(`${f.l.join(',')} → ${f.r.join(',')} adds ${add.join(', ')}`); ch = true; } }); }
    return { cl, steps };
  }
  function candKeys(A, ok) {
    const rhs = new Set(ok.flatMap(f => f.r)), core = A.filter(a => !rhs.has(a)), rest = A.filter(a => rhs.has(a)), keys = [];
    for (let n = 0; n <= rest.length; n++) {
      const comb = (st, pick) => { if (pick.length === n) { const k = [...core, ...pick]; if (keys.some(x => x.every(a => k.includes(a)))) return; if (A.every(a => closure(k, ok).cl.has(a))) keys.push(k); return; } for (let i = st; i < rest.length; i++) comb(i + 1, [...pick, rest[i]]); };
      comb(0, []);
    }
    return { keys, core };
  }
  function checkNF(A, ok) {
    const { keys } = candKeys(A, ok), prime = new Set(keys.flat()), non = A.filter(a => !prime.has(a)), isSuper = X => A.every(a => closure(X, ok).cl.has(a));
    const v = { n2: [], n3: [], bc: [] }, fmt = x => '{' + x.join(', ') + '}';
    keys.forEach(K => { if (K.length < 2 || K.length > 12) return;
      for (let m = 1; m < (1 << K.length) - 1; m++) { const S = K.filter((_, i) => m >> i & 1), got = [...closure(S, ok).cl].filter(a => non.includes(a) && !S.includes(a));
        if (got.length && !v.n2.some(x => x.s.join() === S.join() && x.k.join() === K.join())) v.n2.push({ s: S, k: K, got }); } });
    ok.forEach(f => { const rhs = f.r.filter(a => !f.l.includes(a)); if (!rhs.length) return; const sk = isSuper(f.l);
      if (!sk) { v.bc.push(`${f.l.join(', ')} → ${rhs.join(', ')}: ${fmt(f.l)} is not a superkey (its closure is ${fmt([...closure(f.l, ok).cl])}).`);
        const bad = rhs.filter(a => !prime.has(a)); if (bad.length) v.n3.push(`${f.l.join(', ')} → ${bad.join(', ')}: ${fmt(f.l)} is not a superkey and ${bad.join(', ')} ${bad.length > 1 ? 'are' : 'is'} not prime.`); } });
    const n2 = !v.n2.length, n3 = n2 && !v.n3.length, bc = n3 && !v.bc.length;
    return { keys, non, v, n2, n3, bc, top: bc ? 'BCNF' : n3 ? '3NF' : n2 ? '2NF' : '1NF', fmt };
  }
  function openNorm() {
    const el = openModal('Normalization Lab: FDs and attribute closure', `
      <div class="lbl">Load attributes from a table</div><select class="fld" id="nfT"><option value="">(type your own)</option>${S.tables.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select>
      <div class="lbl mt-2">Attributes of R (comma separated)</div><input class="fld" id="nfA" style="width:100%" spellcheck="false" value="${esc(NF.attrs)}" placeholder="A, B, C, D, E">
      <div class="lbl mt-2">Functional dependencies (one per line, use -&gt;)</div><textarea class="fld mono" id="nfF" style="width:100%;min-height:90px" spellcheck="false" placeholder="A -> B&#10;B, C -> D">${esc(NF.fds)}</textarea>
      <div class="lbl mt-2">Compute closure of X</div><div class="flex gap-2"><input class="fld" id="nfX" style="flex:1" spellcheck="false" value="${esc(NF.x)}" placeholder="A, C"><button class="btn solid" id="nfGo">Compute X⁺</button></div><div class="mt-2"><button class="btn bordered" id="nfKeys">Find candidate keys</button> <button class="btn bordered" id="nfNF">Check normal forms</button></div>
      <div id="nfOut" class="mt-3"></div>`);
    const q = id => $(id, el);
    q('#nfT').onchange = ev => { const t = T(ev.target.value); if (t) q('#nfA').value = t.cols.filter(c => (c.kind || 'simple') !== 'derived').map(c => c.name).join(', '); };
    q('#nfNF').onclick = () => {
      NF.attrs = q('#nfA').value; NF.fds = q('#nfF').value;
      const A = [...new Set(toSet(NF.attrs))], ok = parseFDs(NF.fds).filter(f => !f.bad);
      if (!A.length) { q('#nfOut').innerHTML = '<div class="qer">Enter the attributes of R first.</div>'; return; }
      if (A.length > 14) { q('#nfOut').innerHTML = '<div class="qwn">Up to 14 attributes are supported here.</div>'; return; }
      const r = checkNF(A, ok), row = (nf, pass, why) => `<tr><td><b>${nf}</b></td><td class="${pass ? 'qok' : 'qer'}">${pass ? 'Satisfied' : 'Violated'}</td><td>${why}</td></tr>`;
      q('#nfOut').innerHTML = `<div class="text-[14px]"><b>Highest normal form: <span class="qok">${r.top}</span></b></div>
        <div class="muted text-[12px] mb-1">Keys: ${r.keys.map(k => esc(r.fmt(k))).join(' ')}. Non-prime: ${esc(r.non.join(', ') || 'none')}.</div>
        <table class="qt"><tr><th>Form</th><th>Result</th><th>Why</th></tr>
        ${row('1NF', true, 'Assumed: every attribute holds one atomic value.')}
        ${row('2NF', r.v.n2.length === 0, r.v.n2.length ? r.v.n2.map(x => `Partial dependency: ${esc(r.fmt(x.s))} (part of key ${esc(r.fmt(x.k))}) determines non-prime ${esc(x.got.join(', '))}.`).join('<br>') : 'No non-prime attribute depends on part of a key.')}
        ${row('3NF', r.v.n3.length === 0, r.v.n3.length ? r.v.n3.map(esc).join('<br>') : 'Every dependency has a superkey on the left or a prime attribute on the right.')}
        ${row('BCNF', r.v.bc.length === 0, r.v.bc.length ? r.v.bc.map(esc).join('<br>') : 'Every non-trivial dependency has a superkey on the left.')}</table>`;
      $$('#nfOut tr', el).forEach((tr, i) => tr.style.animationDelay = i * 90 + 'ms');
    };
    q('#nfKeys').onclick = () => {
      NF.attrs = q('#nfA').value; NF.fds = q('#nfF').value; NF.x = q('#nfX').value;
      const A = [...new Set(toSet(NF.attrs))], ok = parseFDs(NF.fds).filter(f => !f.bad), out = [];
      if (!A.length) { q('#nfOut').innerHTML = '<div class="qer">Enter the attributes of R first.</div>'; return; }
      if (A.length > 14) { q('#nfOut').innerHTML = '<div class="qwn">Up to 14 attributes are supported here.</div>'; return; }
      const { keys, core } = candKeys(A, ok);
      const prime = A.filter(a => keys.some(k => k.includes(a))), non = A.filter(a => !prime.includes(a));
      out.push(`<div class="lbl">Candidate keys (${keys.length})</div>` + keys.map(k => `<div class="mono text-[13px]">{${esc(k.join(', '))}}</div>`).join(''),
        `<div class="text-[13px] mt-2"><b>Prime attributes:</b> <span class="mono">${esc(prime.join(', ') || 'none')}</span></div><div class="text-[13px]"><b>Non-prime attributes:</b> <span class="mono">${esc(non.join(', ') || 'none')}</span></div>`,
        core.length ? `<div class="muted text-[12px] mt-1">${esc(core.join(', '))} ${core.length > 1 ? 'never appear' : 'never appears'} on a right-hand side, so ${core.length > 1 ? 'they are' : 'it is'} in every key.</div>` : '');
      q('#nfOut').innerHTML = out.join('');
    };
    q('#nfGo').onclick = () => {
      NF.attrs = q('#nfA').value; NF.fds = q('#nfF').value; NF.x = q('#nfX').value;
      const A = toSet(NF.attrs), X = toSet(NF.x), fds = parseFDs(NF.fds), out = [];
      fds.filter(f => f.bad).forEach(f => out.push(`<div class="qwn">Could not read "${esc(f.bad)}". Use the form A, B -&gt; C.</div>`));
      const ok = fds.filter(f => !f.bad), unk = [...new Set([...X, ...ok.flatMap(f => [...f.l, ...f.r])])].filter(a => A.length && !A.includes(a));
      if (unk.length) out.push(`<div class="qwn">Not in R: ${esc(unk.join(', '))}</div>`);
      if (!X.length) out.push('<div class="qer">Enter at least one attribute for X.</div>');
      else { const r = closure(X, ok), sk = A.length && A.every(a => r.cl.has(a));
        out.push(`<div class="text-[13px]"><b>{${esc(X.join(', '))}}⁺ = {${esc([...r.cl].join(', '))}}</b></div>`,
          r.steps.length ? `<ol class="guide">${r.steps.map(x => `<li class="mono text-[12.5px]">${esc(x)}</li>`).join('')}</ol>` : '<div class="muted text-[12.5px]">No dependency applies, so X⁺ = X.</div>',
          A.length ? `<div class="${sk ? 'qok' : 'qwn'} text-[13px]">${sk ? 'X determines every attribute of R, so X is a superkey.' : 'Not determined: ' + esc(A.filter(a => !r.cl.has(a)).join(', ')) + '. X is not a superkey.'}</div>` : ''); }
      q('#nfOut').innerHTML = out.join(''); $$('#nfOut li', el).forEach((li, i) => li.style.animationDelay = (i * 140 + 150) + 'ms');
    };
  }
  mk('btnNorm', 'Normalize', openNorm);
  const MODES = [['p', 'Physical'], ['l', 'Logical'], ['c', 'Conceptual']]; let mi = 0;
  mk('btnMode', 'Mode: Physical', () => {
    mi = (mi + 1) % 3; world.classList.remove('mode-c', 'mode-l'); if (MODES[mi][0] !== 'p') world.classList.add('mode-' + MODES[mi][0]);
    window.__mode = MODES[mi][0]; try { localStorage.setItem('crowfoot_mode', MODES[mi][0]); } catch (e) {} $('#btnMode').textContent = 'Mode: ' + MODES[mi][1]; toast(MODES[mi][1] + ' view: ' + ({ p: 'names, types and all flags', l: 'names, keys and flags, no data types', c: 'names and keys only' })[MODES[mi][0]]);
  });
  try { const k = MODES.findIndex(m => m[0] === localStorage.getItem('crowfoot_mode')); if (k > 0) { mi = k; window.__mode = MODES[k][0]; world.classList.add('mode-' + MODES[k][0]); $('#btnMode').textContent = 'Mode: ' + MODES[k][1]; } } catch (e) {}

  const CHANGELOG = [
    ['3.1', ['Normalization Lab: Check normal forms tests 1NF, 2NF, 3NF and BCNF, names the exact dependency that breaks each form, and reports the highest form reached.']],
    ['3.0', ['Production release: separate HTML, CSS and JS files, locally hosted fonts, compiled and minified CSS, offline support (installable app), security headers and a cache-friendly build. No more CDN requests.']],
    ['2.36', ['Normalization Lab: Find candidate keys lists every minimal key of R and shows prime and non-prime attributes.']],
    ['2.35', ['New Animate button: dots flow along every relationship line to show connections; press Stop to turn it off. Uses SVG, so no extra library is needed.']],
    ['2.34', ['Top bar fix: it now measures itself. Wide screens wrap onto extra rows; narrow screens collapse into a Menu drawer. Nothing goes off-screen at any width.']],
    ['2.33', ['Mobile: top bar keeps only main actions plus a Menu drawer; windows open as bottom sheets; larger touch targets; 16px inputs stop iPhone auto-zoom. Fixed duplicate button id.']],
    ['2.32', ['Animations: smooth modal/panel open, fade-in results, animated zoom and fit, glowing query highlight, flash on found table, staggered closure steps, button press feedback. Respects reduced-motion setting.']],
    ['2.31', ['New Normalize button (Normalization Lab): functional dependency input and attribute closure X+ with steps and superkey test.']],
    ['2.30', ['Aggregation: turning it off detaches relationships that pointed at it; design checks flag any that still dangle.']],
    ['2.29', ['Relational: n-ary relationships with an aggregation end also use the aggregated relationship key.']],
    ['2.28', ['Relational: a relationship on an aggregation uses the aggregated relationship\'s key (all participant keys) for its foreign key.']],
    ['2.27', ['Relationships to an aggregation now attach to the dashed box edge instead of a table inside it (canvas and export).']],
    ['2.26', ['Tools: relate an aggregation to a table, which creates a new diamond relationship whose end points at the aggregation.']],
    ['2.25', ['PNG/SVG export now includes aggregation boxes.']],
    ['2.24', ['Tools: Aggregation toggle draws a dashed box around a diamond relationship and its participants (saved with the diagram).']],
    ['2.23', ['Mode button now remembers your choice after reloading the page.']],
    ['2.22', ['PNG/SVG export now follows the Mode button (Conceptual hides types and flags, Logical hides types).']],
    ['2.21', ['New Mode button cycles Physical / Logical / Conceptual views of the table cards (hides types and flags progressively).']],
    ['2.20', ['Relational: every mapped table now shows the rule applied (entity, multivalued, weak, M:N, n-ary).']],
    ['2.19', ['Relational: Download .txt exports the relational schema (keys marked with *) for assignments and reports.']],
    ['2.18', ['Relational: "Create junction tables" button converts every many-to-many line into a junction table in one click.']],
    ['2.17', ['Relational: "Create multivalued tables" button adds the generated tables and FK relationships to the diagram (undoable with Ctrl+Z).']],
    ['2.16', ['Relational: ISA specialization shown with 3 mapping strategies (table per entity, single table, subtypes only) and when each applies.']],
    ['2.15', ['Relational: n-ary relationships (3+ participants) map to one table with every participant key; "one" sides stay out of the key.']],
    ['2.14', ['Relational: M:N relationships (drawn lines and diamond relationships) become junction tables with both keys and relationship attributes.']],
    ['2.13', ['Relational: each relationship is classified (1:1, 1:N, N:1, M:N) with a check that the foreign key is on the correct side and 1:1 keys are UNIQUE.']],
    ['2.12', ['Relational: weak entities map to tables keyed by the owner key plus partial key, with FK to the owner.']],
    ['2.11', ['Relational: multivalued attributes now map to their own tables (owner key + value, with FK back to the owner).']],
    ['2.10', ['New Relational button: ER → Relational step 1 (entities to tables, composite attributes split, derived dropped; weak and multivalued deferred).']],
    ['2.9', ['SQL import: reads column-level CHECK (...) constraints into the CHECK field, so export and import round-trip.']],
    ['2.8', ['Columns: CHECK expression field (in the column editor), saved with the diagram and exported in MySQL CREATE TABLE.']],
    ['2.7', ['Tools: Inheritance (ISA) preview showing each subtype\'s inherited and own columns, plus disjoint/overlapping and total/partial.']],
    ['2.6', ['Tools: Relationship degree table (unary / binary / ternary / n-ary) listing participants for every relationship.']],
    ['2.5', ['Design checks: role/label check for recursive relationships and repeated relationships between the same two tables.']],
    ['2.4', ['Design checks: weak-entity validation (partial key, identifying relationship, total participation, owner key in key).']],
    ['2.3', ['Tools: Keys table listing each primary key and other candidate keys (UNIQUE + NOT NULL), and flagging UNIQUE-but-nullable columns.']],
    ['2.2', ['Relationship editor: Total / Partial participation toggle for each end (switches min cardinality 1 / 0).']],
    ['2.1', ['Added "What\'s new" changelog (this window).', 'Design checks: duplicate relationship and direct many-to-many warnings.']],
    ['2.0', ['Touch: pinch-zoom, two-finger pan, on-screen zoom buttons.', 'Tools: find table, design checks, data dictionary (.md).', 'Query visualizer: highlights tables/joins used by a SELECT.']]
  ];
  mk('btnNew', "What's new", () => openModal("What's new", CHANGELOG.map(c => `<div class="lbl mt-2">v${c[0]}</div><ul class="guide">${c[1].map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('')));

})();

  /* connection animation: dots travel along every relationship line */
  let FLOW = false; const linksSvg = $('#links');
  function drawFlow() {
    $$('.flowdot', linksSvg).forEach(e => e.remove());
    if (FLOW) $$('.rel', linksSvg).forEach((g, i) => { const hit = $('.link-hit', g); if (!hit) return; const d = hit.getAttribute('d'), NS = 'http://www.w3.org/2000/svg';
      [0, 1].forEach(k => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('class', 'flowdot'); c.setAttribute('r', '4');
        const a = document.createElementNS(NS, 'animateMotion'); a.setAttribute('dur', '2.6s'); a.setAttribute('begin', ((i * 0.35 + k * 1.3) % 2.6).toFixed(2) + 's'); a.setAttribute('repeatCount', 'indefinite'); a.setAttribute('path', d);
        c.appendChild(a); g.appendChild(c); }); });
    flowObs.takeRecords();
  }
  const flowObs = new MutationObserver(() => { if (FLOW) drawFlow(); }); flowObs.observe(linksSvg, { childList: true });
  const mkA = (id, txt, fn) => { const b = document.createElement('button'); b.className = 'btn'; b.id = id; b.textContent = txt; b.onclick = fn; const f = $('#btnFile'); f.parentNode.insertBefore(b, f); };
  mkA('btnAnim', 'Animate', () => {
    if (!FLOW && matchMedia('(prefers-reduced-motion: reduce)').matches) { toast('Animation is off because reduced motion is on in your device settings.'); return; }
    FLOW = !FLOW; drawFlow(); $('#btnAnim').textContent = FLOW ? 'Stop' : 'Animate'; $('#btnAnim').setAttribute('aria-pressed', String(FLOW));
  });

  /* responsive top bar: primary actions stay, the rest move into a Menu drawer on small screens */
  (function () {
    const tb = $('.topbar'); if (!tb) return; const PRIM = ['btnTable', 'btnUndo', 'btnRedo', 'btnExport', 'btnPanel'];
    const mb = document.createElement('button'); mb.className = 'btn tb-menu'; mb.id = 'btnMenu'; mb.textContent = 'Menu'; mb.setAttribute('aria-expanded', 'false');
    tb.insertBefore(mb, $('#btnExport'));
    const lg = tb.querySelector('[aria-label="Crowfoot"]'); if (lg) lg.classList.add('tb-logo');
    [...tb.children].forEach(c => {
      if (c === mb || PRIM.includes(c.id)) return;
      if (c.tagName === 'SPAN' && c.classList.contains('flex-1')) { c.classList.add('tb-spacer'); return; }
      if (c.querySelector && c.querySelector('svg[aria-label],svg') && c.getAttribute('aria-label') === 'Crowfoot') return;
      c.classList.add('tb-sec');
    });
    const setO = o => { tb.classList.toggle('open', o); mb.setAttribute('aria-expanded', String(o)); mb.textContent = o ? 'Close' : 'Menu'; };
    mb.onclick = () => setO(!tb.classList.contains('open'));
    const AUTO = ['btnQuery', 'btnTools', 'btnRelational', 'btnNorm', 'btnNew', 'btnMode', 'btnArrange', 'btnNote', 'btnAnim'];
    tb.addEventListener('click', e => { const b = e.target.closest('button'); if (b && AUTO.includes(b.id) && tb.classList.contains('open')) setTimeout(() => setO(false), 0); });
    const fit = () => {
      const wasOpen = tb.classList.contains('open'); tb.classList.remove('open', 'compact', 'wrap');
      if (tb.scrollWidth > tb.clientWidth + 1) tb.classList.add(innerWidth >= 900 ? 'wrap' : 'compact');
      setO(wasOpen && tb.classList.contains('compact'));
    };
    fit(); addEventListener('resize', fit); addEventListener('orientationchange', fit); addEventListener('load', fit);
    setTimeout(fit, 300); setTimeout(fit, 1200); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  })();
})();
