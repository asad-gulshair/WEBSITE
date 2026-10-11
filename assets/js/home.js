import { CAPTURE, REDUCED } from './engine.js';
import { $, $$ } from './common.js';
import { PROJECTS, CATS, bySlug } from './data.js';
import { featuredHTML, cardHTML, wireMedia, wireOpeners, routeFromHash } from './cards.js';

// ---- proof: best three results ----
const proof = $('#proof');
const main = bySlug('tomato-ripeness-grading'), side = ['flange-dimension-compliance', 'potato-disease-cnn'].map(bySlug);
proof.innerHTML = `<div class="p-main">${featuredHTML(main, { hrefBase: 'projects.html' })}</div>` + side.map((p) => `<div class="p-side reveal in">${cardHTML(p, { hrefBase: 'projects.html' })}</div>`).join('');
$$('.reveal', proof).forEach((e) => e.classList.add('in'));
wireMedia(proof);
// ---- areas ----
$('#areas').innerHTML = CATS.map((c) => { const n = PROJECTS.filter((p) => p.cat === c.id).length;
  return `<a href="projects.html#${c.id}" data-cat="${c.id}"><span class="meta eyebrow"><span class="dot" style="background:${c.dot}"></span>${c.label}</span><h3>${c.h}</h3><p>${c.sub}</p><span class="go"><span data-count="${n}">${n}</span> project${n === 1 ? '' : 's'} →</span></a>`; }).join('');
wireOpeners(document);
addEventListener('popstate', routeFromHash); addEventListener('hashchange', routeFromHash);
if (location.hash.startsWith('#/work/')) routeFromHash();

// ---- in-page CTA scroll with header offset ----
$('#cta-work')?.addEventListener('click', (e) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault();
  const t = $('#work'), hh = $('.hdr').offsetHeight; const y = t.getBoundingClientRect().top + scrollY - hh - 24;
  if (Math.abs(t.getBoundingClientRect().top - hh - 24) > 8) scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
  history.replaceState(null, '', '#work');
  setTimeout(() => $('#work-h').setAttribute('tabindex', '-1') || $('#work-h').focus({ preventScroll: true }), REDUCED ? 0 : 700);
});

// ---- hero 3D (dynamic import after first paint) ----
const media = $('#hero-media'), canvas = $('#aperture');
function tier() {
  try { const c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) return 'low'; } catch (e) { return 'low'; }
  const mob = matchMedia('(max-width: 900px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  return mob ? 'mid' : 'high';
}
let ap = null;
async function boot() {
  const t = tier(); if (t === 'low') return;
  const { createAperture } = await import('./aperture.js');
  ap = createAperture(canvas, { tier: t }); if (!ap) return;
  media.classList.add('gl'); const still = $('.fallback-still', media); if (still) still.style.display = 'none';
  window.__site = { ap };
  // practice index: hover/focus previews (150ms intent), click navigates (default link)
  if (matchMedia('(hover: hover)').matches) $$('.practice a').forEach((a) => {
    let tm; const on = () => { clearTimeout(tm); tm = setTimeout(() => ap.preview(a.dataset.cat), 150); }, off = () => { clearTimeout(tm); ap.preview(null); };
    a.addEventListener('pointerenter', on); a.addEventListener('focus', on); a.addEventListener('pointerleave', off); a.addEventListener('blur', off);
  });
  const hero = $('.hero'); const onScroll = () => { const r = hero.getBoundingClientRect(); ap.setScroll(Math.max(0, -r.top) / (r.height * .8)); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}
if (CAPTURE) boot(); else if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 600 }); else setTimeout(boot, 200);

// capture helpers for the showcase recorder
window.__cap = {
  caption(t) { let c = $('.cap'); if (!t) { c && c.remove(); return; } if (!c) { c = document.createElement('div'); c.className = 'cap'; document.body.append(c); } c.textContent = t; },
  end(html) { const d = document.createElement('div'); d.className = 'endcard'; d.innerHTML = html; document.body.append(d); },
};
