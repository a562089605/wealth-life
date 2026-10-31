from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Quiet);Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click()
  def snap():return page.evaluate('JSON.stringify({cash:state.cash,energy:state.energy,stress:state.stress,health:state.health,happiness:state.happiness,free:currentCareerTime().free,month:state.month,ledger:state.financeLedger,payments:state.monthlyPayments,checks:state.roomArrangements})')
  before=snap();page.locator('#roomView [data-room="life"]').click();page.wait_for_function('document.querySelector(".life-hub-scene img")?.naturalWidth>0')
  assert page.locator('.life-hub-option').count()==5
  assert snap()==before
  assert '$800.00' in page.locator('.life-hub-month').inner_text()
  assert '待确认事项' in page.locator('.life-hub-month').inner_text()
  page.screenshot(path='qa/browser-evidence/life-hub-painted.png',full_page=True)
  for width,height in [(320,568),(390,844),(1280,900)]:
   page.set_viewport_size({'width':width,'height':height});box=page.locator('.event-active').bounding_box();assert abs(box['y']+box['height']/2-height/2)<1
   assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  page.set_viewport_size({'width':390,'height':844})
  for label in ['住房','基本生活费','保险','本月必要安排','可选生活活动']:
   page.evaluate('clearModals();roomOpenArrangement("life")');before=snap();page.get_by_role('button',name=label,exact=True).click()
   assert page.locator('.life-hub-painted').count()==0
   assert page.locator('#eventTitle').inner_text()!='本月生活安排'
   assert snap()==before,label
  page.evaluate('clearModals();roomOpenArrangement("life")');page.get_by_role('button',name='确认本月生活安排，返回房屋',exact=True).click();assert not page.evaluate('roomChecks().life?.confirmed');assert page.locator('#eventTitle').inner_text()=='出门前完成本月必要事项'
  # Complete the original housing and living payments; the illustrated menu itself never pays.
  page.evaluate('clearModals();roomOpenArrangement("life")');page.get_by_role('button',name='住房',exact=True).click();page.locator('#eventData [data-housing-preview][data-key="family"]').click();page.get_by_role('button',name='确认住房付款',exact=True).click()
  page.evaluate('clearModals();roomOpenArrangement("life")');page.get_by_role('button',name='基本生活费',exact=True).click();page.locator('#eventData [data-v26="living"]').click()
  page.evaluate('clearModals();roomOpenArrangement("life")');assert page.evaluate('state.cash')==8750
  assert '本月必要事项已完成' in page.locator('.life-hub-month').inner_text()
  page.get_by_role('button',name='确认本月生活安排，返回房屋',exact=True).click();assert page.evaluate('roomChecks().life.confirmed') is True
  assert page.locator('#roomView').is_visible() and page.evaluate('state.cash')==8750
  assert not errors,errors
  result={'passed':True,'checks':['new illustrated life board loads, real cash/pending costs; browsing no spend/state/time/check changes','all five original controls navigate and remove life-only styling','320/390/desktop centered and no horizontal overflow','unpaid required items prevent monthly life acknowledgement','actual original family450/living800 payment, updated summary and explicit monthly check; no duplicate debit'],'pageErrors':errors,'limitations':['isolated Chromium, not real device','new save, not full legacy/multi-month coverage']};Path('qa/browser-evidence/life-hub-art.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));ctx.close();b.close()
finally:server.shutdown();server.server_close()
