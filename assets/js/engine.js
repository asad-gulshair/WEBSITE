// Shared clock/ticker. Real time normally; virtual (stepped) in ?capture=1 mode for deterministic video capture.
export const CAPTURE = new URLSearchParams(location.search).has('capture');
export const REDUCED = !CAPTURE && matchMedia('(prefers-reduced-motion: reduce)').matches;
let vt = 0;
export const now = () => (CAPTURE ? vt : performance.now());
const subs = new Set();
export const onTick = (fn) => { subs.add(fn); return () => subs.delete(fn); };
const anims = [];
export function animate(el, frames, opts) {
  if (REDUCED) { const last = frames[frames.length - 1]; Object.assign(el.style, last); return null; }
  const a = el.animate(frames, { fill: 'both', easing: 'cubic-bezier(.2,.7,.2,1)', ...opts });
  if (CAPTURE) { a.pause(); a.currentTime = 0; anims.push({ a, start: vt, end: (opts.delay || 0) + opts.duration }); }
  return a;
}
let last = now();
function tick() {
  const t = now(), dt = Math.min(64, t - last); last = t;
  subs.forEach((fn) => fn(t, dt));
}
if (!CAPTURE) { const loop = () => { tick(); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
// Capture hook: advance virtual time, run one frame, sync WAAPI animations and videos.
window.__step = async (ms = 1000 / 30) => {
  vt += ms; tick();
  for (let i = anims.length - 1; i >= 0; i--) {
    const r = anims[i], ct = vt - r.start; r.a.currentTime = Math.min(ct, r.end);
    if (ct > r.end) anims.splice(i, 1);
  }
  const vids = [...document.querySelectorAll('video[data-src]')].filter((v) => v.src && inView(v));
  await Promise.all(vids.map((v) => new Promise((res) => {
    if (!v.duration) { v.addEventListener('loadeddata', () => res(), { once: true }); setTimeout(res, 1500); return; }
    v.addEventListener('seeked', () => res(), { once: true }); setTimeout(res, 800);
    v.currentTime = ((vt - (v._t0 ?? (v._t0 = vt))) / 1000) % v.duration;
  })));
  await new Promise((r) => requestAnimationFrame(() => r()));
};
export function inView(el) { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }
