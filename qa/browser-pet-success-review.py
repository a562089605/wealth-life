"""Isolated slots only; verify existing success receipt and stale callback boundaries."""
import json
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Quiet);Thread(target=server.serve_forever,daemon=True).start()
out=Path('qa/browser-evidence/pet-success-review');out.mkdir(exist_ok=True)
results=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':390,'height':844},service_workers='block');page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
  page.screenshot(path=str(out/'opening-first-page.png'),full_page=True)
  page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click()
  # New manager introduction is outside this review; retain its saved data and return home.
  page.evaluate('() => {window.probe=fn=>{document.querySelectorAll("#actions button").forEach(b=>b.disabled=false);if(window.oldConfirmNode)oldConfirmNode.disabled=false;fn(new Event("click"))};townHome()}')
  page.locator('#roomView [data-room="pets"]').click()
  for sp,label,cost in [('dog','柯基',400),('cat','银渐层',430),('crocodile','鳄鱼',2380),('gecko','豹纹守宫',300),('spider','捕鸟蛛',175),('tortoise','陆龟',465),('chameleon','变色龙',590)]:
   page.evaluate('() => {window.probe=fn=>{document.querySelectorAll("#actions button").forEach(b=>b.disabled=false);if(window.oldConfirmNode)oldConfirmNode.disabled=false;fn(new Event("click"))}}')
   page.get_by_role('button',name='查看'+label,exact=True).click();page.get_by_role('button',name='下一步：取名与费用',exact=True).click()
   page.locator('#petAdoptionName').fill('核对'+label)
   if sp!='dog':page.locator('#petAdoptionInsurance').check()
   before=page.evaluate('({cash:state.cash,count:state.pets.length})')
   # Closed form must not transact, even though its input is retained.
   page.evaluate('window.oldConfirmNode=document.querySelector("#actions button");window.oldConfirm=oldConfirmNode.onclick;clearModals();probe(oldConfirm)')
   assert page.evaluate('state.cash')==before['cash'];assert page.evaluate('state.pets.length')==before['count']
   page.evaluate(f'previewPetAdoption("{sp}")');page.locator('#petAdoptionName').fill('核对'+label)
   if sp!='dog':page.locator('#petAdoptionInsurance').check()
   page.evaluate('window.oldConfirmNode=document.querySelector("#actions button");window.oldConfirm=oldConfirmNode.onclick;window.adoptionOwner=state;window.adoptionSlot=slot;slot=99;probe(oldConfirm);slot=adoptionSlot')
   assert page.evaluate('state.cash')==before['cash']
   page.evaluate('document.querySelector("#actions button").disabled=false')
   page.get_by_role('button',name='确认领养',exact=True).click()
   assert page.locator('#eventTitle').inner_text()=='领养成功'
   text=page.locator('.pet-success-board').inner_text();assert '核对'+label in text;assert ('宠物保险已生效' in text)==(sp!='dog')
   assert page.evaluate('state.cash')==before['cash']-cost
   assert page.evaluate('state.pets.length')==before['count']+1
   assert page.evaluate('JSON.stringify(load(slot).pets)===JSON.stringify(state.pets)&&load(slot).cash===state.cash')
   page.evaluate('probe(oldConfirm);probe(oldConfirm)');assert page.evaluate('state.cash')==before['cash']-cost
   page.wait_for_function('document.querySelector(".pet-success-art img").naturalWidth>0')
   layouts=[]
   for w,h in [(320,568),(390,844),(1280,900)]:
    page.set_viewport_size({'width':w,'height':h});card=page.locator('.event-active')
    assert card.evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    page.get_by_role('button',name='查看我的宠物',exact=True).scroll_into_view_if_needed()
    assert page.get_by_role('button',name='查看我的宠物',exact=True).is_visible()
    layouts.append([w,h])
   page.set_viewport_size({'width':390,'height':844});page.locator('.event-active').evaluate('(e)=>e.scrollTop=0')
   page.screenshot(path=str(out/(sp+'.png')),full_page=True)
   if sp=='dog':
    page.locator('.pet-success-receipt small').scroll_into_view_if_needed();page.screenshot(path=str(out/'dog-receipt.png'),full_page=True)
   if sp=='dog':
    page.set_viewport_size({'width':320,'height':568});page.locator('.event-active').evaluate('(e)=>e.scrollTop=0');page.screenshot(path=str(out/'dog-320-top.png'),full_page=True)
    page.get_by_role('button',name='查看我的宠物',exact=True).scroll_into_view_if_needed();page.screenshot(path=str(out/'dog-320-actions.png'),full_page=True);page.set_viewport_size({'width':390,'height':844})
   page.evaluate('window.oldPets=[...document.querySelectorAll("#actions button")].find(b=>b.textContent==="查看我的宠物").onclick;window.oldHome=[...document.querySelectorAll("#actions button")].find(b=>b.textContent==="返回房屋").onclick;window.owner=state;state=JSON.parse(JSON.stringify(state));window.snap=JSON.stringify(state);probe(oldPets);probe(oldHome)')
   assert page.evaluate('JSON.stringify(state)===snap');assert page.locator('#eventTitle').inner_text()=='领养成功'
   page.evaluate('state=owner;slot=99;probe(oldPets);probe(oldHome);slot=adoptionSlot');assert page.locator('#eventTitle').inner_text()=='领养成功'
   page.evaluate('[...document.querySelectorAll("#actions button")].forEach(b=>b.disabled=false)')
   page.get_by_role('button',name='查看我的宠物',exact=True).click();assert page.locator('#eventTitle').inner_text()=='我的宠物'
   assert page.locator('.pet-owned-card').count()==before['count']+1
   assert '核对'+label in page.locator('.pet-owned-board').inner_text()
   page.evaluate('window.snap=JSON.stringify(state);probe(oldPets);probe(oldHome)');assert page.evaluate('JSON.stringify(state)===snap');assert page.locator('#eventTitle').inner_text()=='我的宠物'
   page.locator('#actions button[data-owned-action=back]').click();page.locator('#roomView [data-room="pets"]').click();assert page.locator('.pet-owned-card').count()==before['count']+1
   page.reload(wait_until='networkidle');page.evaluate('state=load(slot);openGame();townHome()');page.locator('#roomView [data-room="pets"]').click()
   assert page.evaluate('state.cash')==before['cash']-cost;assert page.locator('.pet-owned-card').count()==before['count']+1
   results.append({'species':sp,'paid':cost,'count':before['count']+1,'layouts':layouts,'persisted':True})
   page.get_by_role('button',name='领养新伙伴',exact=True).click()
  assert not errors,errors
  (out/'results.json').write_text(json.dumps({'cases':results,'pageErrors':errors,'realDevice':False},ensure_ascii=False,indent=2))
  print('PASS: seven real adoptions, quote/save/balance, repeat/closed/cross-slot callbacks, actual owned-pet target, return/reload, 3 widths, all images loaded')
  browser.close()
finally:server.shutdown();server.server_close()
