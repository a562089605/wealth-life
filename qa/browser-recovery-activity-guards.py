from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import json
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Quiet);Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click();base=page.evaluate('JSON.stringify(state)')
  # Capture real original confirmations while healthy, before the later recovery transition.
  page.evaluate('document.getElementById("hobbyBtn").click()');page.get_by_role('button',name='查看摄影详情',exact=True).click();page.evaluate('() => {window.guardOldHobby=document.querySelector("#actions button").onclick}')
  page.evaluate('clearModals();previewCoffeeCourse("coffee")');page.evaluate('() => {window.guardOldCourse=document.querySelector("#actions button").onclick}')
  def recover():
   page.evaluate('(s)=>{clearModals();state=JSON.parse(s);pending=false;townHome();state.month=2;state.health=20;const q=treatmentQuote({kind:"ordinary",coverage:0});beginTreatment(state,{id:"guard-recovery",quote:q,startMonth:state.month});payTreatment(state,"guard-recovery")}',base)
  def snap():return page.evaluate('JSON.stringify({month:state.month,cash:state.cash,energy:state.energy,stress:state.stress,health:state.health,happiness:state.happiness,hobby:state.hobbyXP,choices:state.monthChoices,social:state.socialMonth,coffee:state.coffee,ledger:state.financeLedger,people:state.people})')
  checks=[]
  for label,action in [('hobby menu','document.getElementById("hobbyBtn").click()'),('life menu','document.getElementById("lifestyleBtn").click()'),('old hobby confirmation','window.guardOldHobby({preventDefault(){},stopPropagation(){}})'),('old course confirmation','window.guardOldCourse({preventDefault(){},stopPropagation(){}})'),('direct life choice','chooseLife(1)'),('social action','doSocial(state.people[0],15,5,"socialCoffee")'),('skill course','completeCoffeeCourse("coffee",0,state.month)')]:
   recover();before=snap();page.evaluate(action);assert snap()==before,label;assert page.locator('#eventTitle').inner_text()=='完成本月康复';checks.append(label+' blocked without resource changes')
  recover();page.evaluate('state.annualRun={paused:false,preparedMonth:null};state.annualPlan={life:"balanced",hobby:"摄影"}')
  before=snap();assert page.evaluate('prepareAnnualMonth()') is False;assert page.evaluate('state.annualRun.paused') is True;assert snap()==before;checks.append('annual preparation pauses before spending or applying elective effects')
  recover();cash=page.evaluate('state.cash');assert page.evaluate('payMonthly("living",10)') is True;assert page.evaluate('state.cash')==cash-10;checks.append('necessary living payment remains available')
  recover();page.evaluate('state.pets=[{id:"guard-cat",careId:"guard-cat",name:"小银",species:"cat",type:"猫",petRulesVersion:1,adoptMonth:0,insuranceKey:"pet:guard-cat",care:{nextClean:2,nextAnnual:12,history:[]}}]')
  cash=page.evaluate('state.cash');assert page.evaluate('payPetCare({[petCareTasks()[0].key]:"pro"})') is True;assert page.evaluate('state.cash')==cash-60;assert page.evaluate('currentCareerTime().free')==0;assert page.evaluate('state.pets[0].care.nextClean')==5;checks.append('delegated pet care keeps original60 cost/0 personal hours and due date')
  # Healthy controls: the same activities still execute normally.
  page.evaluate('(s)=>{clearModals();state=JSON.parse(s);pending=false;townHome()}',base)
  cash=page.evaluate('state.cash');assert page.evaluate('completeCoffeeCourse("coffee",0,state.month)') is True;assert page.evaluate('state.cash')==cash-80;assert page.evaluate('currentCareerTime().free')==92;checks.append('normal skill course still costs80/8h')
  page.evaluate('(s)=>{clearModals();state=JSON.parse(s);pending=false;townHome();document.getElementById("hobbyBtn").click()}',base);page.get_by_role('button',name='查看摄影详情',exact=True).click();page.get_by_role('button',name='确认练习 摄影',exact=True).click();assert page.evaluate('state.cash')==9910;assert page.evaluate('hobbyXP("摄影")')==35;checks.append('normal photography still costs90 and gives35XP; time remains pending design')
  assert not errors,errors
  result={'passed':True,'checks':checks,'pageErrors':errors,'limits':['isolated Chromium','recovery/month/pet due dates are explicit fixtures','does not claim complete long-play or old-save coverage']};Path('qa/recovery-activity-guards-browser.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));ctx.close();b.close()
finally:server.shutdown();server.server_close()
