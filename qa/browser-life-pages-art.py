from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a): pass

server=ThreadingHTTPServer(('127.0.0.1',0),Quiet)
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
  page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click()
  page.evaluate('window.lifeFixture=structuredClone(state)')
  def reset():page.evaluate('clearModals();state=structuredClone(lifeFixture);townHome();roomOpenArrangement("life")')
  def snapshot():return page.evaluate('JSON.stringify({cash:state.cash,month:state.month,stats:Object.fromEntries(Object.keys(V26_STATS).map(k=>[k,state[k]])),free:currentCareerTime().free,choices:state.monthChoices,ledger:state.financeLedger,checks:state.roomArrangements})')
  def capture(name):
   page.screenshot(path=f'progress/evidence/{name}-2026-10-26.png',full_page=True)
  def layout():
   for w,h in [(320,568),(390,844),(1280,900)]:
    page.set_viewport_size({'width':w,'height':h});box=page.locator('.event-active').bounding_box()
    assert abs(box['y']+box['height']/2-h/2)<2,(w,h,box)
    assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth'),(w,h)
   page.set_viewport_size({'width':390,'height':844})
  reset();before=snapshot();page.get_by_role('button',name='本月必要安排',exact=True).click()
  assert snapshot()==before
  assert page.locator('.life-bill-item').count()==2
  assert '待确认事项' in page.locator('.life-paper').inner_text()
  capture('life-required');layout()
  # All original bill buttons keep working, with their original payment confirmation.
  page.get_by_role('button',name='选择住房',exact=True).click()
  page.locator('#eventData [data-housing-preview][data-key="family"]').click()
  page.get_by_role('button',name='确认住房付款',exact=True).click()
  page.evaluate('openNecessaryBills()');page.get_by_role('button',name='基本生活及日常养护',exact=True).click()
  page.locator('#eventData [data-v26="living"]').click();page.evaluate('openNecessaryBills()')
  assert page.evaluate('state.cash')==8750
  assert page.locator('.life-bill-item').count()==0
  assert '本月必要事项已完成' in page.locator('.life-paper').inner_text();capture('life-required-complete')
  results=[]
  for i in range(9):
   reset();page.evaluate('Math.random=()=>.99');before=snapshot();page.get_by_role('button',name='可选生活活动',exact=True).click()
   assert page.locator('.life-activity-card').count()==9
   assert snapshot()==before
   if i==0:capture('life-activities');layout()
   page.locator('.life-activity-card').nth(i).click();assert snapshot()==before
   expected=page.evaluate(f'V26_LIFE[{i}]');prior=page.evaluate('Object.fromEntries(Object.keys(V26_STATS).map(k=>[k,state[k]||0]))')
   page.evaluate('()=>{window.savedLifeConfirm=[...document.querySelector(".event-active").querySelectorAll("button")].find(b=>b.textContent.startsWith("确认安排" )).onclick}')
   capture('life-preview-'+str(i+1))
   if i==0:capture('life-activity-preview');layout()
   free=page.evaluate('currentCareerTime().free')
   page.get_by_role('button',name='确认安排 · ',exact=False).click()
   assert page.evaluate('monthSelection("life")')==expected['name']
   assert page.evaluate('state.cash')==10000-expected['cost']
   assert page.evaluate('currentCareerTime().free')==free
   for k,v in expected['effects'].items():assert page.evaluate(f'state.{k}')==min(100,max(0,prior[k]+v)),(i,k)
   after=snapshot();page.evaluate('savedLifeConfirm({preventDefault(){},stopPropagation(){}})');assert snapshot()==after
   page.evaluate('$("lifestyleBtn").click()');assert page.locator('#eventTitle').inner_text()=='本月生活已安排';assert snapshot()==after
   if i==0:capture('life-activity-result');layout()
   page.evaluate('window.savedLifeState=JSON.stringify(state);state=JSON.parse(savedLifeState);$("lifestyleBtn").click()');assert snapshot()==after
   results.append(expected['name'])
  # Genuine original social follow-up stays open, rather than being replaced by the receipt.
  reset();page.evaluate('Math.random=()=>0');page.get_by_role('button',name='可选生活活动',exact=True).click();page.locator('.life-activity-card').nth(2).click();page.get_by_role('button',name='确认安排 · ',exact=False).click()
  assert page.locator('#eventTitle').inner_text()=='朋友介绍小订单'
  assert page.evaluate('state.cash')==9915
  page.get_by_role('button',name='这次不参加',exact=True).click();page.evaluate('$("lifestyleBtn").click()');assert page.locator('#eventTitle').inner_text()=='本月生活已安排'
  # Low cash preview does not spend. Funding preserves the quote and returns to explicit confirmation.
  reset();page.evaluate('state.cash=10;$("lifestyleBtn").click()');page.locator('.life-activity-card').nth(0).click()
  assert page.get_by_role('button',name='确认安排 · ',exact=False).is_disabled()
  page.get_by_role('button',name='查看筹款方式',exact=True).click()
  assert page.locator('#eventTitle').inner_text()=='处理当前资金缺口'
  assert '$15.00' in page.locator('.life-paper').inner_text();assert page.evaluate('state.cash')==10
  capture('life-funding');layout()
  assert page.get_by_role('button',name='返回付款',exact=True).is_disabled()
  page.get_by_role('button',name='申请借款',exact=True).click()
  assert page.locator('#wlLoanAmount').input_value()=='15'
  page.get_by_role('button',name='确认贷款',exact=True).click()
  assert page.evaluate('state.cash')==25 and page.evaluate('calcMetrics().nw')==10
  page.get_by_role('button',name='返回付款',exact=True).click()
  assert page.locator('#eventTitle').inner_text()=='确认生活安排'
  assert page.evaluate('state.cash')==25 and page.evaluate('monthSelection("life")') is None
  page.get_by_role('button',name='确认安排 · ',exact=False).click();assert page.evaluate('state.cash')==0
  # A stale detached callback or a month/owner change cannot execute a prior quote.
  reset();page.evaluate('$("lifestyleBtn").click()');page.locator('.life-activity-card').nth(0).click()
  page.evaluate('window.staleLife=[...document.querySelector(".event-active").querySelectorAll("button")].find(b=>b.textContent.startsWith("确认安排")).onclick;state=structuredClone(state)')
  before=snapshot();page.evaluate('staleLife({preventDefault(){},stopPropagation(){}})');assert snapshot()==before
  reset();page.evaluate('$("lifestyleBtn").click()');page.locator('.life-activity-card').nth(0).click()
  page.evaluate('state.cash=9000');page.get_by_role('button',name='确认安排 · ',exact=False).click();assert page.evaluate('state.cash')==9000 and page.evaluate('monthSelection("life")') is None
  page.get_by_role('button',name='确认安排 · ',exact=False).click();assert page.evaluate('state.cash')==8975
  # Saturation changes the receipt to the actual delta, without changing original effects.
  reset();page.evaluate('state.health=99;$("lifestyleBtn").click()');page.locator('.life-activity-card').nth(0).click();page.get_by_role('button',name='确认安排 · ',exact=False).click();assert page.evaluate('state.health')==100 and page.evaluate('state.lifeArtReceipt.deltas.health')==1
  # Recovery and critically low health must retain the treatment route.
  reset();page.evaluate('state.health=20;$("lifestyleBtn").click()');assert page.locator('.life-activity-card').count()==0;assert page.evaluate('state.cash')==10000
  reset();page.evaluate('state.health=10;openNecessaryBills()');assert page.locator('.life-bill-item').count()==0
  assert not errors,errors
  result={'passed':True,'activities':results,'checks':['required bill originals/payments and completion','all nine previews without spend; original costs, bounded effects, monthly limit, saved receipt; no new hours','duplicate, stale owner, changed quote and reload protection','original random social follow-up preserved','funding quote, no auto payment, return to explicit confirmation','medical/recovery redirects','320/390/desktop centering and no horizontal overflow'],'pageErrors':errors,'limitations':['isolated Chromium, not a real phone','fixture reload tested; no full multi-year validation']}
  Path('qa/browser-evidence/life-pages-art.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
  context.close()
  context=browser.new_context(viewport={'width':390,'height':844});page=context.new_page()
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.evaluate('navigator.serviceWorker.ready');page.reload(wait_until='networkidle');page.wait_for_function('navigator.serviceWorker.controller!==null')
  assert page.evaluate('caches.keys()')==['wealth-life-v28.3-phone-time1']
  context.set_offline(True);page.reload(wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click()
  page.evaluate('roomOpenArrangement("life");$("lifestyleBtn").click()');assert page.locator('.life-activity-card').count()==9
  assert page.evaluate('new Promise((resolve,reject)=>{const i=new Image;i.onload=()=>resolve(i.naturalWidth);i.onerror=reject;i.src="assets/career/life-activities.webp"})')>0
  page.evaluate('showFundingOptions(20000,openRoomLife)');assert page.locator('.life-funding-scene img').evaluate('(i)=>i.complete&&i.naturalWidth>0')
  result['checks'].append('real service worker installation, offline reload and both new illustrations available')
  Path('qa/browser-evidence/life-pages-art.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
  print('PASS offline installed service worker and both images')
  context.close();browser.close()
finally:server.shutdown();server.server_close()
