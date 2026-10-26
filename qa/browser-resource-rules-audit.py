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
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':1000},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click();baseline=page.evaluate('JSON.stringify(state)')
  def reset(extra=''):
   page.evaluate('(s)=>{clearModals();state=JSON.parse(s);pending=false;townHome()}',baseline)
   if extra:page.evaluate(extra)
  def snap():return page.evaluate('({month:state.month,free:currentCareerTime().free,energy:state.energy,stress:state.stress,health:state.health,happiness:state.happiness,cash:state.cash,study:state.study,rest:state.extraRest?.entries.length||0})')
  rows=[]
  def record(name,before):
   rows.append({'case':name,'before':before,'after':snap()});Path('qa/resource-rules-audit-2026-10-26.json').write_text(json.dumps({'cases':rows},ensure_ascii=False,indent=2))
  # Existing core time deductions, including multiple modules stacked.
  reset();before=snap();page.evaluate('openExtraRest();confirmExtraRest(state.month,monthlyRest().entries.length)');record('rest_4h',before)
  before=snap();page.evaluate('completeCoffeeCourse("coffee",monthlyCoffeeCourses().entries.length,state.month)');record('skill_course_8h_after_rest',before)
  before=snap();page.evaluate('MapCards.data(state).hours[state.month]=3');record('map_event_3h_after_rest_course',before)
  # Free-status gains in retained home activities.
  reset();before=snap();page.evaluate('document.getElementById("lifestyleBtn").click()');page.get_by_role('button',name='确认 宅家休息',exact=True).click();record('home_lifestyle_rest_no_time',before)
  reset();before=snap();page.evaluate('document.getElementById("hobbyBtn").click()');page.get_by_role('button',name='查看摄影详情',exact=True).click();page.get_by_role('button',name='确认练习 摄影',exact=True).click();record('hobby_practice_no_time',before)
  reset();before=snap();page.evaluate('openSocialPerson(0)');page.get_by_role('button',name='确认聊天 · $15',exact=True).click();record('chat_with_friend_no_time',before)
  # Degree enrollment and accumulation are separate from the time-accounted skill courses.
  reset('state.cash=100000');before=snap();page.evaluate('openEducation()');page.get_by_role('button',name='查看专科学位',exact=True).click();page.locator('#actions button').first.click();record('degree_enrollment_no_hours',before)
  # A full-recovery fixture: original domain treatment, no artificial normal free-time.
  reset('state.health=20;const q=treatmentQuote({kind:"ordinary",coverage:0});beginTreatment(state,{id:"audit-recovery",quote:q,startMonth:state.month});payTreatment(state,"audit-recovery")');before=snap();page.evaluate('document.getElementById("hobbyBtn").click()');page.get_by_role('button',name='查看摄影详情',exact=True).click();page.get_by_role('button',name='确认练习 摄影',exact=True).click();record('hobby_during_full_recovery',before)
  reset('state.job=null;state.salary=0;state.annualSalary=0');rows.append({'case':'unemployed_time','actual':page.evaluate('currentCareerTime()')})
  # Confirming only the work review checkbox is different from paying normal management work state.
  reset('state.job="店长";state.annualSalary=58000;state.salary=58000/12;state.workHoursPerWeek=45');before=snap();page.evaluate('roomOpenArrangement("work")');page.get_by_role('button',name='确认本月工作安排，返回房屋',exact=True).click();rows.append({'case':'manager_work_review_without_contract','before':before,'after':snap(),'workMarked':page.evaluate('roomChecks().work?.confirmed'),'normalWorkRecorded':page.evaluate('!!state.cafe?.work?.[state.month]')})
  assert not errors,errors
  out={'scope':'Isolated Chromium. Real activity buttons except explicit month/role/recovery/time-use fixtures. No production save or balance changes. Not a natural long playthrough.','cases':rows,'pageErrors':errors}
  Path('qa/resource-rules-audit-2026-10-26.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False,indent=2));ctx.close();b.close()
finally:server.shutdown();server.server_close()
