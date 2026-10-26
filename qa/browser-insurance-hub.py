from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Quiet);Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));checks=[]
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click();base=page.evaluate('JSON.stringify(state)')
  def reset(extra=''):
   page.evaluate('(s)=>{clearModals();state=JSON.parse(s);pending=false;townHome()}',base)
   if extra:page.evaluate(extra)
  def confirm():page.locator('#actions button').first.click()
  def shot(name):
   page.wait_for_function('document.querySelector(".insurance-hero img")?.naturalWidth>0');page.screenshot(path='qa/browser-evidence/insurance-'+name+'.png',full_page=True)
  page.locator('#roomView [data-room="life"]').click();page.get_by_role('button',name='保险',exact=True).click();assert page.evaluate('state.cash')==10000;shot('hub')
  for width,height in [(320,568),(390,844),(1280,900)]:
   page.set_viewport_size({'width':width,'height':height});box=page.locator('.event-active').bounding_box();assert abs(box['y']+box['height']/2-height/2)<1;assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  page.set_viewport_size({'width':390,'height':844});page.get_by_role('button',name='医疗保险',exact=True).click();shot('medical')
  page.get_by_role('button',name='基础医疗险',exact=True).click();assert page.evaluate('state.cash')==10000
  page.evaluate('() => {window.oldMedicalPay=document.querySelector("#actions button").onclick}');confirm();assert page.evaluate('state.cash')==9800;assert page.evaluate('medicalCoverage()')==.8;assert page.evaluate('paymentReceipt().premiums')==200
  page.evaluate('window.oldMedicalPay({preventDefault(){},stopPropagation(){}})');assert page.evaluate('state.cash')==9800;shot('medical-active')
  page.get_by_role('button',name='全额医疗险',exact=True).click();confirm();assert page.evaluate('state.pendingMedicalPolicy.plan')=='full';assert page.evaluate('medicalCoverage()')==.8 and page.evaluate('state.cash')==9800;shot('medical-switch')
  page.get_by_role('button',name='下月停止医疗保障',exact=True).click();confirm();assert page.evaluate('state.pendingMedicalPolicy.plan') is None;assert page.evaluate('medicalCoverage()')==.8
  page.get_by_role('button',name='基础医疗险',exact=True).click();confirm();assert page.evaluate('state.pendingMedicalPolicy') is None
  checks.append('medical selection has no charge; original200/80% once; switching/cancel next month, keep cancels pending without refund')
  page.get_by_role('button',name='返回保险管理',exact=True).click();page.get_by_role('button',name='收入保障',exact=True).click();shot('income');confirm();assert page.evaluate('state.cash')==9735 and page.evaluate('state.insurance.income.active') is True
  page.get_by_role('button',name='预约下月停保',exact=True).click();assert page.evaluate('state.insurance.income.active') is True;page.get_by_role('button',name='撤销停保，保留原保障',exact=True).click();assert not page.evaluate('state.pendingInsuranceChanges?.income')
  page.get_by_role('button',name='预约下月停保',exact=True).click();page.get_by_role('button',name='返回保险管理',exact=True).click();page.get_by_role('button',name='医疗保险',exact=True).click();page.get_by_role('button',name='全额医疗险',exact=True).click();confirm()
  page.evaluate('state.month=1;clearModals();syncFinance();openInsurance()');assert page.evaluate('state.insurance.income.active') is False;assert page.evaluate('medicalCoverage()')==1 and page.evaluate('state.insurance.health.monthly')==400;assert page.evaluate('state.cash')==9735
  page.get_by_role('button',name='核对并支付本月保费',exact=True).click();shot('premium-payment');page.evaluate('() => {window.oldPremiumPay=document.querySelector("#actions button").onclick}');confirm();assert page.evaluate('state.cash')==9335;page.evaluate('window.oldPremiumPay({preventDefault(){},stopPropagation(){}})');assert page.evaluate('state.cash')==9335
  checks.append('income65 paid, next-month cancel/withdraw; month fixture applies full medical400, shared premium paid once')
  page.get_by_role('button',name='汽车保险',exact=True).click();assert page.get_by_role('button',name='确认投保并支付',exact=True).count()==0
  page.get_by_role('button',name='返回保险管理',exact=True).click();page.get_by_role('button',name='宠物保险',exact=True).click();assert '尚未领养宠物' in page.locator('.insurance-board').inner_text();shot('pets-empty')
  page.evaluate('clearModals();townHome();roomOpenArrangement("pets")');page.get_by_role('button',name='下一步：取名与费用',exact=True).click();page.locator('#petAdoptionName').fill('豆豆');page.locator('#petAdoptionInsurance').check();page.get_by_role('button',name='确认领养',exact=True).click();assert page.evaluate('state.cash')==8905
  page.evaluate('clearModals();townHome();roomOpenArrangement("life");openInsurance()');assert page.evaluate('InsuranceRules.quote(state).due')==0 and page.evaluate('premiumsTotal()')==430;assert page.locator('[data-insurance="pet"]').count()==0
  page.get_by_role('button',name='宠物保险',exact=True).click();shot('pets-owned');page.get_by_role('button',name='豆豆',exact=True).click();assert page.locator('.pet-policy-painted').count()==1;assert page.evaluate('state.cash')==8905
  checks.append('unowned auto cannot buy; empty pets have no flat pet policy; actual insured dog430 adoption, shared400+30 paid receipt, original per-pet detail')
  reset('state.cash=100;openMedicalInsurance()');page.get_by_role('button',name='基础医疗险',exact=True).click();assert page.locator('#actions button').first.is_disabled();page.get_by_role('button',name='前往银行筹款',exact=True).click();assert page.locator('#wlLoanAmount').input_value()=='100';page.get_by_role('button',name='取消',exact=True).click();assert page.evaluate('state.cash')==100
  page.get_by_role('button',name='前往银行筹款',exact=True).click();page.get_by_role('button',name='确认贷款',exact=True).click();assert page.evaluate('state.cash')==200 and page.evaluate('medicalCoverage()')==0;confirm();assert page.evaluate('state.cash')==0 and page.evaluate('medicalCoverage()')==.8
  checks.append('insufficient cash cannot activate; bank cancel no mutation, confirmed loan returns with selection then separate explicit policy payment')
  reset('state.insurance.health={active:true,monthly:220};state.insurance.auto={active:true,monthly:150};state.insurance.pet={active:true,monthly:45};openMedicalInsurance()');assert page.evaluate('medicalCoverage()')==1;assert page.evaluate('InsuranceRules.quote(state).monthly')==415;page.get_by_role('button',name='保留原保单',exact=True).click();confirm();assert page.evaluate('state.insurance.health.monthly')==220 and page.evaluate('state.cash')==10000
  checks.append('legacy220 medical/150 auto/45 merged pet retained, no automatic repricing or pet conversion')
  reset('state.carOwned=true;openInsurance("auto")');confirm();assert page.evaluate('state.cash')==9835 and page.evaluate('state.insurance.auto.active') is True
  page.get_by_role('button',name='预约下月停保',exact=True).click();assert page.evaluate('state.insurance.auto.active') is True
  page.evaluate('state.month=1;syncFinance()');assert page.evaluate('state.insurance.auto.active') is False;assert page.evaluate('necessaryBills().some(r=>r.kind==="auto")') is True
  reset('openInsurance("life")');assert page.get_by_role('button',name='确认投保并支付',exact=True).count()==0
  reset('state.insurance.life={active:true,monthly:35,name:"原人寿保单"};openInsurance("life")');page.get_by_role('button',name='预约下月停保',exact=True).click();assert page.evaluate('state.insurance.life.active') is True
  page.evaluate('state.month=1;syncFinance()');assert page.evaluate('state.insurance.life.active') is False and page.evaluate('state.cash')==10000
  checks.append('owned auto165 activates, stopping next month preserves current coverage then required-bill gate; no new unsupported life contract, legacy life cancellation no refund')
  reset('state.month=1;state.insurance.income={active:true,monthly:65};const old=Math.random;Math.random=()=>0;try{maybeInsuredJobLoss()}finally{Math.random=old}');amount=page.evaluate('state.incomeProtectionClaims[0].amount');assert amount==page.evaluate('roundCash(state.salary*.55)');cash=page.evaluate('state.cash');assert page.evaluate('maybeInsuredJobLoss()') is False and page.evaluate('state.cash')==cash
  checks.append('actual original income claim55% once, not recurring')
  reset('state.health=20;ensureHealthTreatment();openMedicalInsurance()');page.get_by_role('button',name='基础医疗险',exact=True).click();confirm();assert page.evaluate('unfinishedTreatment().quote.due')==500;assert page.evaluate('medicalCoverage()')==.8
  reset('state.health=10;openInsurance()');assert page.locator('#eventTitle').inner_text()=='严重健康问题';assert page.locator('.insurance-painted').count()==0
  checks.append('new medical policy does not reprice an already quoted treatment; critical-health redirect is not overwritten by insurance UI')
  assert not errors,errors
  result={'passed':True,'checks':checks,'pageErrors':errors,'limits':['isolated Chromium, non-real-device','month/car/legacy/low-cash/health fixtures explicit','no new renters/life/car injury payout rules invented']};Path('qa/browser-evidence/insurance-hub.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));ctx.close();b.close()
finally:server.shutdown();server.server_close()
