// Projects page: category sections, one navigate() for every category click (REFINE_SPEC §5), sub-filters, case modal routing.
// Content comes from content/projects.json (loadProjects); nothing is wired until it has rendered.
import { REDUCED } from './engine.js';
import { scan } from './motion.js';
import { $, $$, esc, site, ytFacade, S } from './common.js';
import { PROJECTS, CATS, loadProjects, ytId } from './data.js';
import { featuredHTML, cardHTML, wireMedia, wireOpeners, routeFromHash, isCaseOpen, closeCase } from './cards.js';
import { xpHTML, wireXP } from './explain.js';
const SUBS = [['all', 'All'], ['detection', 'Detection'], ['measurement', 'Measurement']];
const MAX = 6;
// ---- render ----
function render(rv) {
  const used = CATS.filter((c) => PROJECTS.some((p) => p.cat === c.id));
  $('#cats').innerHTML = used.map((c) => {
    const list = PROJECTS.filter((p) => p.cat === c.id), feat = list.find((p) => p.featured) || list[0], rest = list.filter((p) => p !== feat);
    const subf = c.id === 'industrial' && rest.length > 4 ? `<div class="subf" role="group" aria-label="Filter industrial projects">${SUBS.map(([k, l]) => `<button type="button" data-sub="${k}" aria-pressed="${k === 'all'}">${l}</button>`).join('')}</div>` : '';
    const more = list.length > MAX ? `<button class="btn showall" type="button" data-showall aria-expanded="false">Show all (${list.length})</button>` : '';
    return `<section class="cat-sec" id="${c.id}" aria-labelledby="${c.id}-h" tabindex="-1"><div class="wrap">
    <div class="sec-head"><p class="meta eyebrow"><span class="dot" style="background:${esc(c.dot)}"></span>${esc(c.label)}</p><h2 id="${c.id}-h">${esc(c.h)}</h2><p class="lead">${esc(c.sub)}</p></div>
    ${featuredHTML(feat)}${c.id === 'recruitment' && rv ? '<div id="rv-recruitment"></div>' : ''}${subf}<div class="grid-wrap"><div class="grid3">${rest.map((p, i) => cardHTML(p).replace('class="card"', `class="card${i >= MAX - 1 ? ' hide extra' : ''}"`)).join('')}</div></div>${more}${xpHTML(c.id) ? `<details class="xp-more"><summary>How this kind of system helps</summary>${xpHTML(c.id)}</details>` : ''}</div></section>`;
  }).join('');
  // category bar follows the data: labels from the file, categories without projects hidden
  $$('#catlist a').forEach((a) => { const c = used.find((x) => x.id === a.dataset.cat); a.parentElement.hidden = !c; if (c && a.lastChild.textContent !== c.label) a.lastChild.textContent = c.label; });
  $$('.reveal').forEach((e) => e.classList.add('in'));
  wireMedia(document); wireXP(document); scan($('#cats'));
  // recruitment demo video (content/site.json → recruitmentVideo): shown only when set
  const slot = $('#rv-recruitment');
  if (slot) {
    const yt = ytId(rv);
    slot.innerHTML = `<figure style="margin:0 0 48px"><div class="matte"><div class="frame v169">${yt ? '' : `<video controls playsinline preload="metadata" src="${rv.replace(/"/g, '&quot;')}"></video>`}</div></div><figcaption>Fig.: Recruitment workflow demo.</figcaption></figure>`;
    if (yt) slot.querySelector('.frame').replaceChildren(ytFacade(yt, 'Recruitment workflow demo'));
  }
  return used;
}
function renderError() {
  $('.catnav').hidden = true;
  $('#cats').innerHTML = `<section class="cat-sec" aria-labelledby="err-h"><div class="wrap"><div class="load-err" role="alert"><p class="meta">Projects</p>
    <h2 id="err-h">The project list didn’t load.</h2><p>Check your connection and try again, or browse the code on GitHub.</p>
    <div class="cta-row"><button class="btn btn-primary" type="button" data-reload>Try again</button><a class="btn" href="${S.githubUrl}" data-gh target="_blank" rel="noopener">Open GitHub ↗</a></div></div></div></section>`;
  $('[data-reload]').addEventListener('click', () => location.reload());
}
function start(used) {
  // ---- sub-filters (no scroll, no URL change, locked min-height during FLIP) ----
  $$('.subf button').forEach((b) => b.addEventListener('click', () => {
    const sec = b.closest('.cat-sec'), grid = $('.grid3', sec), k = b.dataset.sub;
    $$('.subf button', sec).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const cards = $$('.card', grid), first = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
    grid.style.minHeight = grid.offsetHeight + 'px';
    const expanded = sec.querySelector('[data-showall]')?.getAttribute('aria-expanded') === 'true';
    cards.forEach((c) => { const match = k === 'all' || c.dataset.sub === k; c.classList.toggle('hide', !match || (k === 'all' && c.classList.contains('extra') && !expanded)); });
    if (!REDUCED) cards.filter((c) => !c.classList.contains('hide')).forEach((c) => { const a = first.get(c), z = c.getBoundingClientRect(); if (!a.width) { c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 }); return; }
      c.animate([{ transform: `translate(${a.left - z.left}px,${a.top - z.top}px)` }, { transform: 'none' }], { duration: 400, easing: 'cubic-bezier(.2,.7,.2,1)' }); });
    setTimeout(() => (grid.style.minHeight = ''), 420);
  }));
  $$('[data-showall]').forEach((b) => b.addEventListener('click', () => {
    const sec = b.closest('.cat-sec'), open = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(open));
    const k = $('.subf button[aria-pressed=true]', sec)?.dataset.sub || 'all';
    $$('.card.extra', sec).forEach((c) => c.classList.toggle('hide', !open || (k !== 'all' && c.dataset.sub !== k)));
    b.textContent = open ? 'Show fewer' : `Show all (${$$('.card', sec).length + 1})`;
  }));
  // ---- navigation ----
  const links = $$('#catlist a').filter((a) => !a.parentElement.hidden), bar = $('.catnav .bar'), hdr = $('.hdr'), catnav = $('.catnav');
  const ids = used.map((c) => c.id), isCat = (id) => ids.includes(id);
  const offset = () => hdr.offsetHeight + catnav.offsetHeight + 24;
  let active = null, programmatic = false, progTimer;
  function setActive(cat) {
    if (active === cat) return; active = cat;
    links.forEach((a) => (a.dataset.cat === cat ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    const a = links.find((x) => x.dataset.cat === cat);
    if (a) { const ul = a.closest('ul'); bar.style.width = a.offsetWidth - 28 + 'px'; bar.style.transform = `translateX(${a.offsetLeft + 14}px)`;
      const li = a.parentElement; if (ul.scrollWidth > ul.clientWidth) ul.scrollTo({ left: li.offsetLeft - 16, behavior: REDUCED ? 'auto' : 'smooth' }); }
  }
  function navigate(cat, { source = 'click', animate = true } = {}) {
    const sec = document.getElementById(cat); if (!sec) return;
    setActive(cat);
    if (source === 'click') history.pushState({ cat }, '', '#' + cat);
    const top = sec.getBoundingClientRect().top + scrollY - offset();
    const done = () => { programmatic = false; spy(); sec.focus({ preventScroll: true }); };
    if (Math.abs(sec.getBoundingClientRect().top - offset()) <= 8) { done(); return; }
    programmatic = true; clearTimeout(progTimer);
    const smooth = animate && !REDUCED;
    scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    if (!smooth) { done(); return; }
    let last = -1, still = 0; const watch = () => { if (Math.abs(scrollY - last) < 1) still++; else still = 0; last = scrollY; if (still > 6) return done(); progTimer = setTimeout(watch, 40); }; watch();
  }
  links.forEach((a) => a.addEventListener('click', (e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); navigate(a.dataset.cat, { source: 'click' }); }));
  // scroll-spy: updates aria-current only, never the URL
  function spy() {
    if (programmatic || !ids.length) return; const line = offset() + 1; let cur = ids[0];
    for (const id of ids) { const r = document.getElementById(id).getBoundingClientRect(); if (r.top - line <= innerHeight * .45 - line) cur = id; }
    setActive(cur);
  }
  let spyT; addEventListener('scroll', () => { clearTimeout(spyT); spyT = setTimeout(spy, 60); }, { passive: true });
  addEventListener('resize', () => { const a = active; active = null; setActive(a || ids[0]); });
  // deep links + history
  wireOpeners(document);
  function fromHash({ initial = false } = {}) {
    const h = location.hash;
    if (h.startsWith('#/work/')) { routeFromHash(); return; }
    const cat = h.slice(1);
    if (isCaseOpen()) closeCase({ fromPop: true, restore: !isCat(cat) }); if (isCat(cat)) navigate(cat, { source: 'hash', animate: !initial });
  }
  addEventListener('popstate', () => fromHash());
  // typed/pasted #/work/<slug> on this page: routeFromHash ignores a case that is already open, so popstate + hashchange can't double-open
  addEventListener('hashchange', () => { if (location.hash.startsWith('#/work/')) routeFromHash(); });
  history.scrollRestoration = 'manual';
  const init = () => { if (location.hash) fromHash({ initial: true }); else { setActive(ids[0]); spy(); } };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(init));
  window.__nav = { navigate, get active() { return active; } };
}
Promise.all([loadProjects(), site]).then(([, d]) => start(render(typeof d.recruitmentVideo === 'string' ? d.recruitmentVideo.trim() : '')))
  .catch((err) => { console.error('Projects not loaded:', err); renderError(); });
