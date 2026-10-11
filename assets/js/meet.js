// "Book a meeting" guide: an accessible modal ("Let's talk") with three ways to connect: Google Meet call, LinkedIn, email.
// Native <dialog> (inert background) plus an explicit Tab loop; Esc, the close button and the backdrop close it.
// Small inline SVG motion; static for prefers-reduced-motion and capture mode.
import { CAPTURE, REDUCED } from './engine.js';
const STILL = REDUCED || CAPTURE;
const A = '#E8743B', T2 = '#A3A7AB', T3 = '#6E7378', S2 = '#171A1E', BS = '#343A40';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ICON = (b) => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const IC_MEET = ICON(`<rect x="3" y="9" width="18" height="14" rx="2"/><path d="M7 19l3-3 2 2 3-4 2 3"/><path d="M21 14l7-4v12l-7-4" stroke="${A}"/>`);
const IC_LI = ICON(`<rect x="4" y="4" width="24" height="24" rx="4"/><path d="M10 14v8M10 10v.01"/><path d="M15 22v-8M15 17.5c0-2 1.5-3.5 3.5-3.5S22 15.5 22 17.5V22" stroke="${A}"/>`);
const IC_MAIL = ICON(`<rect x="4" y="7" width="24" height="18" rx="2"/><path d="M5 9l11 8 11-8" stroke="${A}"/>`);
// three routes from you to me; a pulse travels each in turn, and the call frame pings when it arrives
const ROUTES = ['M58 48C110 48 116 18 160 18S210 48 262 48', 'M58 48H262', 'M58 48C110 48 116 78 160 78S210 48 262 48'];
const chipIc = ['<rect x="-5" y="-4" width="10" height="9" rx="1.5"/><path d="M-5 -1H5M-2.5 -6V-3M2.5 -6V-3"/>',
  '<path d="M-3 -1V4M-3 -4V-3.9M0 4V-1M0 1.5C0 0 1 -1 2.2 -1S4 0 4 1.5V4"/>', '<rect x="-5.5" y="-4" width="11" height="8" rx="1.2"/><path d="M-5 -3L0 1L5 -3"/>'];
function art() {
  const pulses = STILL ? '' : ROUTES.map((d, i) => `<circle r="2.6" fill="${A}" opacity="0"><animateMotion dur="1.6s" begin="${.4 + i * 1.2}s;mp${i}.end+2s" id="mp${i}" path="${d}"/>`
    + `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.85;1" dur="1.6s" begin="mp${i}.begin"/></circle>`).join('');
  return `<svg viewBox="0 0 320 96" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    ${ROUTES.map((d) => `<path d="${d}" stroke="${BS}"/><path class="mt-dash" d="${d}" stroke="${T3}" stroke-dasharray="2 6"/>`).join('')}
    ${[18, 48, 78].map((y, i) => `<g class="mt-chip" style="--i:${i}" transform="translate(160 ${y})"><rect x="-13" y="-11" width="26" height="22" rx="6" fill="${S2}" stroke="${BS}"/><g stroke="${i === 0 ? A : T2}">${chipIc[i]}</g></g>`).join('')}
    <circle cx="40" cy="48" r="18" fill="${S2}" stroke="${T2}"/><circle cx="40" cy="43" r="4.5" stroke="${T2}"/><path d="M32 56c1.5-5 4.5-7 8-7s6.5 2 8 7" stroke="${T2}"/>
    <circle class="mt-ping" cx="280" cy="48" r="18" stroke="${A}"/>
    <rect x="262" y="36" width="36" height="24" rx="5" fill="${S2}" stroke="${A}"/><circle cx="276" cy="46" r="3.5" stroke="${A}"/><path d="M270 56c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5" stroke="${A}"/><path d="M287 44h6M287 48h4" stroke="${T3}"/>
    <text x="40" y="88" text-anchor="middle" font-family="Geist Mono,monospace" font-size="8" letter-spacing=".08em" fill="${T3}">YOU</text>
    <text x="280" y="88" text-anchor="middle" font-family="Geist Mono,monospace" font-size="8" letter-spacing=".08em" fill="${T3}">ASAD</text>${pulses}</svg>`;
}
function bodyHTML(o) {
  const meet = o.bookingUrl
    ? { line: 'Pick a free slot for a short video call about your project.', btn: `<a class="btn btn-primary sm" href="${esc(o.meetHref)}" target="_blank" rel="noopener">Pick a time ↗</a>` }
    : { line: 'Suggest 2–3 times by email and I’ll send a Google Meet invite.', btn: `<a class="btn btn-primary sm" href="${esc(o.meetHref)}" title="Opens your default email app">Request a call</a>` };
  const way = (i, ic, h, line, acts) => `<li class="mw" style="--i:${i}"><span class="step-ic" aria-hidden="true">${ic}</span><div class="mw-t"><h3>${h}</h3>${line}</div><div class="acts">${acts}</div></li>`;
  return `<button class="case-x meet-x" type="button" aria-label="Close">×</button>
    <div class="meet-art">${art()}</div>
    <p class="meta">Book a meeting</p><h2 id="meet-h" tabindex="-1">Let’s talk</h2>
    <p class="meet-lead" id="meet-d">Three ways to reach me. Pick whichever is easiest for you.</p>
    <ul class="meet-ways">
      ${way(0, IC_MEET, 'Book a Google Meet call', `<p>${meet.line}</p>`, meet.btn)}
      ${way(1, IC_LI, 'Connect on LinkedIn', '<p>Send a message or connect, whichever you prefer.</p>', `<a class="btn sm" href="${esc(o.linkedinUrl)}" target="_blank" rel="noopener">Open LinkedIn ↗</a>`)}
      ${way(2, IC_MAIL, 'Email', `<p class="v">${esc(o.email)}</p>`, `<button class="btn sm" type="button" data-copy-email><span>Copy email</span></button><a class="btn sm" href="${esc(o.mailHref)}" title="Opens your default email app">Email me</a>`)}
    </ul>`;
}
let dlg, inner, trigger = null, fallback = null, closing = 0;
const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
const visible = (el) => el && document.contains(el) && el.getClientRects().length > 0;
function cleanup() {
  inner.innerHTML = '';
  if (!document.querySelector('dialog[open]')) document.documentElement.classList.remove('lock');
  const t = visible(trigger) ? trigger : fallback; if (t) t.focus({ preventScroll: true });
}
function close() {
  if (!dlg || !dlg.open || closing) return;
  dlg.classList.add('closing');
  closing = setTimeout(() => { closing = 0; dlg.classList.remove('closing'); if (dlg.open) dlg.close(); else cleanup(); }, STILL ? 0 : 180); // 'close' runs cleanup()
}
function ensure() {
  if (dlg) return;
  dlg = document.createElement('dialog'); dlg.className = 'meet'; dlg.setAttribute('aria-labelledby', 'meet-h'); dlg.setAttribute('aria-describedby', 'meet-d');
  inner = document.createElement('div'); inner.className = 'meet-in'; dlg.append(inner); document.body.append(dlg);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('.meet-x')) close(); });
  // every way of closing ends here, including the browser closing it on its own (e.g. a repeated Esc)
  dlg.addEventListener('close', () => { if (closing) { clearTimeout(closing); closing = 0; dlg.classList.remove('closing'); } cleanup(); });
  // keep Tab inside the dialog (the page behind is inert, this also stops focus escaping to the browser UI mid-dialog)
  dlg.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = [...dlg.querySelectorAll(FOCUSABLE)].filter(visible); if (!f.length) return;
    const first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (e.shiftKey && (a === first || !dlg.contains(a) || a.id === 'meet-h')) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  });
}
export function openMeet(o) {
  ensure();
  if (closing) { clearTimeout(closing); closing = 0; dlg.classList.remove('closing'); }
  trigger = o.trigger || document.activeElement; fallback = o.fallbackFocus || null;
  inner.innerHTML = bodyHTML(o);
  if (!dlg.open) { document.documentElement.classList.add('lock'); dlg.showModal(); }
  dlg.querySelector('#meet-h').focus({ preventScroll: true });
}
