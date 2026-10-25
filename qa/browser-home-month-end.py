"""Actual home buttons in an isolated save; time usage is an explicit fixture."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(service_workers='block');page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8765',wait_until='networkidle')
 (page.locator('#careerPreview') if page.locator('#careerPreview').is_visible() else page.get_by_role('button',name='存档 1 · 新游戏',exact=True)).click()
 page.locator('#job').select_option('barista');page.locator('#start').click()
 page.evaluate('Math.random=()=>.999;clearModals();townStart();openHousing()')
 page.locator('#eventData [data-housing-preview][data-key="shared"]').click()
 page.get_by_role('button',name='确认住房付款',exact=True).click()
 page.evaluate('clearModals();openTownLiving()');page.locator('[data-v26="living"]').click()
 assert page.evaluate('necessaryBills().length')==0
 page.evaluate('MapCards.data(state).hours[state.month]=100;state.town.position=5;clearModals();townHome();save()')
 page.evaluate('state.roomArrangements??={};state.roomArrangements[state.month]=Object.fromEntries(Object.keys(ROOM_SECTIONS).map(k=>[k,{confirmed:true,month:state.month}])) ;render()')
 assert page.evaluate('currentCareerTime().free')==0
 cash=page.evaluate('state.cash')
 page.locator('[data-room="leave"]').click()
 assert page.locator('#eventTitle').inner_text()=='留在房屋，核对本月收支'
 assert page.evaluate('state.month')==0 and page.evaluate('state.cash')==cash
 assert page.evaluate('state.town.movement') is None
 page.get_by_role('button',name='返回房屋',exact=True).click()
 assert page.evaluate('state.month')==0 and page.evaluate('state.cash')==cash
 checks.append('0h房屋出门打开月结预览，预览及返回均不改变现金/月数/移动')
 page.reload(wait_until='networkidle')
 page.get_by_role('button',name='读取已有存档',exact=True).click()
 page.get_by_role('button',name='存档 1',exact=False).first.click()
 page.evaluate('Math.random=()=>.999;clearModals();townHome()')
 page.locator('[data-room="leave"]').click()
 expected=page.evaluate('Math.round((state.cash+calcMetrics().remainingCF)*100)/100')
 page.evaluate('() => {window.homeConfirm=document.querySelector("#actions button").onclick}')
 page.get_by_role('button',name='确认不出门，结算本月',exact=True).click()
 assert page.evaluate('state.month')==1
 assert round(page.evaluate('state.cash'),2)==expected
 page.evaluate('window.homeConfirm({preventDefault(){},stopPropagation(){}})')
 assert page.evaluate('state.month')==1 and page.evaluate('state.history.length')==1
 assert page.evaluate('state.town.movement.returnReason')=='home-time'
 checks.append('刷新读档后同一0h入口可确认原月结；现金与原账本一致，重复点击只结算一次')
 page.get_by_role('button',name='继续',exact=True).click()
 assert not page.evaluate('townPending()')
 page.reload(wait_until='networkidle')
 page.get_by_role('button',name='读取已有存档',exact=True).click()
 page.get_by_role('button',name='存档 1',exact=False).first.click()
 assert page.evaluate('state.month')==1 and round(page.evaluate('state.cash'),2)==expected
 assert not errors,errors
 checks.append('月结后继续与再次读档保留现金/月份，无未捕获脚本错误')
 ctx.close();b.close()
result={'passed':True,'checks':checks,'pageErrors':errors,'limitations':['自由时间使用100h为隔离fixture；其余住房/生活/确认使用真实按钮','Chromium桌面；未验证真机及全部医疗/欠薪组合']}
Path('qa/browser-evidence/home-month-end.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
