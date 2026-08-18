/**
 * VOID//OCULUS smoke suite.
 *
 * Loads `index.html` in jsdom with a stubbed 2D canvas context and exercises the
 * behaviour that cannot be verified by reading the file: seeded board
 * construction, search, marquee selection, group drag, in-place editing,
 * sanitisation, the session save/restore round trip, corrupt-session recovery,
 * and reduced-motion boot.
 *
 * jsdom implements no layout, so every assertion here is about logic and state,
 * never geometry — visual and gesture behaviour stay on the manual matrix in
 * the README. jsdom is a *test-only* dependency, installed on demand; the
 * application itself still ships with none.
 *
 *   npm install --no-save jsdom@25
 *   node tests/smoke.mjs
 *
 * Exits non-zero on the first failing expectation set, which is what CI reads.
 */
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const HTML_PATH = join(ROOT, 'index.html');
const HTML = readFileSync(HTML_PATH, 'utf8');

let failures = 0;
const ok = (label, cond, extra = '') => {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${label}${extra ? '  — ' + extra : ''}`);
  if (!cond) failures++;
};

function ctxStub() {
  const noop = () => {};
  return new Proxy({}, {
    get: (_t, k) => (k === 'canvas' ? {} : (k === 'measureText' ? () => ({ width: 0 }) : noop)),
    set: () => true,
  });
}

async function boot({ storage = null, reducedMotion = false } = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(String(e.message || e)));
  vc.on('error', (...a) => errors.push(a.map(String).join(' ')));

  const dom = new JSDOM(HTML, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost:8000/',
    virtualConsole: vc,
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = ctxStub;
      window.matchMedia = () => ({
        matches: reducedMotion, media: '', addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {},
      });
      window.confirm = () => true;
      window.Element.prototype.setPointerCapture = () => {};
      window.Element.prototype.releasePointerCapture = () => {};
      if (storage) window.localStorage.setItem('void-oculus/session', storage);
    },
  });

  await new Promise(r => setTimeout(r, 900));   // let deferred builders + timers settle
  return { dom, window: dom.window, errors };
}

/** Dispatches a pointer-ish event jsdom can construct (no PointerEvent in jsdom). */
function pointer(win, target, type, props = {}) {
  const e = new win.MouseEvent(type, { bubbles: true, cancelable: true, ...props });
  Object.defineProperty(e, 'pointerId', { value: props.pointerId ?? 1 });
  Object.defineProperty(e, 'pointerType', { value: props.pointerType ?? 'mouse' });
  target.dispatchEvent(e);
  return e;
}

console.log('\n── seeded board ───────────────────────────────────────────');
const a = await boot();
const w = a.window;
// `let state` is a global lexical binding, not a property of window, so the
// harness reaches it the same way another inline script would: window.eval.
const ev = expr => w.eval(expr);

ok('loads without script errors', a.errors.length === 0, a.errors.slice(0, 2).join(' | '));
ok('builds 85 cards', ev('state.cards.length') === 85, `got ${ev('state.cards.length')}`);
ok('builds 28 connections', ev('state.connections.length') === 28, `got ${ev('state.connections.length')}`);
ok('registers 61 eyes', w.document.getElementById('stat-eyes').textContent === '61',
   `got ${w.document.getElementById('stat-eyes').textContent}`);
ok('D3 is no longer referenced', !HTML.includes('d3.min.js'));
ok('every card record carries its type', ev("state.cards.every(c => typeof c.type === 'string' && !!c.type)"));
ok('eye cards carry generation params',
   ev("state.cards.filter(c => c.type === 'eye').every(c => !!document.getElementById(c.id).dataset.eyeOpts)"));

console.log('\n── search ─────────────────────────────────────────────────');
const hits = w.applySearch('HAAS EFFECT');
ok('matches a known definition card', hits === 1, `got ${hits}`);
ok('non-matching cards are dimmed', w.document.querySelectorAll('.card.search-dim').length === 84);
ok('counter reflects the match set', w.document.getElementById('search-count').textContent === '1/85');
ok('substring search is case-insensitive', w.applySearch('haas effect') === 1);
ok('empty query restores every card',
   w.applySearch('') === 0 && w.document.querySelectorAll('.card.search-dim,.card.search-hit').length === 0);
w.clearSearch();

console.log('\n── marquee selection ──────────────────────────────────────');
w.clearSelected();
ev('state.selectionStart = { x: 150, y: 120 }; state.mouseX = 900; state.mouseY = 700;');
w.commitMarquee();
const selected = () => ev('state.selectedCards.size');
ok('marquee commits a multi-card selection', selected() > 3, `selected ${selected()}`);
ok('selected cards are visually marked',
   w.document.querySelectorAll('.card.selected-card').length === selected());
const marqueeCount = selected();
ev('state.selectionStart = { x: 1, y: 1 }; state.mouseX = 2; state.mouseY = 2;');
w.commitMarquee();
ok('sub-threshold rectangles are treated as clicks', selected() === marqueeCount);

console.log('\n── group drag ─────────────────────────────────────────────');
w.clearSelected();
const [c1, c2] = ['card-1', 'card-2'].map(id => w.document.getElementById(id));
w.selectCard(c1); w.selectCard(c2);
const before = { x: parseFloat(c2.style.left), y: parseFloat(c2.style.top) };
pointer(w, c1, 'pointerdown', { clientX: 100, clientY: 100, button: 0 });
ok('drag captures the rest of the selection', ev('state.dragGroup.length') === 1,
   `group size ${ev('state.dragGroup.length')}`);
pointer(w, w.document, 'pointermove', { clientX: 300, clientY: 250 });
const after = { x: parseFloat(c2.style.left), y: parseFloat(c2.style.top) };
ok('unpointed selection members translate too', after.x !== before.x && after.y !== before.y,
   `${before.x},${before.y} -> ${after.x},${after.y}`);
ok('state records follow the DOM',
   Math.round(ev("state.cards.find(c => c.id === 'card-2').x")) === Math.round(after.x));
pointer(w, w.document, 'pointerup', { clientX: 300, clientY: 250 });
ok('drag state is released', ev('state.dragGroup.length') === 0 && ev('state.isDragging') === false);

console.log('\n── editing ────────────────────────────────────────────────');
const sticky = w.document.querySelector('.card [class*="sticky"]')?.closest('.card');
pointer(w, sticky, 'dblclick', {});
const editing = sticky.querySelector('[contenteditable="true"]');
ok('double-click opens an editable region', !!editing);
ok('card is flagged as editing', sticky.classList.contains('editing'));
if (editing) {
  editing.textContent = 'EDITED BY HARNESS';
  editing.dispatchEvent(new w.FocusEvent('blur'));
  ok('blur commits and closes the editor',
     !sticky.querySelector('[contenteditable="true"]') && !sticky.classList.contains('editing'));
  ok('edited text is searchable', w.applySearch('EDITED BY HARNESS') === 1);
  w.clearSearch();
}

console.log('\n── sanitisation ───────────────────────────────────────────');
const dirty = `<div class="ok" style="color:red">keep
  <script>window.__pwned = 1<\/script>
  <img src="x" onerror="window.__pwned=1">
  <a href="javascript:alert(1)">link</a>
  <iframe src="https://evil.test"></iframe>
  <svg class="eye-svg"><circle cx="5" cy="5" r="3" fill="#0f0"/></svg>
  <span style="background:url(https://evil.test/x.png)">bg</span>
  <span data-reg="1">stale</span></div>`;
const clean = w.sanitizeHTML(dirty);
ok('strips <script>', !/script/i.test(clean));
ok('strips <img> and <iframe>', !/<img|<iframe/i.test(clean));
ok('strips javascript: hrefs', !/javascript:/i.test(clean));
ok('strips event handler attributes', !/onerror/i.test(clean));
ok('strips url() from inline styles', !/url\(/i.test(clean));
ok('strips stale gaze registration', !/data-reg/i.test(clean));
ok('preserves inline SVG geometry', /<svg[^>]*>[\s\S]*<circle/i.test(clean));
ok('preserves benign inline styles', /color:\s*red/i.test(clean));
ok('nothing executed during sanitisation', w.__pwned === undefined);

console.log('\n── persistence round trip ─────────────────────────────────');
ev("document.getElementById(state.cards[0].id).style.left = '4242px'");
w.saveSession();
const blob = w.localStorage.getItem('void-oculus/session');
ok('session is written', !!blob);
const parsed = JSON.parse(blob);
ok('snapshot has schema version', parsed.v === 1);
ok('snapshot holds every card', parsed.cards.length === ev('state.cards.length'));
ok('eye SVG is replaced by seed slots',
   parsed.cards.filter(c => c.eye).every(c => c.html.includes('data-eye-slot') && !c.html.includes('<svg')));
const kb = Math.round(blob.length / 1024);
ok('snapshot stays small (< 400 KB)', blob.length < 400 * 1024, `${kb} KB for 85 cards`);
a.dom.window.close();

const b = await boot({ storage: blob });
const w2 = b.window;
const ev2 = expr => w2.eval(expr);
ok('restored board loads without errors', b.errors.length === 0, b.errors.slice(0, 2).join(' | '));
ok('restores the full card set', ev2('state.cards.length') === parsed.cards.length,
   `got ${ev2('state.cards.length')}`);
ok('restores connections', ev2('state.connections.length') === parsed.connections.length);
ok('restores the moved card position',
   parseFloat(w2.document.getElementById(parsed.cards[0].id).style.left) === 4242);
ok('does not double-build the seeded board', w2.VO.restored === true);
ok('rehydrates irises from seeds',
   w2.document.querySelectorAll('.card svg.eye-svg').length ===
   ev2("state.cards.filter(c => c.type === 'eye').length"),
   `${w2.document.querySelectorAll('.card svg.eye-svg').length} irises`);
ok('restored board paints its connectors',
   w2.document.querySelectorAll('#connector-svg path').length ===
   ev2('state.connections.length') * 2,
   `${w2.document.querySelectorAll('#connector-svg path').length} paths`);
ok('re-registers restored eyes for gaze',
   Number(w2.document.getElementById('stat-eyes').textContent) >= 61,
   `got ${w2.document.getElementById('stat-eyes').textContent}`);
ok('nextId clears the restored range',
   ev2('state.nextId') >= Math.max(...parsed.cards.map(c => Number(c.id.split('-')[1]) + 1)));
w2.localStorage.clear();
b.dom.window.close();

console.log('\n── corrupt session ────────────────────────────────────────');
const c = await boot({ storage: '{"v":1,"cards":[{"id":"card-0","x":"NaN"' });
ok('malformed JSON falls back to the seeded board', c.window.eval('state.cards.length') === 85);
ok('fallback leaves no errors', c.errors.length === 0, c.errors.slice(0, 1).join(''));
c.dom.window.close();

const d = await boot({ storage: JSON.stringify({ v: 99, cards: [{ id: 'card-0' }] }) });
ok('unknown schema version is ignored', d.window.eval('state.cards.length') === 85);
d.dom.window.close();

console.log('\n── reduced motion ─────────────────────────────────────────');
const e = await boot({ reducedMotion: true });
ok('boots under prefers-reduced-motion', e.errors.length === 0, e.errors.slice(0, 2).join(' | '));
ok('flag is observed', e.window.VO.reducedMotion === true);
ok('board still builds', e.window.eval('state.cards.length') === 85);
e.dom.window.close();

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}\n`);
process.exit(failures === 0 ? 0 : 1);
