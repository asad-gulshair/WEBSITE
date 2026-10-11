// Content loader. Projects live in content/projects.json, site copy and contact settings in content/site.json; both are
// edited in the Pages CMS admin (.pages.yml, see README). They are normalised here into the shape the renderers use.
// Badges are truthful: PRODUCTION (used day to day), PROTOTYPE (working system, not deployed at scale), CURRENT ROLE (work in
// my current job; details private), DEMO (open/pretrained model on real footage), RESEARCH (notebook / study), PUBLISHED (peer-reviewed).
// media.type: 'video' (self-hosted loop), 'img', 'illus' (in-browser SVG illustration, captioned "(Illustration)").
export let PROJECTS = [], CATS = [];
export const bySlug = (s) => PROJECTS.find((p) => p.slug === s);
const getJSON = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`); return r.json(); });
const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));
const strs = (a) => (Array.isArray(a) ? a.map(str).filter(Boolean) : []);
// YouTube: accepts a video id or any youtube.com / youtu.be link
export const ytId = (v) => { v = str(v); if (/^[\w-]{11}$/.test(v)) return v; const m = v.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : ''; };
const MEDIA = { image: 'img', img: 'img', video: 'video', illustration: 'illus', illus: 'illus' };
function project(p) {
  const links = Array.isArray(p.links) ? p.links.filter((l) => l && str(l.url)) : [];
  const m = p.media || {}, type = MEDIA[str(m.type)] || 'illus', ex = p.extra || {};
  return {
    slug: str(p.slug), title: str(p.title), cat: str(p.category), sub: str(p.subcategory), featured: !!p.featured,
    badge: str(p.status) || 'PROTOTYPE', year: str(p.year), role: str(p.role), outcome: str(p.summary),
    media: { type, src: str(m.src), poster: str(m.poster), key: str(m.illustration) || 'weld', cap: str(m.caption), portrait: !!m.portrait },
    youtube: ytId(p.youtube), ytPortrait: !!p.youtubePortrait,
    problem: str(p.problem), approach: strs(p.approach), result: str(p.result), stack: strs(p.stack),
    code: str(links.find((l) => l.type === 'code')?.url), paper: str(links.find((l) => l.type === 'paper')?.url),
    more: links.filter((l) => l.type !== 'code' && l.type !== 'paper').map((l) => [str(l.label) || 'Link ↗', str(l.url)]),
    extra: str(ex.src) ? { src: str(ex.src), cap: str(ex.caption) } : null,
  };
}
const category = (c) => ({ id: str(c.id), label: str(c.label), dot: str(c.color) || '#E8743B', h: str(c.headline), sub: str(c.subline) });
let projP, siteP;
export function loadProjects() {
  return (projP ||= getJSON('content/projects.json').then((d) => {
    CATS = (d.categories || []).map(category).filter((c) => c.id);
    PROJECTS = (d.projects || []).filter((p) => p && str(p.slug) && str(p.title)).map(project).filter((p) => CATS.some((c) => c.id === p.cat));
    return { PROJECTS, CATS };
  }));
}
export const loadSite = () => (siteP ||= getJSON('content/site.json'));
