"""Controlled dice in an isolated browser save; actual bill and payday buttons."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(service_workers='block');page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8765',wait_until='networkidle')
 (page.locator('#careerPreview') if page.locator('#careerPreview').is_visible() else page.get_by_role('button',name='存档 1 · 新游戏',exact=True)).click();page.locator('#job').select_option('barista');page.locator('#start').click()
 page.evaluate('Math.random=()=>.999;clearModals();townStart();openHousing()')
 page.locator('#eventData [data-housing-preview][data-key="shared"]').click()
 page.get_by_role('button',name='确认住房付款',exact=True).click()
 assert page.evaluate('state.cash')==8238
 for month in range(3):
  page.evaluate('clearModals();townHome();openHousing()')
  if month:
   page.locator('#eventData [data-housing-preview][data-key="shared"]').click()
   page.get_by_role('button',name='确认住房付款',exact=True).click()
  page.evaluate('clearModals();openTownLiving()')
  page.locator('[data-v26="living"]').click()
  assert page.evaluate('necessaryBills().length')==0
  page.evaluate('clearModals();townHome()')
  page.evaluate('state.town.roomInterior=true;state.roomArrangements??={};state.roomArrangements[state.month]=Object.fromEntries(Object.keys(ROOM_SECTIONS).map(k=>[k,{confirmed:true,month:state.month}]));save();render()')
  entry_cash=page.evaluate('state.cash')
  page.locator('[data-room="leave"]').click(timeout=5000)
  if month==0:
   assert page.evaluate('state.town.position')==0
   assert page.evaluate('state.town.movement===null')
   assert page.evaluate('state.month')==0 and page.evaluate('state.history.length')==0
   assert page.evaluate('state.cash')==entry_cash and page.locator('.event-active').count()==0
   page.reload(wait_until='networkidle')
   page.get_by_role('button',name='读取已有存档',exact=True).click()
   page.get_by_role('button',name='存档 1',exact=False).first.click()
   page.evaluate('Math.random=()=>.999;clearModals();showTown()')
   assert page.evaluate('state.town.position')==0 and page.evaluate('state.town.movement===null')
   assert page.evaluate('state.month')==0 and page.evaluate('state.history.length')==0
   assert page.evaluate('state.cash')==entry_cash and page.locator('.event-active').count()==0
   checks.append('首次入图可在第1格发薪日，但不弹月结、不发工资、不推进；刷新读档重新入图亦不结算')
  page.locator('[data-town="roll"]').click()
  assert page.locator('#eventTitle').inner_text()=='核对本月收支'
  assert page.evaluate('state.month')==month
  expected=page.evaluate('Math.round((state.cash+calcMetrics().remainingCF)*100)/100')
  page.evaluate('() => {window.loopConfirm=document.querySelector("#actions button").onclick}')
  page.get_by_role('button',name='确认结算本月',exact=True).click()
  assert page.evaluate('state.month')==month+1
  assert round(page.evaluate('state.cash'),2)==expected
  page.evaluate('window.loopConfirm({preventDefault(){},stopPropagation(){}})')
  assert page.evaluate('state.month')==month+1
  assert page.evaluate('state.history.length')==month+1
  assert page.evaluate('state.history.at(-1).tax')==0
  page.get_by_role('button',name='继续',exact=True).click()
  assert not page.evaluate('townPending()')
  checks.append(f'月{month+1}:住房/生活原按钮支付→六点落发薪→账目对账→唯一月结')
 page.evaluate('save()');cash=page.evaluate('state.cash');page.reload(wait_until='networkidle')
 page.get_by_role('button',name='读取已有存档',exact=True).click()
 page.get_by_role('button',name='存档 1',exact=False).first.click();assert page.evaluate('state.month')==3;assert page.evaluate('state.cash')==cash
 assert not errors,errors
 checks.append('连续三月后刷新读档现金/月份保留；无浏览器脚本异常')
 ctx.close()
 # A separate profile exercises the real service worker and actual offline reload.
 ctx=b.new_context();page=ctx.new_page();page.goto('http://127.0.0.1:8765',wait_until='networkidle')
 page.evaluate('navigator.serviceWorker.ready');page.reload(wait_until='networkidle')
 page.wait_for_function('navigator.serviceWorker.controller!==null')
 assert page.evaluate('caches.keys()')==['wealth-life-v28.3-recovery-guard1']
 ctx.set_offline(True);page.reload(wait_until='networkidle')
 (page.locator('#careerPreview') if page.locator('#careerPreview').is_visible() else page.get_by_role('button',name='存档 1 · 新游戏',exact=True)).click();page.locator('#job').select_option('barista')
 assert page.locator('#coffeeIntro img').evaluate('(x)=>x.complete&&x.naturalWidth>0')
 checks.append('真实Service Worker安装控制页面；断网刷新仍能显示新游戏入口及缓存人物图（桌面Chromium）')
 ctx.close();b.close()
out=Path(__file__).parent/'browser-evidence';out.mkdir(exist_ok=True)
(out/'month-loop.json').write_text(json.dumps({'passed':True,'checks':checks,'limits':'骰子固定六点，覆盖三月基础闭环；未覆盖全部随机卡与长期经营，不是真机安装验收'},ensure_ascii=False,indent=2))
print(json.dumps({'passed':True,'checks':checks},ensure_ascii=False,indent=2))
