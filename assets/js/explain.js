// Guided domain explainers: a 4-step illustrated flow at the top of each Work section, and a compact one-scene version
// in the Home area cards. Inline SVG; CSS loops run only while in view; static for prefers-reduced-motion and capture.
// Always captioned "(Illustration)". No figures: these show how the systems help, not results.
import { CAPTURE, REDUCED } from './engine.js';
const A = '#E8743B', T2 = '#A3A7AB', T3 = '#6E7378', S2 = '#171A1E', BS = '#343A40', TX = '#EDEBE6', OK = '#4CC38A';
const RIPE = '#D4553A', TURN = '#E39A45', UNRIPE = '#8DB86A', STEM = '#5F7D43', LEAF = '#3F5530', PART = '#262B31';
const svg = (b) => `<svg viewBox="0 0 160 112" aria-hidden="true" focusable="false" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const txt = (x, y, t, c = T3, s = 7.5, a = 'start') => `<text x="${x}" y="${y}" font-family="Geist Mono,monospace" font-size="${s}" letter-spacing=".06em" text-anchor="${a}" fill="${c}">${t}</text>`;
const chip = (x, y, t, c = A) => `<rect x="${x}" y="${y}" width="${t.length * 4.7 + 10}" height="13" rx="2" fill="#0A0B0D"/><rect x="${x}" y="${y}" width="2" height="13" fill="${c}"/>${txt(x + 6, y + 9.2, t, TX, 7)}`;
const chipC = (cx, y, t, c) => chip(cx - (t.length * 4.7 + 10) / 2, y, t, c);
const pop = (d, b) => `<g class="xp-pop" style="--d:${d}s">${b}</g>`;
const r1 = (n) => +n.toFixed(1);
const tom = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><ellipse cx="${r1(x - r * .38)}" cy="${r1(y - r * .3)}" rx="${r1(r * .26)}" ry="${r1(r * .16)}" fill="#fff" fill-opacity=".2"/>`
  + `<path d="M${r1(x - r * .5)} ${r1(y - r * .78)}L${x} ${r1(y - r * .55)}L${r1(x + r * .5)} ${r1(y - r * .78)}M${x} ${r1(y - r * .55)}V${r1(y - r * 1.15)}" stroke="${STEM}"/>`;
const cam = (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-14" y="-9" width="20" height="18" rx="3" fill="${S2}" stroke="${T2}"/><rect x="-10" y="-12" width="8" height="3" rx="1" fill="${S2}" stroke="${T2}"/>`
  + `<path d="M6 -5H14V5H6" fill="${S2}" stroke="${T2}"/><path d="M14 -6V6" stroke="${A}" stroke-width="2"/><circle cx="-4" r="2" fill="${A}"/></g>`;
const check = (x, y, c = OK) => `<path d="M${x} ${y}l3 3 6-7" stroke="${c}"/>`;
const doc = (x, y, r = 0, inner = '') => `<g transform="translate(${x} ${y}) rotate(${r})">${inner ? `<g class="xp-drop" style="--d:${inner}s">` : '<g>'}<rect x="-20" y="-26" width="40" height="52" rx="3" fill="${S2}" stroke="${T2}"/>`
  + `<circle cx="-10" cy="-15" r="4.5" stroke="${T3}"/><path d="M-2 -17H12M-2 -12H8M-12 -2H12M-12 4H10M-12 10H12M-12 16H4" stroke="${BS}"/></g></g>`;
const scan = (x, y, w, dy) => `<rect class="xp-scan" x="${x}" y="${y}" width="${w}" height="1.5" fill="${A}" style="--dy:${dy}px"/>`;
const row = (y, h, hl, body) => `<rect x="10" y="${y - h / 2}" width="140" height="${h}" rx="5" fill="${S2}" stroke="${hl ? A : BS}"/>${body}`;

const SCENES = {
  agriculture: [
    () => svg(`<path d="M32 56L150 12M32 56L150 102" stroke="${T3}" stroke-dasharray="2 4"/>
      <path d="M112 4C106 30 118 54 110 108" stroke="${STEM}" stroke-width="2"/><path d="M111 30q14 2 20 12M112 58q-16 0-22 12M111 84q12 0 16 8" stroke="${STEM}"/>
      <path d="M114 20q12-8 22-2q-10 8-22 2z" fill="${LEAF}"/><path d="M110 72q-14-10-24-2q12 8 24 2z" fill="${LEAF}"/>
      ${tom(132, 52, 10, RIPE)}${tom(90, 80, 9, TURN)}${tom(127, 99, 8, UNRIPE)}${scan(74, 10, 70, 90)}${cam(18, 56)}${txt(6, 106, 'CAPTURE')}`),
    () => svg(`<path d="M8 20V8h12M152 20V8h-12M8 92v12h12M152 92v12h-12" stroke="${T3}"/>
      ${tom(42, 62, 17, RIPE)}${tom(84, 52, 15, TURN)}${tom(124, 66, 16, UNRIPE)}
      ${pop(0, `<rect x="21" y="38" width="42" height="45" stroke="${A}"/>${chip(21, 24, 'ID 1')}`)}
      ${pop(.5, `<rect x="65" y="31" width="38" height="40" stroke="${A}"/>${chip(65, 17, 'ID 2')}`)}
      ${pop(1, `<rect x="104" y="43" width="40" height="43" stroke="${A}"/>${chip(104, 29, 'ID 3')}`)}${txt(80, 101, 'ONE ID PER FRUIT', T3, 7.5, 'middle')}`),
    () => svg(`${tom(30, 44, 16, RIPE)}${tom(80, 44, 16, TURN)}${tom(130, 44, 16, UNRIPE)}
      ${pop(0, chipC(30, 70, 'RIPE', RIPE))}${pop(.5, chipC(80, 70, 'TURNING', TURN))}${pop(1, chipC(130, 70, 'UNRIPE', UNRIPE))}${txt(80, 101, 'GRADED BY COLOUR STAGE', T3, 7.5, 'middle')}`),
    () => svg(`${pop(0, row(20, 26, 1, `${tom(26, 21, 7, RIPE)}${txt(42, 23, 'PICK NOW', TX, 8)}${check(128, 19)}`))}
      ${pop(.5, row(54, 26, 0, `${tom(26, 55, 7, TURN)}${txt(42, 57, 'NEXT PASS', TX, 8)}<circle cx="134" cy="54" r="6" stroke="${TURN}"/><path d="M134 50.5V54l2.5 2" stroke="${TURN}"/>`))}
      ${pop(1, row(88, 26, 0, `${tom(26, 89, 7, UNRIPE)}${txt(42, 91, 'LEAVE TO RIPEN', T2, 8)}<path d="M129 88h10" stroke="${T3}"/>`))}`),
  ],
  industrial: [
    () => { let parts = ''; for (let i = 0; i < 6; i++) parts += `<rect x="${-26 + i * 40}" y="60" width="22" height="14" rx="2" fill="${PART}" stroke="${T3}"/>`;
      let rollers = ''; for (let i = 0; i < 7; i++) rollers += `<circle cx="${14 + i * 22}" cy="80" r="2.5" stroke="${T3}"/>`;
      return svg(`<defs><clipPath id="xpc-belt"><rect x="6" y="40" width="148" height="40"/></clipPath></defs>
      <path d="M80 4V14M64 4H96" stroke="${BS}"/><path d="M80 42L56 74H104Z" fill="${A}" fill-opacity=".07"/><path d="M76 42L56 74M84 42L104 74" stroke="${A}" stroke-opacity=".5" stroke-dasharray="2 3"/>
      ${cam(80, 26, 90)}<rect x="6" y="74" width="148" height="12" rx="6" fill="${S2}" stroke="${BS}"/>${rollers}
      <g clip-path="url(#xpc-belt)"><g class="xp-belt">${parts}</g></g>${txt(6, 106, 'EVERY PART PASSES THE CAMERA')}`); },
    () => svg(`<rect x="20" y="10" width="120" height="76" rx="6" fill="#20242A" stroke="${BS}"/><path d="M30 34H130M30 48H130M30 62H130" stroke="#fff" stroke-opacity=".04"/>
      <circle cx="28" cy="18" r="2" stroke="${T3}"/><circle cx="132" cy="18" r="2" stroke="${T3}"/><circle cx="28" cy="78" r="2" stroke="${T3}"/><circle cx="132" cy="78" r="2" stroke="${T3}"/>
      <path d="M54 44q8 6 18 3t14 4" stroke="#0A0B0D" stroke-width="2.5"/><circle cx="108" cy="64" r="3.2" fill="#0A0B0D"/>
      ${pop(0, `<rect x="48" y="36" width="44" height="22" stroke="${A}"/>${chip(48, 22, 'SCRATCH')}`)}${pop(.6, `<rect x="100" y="56" width="16" height="16" stroke="${A}"/>${chip(84, 74, 'PORE')}`)}
      ${scan(20, 10, 120, 74)}${txt(6, 106, 'THE MODEL MARKS EACH DEFECT')}`),
    () => svg(`<path d="M6 56H62C82 56 84 28 104 28H154M62 56C82 56 84 84 104 84H154" stroke="#1D2125" stroke-width="12"/>
      <path class="xp-dash" d="M6 56H62C82 56 84 28 104 28H154" stroke="${T3}" stroke-dasharray="3 6"/><path class="xp-dash" d="M62 56C82 56 84 84 104 84H154" stroke="${A}" stroke-dasharray="3 6"/>
      <rect x="20" y="50" width="12" height="12" rx="2" fill="${PART}" stroke="${T2}"/><path d="M62 46l10 10-10 10-10-10z" fill="${S2}" stroke="${A}"/>
      ${pop(0, `<rect x="120" y="22" width="12" height="12" rx="2" fill="${PART}" stroke="${T2}"/>${check(140, 26)}${txt(104, 12, 'PASS', OK)}`)}
      ${pop(.6, `<rect x="120" y="78" width="12" height="12" rx="2" fill="${PART}" stroke="${A}"/><path d="M141 80l6 6M147 80l-6 6" stroke="${A}"/>${txt(88, 106, 'FAIL → REVIEW', A)}`)}`),
    () => { let rows = ''; for (let i = 0; i < 6; i++) { const y = 32 + i * 12.5, f = i === 3;
        rows += pop(i * .35, `${f ? `<rect x="14" y="${y - 6}" width="132" height="12" rx="3" fill="${A}" fill-opacity=".1"/>` : ''}<circle cx="22" cy="${y}" r="2.5" fill="${f ? A : OK}"/>`
          + `<rect x="32" y="${y - 2}" width="${48 + (i * 23) % 40}" height="4" rx="2" fill="${BS}"/>${f ? txt(108, y + 2.5, 'REVIEW', A, 7) : check(128, y - 1)}`); }
      return svg(`<rect x="10" y="6" width="140" height="100" rx="6" fill="${S2}" stroke="${BS}"/>${txt(20, 20, 'EVERY PART · EVERY SHIFT', T3, 7)}${rows}`); },
  ],
  recruitment: [
    () => svg(`<path d="M22 82H138L130 98H30Z" fill="#14171A" stroke="${BS}"/>${doc(54, 52, -10, '0')}${doc(80, 48, 0, '.4')}${doc(106, 52, 10, '.8')}${txt(6, 108, 'APPLICATIONS IN')}`),
    () => svg(`${doc(34, 54)}<path class="xp-dash" d="M56 54C70 54 72 26 86 26M56 54H86M56 54C70 54 72 82 86 82" stroke="${T3}" stroke-dasharray="3 6"/>
      ${pop(0, chip(88, 19.5, 'SKILLS'))}${pop(.4, chip(88, 47.5, 'EXPERIENCE'))}${pop(.8, chip(88, 75.5, 'EDUCATION'))}${txt(6, 106, 'ONE CONSISTENT STRUCTURE')}`),
    () => svg(`${[['MUST-HAVES', 118], ['NICE-TO-HAVES', 80], ['EXPERIENCE', 100]].map(([l, w], i) => { const y = 22 + i * 26;
        return `${txt(14, y, l, T2)}<rect x="14" y="${y + 5}" width="132" height="5" rx="2.5" fill="${BS}"/><rect class="xp-bar" style="--d:${i * .4}s" x="14" y="${y + 5}" width="${w}" height="5" rx="2.5" fill="${A}"/>`; }).join('')}
      ${txt(14, 104, 'A REASON KEPT FOR EVERY SCORE', T3, 7)}`),
    () => svg(`${[0, 1, 2, 3].map((i) => { const y = 16 + i * 22, s = i < 2;
        return `${row(y, 18, s, `<circle cx="22" cy="${y}" r="4.5" stroke="${T2}"/><rect x="32" y="${y - 4}" width="${44 - i * 4}" height="3" rx="1.5" fill="${BS}"/><rect x="32" y="${y + 1}" width="${30 + i * 3}" height="3" rx="1.5" fill="${BS}"/>`)}`
          + (s ? pop(i * .5, chip(94, y - 6.5, 'SHORTLIST', OK)) : ''); }).join('')}${txt(6, 108, 'A PERSON MAKES THE FINAL CALL', T3, 7)}`),
  ],
  agents: [
    () => { let wave = ''; for (let i = 0; i < 9; i++) { const h = 6 + Math.abs(Math.sin(i * 1.3)) * 22; wave += `<rect x="${114 + i * 4}" y="${r1(42 - h / 2)}" width="2" height="${r1(h)}" rx="1" fill="${i > 2 && i < 6 ? A : T2}"/>`; }
      return svg(`${pop(0, `<path d="M16 24h20l8 8v28H16z" fill="${S2}" stroke="${T2}"/><path d="M36 24v8h8" stroke="${T2}"/>${txt(30, 50, 'PDF', A, 7, 'middle')}`)}
      ${pop(.4, `<rect x="64" y="26" width="32" height="32" rx="3" fill="${S2}" stroke="${T2}"/><path d="M64 37H96M64 47H96M75 26V58M85 26V58" stroke="${BS}"/>`)}
      ${pop(.8, `<g>${wave}</g>`)}<path class="xp-dash" d="M30 66V76H130V66M80 66V92" stroke="${T3}" stroke-dasharray="3 6"/>${txt(6, 108, 'YOUR DOCUMENTS')}`); },
    () => svg(`<path class="xp-dash" d="M62 54H46M98 54H114M80 36V22" stroke="${A}" stroke-dasharray="3 6"/>
      <circle class="xp-ping" cx="80" cy="54" r="18" stroke="${A}"/><rect x="62" y="36" width="36" height="36" rx="9" fill="${S2}" stroke="${A}"/><circle cx="80" cy="54" r="8" stroke="${A}"/><circle cx="80" cy="54" r="2.5" fill="${A}"/>
      <rect x="2" y="46" width="44" height="16" rx="4" fill="${S2}" stroke="${BS}"/>${txt(24, 56.5, 'RETRIEVE', T2, 6.5, 'middle')}
      <rect x="114" y="46" width="44" height="16" rx="4" fill="${S2}" stroke="${BS}"/>${txt(136, 56.5, 'TOOLS', T2, 6.5, 'middle')}
      <rect x="58" y="6" width="44" height="16" rx="4" fill="${S2}" stroke="${BS}"/>${txt(80, 16.5, 'REASON', T2, 6.5, 'middle')}${txt(80, 100, 'PLANS · RETRIEVES · ACTS', T3, 7, 'middle')}`),
    () => svg(`<rect x="60" y="8" width="90" height="26" rx="8" fill="${S2}" stroke="${BS}"/><rect x="70" y="16" width="62" height="4" rx="2" fill="${T3}" fill-opacity=".6"/><rect x="70" y="24" width="40" height="4" rx="2" fill="${T3}" fill-opacity=".6"/>
      <rect x="10" y="42" width="112" height="46" rx="8" fill="${S2}" stroke="${A}"/>
      ${[86, 70, 52].map((w, i) => `<rect class="xp-bar" style="--d:${i * .3}s" x="20" y="${51 + i * 7}" width="${w}" height="4" rx="2" fill="${T2}"/>`).join('')}${pop(1, chip(20, 71, 'SOURCE', OK))}
      ${txt(6, 106, 'ANSWERED FROM YOUR FILES')}`),
    () => svg(`${pop(0, row(18, 22, 0, `<rect x="19" y="12" width="10" height="12" rx="1.5" stroke="${T2}"/>${txt(38, 20.5, 'REPORT SENT', TX, 7.5)}${check(128, 17)}`))}
      ${pop(.5, row(46, 22, 0, `<rect x="18" y="41" width="12" height="10" rx="1.5" stroke="${T2}"/><path d="M18 46H30M24 41V51" stroke="${T2}"/>${txt(38, 48.5, 'RECORD UPDATED', TX, 7.5)}${check(128, 45)}`))}
      ${pop(1, row(74, 22, 0, `<path d="M19 77h10l-1.5-2v-3a3.5 3.5 0 0 0-7 0v3zM23 79h2" stroke="${T2}"/>${txt(38, 76.5, 'TEAM NOTIFIED', TX, 7.5)}${check(128, 73)}`))}
      ${txt(6, 104, 'RUNS ON SCHEDULE')}`),
  ],
};

const COPY = {
  industrial: { t: 'How visual inspection speeds up quality checks', mini: 0, chain: 'Camera → Detect → Pass / fail → Fewer misses', cap: 'Camera on the line, defect detection, pass/fail routing and a consistent check on every part.',
    steps: [['Capture', 'Camera on the line', 'A standard camera images every part as it passes the inspection station.'],
      ['Detect', 'The model finds defects', 'A trained detector marks scratches, pores or out-of-tolerance dimensions on each image.'],
      ['Decide', 'Pass or fail', 'Good parts carry on; flagged parts go to a person with the image and the reason attached.'],
      ['Result', 'Fewer misses, faster checks', 'Every part is checked the same way on every shift, and inspectors spend their time on the flagged ones only.']] },
  recruitment: { t: 'How screening automation moves candidates faster', mini: 2, chain: 'CVs in → Parse → Screen → Shortlist', cap: 'CVs in, structured parsing, screening against your criteria and a shortlist for human review.',
    steps: [['Collect', 'CVs in', 'Applications arrive from email, forms or a job board, as PDF or Word files.'],
      ['Parse', 'Every CV read the same way', 'An LLM pipeline extracts skills, experience and education into one consistent structure.'],
      ['Screen', 'Checked against your criteria', 'Each candidate is scored on your must-haves, with the reasons written down.'],
      ['Shortlist', 'A shortlist for review', 'Your team gets a ranked shortlist. A person always makes the final call.']] },
  agents: { t: 'How an AI agent turns documents into answers and actions', mini: 1, chain: 'Documents → Agent → Answer → Automation', cap: 'Documents in, an agent that retrieves and reasons, grounded answers and automated follow-up.',
    steps: [['Inputs', 'Documents in', 'PDFs, spreadsheets, emails or recordings, from the tools you already use.'],
      ['Agent', 'Reads, retrieves, decides', 'The agent finds the relevant passages and works out the next step.'],
      ['Answer', 'Answers with sources', 'Questions are answered from your own documents, with the source shown.'],
      ['Automate', 'Routine work done for you', 'Reports, record updates and notifications run on schedule, without anyone copying numbers.']] },
  agriculture: { t: 'How ripeness detection helps plan the harvest', mini: 1, chain: 'Camera → Model → Ripe / turning / unripe → Harvest', cap: 'Camera on the crop, tomato detection, ripeness grading and the harvest decision it supports.',
    steps: [['Capture', 'Camera on the crop', 'A phone or fixed camera records the plants along the row.'],
      ['Detect', 'The model finds each tomato', 'A YOLOv8 model locates every fruit and tracks it, so none is counted twice.'],
      ['Grade', 'Ripe, turning or unripe', 'Each tomato is graded by its colour stage.'],
      ['Decide', 'The harvest decision', 'Pick what is ripe now, plan the next pass for turning fruit, and leave the rest to ripen.']] },
};

export function xpHTML(cat) {
  const c = COPY[cat]; if (!c) return '';
  return `<figure class="xp" data-xp="${cat}"><div class="xp-head"><span class="meta">How it helps</span><b>${c.t}</b></div>
    <ol class="xp-flow">${c.steps.map(([k, h, p], i) => `<li class="xp-st" style="--i:${i}"><div class="xp-ill">${SCENES[cat][i]()}</div>
      <p class="meta"><b>${String(i + 1).padStart(2, '0')}</b>${k}</p><h3>${h}</h3><p>${p}</p></li>`).join('')}</ol>
    <figcaption>(Illustration) ${c.cap}</figcaption></figure>`;
}
export function xpMiniHTML(cat) {
  const c = COPY[cat]; if (!c) return '';
  return `<div class="xp xp-mini" aria-hidden="true"><div class="xp-ill">${SCENES[cat][c.mini]()}</div><p class="meta xp-chain">${c.chain}</p></div>`;
}
// Stations reveal once; loops play only while the explainer is on screen.
export function wireXP(root = document) {
  if (REDUCED || CAPTURE || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => { e.target.classList.toggle('on', e.isIntersecting); if (e.isIntersecting) e.target.classList.add('in'); }), { threshold: .15 });
  root.querySelectorAll('.xp').forEach((x) => io.observe(x));
}
