# Generates the 4 static pages with a shared header/footer. Run: python3 tools/build_pages.py
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://12dd260da5ed4fad.flypod.page/"
EMAIL = "asadgulshair6767@gmail.com"
GH = "https://github.com/asad-gulshair"
YT = "https://www.youtube.com/@Ultra_Vison20"
from urllib.parse import quote
MAIL_PROJECT = f"mailto:{EMAIL}?subject={quote('Project enquiry')}"
MAIL_MEET = f"mailto:{EMAIL}?subject={quote('Meeting request – project discussion')}&body={quote('Hi Asad,\n\nI would like to book a call about a project.\n\nPreferred times (with timezone):\n- \n- \n\nShort project summary:\n\n')}"
IRIS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="none" stroke="#EDEBE6" stroke-width="1.5"/><g stroke="#A3A7AB" stroke-width="1.3" stroke-linecap="round">' + ''.join(f'<path d="M12 12 L12 2.2" transform="rotate({a} 12 12) translate(3.2 0)"/>' for a in range(0, 360, 60)) + '</g><circle cx="12" cy="12" r="2.6" fill="#E8743B"/></svg>'
PAGES = {
 'index.html': ('Asad Gulshair, AI Engineer · Computer Vision & AI Agents', 'AI engineer building visual inspection systems for production lines and LLM workflows for document-heavy teams, from prototype to deployed API.', None),
 'projects.html': ('Work · Asad Gulshair, AI Engineer', 'Case studies in industrial computer vision, recruitment automation, AI agents and agriculture, with honest status labels and real model output.', 'projects'),
 'about.html': ('About · Asad Gulshair, AI Engineer', 'About Asad Gulshair: AI engineer, capabilities, experience, education and IEEE publication.', 'about'),
 'contact.html': ('Contact · Asad Gulshair, AI Engineer', 'Start a project or book a meeting with Asad Gulshair. Email and GitHub.', 'contact'),
}
def head(fn, title, desc):
    url = SITE + ('' if fn == 'index.html' else fn)
    ld = {"@context": "https://schema.org", "@type": "Person", "name": "Asad Gulshair", "jobTitle": "AI Engineer", "url": SITE, "email": "mailto:" + EMAIL, "sameAs": [GH, YT]}
    pre = '<link rel="modulepreload" href="assets/js/home.js">' if fn == 'index.html' else ''
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="author" content="Asad Gulshair">
<meta name="theme-color" content="#0A0B0D">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Asad Gulshair">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}assets/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title}"><meta name="twitter:description" content="{desc}"><meta name="twitter:image" content="{SITE}assets/og.jpg">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="icon" href="assets/favicon.png" sizes="32x32"><link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="preload" href="assets/fonts/geist-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
{pre}
<script type="application/ld+json">{json.dumps(ld)}</script>
<script type="importmap">{{"imports":{{"three":"./assets/vendor/three.module.min.js"}}}}</script>
<script src="assets/js/config.js"></script>
</head>
<body>
'''
def header(active):
    def n(href, label, key):
        cur = ' aria-current="page"' if key == active else ''
        return f'<a href="{href}"{cur}>{label}</a>'
    links = n('projects.html', 'Work', 'projects') + n('about.html', 'About', 'about') + n('contact.html', 'Contact', 'contact')
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="hdr"><div class="wrap hdr-in">
  <a class="brand" href="./" aria-label="Asad Gulshair, home">{IRIS}<span>Asad Gulshair</span></a>
  <nav class="nav" aria-label="Primary">{links}</nav>
  <div class="hdr-cta"><a class="btn sm" data-book href="{MAIL_MEET}">Book a meeting</a><a class="btn btn-primary sm" href="contact.html">Start a project</a></div>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mnav">Menu</button>
</div>
<nav id="mnav" class="mnav" aria-label="Mobile" hidden><a href="./"{' aria-current="page"' if active is None else ''}>Home</a>{links}<a class="btn btn-primary" href="contact.html">Start a project</a><a class="btn" data-book href="{MAIL_MEET}">Book a meeting</a></nav>
</header>
'''
FOOT = f'''<footer class="ftr"><div class="wrap">
  <span>© <span data-year>2026</span> Asad Gulshair</span>
  <nav aria-label="Footer"><a href="mailto:{EMAIL}" data-mail="plain">{EMAIL}</a><a href="{GH}" data-gh target="_blank" rel="noopener">GitHub ↗</a><a href="{YT}" data-yt target="_blank" rel="noopener">YouTube demos ↗</a></nav>
</div></footer>
'''
CTA_BAND = f'''<section class="cta-band" aria-labelledby="cta-h"><div class="wrap">
  <div style="display:grid;gap:20px"><p class="meta">Contact</p><h2 id="cta-h">Have a problem worth automating?</h2><p class="lead">Send a short description and what a good result looks like. I usually reply within a day.</p></div>
  <div class="cta-row"><a class="btn btn-primary" data-mail="project" href="{MAIL_PROJECT}">Start a project</a><a class="btn" data-book href="{MAIL_MEET}">Book a meeting</a><button class="btn" type="button" data-copy-email><span>Copy email</span></button></div>
</div></section>
'''
STACK = ['Python', 'PyTorch', 'TensorFlow', 'YOLOv8', 'OpenCV', 'FastAPI', 'LangChain', 'LangGraph', 'n8n', 'Whisper', 'Docker']
def page_index():
    return f'''<main id="main">
<section class="hero" aria-labelledby="hero-h"><div class="wrap">
  <div class="hero-copy">
    <p class="meta">AI Engineer · Computer Vision · LLM Agents</p>
    <h1 id="hero-h">Computer vision and AI agents that work in real operations.</h1>
    <p class="lead">I'm Asad Gulshair. I build visual inspection systems for production lines and LLM workflows that take repetitive document work off your team, from first prototype to a deployed API.</p>
    <div class="cta-row"><a class="btn btn-primary" href="#work" id="cta-work">View selected work</a><a class="btn" data-mail="project" href="{MAIL_PROJECT}">Start a project</a><a class="tlink" data-book href="{MAIL_MEET}">Book a meeting</a><a class="tlink" href="{GH}" data-gh target="_blank" rel="noopener">GitHub ↗</a></div>
    <p class="meta avail" data-avail><i></i><span>Available for new projects</span></p>
    <nav class="practice" aria-label="Practice areas">
      <a href="projects.html#industrial" data-cat="industrial"><span class="dot" style="background:var(--c-industrial)"></span>Industrial Vision</a>
      <a href="projects.html#recruitment" data-cat="recruitment"><span class="dot" style="background:var(--c-recruitment)"></span>Recruitment Automation</a>
      <a href="projects.html#agents" data-cat="agents"><span class="dot" style="background:var(--c-agents)"></span>AI Agents &amp; Automation</a>
      <a href="projects.html#agriculture" data-cat="agriculture"><span class="dot" style="background:var(--c-agriculture)"></span>Agriculture</a>
    </nav>
  </div>
  <div class="hero-media" id="hero-media" aria-hidden="true"><div class="hero-backdrop"></div><img class="fallback-still" src="assets/media/hero-still.webp" alt="" width="900" height="900" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain"><canvas id="aperture"></canvas></div>
</div></section>
<div class="stack-strip" aria-label="Tools used in shipped or published work"><div class="wrap"><ul>{''.join(f'<li>{s}</li>' for s in STACK)}</ul></div></div>
<section id="work" aria-labelledby="work-h"><div class="wrap">
  <div class="sec-head reveal"><p class="meta">Selected work</p><h2 id="work-h">Results, not mockups.</h2><p class="lead">Three projects with real model output. Every project on this site is labelled honestly: production, prototype, demo or research.</p></div>
  <div class="proof" id="proof"></div>
  <div class="pub reveal"><span class="meta">Peer-reviewed · IEEE Access · 2025</span><p><b style="color:var(--text);font-weight:500">AI-Driven Smart Agriculture:</b> an integrated approach for soil analysis, irrigation and crop-fertilizer recommendations. Co-author; built as my final-year project.</p><a class="tlink" href="https://ieeexplore.ieee.org/document/11104235" target="_blank" rel="noopener">Read the paper ↗</a></div>
  <p style="margin-top:32px"><a class="btn" href="projects.html">See all projects →</a></p>
</div></section>
<section aria-labelledby="areas-h" style="padding-top:0"><div class="wrap">
  <div class="sec-head reveal"><p class="meta">Selected work by area</p><h2 id="areas-h">Four areas where I've designed, trained and deployed systems.</h2></div>
  <div class="areas reveal" id="areas"></div>
</div></section>
<section aria-labelledby="how-h" style="padding-top:0"><div class="wrap">
  <div class="sec-head reveal"><p class="meta">How I work</p><h2 id="how-h">How a project runs.</h2><p class="lead">Clear scope, early demos on your data, and a handover you can run without me.</p></div>
  <div class="steps reveal">
    <div class="step"><span class="meta">01</span><h3>Scope</h3><p>We define what "working" means: the success metric, the data available and where the system runs.</p></div>
    <div class="step"><span class="meta">02</span><h3>Prototype</h3><p>A demo on your own data early on, so you can judge real output before committing further.</p></div>
    <div class="step"><span class="meta">03</span><h3>Build</h3><p>A hardened pipeline, an API and evaluation on held-out data.</p></div>
    <div class="step"><span class="meta">04</span><h3>Hand over</h3><p>Documentation, a deployment guide and a walkthrough call.</p></div>
  </div>
  <div class="deliver reveal"><div style="display:grid;gap:12px;align-content:start"><p class="meta">What you get</p><h3>Everything needed to run it without me.</h3></div>
    <ul class="checks"><li>Source code in your repository</li><li>A REST API (FastAPI) or a workflow export</li><li>An evaluation report with real metrics</li><li>Setup and run documentation</li><li>A recorded walkthrough</li><li>Fixed scope and milestones agreed up front</li></ul></div>
</div></section>
{CTA_BAND}</main>
'''
def page_projects():
    return f'''<main id="main">
<div class="page-head"><div class="wrap"><p class="meta">Work</p><h1 style="font-size:clamp(40px,5vw,72px);max-width:20ch">Selected work</h1><p class="lead">Four areas where I've designed, trained and deployed systems. Open any project for the problem, approach and result.</p></div></div>
<nav class="catnav" aria-label="Work categories"><div class="wrap" style="position:relative"><ul id="catlist">
  <li><a href="#industrial" data-cat="industrial"><span class="dot" style="background:var(--c-industrial)"></span>Industrial Vision</a></li>
  <li><a href="#recruitment" data-cat="recruitment"><span class="dot" style="background:var(--c-recruitment)"></span>Recruitment Automation</a></li>
  <li><a href="#agents" data-cat="agents"><span class="dot" style="background:var(--c-agents)"></span>AI Agents &amp; Automation</a></li>
  <li><a href="#agriculture" data-cat="agriculture"><span class="dot" style="background:var(--c-agriculture)"></span>Agriculture</a></li>
<li class="bar" aria-hidden="true"></li></ul></div></nav>
<div id="cats"></div>
{CTA_BAND}</main>
'''
def page_about():
    return f'''<main id="main">
<div class="page-head"><div class="wrap"><p class="meta">About</p><h1 style="font-size:clamp(40px,5vw,72px);max-width:20ch">AI engineer where models meet operations.</h1></div></div>
<section style="padding-top:24px" aria-label="About"><div class="wrap about-grid">
  <div><p class="meta" style="margin-bottom:16px">Asad Gulshair</p><div style="display:flex;flex-wrap:wrap;gap:12px"><a class="btn btn-primary" href="contact.html">Start a project</a><a class="btn" href="{GH}" data-gh target="_blank" rel="noopener">GitHub ↗</a></div></div>
  <div style="display:grid;gap:20px"><p class="lead">I'm an AI engineer who works where models meet operations: cameras on production lines, documents in HR pipelines, agents inside business tools.</p>
  <p style="color:var(--text-2);max-width:64ch">I care about systems that are measurable, maintainable and handed over properly. Most of my work starts with a messy real-world input (a line camera, a pile of applications, a weekly report) and ends with an API or workflow a team uses every day. I'm a co-author of a peer-reviewed IEEE Access paper (2025) on AI for smart agriculture.</p></div>
</div></section>
<section style="padding-top:0" aria-labelledby="cap-h"><div class="wrap">
  <div class="sec-head reveal"><h2 id="cap-h">Capabilities</h2></div>
  <div class="caps reveal">
    <div><h3>Computer vision</h3><ul><li>Object detection and tracking (YOLOv8, ByteTrack)</li><li>Defect and anomaly detection</li><li>Measurement with ArUco markers and depth estimation</li><li>Image classification (CNNs, transfer learning)</li><li>OpenCV pipelines that run on CPU</li></ul></div>
    <div><h3>LLMs and agents</h3><ul><li>LangChain and LangGraph workflows</li><li>Retrieval-augmented generation (FAISS, LlamaIndex)</li><li>Whisper transcription and translation</li><li>n8n and Apps Script automation</li><li>Prompting and evaluation</li></ul></div>
    <div><h3>Delivery</h3><ul><li>FastAPI and REST APIs</li><li>Docker</li><li>Power BI and Looker dashboards</li><li>Python, SQL, TensorFlow, PyTorch, scikit-learn</li><li>Documentation and handover</li></ul></div>
  </div>
</div></section>
<section style="padding-top:0" aria-labelledby="exp-h"><div class="wrap">
  <div class="sec-head reveal"><h2 id="exp-h">Experience</h2></div>
  <ol class="timeline reveal">
    <li><span class="meta">2026 to present</span><div><h3>AI Engineer, manufacturing sector <span class="cur">Current</span></h3><p>LLM-powered HR workflow automation for recruitment and onboarding with LangChain and LangGraph, rolled out with the operations team. Currently also working on bottle bubble detection and mushroom defect classification for production quality control.</p></div></li>
    <li><span class="meta">2025 to 2026</span><div><h3>Data Scientist, digital media</h3><p>Shipped a multilingual subtitle and transcription SaaS (OpenAI, Whisper, FFmpeg) that cut manual translation effort by about 40%. Power BI and Looker dashboards; workflow automation with n8n, Apps Script and APIs.</p></div></li>
    <li><span class="meta">2025</span><div><h3>AI Intern, applied industrial AI</h3><p>Computer-vision inspection systems for manufacturing QA with YOLOv8 and CNNs, served through FastAPI. OpenCV/ArUco dimension measurement and monocular depth estimation.</p></div></li>
  </ol>
</div></section>
<section style="padding-top:0" aria-labelledby="edu-h"><div class="wrap">
  <div class="sec-head reveal"><h2 id="edu-h">Education and research</h2></div>
  <div class="two reveal">
    <div class="panel"><p class="meta">Degree · 2021 to 2025</p><h3>B.S. Data Science</h3><p>Statistics, machine learning, databases, data visualisation and applied Python.</p></div>
    <div class="panel"><p class="meta">Final-year project · Published in IEEE Access, 2025</p><h3>AI-driven smart agriculture</h3><p>IoT soil sensors and a weather API feeding models for soil analysis, irrigation advice and crop-fertilizer recommendations, with explainable AI and a farmer chatbot. </p><div class="stats" aria-label="Accuracies reported in the paper"><div><b data-count="99.13" data-suffix="%">99.13%</b><span>Irrigation advice</span></div><div><b data-count="98.75" data-suffix="%">98.75%</b><span>Crop recommendation</span></div><div><b data-count="99.3" data-suffix="%">99.3%</b><span>Fertilizer recommendation</span></div></div>
      <div style="display:flex;flex-wrap:wrap;gap:12px 20px;margin-top:6px"><a class="tlink" href="https://ieeexplore.ieee.org/document/11104235" target="_blank" rel="noopener">Read the paper ↗</a><a class="tlink" href="projects.html#/work/smart-farming-ieee">View case study →</a><a class="tlink" href="https://github.com/asad-gulshair/Agro-high-AI-powered-Forming-Project" target="_blank" rel="noopener">View code ↗</a></div></div>
  </div>
</div></section>
{CTA_BAND}</main>
'''
def page_contact():
    return f'''<main id="main">
<div class="page-head"><div class="wrap"><p class="meta">Contact</p><h1 style="font-size:clamp(40px,5vw,72px);max-width:18ch">Have a problem worth automating?</h1></div></div>
<section style="padding-top:16px" aria-label="Contact options"><div class="wrap contact-grid">
  <div class="left">
    <p class="lead">Send a short description of the problem and what a good result looks like. I usually reply within a day.</p>
    <p class="meta avail" data-avail><i></i><span>Available for new projects</span></p>
    <div class="panel"><p class="meta">Useful to include</p><ul class="checks" style="grid-template-columns:1fr"><li>What you want detected, measured or automated</li><li>A few sample images, videos or documents</li><li>Where it needs to run (line PC, cloud, existing tool)</li><li>Timeline and any fixed constraints</li></ul></div>
  </div>
  <div class="ccards">
    <div class="ccard"><div class="k"><span class="meta">Email</span><span class="v" data-email-text>{EMAIL}</span><span class="d">Best for project briefs and files.</span></div>
      <div class="acts"><button class="btn sm" type="button" data-copy-email><span>Copy</span></button><a class="btn btn-primary sm" data-mail="project" href="{MAIL_PROJECT}">Email me</a></div></div>
    <div class="ccard"><div class="k"><span class="meta">Book a meeting</span><span class="d">A short call to talk through your project. Share a few times that suit you, with your timezone.</span></div>
      <div class="acts"><a class="btn sm" data-book href="{MAIL_MEET}">Book a meeting</a></div></div>
    <div class="ccard"><div class="k"><span class="meta">GitHub</span><span class="v">github.com/asad-gulshair</span><span class="d">Code for the public projects on this site.</span></div>
      <div class="acts"><a class="btn sm" href="{GH}" data-gh target="_blank" rel="noopener">Open GitHub ↗</a></div></div>
    <div class="ccard"><div class="k"><span class="meta">YouTube</span><span class="v">Ultra Vision</span><span class="d">Short computer-vision demos on real footage.</span></div>
      <div class="acts"><a class="btn sm" href="{YT}" data-yt target="_blank" rel="noopener">More demos on YouTube ↗</a></div></div>
  </div>
</div></section>
</main>
'''
SCRIPTS = {'index.html': 'home.js', 'projects.html': 'projects.js', 'about.html': 'common.js', 'contact.html': 'common.js'}
BODIES = {'index.html': page_index, 'projects.html': page_projects, 'about.html': page_about, 'contact.html': page_contact}
for fn, (title, desc, active) in PAGES.items():
    html = head(fn, title, desc) + header(active) + BODIES[fn]() + FOOT + f'<script type="module" src="assets/js/{SCRIPTS[fn]}"></script>\n</body>\n</html>\n'
    (ROOT / fn).write_text(html)
# 404
nf = head('404.html', 'Page not found · Asad Gulshair', 'Page not found.') + header('x') + '<main id="main"><div class="page-head"><div class="wrap"><p class="meta">404</p><h1 style="font-size:56px">Page not found.</h1><p class="lead">The link may be old. Try the work page or get in touch.</p><div class="cta-row"><a class="btn btn-primary" href="./">Home</a><a class="btn" href="projects.html">Work</a><a class="btn" href="contact.html">Contact</a></div></div></div></main>' + FOOT + '<script type="module" src="assets/js/common.js"></script>\n</body>\n</html>\n'
(ROOT / '404.html').write_text(nf)
print('built')
