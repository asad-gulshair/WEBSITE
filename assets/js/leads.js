// Client enquiry form (contact page + home CTA). Mounts into every [data-lead-form="full|compact"].
// Delivery: POSTs to contact.formEndpoint (content/site.json): FormSubmit (https://formsubmit.co/ajax/<email>, emails each
// enquiry), the Google Apps Script web app in tools/lead-capture.gs (Google Sheet + email) or Formspree. With no endpoint set, or if sending fails,
// it opens a pre-filled email instead, so an enquiry is never silently lost.
import { $, $$, S, site, esc, toast } from './common.js';

const TOPICS = ['Computer vision inspection and detection', 'Recruitment and HR automation', 'Workflow automation', 'Document processing', 'AI agent for my business', 'Something else'];
const BUDGETS = ['Not sure yet', 'Under $500', '$500 – $2,000', '$2,000 – $5,000', '$5,000+'];
const TIMES = ['Flexible', 'Within a month', 'ASAP'];
const REPLY = ['Email', 'WhatsApp', 'Phone call', 'LinkedIn'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
let uid = 0;

function formHTML(kind) {
  const id = 'lf' + ++uid, full = kind === 'full';
  const opts = (a) => a.map((v) => `<option>${esc(v)}</option>`).join('');
  return `<form class="lf" novalidate data-kind="${kind}" aria-labelledby="${id}-t">
    <div class="lf-head"><p class="meta">${full ? 'Start a project' : 'Quick enquiry'}</p><h2 class="lf-t" id="${id}-t">${full ? 'Tell me what you want to build.' : 'Send a short note.'}</h2>
      ${full ? '<p class="lf-sub">A few lines are enough. I reply within a day, usually with a first view on feasibility.</p>' : ''}</div>
    <div class="lf-grid">
      <label class="lf-f"><span>Your name <i aria-hidden="true">*</i></span><input name="name" autocomplete="name" required maxlength="80" placeholder="Jane Doe"><em class="lf-err" aria-live="polite"></em></label>
      <label class="lf-f"><span>Email <i aria-hidden="true">*</i></span><input name="email" type="email" autocomplete="email" inputmode="email" required maxlength="120" placeholder="jane@company.com"><em class="lf-err" aria-live="polite"></em></label>
      ${full ? `<label class="lf-f"><span>Company <small>optional</small></span><input name="company" autocomplete="organization" maxlength="100" placeholder="Company or team"></label>
      <label class="lf-f"><span>What do you need?</span><select name="topic">${opts(TOPICS)}</select></label>
      <label class="lf-f"><span>Budget <small>optional</small></span><select name="budget">${opts(BUDGETS)}</select></label>
      <label class="lf-f"><span>Timeline</span><select name="timeline">${opts(TIMES)}</select></label>
      <label class="lf-f"><span>How should I reply?</span><select name="reply">${opts(REPLY)}</select></label>
      <label class="lf-f"><span>Phone or WhatsApp <small>optional</small></span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" placeholder="+92 300 0000000"></label>` : ''}
      <label class="lf-f lf-wide"><span>${full ? 'Project details' : 'Message'} <i aria-hidden="true">*</i></span><textarea name="message" rows="${full ? 5 : 3}" required minlength="15" maxlength="3000" placeholder="${full ? 'What do you want detected, automated or handled by an agent? What does a good result look like?' : 'What are you trying to automate?'}"></textarea><em class="lf-err" aria-live="polite"></em></label>
      <label class="lf-hp" aria-hidden="true">Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label>
    </div>
    <div class="lf-foot">
      <button class="btn btn-primary" type="submit"><span>Send enquiry</span></button>
      <p class="lf-note">Your details are only used to reply to you.</p>
    </div>
    <p class="lf-status" role="status" aria-live="polite" hidden></p>
  </form>`;
}

const mailBody = (d) => `Hi Asad,\n\n${d.message}\n\n---\nName: ${d.name}\nEmail: ${d.email}${d.company ? '\nCompany: ' + d.company : ''}${d.topic ? '\nNeed: ' + d.topic : ''}${d.budget && d.budget !== 'Not sure yet' ? '\nBudget: ' + d.budget : ''}${d.timeline ? '\nTimeline: ' + d.timeline : ''}${d.reply ? '\nReply by: ' + d.reply : ''}${d.phone ? '\nPhone: ' + d.phone : ''}\n`;
const mailHref = (d) => `mailto:${S.email}?subject=${encodeURIComponent('Project enquiry from ' + d.name)}&body=${encodeURIComponent(mailBody(d))}`;

async function deliver(d) {
  const ep = (S.formEndpoint || '').trim();
  if (!ep) return 'mailto';
  const formsubmit = /formsubmit\.co\/ajax\//i.test(ep), formspree = /formspree\.io/i.test(ep);
  // FormSubmit and Formspree take JSON; an Apps Script web app takes a "simple" text/plain request (no CORS preflight).
  const json = formsubmit || formspree;
  const body = formsubmit ? { ...d, _subject: `New project enquiry: ${d.name}${d.topic ? ' (' + d.topic + ')' : ''}`, _template: 'table', _captcha: 'false', _replyto: d.email, _autoresponse: `Hi ${(d.name || '').split(/\s+/)[0] || 'there'},\n\nThank you for getting in touch. I have received your enquiry${d.topic ? ' about ' + d.topic.toLowerCase() : ''} and will reply within one working day.\n\nIf you have sample images, documents or details that would help, simply reply to this email.\n\nBest regards,\nAsad Gulshair\nAI Engineer · asad-gulshair.github.io` } : d;
  const res = await fetch(ep, { method: 'POST', redirect: 'follow', headers: json ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const j = await res.json().catch(() => null);
  // only report success when the service says it accepted the message
  if (formsubmit && !(j && (j.success === true || j.success === 'true'))) throw new Error((j && j.message) || 'not accepted');
  if (!json && !(j && j.ok === true)) throw new Error((j && j.error) || 'not accepted');
  return 'sent';
}

function mount(host) {
  if (host._lf) return; host._lf = true;
  const kind = host.dataset.leadForm === 'compact' ? 'compact' : 'full';
  host.innerHTML = formHTML(kind);
  const form = $('form', host), status = $('.lf-status', form), btn = $('button[type=submit]', form), t0 = Date.now();
  // ?topic=… (from the portfolio guide) pre-selects what the visitor needs
  // older links used shorter topic names
  const OLD = { 'Industrial vision': TOPICS[0], 'Recruitment automation': TOPICS[1], 'Custom automation': TOPICS[2], 'SaaS product': TOPICS[3], 'AI agent / workflow': TOPICS[4], 'AI agent subscription': TOPICS[4] };
  try { const tq = new URLSearchParams(location.search).get('topic'), tp = OLD[tq] || tq, sel = $('select[name=topic]', form); if (tp && sel && [...sel.options].some((o) => o.value === tp || o.text === tp)) sel.value = tp; } catch (_) {}
  const setErr = (el, msg) => { const e = $('.lf-err', el.closest('.lf-f')); e.textContent = msg || ''; el.closest('.lf-f').classList.toggle('bad', !!msg); el.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
  const check = (el) => {
    const v = el.value.trim(); let m = '';
    if (el.name === 'name' && v.length < 2) m = 'Please enter your name.';
    if (el.name === 'email' && !EMAIL_RE.test(v)) m = 'Please enter a valid email address.';
    if (el.name === 'message' && v.length < 15) m = 'A few more words please (15 characters minimum).';
    setErr(el, m); return !m;
  };
  $$('input[name=name],input[name=email],textarea', form).forEach((el) => { el.addEventListener('blur', () => el.value && check(el)); el.addEventListener('input', () => el.closest('.lf-f').classList.contains('bad') && check(el)); });
  const say = (msg, cls = '') => { status.hidden = false; status.className = 'lf-status ' + cls; status.innerHTML = msg; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const els = $$('input[name=name],input[name=email],textarea[name=message]', form);
    const ok = els.map(check).every(Boolean); if (!ok) { els.find((el) => el.closest('.lf-f').classList.contains('bad'))?.focus(); return; }
    const fd = Object.fromEntries(new FormData(form).entries()); const hp = fd.website; delete fd.website;
    Object.keys(fd).forEach((k) => (fd[k] = String(fd[k]).trim()));
    const d = { ...fd, page: location.href, referrer: document.referrer || '', sent: new Date().toISOString(), source: kind === 'full' ? 'contact-form' : 'home-quick-form' };
    // bots: a filled honeypot or an instant submit is "accepted" silently and goes nowhere
    if (hp || Date.now() - t0 < 2500) return done(d, true);
    let last = 0; try { last = +localStorage.getItem('lf:last') || 0; } catch (_) {}
    if (Date.now() - last < 15000) { say('You just sent one. Please wait a few seconds before sending another.', 'warn'); return; }
    btn.disabled = true; btn.classList.add('busy'); $('span', btn).textContent = 'Sending…'; say('Sending…');
    try {
      const mode = await deliver(d);
      try { localStorage.setItem('lf:last', String(Date.now())); } catch (_) {}
      if (mode === 'mailto') { location.href = mailHref(d); return done(d, false, 'mailto'); }
      done(d, false);
    } catch (err) {
      console.warn('Enquiry not delivered:', err);
      btn.disabled = false; btn.classList.remove('busy'); $('span', btn).textContent = 'Try again';
      say(`That didn’t go through. <a class="tlink" href="${esc(mailHref(d))}">Email it to me instead</a> (opens your mail app with everything filled in), or <button class="tlink lf-copy" type="button">copy the message</button>.`, 'err');
      $('.lf-copy', status)?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(mailBody(d)); toast('Message copied'); } catch (_) { toast('Press Ctrl+C to copy'); } });
    }
  });

  function done(d, silent, mode) {
    const first = esc((d.name || '').split(/\s+/)[0] || 'there');
    host.innerHTML = `<div class="lf-done" role="status"><span class="lf-tick" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="21" class="c"/><path d="M14 25l7 7 13-15" class="k"/></svg></span>
      <h3>${mode === 'mailto' ? 'Almost there, ' + first + '.' : 'Thanks, ' + first + '.'}</h3>
      <p>${mode === 'mailto' ? `Your email app should have opened with the message filled in. Press send there. If nothing opened, write to <a class="tlink" href="mailto:${esc(S.email)}">${esc(S.email)}</a>.` : `I have your enquiry and will reply to <b>${esc(d.email)}</b> within a day.`}</p>
      <p class="lf-next">Want to talk sooner? <a class="tlink" data-book href="${esc(S.bookingUrl || 'mailto:' + S.email)}">Book a meeting</a></p></div>`;
    host.classList.add('sent'); if (!silent && mode !== 'mailto') dispatchEvent(new CustomEvent('lead:sent')); const dn = host.querySelector('.lf-done'); dn?.setAttribute('tabindex', '-1'); dn?.focus({ preventScroll: true }); dn?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

const mountAll = () => $$('[data-lead-form]').forEach(mount);
mountAll(); site.then(mountAll);
