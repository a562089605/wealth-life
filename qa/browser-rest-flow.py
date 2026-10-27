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
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':390,'height':844},service_workers='block');page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click();page.evaluate('window.restFixture=structuredClone(state)')
  def reset(extra=''):page.evaluate('(x)=>{clearModals();state=structuredClone(restFixture);townHome();if(x)eval(x);roomOpenArrangement("rest")}',extra)
  def snap():return page.evaluate('JSON.stringify({cash:state.cash,month:state.month,health:state.health,energy:state.energy,stress:state.stress,free:currentCareerTime().free,rest:state.extraRest,checks:state.roomArrangements,petCareTime:state.petCareTime})')
  def confirm():page.get_by_role('button',name='确认休息4h',exact=True).click()
  reset();before=snap();page.get_by_role('button',name='返回，不休息',exact=True).click();page.evaluate('roomOpenArrangement("rest")');assert snap()==before
  for w,h in [(320,568),(390,844),(1280,900)]:
   page.set_viewport_size({'width':w,'height':h});box=page.locator('.event-active').bounding_box();assert abs(box['y']+box['height']/2-h/2)<2;assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path='progress/evidence/rest-entry-current-2026-10-26.png',full_page=True)
  prior=page.evaluate('({energy:state.energy,stress:state.stress,health:state.health,cash:state.cash,free:currentCareerTime().free})')
  page.evaluate('()=>{window.oldRestConfirm=$("actions").firstElementChild.onclick}');confirm()
  assert page.locator('#eventTitle').inner_text()=='休息完成'
  assert page.evaluate('state.cash')==prior['cash'];assert page.evaluate('currentCareerTime().free')==prior['free']-4
  assert page.evaluate('state.energy')==min(100,prior['energy']+6);assert page.evaluate('state.stress')==max(0,prior['stress']-2);assert page.evaluate('state.health')==min(100,prior['health']+1)
  after=snap();page.evaluate('oldRestConfirm({preventDefault(){},stopPropagation(){}})');assert snap()==after
  page.screenshot(path='progress/evidence/rest-complete-current-2026-10-26.png',full_page=True)
  page.get_by_role('button',name='再安排一次休息',exact=True).click();confirm();assert page.evaluate('currentCareerTime().free')==prior['free']-8
  page.evaluate('state=JSON.parse(JSON.stringify(state));roomOpenArrangement("rest")');assert page.evaluate('currentCareerTime().free')==prior['free']-8
  # Saturation still costs time; returned deltas reflect actual capped changes.
  reset('state.energy=99;state.health=100;state.stress=1');confirm();assert page.evaluate('JSON.stringify(state.extraRest.entries[0])')=='{"energy":1,"stress":-1,"health":0,"hours":4}'
  # Three hours cannot buy a four-hour rest, four hours can be used exactly.
  reset('state.petCareTime={month:state.month,hours:currentCareerTime().free-3}');assert page.get_by_role('button',name='确认休息4h',exact=True).is_disabled()
  reset('state.petCareTime={month:state.month,hours:currentCareerTime().free-4}');confirm();assert page.evaluate('currentCareerTime().free')==0
  # Required pet cleaning retains its actual professional1h reservation.
  pet='state.pets=[{species:"dog",name:"测试柯基",careId:"fixture-care",care:{nextClean:state.month,nextAnnual:state.month+12,history:[]}}];'
  reset(pet+'state.petCareTime={month:state.month,hours:currentCareerTime().free-4}');assert page.evaluate('necessaryPetCareHours()')==1;assert page.get_by_role('button',name='确认休息4h',exact=True).is_disabled()
  reset(pet+'state.petCareTime={month:state.month,hours:currentCareerTime().free-5}');confirm();assert page.evaluate('currentCareerTime().free')==1
  # Other resource use after preview must be checked again at confirmation.
  reset();page.evaluate('state.petCareTime={month:state.month,hours:currentCareerTime().free-3}');before=snap();confirm();assert snap()==before
  for change in ['state=structuredClone(state)','state.month+=1','$("networkBtn").click()']:
   reset();page.evaluate('()=>{window.staleRest=$("actions").firstElementChild.onclick}');page.evaluate(change);before=snap();page.evaluate('staleRest({preventDefault(){},stopPropagation(){}})');assert snap()==before,'stale rest: '+change
  for extra in ['state.health=29','state.health=10','state.treatments={fixture:{paid:true,status:"recovering",startMonth:state.month}}']:
   reset(extra);assert page.get_by_role('button',name='确认休息4h',exact=True).count()==0;assert page.evaluate('state.extraRest?.entries?.length||0')==0
  reset();page.get_by_role('button',name='确认本月休息安排，返回房屋',exact=True).click();assert page.evaluate('roomChecks().rest.confirmed') is True;assert page.evaluate('state.extraRest.entries.length')==0;assert page.evaluate('state.cash')==10000
  reset();confirm();page.evaluate('state.month+=1;roomOpenArrangement("rest")');assert page.evaluate('state.extraRest.entries.length')==0 and page.evaluate('currentCareerTime().restHours')==0
  assert not errors,errors;context.close()
  context=browser.new_context();page=context.new_page();page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.evaluate('navigator.serviceWorker.ready');page.reload(wait_until='networkidle');page.wait_for_function('navigator.serviceWorker.controller!==null');assert page.evaluate('caches.keys()')==['wealth-life-v28.3-household-paper1']
  context.set_offline(True);page.reload(wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click();page.evaluate('roomOpenArrangement("rest")');confirm();assert page.evaluate('state.extraRest.entries.length')==1
  context.close();browser.close();result={'passed':True,'checks':['preview/back no effects; explicit acknowledgement without resting','4h free payment and actual capped energy/stress/health effects','repeat rest, duplicate callback, reload and next month','insufficient/exact time, resource changes after preview','actual pet professional-cleaning time reservation','stale save/month/detached confirmations blocked','low health and recovery route to treatment','320/390/desktop centered no overflow','real service worker offline rest confirmation'],'pageErrors':errors,'limits':['isolated Chromium, not real phone','not full multi-year randomized gameplay']};Path('qa/browser-evidence/rest-flow.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
finally:server.shutdown();server.server_close()
