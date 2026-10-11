// Procedural particle targets for the Aperture core (v2: clean, diagram-like).
// Each state returns {p: Float32Array(N*3), f: Float32Array(N)}; f = per-state highlight flag.
export function rng(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const G = (r) => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * r()); };
export const STATES = ['idle', 'industrial', 'recruitment', 'agents', 'agriculture'];
export function makeTargets(N) {
  const out = {};
  for (const s of STATES) { const r = rng(STATES.indexOf(s) * 97 + 11), p = new Float32Array(N * 3), f = new Float32Array(N); GEN[s](N, r, p, f); out[s] = { p, f }; }
  return out;
}
const GEN = {
  idle(N, r, p, f) { // loose slowly rotating disc
    for (let i = 0; i < N; i++) { const a = r() * 6.2832, rr = Math.sqrt(r()) * .6; p.set([Math.cos(a) * rr, Math.sin(a) * rr, G(r) * .05], i * 3); f[i] = 0; }
  },
  industrial(N, r, p, f) { // straight weld bead: rippled tube along x, 3 brighter findings
    const finds = [-.42, .08, .5];
    for (let i = 0; i < N; i++) {
      if (r() < .06) { const c = finds[Math.floor(r() * 3)]; p.set([c + G(r) * .025, .05 + G(r) * .02, .07 + G(r) * .02], i * 3); f[i] = 1; continue; }
      const x = -.85 + r() * 1.7, ripple = .018 * Math.sin(x * 70), v = r() * 3.1416, rad = .1 + ripple;
      const y = Math.cos(v) * rad * 1.3, z = Math.sin(v) * rad * .7; p.set([x, y, z], i * 3); f[i] = 0;
      if (r() < .25) { p.set([x, (r() - .5) * .62, -.06 + G(r) * .01], i * 3); } // base plate
    }
  },
  recruitment(N, r, p, f) { // 3 offset document sheets; the middle one moves forward
    for (let i = 0; i < N; i++) {
      const k = Math.floor(r() * 3), fw = k === 1; const ox = (k - 1) * .3, oy = (k - 1) * -.08, oz = fw ? .35 : -(Math.abs(k - 1)) * .1;
      let x, y; if (r() < .32) { const e = r(), side = Math.floor(r() * 4); x = side < 2 ? (e - .5) * .56 : (side === 2 ? -.28 : .28); y = side < 2 ? (side ? .38 : -.38) : (e - .5) * .76; }
      else { const row = Math.floor(r() * 8); y = .27 - row * .075; const len = row === 0 ? .26 : (.22 + ((row * 37) % 10) / 34); x = -.2 + r() * len; }
      p.set([x + ox, y + oy, oz], i * 3); f[i] = fw ? 1 : 0;
    }
  },
  agents(N, r, p, f) { // 5-node graph: Plan -> Retrieve -> Tool -> Check -> Respond (+ loop back)
    const nodes = [[-.78, .12, 0], [-.38, -.22, .06], [0, .2, .12], [.38, -.22, .06], [.78, .12, 0]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [3, 1]];
    for (let i = 0; i < N; i++) {
      if (r() < .45) { const e = Math.floor(r() * edges.length), [a, b] = edges[e], t = r(), A = nodes[a], B = nodes[b]; const bow = e === 4 ? Math.sin(t * 3.1416) * -.22 : 0;
        p.set([A[0] + (B[0] - A[0]) * t + G(r) * .006, A[1] + (B[1] - A[1]) * t + bow + G(r) * .006, A[2] + (B[2] - A[2]) * t], i * 3); f[i] = t; }
      else { const n = nodes[Math.floor(r() * 5)], a = r() * 6.2832, rr = .06 + G(r) * .008; p.set([n[0] + Math.cos(a) * rr, n[1] + Math.sin(a) * rr, n[2] + G(r) * .01], i * 3); f[i] = -1; }
    }
  },
  agriculture(N, r, p, f) { // sphere with a faint calyx
    for (let i = 0; i < N; i++) {
      if (r() < .06) { const a = Math.floor(r() * 5) / 5 * 6.2832 + G(r) * .04, t = r() * .28; p.set([Math.cos(a) * t, .58 + t * .18, Math.sin(a) * t * .5], i * 3); f[i] = -1; continue; }
      const a = r() * 6.2832, b = Math.acos(r() * 2 - 1), rr = .6; const y = Math.cos(b) * rr * .9;
      p.set([Math.sin(b) * Math.cos(a) * rr, y, Math.sin(b) * Math.sin(a) * rr * .6], i * 3); f[i] = (y + .55) / 1.1;
    }
  },
};
