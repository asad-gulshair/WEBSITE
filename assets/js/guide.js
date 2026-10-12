// Scout, the portfolio guide (home page).
// - Lives in the hero, docks to the lower-left corner once the hero scrolls away (wide screens).
// - Says one short line when a new part of the page arrives; never over the recruiter or scoring sections.
// - "Ask my guide" opens a small panel: pick an interest, get the business problem, the solution, the matching case
//   studies and a "discuss this" link that pre-fills the enquiry form. All answers are predefined, from this site's content.
// - Closing the bubble mutes it for the session. Keyboard: the panel is a labelled region, Esc closes, focus returns.
import { createCompanion } from './companion.js';
import { REDUCED } from './engine.js';
import { PROJECTS, loadProjects } from './data.js';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const LINES = {
  hello: ['Welcome. Let’s build something intelligent.', 'happy'],
  nudge: ['Explore the systems I’ve built, or ask me where to start.', 'idle'],
  work: ['Pick an industry. I’ll show you the work.', 'happy'],
  services: ['Need to automate a manual workflow?', 'idle'],
  how: ['Five steps, from first call to a system you own.', 'idle'],
  contact: ['Have a problem worth solving? Send a short note.', 'happy'],
  industrial: ['Cameras that catch defects people miss.', 'ok'],
  recruitment: ['CVs scored on evidence. People decide.', 'ok'],
  agents: ['Manual workflows, automated.', 'ok'],
  agriculture: ['Models for crops and farms.', 'ok'],
  robotics: ['A robot that maps, plans and avoids obstacles.', 'ok'],
};
// interests: problem -> solution -> proof -> next step. Slugs must exist in content/projects.json (missing ones are skipped).
const TOPICS = [
  { k: 'mfg', label: 'Manufacturing and inspection', topic: 'Industrial vision', mood: 'ok',
    problem: 'Manual inspection misses small defects and changes from shift to shift.',
    answer: 'A camera and a trained detector flag defects and measure parts on every item, with results sent to your system through an API.',
    work: ['weld-defect-detection', 'flange-dimension-compliance', 'wall-paint-defects'] },
  { k: 'hr', label: 'HR and recruitment', topic: 'Recruitment automation', mood: 'ok',
    problem: 'Recruiters spend hours reading CVs and chasing candidates between steps.',
    answer: 'Every CV is parsed and scored against the role with the reasons shown. A person decides, and interviews are tracked in one place.',
    work: ['hr-workflow-automation', 'resume-screening'], jump: ['#scoring', 'See how a CV is scored'] },
  { k: 'docs', label: 'Document processing', topic: 'AI agent / workflow', mood: 'ok',
    problem: 'People retype invoices, CVs and reports into spreadsheets. It is slow and errors slip in.',
    answer: 'Documents are read into clean, structured rows and sent where your team already works, such as Excel or your HR system.',
    work: ['invoice-to-excel', 'hr-workflow-automation', 'n8n-automations'] },
  { k: 'llm', label: 'LLM apps and RAG', topic: 'AI agent / workflow', mood: 'think',
    problem: 'Answers are buried in PDFs, manuals and old emails.',
    answer: 'An assistant searches your own documents and answers with the source, so people can check it. I also build speech and translation pipelines.',
    work: ['rag-pipeline', 'subtitle-saas'] },
  { k: 'custom', label: 'Something custom', topic: 'Something else', mood: 'happy',
    problem: 'Not sure if AI can solve it, or where to start?',
    answer: 'Send a few samples. I check feasibility first, then build a prototype on your data and report honest metrics before anything is deployed.',
    work: ['tomato-ripeness-grading', 'turtlebot3-navigation', 'smart-farming-ieee'] },
];

export function initGuide() {
  const home = $('#guide-home'), hero = $('.hero'); if (!home || !hero) return;
  // dock only where the left gutter can hold the robot without covering content; narrower screens get the small launcher
  const wide = matchMedia('(min-width: 1420px)'), roomy = matchMedia('(min-width: 1940px)');
  const canvas = document.createElement('canvas'); canvas.className = 'guide-bot'; canvas.setAttribute('aria-hidden', 'true');
  const say = document.createElement('div'); say.className = 'guide-say'; say.setAttribute('role', 'status'); say.setAttribute('aria-live', 'polite');
  say.innerHTML = '<span></span><button type="button" class="guide-x" aria-label="Hide guide messages">×</button>';
  const ask = document.createElement('button'); ask.type = 'button'; ask.className = 'guide-ask'; ask.setAttribute('aria-expanded', 'false'); ask.setAttribute('aria-controls', 'guide-panel');
  ask.innerHTML = '<i aria-hidden="true"></i>Ask my guide';
  home.append(canvas, say, ask);
  let bot = null, figure = canvas;
  try { const t = document.createElement('canvas'); if (t.getContext('webgl2') || t.getContext('webgl')) bot = createCompanion(canvas, { size: 260 }); } catch (_) {}
  // no WebGL: a drawn face stands in, the guide panel still works
  if (!bot) { figure = Object.assign(document.createElement('div'), { className: 'guide-face', innerHTML: '<i></i><i></i>' }); canvas.replaceWith(figure); bot = { setMood() {}, nod() {}, look() {}, resize() {}, scan() {}, wave() {} }; }
  home.classList.add('on');

  // docked button (wide) and a small launcher (narrow screens, sits above the quick-contact bar)
  const dock = document.createElement('button'); dock.type = 'button'; dock.className = 'guide-dock'; dock.setAttribute('aria-label', 'Open the portfolio guide'); dock.setAttribute('aria-controls', 'guide-panel'); dock.setAttribute('aria-expanded', 'false');
  const launch = document.createElement('button'); launch.type = 'button'; launch.className = 'guide-launch'; launch.setAttribute('aria-label', 'Open the portfolio guide'); launch.setAttribute('aria-controls', 'guide-panel'); launch.setAttribute('aria-expanded', 'false');
  launch.innerHTML = '<span class="guide-face sm"><i></i><i></i></span>';
  const panel = document.createElement('section'); panel.id = 'guide-panel'; panel.className = 'guide-panel'; panel.hidden = true; panel.setAttribute('aria-label', 'Portfolio guide'); panel.tabIndex = -1;
  document.body.append(dock, launch, panel);

  let muted = false; try { muted = sessionStorage.getItem('guide-off') === '1'; } catch (_) {}
  const seen = new Set(); let hideT = 0, docked = false, open = false, opener = null;
  function speak(key, force) {
    const l = LINES[key]; if (!l || open || (!force && seen.has(key))) return; seen.add(key);
    // lines only where they cannot cover content: in the hero, or docked on very wide screens
    if (muted || (docked && !roomy.matches) || (!docked && !state.hero)) { bot.setMood(l[1], 2); if (l[1] === 'ok') bot.nod(); return; }
    $('span', say).textContent = l[0]; say.classList.add('show'); bot.setMood(l[1], 2.4); if (l[1] === 'ok') bot.nod();
    clearTimeout(hideT); hideT = setTimeout(() => say.classList.remove('show'), 5200);
  }
  $('.guide-x', say).addEventListener('click', (e) => { e.stopPropagation(); muted = true; say.classList.remove('show'); try { sessionStorage.setItem('guide-off', '1'); } catch (_) {} });

  // ---- panel ----
  const byslug = (s) => PROJECTS.find((p) => p.slug === s);
  function menu() {
    panel.innerHTML = `<header><span class="guide-face sm" aria-hidden="true"><i></i><i></i></span><div><b>Scout</b><span>Portfolio guide</span></div><button type="button" class="guide-close" aria-label="Close the guide">×</button></header>
      <p class="gp-q">Hi. What are you looking to solve?</p>
      <ul class="gp-chips">${TOPICS.map((t) => `<li><button type="button" data-k="${t.k}">${esc(t.label)}</button></li>`).join('')}<li><button type="button" data-k="browse" class="ghost">Just browsing</button></li></ul>
      <p class="gp-foot">Predefined answers from this portfolio. For anything else, <a class="tlink" href="contact.html#start">write to me</a>.</p>`;
  }
  function answer(k) {
    if (k === 'browse') { close(); const w = $('#work'); if (w) scrollTo({ top: w.getBoundingClientRect().top + scrollY - 70, behavior: REDUCED ? 'auto' : 'smooth' }); return; }
    const t = TOPICS.find((x) => x.k === k); if (!t) return;
    const work = t.work.map(byslug).filter(Boolean).slice(0, 3);
    panel.innerHTML = `<header><span class="guide-face sm" aria-hidden="true"><i></i><i></i></span><div><b>Scout</b><span>${esc(t.label)}</span></div><button type="button" class="guide-close" aria-label="Close the guide">×</button></header>
      <div class="gp-a" tabindex="-1"><p class="gp-k">The problem</p><p>${esc(t.problem)}</p><p class="gp-k">What I build</p><p>${esc(t.answer)}</p></div>
      ${work.length ? `<p class="gp-k">Related case studies</p><ul class="gp-work">${work.map((p) => `<li><a href="projects.html#/work/${p.slug}"><b>${esc(p.title)}</b><span>${esc(p.badge)} · ${esc(p.year)}</span></a></li>`).join('')}</ul>` : ''}
      <div class="gp-acts"><a class="btn btn-primary sm" href="contact.html?topic=${encodeURIComponent(t.topic)}#start">Discuss this with Asad</a>${t.jump ? `<a class="btn sm" href="${t.jump[0]}" data-jump>${esc(t.jump[1])}</a>` : ''}<button type="button" class="btn sm ghost" data-back>Other topics</button></div>`;
    bot.setMood(t.mood, 3); bot.nod();
    $('.gp-a', panel)?.focus?.();
  }
  panel.addEventListener('click', (e) => {
    const c = e.target.closest('[data-k]'); if (c) return answer(c.dataset.k);
    if (e.target.closest('[data-back]')) { menu(); $('.gp-chips button', panel)?.focus(); return; }
    if (e.target.closest('.guide-close')) return close();
    const j = e.target.closest('[data-jump]'); if (j) { e.preventDefault(); close(); const el = $(j.getAttribute('href')); if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - 70, behavior: REDUCED ? 'auto' : 'smooth' }); }
  });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  function setExpanded(v) { [ask, dock, launch].forEach((b) => b.setAttribute('aria-expanded', String(v))); }
  function openPanel(from) {
    if (open) return close(); open = true; opener = from || document.activeElement;
    menu(); panel.hidden = false; requestAnimationFrame(() => panel.classList.add('show'));
    say.classList.remove('show'); setExpanded(true); document.documentElement.classList.add('guide-open');
    if (wide.matches) place(true); bot.setMood('happy', 1.6); bot.look(.4, .1);
    setTimeout(() => $('.gp-chips button', panel)?.focus(), 30);
  }
  function close() {
    if (!open) return; open = false; panel.classList.remove('show'); setExpanded(false); document.documentElement.classList.remove('guide-open');
    setTimeout(() => { if (!open) panel.hidden = true; }, 250); bot.look(); update();
    if (opener && document.contains(opener) && getComputedStyle(opener).display !== 'none') opener.focus({ preventScroll: true });
  }
  [ask, dock, launch].forEach((b) => b.addEventListener('click', () => openPanel(b)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) close(); });
  document.addEventListener('pointerdown', (e) => { if (open && !panel.contains(e.target) && ![ask, dock, launch].some((b) => b.contains(e.target))) close(); });
  loadProjects().catch(() => {});

  // ---- hero <-> dock ----
  const state = { hero: true }, blockers = new Set();
  function place(toDock) {
    if (toDock === docked) return; docked = toDock; if (!roomy.matches) say.classList.remove('show');
    (toDock ? dock : home).prepend(figure, say); dock.classList.toggle('on', toDock); bot.resize();
  }
  function update() {
    place(wide.matches && (open || !state.hero));
    const away = blockers.size > 0 && !open; dock.classList.toggle('away', away); launch.classList.toggle('on', !wide.matches && !state.hero && !away);
  }
  new IntersectionObserver(([e]) => { state.hero = e.isIntersecting; update(); }, { threshold: .12 }).observe(hero);
  ['#recruiter', '#scoring'].forEach((s) => { const el = $(s); if (el) new IntersectionObserver(([e]) => { e.isIntersecting ? blockers.add(s) : blockers.delete(s); update(); }, { threshold: .05 }).observe(el); });
  wide.addEventListener('change', update);

  // ---- section lines ----
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; const k = e.target.dataset.guide; speak(k); if (!open) k === 'contact' ? bot.look(.55, .12) : bot.look(); }), { threshold: .35 });
  [['#work', 'work'], ['#services', 'services'], ['#how', 'how'], ['.cta-band', 'contact']].forEach(([s, k]) => { const el = $(s); if (el) { el.dataset.guide = k; io.observe(el); } });
  document.addEventListener('click', (e) => { const b = e.target.closest('.ind-tab[data-cat]'); if (b) speak(b.dataset.cat, true); });
  setTimeout(() => speak('hello'), REDUCED ? 300 : 1600);
  setTimeout(() => { if (state.hero) speak('nudge'); }, 8500);
}
