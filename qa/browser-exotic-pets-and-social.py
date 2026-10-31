from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Quiet);Thread(target=server.serve_forever,daemon=True).start()
pets=[('柯基','dog','小柯'),('银渐层','cat','小银'),('鳄鱼','crocodile','小绿'),('豹纹守宫','gecko','小豹'),('捕鸟蛛','spider','小蛛'),('陆龟','tortoise','小龟'),('变色龙','chameleon','小彩')]
out=Path('progress/evidence/pet-exotic-cleaning-2026-10-26');out.mkdir(exist_ok=True)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':1000},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click();page.locator('#roomView [data-room="pets"]').click()
  for species,key,name in pets:
   page.get_by_role('button',name='查看'+species,exact=True).click();page.get_by_role('button',name='下一步：取名与费用',exact=True).click();page.locator('#petAdoptionName').fill(name);page.get_by_role('button',name='确认领养',exact=True).click();page.get_by_role('button',name='查看我的宠物',exact=True).click()
   if key!='chameleon':page.get_by_role('button',name='领养新伙伴',exact=True).click()
  # Isolated preview fixture: show due cleaning options for all seven, no payment.
  page.evaluate('state.month=3;clearModals();townHome();roomOpenArrangement("pets")')
  page.get_by_role('button',name='小柯 · 宠物日常照顾',exact=True).click()
  original=page.evaluate('JSON.stringify({cash:state.cash,pets:state.pets,time:state.petCareTime})')
  ids=page.evaluate('Object.fromEntries(state.pets.map(p=>[p.species,p.id]))')
  for species,key,name in pets[3:]:
   page.get_by_role('combobox',name='选择要照顾的宠物',exact=True).select_option(ids[key]);page.wait_for_function('[...document.querySelectorAll(".pet-care-simple img")].every(i=>i.complete&&i.naturalWidth>0)')
   assert name in page.locator('.pet-care-name').inner_text()
   assert page.locator('.pet-care-square').count()==2
   assert page.locator('.pet-exotic-cleaning-scene').count()==2
   assert page.locator('.pet-clean-icon').count()==0
   page.locator('#eventData').evaluate('(e)=>e.scrollTop=0');page.screenshot(path=str(out/(key+'.png')),full_page=True)
   assert page.evaluate('JSON.stringify({cash:state.cash,pets:state.pets,time:state.petCareTime})')==original
  # Exercise the original map social card and saved quote; no friend is created on preview.
  count=page.evaluate('state.people.length');cash=page.evaluate('state.cash')
  page.evaluate('clearModals();mapPrepareContacts();window.petFriendBefore=JSON.stringify(state.people)')
  contact=page.evaluate('state.mapContactCandidates.find(p=>!state.people.some(x=>x.id===p.id))')
  assert contact['gender'] in ['male','female'] and isinstance(contact['age'],int) and contact['job']!='小镇居民'
  page.evaluate("() => {const old=Math.random;let i=0;const values=[.85,.75,0];Math.random=()=>values[Math.min(i++,2)];try{const t=townState();t.position=2;t.screen='map';t.explorationMonth=state.month;t.movement={id:++t.rolls,month:state.month,to:2,die:1,opened:true,resolved:false};openTownLanding()}finally{Math.random=old}}")
  assert page.locator('#eventTitle').inner_text()=='宠物爱好者交流日'
  assert page.evaluate('state.people.length')==count and page.evaluate('state.cash')==cash
  quoted=page.evaluate('JSON.stringify(mapRecord().quote.contact)')
  assert contact['name'] in page.locator('#eventData').inner_text()
  page.reload(wait_until='networkidle');page.get_by_role('button',name='读取已有存档',exact=True).click();page.locator('#slots .saveRow button').first.click()
  assert page.evaluate('JSON.stringify(mapRecord().quote.contact)')==quoted
  page.evaluate('() => {window.qaSocialAgain=document.querySelector("#actions button").onclick}')
  page.get_by_role('button',name='一起参加活动',exact=True).click()
  assert page.evaluate('state.people.length')==count+1 and page.evaluate('state.cash')==cash-20
  friend=page.evaluate('state.people.at(-1)');assert friend['id']==contact['id'] and friend['age']==contact['age'] and friend['job']==contact['job'] and friend['relation']==10
  page.evaluate('window.qaSocialAgain()');assert page.evaluate('state.people.length')==count+1 and page.evaluate('state.cash')==cash-20
  page.screenshot(path='progress/evidence/pet-social-result-2026-10-26.png',full_page=True)
  page.get_by_role('button',name='继续探索',exact=True).click();page.evaluate('clearModals();townHome();document.getElementById("networkBtn").click()')
  contact_button=page.get_by_role('button',name='联系 '+contact['name'],exact=True)
  assert contact_button.count()==1
  before=page.evaluate('state.cash');contact_button.click();assert page.locator('.social-option').count()==3 and page.evaluate('state.cash')==before
  assert not errors,errors
  import json
  Path('qa/browser-evidence/pet-exotic-and-social.json').write_text(json.dumps({'passed':True,'checks':['actual seven pet adoptions','four species two cleaning scenes each; browsing no spend','pet map social profile50/50, saved quote/reload, confirm once cost20/add friend','actual new contact button opens three interactions without charge'],'pageErrors':errors,'limits':['isolated Chromium; due month/map landing fixture']},ensure_ascii=False,indent=2)+'\n')
  print('PASS: four species × two illustrated scenes, no preview spend/care mutation; original pet social card 50/50 profile metadata, saved quote unchanged after reload, confirm once adds friend/20 cost, original relationship-list button present; no page errors')
  ctx.close();b.close()
finally:server.shutdown();server.server_close()
