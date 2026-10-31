"""Actual map controls with isolated positions/roles; no production saves or deployment."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('qa/map-browser-evidence.json');out.unlink(missing_ok=True);checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=b.new_context(service_workers='block',viewport={'width':1280,'height':900});page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8765',wait_until='networkidle');page.locator('#careerPreview').click();page.locator('#start').click()
 page.evaluate("clearModals();townStart();confirmHousing('shared');payMonthly('living',livingTotal());state.cash=200000;state.health=80;state.energy=80;state.stress=20;mapPrepareContacts();MapCards.data(state)")
 base=page.evaluate('JSON.stringify(state)')
 def reset(extra=''):
  page.evaluate("base=>{state=JSON.parse(base);pending=false;clearModals();townVisible=true}",base)
  if extra:page.evaluate(extra)
 def land(to,randoms):
  page.evaluate("x=>{clearModals();let i=0;Math.random=()=>x.randoms[Math.min(i++,x.randoms.length-1)];const t=townState();t.position=x.to;t.screen='map';t.explorationMonth=state.month;t.movement={id:++t.rolls,month:state.month,to:x.to,die:1,opened:true,resolved:false,payExpected:null};openTownLanding()}",{'to':to,'randoms':randoms})
 reset("state.pets=[{id:'qa-pet',careId:'qa-pet',name:'Bobo',species:'dog',insuranceKey:'pet:qa-pet',adoptMonth:0,care:{nextAnnual:12,nextClean:2,history:[]}}];state.insurance['pet:qa-pet']={active:true,coverage:.8,startMonth:0,monthly:30}")
 land(2,[.85,0,0]);assert page.locator('#eventTitle').inner_text()=='宠物不舒服';cash=page.evaluate('state.cash');assert cash==200000
 assert page.locator('#eventData .map-card-art img').evaluate('(x)=>x.complete&&x.naturalWidth>0')
 page.reload(wait_until='networkidle');page.get_by_role('button',name='读取已有存档',exact=True).click();page.locator('#slots .saveRow button').first.click()
 assert page.locator('#eventTitle').inner_text()=='宠物不舒服'
 page.get_by_role('button',name='带它去看医生',exact=True).click();assert page.evaluate('state.cash')==cash-40;assert page.evaluate('currentCareerTime().free')==97
 page.get_by_role('button',name='继续探索',exact=True).click();assert not page.evaluate('townPending()')
 checks.append('宠物原卡图与按钮、保险锁价40、刷新读档继续同卡、确认扣款/3h一次，未按宠物数多扣')
 reset();land(1,[0,0]);assert page.locator('#eventTitle').inner_text()=='买入出租房间';cash=page.evaluate('state.cash');assert cash==200000
 page.get_by_role('button',name='确认全款购买',exact=True).click();assert page.evaluate('state.cash')==160000;assert page.evaluate('state.assets.at(-1).cf')==0
 page.get_by_role('button',name='继续探索',exact=True).click();land(4,[0,0]);assert '收购报价' in page.locator('#eventTitle').inner_text();assert page.evaluate('state.cash')==160000
 page.get_by_role('button',name='确认出售',exact=True).click();assert page.evaluate('state.cash')==200000;assert page.evaluate('state.assets.filter(a=>a.mapOrigin).length')==0
 checks.append('地图房产真实全款确认与收购按钮：预览不收费，买入40000，买入月无收入，卖出本金只到账一次')
 reset();land(4,[.7]);assert page.locator('#eventTitle').inner_text()=='股票行情';assert page.get_by_role('button',name='确认出售',exact=True).count()==0
 page.get_by_role('button',name='继续探索',exact=True).click();assert page.evaluate('state.cash')==200000
 for to in [3,7]:
  land(to,[0]);assert page.locator('#eventTitle').inner_text()=='这次没有合适的事件';page.get_by_role('button',name='继续探索',exact=True).click()
 checks.append('市场无持仓仅消息，不产生出售款；关系/成长资料缺失时空过，不再打开房屋活动菜单')
 reset();land(5,[0]);assert page.locator('#eventTitle').inner_text()=='同事临时请假';page.locator('[data-coffee-choice="0"]').click();page.get_by_role('button',name='继续',exact=True).click()
 first=page.evaluate('coffeeRecord().extraWages');land(10,[0]);assert page.locator('#eventTitle').inner_text()=='同事突然离职';page.locator('[data-coffee-choice="0"]').click();assert page.evaluate('coffeeRecord().extraWages')>first
 assert page.evaluate('currentCareerTime().free')==60
 page.get_by_role('button',name='继续',exact=True).click();land(19,[0]);assert page.locator('#eventTitle').inner_text()=='常客的大额小费'
 assert page.evaluate('Object.keys(state.mapCards.career).length')==3
 checks.append('咖啡师同月三种主卡依次发生，旧主卡冷却，待发工资和额外工时累计保留，不被新卡覆盖')
 reset("state.job='值班主管 Shift Lead';state.annualSalary=44000;state.salary=44000/12;MapCards.data(state).hours[0]=97")
 land(5,[.25]);assert page.locator('#eventTitle').inner_text()=='排班冲突';page.evaluate('Math.random=()=>.99');page.locator('[data-shift-choice="1"]').click()
 locked=page.evaluate('JSON.stringify(shiftRecord().follow)');page.reload(wait_until='networkidle');page.get_by_role('button',name='读取已有存档',exact=True).click();page.locator('#slots .saveRow button').first.click()
 assert page.evaluate('JSON.stringify(shiftRecord().follow)')==locked
 page.get_by_role('button',name='确认结果',exact=True).click();assert page.evaluate('state.forcedTimeReturn.debt')==5;assert page.evaluate('state.month')==0
 checks.append('主管失败后续在仅余3h时仍可接受，随机结果读档不重抽；8h强制后续仅欠5h，不先推进月份')
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path='/tmp/wealth-map-checkpoint.png',full_page=True)
 assert not errors,errors
 ctx.close();b.close()
out.write_text(json.dumps({'passed':True,'checks':checks,'pageErrors':errors,'limitations':['位置、角色、资金、宠物为隔离fixture，未模拟自然晋升与真实贷款购买','部分原卡缺口保留禁用；不是78张全部实测','390px为桌面浏览器模拟，未测手机真机']},ensure_ascii=False,indent=2));print(json.dumps({'passed':True,'checks':checks},ensure_ascii=False,indent=2))
