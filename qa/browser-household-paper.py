from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),Quiet);Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{s.server_port}',wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click();page.evaluate('window.paperFixture=structuredClone(state)')
  def reset(extra=''):page.evaluate('(x)=>{clearModals();state=structuredClone(paperFixture);townHome();if(x)eval(x);roomOpenArrangement("life")}',extra)
  def snap():return page.evaluate('JSON.stringify({cash:state.cash,month:state.month,health:state.health,energy:state.energy,stress:state.stress,housing:state.housing,lease:state.housingLease,ledger:state.financeLedger,payments:state.monthlyPayments,free:currentCareerTime().free,checks:state.roomArrangements})')
  def shot(name):page.screenshot(path='progress/evidence/'+name+'-2026-10-26.png',full_page=True)
  def layout():
   for w,h in [(320,568),(390,844),(1280,900)]:
    page.set_viewport_size({'width':w,'height':h});box=page.locator('.event-active').bounding_box();assert abs(box['y']+box['height']/2-h/2)<2,(w,h,box);assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth'),(w,h)
   page.set_viewport_size({'width':390,'height':844})
  reset();before=snap();page.get_by_role('button',name='住房',exact=True).click();assert snap()==before;assert page.locator('.household-option').count()==4;assert page.locator('.household-option > img').count()==4
  shot('housing-painted');layout()
  for key in ['family','shared','studio','rent1']:
   page.evaluate('openHousing()');before=snap();page.locator('#eventData [data-housing-preview][data-key="'+key+'"]').click();assert snap()==before;assert page.locator('.household-painted').count()==1
   if key=='shared':shot('housing-payment-painted');layout()
  # The original button and delegate are embedded into the scene and remain the sole payment path.
  reset();before=snap();page.get_by_role('button',name='基本生活费',exact=True).click();assert snap()==before
  assert page.locator('.living-painted-scene [data-v26="living"]').is_visible();page.wait_for_function('document.querySelector(".living-painted-scene>img")?.naturalWidth>0');shot('living-cost-painted');layout()
  box=page.locator('.living-painted-scene [data-v26="living"]').bounding_box();assert box['y']>=0 and box['y']+box['height']<=844
  page.locator('.living-painted-scene [data-v26="living"]').click();assert page.evaluate('state.cash')==9200;assert page.evaluate('paymentReceipt().living')==800
  page.evaluate('openTownLiving()');assert '已付清' in page.locator('.household-total').inner_text();shot('living-paid-painted');before=snap();page.locator('.living-painted-scene [data-v26="living"]').click();assert snap()==before
  reset('state.cash=100');page.get_by_role('button',name='基本生活费',exact=True).click();assert page.locator('.living-painted-scene [data-v26="living"]').is_disabled();assert page.locator('#actions [data-town="livingFund"]').is_visible();shot('living-insufficient-painted')
  # The embedded control remains a clickable real button as the whole illustration scales.
  for w,h in [(320,568),(390,844),(1280,900)]:
   page.set_viewport_size({'width':w,'height':h});reset();page.get_by_role('button',name='基本生活费',exact=True).click();pay=page.locator('.living-painted-scene button[data-v26="living"]');pay.scroll_into_view_if_needed();pay.click();assert page.evaluate('state.cash')==9200
  page.set_viewport_size({'width':390,'height':844})
  # Rest uses the approved illustrated character and keeps its original action guard.
  reset();page.evaluate('roomOpenArrangement("rest")');assert page.locator('.household-rest-scene').count()==1;shot('rest-painted');layout();page.get_by_role('button',name='确认休息4h',exact=True).click();assert page.evaluate('currentCareerTime().restHours')==4;assert page.locator('.household-rest-scene').count()==1;shot('rest-result-painted')
  # Existing policies/pet pages keep their own styling when navigating away.
  reset();page.get_by_role('button',name='保险',exact=True).click();assert page.locator('.household-painted').count()==0
  reset('state.health=10');page.evaluate('openExtraRest()');assert page.locator('.household-painted').count()==0
  assert not errors,errors;ctx.close()
  ctx=browser.new_context(viewport={'width':390,'height':844});page=ctx.new_page();page.goto(f'http://127.0.0.1:{s.server_port}',wait_until='networkidle');page.evaluate('navigator.serviceWorker.ready');page.reload(wait_until='networkidle');page.wait_for_function('navigator.serviceWorker.controller!==null');assert page.evaluate('caches.keys()')==['wealth-life-v28.3-living-embedded1']
  ctx.set_offline(True);page.reload(wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click();page.evaluate('roomOpenArrangement("life");openHousing()');assert page.locator('.household-option').count()==4
  assert page.evaluate('new Promise((resolve,reject)=>{const i=new Image;i.onload=()=>resolve(i.naturalWidth);i.onerror=reject;i.src="assets/career/household-scenes.webp"})')==1536
  page.evaluate('openTownLiving()');page.locator('.living-painted-scene [data-v26="living"]').click();assert page.evaluate('state.cash')==9200
  ctx.close();browser.close();result={'passed':True,'checks':['four housing scenes and original preview buttons, browsing no mutation','payment/reservation scene styling; 320/390/desktop centered no overflow','original living button embedded in illustration, actual800 payment, paid reopen no duplicate, scaled320/390/desktop button clicks','insufficient cash keeps disabled pay and original funding route','approved rest scene, original4h transaction and result','insurance and critical recovery screens not restyled by household module','real SW offline atlas and living payment'],'pageErrors':errors,'limits':['isolated Chromium, not real phone','housing/rest original branch regressions run separately']};Path('qa/browser-evidence/household-paper.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
finally:s.shutdown();s.server_close()
