// Shared behaviour for every page: header, mobile menu, contact settings + site copy (content/site.json), mailto/copy,
// the "Book a meeting" guide, reveals, lazy videos, YouTube facades.
import { CAPTURE, REDUCED } from './engine.js';
import { scan } from './motion.js';
import { loadSite } from './data.js';
import { openMeet } from './meet.js';
export const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
if (CAPTURE) document.documentElement.classList.add('capture');

// Contact settings. These defaults match the static HTML; content/site.json (edited in the admin panel) overrides them.
export const S = { email: 'asadgulshair6767@gmail.com', linkedinUrl: 'https://www.linkedin.com/in/asad-gulshair', githubUrl: 'https://github.com/asad-gulshair',
  youtubeUrl: 'https://www.youtube.com/@Ultra_Vison20', bookingUrl: '', availability: 'Available for new projects' };
export const mailto = (subject, body = '') => `mailto:${S.email}?subject=${encodeURIComponent(subject)}${body ? '&body=' + encodeURIComponent(body) : ''}`;
export const mailProject = () => mailto('Project enquiry');
export const mailMeeting = () => mailto('Meeting request - project discussion', 'Hi Asad,\n\nI would like to book a Google Meet call about a project.\n\nPreferred times (2-3 options, with your timezone):\n1. \n2. \n3. \n\nShort project summary:\n\n');

// header border on scroll
const hdr = $('.hdr'); const onS = () => hdr && hdr.classList.toggle('scrolled', scrollY > 4); addEventListener('scroll', onS, { passive: true }); onS();
// header height -> --header-h
if (hdr) new ResizeObserver(() => document.documentElement.style.setProperty('--header-h', hdr.offsetHeight + 'px')).observe(hdr);
// mobile menu
const mb = $('.menu-btn'), mn = $('#mnav');
if (mb && mn) {
  const set = (o) => { mb.setAttribute('aria-expanded', String(o)); mn.hidden = !o; mb.textContent = o ? 'Close' : 'Menu'; };
  mb.addEventListener('click', () => set(mn.hidden));
  mn.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mn.hidden && !document.querySelector('dialog[open]')) { set(false); mb.focus(); } });
}
// links and text that follow the contact settings (the HTML already carries working values without JS)
function applyContact() {
  $$('[data-mail=project]').forEach((a) => (a.href = mailProject()));
  $$('[data-mail=plain]').forEach((a) => { a.href = `mailto:${S.email}`; if (a.textContent.includes('@')) a.textContent = S.email; });
  // "Book a meeting" opens the guide (below); without JS the href still works: booking page, or a pre-filled email
  $$('[data-book]').forEach((a) => {
    if (S.bookingUrl) { a.href = S.bookingUrl; a.target = '_blank'; a.rel = 'noopener'; }
    else { a.href = mailMeeting(); a.removeAttribute('target'); }
  });
  $$('[data-gh]').forEach((a) => S.githubUrl && (a.href = S.githubUrl));
  $$('[data-yt]').forEach((a) => S.youtubeUrl && (a.href = S.youtubeUrl));
  $$('[data-li]').forEach((a) => S.linkedinUrl && (a.href = S.linkedinUrl));
  $$('[data-li-text]').forEach((e) => S.linkedinUrl && (e.textContent = S.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')));
  $$('[data-email-text]').forEach((e) => (e.textContent = S.email));
  $$('[data-avail]').forEach((e) => { e.hidden = !S.availability; const t = e.querySelector('span'); if (t && S.availability) t.textContent = S.availability; });
}
applyContact();
// Site copy from content/site.json: [data-site="hero.headline"] takes text; lists are re-rendered only when they differ.
const LISTS = {
  skills: (a) => a.map((g) => `<div><h3>${esc(g.title || '')}</h3><ul>${(g.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join(''),
  experience: (a) => a.map((x) => `<li><span class="meta">${esc(x.period || '')}</span><div><h3>${esc(x.title || '')}${x.current ? ' <span class="cur">Current</span>' : ''}</h3><p>${esc(x.description || '')}</p></div></li>`).join(''),
};
const norm = (h) => { const t = document.createElement('template'); t.innerHTML = h; return t.innerHTML.replace(/>\s+</g, '><').trim(); };
$$('[data-site-list]').forEach((e) => (e._orig = norm(e.innerHTML))); // before motion.js adds its classes
const pick = (o, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), o);
export const site = loadSite().then((d) => {
  Object.entries(d.contact || {}).forEach(([k, v]) => {
    if (!(k in S) || typeof v !== 'string' || !(v.trim() || k === 'bookingUrl' || k === 'availability')) return;
    v = v.trim(); S[k] = /Url$/.test(k) && v && !/^https?:\/\//i.test(v) ? 'https://' + v : v; // "calendly.com/x" still works
  });
  applyContact();
  $$('[data-site]').forEach((e) => { const v = pick(d, e.dataset.site); if (typeof v === 'string' && v.trim() && e.textContent !== v.trim()) e.textContent = v.trim(); });
  $$('[data-site-list]').forEach((e) => { const k = e.dataset.siteList, v = d[k]; if (!Array.isArray(v) || !v.length || !LISTS[k]) return;
    const h = LISTS[k](v); if (norm(h) !== e._orig) { e.innerHTML = h; e._orig = norm(h); scan(e); } });
  return d;
}).catch((err) => { console.warn('Site settings not loaded; using defaults.', err); return {}; });

// copy email (delegated: also covers buttons inside dialogs created later)
let toastEl; export function toast(msg) { if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.append(toastEl); } toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('on'), 1800); }
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; (document.querySelector('dialog[open]') || document.body).append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} ta.remove(); return ok;
  }
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy-email]'); if (!b) return;
  const ok = await copyText(S.email); const lab = b.querySelector('span') || b; if (!b._label) b._label = lab.textContent;
  b.classList.add('copy-ok'); lab.textContent = ok ? 'Copied' : 'Press Ctrl+C'; toast(ok ? 'Email address copied' : S.email);
  b.dataset.copied = ok ? '1' : '0';
  clearTimeout(b._t); b._t = setTimeout(() => { lab.textContent = b._label; b.classList.remove('copy-ok'); }, 1800);
});
// "Book a meeting": every such button opens the "Let's talk" guide. Modifier clicks keep the plain link (new tab etc.).
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-book]'); if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  openMeet({ trigger: a, email: S.email, linkedinUrl: S.linkedinUrl, bookingUrl: S.bookingUrl, meetHref: S.bookingUrl || mailMeeting(), mailHref: mailProject(), fallbackFocus: mb });
});
// reveals (once)
const rv = $$('.reveal');
if (CAPTURE || REDUCED || !('IntersectionObserver' in window)) rv.forEach((e) => e.classList.add('in'));
else { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }); rv.forEach((e) => io.observe(e)); }
// in-view autoplay for muted loops (>=50% visible, not reduced motion)
export function wireVideo(v) {
  if (v._wired) return; v._wired = true;
  if (REDUCED) { v.removeAttribute('autoplay'); v.controls = true; return; }
  if (CAPTURE) { v.preload = 'auto'; if (v.dataset.src && !v.src) v.src = v.dataset.src; return; }
  const io = new IntersectionObserver(([e]) => {
    if (e.intersectionRatio >= .5) { if (!v.src && v.dataset.src) v.src = v.dataset.src; v.play().catch(() => {}); } else if (!v.paused) v.pause();
  }, { threshold: [0, .5] }); io.observe(v);
  v.addEventListener('mouseenter', () => (v.controls = true)); v.addEventListener('focus', () => (v.controls = true));
}
$$('video[data-src]').forEach(wireVideo);
// YouTube click-to-load facade
export function ytFacade(id, title, portrait) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'yt' + (portrait ? ' v916' : ''); b.setAttribute('aria-label', 'Play video: ' + title);
  b.innerHTML = `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy"><span class="play"><span>▶ Watch demo</span></span>`;
  b.addEventListener('click', () => {
    const f = document.createElement('iframe'); f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`; f.title = title; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
    const holder = document.createElement('div'); holder.className = b.className; holder.dataset.playing = '1'; holder.append(f); b.replaceWith(holder); f.focus();
  }, { once: true });
  return b;
}
// year
$$('[data-year]').forEach((e) => (e.textContent = new Date().getFullYear()));
// "Start a project" (contact.html#start): scroll to the contact options and highlight them briefly.
function showStart(smooth) {
  const t = $('#start'); if (!t) return;
  const y = Math.max(0, t.getBoundingClientRect().top + scrollY - (hdr ? hdr.offsetHeight : 0) - 24);
  scrollTo({ top: y, behavior: smooth && !REDUCED ? 'smooth' : 'auto' });
  t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
  const cards = $$('.ccard', t); cards.forEach((c) => c.classList.add('hl'));
  clearTimeout(t._hl); t._hl = setTimeout(() => cards.forEach((c) => c.classList.remove('hl')), 2200);
}
if (location.hash === '#start') requestAnimationFrame(() => showStart(false));
// Links to the page you're already on never "do nothing": they scroll to the relevant spot and move focus there.
const here = (location.pathname.split('/').pop() || 'index.html');
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const href = a.getAttribute('href'); if (/^(https?:|mailto:|#)/.test(href)) return;
  const [file, hash] = href.split('#'); if ((file.replace(/^\.\/?/, '') || 'index.html') !== here) return;
  if (hash === 'start' && $('#start')) { e.preventDefault(); history.replaceState(history.state, '', '#start'); showStart(true); return; }
  if (hash) return;
  e.preventDefault();
  const target = $('main h1, main h2');
  scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
});
