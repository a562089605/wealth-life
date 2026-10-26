"""Illustrated corgi form, real controls/quote/transaction in an isolated test save."""
import json
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),QuietHandler)
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
  page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click()
  page.locator('#roomView [data-room="pets"]').click();page.get_by_role('button',name='查看柯基',exact=True).click();page.get_by_role('button',name='下一步：取名与费用',exact=True).click()
  page.wait_for_function('document.querySelector("#petAdoptionHero img")?.naturalWidth>0')
  assert page.get_by_role('button',name='确认领养',exact=True).is_disabled()
  assert page.locator('.pet-quote-total dd').inner_text()=='$400.00'
  assert page.locator('.pet-quote-balance dd').inner_text()=='$9,600.00'
  assert page.evaluate('state.cash')==10000 and page.evaluate('state.pets.length')==0
  page.screenshot(path='qa/browser-evidence/corgi-adoption-painted.png',full_page=True)
  for width,height in [(320,568),(390,844),(1280,900)]:
   page.set_viewport_size({'width':width,'height':height});box=page.locator('.event-active').bounding_box()
   assert abs(box['y']+box['height']/2-height/2)<1
   assert abs(box['x']+box['width']/2-width/2)<1
   assert box['y']>=19 and box['y']+box['height']<=height-19,(width,height,box)
   assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  page.set_viewport_size({'width':390,'height':844})
  page.locator('#petAdoptionName').fill('豆豆');page.locator('#petAdoptionInsurance').check()
  assert page.locator('.pet-quote-total dd').inner_text()=='$430.00'
  assert page.locator('.pet-quote-balance dd').inner_text()=='$9,570.00'
  assert page.evaluate('state.cash')==10000 and page.evaluate('state.pets.length')==0
  page.evaluate('() => {window.qaAdoptAgain=document.querySelector("#actions button").onclick}')
  page.get_by_role('button',name='确认领养',exact=True).click()
  assert page.evaluate('state.cash')==9570 and page.evaluate('state.pets.length')==1
  assert page.evaluate('state.pets[0].name')=='豆豆'
  page.evaluate('window.qaAdoptAgain({preventDefault(){},stopPropagation(){}})')
  assert page.evaluate('state.cash')==9570 and page.evaluate('state.pets.length')==1
  assert page.locator('.pet-adoption-painted').count()==0 and page.locator('#petAdoptionHero').count()==0
  assert not errors,errors
  result={'passed':True,'checks':['柯基原图局部加载，空名字禁用确认，真实首月400/余额9600','320矮屏/390px/桌面卡片居中、保留边距且无横向溢出','取名和保险控件沿原节点工作，勾保险总额430/余额9570，预览不扣款','隔离存档实际确认领养只扣430一次，姓名/独立宠物保存；结果页无样式残留'],'pageErrors':errors,'limitations':['隔离Chromium，非真机','本轮只美化柯基表单，其他物种未改样式']}
  Path('qa/browser-evidence/corgi-adoption-art.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));ctx.close();b.close()
finally:server.shutdown();server.server_close()
