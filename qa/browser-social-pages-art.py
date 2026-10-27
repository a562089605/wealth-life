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
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click()
  page.evaluate('window.socialFixture=structuredClone(state)')
  def reset(extra=''):
   page.evaluate('(extra)=>{clearModals();state=structuredClone(socialFixture);townHome();if(extra)eval(extra);roomOpenArrangement("social")}',extra)
  def snap():return page.evaluate('JSON.stringify({cash:state.cash,month:state.month,energy:state.energy,happiness:state.happiness,social:state.social,free:currentCareerTime().free,people:state.people,record:state.socialMonth,interactions:state.socialInteractions,ledger:state.financeLedger,checks:state.roomArrangements})')
  def shot(n):page.screenshot(path='progress/evidence/social-'+n+'-2026-10-26.png',full_page=True)
  def layout():
   for w,h in [(320,568),(390,844),(1280,900)]:
    page.set_viewport_size({'width':w,'height':h});box=page.locator('.event-active').bounding_box();assert abs(box['y']+box['height']/2-h/2)<2,(w,h,box);assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth'),(w,h)
   page.set_viewport_size({'width':390,'height':844})
  reset();before=snap();assert page.locator('.social-contact').count()==page.evaluate('state.people.length')>0
  shot('contacts');layout();assert snap()==before
  page.locator('.social-contact').first.click();assert snap()==before;assert page.locator('.social-option').count()==3;shot('person');layout()
  results=[]
  for i,cost in enumerate([45,0,0]):
   reset();page.evaluate('Math.random=()=>.01');before=snap();page.locator('.social-contact').first.click();assert snap()==before
   prior=page.evaluate('({cash:state.cash,energy:state.energy,social:state.social,happiness:state.happiness,relation:state.people[0].relation,free:currentCareerTime().free})')
   page.evaluate('(i)=>{window.oldSocialConfirm=document.querySelectorAll(".social-option")[i].onclick}',i)
   page.locator('.social-option').nth(i).click();record=page.evaluate('socialRecord()')
   assert record['cost']==cost and record['success'] is True
   assert page.evaluate('state.cash')==prior['cash']-cost
   assert page.evaluate('state.energy')==max(0,prior['energy']-2)
   assert page.evaluate('state.social')==min(100,prior['social']+3)
   assert page.evaluate('state.people[0].relation')==min(100,prior['relation']+record['gain'])
   assert page.evaluate('currentCareerTime().free')==prior['free']-[2,1,1][i]
   assert page.locator('.social-pages-painted').count()==1
   after=snap();page.evaluate('oldSocialConfirm({preventDefault(){},stopPropagation(){}})');assert snap()==after
   shot(['meal-result','chat-result','walk-result'][i]);layout()
   page.get_by_role('button',name='返回联系人',exact=True).click();assert snap()==after;assert '本月已交流' in page.locator('.social-paper').inner_text()
   if i==0:shot('month-complete')
   page.locator('.social-contact').last.click();assert page.locator('.social-option:enabled').count()==3
   page.evaluate('$("networkBtn").click()');page.locator('.social-contact').first.click();assert page.locator('.social-option:disabled').count()==3
   page.evaluate('state=JSON.parse(JSON.stringify(state));$("networkBtn").click()');assert snap()==after
   results.append({'cost':cost,'record':record['scene'],'once':True})
  # Every saved contact has their own monthly quota; hours sum across all receipts.
  reset();page.evaluate('Math.random=()=>.01');count=page.evaluate('state.people.length');free=page.evaluate('currentCareerTime().free')
  for i in range(count):
   page.evaluate('$("networkBtn").click()');page.locator('.social-contact').nth(i).click();assert page.locator('.social-option').nth(0).is_enabled();page.locator('.social-option').nth(0).click()
  assert page.evaluate('state.cash')==10000-45*count
  assert page.evaluate('currentCareerTime().free')==free-2*count
  assert page.evaluate('SocialRecords.all(state).length')==count
  saved=snap();page.evaluate('state=JSON.parse(JSON.stringify(state));$("networkBtn").click()');assert snap()==saved;shot('all-contacts-complete')
  page.evaluate('state.month+=1;$("networkBtn").click()');page.locator('.social-contact').first.click();assert page.locator('.social-option:enabled').count()==3
  # Identical display names still represent separate contact IDs.
  reset('state.people=[{id:"same-a",name:"同名",job:"同学",relation:50},{id:"same-b",name:"同名",job:"邻居",relation:50}]')
  assert page.locator('.social-contact').count()==2
  for i in range(2):
   page.evaluate('$("networkBtn").click()');page.locator('.social-contact').nth(i).click();page.locator('.social-option').nth(2).click()
  assert page.evaluate('SocialRecords.all(state).length')==2
  # Old one-person receipt keeps that contact blocked, other contacts available, and its hours conserved.
  reset('state.socialMonth={month:state.month,person:state.people[0].id||state.people[0].name,scene:"旧交流",cost:15,gain:5,hours:1}')
  free=page.evaluate('currentCareerTime().free');page.locator('.social-contact').first.click();assert page.locator('.social-option:disabled').count()==3
  page.evaluate('$("networkBtn").click()');page.locator('.social-contact').last.click();page.locator('.social-option').nth(2).click();assert page.evaluate('currentCareerTime().free')==free-1
  assert page.evaluate('SocialRecords.all(state).length')==2
  # Zero cash still allows the original free walk; disabled paid cards never execute.
  reset('state.cash=0');page.locator('.social-contact').first.click();assert page.locator('.social-option:disabled').count()==1;assert page.locator('.social-option').nth(1).is_enabled();shot('no-cash')
  page.locator('.social-option').nth(2).click();assert page.evaluate('state.cash')==0 and page.evaluate('socialRecord().cost')==0
  # Free chat works at zero cash, spends one hour, and uses only this person's quota.
  reset('state.cash=0');page.locator('.social-contact').first.click();page.locator('.social-option').nth(1).click();assert page.evaluate('state.cash')==0 and page.evaluate('socialRecord().cost')==0 and page.evaluate('socialRecord().hours')==1
  assert page.evaluate('currentCareerTime().free')==99
  page.evaluate('$("networkBtn").click()');page.locator('.social-contact').first.click();assert page.locator('.social-option:disabled').count()==3
  # Exactly one hour allows chat/walk but not dinner. Changed time is rechecked at confirmation.
  reset('state.petCareTime={month:state.month,hours:currentCareerTime().free-1}')
  page.locator('.social-contact').first.click();assert page.locator('.social-option').nth(0).is_disabled();assert page.locator('.social-option').nth(1).is_enabled()
  assert '自由时间减少1小时' in page.locator('.social-option').nth(1).inner_text()
  page.evaluate('state.petCareTime.hours+=1');prior=snap();page.locator('.social-option').nth(1).click();assert snap()==prior;assert page.evaluate('socialRecord()') is None
  reset('state.petCareTime={month:state.month,hours:currentCareerTime().free-1}')
  page.locator('.social-contact').first.click();page.locator('.social-option').nth(2).click();assert page.evaluate('currentCareerTime().free')==0
  page.evaluate('state.month+=1');assert page.evaluate('currentCareerTime().free')>0
  # Existing saves with an old completed interaction keep their budget and monthly limit.
  reset('state.socialMonth={month:state.month,person:state.people[0].id||state.people[0].name,scene:"旧交流",cost:15,gain:5}')
  free=page.evaluate('currentCareerTime().free');page.locator('.social-contact').first.click();assert page.locator('.social-option:disabled').count()==3;assert page.evaluate('currentCareerTime().free')==free
  # Failure uses the original failed-interaction outcome, including its happiness loss.
  reset('Math.random=()=>.999');page.locator('.social-contact').first.click();happiness=page.evaluate('state.happiness');page.locator('.social-option').nth(0).click();assert page.evaluate('socialRecord().success') is False;assert page.evaluate('state.happiness')==happiness-2
  assert '对话很快结束' in page.locator('.social-paper').inner_text();shot('failure')
  # A detached/month-old/save-old contact or confirmation cannot affect a different save.
  for change in ['$("networkBtn").click()','state.month+=1','state=structuredClone(state)']:
   reset();page.locator('.social-contact').first.click();page.evaluate('()=>{window.staleSocial=document.querySelector(".social-option").onclick}')
   page.evaluate(change);before=snap();page.evaluate('staleSocial({preventDefault(){},stopPropagation(){}})');assert snap()==before
  reset('state.health=20');before=snap();page.locator('.social-contact').first.click();assert page.locator('.social-option').count()==0;assert snap()==before
  reset('state.people=[]');assert page.locator('.social-contact').count()==0;assert '暂时还没有联系人' in page.locator('.social-paper').inner_text();shot('empty');layout()
  # Later acquaintances are the actual saved people, never illustration-generated contacts.
  reset('state.people.push({id:"fixture-new",name:"<新朋友>",job:"园艺师",relation:20})');assert page.locator('.social-contact').count()==page.evaluate('state.people.length');assert '<新朋友>' in page.locator('.social-contact').last.inner_text();assert page.locator('.social-contact script').count()==0
  reset();before=page.evaluate('({cash:state.cash,people:JSON.stringify(state.people)})');page.get_by_role('button',name='确认本月关系安排，返回房屋',exact=True).click();assert page.evaluate('roomChecks().social.confirmed') is True;assert page.evaluate('state.cash')==before['cash'];assert page.evaluate('JSON.stringify(state.people)')==before['people']
  assert not errors,errors;context.close()
  # Install actual SW and reopen the relationship page offline with the new image.
  context=browser.new_context(viewport={'width':390,'height':844});page=context.new_page();page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.evaluate('navigator.serviceWorker.ready');page.reload(wait_until='networkidle');page.wait_for_function('navigator.serviceWorker.controller!==null');assert page.evaluate('caches.keys()')==['wealth-life-v28.3-living-embedded1']
  context.set_offline(True);page.reload(wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click();page.evaluate('roomOpenArrangement("social")');assert page.locator('.social-contact').count()>0
  assert page.evaluate('new Promise((resolve,reject)=>{const i=new Image;i.onload=()=>resolve(i.naturalWidth);i.onerror=reject;i.src="assets/career/social-scenes.webp"})')>0
  context.close();browser.close();result={'passed':True,'interactions':results,'checks':['saved contacts and new acquaintances; no invented people','browsing no costs, effects, time or checks','three original payments, per-contact monthly quota, multiple contacts accumulated hours, old receipt migration, same-name distinct IDs, reload and next month','confirmed1/1/2 hours, time changed after preview, exact zero, next month and old receipt compatibility','original failure description and loss retained','free chat and walk at zero cash; chat uses one hour and contact monthly quota','stale detached/month/save callbacks blocked','recovery redirect and empty contacts','explicit room acknowledgement without interaction','320/390/desktop centered without horizontal overflow','real service worker and offline art'],'pageErrors':errors,'limits':['isolated Chromium, not real phone','only confirmed room interaction hours added; other activity proposals unchanged']};Path('qa/browser-evidence/social-pages-art.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
finally:server.shutdown();server.server_close()
