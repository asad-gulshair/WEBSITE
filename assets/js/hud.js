// Hero "vision HUD": scan line, detection boxes and readouts drawn over the Aperture.
// Illustrative only (labelled as a demo in the readout). DOM, positioned each frame from aperture.project().
import { onTick, now, REDUCED } from './engine.js';
import { TINT } from './aperture.js';

const ORDER = ['industrial', 'agriculture', 'recruitment', 'agents'];
const DWELL = 5600, FIRST = 1600, SETTLE = 1150, OUT = 450;
// boxes: [cx, cy, z, halfW, halfH, label, conf] in particle space; tags: [x, y, z, text]
const SCENES = {
  idle: { task: 'Scanning', model: 'Vision pipeline', boxes: [], tags: [] },
  industrial: { task: 'Defect detection', model: 'YOLO · weld seam', boxes: [[-.42, .05, .07, .09, .09, 'porosity', .94], [.08, .05, .07, .09, .09, 'crack', .91], [.5, .05, .07, .09, .09, 'spatter', .88]], tags: [] },
  agriculture: { task: 'Ripeness grading', model: 'CNN classifier', boxes: [[0, .04, 0, .66, .68, 'tomato · ripe', .97]], tags: [[0, -.74, 0, 'grade A · 82% red']] },
  recruitment: { task: 'CV parsing', model: 'OCR + LLM', boxes: [[0, 0, .35, .33, .43, 'resume · parsed', .96]], tags: [[.5, .22, .35, 'name ✓'], [.5, .06, .35, 'skills ✓'], [.5, -.1, .35, 'experience ✓']] },
  agents: { task: 'Agent workflow', model: 'LLM agent · 5 steps', boxes: [], tags: [[-.78, -.06, 0, 'plan'], [-.38, -.38, .06, 'retrieve'], [0, .36, .12, 'tool'], [.38, -.38, .06, 'check'], [.78, -.06, 0, 'respond']] },
};

const el = (cls, parent, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; parent.append(d); return d; };
const clamp = (v) => Math.max(0, Math.min(1, v));

export function createHUD(media, ap) {
  const root = el('hud', media); root.setAttribute('aria-hidden', 'true');
  const scanWrap = el('hud-scan', root), scan = el('hud-scanline', scanWrap);
  const corners = ['tl', 'tr', 'bl', 'br'].map((c) => el('hud-c hud-' + c, root));
  const top = el('hud-read hud-top', root, '<i class="hud-dot"></i><span class="hud-task"></span>');
  const bot = el('hud-read hud-bot', root, '<span class="hud-model"></span><span class="hud-fps"></span>');
  const task = top.querySelector('.hud-task'), dot = top.querySelector('.hud-dot'), model = bot.querySelector('.hud-model'), fps = bot.querySelector('.hud-fps');
  const boxes = Array.from({ length: 3 }, (_, i) => { const b = el('hud-box' + (i === 1 ? ' hud-below' : ''), root, '<b></b>'); return { b, lab: b.firstChild }; });
  const tags = Array.from({ length: 5 }, () => el('hud-tag', root));

  // ---- auto demo: cycle practice areas while the visitor isn't steering it ----
  const links = [...document.querySelectorAll('.practice a')];
  let held = false, cycleAt = now() + FIRST, idx = -1, since = now(), shown = 'idle', nextSwitch = Infinity;
  const mark = (s) => links.forEach((a) => a.classList.toggle('auto', !held && a.dataset.cat === s));
  function advance(t) { idx = (idx + 1) % ORDER.length; ap.to(ORDER[idx]); cycleAt = t + DWELL; nextSwitch = cycleAt; mark(ORDER[idx]); }
  const api = {
    hold() { held = true; mark(null); nextSwitch = Infinity; },
    release() { held = false; cycleAt = now() + 2600; nextSwitch = cycleAt; },
  };

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible) { cycleAt = Infinity; nextSwitch = Infinity; } else if (!held) { cycleAt = now() + 1200; nextSwitch = cycleAt; } }).observe(media);

  function place(node, x, y, tail = '') { node.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)${tail}`; }
  function frame(t) {
    if (!visible) return;
    const fade = ap.renderer.domElement.style.opacity; root.style.opacity = fade === '' ? '1' : fade;
    if (fade === '0') return;
    if (!REDUCED && !held && t >= cycleAt) advance(t);

    const act = ap.active;
    if (act !== shown) { shown = act; since = t; }
    const sc = SCENES[act] || SCENES.idle, tint = TINT[act] || TINT.idle;
    root.style.setProperty('--tint', tint);
    task.textContent = sc.task; model.textContent = sc.model;
    fps.textContent = 'FPS ' + (30 - (Math.floor(t / 900) % 3 === 0 ? 1 : 0));
    dot.style.opacity = REDUCED ? 1 : .35 + .65 * (Math.sin(t / 260) * .5 + .5);

    // lens geometry in px: centre + inner ring radius; HUD frame hugs the barrel
    const [cx, cy] = ap.project(0, 0, 0, false), [rx] = ap.project(1.64, 0, 0, false), [ox] = ap.project(2.05, 0, 0, false);
    const [, ch] = ap.size(), r = rx - cx, R = Math.min((ox - cx) * 1.04, cy - 26, ch - cy - 24);
    place(corners[0], cx - R, cy - R); place(corners[1], cx + R, cy - R); place(corners[2], cx - R, cy + R); place(corners[3], cx + R, cy + R);
    place(top, cx - R, cy - R - 22); place(bot, cx - R, cy + R + 8); bot.style.width = (2 * R).toFixed(1) + 'px';
    scanWrap.style.cssText = `left:${(cx - r).toFixed(1)}px;top:${(cy - r).toFixed(1)}px;width:${(2 * r).toFixed(1)}px;height:${(2 * r).toFixed(1)}px`;
    if (!REDUCED) { const p = (t % 3200) / 3200, e = p * p * (3 - 2 * p); scan.style.transform = `translateY(${(e * 2 * r).toFixed(1)}px)`; scan.style.opacity = String(Math.sin(p * Math.PI) * .9); }

    // detections fade in after the particle morph settles, out just before the next switch
    const out = clamp((nextSwitch - t) / OUT);
    boxes.forEach((o, i) => {
      const d = sc.boxes[i]; if (!d) { o.b.style.opacity = 0; return; }
      const [x, y, z, hw, hh, label, conf] = d, k = clamp((t - since - SETTLE - i * 220) / 320);
      const [x0, y0] = ap.project(x - hw, y + hh, z), [x1, y1] = ap.project(x + hw, y - hh, z), g = 1 + (1 - k) * .18, w = (x1 - x0) * g, h = (y1 - y0) * g;
      o.b.style.width = w.toFixed(1) + 'px'; o.b.style.height = h.toFixed(1) + 'px'; place(o.b, (x0 + x1 - w) / 2, (y0 + y1 - h) / 2);
      o.b.style.opacity = REDUCED ? 1 : k * out;
      o.lab.textContent = `${label} ${(conf * (REDUCED ? 1 : clamp((t - since - SETTLE - i * 220) / 700))).toFixed(2)}`;
    });
    tags.forEach((n, i) => {
      const d = sc.tags[i]; if (!d) { n.style.opacity = 0; return; }
      const [x, y, z, text] = d, base = SETTLE + (sc.boxes.length ? 500 : 0) + i * 200, k = clamp((t - since - base) / 300);
      const [px, py] = ap.project(x, y, z); n.textContent = text;
      n.classList.toggle('on', act === 'agents' && Math.floor((t - since - SETTLE) / 700) % 5 === i);
      place(n, px, py + (1 - k) * 6, act === 'recruitment' ? ' translate(0,-50%)' : ' translate(-50%,-50%)'); n.style.opacity = REDUCED ? 1 : k * out;
    });
  }
  onTick(frame);
  return api;
}
