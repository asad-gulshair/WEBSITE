// Ambient 3D field behind every page (Three.js, procedural, no downloads).
// Low-poly glass solids with glowing edges + a drifting particle field. The camera travels down through the field as you
// scroll, the scene leans toward the cursor, and the edge colour follows the section you are in (orange > gold > blue > green).
// Self-protecting: pauses when the tab is hidden, drops resolution (then switches itself off) if the frame rate is poor.
import * as THREE from 'three';
import { onTick, REDUCED } from './engine.js';

const TINTS = ['#E8743B', '#9B8CFF', '#47D7E6', '#8DB86A'].map((c) => new THREE.Color(c));
const rnd = (a, b) => a + Math.random() * (b - a);

export function createAmbient({ tier = 'high' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ambient'; canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: tier === 'high', alpha: true, powerPreference: 'low-power' }); } catch (e) { return null; }
  if (!renderer.getContext()) return null;
  document.body.prepend(canvas);
  let DPR = Math.min(devicePixelRatio || 1, tier === 'high' ? 1.5 : 1); renderer.setPixelRatio(DPR);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 80); camera.position.set(0, 0, 14);
  const field = new THREE.Group(); scene.add(field);
  scene.add(new THREE.AmbientLight(0x8890a0, .9));
  const key = new THREE.DirectionalLight(0xfff0e0, 1.4); key.position.set(-4, 6, 6); scene.add(key);
  const glow = new THREE.PointLight(0xE8743B, 38, 26, 1.6); glow.position.set(3, 0, 6); scene.add(glow);

  // page height in world units: the camera descends by SPAN as you scroll from top to bottom
  const SPAN = tier === 'high' ? 46 : 34, N = tier === 'high' ? 30 : 16;
  const geos = [new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1.1, 0), new THREE.TorusGeometry(.9, .28, 10, 28), new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.TetrahedronGeometry(1.2, 0), new THREE.TorusKnotGeometry(.7, .2, 64, 8)];
  const edgeGeos = geos.map((g) => new THREE.EdgesGeometry(g, 20));
  const edgeMat = new THREE.LineBasicMaterial({ color: TINTS[0], transparent: true, opacity: .36 });
  const solids = [];
  for (let i = 0; i < N; i++) {
    const gi = i % geos.length;
    const m = new THREE.Mesh(geos[gi], new THREE.MeshStandardMaterial({ color: 0x1b1f26, metalness: .7, roughness: .3, flatShading: true, transparent: true, opacity: .38 }));
    m.add(new THREE.LineSegments(edgeGeos[gi], edgeMat));
    const side = Math.random() < .5 ? -1 : 1;
    // u: horizontal position as a fraction of the visible half-width. Mostly toward the edges so the copy stays clean.
    const u = Math.random() < .88 ? side * rnd(.64, 1.1) : rnd(-.4, .4);
    m.userData = { u, y: -(i / N) * SPAN + rnd(-1.5, 1.5), z: rnd(-14, 0), s: rnd(.4, 1.1) * (gi === 5 ? .7 : 1), rx: rnd(-.25, .25), ry: rnd(.1, .4), ph: rnd(0, 6.28) };
    field.add(m); solids.push(m);
  }
  // particles
  const PN = tier === 'high' ? 900 : 380, pp = new Float32Array(PN * 3), pv = new Float32Array(PN);
  for (let i = 0; i < PN; i++) { pp[i * 3] = rnd(-1, 1); pp[i * 3 + 1] = -Math.random() * (SPAN + 8) + 4; pp[i * 3 + 2] = rnd(-16, 2); pv[i] = rnd(.2, 1); }
  const pg = new THREE.BufferGeometry(); const pos = new Float32Array(PN * 3); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.PointsMaterial({ color: 0xffe8d4, size: .055, transparent: true, opacity: .7, sizeAttenuation: true, depthWrite: false });
  const points = new THREE.Points(pg, pm); field.add(points);

  let halfW = 9, W = 0, H = 0;
  function resize() {
    W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H;
    // narrow screens: push content to the edges less, shrink the solids
    camera.position.z = W < 700 ? 17 : 14; camera.updateProjectionMatrix();
    halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
  }
  resize(); addEventListener('resize', resize, { passive: true });

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; glow.userData.t = 1; }, { passive: true });
  let prog = 0, progT = 0;
  const readScroll = () => { const max = document.documentElement.scrollHeight - innerHeight; progT = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0; };
  addEventListener('scroll', readScroll, { passive: true }); readScroll(); prog = progT;

  const tint = new THREE.Color();
  let on = true, frames = 0, acc = 0, last = performance.now();
  document.addEventListener('visibilitychange', () => { on = !document.hidden; });
  function tintAt(p) { const f = p * (TINTS.length - 1), i = Math.min(TINTS.length - 2, Math.floor(f)); return tint.copy(TINTS[i]).lerp(TINTS[i + 1], f - i); }
  // fill the page-position-dependent bits once per frame
  const stop = onTick((t, dt) => {
    if (!on) return;
    const s = Math.min(.05, dt / 1000), k = 1 - Math.exp(-4 * s);
    prog += (progT - prog) * (1 - Math.exp(-5 * s)); mouse.x += (mouse.tx - mouse.x) * k; mouse.y += (mouse.ty - mouse.y) * k;
    const time = t / 1000;
    camera.position.y = -prog * SPAN; camera.position.x = mouse.x * .9; camera.lookAt(mouse.x * .4, camera.position.y - mouse.y * .35, 0);
    field.rotation.y = mouse.x * .06;
    const c = tintAt(prog); edgeMat.color.copy(c); glow.color.copy(c); glow.position.set(mouse.x * halfW * .8, camera.position.y - mouse.y * 4, 6);
    for (let i = 0; i < solids.length; i++) {
      const m = solids[i], d = m.userData, z = d.z;
      const hw = halfW * (1 + (-z) * .07);        // objects further back cover a wider slice of the view
      m.position.set(d.u * hw, d.y + Math.sin(time * .5 + d.ph) * .45, z);
      m.rotation.x += d.rx * s * .6; m.rotation.y += d.ry * s * .6;
      m.scale.setScalar(d.s * (W < 700 ? .7 : 1));
    }
    const a = pg.attributes.position.array, hw = halfW * 1.8;
    for (let i = 0; i < PN; i++) {
      const y = pp[i * 3 + 1] + Math.sin(time * .3 * pv[i] + i) * .003;
      a[i * 3] = pp[i * 3] * hw + Math.sin(time * .15 * pv[i] + i * 3.1) * .25; a[i * 3 + 1] = y + Math.sin(time * .2 + i) * .15; a[i * 3 + 2] = pp[i * 3 + 2];
    }
    pg.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    // frame-rate guard: ~2 s window
    frames++; acc += dt;
    if (frames >= 90) {
      const avg = acc / frames; frames = 0; acc = 0;
      if (avg > 30) { if (DPR > 1) { DPR = 1; renderer.setPixelRatio(1); resize(); } else if (avg > 42) api.destroy(); }
    }
  });
  canvas.classList.add('on');
  const api = {
    destroy() { stop(); removeEventListener('resize', resize); removeEventListener('scroll', readScroll); geos.forEach((g) => g.dispose()); edgeGeos.forEach((g) => g.dispose()); pg.dispose(); renderer.dispose(); canvas.remove(); },
  };
  return api;
}
export const AMBIENT_OK = () => {
  if (REDUCED) return false;
  const c = navigator.connection; if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return false;
  try { const t = document.createElement('canvas'); return !!(t.getContext('webgl2') || t.getContext('webgl')); } catch (e) { return false; }
};
