import { CAPTURE, REDUCED } from './engine.js';
import { $, $$, esc, site } from './common.js';
import { scan } from './motion.js';
import { PROJECTS, CATS, bySlug, loadProjects } from './data.js';
import { featuredHTML, cardHTML, wireMedia, wireOpeners, routeFromHash } from './cards.js';
import { xpMiniHTML, wireXP } from './explain.js';

// ---- proof (best three results) + areas, from content/projects.json; picks from content/site.json → home ----
function render(home = {}) {
  const proof = $('#proof');
  const main = bySlug(home.featuredProject) || bySlug('tomato-ripeness-grading') || PROJECTS.find((p) => p.featured) || PROJECTS[0];
  const pref = Array.isArray(home.highlightProjects) && home.highlightProjects.length ? home.highlightProjects : ['flange-dimension-compliance', 'potato-disease-cnn'];
  const side = pref.map(bySlug).filter((p) => p && p !== main).slice(0, 2);
  proof.innerHTML = (main ? `<div class="p-main">${featuredHTML(main, { hrefBase: 'projects.html' })}</div>` : '') + side.map((p) => `<div class="p-side reveal in">${cardHTML(p, { hrefBase: 'projects.html' })}</div>`).join('');
  $$('.reveal', proof).forEach((e) => e.classList.add('in'));
  wireMedia(proof);
  const areas = $('#areas');
  areas.innerHTML = CATS.map((c) => { const n = PROJECTS.filter((p) => p.cat === c.id).length; if (!n) return '';
    return `<a href="projects.html#${c.id}" data-cat="${c.id}">${xpMiniHTML(c.id)}<span class="meta eyebrow"><span class="dot" style="background:${esc(c.dot)}"></span>${esc(c.label)}</span><h3>${esc(c.h)}</h3><p>${esc(c.sub)}</p><span class="go"><span data-count="${n}">${n}</span> project${n === 1 ? '' : 's'} →</span></a>`; }).join('');
  wireXP(areas); scan(proof); scan(areas);
  $$('.practice a').forEach((a) => { const c = CATS.find((x) => x.id === a.dataset.cat); if (c && a.lastChild.textContent !== c.label) a.lastChild.textContent = c.label; });
}
wireOpeners(document);
Promise.all([loadProjects(), site]).then(([, d]) => {
  render(d.home);
  addEventListener('popstate', routeFromHash); addEventListener('hashchange', routeFromHash);
  if (location.hash.startsWith('#/work/')) routeFromHash();
}).catch((err) => {
  console.error('Projects not loaded:', err);
  $('#proof').innerHTML = `<div class="load-err" role="alert" style="grid-column:1/-1"><p>The project highlights didn’t load. <a class="tlink" href="projects.html">Open the work page</a></p></div>`;
  $('#areas').closest('section').hidden = true;
});

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
