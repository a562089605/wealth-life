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
  page.get_by_role('button',name='下一步：取名与费用',exact=True).click();page.locator('#petAdoptionName').fill('豆豆');page.get_by_role('button',name='确认领养',exact=True).click();page.get_by_role('button',name='查看我的宠物',exact=True).click()
  page.evaluate('state.month=2;state.cash=20;clearModals();townHome();roomOpenArrangement("pets")')
  page.get_by_role('button',name='豆豆 · 外出洗澡',exact=True).click()
  before=page.evaluate('JSON.stringify({cash:state.cash,pets:state.pets,loans:state.loans,time:state.petCareTime})')
  page.get_by_role('button',name='确认支付已选照顾',exact=True).click()
  assert page.locator('.pet-funds-painted').count()==1
  assert page.evaluate('JSON.stringify({cash:state.cash,pets:state.pets,loans:state.loans,time:state.petCareTime})')==before
  text=page.locator('.pet-funds-panel').inner_text();assert all(x in text for x in ['$20.00','$60.00','$40.00','尚未扣款'])
  page.wait_for_function('document.querySelector(".pet-funds-art img").naturalWidth>0')
  page.screenshot(path='qa/browser-evidence/pet-funds-shortage.png',full_page=True)
  for width,height in [(320,568),(390,844),(1280,900)]:
   page.set_viewport_size({'width':width,'height':height});box=page.locator('.event-active').bounding_box();assert abs(box['y']+box['height']/2-height/2)<1
   assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  page.set_viewport_size({'width':390,'height':844});page.get_by_role('button',name='返回调整安排',exact=True).click()
  assert page.get_by_role('button',name='豆豆 · 外出洗澡',exact=True).get_attribute('aria-pressed')=='true'
  # The per-pet detail confirmation also reaches this card, retaining the chosen method.
  page.get_by_role('button',name='宠物日常照顾',exact=True).click();page.get_by_role('button',name='确认选择',exact=True).click();page.get_by_role('button',name='确认外出洗澡',exact=True).click()
  assert page.locator('.pet-funds-painted').count()==1
  page.get_by_role('button',name='前往银行借贷',exact=True).click();assert page.locator('#wlLoanAmount').input_value()=='40';assert page.evaluate('state.cash')==20
  page.get_by_role('button',name='取消',exact=True).click();assert page.evaluate('state.cash')==20
  assert page.get_by_role('button',name='豆豆 · 外出洗澡',exact=True).get_attribute('aria-pressed')=='true'
  page.get_by_role('button',name='确认支付已选照顾',exact=True).click();page.get_by_role('button',name='前往银行借贷',exact=True).click();page.get_by_role('button',name='确认贷款',exact=True).click()
  assert page.evaluate('state.cash')==60 and page.evaluate('state.pets[0].care.nextClean')==2
  assert page.evaluate('state.loans.at(-1).principal')==40
  page.get_by_role('button',name='确认支付已选照顾',exact=True).click();assert page.evaluate('state.cash')==0 and page.evaluate('state.pets[0].care.nextClean')==5
  assert not errors,errors
  print('PASS: cash shortage 20/60/40, preserved selection/no spend, detail and hub entrances, bank recommendation/cancel/confirmed loan, separate explicit care payment, centered 3 viewports, no errors')
  ctx.close();b.close()
finally:server.shutdown();server.server_close()
