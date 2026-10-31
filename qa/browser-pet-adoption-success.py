"""Two actually adopted pets, dynamic illustrated board, canonical batched care payment."""
import json
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Quiet);Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click();page.locator('#roomView [data-room="pets"]').click()
  for species,name,insured,cost in [('鳄鱼','小绿',True,2380),('柯基','豆豆',False,400)]:
   page.get_by_role('button',name='查看'+species,exact=True).click();page.get_by_role('button',name='下一步：取名与费用',exact=True).click();page.locator('#petAdoptionName').fill(name)
   if insured:page.locator('#petAdoptionInsurance').check()
   before=page.evaluate('state.cash');page.evaluate('() => {window.qaAdoptAgain=document.querySelector("#actions button").onclick}')
   page.get_by_role('button',name='确认领养',exact=True).click()
   assert page.locator('.pet-success-painted').count()==1
   assert page.evaluate('state.cash')==before-cost
   text=page.locator('.pet-success-board').inner_text();assert name in text
   assert ('宠物保险已生效' in text)==insured
   assert ('未购买宠物保险' in text)==(not insured)
   assert '$'+format(cost,',.2f') in text
   page.evaluate('window.qaAdoptAgain()');assert page.evaluate('state.cash')==before-cost
   page.wait_for_function('document.querySelector(".pet-success-art img").naturalWidth>0')
   page.screenshot(path='qa/browser-evidence/pet-success-'+('crocodile' if insured else 'dog')+'.png',full_page=True)
   for width,height in [(320,568),(390,844),(1280,900)]:
    page.set_viewport_size({'width':width,'height':height});box=page.locator('.event-active').bounding_box();assert abs(box['y']+box['height']/2-height/2)<1
    assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
   page.set_viewport_size({'width':390,'height':844});page.get_by_role('button',name='查看我的宠物',exact=True).click();assert page.locator('.pet-success-painted').count()==0
   if insured:page.get_by_role('button',name='领养新伙伴',exact=True).click()
  assert not errors,errors
  print('PASS: actual crocodile insured and dog uninsured adoption receipts, totals/balances, once-only payment, real hub link, centered 3 viewports; no page errors')
  ctx.close();b.close()
finally:server.shutdown();server.server_close()
