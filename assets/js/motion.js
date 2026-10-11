// Scroll motion for every page: staggered reveals, aperture-style media reveals, heading line draws,
// real-number counters, gentle image parallax/Ken Burns and slow iris-ring motifs.
// Only transforms/opacity/clip-path (no layout shift). Off for prefers-reduced-motion and video capture.
import { CAPTURE, REDUCED } from './engine.js';
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ON = !REDUCED && !CAPTURE && 'IntersectionObserver' in window;

// targets that rise in, staggered among siblings
const RISE = ['.sec-head', '.page-head .wrap > *', '.card', '.featured', '.areas a', '.step', '.deliver', '.pub', '.timeline li',
  '.panel', '.ccard', '.caps > div', '.cta-band .wrap > *', '.stack-strip li', '.about-grid > *', '.contact-grid .left > *'].join(',');
const IRIS = `<svg viewBox="0 0 400 400" fill="none" stroke="currentColor"><circle cx="200" cy="200" r="196" stroke-opacity=".5"/>
<circle cx="200" cy="200" r="168" stroke-dasharray="2 10" stroke-opacity=".7"/><circle cx="200" cy="200" r="120" stroke-opacity=".35"/>
${Array.from({ length: 12 }, (_, i) => `<path d="M200 82 A118 118 0 0 1 300 140" transform="rotate(${i * 30} 200 200)" stroke-opacity=".55"/>`).join('')}
<circle cx="200" cy="200" r="58" stroke="var(--accent)" stroke-opacity=".8"/></svg>`;

function rings() {
  $$('.page-head, .cta-band').forEach((host) => {
    if (host.querySelector(':scope > .iris-motif')) return;
    const d = document.createElement('div'); d.className = 'iris-motif'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = IRIS; host.prepend(d);
  });
}
function counters(root) {
  $$('[data-count]', root).forEach((el) => {
    if (el._c) return; el._c = 1;
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, suf = el.dataset.suffix || '';
    const fin = () => (el.textContent = end.toFixed(dec) + suf);
    if (!ON) return fin();
    el.textContent = (0).toFixed(dec) + suf;
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now(), D = 1400;
      const step = (t) => { const k = Math.min(1, (t - t0) / D), v = end * (1 - Math.pow(1 - k, 3)); el.textContent = v.toFixed(dec) + suf; if (k < 1) requestAnimationFrame(step); else fin(); };
      requestAnimationFrame(step); }, { threshold: .6 });
    io.observe(el);
  });
}
let io;
export function scan(root = document) {
  counters(root);
  if (!ON) return;
  const els = $$(RISE, root).filter((e) => !e.closest('dialog, .hero, .mnav') && !e.classList.contains('mv'));
  els.forEach((e) => {
    const sibs = [...e.parentElement.children].filter((x) => x.matches(RISE));
    e.style.setProperty('--d', Math.min(sibs.indexOf(e), 5) * 80 + 'ms');
    e.classList.add('mv'); io.observe(e); pend.add(e);
  });
  $$('.frame > img', root).filter((i) => !i.closest('dialog, .portrait, .yt') && !i.classList.contains('blurbg') && !i.classList.contains('kb'))
    .forEach((i) => { i.classList.add('kb'); px.add(i); });
  $$('.matte', root).filter((m) => !m.closest('dialog, .card') && !m.classList.contains('mv-open')).forEach((m) => { m.classList.add('mv-open'); io.observe(m); pend.add(m); });
}
const px = new Set(), pend = new Set();
if (ON) {
  document.documentElement.classList.add('js-motion');
  io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); pend.delete(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .08 });
  // parallax + ring rotation follow scroll (rAF-throttled, transforms only)
  let raf = 0;
  const tick = () => { raf = 0; const vh = innerHeight;
    // fast scrolls or jumps can skip past an element without an intersection callback: reveal anything already above the fold line
    pend.forEach((e) => { if (e.closest('.hide')) return; if (e.getBoundingClientRect().top < vh * .94) { e.classList.add('in'); io.unobserve(e); pend.delete(e); } });
    px.forEach((i) => { const r = i.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      const k = ((r.top + r.height / 2) - vh / 2) / vh; i.style.setProperty('--py', (k * -14).toFixed(1) + 'px'); });
    document.documentElement.style.setProperty('--sr', (scrollY * 0.04).toFixed(2) + 'deg'); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(tick); });
  const go = () => { rings(); scan(); tick(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else setTimeout(go, 0);
} else {
  const go = () => { rings(); counters(document); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else setTimeout(go, 0);
}
