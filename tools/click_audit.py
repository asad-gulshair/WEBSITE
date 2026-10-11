import asyncio, json, os, sys
CHROME="/usr/bin/google-chrome"  # system Chrome if present, else Playwright's bundled Chromium
from playwright.async_api import async_playwright
# usage: python tools/click_audit.py <base-url-ending-in-/> [out.json]
B=sys.argv[1] if len(sys.argv)>1 else "http://127.0.0.1:8000/"
PAGES=["index.html","projects.html","about.html","contact.html"]
SNAP="""()=>({url:location.href,y:Math.round(scrollY),dlg:!!document.querySelector('dialog[open]'),
 st:[...document.querySelectorAll('[aria-pressed],[aria-expanded],[aria-current]')].map(e=>e.getAttribute('aria-pressed')+e.getAttribute('aria-expanded')+e.getAttribute('aria-current')).join(','),
 hid:[...document.querySelectorAll('.card')].filter(c=>c.classList.contains('hide')).length, toast:!!document.querySelector('.toast.on'),
 copied:[...document.querySelectorAll('[data-copied]')].length, yt:document.querySelectorAll('iframe').length, focus:document.activeElement&&(document.activeElement.tagName+document.activeElement.id+(document.activeElement.textContent||'').slice(0,20))})"""
LIST="""()=>[...document.querySelectorAll('a,button,[role=button]')].map((e,i)=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
 return {i,tag:e.tagName,text:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,40),href:e.getAttribute('href'),target:e.target||'',
 vis:!!(r.width&&r.height)&&cs.visibility!=='hidden'&&!e.closest('[hidden]')&&!e.closest('.hide'),inMnav:!!e.closest('#mnav'),inHide:!!e.closest('.hide')}})"""
async def run(dev):
  res=[]; 
  async with async_playwright() as p:
    b=await p.chromium.launch(**({"executable_path":CHROME} if os.path.exists(CHROME) else {}),args=["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    mob=dev=='mobile'
    ctx=await b.new_context(viewport={"width":390,"height":844} if mob else {"width":1440,"height":900},is_mobile=mob,has_touch=mob,permissions=["clipboard-read","clipboard-write"])
    await ctx.route("**/*", lambda r: r.fulfill(status=200, body="<title>external ok</title>external") if not r.request.url.startswith(B) and r.request.resource_type=="document" else r.continue_())
    ctx.set_default_timeout(15000); ctx.set_default_navigation_timeout(15000)
    for pgname in PAGES:
      pg=await ctx.new_page(); errs=[]
      pg.on("pageerror",lambda e: errs.append("PE "+str(e))); pg.on("console",lambda m: m.type=="error" and "net::ERR" not in m.text and errs.append("CE "+m.text)); pg.on("response",lambda r: r.status>=400 and r.url.startswith(B) and errs.append(f"HTTP {r.status} {r.url}"))
      await pg.goto(B+pgname); await pg.wait_for_timeout(1200)
      items=await pg.evaluate(LIST)
      for it in items:
        if it['text']=='Skip to content':
          await pg.goto(B+pgname,wait_until='domcontentloaded'); await pg.wait_for_timeout(500); await pg.keyboard.press('Tab')
          f=await pg.evaluate("document.activeElement.className"); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(400)
          u=await pg.evaluate("location.hash"); res.append(dict(dev=dev,page=pgname,**it,ok=(f=='skip' and u=='#main'),why=f'first Tab focuses {f}; Enter -> {u}')); continue
        if it['href'] in ('#',''): res.append(dict(dev=dev,page=pgname,**it,ok=False,why='DEAD # link')); continue
        await pg.goto(B+pgname,wait_until='domcontentloaded'); await pg.wait_for_timeout(700)
        if it['inMnav']:
          if not mob: continue
          await pg.click('.menu-btn'); await pg.wait_for_timeout(200)
        if it['inHide']:
          sa=await pg.query_selector('[data-showall]')
          if sa: await sa.click(); await pg.wait_for_timeout(200)
        el=(await pg.query_selector_all('a,button,[role=button]'))[it['i']]
        if not await el.is_visible(): res.append(dict(dev=dev,page=pgname,**it,ok=None,why='not visible on this device')); continue
        await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(150)
        before=await pg.evaluate(SNAP); errs.clear(); popup=None; why=''
        href=it['href'] or ''
        try:
          if href.startswith('mailto:'):
            ok='asadgulshair6767@gmail.com' in href and ('subject=' in href or it['text'] in ('asadgulshair6767@gmail.com',) or href=='mailto:asadgulshair6767@gmail.com')
            # click must not throw and must not navigate away
            await el.click(timeout=3000); await pg.wait_for_timeout(300)
            why='mailto '+href[:70]
          elif it['target']=='_blank':
            async with pg.expect_popup(timeout=5000) as pi: await el.click(timeout=3000)
            popup=await pi.value
            try: await popup.wait_for_load_state('domcontentloaded',timeout=5000)
            except Exception: pass
            why='opens '+popup.url[:80]; ok=popup.url.startswith('http') and popup.url.rstrip('/')==href.rstrip('/'); await popup.close()
          else:
            await el.click(timeout=3000); await pg.wait_for_timeout(1300)
            after=await pg.evaluate(SNAP)
            ch=[k for k in before if before[k]!=after[k]]
            pressed_before=await pg.evaluate("i=>{const e=[...document.querySelectorAll('a,button,[role=button]')][i];return e.getAttribute('aria-pressed')}", it['i'])
            ok=bool(ch) or pressed_before=='true'; why=('already active (no-op by design) ' if not ch and pressed_before=='true' else '')+'changed: '+','.join(ch) + (' -> '+after['url'].replace(B,'') if 'url' in ch else '')
        except Exception as e:
          ok=False; why='ERR '+str(e)[:100]
        if errs: ok=False; why+=' | errors: '+'; '.join(errs[:2])
        res.append(dict(dev=dev,page=pgname,**it,ok=ok,why=why)); print(dev,pgname,it['i'],it['text'][:20],ok,why[:80],flush=True)
      await pg.close()
    # modal pass (projects page)
    pg=await ctx.new_page(); errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
    await pg.goto(B+"projects.html"); await pg.wait_for_timeout(1000)
    slugs=await pg.evaluate("[...document.querySelectorAll('[data-open]')].map(a=>a.dataset.open)")
    for s in dict.fromkeys(slugs):
      await pg.goto(B+"projects.html"); await pg.wait_for_timeout(600)
      a=await pg.query_selector(f'.card-open[data-open="{s}"], .featured a[data-open="{s}"]')
      if not await a.is_visible():
        sa=await pg.query_selector('[data-showall]'); await sa.click(); await pg.wait_for_timeout(200)
      await a.scroll_into_view_if_needed(); y0=await pg.evaluate("scrollY"); await a.click(); await pg.wait_for_timeout(500)
      o=await pg.evaluate("({open:!!document.querySelector('dialog[open]'),h:location.hash,t:document.querySelector('#case-title')?.textContent})")
      # close via each method in rotation
      meth=['button','escape','back','backdrop'][len(res)%4]
      if mob and meth=='backdrop': meth='button'
      if meth=='button': await pg.click('.case-x')
      elif meth=='escape': await pg.keyboard.press('Escape')
      elif meth=='back': await pg.go_back()
      else: await pg.mouse.click(5,400)
      await pg.wait_for_timeout(500)
      c=await pg.evaluate("({open:!!document.querySelector('dialog[open]'),h:location.hash,y:scrollY})")
      ok=o['open'] and o['h']==f'#/work/{s}' and not c['open'] and abs(c['y']-y0)<2 and not c['h'].startswith('#/work')
      res.append(dict(dev=dev,page='projects.html (modal)',text=s,ok=ok,why=f"open={o['open']} hash={o['h']} close-by={meth} closed={not c['open']} scroll-restored={abs(c['y']-y0)<2} {errs[:1]}"))
    # modal inner controls: prev/next, YouTube facade, links
    await pg.goto(B+"projects.html#/work/flange-dimension-compliance"); await pg.wait_for_timeout(1500)
    t1=await pg.evaluate("document.querySelector('#case-title')?.textContent")
    await pg.click('.pn button:last-child'); await pg.wait_for_timeout(300)
    t2=await pg.evaluate("[document.querySelector('#case-title')?.textContent,location.hash]")
    res.append(dict(dev=dev,page='projects.html (modal)',text='deep link + next →',ok=bool(t1) and t2[0]!=t1 and t2[1].startswith('#/work/'),why=f'{t1} -> {t2}'))
    await pg.click('.pn button:first-child'); await pg.wait_for_timeout(300)
    t3=await pg.evaluate("document.querySelector('#case-title')?.textContent")
    res.append(dict(dev=dev,page='projects.html (modal)',text='← previous',ok=t3==t1,why=f'back to {t3}'))
    yb=await pg.query_selector('dialog button.yt'); await yb.scroll_into_view_if_needed(); await yb.click(); await pg.wait_for_timeout(500)
    n=await pg.evaluate("document.querySelectorAll('dialog iframe[src*=\"youtube-nocookie\"]').length")
    res.append(dict(dev=dev,page='projects.html (modal)',text='Watch demo (YouTube facade)',ok=n==1,why=f'iframes={n}'))
    links=await pg.evaluate("[...document.querySelectorAll('dialog .links a')].map(a=>a.href)")
    res.append(dict(dev=dev,page='projects.html (modal)',text='modal links',ok=all(l.startswith(('http','mailto')) for l in links),why=' | '.join(l[:60] for l in links)))
    # category nav: hash deep link, back/forward
    await pg.goto(B+"projects.html#agents"); await pg.wait_for_timeout(1500)
    r=await pg.evaluate("({top:document.getElementById('agents').getBoundingClientRect().top,off:document.querySelector('.hdr').offsetHeight+document.querySelector('.catnav').offsetHeight+24,cur:document.querySelector('#catlist a[aria-current]')?.dataset.cat})")
    res.append(dict(dev=dev,page='projects.html (nav)',text='deep link #agents',ok=abs(r['top']-r['off'])<=10 and r['cur']=='agents',why=str(r)))
    await pg.click('#catlist a[data-cat=agriculture]'); await pg.wait_for_timeout(1500)
    await pg.click('#catlist a[data-cat=industrial]'); await pg.wait_for_timeout(1500)
    await pg.go_back(); await pg.wait_for_timeout(1500)
    r=await pg.evaluate("({h:location.hash,top:Math.round(document.getElementById('agriculture').getBoundingClientRect().top),cur:document.querySelector('#catlist a[aria-current]')?.dataset.cat})")
    res.append(dict(dev=dev,page='projects.html (nav)',text='Back after 2 category clicks',ok=r['h']=='#agriculture' and r['cur']=='agriculture',why=str(r)))
    await pg.go_forward(); await pg.wait_for_timeout(1500)
    r=await pg.evaluate("({h:location.hash,cur:document.querySelector('#catlist a[aria-current]')?.dataset.cat})")
    res.append(dict(dev=dev,page='projects.html (nav)',text='Forward',ok=r['h']=='#industrial' and r['cur']=='industrial',why=str(r)))
    await b.close()
  return res
async def main():
  allr=[]
  for d in ['desktop','mobile']: allr+=await run(d)
  json.dump(allr,open(sys.argv[2] if len(sys.argv)>2 else 'click_audit.json','w'),indent=1)
  bad=[r for r in allr if r['ok'] is False]
  print('total',len(allr),'pass',sum(1 for r in allr if r['ok']),'fail',len(bad),'skipped',sum(1 for r in allr if r['ok'] is None))
  for r in bad: print('FAIL',r['dev'],r['page'],r.get('text'),r.get('href'),r['why'])
asyncio.run(main())
