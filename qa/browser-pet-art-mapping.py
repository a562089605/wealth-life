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
  pets=[('柯基','dog',False,400),('银渐层','cat',True,430),('鳄鱼','crocodile',True,2380),('豹纹守宫','gecko',False,290),('捕鸟蛛','spider',False,170),('陆龟','tortoise',False,450),('变色龙','chameleon',False,570)]
  for species,key,insured,cost in pets:
   page.get_by_role('button',name='查看'+species,exact=True).click();page.get_by_role('button',name='下一步：取名与费用',exact=True).click()
   assert page.locator('.pet-adoption-painted').count()==1
   assert species in page.locator('#petAdoptionHero').inner_text()
   page.locator('#petAdoptionName').fill(species+'伙伴')
   if insured:page.locator('#petAdoptionInsurance').check()
   before=page.evaluate('state.cash')
   page.wait_for_function('document.querySelector("#petAdoptionHero img").naturalWidth>0')
   if key in ['cat','crocodile']:page.screenshot(path='qa/browser-evidence/pet-map-adoption-'+key+'.png',full_page=True)
   page.get_by_role('button',name='确认领养',exact=True).click();assert page.evaluate('state.cash')==before-cost
   assert page.locator('.pet-success-painted').count()==1
   page.get_by_role('button',name='查看我的宠物',exact=True).click()
   assert page.locator('.pet-owned-card').count()==pets.index((species,key,insured,cost))+1
   if key=='crocodile':
    page.get_by_role('button',name='鳄鱼伙伴 · 保险',exact=True).click();assert page.locator('.pet-policy-painted').count()==1
    assert '当前保障中' in page.locator('.pet-policy-hero').inner_text()
    assert 'pet-policy.webp' in page.locator('.pet-policy-hero img').get_attribute('src')
    page.screenshot(path='qa/browser-evidence/pet-map-policy.png',full_page=True)
    page.get_by_role('button',name='返回我的宠物',exact=True).click()
    assert page.evaluate('state.cash')==before-cost
    page.screenshot(path='qa/browser-evidence/pet-map-three-pets.png',full_page=True)
   if key!='chameleon':page.get_by_role('button',name='领养新伙伴',exact=True).click()
  assert page.evaluate('state.pets.length')==7
  page.evaluate('state.month=2;clearModals();townHome();roomOpenArrangement("pets")')
  page.get_by_role('button',name='鳄鱼伙伴 · 宠物日常照顾',exact=True).click()
  assert page.locator('.pet-reptile-scene').count()==3
  assert page.locator('.pet-clean-art').count()==0
  assert '栖息池' in page.locator('.pet-care-choices').inner_text()
  assert '自由时间减少 4 小时' in page.locator('.pet-care-choices').inner_text()
  page.wait_for_function('[...document.querySelectorAll(".pet-reptile-scene img")].every(i=>i.naturalWidth>0)')
  page.screenshot(path='qa/browser-evidence/pet-map-crocodile-cleaning.png',full_page=True)
  page.get_by_role('button',name='自行清洁',exact=True).click();page.get_by_role('button',name='确认选择',exact=True).click()
  assert page.locator('.pet-payment-painted').count()==1
  assert '鳄鱼' in page.locator('.pet-payment-portrait img').get_attribute('alt')
  page.get_by_role('button',name='返回日常照顾',exact=True).click();page.get_by_role('button',name='返回我的宠物',exact=True).click()
  # Explicit time fixture, no changed money/care dates on insufficient time.
  page.evaluate('state.petCareTime={month:state.month,hours:10000}')
  page.get_by_role('button',name='鳄鱼伙伴 · 自行清洁',exact=True).click()
  before=page.evaluate('JSON.stringify({cash:state.cash,pets:state.pets,time:state.petCareTime})')
  page.get_by_role('button',name='确认支付已选照顾',exact=True).click()
  assert page.locator('.pet-time-painted').count()==1
  assert page.get_by_role('button',name='确认本月宠物安排，返回房屋',exact=True).count()==0
  assert '4 小时' in page.locator('.pet-funds-panel').inner_text()
  assert page.evaluate('JSON.stringify({cash:state.cash,pets:state.pets,time:state.petCareTime})')==before
  page.wait_for_function('document.querySelector(".pet-funds-art img").naturalWidth>0');page.screenshot(path='qa/browser-evidence/pet-map-time-shortage.png',full_page=True)
  for width,height in [(320,568),(390,844),(1280,900)]:
   page.set_viewport_size({'width':width,'height':height});box=page.locator('.event-active').bounding_box();assert abs(box['y']+box['height']/2-height/2)<1
   assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  page.get_by_role('button',name='返回调整安排',exact=True).click();assert page.get_by_role('button',name='鳄鱼伙伴 · 自行清洁',exact=True).get_attribute('aria-pressed')=='true'
  assert not errors,errors
  print('PASS: all 7 actual adoption forms/charges/receipts and owned portraits; crocodile policy and cleaning original scenes; payment species; time-shortage draft/no-spend; 3 viewport centering; no errors')
  ctx.close();b.close()
finally:server.shutdown();server.server_close()
