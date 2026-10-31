"""Two care choices reuse canonical due-date payments; fixture months are explicit."""
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
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
  page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click()
  page.locator('#roomView [data-room="pets"]').click();page.get_by_role('button',name='查看银渐层',exact=True).click();page.get_by_role('button',name='下一步：取名与费用',exact=True).click();page.locator('#petAdoptionName').fill('小银');page.get_by_role('button',name='确认领养',exact=True).click()
  page.get_by_role('button',name='查看我的宠物',exact=True).click();page.get_by_role('button',name='宠物日常照顾',exact=True).click()
  assert page.locator('.pet-care-square').count()==2
  assert '首次清洁已包含' in page.locator('.pet-care-pet').inner_text()
  assert '2个月' in page.get_by_role('button',name='自己洗澡',exact=True).inner_text().replace(' ','')
  assert '3个月' in page.get_by_role('button',name='外出洗澡',exact=True).inner_text().replace(' ','')
  page.wait_for_function('[...document.querySelectorAll(".pet-cat-cleaning-scene img")].length===2&&[...document.querySelectorAll(".pet-cat-cleaning-scene img")].every(i=>i.naturalWidth>0)')
  assert page.locator('.pet-care-square .pet-clean-icon').count()==0
  page.set_viewport_size({'width':390,'height':1000})
  page.screenshot(path='qa/browser-evidence/pet-cat-cleaning-scenes.png',full_page=True)
  for width,height in [(320,568),(390,844),(1280,900)]:
   page.set_viewport_size({'width':width,'height':height});box=page.locator('.event-active').bounding_box()
   assert abs(box['y']+box['height']/2-height/2)<1
   assert abs(box['x']+box['width']/2-width/2)<1
   assert box['y']>=19 and box['y']+box['height']<=height-19
   assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  page.set_viewport_size({'width':390,'height':844})
  page.get_by_role('button',name='自己洗澡',exact=True).click();page.get_by_role('button',name='确认选择',exact=True).click();assert page.get_by_role('button',name='确认自己洗澡',exact=True).is_disabled()
  assert page.evaluate('state.cash')==9600 and page.evaluate('state.pets[0].care.nextClean')==2
  # Jump to the first actual clean due month in this isolated test save, not a natural long playthrough.
  page.evaluate('state.month=2;clearModals();openPetCare();window.careDueFixture=JSON.stringify(state)')
  before=page.evaluate('currentCareerTime().free')
  page.get_by_role('button',name='自己洗澡',exact=True).click();page.get_by_role('button',name='确认选择',exact=True).click()
  page.evaluate('() => {window.qaCareAgain=document.querySelector("#actions button").onclick}')
  page.get_by_role('button',name='确认自己洗澡',exact=True).click()
  assert page.evaluate('state.cash')==9590 and page.evaluate('currentCareerTime().free')==before-2
  assert page.evaluate('state.pets[0].care.nextClean')==4
  page.evaluate('window.qaCareAgain({preventDefault(){},stopPropagation(){}})')
  assert page.evaluate('state.cash')==9590
  page.evaluate('state=JSON.parse(window.careDueFixture);clearModals();openPetCare()')
  before=page.evaluate('currentCareerTime().free')
  page.get_by_role('button',name='外出洗澡',exact=True).click();page.get_by_role('button',name='确认选择',exact=True).click();page.get_by_role('button',name='确认外出洗澡',exact=True).click()
  assert page.evaluate('state.cash')==9540 and page.evaluate('currentCareerTime().free')==before-1
  assert page.evaluate('state.pets[0].care.nextClean')==5
  assert not errors,errors
  result={'passed':True,'checks':['原真实领养后显示两张纵向插画选项与选中汇总，首次包含与下次时间明确，未到期无法提前扣款','320矮屏/390px/桌面卡片居中、保留边距且无横向溢出','到期月份fixture：自己洗10/2h并延后2月，重复回调不重扣','同一到期fixture：外出洗60/1h并延后3月，沿原账本/日期更新'],'pageErrors':errors,'limitations':['隔离Chromium，非真机','清洁到期月份用fixture；不是自然长期试玩','年度体检/康复/全部物种仍沿原规则，未穷举全部UI组合']}
  Path('qa/browser-evidence/pet-cat-cleaning-scenes.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));ctx.close();b.close()
finally:server.shutdown();server.server_close()
