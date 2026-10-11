// Projects page: category sections, one navigate() for every category click (REFINE_SPEC §5), sub-filters, case modal routing.
import { REDUCED, CAPTURE } from './engine.js';
import { $, $$ } from './common.js';
import { PROJECTS, CATS } from './data.js';
import { featuredHTML, cardHTML, wireMedia, wireOpeners, routeFromHash, isCaseOpen, closeCase } from './cards.js';
import { xpHTML, wireXP } from './explain.js';
const C = window.SITE_CONFIG || {};
const SUBS = [['all', 'All'], ['detection', 'Detection'], ['measurement', 'Measurement']];
const MAX = 6;
// ---- render ----
$('#cats').innerHTML = CATS.map((c) => {
  const list = PROJECTS.filter((p) => p.cat === c.id), feat = list.find((p) => p.featured) || list[0], rest = list.filter((p) => p !== feat);
  const subf = c.id === 'industrial' && rest.length > 4 ? `<div class="subf" role="group" aria-label="Filter industrial projects">${SUBS.map(([k, l]) => `<button type="button" data-sub="${k}" aria-pressed="${k === 'all'}">${l}</button>`).join('')}</div>` : '';
  const more = list.length > MAX ? `<button class="btn showall" type="button" data-showall aria-expanded="false">Show all (${list.length})</button>` : '';
  return `<section class="cat-sec" id="${c.id}" aria-labelledby="${c.id}-h" tabindex="-1"><div class="wrap">
    <div class="sec-head"><p class="meta eyebrow"><span class="dot" style="background:${c.dot}"></span>${c.label}</p><h2 id="${c.id}-h">${c.h}</h2><p class="lead">${c.sub}</p></div>
    ${xpHTML(c.id)}${featuredHTML(feat)}${c.id === 'recruitment' && C.recruitmentVideo ? '<div id="rv-recruitment"></div>' : ''}${subf}<div class="grid-wrap"><div class="grid3">${rest.map((p, i) => cardHTML(p).replace('class="card"', `class="card${i >= MAX - 1 ? ' hide extra' : ''}"`)).join('')}</div></div>${more}</div></section>`;
}).join('');
$$('.reveal').forEach((e) => e.classList.add('in'));
wireMedia(document); wireXP(document);
// recruitment demo video (config): shown only when set
if (C.recruitmentVideo) {
  const slot = $('#rv-recruitment'); const u = C.recruitmentVideo; const yt = u.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/);
  slot.innerHTML = `<figure style="margin:0 0 48px"><div class="matte"><div class="frame v169">${yt ? '' : `<video controls playsinline preload="metadata" src="${u}"></video>`}</div></div><figcaption>Fig.: Recruitment workflow demo.</figcaption></figure>`;
  if (yt) import('./common.js').then(({ ytFacade }) => slot.querySelector('.frame').replaceChildren(ytFacade(yt[1], 'Recruitment workflow demo')));
}
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
const links = $$('#catlist a'), bar = $('.catnav .bar'), hdr = $('.hdr'), catnav = $('.catnav');
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
  if (programmatic) return; const line = offset() + 1; let cur = CATS[0].id;
  for (const c of CATS) { const r = document.getElementById(c.id).getBoundingClientRect(); if (r.top - line <= innerHeight * .45 - line) cur = c.id; }
  setActive(cur);
}
let spyT; addEventListener('scroll', () => { clearTimeout(spyT); spyT = setTimeout(spy, 60); }, { passive: true });
addEventListener('resize', () => { const a = active; active = null; setActive(a || CATS[0].id); });
// deep links + history
wireOpeners(document);
function fromHash({ initial = false } = {}) {
  const h = location.hash;
  if (h.startsWith('#/work/')) { routeFromHash(); return; }
  const cat = h.slice(1);
  if (isCaseOpen()) closeCase({ fromPop: true, restore: !CATS.some((c) => c.id === cat) }); if (CATS.some((c) => c.id === cat)) navigate(cat, { source: 'hash', animate: !initial });
}
addEventListener('popstate', () => fromHash());
history.scrollRestoration = 'manual';
const init = () => { if (location.hash) fromHash({ initial: true }); else { setActive(CATS[0].id); spy(); } };
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(init));
window.__nav = { navigate, get active() { return active; } };
