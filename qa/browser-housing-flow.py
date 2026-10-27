from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),Quiet);Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{s.server_port}',wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click();page.evaluate('window.housingFixture=structuredClone(state)')
  def reset(extra=''):page.evaluate('(x)=>{clearModals();state=structuredClone(housingFixture);townHome();if(x)eval(x);roomOpenArrangement("life");openHousing()}',extra)
  def preview(key):page.locator('#eventData [data-housing-preview][data-key="'+key+'"]').click()
  def pay():page.get_by_role('button',name='确认住房付款',exact=True).click()
  def snap():return page.evaluate('JSON.stringify({cash:state.cash,month:state.month,housing:state.housing,cost:state.housingCost,lease:state.housingLease,payments:state.monthlyPayments,ledger:state.financeLedger,move:state.pendingHousingMove,free:currentCareerTime().free})')
  reset();before=snap();preview('shared');assert snap()==before;page.screenshot(path='progress/evidence/housing-payment-current-2026-10-26.png',full_page=True)
  quote=page.evaluate('housingQuote(housingChoices().find(h=>h[3]==="shared"))');assert quote['deposit']==quote['monthly']
  page.evaluate('()=>{window.oldHousing=$("actions").firstElementChild.onclick}');pay();assert page.evaluate('state.cash')==10000-quote['total'];assert page.evaluate('heldHousingDeposit()')==quote['deposit'];assert page.evaluate('paymentReceipt().housing')==quote['rent'];assert page.evaluate('paymentReceipt().living')==0;assert page.evaluate('paymentReceipt().premiums')==0
  paid=snap();page.evaluate('oldHousing({preventDefault(){},stopPropagation(){}})');assert snap()==paid
  page.evaluate('openHousing()');preview('shared');pay();assert snap()==paid
  # Next month is an unpaid bill; merely opening never automatically pays or charges another deposit.
  page.evaluate('state.month+=1;openHousing()');cash=page.evaluate('state.cash');assert page.evaluate('paymentReceipt().housing')==0
  preview('shared');q=page.evaluate('housingQuote(housingChoices().find(h=>h[3]==="shared"))');assert q['deposit']==0 and q['rent']==quote['monthly'];assert page.evaluate('state.cash')==cash;pay();assert page.evaluate('state.cash')==cash-quote['monthly']
  page.evaluate('openHousing()');before=snap();preview('studio');assert snap()==before;page.get_by_role('button',name='确认预约，次月入住',exact=True).click();assert page.evaluate('state.cash')==cash-quote['monthly'];assert page.evaluate('state.pendingHousingMove.effectiveMonth')==2
  page.get_by_role('button',name='取消换房预约',exact=True).click();assert page.evaluate('state.pendingHousingMove') is None
  preview('studio');page.get_by_role('button',name='确认预约，次月入住',exact=True).click();page.evaluate('state.month+=1;openHousing()');page.get_by_role('button',name='办理本月住房交接',exact=True).click();q=page.evaluate('housingHandoverQuote()');cash=page.evaluate('state.cash');assert q['refund']==quote['deposit']
  page.screenshot(path='progress/evidence/housing-handover-current-2026-10-26.png',full_page=True);page.get_by_role('button',name='确认交接',exact=True).click();assert page.evaluate('state.cash')==cash-q['net'];assert page.evaluate('paymentReceipt().housing')==q['monthly'];assert page.evaluate('heldHousingDeposit()')==q['deposit'];assert page.evaluate('confirmHousingHandover()') is False
  # Insufficient first payment rejects the whole transaction; no partial deposit or rent.
  reset('state.cash=100');page.evaluate('previewHousingChoice("shared")');assert page.get_by_role('button',name='确认住房付款',exact=True).is_disabled();before=snap();page.evaluate('confirmHousing("shared")');assert snap()==before
  # Quotes cannot be replayed against another save, month or detached page.
  for change in ['state=structuredClone(state)','state.month+=1','openHousing()']:
   reset();preview('shared');page.evaluate('()=>{window.staleHousing=$("actions").firstElementChild.onclick}');page.evaluate(change);before=snap();page.evaluate('staleHousing({preventDefault(){},stopPropagation(){}})');assert snap()==before,'stale housing: '+change
  assert not errors,errors;ctx.close();b.close();result={'passed':True,'checks':['first rent and refundable deposit confirmed together; no living/insurance charge','preview/cancel no payment; confirmed repeated same-month rent not charged again','next month unpaid rent, no automatic payment and no new deposit','change reservation free/cancellable; next-month original deposit refund/new deposit/new rent net handover once','insufficient cash no partial charges','stale save/month/detached preview cannot execute'],'pageErrors':errors,'limits':['isolated Chromium, not real phone','month transitions use fixtures; existing Node settlement tests verify accounting']};Path('qa/browser-evidence/housing-flow.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
finally:s.shutdown();s.server_close()
