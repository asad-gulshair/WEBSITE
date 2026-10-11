"""Deterministic capture of the portfolio for the showcase video (v2, multi-page).
Usage: python record.py <base-url> <W> <H> <outdir> [seconds] [display-url]
Pages run in ?capture=1 mode: JS motion uses a virtual clock advanced by window.__step(); CSS animations are slowed with CDP
Animation.setPlaybackRate to match capture speed. Writes JPEG frames f00000.jpg...; encode with ffmpeg at 30 fps."""
import sys, os, time, math
from playwright.sync_api import sync_playwright
base, W, H, out = sys.argv[1].rstrip('/') + '/', int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
DUR = float(sys.argv[5]) if len(sys.argv) > 5 else 45
SHOWN = sys.argv[6] if len(sys.argv) > 6 else '12dd260da5ed4fad.flypod.page'
FPS = 30; NF = int(DUR * FPS)
os.makedirs(out, exist_ok=True)
ARGS = ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars']
def eio(t): return 4*t*t*t if t < .5 else 1 - (-2*t+2)**3/2
portrait = H > W
CURSOR = """(()=>{if(document.getElementById('capcur'))return;const d=document.createElement('div');d.id='capcur';d.style.cssText='position:fixed;z-index:9999;left:0;top:0;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#EDEBE6;box-shadow:0 0 0 2px rgba(0,0,0,.55);pointer-events:none;transition:none';document.body.append(d);addEventListener('pointermove',e=>{d.style.transform=`translate(${e.clientX}px,${e.clientY}px)`},{passive:true});})()"""
CAPCSS = ('.cap{font-size:34px;bottom:96px;white-space:normal;max-width:86%;text-align:center}' if portrait else '.cap{font-size:30px;bottom:64px}')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
    ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=1)
    pg = ctx.new_page(); cdp = ctx.new_cdp_session(pg)
    state = {'mx': W * .3, 'my': H * .5, 'sy': 0, 'rate': .2}
    def load(path):
        pg.goto(base + path.replace('#', '?capture=1#') if '#' in path else base + path + '?capture=1', wait_until='networkidle')
        pg.add_style_tag(content=CAPCSS); pg.evaluate(CURSOR); pg.wait_for_timeout(300)
        cdp.send('Animation.enable'); cdp.send('Animation.setPlaybackRate', {'playbackRate': state['rate']})
        state['sy'] = pg.evaluate('scrollY'); pg.mouse.move(state['mx'], state['my'])
        pg.evaluate("window.__cap=window.__cap||{caption(t){let c=document.querySelector('.cap');if(!t){c&&c.remove();return}if(!c){c=document.createElement('div');c.className='cap';document.body.append(c)}c.textContent=t},end(h){const d=document.createElement('div');d.className='endcard';d.innerHTML=h;document.body.append(d)}}")
    load('index.html'); pg.wait_for_function('window.__site && window.__site.ap', timeout=30000)
    def center(sel): return pg.evaluate(f"(()=>{{const b=document.querySelector({sel!r}).getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2]}})()")
    def top(sel, off=0): return pg.evaluate(f"(()=>{{const e=document.querySelector({sel!r});return Math.max(0,e.getBoundingClientRect().top+scrollY-{off})}})()")
    HDR = 'document.querySelector(".hdr").offsetHeight'
    segs = []; ev = {}
    def mouse(t0, t1, tgt): segs.append([t0, t1, 'm', tgt, None])
    def scroll(t0, t1, tgt): segs.append([t0, t1, 's', tgt, None])
    def at(t, fn): ev.setdefault(int(round(t * FPS)), []).append(fn)
    def cap(t): return lambda: pg.evaluate('t=>window.__cap.caption(t)', t)
    def click(): pg.mouse.click(state['mx'], state['my'])
    # 0-9 home hero + practice previews
    at(.6, cap('Asad Gulshair · AI Engineer'))
    mouse(.4, 2.6, lambda: center('#hero-media'))
    at(4.0, cap('Computer vision and AI agents for real operations'))
    mouse(3.6, 4.6, lambda: center('.practice a[data-cat=industrial]'))
    mouse(5.6, 6.3, lambda: center('.practice a[data-cat=agents]'))
    mouse(7.3, 8.0, lambda: center('.practice a[data-cat=agriculture]'))
    # 9-15 proof
    at(9.2, cap(None))
    mouse(8.8, 9.4, lambda: (W * .5, H * .62))
    scroll(9.2, 10.8, lambda: top('#work', pg.evaluate(HDR) + 24))
    at(10.9, cap('Real model output, labelled honestly'))
    scroll(12.4, 13.6, lambda: top('#proof .featured', pg.evaluate(HDR) + 40))
    mouse(13.0, 13.8, lambda: center('#proof .featured a[data-open]'))
    # 15-20 case study modal
    at(14.2, click); at(14.3, cap('Every project: problem → approach → result'))
    at(17.0, lambda: pg.evaluate("document.querySelector('.case-scroll').scrollTo({top:520,behavior:'auto'})"))
    at(18.6, lambda: pg.evaluate("document.querySelector('.case-scroll').scrollTo({top:900,behavior:'auto'})"))
    at(19.6, lambda: pg.keyboard.press('Escape')); at(19.6, cap(None))
    # 20-31 projects page
    at(20.4, lambda: load('projects.html#industrial')); at(20.5, cap('Industrial vision: detect, measure, count'))
    scroll(21.4, 22.8, lambda: top('#industrial .subf', 300))
    mouse(22.6, 23.3, lambda: center('#industrial .subf button[data-sub=measurement]'))
    at(23.5, click)
    mouse(24.3, 24.8, lambda: center('#industrial .subf button[data-sub=all]'))
    at(25.0, click)
    mouse(25.6, 26.2, lambda: center('#catlist a[data-cat=agents]'))
    at(26.3, cap('AI agents with guardrails'))
    scroll(26.3, 27.5, lambda: top('#agents', pg.evaluate(HDR + '+document.querySelector(".catnav").offsetHeight+24')))
    mouse(28.2, 28.8, lambda: center('#catlist a[data-cat=agriculture]'))
    at(28.9, cap('Agriculture, plus IEEE-published research'))
    scroll(28.9, 30.1, lambda: top('#agriculture', pg.evaluate(HDR + '+document.querySelector(".catnav").offsetHeight+24')))
    scroll(30.6, 32.0, lambda: top('#agriculture .grid3', 260))
    # 32-37 about
    at(32.4, lambda: load('about.html')); at(32.5, cap('Experience across manufacturing and media'))
    scroll(33.2, 35.6, lambda: top('#exp-h', 140))
    # 37-43.5 contact
    at(36.8, lambda: load('contact.html')); at(36.9, cap('Start a project or book a meeting'))
    mouse(37.6, 38.6, lambda: center('[data-copy-email]'))
    at(38.8, click)
    mouse(40.0, 40.9, lambda: center('.ccard [data-book]'))
    mouse(41.8, 42.6, lambda: center('.ccard [data-mail=project]'))
    at(43.4, cap(None))
    end = (f'<p class="meta" style="color:#E8743B">AI Engineer</p><h2>Asad Gulshair</h2><p class="lead" style="margin:0 auto;font-size:26px">Computer vision &amp; AI agents for real operations</p>'
           f'<p class="meta" style="color:#EDEBE6;font-size:16px;margin-top:18px">{SHOWN}</p><p class="meta" style="font-size:14px">github.com/asad-gulshair · asadgulshair6767@gmail.com</p>')
    at(43.5, lambda: pg.evaluate('h=>window.__cap.end(h)', end))
    t_start = time.time(); last_t = t_start
    for f in range(NF):
        t = f / FPS
        for fn in ev.get(f, []): fn()
        for s in segs:
            t0, t1, kind, tgt, res = s
            if t < t0 or t > t1 + 1 / FPS: continue
            if res is None:
                v = tgt(); s[4] = res = ((state['mx'], state['my']), v) if kind == 'm' else (state['sy'], v)
            k = eio(min(1, (t - t0) / (t1 - t0)))
            if kind == 'm':
                (ax, ay), (bx, by) = res; state['mx'] = ax + (bx - ax) * k; state['my'] = ay + (by - ay) * k - math.sin(k * math.pi) * 20
                pg.mouse.move(state['mx'], state['my'])
            else:
                a, bb = res; state['sy'] = max(0, a + (bb - a) * k); pg.evaluate(f'scrollTo(0,{state["sy"]})')
        pg.evaluate('window.__step && window.__step(1000/30)')
        pg.screenshot(path=f'{out}/f{f:05d}.jpg', type='jpeg', quality=93)
        if f % 15 == 0:
            nowt = time.time()
            if f: per = (nowt - last_t) / 15; state['rate'] = max(.02, min(1, (1000 / FPS) / (per * 1000))); cdp.send('Animation.setPlaybackRate', {'playbackRate': state['rate']})
            last_t = nowt
        if f % 150 == 0: print('frame', f, round(time.time() - t_start), 's', flush=True)
    b.close()
print('done')
