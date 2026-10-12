// "Scout", the site's AI companion. Original procedural character (Three.js, no downloaded models):
// ceramic shell, dark glass visor with an animated digital face, floating hands, a hover ring and cyan / violet / warm rim light.
// One renderer per canvas. The face is a CanvasTexture redrawn only when the expression or gaze changes.
import * as THREE from 'three';
import { onTick, REDUCED } from './engine.js';

const COL = { cyan: 0x47d7e6, violet: 0x9b8cff, warm: 0xe8743b, ok: 0x4cc38a, gold: 0xd2b06a, red: 0xe5584b };
const MOOD_EYE = { idle: '#7fe9f4', happy: '#7fe9f4', think: '#b3a9ff', ok: '#72e0a7', warn: '#f0cc78', low: '#ff8a7a', wink: '#7fe9f4' };

export function createCompanion(canvas, { size = 240, interactive = true, still = REDUCED } = {}) {
  let r;
  try { r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); } catch (e) { return null; }
  if (!r.getContext()) return null;
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .1, 30); cam.position.set(0, .15, 5.2); cam.lookAt(0, -.05, 0);

  // light rig: warm key, cyan + violet rims, low fill
  scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x1a1420, .55));
  const key = new THREE.DirectionalLight(0xfff1e2, 2.2); key.position.set(-2.5, 3, 4); scene.add(key);
  const rimC = new THREE.PointLight(COL.cyan, 18, 10, 1.7); rimC.position.set(-2.4, 1.2, -1.6); scene.add(rimC);
  const rimV = new THREE.PointLight(COL.violet, 16, 10, 1.7); rimV.position.set(2.4, .6, -1.4); scene.add(rimV);
  const warm = new THREE.PointLight(COL.warm, 6, 8, 2); warm.position.set(1.8, -1.2, 2.2); scene.add(warm);

  const shell = new THREE.MeshPhysicalMaterial({ color: 0xeef1f5, roughness: .32, metalness: .05, clearcoat: 1, clearcoatRoughness: .18 });
  const trim = new THREE.MeshPhysicalMaterial({ color: 0x2a2f37, roughness: .35, metalness: .85, clearcoat: .6 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x05070a, roughness: .08, metalness: .3, clearcoat: 1, clearcoatRoughness: .04 });
  const glowC = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: COL.cyan, emissiveIntensity: 1.8 });
  const glowV = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: COL.violet, emissiveIntensity: 1.6 });

  const root = new THREE.Group(); scene.add(root);
  const bot = new THREE.Group(); root.add(bot);
  // torso: a softened capsule with a chest light and a trim band
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.34, .3, 10, 28), shell); torso.position.y = -.74; torso.scale.set(1, 1, .9); bot.add(torso);
  const band = new THREE.Mesh(new THREE.TorusGeometry(.345, .03, 10, 48), trim); band.rotation.x = Math.PI / 2; band.position.y = -.66; bot.add(band);
  const chest = new THREE.Mesh(new THREE.CircleGeometry(.075, 32), glowC); chest.position.set(0, -.6, .31); bot.add(chest);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .14, 20), trim); neck.position.y = -.33; bot.add(neck);
  // head
  const head = new THREE.Group(); head.position.y = .06; bot.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.52, 48, 32), shell); skull.scale.set(1.24, .98, 1.02); head.add(skull);
  // visor: a front-facing sphere segment (phi centred on +Z) that sits proud of the shell
  const visor = new THREE.Mesh(new THREE.SphereGeometry(.5, 48, 32, Math.PI * .14, Math.PI * .72, Math.PI * .28, Math.PI * .44), glass);
  visor.scale.set(1.18, .95, 1.12); visor.position.z = .02; head.add(visor);
  // digital face drawn on a canvas, mapped on a curved strip just in front of the visor
  const fc = document.createElement('canvas'); fc.width = 512; fc.height = 192; const g = fc.getContext('2d');
  const faceTex = new THREE.CanvasTexture(fc); faceTex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .36, 48, 1, true, -Math.PI * .26, Math.PI * .52),
    new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, depthWrite: false, toneMapped: false }));
  face.position.set(0, 0, .0); face.scale.set(.96, .9, 1.04); face.renderOrder = 2; head.add(face);
  const earGeo = new THREE.CylinderGeometry(.13, .13, .12, 32); earGeo.rotateZ(Math.PI / 2);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, trim); ear.position.set(s * .64, 0, 0); head.add(ear);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.1, .016, 8, 32), s < 0 ? glowC : glowV); ring.rotation.y = Math.PI / 2; ring.position.set(s * .705, 0, 0); head.add(ring);
  }
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(.012, .016, .26, 10), trim); ant.position.set(.22, .6, -.05); ant.rotation.z = -.25; head.add(ant);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.045, 20, 14), glowC); tip.position.set(.255, .74, -.05); head.add(tip);
  // floating hands
  const handGeo = new THREE.SphereGeometry(.12, 28, 20);
  const mkHand = (s) => { const h = new THREE.Group(); const m = new THREE.Mesh(handGeo, shell); m.scale.set(.9, 1.1, .9); h.add(m); const c = new THREE.Mesh(new THREE.TorusGeometry(.085, .012, 8, 24), trim); c.rotation.x = Math.PI / 2; c.position.y = .06; h.add(c); h.position.set(s * .58, -.7, .05); bot.add(h); return h; };
  const handL = mkHand(-1), handR = mkHand(1);
  // hover ring + soft floor shadow
  const pad = new THREE.Mesh(new THREE.TorusGeometry(.42, .018, 10, 64), glowV); pad.rotation.x = Math.PI / 2; pad.position.y = -1.32; root.add(pad);
  const sc = document.createElement('canvas'); sc.width = sc.height = 128; const sg = sc.getContext('2d'); const grd = sg.createRadialGradient(64, 64, 4, 64, 64, 64); grd.addColorStop(0, 'rgba(0,0,0,.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = grd; sg.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.34; root.add(shadow);

  // ---- face drawing ----
  let mood = 'idle', blink = 0, gx = 0, gy = 0, lastFace = '';
  function drawFace() {
    const key = `${mood}|${(mood === 'sleep' ? 0 : blink).toFixed(2)}|${gx.toFixed(2)}|${gy.toFixed(2)}`; if (key === lastFace) return; lastFace = key;
    g.clearRect(0, 0, 512, 192); const col = MOOD_EYE[mood] || MOOD_EYE.idle;
    g.shadowColor = col; g.shadowBlur = 22; g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round';
    const cx = 256 + gx * 34, cy = 92 + gy * 18, dx = 92, open = Math.max(.08, 1 - blink);
    for (const s of [-1, 1]) {
      const x = cx + s * dx;
      if (mood === 'happy' || (mood === 'wink' && s > 0)) { g.lineWidth = 14; g.beginPath(); g.arc(x, cy + 14, 26, Math.PI * 1.12, Math.PI * 1.88); g.stroke(); }
      else if (mood === 'sleep') { g.lineWidth = 10; g.beginPath(); g.arc(x, cy - 6, 22, Math.PI * .15, Math.PI * .85); g.stroke(); }
      else if (mood === 'surprised') { g.beginPath(); g.arc(x, cy, 30, 0, Math.PI * 2); g.fill(); }
      else if (mood === 'think') { g.lineWidth = 12; g.beginPath(); g.moveTo(x - 26, cy); g.lineTo(x + 26, cy); g.stroke(); }
      else if (mood === 'low') { g.lineWidth = 12; g.beginPath(); g.moveTo(x - 24, cy - s * 8 - 4); g.lineTo(x + 24, cy + s * 8 - 4); g.stroke(); g.beginPath(); g.ellipse(x, cy + 12, 16, 16 * open, 0, 0, Math.PI * 2); g.fill(); }
      else { const w = mood === 'ok' ? 24 : 21, h = (mood === 'warn' ? 30 : 36) * open; g.beginPath(); g.roundRect(x - w, cy - h, w * 2, h * 2, Math.min(w, h)); g.fill(); }
    }
    if (mood === 'sleep') { g.font = '700 34px sans-serif'; g.fillText('z', cx + 150, cy - 34); g.font = '700 24px sans-serif'; g.fillText('z', cx + 182, cy - 62); }
    if (mood === 'surprised') { g.beginPath(); g.arc(cx, cy + 46, 12, 0, Math.PI * 2); g.stroke(); }
    if (mood === 'ok' || mood === 'happy') { g.lineWidth = 8; g.globalAlpha = .7; g.beginPath(); g.arc(cx, cy + 42, 20, Math.PI * .15, Math.PI * .85); g.stroke(); g.globalAlpha = 1; }
    faceTex.needsUpdate = true;
  }

  // ---- state ----
  const S = { tx: 0, ty: 0, ax: 0, ay: 0, intro: REDUCED ? 1 : 0, wave: -1, nod: -1, shake: -1, tilt: -1, scan: false, look: null, hop: -1, spin: -1, point: 0, pointDir: 1, cheer: -1, sleep: false, around: -1, lean: 0, leanT: 0, glow: new THREE.Color(COL.cyan), glowT: new THREE.Color(COL.cyan) };
  if (interactive) addEventListener('pointermove', (e) => { const b = canvas.getBoundingClientRect(); if (!b.width) return; S.tx = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / (innerWidth * .45))); S.ty = Math.max(-1, Math.min(1, (e.clientY - (b.top + b.height / 2)) / (innerHeight * .45))); }, { passive: true });

  let W = 0, H = 0;
  function resize() { const w = canvas.clientWidth || size, h = canvas.clientHeight || size; if (w === W && h === H) return; W = w; H = h; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null; ro?.observe(canvas); resize();

  let vis = true, t0 = performance.now(), nextBlink = 2.5;
  const io = new IntersectionObserver(([en]) => { vis = en.isIntersecting; }, { rootMargin: '80px' }); io.observe(canvas);
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  function frame(t, dt) {
    resize(); const s = Math.min(.05, (dt || 16) / 1000), time = (t - t0) / 1000;
    const k = 1 - Math.exp(-6 * s); S.ax += (S.tx - S.ax) * k; S.ay += (S.ty - S.ay) * k;
    // intro: rise from below, scale up, then wave
    if (S.intro < 1) { S.intro = Math.min(1, S.intro + s / 1.1); if (S.intro === 1 && S.wave < 0) { S.wave = 0; setMood('happy', 1.6); } }
    const ii = ease(S.intro); root.position.y = (1 - ii) * -1.4; root.scale.setScalar(.6 + .4 * ii);
    let yaw = S.ax * .5, pitch = S.ay * .28, roll = 0;
    if (S.look) { yaw = S.look[0]; pitch = S.look[1]; }
    if (S.scan) { yaw = Math.sin(time * 2.6) * .45; pitch = .12; }
    if (S.nod >= 0) { S.nod += s; pitch += Math.sin(S.nod * 10) * .22 * Math.max(0, 1 - S.nod / 1); if (S.nod > 1) S.nod = -1; }
    if (S.shake >= 0) { S.shake += s; yaw += Math.sin(S.shake * 16) * .28 * Math.max(0, 1 - S.shake / .9); if (S.shake > .9) S.shake = -1; }
    if (S.tilt >= 0) { S.tilt += s; roll = Math.sin(Math.min(1, S.tilt / .9) * Math.PI) * .3; if (S.tilt > 1) S.tilt = -1; }
    if (S.around >= 0) { S.around += s; yaw = Math.sin(S.around * 2.2) * .6; pitch = -.05; if (S.around > 2.9) S.around = -1; }
    if (S.sleep) { yaw *= .2; pitch = .32 + Math.sin(time * 1.2) * .03; roll = .12; }
    head.rotation.set(pitch, yaw, roll);
    // body: idle bob, hop arc, spin, and a lean that follows scroll speed
    S.lean += (S.leanT - S.lean) * (1 - Math.exp(-5 * s)); S.leanT *= Math.exp(-3 * s);
    let hopY = 0; if (S.hop >= 0) { S.hop += s; const h = Math.min(1, S.hop / .55); hopY = Math.sin(h * Math.PI) * .38; if (S.hop > .55) S.hop = -1; }
    let spinY = 0; if (S.spin >= 0) { S.spin += s; spinY = ease(Math.min(1, S.spin / .9)) * Math.PI * 2; if (S.spin > .9) S.spin = -1; }
    bot.position.y = (S.sleep ? Math.sin(time * 1.2) * .03 - .05 : Math.sin(time * 1.5) * .06) + hopY;
    bot.rotation.y = S.ax * .18 + Math.sin(time * .6) * .05 + spinY; bot.rotation.z = -S.ax * .04 + S.lean * .22; bot.rotation.x = -S.lean * .1;
    const cheer = S.cheer >= 0 ? (S.cheer += s, S.cheer > 1.3 ? (S.cheer = -1, 0) : Math.sin(Math.min(1, S.cheer / 1.3) * Math.PI)) : 0;
    handL.position.set(-.58 - cheer * .1, -.7 + Math.sin(time * 1.8 + 1) * .04 + cheer * .75 + S.lean * .06, .05 + cheer * .1);
    if (S.wave >= 0) { S.wave += s; const w = S.wave; handR.position.set(.62 + Math.sin(w * 11) * .1, -.25 + Math.min(1, w * 3) * .18 - Math.max(0, w - 1.4) * .9, .15); if (w > 1.7) S.wave = -1; }
    else if (S.point > 0) { S.point -= s; const p = Math.min(1, S.point * 3, (1.6 - S.point) * 4 + .2); handR.position.set(.58 + S.pointDir * .5 * p, -.7 + .45 * p, .1 + .25 * p); }
    else handR.position.set(.58 + cheer * .1, -.7 + Math.sin(time * 1.8) * .04 + cheer * .75 + S.lean * .06, .05 + cheer * .1);
    pad.scale.setScalar(1 + Math.sin(time * 2) * .04); pad.material.emissiveIntensity = 1.2 + Math.sin(time * 2) * .4;
    shadow.material.opacity = .8 - bot.position.y * 2;
    // eyes: gaze + blink
    gx = Math.max(-1, Math.min(1, S.ax * 1.2)); gy = Math.max(-1, Math.min(1, S.ay));
    if (time > nextBlink) { blink = Math.min(1, blink + s * 14); if (blink >= 1) nextBlink = time + .12; }
    if (blink > 0 && time > nextBlink) { blink = Math.max(0, blink - s * 10); if (blink === 0) nextBlink = time + 2.2 + Math.random() * 3; }
    S.glow.lerp(S.glowT, 1 - Math.exp(-6 * s)); glowC.emissive.copy(S.glow); chest.material.emissiveIntensity = 1.5 + Math.sin(time * 3) * .5;
    tip.material.emissiveIntensity = 1.4 + Math.sin(time * 4) * .6;
    drawFace(); r.render(scene, cam);
  }
  let moodT = 0;
  function setMood(m, secs = 0) { mood = m; clearTimeout(moodT); if (secs) moodT = setTimeout(() => { mood = 'idle'; }, secs * 1000); const c = { ok: COL.ok, warn: COL.gold, low: COL.red, think: COL.violet }[m]; S.glowT.setHex(c || COL.cyan); }
  // still mode (reduced motion): draw a settled pose once, and again only when something changes
  if (still) { S.intro = 1; }
  let lastT = 0;
  const busy = () => S.intro < 1 || S.wave >= 0 || S.nod >= 0 || S.shake >= 0 || S.tilt >= 0 || S.scan || S.hop >= 0 || S.spin >= 0 || S.cheer >= 0 || S.point > 0 || S.around >= 0 || Math.abs(S.lean) > .02;
  const stop = still ? (() => {}) : onTick((t, dt) => { if (!vis || document.hidden) return; if (!busy() && t - lastT < 31) return; frame(t, t - lastT || dt); lastT = t; });
  frame(performance.now(), 16);
  const redraw = () => { if (still) requestAnimationFrame(() => frame(performance.now(), 16)); };
  return {
    canvas, setMood: (m, s) => { setMood(m, s); redraw(); }, scan: (on) => { S.scan = on; setMood(on ? 'think' : 'idle'); },
    wave: () => { S.wave = 0; setMood('happy', 1.6); }, nod: () => { S.nod = 0; }, shake: () => { S.shake = 0; }, tilt: () => { S.tilt = 0; },
    look: (yaw, pitch) => { S.look = yaw == null ? null : [yaw, pitch || 0]; },
    hop: () => { if (S.hop < 0) S.hop = 0; },
    spin: () => { if (S.spin < 0) S.spin = 0; },
    point: (dir = 1, secs = 1.6) => { S.pointDir = dir; S.point = secs; },
    celebrate: () => { S.hop = 0; S.spin = 0; S.cheer = 0; setMood('happy', 2); },
    lookAround: () => { if (S.around < 0 && !S.sleep) S.around = 0; },
    sleep: (on) => { if (on === S.sleep) return; S.sleep = on; if (on) setMood('sleep'); else { setMood('surprised', .9); S.hop = 0; } redraw(); },
    lean: (v) => { S.leanT = Math.max(-1, Math.min(1, v)); },
    get sleeping() { return S.sleep; },
    resize: () => { W = 0; resize(); redraw(); },
    destroy: () => { stop(); io.disconnect(); ro?.disconnect(); r.dispose(); },
  };
}
