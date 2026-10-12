// "AI recruiting platform" scroll story (home page). Four recreated screens (own design, made-up data; the real system is private)
// sit in a 3D stack: scrolling through the pinned section flies them past one at a time, the cursor tilts the whole scene,
// and the text on the left follows. Narrow screens, reduced motion and no-JS get a plain stacked layout (same content).
// Clicking a screen opens it full size.
import { CAPTURE, REDUCED, onTick } from './engine.js';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

// ---- lightbox (works in both layouts) ----
let lb;
function openLightbox(win) {
  const img = $('img', win); if (!img) return;
  if (!lb) {
    lb = document.createElement('dialog'); lb.className = 'lb'; lb.setAttribute('aria-label', 'Screen, full size');
    lb.innerHTML = '<button class="lb-x" type="button" aria-label="Close">×</button><img alt=""><p class="lb-cap"></p>';
    document.body.append(lb);
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lb-x')) lb.close(); });
    lb.addEventListener('close', () => document.documentElement.classList.remove('lock'));
  }
  const big = $('img', lb); big.src = img.currentSrc || img.src; big.alt = img.alt; $('.lb-cap', lb).textContent = win.dataset.title ? `${win.dataset.title}. ${win.dataset.desc || ''}` : img.alt;
  document.documentElement.classList.add('lock'); lb.showModal();
}

export function initShowcase() {
  const sec = $('[data-rs]'); if (!sec) return;
  const pin = $('.rs-pin', sec), stage = $('.rs-stage', sec), scene = $('.rs-scene', sec);
  const wins = $$('.rs-win', sec), tabs = $$('.rs-tab', sec), N = wins.length;
  wins.forEach((w) => { w.tabIndex = 0; w.setAttribute('role', 'button'); });
  sec.addEventListener('click', (e) => { const w = e.target.closest('.rs-win'); if (w && !(sec.classList.contains('rs-live') && !w.classList.contains('on'))) openLightbox(w); });
  sec.addEventListener('keydown', (e) => { const w = e.target.closest?.('.rs-win'); if (w && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLightbox(w); } });

  const mq = matchMedia('(min-width: 901px)');
  let stopTick = null, pos = 0, target = 0, sw = 0, sh = 0, hh = 64, vis = true, mx = 0, my = 0, tmx = 0, tmy = 0, active = -1, sizes = [];

  const measure = () => { sw = stage.clientWidth; sh = stage.clientHeight; hh = $('.hdr')?.offsetHeight || 64; sizes = wins.map((w) => w.offsetHeight); };
  const readScroll = () => {
    const top = sec.getBoundingClientRect().top, range = Math.max(1, sec.offsetHeight - pin.offsetHeight);
    const p = clamp((hh - top) / range); const f = p * (N - 1), i = Math.min(N - 2, Math.floor(f)), t = f - i;
    // plateau around each screen so it rests in focus before the next one flies in
    target = i + smooth(clamp((t - .16) / .68));
  };
  const setActive = (a) => {
    if (a === active) return; active = a;
    tabs.forEach((t, i) => { t.classList.toggle('on', i === a); t.setAttribute('aria-current', i === a ? 'true' : 'false'); });
    wins.forEach((w, i) => { w.classList.toggle('on', i === a); w.tabIndex = i === a ? 0 : -1; });
  };
  function frame(t, dt) {
    if (!vis) return; const s = Math.min(.05, dt / 1000);
    pos += (target - pos) * (1 - Math.exp(-7 * s)); mx += (tmx - mx) * (1 - Math.exp(-5 * s)); my += (tmy - my) * (1 - Math.exp(-5 * s));
    const bob = Math.sin(t / 1000 * .9) * 3;
    scene.style.transform = `rotateX(${(-my * 4 + 2).toFixed(2)}deg) rotateY(${(mx * 7).toFixed(2)}deg)`;
    for (let i = 0; i < N; i++) {
      const d = i - pos, ad = Math.abs(d), w = wins[i];
      const x = d >= 0 ? d * .17 * sw : d * .22 * sw;
      const y = (sh - (sizes[i] || 0)) / 2 + (d >= 0 ? d * .07 * sh : d * .09 * sh) + bob * (1 - Math.min(1, ad));
      const z = d >= 0 ? -d * 190 : d * 140;
      const ry = d >= 0 ? -d * 13 : -d * 20, rx = ad * 2.2;
      const sc = 1 - ad * .07;
      const op = d >= 0 ? clamp(1 - d * .5) : clamp(1 + d * 1.5);
      w.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      w.style.opacity = op.toFixed(3); w.style.zIndex = String(100 - Math.round(ad * 10));
      w.style.setProperty('--chip', clamp(1 - ad * 2.4).toFixed(3));
    }
    setActive(clamp(Math.round(pos), 0, N - 1));
  }
  const onScroll = () => readScroll();
  const onMove = (e) => { if (e.pointerType && e.pointerType !== 'mouse') return; const r = stage.getBoundingClientRect(); tmx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1); tmy = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1); };
  const onLeave = () => { tmx = 0; tmy = 0; };
  const goTo = (i) => { // scroll so that screen i is the one resting in focus
    const range = sec.offsetHeight - pin.offsetHeight, top = sec.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top - hh + (i / (N - 1)) * range + 1, behavior: REDUCED ? 'auto' : 'smooth' });
  };
  const onTab = (e) => { const b = e.target.closest('.rs-tab'); if (b) goTo(+b.dataset.i); };
  let io;
  function enable() {
    if (stopTick) return; sec.classList.add('rs-live'); measure(); readScroll(); pos = target;
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onResize, { passive: true });
    stage.addEventListener('pointermove', onMove, { passive: true }); stage.addEventListener('pointerleave', onLeave);
    sec.addEventListener('click', onTab);
    io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; }, { rootMargin: '200px' }); io.observe(sec);
    stopTick = onTick(frame); requestAnimationFrame(() => { measure(); readScroll(); });
    $$('img', sec).forEach((im) => { if (!im.complete) im.addEventListener('load', () => { measure(); }, { once: true }); });
  }
  function disable() {
    if (!stopTick) return; stopTick(); stopTick = null; io?.disconnect(); sec.classList.remove('rs-live', 'is-active');
    removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); stage.removeEventListener('pointermove', onMove); stage.removeEventListener('pointerleave', onLeave); sec.removeEventListener('click', onTab);
    scene.style.transform = ''; wins.forEach((w) => { w.style.transform = ''; w.style.opacity = ''; w.style.zIndex = ''; w.style.removeProperty('--chip'); w.classList.remove('on'); w.tabIndex = 0; }); active = -1;
    tabs.forEach((t) => t.classList.remove('on'));
  }
  function onResize() { measure(); readScroll(); }
  const sync = () => (mq.matches && !REDUCED && !CAPTURE ? enable() : disable());
  mq.addEventListener('change', sync); sync();
}
