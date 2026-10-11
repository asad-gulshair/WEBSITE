// Project cards + case-study <dialog> with #/work/<slug> routing (REFINE_SPEC §4).
import { PROJECTS, CATS, bySlug } from './data.js';
import { ILLUS } from './illus.js';
import { $, $$, wireVideo, ytFacade, MAIL_PROJECT } from './common.js';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PORTRAIT_YT = new Set(['2M2n8RWnKWY', '9RqJkD2Xtv8']);
export function mediaHTML(p, { inCard = false, eager = false } = {}) {
  const m = p.media; const alt = esc(m.cap.replace(/\s*\(Illustration\)/, ''));
  if (m.type === 'illus') return `<div class="frame" data-illus="${m.key}">${ILLUS[m.key]()}<span class="illus-tag">Illustration</span></div>`;
  if (m.type === 'video') {
    const port = m.portrait ? ' portrait' : '';
    const bg = m.portrait ? `<img class="blurbg" src="${m.poster}" alt="" aria-hidden="true" loading="lazy">` : '';
    return `<div class="frame${inCard ? '' : ' v169'}${port}">${bg}<video muted loop playsinline preload="none" poster="${m.poster}" data-src="${m.src}" aria-label="${alt}"></video></div>`;
  }
  return `<div class="frame"><img src="${m.src}" alt="${alt}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" width="1280" height="800"></div>`;
}
const badge = (p) => `<span class="meta badge ${p.badge.replace(/\s/g, '')}"><b>${p.badge}</b> · ${p.year}</span>`;
export function cardHTML(p, { hrefBase = '' } = {}) {
  const ext = p.code ? `<a class="ext" href="${p.code}" target="_blank" rel="noopener">View code ↗</a>` : '';
  return `<article class="card" data-slug="${p.slug}" data-sub="${p.sub || ''}">${mediaHTML(p, { inCard: true })}
    <div class="card-body">${badge(p)}<h3>${esc(p.title)}</h3><p>${esc(p.outcome)}</p>
    <div class="tags">${p.stack.slice(0, 4).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    <div class="card-foot"><a class="card-open" href="${hrefBase}#/work/${p.slug}" data-open="${p.slug}">View case study →</a>${ext}</div></div></article>`;
}
export function featuredHTML(p, { hrefBase = '' } = {}) {
  const ext = p.code ? `<a class="tlink" href="${p.code}" target="_blank" rel="noopener">View code ↗</a>` : '';
  return `<div class="featured reveal" data-slug="${p.slug}"><figure class="m0"><div class="matte">${mediaHTML(p)}</div><figcaption>Fig. ${esc(p.media.cap)}</figcaption></figure>
    <div class="text">${badge(p)}<h3>${esc(p.title)}</h3><p>${esc(p.outcome)}</p><p>${esc(p.problem)}</p>
    <div class="tags">${p.stack.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    <div class="actions"><a class="btn" href="${hrefBase}#/work/${p.slug}" data-open="${p.slug}">View case study</a>${ext}</div></div></div>`;
}
export function wireMedia(root) { $$('video[data-src]', root).forEach(wireVideo); }

// ---------------- modal ----------------
let dlg, lastTrigger = null, savedY = 0, pushed = false, curSlug = null;
function ensureDialog() {
  if (dlg) return dlg;
  dlg = document.createElement('dialog'); dlg.className = 'case'; dlg.setAttribute('aria-labelledby', 'case-title');
  dlg.innerHTML = '<button class="case-x" type="button" aria-label="Close case study">×</button><div class="case-scroll"></div>';
  document.body.append(dlg);
  dlg.querySelector('.case-x').addEventListener('click', () => closeCase());
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeCase(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeCase(); });
  return dlg;
}
function caseHTML(p) {
  const cat = CATS.find((c) => c.id === p.cat); const sib = PROJECTS.filter((x) => x.cat === p.cat); const i = sib.indexOf(p);
  const prev = sib[(i - 1 + sib.length) % sib.length], next = sib[(i + 1) % sib.length];
  const links = [p.code && `<a class="btn sm" href="${p.code}" target="_blank" rel="noopener">View code ↗</a>`, p.paper && `<a class="btn sm" href="${p.paper}" target="_blank" rel="noopener">Read the paper ↗</a>`,
    ...(p.more || []).map(([t, u]) => `<a class="tlink" href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`), `<a class="tlink" href="${MAIL_PROJECT}">Start a similar project</a>`].filter(Boolean).join('');
  const yt = p.youtube ? `<div class="blk"><div class="meta">Demo video</div><div data-yt-slot></div></div>` : '';
  const extra = p.extra ? `<figure style="margin:0"><div class="matte"><div class="frame" style="aspect-ratio:auto;background:#fff"><img src="${p.extra.src}" alt="${esc(p.extra.cap)}" loading="lazy"></div></div><figcaption>Fig. 2: ${esc(p.extra.cap)}</figcaption></figure>` : '';
  return `<div class="meta eyebrow"><span class="dot" style="background:${cat.dot}"></span>${esc(cat.label)}</div>
    <h2 id="case-title" tabindex="-1">${esc(p.title)}</h2><p class="out">${esc(p.outcome)}</p>
    <div class="mrow meta"><span>Type: <b style="color:var(--text-2);font-weight:500">${p.badge}</b></span><span>Year: ${p.year}</span><span>Role: ${esc(p.role)}</span></div>
    <figure style="margin:0 0 8px"><div class="matte">${mediaHTML(p, { eager: true })}</div><figcaption>Fig. 1: ${esc(p.media.cap)}</figcaption></figure>
    <div class="blk"><div class="meta">Problem</div><p>${esc(p.problem)}</p></div>
    <div class="blk"><div class="meta">Approach</div><ul>${p.approach.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
    <div class="blk"><div class="meta">Result</div><div style="display:grid;gap:20px"><p>${esc(p.result)}</p>${extra}</div></div>
    ${yt}
    <div class="blk"><div class="meta">Stack</div><div class="tags">${p.stack.map((t) => `<span>${esc(t)}</span>`).join('')}</div></div>
    <div class="blk"><div class="meta">Links</div><div class="links">${links}</div></div>
    <div class="pn"><button type="button" data-goto="${prev.slug}">← ${esc(prev.title)}</button><button type="button" data-goto="${next.slug}">${esc(next.title)} →</button></div>`;
}
export function openCase(slug, { trigger = null, push = true } = {}) {
  const p = bySlug(slug); if (!p) return false; ensureDialog();
  const sc = dlg.querySelector('.case-scroll'); sc.innerHTML = caseHTML(p); sc.scrollTop = 0; curSlug = slug;
  if (p.youtube) dlg.querySelector('[data-yt-slot]').append(ytFacade(p.youtube, p.title, PORTRAIT_YT.has(p.youtube)));
  wireMedia(sc);
  $$('[data-goto]', sc).forEach((b) => b.addEventListener('click', () => { openCase(b.dataset.goto, { push: false }); history.replaceState(history.state, '', '#/work/' + b.dataset.goto); }));
  if (!dlg.open) { savedY = scrollY; lastTrigger = trigger || document.activeElement; document.documentElement.classList.add('lock'); dlg.showModal(); }
  if (push) { history.pushState({ modal: 1 }, '', '#/work/' + slug); pushed = true; }
  dlg.querySelector('#case-title').focus({ preventScroll: true });
  return true;
}
export function closeCase({ fromPop = false, restore = true } = {}) {
  if (!dlg || !dlg.open) return;
  const finish = () => { dlg.classList.remove('closing'); dlg.close(); document.documentElement.classList.remove('lock'); if (restore) scrollTo(0, savedY); $$('video', dlg).forEach((v) => v.pause()); dlg.querySelector('.case-scroll').innerHTML = ''; curSlug = null;
    if (restore && lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true }); };
  dlg.classList.add('closing'); setTimeout(finish, 190);
  if (!fromPop) { if (pushed) { pushed = false; history.back(); } else history.replaceState(null, '', location.pathname + location.search); }
  else pushed = false;
}
export const isCaseOpen = () => !!(dlg && dlg.open);
// clicks on [data-open] links: plain primary click opens in place; modifiers keep default (new tab)
export function wireOpeners(root = document) {
  let down = null;
  root.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; }, true);
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-open]'); if (!a) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 && e.detail) return; // drag/select, not a click
    openCase(a.dataset.open, { trigger: a });
  });
}
export function routeFromHash() { const m = location.hash.match(/^#\/work\/([\w-]+)/); if (m) { if (curSlug !== m[1]) openCase(m[1], { push: false }); return true; } if (isCaseOpen()) closeCase({ fromPop: true }); return false; }
