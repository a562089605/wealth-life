"""Read-only game audit using disposable browser profiles and explicit fixtures."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

result={'baseline':'de200dc','scope':'isolated browser fixtures; no real player data','entrances':[],'landings':[],'careerCards':[],'probes':{}}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(service_workers='block',viewport={'width':1280,'height':900});page=ctx.new_page()
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8765',wait_until='networkidle')
 page.get_by_role('button',name='存档 1 · 新游戏',exact=True).click();page.locator('#job').select_option('barista');page.locator('#start').click()
 result['opening']=page.evaluate('({cash:state.cash,health:state.health,energy:state.energy,people:state.people})')
 page.evaluate("clearModals();townStart();confirmHousing('shared');payMonthly('living',livingTotal());state.energy=80;state.health=80;state.happiness=68;state.stress=28;window.auditBaseline=JSON.stringify(state)")
 def reset(extra=''):
  page.evaluate("state=JSON.parse(window.auditBaseline);clearModals();pending=false;townVisible=false;Math.random=()=>.999;townHome();"+extra)
 def snap():
  return page.evaluate("""({month:state.month,cash:state.cash,free:currentCareerTime().free,title:document.querySelector('.event-active')?$('eventTitle').textContent:null,type:document.querySelector('.event-active')?$('eventType').textContent:null,buttons:[...$('actions').querySelectorAll('button')].map(x=>({text:x.textContent,disabled:x.disabled})),images:[...$('eventData').querySelectorAll('img')].map(x=>x.getAttribute('src')),pending:townPending(),room:roomVisible()})""")
 for key in ['work','learn','rest','life','social','finance','housing','bills','insurance','pets','leave']:
  reset();before=snap()
  try:
   page.locator('[data-room="'+key+'"]').click(timeout=5000)
   row=snap();row.update({'entrance':key,'previewCashDelta':round(row['cash']-before['cash'],2),'previewTimeDelta':row['free']-before['free']})
  except Exception as e:row={'entrance':key,'error':str(e)}
  result['entrances'].append(row)
 for i in range(24):
  reset(f"townVisible=true;state.town.screen='map';state.town.movement={{id:1,to:{i},from:0,die:1,path:[{i}],month:state.month,payExpected:TOWN_TYPES[{i}]==='payday'?state.month+1:null,resolved:false}};resumeTownMove()")
  row=snap();row.update({'tile':i+1,'tileType':page.evaluate(f'TOWN_TYPES[{i}]')});result['landings'].append(row)
 result['catalog']=page.evaluate("""({barista:Object.entries(COFFEE_EVENTS).map(([id,c])=>({id,name:c.name,options:c.choices.length})),shift:Object.entries(SHIFT_EVENTS).map(([id,c])=>({id,name:c.name,options:c.choices?.length||0,followChoices:(c.choices||[]).filter(x=>x.follow).map(x=>x.follow)})),opportunities:V26_OFFERS.map(x=>({id:x.id,name:x.name,cost:x.cost})),lifestyle:V26_LIFE.map(x=>x.name),careers:CAREERS.map(x=>x.name),education:EDU,petSpecies:Object.keys(PET_ADOPTION)})""")
 for id in ['staff','busy','cut','tip','departure']:
  reset(f"coffeeCareerData();let r=ensureCoffeeMonth();r.eventId='{id}';r.status='pending';r.quotes=null;coffeeEnsureQuotes(r);openCoffeeCareerEvent()")
  row=snap();row.update({'role':'barista','id':id});result['careerCards'].append(row)
 for id in ['training','schedule','complaint','acting','praise']:
  reset("state.job='值班主管 Shift Lead';state.annualSalary=44000;state.salary=44000/12;shiftData();")
  page.evaluate(f"let r=ensureShiftMonth();r.eventId='{id}';r.quotes=null;r.status='{ 'resolved' if id=='praise' else 'pending'}';openShiftEvent()")
  row=snap();row.update({'role':'shiftLead','id':id});result['careerCards'].append(row)
  if id in ['schedule','complaint','acting']:
   for success in [True,False]:
    reset("state.job='值班主管 Shift Lead';state.annualSalary=44000;state.salary=44000/12;shiftData();")
    page.evaluate(f"let r=ensureShiftMonth();r.eventId='{id}';r.status='pending';r.quotes=null;openShiftEvent();resolveShiftEvent(state.month,'{id}',{0 if id=='acting' else 1},()=>{'.01' if success else '.99'})")
    row=snap();row.update({'role':'shiftLead','id':id,'followSuccess':success});result['careerCards'].append(row)
 reset('state.petCareTime={month:state.month,hours:100};render()')
 page.locator('[data-room="leave"]').click();result['probes']['zeroHours']=snap()
 reset('openSocialPerson(0)');before=snap();page.get_by_role('button',name='确认聊天 · $15',exact=True).click();after=snap()
 result['probes']['socialTime']={'before':before,'after':after,'relation':page.evaluate('state.people[0].relation')}
 reset("previewCoffeeCourse('coffee');state.study={target:'associate',progress:0,total:24};clearModals()")
 result['probes']['studyTime']=page.evaluate('({free:currentCareerTime().free,necessary:necessaryBills().map(x=>x.kind)})')
 reset("state.health=20;beginTreatment(state,{id:'audit-recovery',quote:treatmentQuote({kind:'ordinary',coverage:0}),startMonth:state.month});payTreatment(state,'audit-recovery');$('hobbyBtn').click()")
 before=page.evaluate('({cash:state.cash,free:currentCareerTime().free,recovery:isRecoveryMonth(state),xp:hobbyXP("摄影")})')
 page.get_by_role('button',name='查看摄影详情',exact=True).click();page.get_by_role('button',name='确认练习 摄影',exact=True).click()
 result['probes']['recoveryHobby']={'before':before,'after':page.evaluate('({cash:state.cash,free:currentCareerTime().free,recovery:isRecoveryMonth(state),xp:hobbyXP("摄影")})')}

 reset("state.insurance['pet:test']={name:'测试宠物保险',active:true,monthly:80,coverage:.8};state.monthlyPayments.premiums=0;openInsurance()")
 result['probes']['petPremiumUI']=page.evaluate("({actualTotal:premiumsTotal(),displayDue:document.querySelector('[data-insurance-total]').textContent,formDue:insuranceDraftTotal(document.querySelector('.wl-insurance')).due,necessary:necessaryBills().filter(x=>x.kind==='premiums')})")
 reset("state.pets=[{species:'crocodile',type:'鳄鱼',name:'审查鳄鱼',id:'pet-a',careId:'pet-a',petRulesVersion:1,adoptMonth:0,care:{nextAnnual:12,nextClean:2,history:[]}}];state.month=2;state.insurance['pet:pet-a']={name:'宠物险',active:true,monthly:80};openPetHub()")
 result['probes']['petPremiumUI']['naturalPetTotal']=page.evaluate('premiumsTotal()')
 reset("state.job='店长 Store Manager';state.annualSalary=58000;state.salary=58000/12;openWorkAdjustment()")
 result['probes']['manager']=snap()
 reset("state.assets.push({id:'audit-asset',name:'审查资产',kind:'business',cost:50000,value:50000,cf:5000});syncFinance();openJourney()")
 result['probes']['secondStage']=snap()
 reset("state.cash=10000;state.loans=[{id:'audit-loan',type:'银行贷款',balance:2000,principal:2000,apr:.12,monthsLeft:12,payment:paymentFor(2000,.12,12)}];syncFinance();payDebt(loanDebtName(state.loans[0]))")
 before=page.evaluate('({cash:state.cash,balance:state.loans[0].balance,payment:state.loans[0].payment,months:state.loans[0].monthsLeft})')
 page.get_by_role('button',name='确认还款',exact=True).click();after=page.evaluate('({cash:state.cash,balance:state.loans[0].balance,payment:state.loans[0].payment,months:state.loans[0].monthsLeft})')
 result['probes']['earlyRepayment']={'before':before,'after':after}
 reset("state.cash=10000;state.financeLedger=[];state.pets=[{type:'鳄鱼',species:'crocodile',name:'测试',petRulesVersion:1,adoptMonth:0}];spendConfirmed('petAdoption',2000);spendConfirmed('petCare',30);let s={month:1,grossSalary:0,tax:0,kContrib:0,passive:0,expenses:0,prepaidExpenses:0,loanPayments:[],ledger:state.financeLedger,monthOpeningCash:10000,monthCashChange:-2030};window.auditCashRows=auditRows(s)")
 result['probes']['newLedgerKinds']=page.evaluate('window.auditCashRows.filter(r=>r[0].includes("其他现金变化"))')
 result['pageErrors']=errors
 ctx.close();b.close()
out=Path(__file__).parent/'system-audit-evidence.json';out.write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({'entrances':len(result['entrances']),'landings':len(result['landings']),'careerCases':len(result['careerCards']),'probes':result['probes'],'pageErrors':errors},ensure_ascii=False,indent=2))
