// "The Aperture", premium pass (REFINE_SPEC §2). Procedural only: no textures or models are downloaded.
import * as THREE from 'three';
import { onTick, REDUCED, now, CAPTURE } from './engine.js';
import { makeTargets, STATES } from './shapes.js';

const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // power3.inOut
const damp = THREE.MathUtils.damp;
const OPEN = { idle: .6, industrial: .35, recruitment: .55, agents: .7, agriculture: .85 };
export const TINT = { idle: '#E8743B', industrial: '#E8743B', recruitment: '#D2B06A', agents: '#8EA2E8', agriculture: '#8DB86A' };

function lightformerEnv(renderer) { // 3 emissive planes -> PMREM, then dispose the source scene
  const s = new THREE.Scene(), geo = new THREE.PlaneGeometry(1, 1);
  s.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x454b53), side: THREE.BackSide })));
  const add = (w, h, x, y, z, i, col = 0xffffff) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(i), side: THREE.DoubleSide })); m.scale.set(w, h, 1); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  add(6, 4, -4, 4, 4, 3);            // large softbox, top-left
  add(.6, 7, 5, 0, 1, 2);            // thin strip, right
  add(8, 1.2, 0, -4, 2, .6, 0xffd9b8); // weak warm fill, bottom
  const pm = new THREE.PMREMGenerator(renderer); const tex = pm.fromScene(s, .02).texture;
  s.traverse((o) => { o.material?.dispose?.(); }); geo.dispose(); pm.dispose(); return tex;
}
function knurlNormal() { // 256px canvas normal map for the grip band
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 8) { g.fillStyle = 'rgb(70,128,255)'; g.fillRect(x, 0, 3, 256); g.fillStyle = 'rgb(186,128,255)'; g.fillRect(x + 4, 0, 3, 256); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(24, 1); return t;
}

export function createAperture(canvas, { tier = 'high' } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: CAPTURE }); } catch (e) { return null; }
  if (!renderer.getContext()) return null;
  let DPR = Math.min(devicePixelRatio || 1, tier === 'high' ? 1.75 : 1.25); renderer.setPixelRatio(DPR);
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.environment = lightformerEnv(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50); camera.position.set(0, 0, 8.2);
  const rig = new THREE.Group(); scene.add(rig);
  const key = new THREE.DirectionalLight(0xFFF1E4, 1.1); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.SpotLight(0xA9BCCF, .9 * 30, 20, .6, .8); rim.position.set(4, 1.5, -4); scene.add(rim);
  const accent = new THREE.Color(TINT.idle);

  // ---- lens barrel (lathe profile: front lip, stepped chamfers, knurled band) ----
  const prof = [[1.62, -.5], [1.98, -.5], [2.05, -.42], [2.05, -.1], [2.0, -.05], [2.0, .12], [1.92, .18], [1.92, .26], [1.84, .3], [1.62, .3]].map(([x, y]) => new THREE.Vector2(x, y));
  const barrel = new THREE.Mesh(new THREE.LatheGeometry(prof, 160), new THREE.MeshPhysicalMaterial({ color: 0x16191C, metalness: 1, roughness: .42, envMapIntensity: 1, side: THREE.DoubleSide }));
  barrel.rotation.x = Math.PI / 2; rig.add(barrel);
  const knurl = new THREE.Mesh(new THREE.CylinderGeometry(2.062, 2.062, .26, 160, 1, true), new THREE.MeshPhysicalMaterial({ color: 0x15181b, metalness: 1, roughness: .5, normalMap: knurlNormal(), normalScale: new THREE.Vector2(.9, .9) }));
  knurl.rotation.x = Math.PI / 2; knurl.position.z = -.28; rig.add(knurl);

  // ---- 12 blades, one InstancedMesh ----
  const S = new THREE.Shape(); S.moveTo(0, -.2); S.quadraticCurveTo(-.7, -.42, -1.28, .12); S.quadraticCurveTo(-.62, .02, 0, .2); S.quadraticCurveTo(.1, 0, 0, -.2);
  const bg = new THREE.ExtrudeGeometry(S, { depth: .012, bevelEnabled: true, bevelThickness: .004, bevelSize: .003, bevelSegments: 3, curveSegments: tier === 'high' ? 20 : 12 });
  const bm = new THREE.MeshPhysicalMaterial({ color: 0x30353b, metalness: 1, roughness: .3, anisotropy: .7, anisotropyRotation: Math.PI / 2, clearcoat: .5, clearcoatRoughness: .12, envMapIntensity: 1.6 });
  const blades = new THREE.InstancedMesh(bg, bm, 12); rig.add(blades);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
  function setBlades(open, orbit) {
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + orbit, w = .12 + open * 1.05;
      P.set(Math.cos(a) * 1.52, Math.sin(a) * 1.52, -.05 + i * .004); E.set(0, 0, a - w); Q.setFromEuler(E); M4.compose(P, Q, SC); blades.setMatrixAt(i, M4); }
    blades.instanceMatrix.needsUpdate = true;
  }

  // ---- inner accent ring + soft halo (stands in for bloom) ----
  const ringMat = new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(1.6), toneMapped: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.64, .006, 8, 240), ringMat); ring.position.z = .02; rig.add(ring);
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.56, 1.74, 160), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uC: { value: accent }, uI: { value: .28 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uC; uniform float uI; varying vec3 vP; void main(){ float d=abs(length(vP.xy)-1.64)/.09; float a=exp(-d*d*3.)*uI; gl_FragColor=vec4(uC*a,a); }' }));
  halo.position.z = .02; rig.add(halo);

  // ---- front glass element: fresnel rim + faint coating gradient ----
  const glass = new THREE.Mesh(new THREE.SphereGeometry(2.6, 64, 32, 0, Math.PI * 2, 0, .68), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); vW=position; gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float f=pow(1.-abs(dot(vN,vV)),3.); vec3 coat=mix(vec3(.42,.3,.62), vec3(.3,.55,.45), smoothstep(-1.5,1.5,vW.x+vW.y)); float sheen=0.; vec3 c=coat*f*.55+vec3(sheen); gl_FragColor=vec4(c, 1.); }' }));
  glass.rotation.x = Math.PI / 2; glass.position.z = -2.25; rig.add(glass);

  // ---- particle core: monochrome bone, ~8% take the category tint; fake depth of field ----
  const N = tier === 'high' ? 3500 : 1500, T = makeTargets(N);
  const g = new THREE.BufferGeometry(); const seed = new Float32Array(N), size = new Float32Array(N);
  for (let i = 0; i < N; i++) { seed[i] = (i * 0.618034) % 1; size[i] = .7 + ((i * 7919) % 100) / 100 * .8; }
  g.setAttribute('position', new THREE.BufferAttribute(T.idle.p, 3));
  STATES.forEach((s, k) => g.setAttribute('a' + k, new THREE.BufferAttribute(T[s].p, 3)));
  const fa = new Float32Array(N * 4); for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) fa[i * 4 + k] = T[STATES[k]].f[i];
  g.setAttribute('aFa', new THREE.BufferAttribute(fa, 4)); g.setAttribute('aFb', new THREE.BufferAttribute(T.agriculture.f, 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1)); g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const U = { uFrom: { value: 0 }, uTo: { value: 0 }, uMorph: { value: 1 }, uTime: { value: 0 }, uAccent: { value: accent }, uPx: { value: DPR }, uFocus: { value: 8.0 }, uSpin: { value: 0 } };
  const pmat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
    attribute vec3 a0; attribute vec3 a1; attribute vec3 a2; attribute vec3 a3; attribute vec3 a4; attribute vec4 aFa; attribute float aFb; attribute float aSeed; attribute float aSize;
    uniform float uFrom, uTo, uMorph, uTime, uPx, uFocus, uSpin; uniform vec3 uAccent; varying vec3 vC; varying float vA;
    vec3 T(float i){ if(i<.5) return a0; if(i<1.5) return a1; if(i<2.5) return a2; if(i<3.5) return a3; return a4; }
    float F(float i){ if(i<.5) return aFa.x; if(i<1.5) return aFa.y; if(i<2.5) return aFa.z; if(i<3.5) return aFa.w; return aFb; }
    vec3 rotZ(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x-s*p.y, s*p.x+c*p.y, p.z); }
    float hi(float i, float f){ // highlight weight per state
      if(i<.5) return step(.92, aSeed);
      if(i<1.5) return f;
      if(i<2.5) return f*step(.6, aSeed);
      if(i<3.5) return f<0. ? .7 : smoothstep(.1,0.,abs(fract(f - uTime*.25)-.5)-.4)*.8;
      return f<0. ? .6 : step(.92, aSeed)*f; }
    void main(){
      float m = smoothstep(aSeed*.25, aSeed*.25+.75, uMorph);
      vec3 p = mix(T(uFrom), T(uTo), m);
      float idle = (uFrom<.5 ? 1.-m : 0.) + (uTo<.5 ? m : 0.);
      p = rotZ(p, uSpin*idle*(.6+aSeed*.4));
      float n = aSeed*43.7; p += vec3(sin(uTime*.5+n), cos(uTime*.6+n*1.3), sin(uTime*.4+n*.7)) * .006;
      float h = mix(hi(uFrom, F(uFrom)), hi(uTo, F(uTo)), m);
      vec3 bone = vec3(.93,.92,.9);
      vC = mix(bone*.95, uAccent*1.5, clamp(h,0.,1.)); vA = .55 + h*.45;
      vec4 mv = modelViewMatrix * vec4(p*1.55 + vec3(0.,0.,.1), 1.);
      float blur = clamp(abs(-mv.z - uFocus)*1.6, 0., 1.6);
      vA *= 1. / (1. + blur*1.4);
      gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uPx * (16. / -mv.z) * (1. + blur);
    }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float r = length(gl_PointCoord-.5); if(r>.5) discard; gl_FragColor = vec4(vC, smoothstep(.5,.1,r)*vA); }` });
  const pts = new THREE.Points(g, pmat); pts.frustumCulled = false; rig.add(pts);

  // ---- state machine ----
  const api = { N, tier };
  let state = 'idle', morphStart = -1e9, preview = null, prevTimer = 0, dirty = true;
  const cur = { open: OPEN.idle, tint: accent.clone() }; const tintTarget = accent.clone();
  function startMorph(s, instant) {
    const k = STATES.indexOf(s);
    if (instant || REDUCED) { U.uFrom.value = k; U.uTo.value = k; U.uMorph.value = 1; morphStart = -1e9; cur.open = OPEN[s]; cur.tint.set(TINT[s]); accent.copy(cur.tint); dirty = true; return; }
    // start from the current interpolated state: freeze the visible blend as new "from"
    if (U.uMorph.value < .5) { /* keep from */ } else U.uFrom.value = U.uTo.value;
    U.uTo.value = k; U.uMorph.value = 0; morphStart = now(); dirty = true;
  }
  api.to = (s, { instant = false } = {}) => { if (!OPEN[s]) s = 'idle'; preview = null; if (s === state && !instant) return; state = s; tintTarget.set(TINT[s]); startMorph(s, instant || !visible); };
  api.preview = (s) => { clearTimeout(prevTimer); if (s) { preview = s; tintTarget.set(TINT[s]); startMorph(s, false); } else prevTimer = setTimeout(() => { preview = null; tintTarget.set(TINT[state]); startMorph(state, false); }, 400); };
  Object.defineProperty(api, 'state', { get: () => state });
  let scrollP = 0; api.setScroll = (p) => { scrollP = Math.max(0, Math.min(1, p)); dirty = true; };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!REDUCED) addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = -(e.clientY / innerHeight * 2 - 1); }, { passive: true });

  let W = 1, H = 1;
  function resize() { const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); renderer.setSize(W, H, false); camera.aspect = W / H;
    const fit = Math.max(1, 1 / camera.aspect) * 8.2; camera.position.z = fit; U.uFocus.value = fit; camera.updateProjectionMatrix(); dirty = true; }
  resize(); new ResizeObserver(resize).observe(canvas);
  let visible = true, pageVisible = !document.hidden;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  document.addEventListener('visibilitychange', () => { pageVisible = !document.hidden; });

  // adaptive quality: avg frame time > 14ms over 2s -> drop DPR by .25 (floor 1)
  let acc = 0, cnt = 0, winStart = 0;
  let t0 = null; const rot = { x: 0, y: 0 };
  function frame(t, dt) {
    if (!visible || !pageVisible || scrollP >= .999) return;
    if (REDUCED && !dirty) return;
    if (t0 === null) t0 = t; const time = REDUCED ? 0 : (t - t0) / 1000, s = Math.min(.05, dt / 1000);
    U.uTime.value = time;
    const mp = Math.min(1, (t - morphStart) / 1200); U.uMorph.value = REDUCED ? 1 : ease(mp);
    const target = OPEN[preview || state];
    cur.open = REDUCED ? target : damp(cur.open, target, 2.6, s);
    cur.tint.lerp(tintTarget, REDUCED ? 1 : Math.min(1, s * 3)); accent.copy(cur.tint); ringMat.color.copy(cur.tint).multiplyScalar(1.6);
    const breathe = REDUCED ? 0 : Math.sin(time * Math.PI * 2 / 8) * .02;
    const open = Math.min(1, cur.open + breathe + scrollP * .15 / .8);
    setBlades(open, 0);
    U.uSpin.value = time * .08;
    mouse.x = damp(mouse.x, mouse.tx, 3.5, s); mouse.y = damp(mouse.y, mouse.ty, 3.5, s);
    const deg = Math.PI / 180;
    rig.rotation.set(-mouse.y * 5 * deg, mouse.x * 5 * deg + Math.sin(time * Math.PI * 2 / 12) * 1.5 * deg, 0);
    const sp = Math.min(1, scrollP / .8); rig.scale.setScalar(1 - .12 * sp); canvas.style.opacity = String(1 - sp);
    renderer.render(scene, camera); dirty = false;
    if (!CAPTURE && !REDUCED) { if (!winStart) winStart = t; acc += dt; cnt++; if (t - winStart > 2000) { const avg = acc / cnt; if (avg > 14 && DPR > 1) { DPR = Math.max(1, DPR - .25); renderer.setPixelRatio(DPR); resize(); } acc = cnt = 0; winStart = t; } }
  }
  setBlades(OPEN.idle, 0);
  onTick(frame);
  api.renderer = renderer; api.render = () => { dirty = true; };
  // screen-space helpers for the HUD overlay (hud.js): particle-space point -> canvas px
  const PV = new THREE.Vector3();
  api.project = (x, y, z = 0, core = true) => { const k = core ? 1.55 : 1; PV.set(x * k, y * k, z * k + (core ? .1 : 0)).applyMatrix4(rig.matrixWorld).project(camera); return [(PV.x + 1) / 2 * W, (1 - PV.y) / 2 * H]; };
  Object.defineProperty(api, 'active', { get: () => preview || state });
  api.size = () => [W, H];
  return api;
}
