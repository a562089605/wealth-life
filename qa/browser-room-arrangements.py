"""Isolated save: actual new-game, room navigation and acknowledgement buttons."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8765',wait_until='networkidle')
 page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click()
 assert page.locator('#roomView').is_visible() and page.locator('.event-active').count()==0
 assert page.evaluate('state.cash')==10000 and page.evaluate('state.month')==0
 assert not page.locator('#wlHeader').is_visible()
 assert page.locator('.room-hud-stats [data-room="cash"]').inner_text()=='现金\n$10,000'
 assert page.locator('.room-hud').bounding_box()['y']==0
 assert page.locator('.room-art').bounding_box()['y']>=page.locator('.room-hud').bounding_box()['height']
 assert page.locator('.room-art>img').evaluate('(img)=>Math.abs(img.clientWidth/img.clientHeight-img.naturalWidth/img.naturalHeight)<.01')
 for key in ['health','energy','stress','happiness']:
  expected=page.evaluate(f'Math.round(state.{key})')
  assert page.locator(f'.room-hud-feelings [data-room="{key}"] strong').inner_text()==f'{expected} / 100'
 assert page.locator('.room-hud-time strong').inner_text()=='100 h'
 page.screenshot(path='qa/browser-evidence/room-full-page.png',full_page=True)
 page.locator('.room-hud [data-room="happiness"]').click()
 assert page.locator('#eventTitle').inner_text()=='照顾自己的状态'
 page.get_by_role('button',name='返回',exact=True).click()
 assert page.locator('#roomView [data-room="leave"]').is_disabled()
 assert page.locator('#roomView .room-hotspots [data-room]').count()==8
 assert page.locator('#roomView [data-room="housing"]').count()==0
 checks.append('选择人生直接进入房屋，无开局提示；七类按钮及出门，住房保险必要事项不再独立占房屋按钮')
 page.locator('[data-room="learn"]').click();assert not page.evaluate('roomChecks().learn?.confirmed||false')
 page.evaluate('clearModals();townHome();showTown()');assert page.locator('#eventTitle').inner_text()=='请先确认本月安排'
 page.get_by_role('button',name='返回房屋',exact=True).click()
 page.locator('[data-room="life"]').click()
 for name in ['住房','基本生活费','保险','本月必要安排']:
  assert page.get_by_role('button',name=name,exact=True).is_visible()
 page.get_by_role('button',name='确认本月生活安排，返回房屋',exact=True).click()
 assert not page.evaluate('roomChecks().life?.confirmed||false')
 checks.append('打开不打勾；缺少确认无法从备用地图入口绕过；必要事项未处理不能确认生活')
 page.get_by_role('button',name='选择住房',exact=True).click()
 page.locator('#eventData [data-housing-preview][data-key="shared"]').click()
 page.get_by_role('button',name='确认住房付款',exact=True).click()
 page.evaluate('clearModals();townHome()');page.locator('[data-room="life"]').click()
 page.get_by_role('button',name='基本生活费',exact=True).click();page.locator('[data-v26="living"]').click()
 assert page.evaluate('necessaryBills().length')==0
 page.evaluate('clearModals();townHome()')
 baseline=page.evaluate('({cash:state.cash,month:state.month,free:currentCareerTime().free})')
 for key,name in [('work','工作'),('learn','学习'),('rest','休息'),('life','生活'),('social','关系'),('finance','财务'),('pets','宠物')]:
  page.locator(f'#roomView [data-room="{key}"]').click()
  page.get_by_role('button',name=f'确认本月{name}安排，返回房屋',exact=True).click()
  assert page.evaluate(f'roomChecks().{key}.confirmed')
  assert page.locator(f'[data-room="{key}"] .room-check').inner_text()=='✓'
 assert page.evaluate('({cash:state.cash,month:state.month,free:currentCareerTime().free})')==baseline
 assert page.locator('[data-room="leave"]').is_enabled()
 assert page.locator('.room-check').count()==7
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='qa/browser-evidence/room-confirmed.png',full_page=True)
 checks.append('逐项真实按钮确认七类，右侧七个勾；确认本身不扣款不耗时不推进月份，全部完成启用出门')
 page.reload(wait_until='networkidle');page.get_by_role('button',name='读取已有存档',exact=True).click();page.get_by_role('button',name='存档 1',exact=False).first.click()
 page.evaluate('clearModals();townHome()');assert page.locator('.room-check').count()==7
 page.locator('[data-room="leave"]').click();assert page.evaluate('state.town.screen')=='map'
 # The next-month reset is a fixture; actual month settlement is covered separately.
 page.evaluate('state.month++;clearModals();townHome()')
 assert page.locator('.room-check').count()==0 and page.locator('[data-room="leave"]').is_disabled()
 checks.append('读档保留当月勾；允许进入地图；月份fixture递增后七项重新待确认，历史确认保留')
 assert not errors,errors
 result={'passed':True,'checks':checks,'pageErrors':errors,'limitations':['Chromium 390px模拟视口，非真机','次月清单重置使用月份fixture，连续月结另测','没有遍历各领域全部可选行为']}
 Path('qa/browser-evidence/room-arrangements.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));ctx.close();b.close()
