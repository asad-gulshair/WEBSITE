// "How the AI scores a CV" (home page). A made-up CV is read, scored on four criteria, reviewed by a person and moved on, three
// times with different outcomes. The robot (scoringbot.js) reacts to each phase. Reduced motion / no JS / ?capture keep the
// static first example. The numbered buttons switch examples by hand in every mode.
import { CAPTURE, REDUCED } from './engine.js';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const col = (v) => (v >= 75 ? '#16a34a' : v >= 55 ? '#d99a06' : '#dc2626');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => 1 - Math.pow(1 - t, 3);

const CANDS = [
  { cv: 'Maintenance engineer', role: 'Maintenance engineer · role needs 3 to 5 years', hl: ['PLC, SCADA', '6 years, manufacturing', 'Food and beverage'],
    crit: [[82, 'PLC, SCADA and preventive maintenance found. CMMS not found.'], [78, '6 years in manufacturing plants.'], [90, 'Food and beverage, same sector as the role.'], [70, '2 job changes in 5 years.']],
    verdict: ['Recommend: shortlist', 'Strong on skills, experience and sector.'], act: 'acc', result: 'Accepted by HR. L1 interview is scheduled.', stage: 5, tone: 'ok' },
  { cv: 'Quality analyst', role: 'Quality analyst · role needs 3 to 5 years', hl: ['SPC, 5 of 7 tools', '2 years, quality lab', 'Packaging'],
    crit: [[61, '4 of 7 required skills found. Sampling plans not mentioned.'], [55, '2 years against the 3 the role asks for.'], [70, 'Packaging, close to the role’s sector.'], [85, '1 job change in 5 years.']],
    verdict: ['Recommend: review closely', 'Good stability, but short on experience.'], act: 'hold', result: 'Held by HR. A work sample is requested first.', stage: 4, tone: 'warn' },
  { cv: 'Production supervisor', role: 'Production supervisor · role needs 5 to 8 years', hl: ['Line lead, 9 years', 'Shift planning', 'Textiles'],
    crit: [[40, 'Only 3 of 7 required terms found. The CV uses different wording.'], [85, '9 years, above what the role asks.'], [70, 'Textiles, a neighbouring sector.'], [25, '5 job changes in 6 years.']],
    verdict: ['Weak match by score', 'Low on skills found and on stability.'], act: 'ovr', result: 'HR reads the reasons, sees the skills are worded differently, and moves the candidate forward.', stage: 5, tone: 'low' },
];
const pct = (c) => Math.round(c.crit.reduce((a, x) => a + x[0], 0) / c.crit.length);

export function initScoring() {
  const sec = $('[data-sc]'); if (!sec) return;
  const demo = $('.sc-demo', sec), cv = $('.sc-cv', sec), card = $('.sc-card', sec), review = $('.sc-review', sec);
  const rows = $$('.sc-crit li', sec), ring = $('.sc-ring', sec), ringN = $('b', ring), verdict = $('.sc-verdict', sec), result = $('.sc-result', sec);
  const pipe = $$('.sc-pipe li', sec), say = $('.sc-say span', sec), dots = $$('.sc-dots button', sec), btns = { acc: $('.sc-b.acc', sec), hold: $('.sc-b.hold', sec), ovr: $('.sc-b.ovr', sec) };
  const emit = (phase, tone) => sec.dispatchEvent(new CustomEvent('sc:phase', { detail: { phase, tone } }));
  const setRow = (li, v, txt) => { li.style.setProperty('--v', v); li.style.setProperty('--bc', col(v)); $('.sc-val', li).textContent = v; if (txt != null) $('small', li).textContent = txt; };
  const setRing = (v) => { ring.style.setProperty('--p', v); ring.style.setProperty('--rc', col(v)); ringN.textContent = Math.round(v); };
  const setStage = (n) => pipe.forEach((li, i) => li.classList.toggle('on', i < n));
  const pick = (a) => Object.entries(btns).forEach(([k, b]) => b.classList.toggle('on', k === a));

  // fill the whole example instantly (static mode, manual switching, and the end state of the animation)
  function showFinal(c) {
    cv.querySelector('.sc-cv-h span').textContent = c.cv; $('.sc-role', sec).textContent = c.role;
    $$('.sc-ln.hl em', sec).forEach((e, i) => (e.textContent = c.hl[i]));
    rows.forEach((li, i) => { setRow(li, c.crit[i][0], c.crit[i][1]); li.classList.remove('wait'); });
    const t = pct(c); setRing(t); $('b', verdict).textContent = c.verdict[0]; $('span', verdict).textContent = c.verdict[1];
    [card, review, verdict, result].forEach((e) => e.classList.remove('wait')); pick(c.act); result.textContent = c.result; setStage(c.stage); say.textContent = 'Ready for human review';
  }
  let cur = 0, token = 0, vis = true, manual = false, rt = 0;
  function select(i, stop) { cur = i; dots.forEach((d, j) => d.classList.toggle('on', j === i)); if (stop) { manual = true; token++; sec.classList.remove('sc-run', 'is-live'); clearTimeout(rt); rt = setTimeout(() => { manual = false; }, 9000); } showFinal(CANDS[i]); }
  dots.forEach((d, i) => d.addEventListener('click', () => select(i, true)));

  const tween = (ms, fn) => new Promise((res) => { const t0 = performance.now(), my = token; const f = (n) => { if (my !== token) return res(); const k = Math.min(1, (n - t0) / ms); fn(ease(k)); k < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
  const visible = async () => { while (!vis) await wait(300); };
  const step = async (ms, my) => { await visible(); await wait(ms); return my === token; };

  async function play(i) {
    const c = CANDS[i], my = ++token; manual = false; cur = i;
    dots.forEach((d, j) => d.classList.toggle('on', j === i));
    sec.classList.add('sc-run', 'is-live'); cv.style.setProperty('--cvh', cv.offsetHeight + 'px');
    // reset to "waiting"
    cv.querySelector('.sc-cv-h span').textContent = c.cv; $('.sc-role', sec).textContent = c.role;
    $$('.sc-ln.hl em', sec).forEach((e, k) => { e.textContent = c.hl[k]; e.parentElement.style.setProperty('--hi', k); });
    rows.forEach((li) => { li.classList.add('wait'); setRow(li, 0, ''); $('.sc-val', li).textContent = '–'; });
    setRing(0); ringN.textContent = '–'; [card, review].forEach((e) => e.classList.add('wait')); [verdict, result].forEach((e) => e.classList.add('wait')); pick(null); setStage(1);
    cv.style.animation = 'none'; cv.offsetWidth; cv.style.animation = ''; const beam = $('.sc-beam', cv); beam.style.animation = 'none'; beam.offsetWidth; beam.style.animation = '';
    $$('.sc-ln.hl', cv).forEach((e) => { e.style.animation = 'none'; e.offsetWidth; e.style.animation = ''; });
    say.textContent = 'Reading the CV…'; emit('scan'); setStage(2);
    if (!(await step(1900, my))) return;
    say.textContent = 'Scoring against the role…'; emit('score'); setStage(3); card.classList.remove('wait');
    for (let k = 0; k < rows.length; k++) {
      rows[k].classList.remove('wait'); const v = c.crit[k][0]; setRow(rows[k], v, c.crit[k][1]); const val = $('.sc-val', rows[k]);
      tween(500, (e) => { val.textContent = Math.round(v * e); });
      if (!(await step(560, my))) return;
    }
    const total = pct(c); const tw = tween(850, (e) => setRing(total * e)); verdict.classList.remove('wait'); await tw; if (my !== token) return; setRing(total);
    $('b', verdict).textContent = c.verdict[0]; $('span', verdict).textContent = c.verdict[1];
    say.textContent = 'Ready for human review'; emit('verdict', c.tone); if (!(await step(1100, my))) return;
    review.classList.remove('wait'); setStage(4); say.textContent = 'A person decides'; emit('review', c.tone);
    if (!(await step(1300, my))) return;
    pick(c.act); result.textContent = c.result; result.classList.remove('wait'); setStage(c.stage); emit('decide', c.tone);
    await step(3600, my);
  }
  async function loop() { let i = cur; while (true) { await play(i); if (manual) { while (manual) await wait(500); } i = (cur + 1) % CANDS.length; } }

  // static first example
  select(0, false);
  if (REDUCED || CAPTURE) { import('./scoringbot.js').then((m) => m.initBot(sec, { still: true })).catch(() => {}); return; }
  const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !started) { started = true; loop(); import('./scoringbot.js').then((m) => m.initBot(sec, {})).catch((err) => console.warn('Robot not loaded:', err)); } }, { threshold: .35 });
  let started = false; io.observe(demo);
}
