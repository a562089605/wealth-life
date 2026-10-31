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
  for species,name in [('柯基','豆豆'),('银渐层','银灰')]:
   page.get_by_role('button',name='查看'+species,exact=True).click();page.get_by_role('button',name='下一步：取名与费用',exact=True).click();page.locator('#petAdoptionName').fill(name);page.locator('#petAdoptionInsurance').check();page.get_by_role('button',name='确认领养',exact=True).click();page.get_by_role('button',name='查看我的宠物',exact=True).click()
   assert page.locator('.pet-owned-card').count()==(1 if name=='豆豆' else 2)
   if name=='豆豆':page.get_by_role('button',name='领养新伙伴',exact=True).click()
  assert page.evaluate('state.cash')==9140
  assert page.get_by_role('button',name='豆豆 · 自己洗澡',exact=True).is_disabled()
  # Only month is advanced as an explicit due-date fixture; these are real adopted pet records.
  page.evaluate('state.month=2;clearModals();townHome();roomOpenArrangement("pets")')
  page.get_by_role('button',name='豆豆 · 自己洗澡',exact=True).click();page.get_by_role('button',name='银灰 · 外出洗澡',exact=True).click()
  assert page.evaluate('state.cash')==9140
  assert page.locator('.pet-owned-methods [aria-pressed="true"]').count()==2
  assert '$370.00' in page.locator('.pet-owned-summary').inner_text()
  assert '$70.00' in page.locator('.pet-owned-summary').inner_text()
  page.wait_for_function('[...document.querySelectorAll(".pet-owned-portrait img")].every(i=>i.naturalWidth>0)')
  page.evaluate('document.getElementById("eventData").scrollTop=0')
  page.screenshot(path='qa/browser-evidence/pet-owned-reference.png',full_page=True)
  for width,height in [(320,568),(390,844),(1280,900)]:
   page.set_viewport_size({'width':width,'height':height});box=page.locator('.event-active').bounding_box()
   assert abs(box['y']+box['height']/2-height/2)<1
   assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  page.set_viewport_size({'width':390,'height':844});free=page.evaluate('currentCareerTime().free')
  page.evaluate('() => {window.qaPayCareAgain=document.querySelector("#actions button").onclick}')
  page.get_by_role('button',name='确认支付已选照顾',exact=True).click()
  assert page.locator('.pet-owned-painted').count()==1
  assert page.evaluate('state.cash')==9070 and page.evaluate('currentCareerTime().free')==free-3
  assert page.evaluate('state.pets[0].care.nextClean')==4 and page.evaluate('state.pets[1].care.nextClean')==5
  page.evaluate('window.qaPayCareAgain({preventDefault(){},stopPropagation(){}})');assert page.evaluate('state.cash')==9070
  assert '$370.00' in page.locator('.pet-owned-summary').inner_text()
  page.get_by_role('button',name='修改豆豆的名字',exact=True).click();page.get_by_role('textbox',name='宠物名字',exact=True).fill('球球');page.get_by_role('button',name='保存名字',exact=True).click()
  assert page.evaluate('state.pets[0].name')=='球球' and page.evaluate('state.pets[0].id')=='pet-1'
  assert page.evaluate('state.cash')==9070
  assert '球球' in page.locator('.pet-owned-card').first.inner_text()
  assert not errors,errors
  result={'passed':True,'checks':['原按钮实际领养柯基/银渐层，逐只手绘画像/名字/费用/独立保单正确，未到期不能选清洁','到期月fixture逐只选自己/外出，不扣款；本月养护合计370，本次清洁仅70','原合并照护支付只扣70/3h一次，不重复扣已付养护保费，分别延期2/3个月','更名免费且保留原ID/护理日期，320矮屏/390px/桌面居中无横向溢出'],'pageErrors':errors,'limitations':['到期月份为fixture，非自然长线','隔离Chromium，非真机；未穷举全部物种与旧档']}
  Path('qa/browser-evidence/pet-owned-hub.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));ctx.close();b.close()
finally:server.shutdown();server.server_close()
