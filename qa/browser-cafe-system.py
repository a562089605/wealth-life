"""Isolated manager/partner fixtures, actual controls and canonical monthly settlement."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
checks=[];observations={}
Path('qa/cafe-browser-evidence.json').unlink(missing_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(service_workers='block',viewport={'width':1280,'height':900});page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8765',wait_until='networkidle');page.locator('#careerPreview').click();page.locator('#start').click()
 page.evaluate("clearModals();townStart();confirmHousing('shared');payMonthly('living',livingTotal());state.job='店长 Store Manager';state.annualSalary=58000;state.salary=58000/12;state.energy=80;state.health=80;state.stress=20;state.coffee.skills={coffee:{xp:200},service:{xp:300},management:{xp:200}};state.cafe.holdings.effectivePct=.2;window.managerBaseline=JSON.stringify(state);openWorkAdjustment()")
 baseline=page.evaluate('window.managerBaseline')
 def reset(extra=''):
  page.evaluate("base=>{state=JSON.parse(base);clearModals();pending=false;Math.random=()=>.999;townHome()}",baseline)
  if extra: page.evaluate(extra)
 def confirm_work():
  page.get_by_role('button',name='确认本月工作安排',exact=True).click()
 assert page.evaluate('currentCareerTime().free')==80
 assert page.evaluate('state.energy')==80
 confirm_work();assert page.evaluate('state.energy')==52;assert page.evaluate('state.stress')==32
 page.evaluate('openWorkAdjustment()');confirm_work();assert page.evaluate('state.energy')==52
 page.evaluate('openWorkAdjustment()');page.locator('#cafeAbsentHours').fill('8');page.locator('#cafeMissedTips').fill('1.5')
 assert page.evaluate('state.energy')==52
 confirm_work();assert page.evaluate('coffeeMonthlyIncome().fixedBonus')==0;assert page.evaluate('currentCareerTime().free')==88
 page.evaluate('openWorkAdjustment()');page.locator('#cafeAbsentHours').fill('0');page.locator('#cafeMissedTips').fill('0');confirm_work()
 assert abs(page.evaluate('state.energy')-52)<.0001
 assert page.evaluate('coffeeMonthlyIncome().baseTips')==450
 assert page.evaluate('coffeeMonthlyIncome().fixedBonus')==500
 checks.append('店长80h、确认−28/+12一次；缺席预览不执行，确认返时/无固定奖金/减少工资小费；改回只结差额')
 def group():
  page.evaluate("clearModals();Math.random=()=>0;state.town.position=5;state.town.screen='map';townVisible=true;state.town.explorationMonth=state.month;state.town.movement={id:++state.town.rolls,to:5,die:5,month:state.month,opened:true,resolved:false};workplaceEvent()")
 group();assert page.locator('#eventTitle').inner_text()=='员工突然离职';cash=page.evaluate('state.cash')
 page.get_by_role('button',name='亲自招聘、交接',exact=True).click()
 assert page.evaluate('state.cash')==cash
 assert page.evaluate('state.cafe.payroll[0].wages')==148.72
 assert page.evaluate('currentCareerTime().free')==76
 page.get_by_role('button',name='继续',exact=True).click()
 group();assert page.locator('#eventTitle').inner_text()=='设备故障'
 group_id=page.evaluate('cafePending().id');page.reload(wait_until='networkidle')
 page.get_by_role('button',name='读取已有存档',exact=True).click();page.locator('#slots .saveRow button').first.click()
 assert page.evaluate('cafePending().id')==group_id
 page.get_by_role('button',name='暂停受影响的出品，等待维修',exact=True).click()
 assert page.evaluate('state.cash')==cash
 assert page.evaluate('Object.values(state.cafe.store.invoices).reduce((n,x)=>n+x.amount,0)')==500
 page.get_by_role('button',name='继续',exact=True).click()
 group();assert page.locator('#eventTitle').inner_text()=='经营业绩下滑'
 assert page.get_by_role('button',name='方案A：原选项与耗时待核对（资料待核对）',exact=True).is_disabled()
 page.get_by_role('button',name='维持现有安排，继续观察',exact=True).click();page.get_by_role('button',name='继续',exact=True).click()
 assert page.evaluate('CafeRules.draw(state,currentCareerTime().free,()=>0)===null')
 checks.append('真实主卡按钮：招聘4h/月底148.72、不立即发现金；维修仅门店500；读档继续同组；下滑仅C可执行；同卡月一次且不同卡同月')
 page.evaluate('Math.random=()=>0;clearModals();showTown()');page.locator('[data-town="roll"]').click()
 assert page.locator('#eventTitle').inner_text()=='核对本月收支'
 expected=page.evaluate('roundCash(state.cash+calcMetrics().remainingCF+CafeRules.settleStore(structuredClone(state.cafe.store),cafeStoreQuote(),.2).playerDividend)')
 energy=page.evaluate('state.energy');stress=page.evaluate('state.stress')
 page.get_by_role('button',name='确认结算本月',exact=True).click()
 assert page.evaluate('state.month')==1
 assert round(page.evaluate('state.cash'),2)==expected
 assert page.evaluate('state.energy')==energy and page.evaluate('state.stress')==stress
 assert page.evaluate('state.history[0].tax')==0
 assert page.evaluate('state.cafe.store.history.length')==1
 assert page.evaluate('state.history[0].cafeDividend')>0
 assert page.evaluate('state.history[0].cafeGrowth.coffee')==5
 assert page.evaluate('state.history[0].cafeGrowth.service')==15
 assert page.evaluate('state.history[0].cafeGrowth.management')==15
 observations['managerMonth']=page.evaluate('({cash:state.cash,labor:state.history[0].careerIncome.total,storeProfit:state.history[0].cafeStore.profit,dividend:state.history[0].cafeDividend,energy:state.energy,stress:state.stress,rows:auditRows(state.history[0]).filter(x=>x[0].includes("咖啡店")||x[0].includes("其他现金变化"))})')
 assert observations['managerMonth']['rows'][-1][1]==0
 checks.append('实际核心月底：工资/小费/固定奖金/招聘工资各一次、维修一次、月分红到账与账本归类、5/15/15XP；月底不再扣正常工作状态')
 # Isolated partner labor identity keeps holdings and excludes manager pool/tips/fixed bonus.
 reset("state.job='在店管理合伙人';state.annualSalary=60000;state.salary=5000;openWorkAdjustment()")
 confirm_work();assert page.evaluate('coffeeMonthlyIncome().baseTips')==0;assert page.evaluate('coffeeMonthlyIncome().fixedBonus')==0
 assert page.evaluate('coffeeMonthlyIncome().baseWages')==5000
 assert page.evaluate('currentCareerTime().free')==80
 page.evaluate('workplaceEvent()');assert '待核对' in page.locator('#eventTitle').inner_text()
 checks.append('在店合伙人5000月基薪、无小费/固定奖金；持股不自动改变劳动身份；不套主管或店长卡池')
 page.evaluate("clearModals();state.town.position=5;state.town.movement=null;townVisible=true;state.town.explorationMonth=state.month;Math.random=()=>0;showTown()")
 page.locator('[data-town="roll"]').click();page.get_by_role('button',name='确认结算本月',exact=True).click()
 assert page.evaluate('state.history[0].careerIncome.total')==5000
 assert page.evaluate('state.history[0].cafeStore.fixed')==27666.67
 assert page.evaluate('state.history[0].cafeGrowth.service')==10
 assert page.evaluate('state.history[0].cafeGrowth.management')==15
 assert 'undefined' not in page.locator('#eventData').inner_text()
 checks.append('合伙人实际月结：替换同一管理岗位成本，固定成本27666.67，无叠加旧店长工资；正常XP5/10/15，收入明细日期/奖金正确')
 # Research cost is explicitly a QA fixture, never a production default.
 reset('openWorkAdjustment()');confirm_work()
 page.evaluate("state.cafe.store.researchCost={confirmed:true,amount:120,source:'QA ONLY'};workplaceEvent()")
 assert page.locator('#eventTitle').inner_text()=='研发新品'
 page.evaluate('Math.random=()=>0')
 page.get_by_role('button',name='亲自研发',exact=True).click()
 assert page.evaluate('cafePending().follow.probability')==.7
 assert page.evaluate('cafePending().skillSnapshot.coffee')==200
 frozen=page.evaluate('JSON.stringify(cafePending().follow)')
 page.reload(wait_until='networkidle');page.get_by_role('button',name='读取已有存档',exact=True).click();page.locator('#slots .saveRow button').first.click()
 assert page.evaluate('JSON.stringify(cafePending().follow)')==frozen
 page.evaluate('()=>{window.repeatFollow=document.querySelector("#actions button").onclick}')
 page.get_by_role('button',name='确认后续结果',exact=True).click()
 page.evaluate('window.repeatFollow({preventDefault(){},stopPropagation(){}})')
 assert page.evaluate('state.cafe.payroll[0].bonus')==150
 assert page.evaluate('state.cafe.store.permanentSales')==1.05
 assert page.evaluate('state.coffee.skills.coffee.xp')==225
 assert not page.evaluate('CafeRules.eligible(state,"research",80)')
 checks.append('隔离研发报价120（仅QA）：接受前技能锁定70%，主后卡同组，刷新读档不重抽，后续重复点击不重复奖金/XP/永久营收，成功退池')
 # Cross-year recovery defers debt; the first normal month uses the actual 80h base.
 reset("state.month=11;state.turn.month=11;state.town.explorationMonth=null;confirmHousing('shared');payMonthly('living',livingTotal());recordForcedEventTime(state,{id:'QA-forced',month:10,hours:8,available:3});beginTreatment(state,{id:'QA-recovery',quote:treatmentQuote({kind:'ordinary',coverage:0}),startMonth:11});payTreatment(state,'QA-recovery');state.health=20;openHealthTreatment()")
 assert page.evaluate('currentCareerTime().free')==0
 page.get_by_role('button',name='确认执行本月康复',exact=True).click()
 assert page.evaluate('state.month')==12
 assert page.evaluate('state.history.at(-1).grossSalary')==0
 assert page.evaluate('state.history.at(-1).cafeDividend')>0
 assert page.evaluate('!state.history.at(-1).cafeGrowth')
 assert page.evaluate('state.workMonths??0')==0
 assert page.evaluate('currentCareerTime().free')==75
 assert page.evaluate('state.eventTimeLedger.events["10:QA-forced"].allocations.length')==1
 page.evaluate('currentCareerTime();currentCareerTime()')
 assert page.evaluate('currentCareerTime().free')==75
 checks.append('跨年康复月：无工资/小费/固定奖金/正常XP/任职进度，股权分红保留；8h强制后续仅欠5h，康复顺延后80−5=75h且只扣一次')
 reset("state.job='行政助理';state.cafe.holdings.effectivePct=.2;openWorkAdjustment()")
 assert page.evaluate('cafeRole()') is None
 assert page.locator('#eventTitle').inner_text()=='调整工作'
 checks.append('不在店股东有其他实际岗位时保留原岗位工作入口及时间计算，不强制80h')
 # Old player state is not reset or retrospectively assigned store cash/holdings.
 reset("delete state.cafe;state.month=19;state.cash=4321;state.legacyQuarterly={earned:900,paid:false};state.coffee.skills.coffee.xp=310;syncFinance();cafeViewStatus()")
 assert page.evaluate('state.cash')==4321
 assert page.evaluate('state.cafe.store.status')=='history-required'
 assert page.evaluate('state.cafe.holdings.effectivePct') is None
 assert page.evaluate('state.coffee.skills.coffee.xp')==310
 assert page.evaluate('state.legacyQuarterly.earned')==900
 checks.append('旧档缺门店/股权历史：不补50000、不填0持股、不清XP/现金/季度旧字段，提示迁移缺口')
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/tmp/wealth-life-cafe-status.png',full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 ctx.close();b.close()
Path('qa/cafe-browser-evidence.json').write_text(json.dumps({'passed':True,'checks':checks,'observations':observations,'pageErrors':errors,'limitations':'角色/持股为隔离测试fixture；不代表自然晋升或正式股权资格已接入。研发金额未提供，生产确认禁用；其后续另用隔离报价120完成浏览器验证；120不是生产规则。非手机真机。'},ensure_ascii=False,indent=2))
print(json.dumps({'passed':True,'checks':checks,'observations':observations},ensure_ascii=False,indent=2))
