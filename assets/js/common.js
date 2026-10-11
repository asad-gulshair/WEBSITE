// Shared behaviour for every page: header, mobile menu, mailto/booking/copy, reveals, lazy videos, YouTube facades.
import { CAPTURE, REDUCED } from './engine.js';
import './motion.js';
const C = window.SITE_CONFIG || {};
export const EMAIL = C.email || 'asadgulshair6767@gmail.com';
export const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
if (CAPTURE) document.documentElement.classList.add('capture');

export const mailto = (subject, body = '') => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}${body ? '&body=' + encodeURIComponent(body) : ''}`;
export const MAIL_PROJECT = mailto('Project enquiry', 'Hi Asad,\n\nWhat I need:\n\nWhat a good result looks like:\n\nData / cameras / tools involved:\n\nTimeline:\n');
export const MAIL_MEETING = mailto('Meeting request – project discussion', 'Hi Asad,\n\nI would like to book a call about a project.\n\nPreferred times (with timezone):\n- \n- \n\nShort project summary:\n\n');

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
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mn.hidden) { set(false); mb.focus(); } });
}
// mailto + booking wiring (links already carry working hrefs without JS)
$$('[data-mail=project]').forEach((a) => (a.href = MAIL_PROJECT));
$$('[data-mail=plain]').forEach((a) => (a.href = `mailto:${EMAIL}`));
$$('[data-book]').forEach((a) => {
  if (C.bookingUrl) { a.href = C.bookingUrl; a.target = '_blank'; a.rel = 'noopener'; }
  else { a.href = MAIL_MEETING; a.removeAttribute('target'); }
});
$$('[data-gh]').forEach((a) => C.github && (a.href = C.github));
$$('[data-yt]').forEach((a) => C.youtube && (a.href = C.youtube));
$$('[data-repo]').forEach((a) => C.repoUrl && (a.href = C.repoUrl));
$$('[data-email-text]').forEach((e) => (e.textContent = EMAIL));
$$('[data-avail]').forEach((e) => { if (!C.availability) e.remove(); else { const t = e.querySelector('span'); if (t) t.textContent = C.availability; } });
// copy email
let toastEl; export function toast(msg) { if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.append(toastEl); } toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('on'), 1800); }
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} ta.remove(); return ok;
  }
}
$$('[data-copy-email]').forEach((b) => b.addEventListener('click', async () => {
  const ok = await copyText(EMAIL); const lab = b.querySelector('span') || b; const old = lab.textContent;
  b.classList.add('copy-ok'); lab.textContent = ok ? 'Copied' : 'Press Ctrl+C'; toast(ok ? 'Email address copied' : EMAIL);
  b.dataset.copied = ok ? '1' : '0';
  setTimeout(() => { lab.textContent = old; b.classList.remove('copy-ok'); }, 1800);
}));
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
// Links to the page you're already on never "do nothing": they scroll to the relevant spot and move focus there.
const here = (location.pathname.split('/').pop() || 'index.html');
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const href = a.getAttribute('href'); if (/^(https?:|mailto:|#)/.test(href)) return;
  const [file, hash] = href.split('#'); if ((file.replace(/^\.\/?/, '') || 'index.html') !== here || hash) return;
  e.preventDefault();
  const target = (here === 'contact.html' && a.textContent.trim() === 'Start a project') ? $('.ccards .ccard') : $('main h1, main h2');
  const y = target ? Math.max(0, target.getBoundingClientRect().top + scrollY - (hdr ? hdr.offsetHeight : 0) - 24) : 0;
  scrollTo({ top: here === 'contact.html' && target && target.classList.contains('ccard') ? y : 0, behavior: REDUCED ? 'auto' : 'smooth' });
  if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); if (target.classList.contains('ccard')) { target.style.borderColor = 'var(--accent)'; setTimeout(() => (target.style.borderColor = ''), 1600); } }
});
