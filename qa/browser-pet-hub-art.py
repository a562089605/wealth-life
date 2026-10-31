"""Isolated new save, actual pet-hub buttons; ownership display also uses a labelled fixture."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8765',wait_until='networkidle')
 page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click()
 before=page.evaluate('({cash:state.cash,month:state.month,free:currentCareerTime().free,pets:state.pets.length})')
 page.locator('#roomView [data-room="pets"]').click()
 page.get_by_role('button',name='返回我的宠物',exact=True).click()
 assert page.locator('.event-active.pet-hub-painted').count()==1
 assert page.locator('#petHubIllustration img').evaluate('(i)=>i.complete&&i.naturalWidth>0')
 assert page.locator('.pet-hub-empty').is_visible()
 assert page.evaluate('({cash:state.cash,month:state.month,free:currentCareerTime().free,pets:state.pets.length})')==before
 page.screenshot(path='qa/browser-evidence/pet-hub-painted.png',full_page=True)
 page.get_by_role('button',name='领养新伙伴',exact=True).click()
 assert page.locator('.event-active.pet-hub-painted').count()==0
 assert page.locator('#petHubIllustration').count()==0
 assert page.get_by_role('button',name='查看柯基',exact=True).is_visible()
 assert page.get_by_role('button',name='查看变色龙',exact=True).is_visible()
 page.get_by_role('button',name='返回我的宠物',exact=True).click()
 assert page.locator('.event-active.pet-hub-painted').count()==1
 assert page.get_by_role('button',name='宠物日常照顾',exact=True).count()==0
 assert page.evaluate('({cash:state.cash,month:state.month,free:currentCareerTime().free,pets:state.pets.length})')==before
 page.evaluate('clearModals();townHome()');page.locator('#roomView [data-room="pets"]').click()
 for width,height in [(320,740),(390,844)]:
  page.set_viewport_size({'width':width,'height':height})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
 page.get_by_role('button',name='确认本月宠物安排，返回房屋',exact=True).click()
 assert page.locator('[data-room="pets"] .room-check').inner_text()=='✓'
 assert page.evaluate('state.cash')==before['cash']
 page.evaluate('state.pets=[{id:"qa-pet",careId:"qa-pet",name:"豆豆",species:"dog",type:"狗",petRulesVersion:1,adoptMonth:state.month,insuranceKey:"pet:qa-pet",care:{nextAnnual:12,nextClean:3,history:[]}}]')
 page.locator('#roomView [data-room="pets"]').click()
 assert page.locator('.pet-hub-empty').count()==0
 assert '豆豆' in page.locator('#eventData').inner_text()
 assert page.get_by_role('button',name='豆豆 · 保险',exact=True).is_visible()
 page.get_by_role('button',name='宠物日常照顾',exact=True).click()
 assert page.locator('.event-active.pet-hub-painted').count()==0
 assert not errors,errors
 result={'passed':True,'checks':['新卡实际加载插画，未养宠不显示到期照护，打开不扣款不耗时','领养/返回/到期照护真实按钮沿原动作，子页不会残留宠物主页样式','320/390px无横向溢出，确认回屋保留打勾','已养宠fixture展示真实名字与逐宠保险按钮'],'pageErrors':errors,'limitations':['隔离Chromium，非真机','已养宠仅显示fixture，未重测全部领养与理赔规则']}
 Path('qa/browser-evidence/pet-hub-art.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));ctx.close();b.close()
