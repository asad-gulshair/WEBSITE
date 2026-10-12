// The CV-scoring demo uses the same companion (Scout) as the hero: it scans while a CV is read and reacts to each verdict.
import { createCompanion } from './companion.js';
export function initBot(sec, { still = false } = {}) {
  const canvas = sec.querySelector('.sc-bot'); if (!canvas) return;
  canvas.classList.add('on');
  const bot = createCompanion(canvas, { size: 132, still });
  if (!bot) { canvas.classList.remove('on'); return; }
  sec.addEventListener('sc:phase', (e) => {
    const { phase, tone } = e.detail || {};
    if (phase === 'scan' || phase === 'score') bot.scan(true);
    if (phase === 'verdict') { bot.scan(false); bot.setMood(tone || 'idle', 2.2); if (tone === 'ok') bot.nod(); else if (tone === 'warn') bot.tilt(); else bot.shake(); }
    if (phase === 'review') { bot.setMood('idle'); bot.look(.35, .15); }
    if (phase === 'decide') { bot.look(); bot.setMood('happy', 1.8); bot.nod(); }
  });
}
