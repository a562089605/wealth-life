// Return-home lifecycle and portrait card animation. Existing settlement remains authoritative.
(function(){
 const F=FamilyEvents,S=typeof SharedEvents==='undefined'?null:SharedEvents,el=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const D=typeof HousingTimeDebt==='undefined'?null:HousingTimeDebt;
 const poolOf=r=>r?.pool==='shared'&&S?S:F;
 const record=(pool,month)=>state?.[pool===S?'sharedEvents':'familyEvents']?.records[month];
 function housingLeave(){const a=F.leave(state),b=S?.leave(state)||{hours:0,wages:0,tips:0};return {hours:a.hours+b.hours,wages:roundCash(a.wages+b.wages),tips:roundCash(a.tips+b.tips)};}
 const asset=id=>'assets/family/'+id+'-20261102.webp';
 let overlay=null,activeKey=null,settling=false,internalRoom=false,deferSave=false,loanHost=null;
 const saveBefore=save;save=function(){if(!state)return;if(deferSave)return true;try{const k=key(slot),raw=localStorage.getItem(k);for(const suffix of ['_before_family_20261102','_before_family_care_20261102','_before_shared_20261102','_before_housing_deferred_20261102','_before_ride_b4_20261102','_before_love_dinner_20261102','_before_toolbox_followup_20261102']){const backup=k+suffix;if(raw&&!localStorage.getItem(backup))localStorage.setItem(backup,raw);}return saveBefore();}catch(e){console.error('Save failed; family transaction will be restored',e);return false;}};
 const timers=new Set();
 function later(fn,ms){const t=setTimeout(()=>{timers.delete(t);fn();},ms);timers.add(t);return t;}
 function restoreLoan(){if(!loanHost)return;const {node,parent,next}=loanHost;parent.insertBefore(node,next?.parentNode===parent?next:null);loanHost=null;}
 function dispose(){restoreLoan();for(const t of timers)clearTimeout(t);timers.clear();overlay?.remove();overlay=null;activeKey=null;document.body.classList.remove('family-event-open');}
 function commit(change){const before=JSON.parse(JSON.stringify(state));try{deferSave=true;const result=change();deferSave=false;if(result===false){state=before;return false;}if(save()===false)throw Error('save failed');return result;}catch(e){deferSave=false;state=before;console.error('Family event transaction restored',e);return false;}}
 function due(){return state?.homeArrival&&state.month>=state.homeArrival.targetMonth&&state.homeArrival.status!=='completed';}
 function priority(){
  if(state.gameOver?.final){showGameOver();return true;}
  if(state.requiredIncident){openRequiredIncident();return true;}
  if(healthTreatmentKind(state.health)||unfinishedTreatment()||isRecoveryMonth(state)){openHealthTreatment();return true;}
  if(housingHandoverDue()){openHousingHandover();return true;}
  return false;
 }
 const roomBefore=openRoom;
 function baseRoom(){internalRoom=true;try{return roomBefore();}finally{internalRoom=false;}}
 function completeArrival(){commit(()=>{if(state.homeArrival)state.homeArrival.status='completed';});}
 function arrive(){
  if(!due())return false;
  dispose();clearModals();pending=false;townVisible=false;
  const m=state.town?.movement;if(m&&!m.resolved&&m.payExpected&&state.month>=m.payExpected){m.payDone=true;resolveTownMove();}
  baseRoom();if(priority())return true;
  // Keep a saved arrival decision across upgrades/moves; never draw both pools.
  const pool=state.homeArrival.eventPool==='shared'&&S?S:state.homeArrival.eventPool==='family'?F:S&&record(S,state.month)?S:record(F,state.month)?F:state.housing==='shared'&&S?S:F;
  let r=record(pool,state.month);
  if(!r){if(commit(()=>{state.homeArrival.eventPool=pool===S?'shared':'family';return pool.draw(state);})===false)return true;r=record(pool,state.month);}
  if(r.status!=='pending'&&!S?.toolboxPending?.(r)){completeArrival();return true;}
  showCard(r,!r.presented);return true;
 }
 function returnFromMap(){
  if(!state||settling)return;
  if(due())return arrive();
  if(priority())return;
  if(townPending()&&!state.town.movement.payExpected)return resumeTownMove();
  const t=townState();
  if(!t.movement||t.movement.resolved)t.movement={id:++t.rolls,to:t.position,die:0,month:state.month,resolved:false,payExpected:state.month+1,returnReason:'home'};
  else t.movement.payExpected??=state.month+1;
  state.homeArrival={fromMonth:state.month,targetMonth:t.movement.payExpected,status:'settling'};
  state.turn={month:state.month,index:9,startCash:state.turn?.month===state.month?state.turn.startCash:state.cash};
  save();clearModals();pending=false;settleMonth();
 }
 openRoom=window.openRoom=function(){if(internalRoom)return roomBefore();if(activeKey)return;if(due())return arrive();if(townEnabled()&&(townVisible||state?.roomLocation==='town'))return returnFromMap();return baseRoom();};
 townHome=openRoom;
 const timeBefore=currentCareerTime;currentCareerTime=function(){const t=timeBefore(),family=state?F.used(state):0,shared=state&&S?S.used(state):0,leave=state?F.leave(state).hours+(S?.leave(state).hours||0):0,credit=state&&D?D.credited(state):0,available=Math.max(0,t.free+leave+credit-family-shared),reserve=state?.housingTimeDebt&&typeof necessaryPetCareHours==='function'?necessaryPetCareHours():0,debt=state&&D?D.allocate(state,{month:state.month,available:Number.isFinite(reserve)?Math.max(0,available-reserve):0,recovery:typeof isRecoveryMonth==='function'&&isRecoveryMonth(state)}):0;return {...t,free:Math.max(0,available-debt),familyHours:family,sharedHours:shared,familyLeaveHours:leave,housingTimeDeferred:credit,housingTimeDebtApplied:debt,workHoursDelta:(t.workHoursDelta||0)-leave,monthlyWork:t.monthlyWork==null?t.monthlyWork:Math.max(0,t.monthlyWork-leave)};};
 // Leave reduces this month's unpaid earnings; never charge cash for wages already paid last month.
 if(typeof coffeeMonthlyIncome==='function'){
  const incomeBefore=coffeeMonthlyIncome;coffeeMonthlyIncome=function(){const x=incomeBefore();if(!x||!state)return x;const l=housingLeave();if(!l.hours)return x;return {...x,extraWages:roundCash(x.extraWages-l.wages),extraTips:roundCash(x.extraTips-l.tips),eventWages:x.eventWages==null?x.eventWages:roundCash(x.eventWages-l.wages),total:roundCash(Math.max(0,x.total-l.wages-l.tips)),familyLeave:l,sharedLeave:!!S?.leave(state).hours};};
  const markupBefore=coffeeIncomeMarkup;coffeeIncomeMarkup=function(x,heading){const html=markupBefore(x,heading);return !x.familyLeave?html:html+'<p class="wl-note">'+(x.sharedLeave?'合租事件请假 ':'家庭照护请假 ')+x.familyLeave.hours+'h：工资 −'+priceText(x.familyLeave.wages)+'，小费 −'+priceText(x.familyLeave.tips)+'（已计入上方收入调整）</p>';};
 }
 if(typeof calcMetrics==='function'){
  const metricsBefore=calcMetrics;calcMetrics=function(){const m=metricsBefore();if(!state||m.careerIncome||isRecoveryMonth(state))return m;const l=housingLeave();if(!l.hours||!state.job||state.retired||state.unemployedMonths)return m;const gross=Math.max(0,m.grossSalary-l.wages-l.tips),contrib=roundCash(gross*(state.retirement?.k401Rate||0)),lost=roundCash(m.grossSalary-gross-(m.kContrib-contrib));return {...m,grossSalary:gross,kContrib:contrib,remainingCF:roundCash(m.remainingCF-lost),monthlyCF:roundCash(m.monthlyCF-lost)};};
 }
 const settleBefore=settleMonth;settleMonth=function(){
  if(activeKey||settling)return;
  const m=state?.town?.movement;
  if(townEnabled()&&m&&!m.resolved&&m.payExpected&&state.month<m.payExpected){
   state.homeArrival??={fromMonth:state.month,targetMonth:m.payExpected,status:'settling'};
   if(state.homeArrival.status==='completed')state.homeArrival={fromMonth:state.month,targetMonth:m.payExpected,status:'settling'};
   save();
  }
  settling=true;try{return settleBefore();}finally{settling=false;}
 };
 const auditBefore=showMonthlyAudit;showMonthlyAudit=function(s){if(due()){state.homeArrival.status='ready';save();}return auditBefore(s);};
 const monthBefore=monthlyEvent;monthlyEvent=function(){if(due())return arrive();return monthBefore();};
 const finishBefore=finish;finish=function(){if(activeKey)return;if(due())return arrive();return finishBefore();};
 const loadBefore=openGame;openGame=function(){dispose();const result=loadBefore();if(due())arrive();return result;};
 const homeBefore=home;home=function(){dispose();return homeBefore();};
 const showTownBefore=showTown;showTown=function(){if(activeKey)return;if(due())return arrive();return showTownBefore();};
 const rollBefore=rollTown;rollTown=function(){if(activeKey)return;if(due())return arrive();return rollBefore();};
 // Migrated themes belong to the family housing pool, not a second map/age draw.
 const eligibleBefore=eventEligible;eventEligible=function(name){if(['父母需要帮助','父母照护'].includes(name))return false;if(state?.housing==='family'&&['家电损坏','家用电器损坏'].includes(name))return false;return eligibleBefore(name);};
 const incidentBefore=requireIncident;requireIncident=function(name,...args){if(state?.housing==='family'&&['家电损坏','家用电器损坏'].includes(name))return finish();return incidentBefore(name,...args);};
 function effectText(o,hideEmpty=false){const a=[];if(o.cash)a.push('现金 '+(o.cash>0?'+':'−')+'$'+Math.abs(o.cash));if(o.hours)a.push('自由时间 −'+o.hours+'小时');for(const [k,label]of [['energy','能量'],['happiness','幸福度'],['stress','压力']])if(o[k])a.push(label+' '+(o[k]>0?'+':'−')+Math.abs(o[k]));return a.join(' · ')||(hideEmpty?'':'不消耗时间 · 属性不变');}
 function selected(r,index){
  if(!activeKey)return;
  if(deferredPlan(poolOf(r),r,index))return previewDeferred(poolOf(r),r,index);
  if(r?.cardId==='care'&&r.status==='pending'&&r.month===state.month){const plan=carePlan(r,index);if(plan&&(plan.hours||state.cash<plan.cost))return previewCare(r,index);}
  const pool=poolOf(r),reasons=pool.missing(state,r,index,currentCareerTime().free,necessaryPetCareHours());
  if(pool===S&&reasons.length)return previewShared(r,index);
  if(reasons.length){status(reasons.join('；')+'，尚未结算。');return;}
  const ok=commit(()=>{if(!pool.resolve(state,r.month,r.cardId,index,currentCareerTime().free,necessaryPetCareHours()))return false;if(state.homeArrival)state.homeArrival.status=S?.toolboxPending?.(r)?'ready':'completed';return true;});
  if(ok!==true){status('暂未保存，未结算，请重试。');return;}
  if(S?.toolboxPending?.(record(pool,r.month)))return showCard(record(pool,r.month),false);
  dispose();baseRoom();
 }
 function payRates(){
  const t=currentCareerTime(),working=!!state.job&&!state.retired&&!state.unemployedMonths&&!isRecoveryMonth(state);
  const coffee=typeof coffeeWorking==='function'&&coffeeWorking(),shift=typeof shiftWorking==='function'&&shiftWorking();
  const q=typeof coffeeQuoteContext==='function'?coffeeQuoteContext():{annualSalary:state.annualSalary||state.salary*12,weeklyHours:t.weeklyHours};
  const wageRate=working&&q.weeklyHours>0?q.annualSalary/(52*q.weeklyHours):0;
  const tipRate=working&&(coffee||shift)?coffeeSeason(coffeeCalendar().month).tips/23/8*(shift?1.3:1):0;
  return {working,availableWorkHours:t.monthlyWork??t.weeklyHours*4,wageRate,tipRate};
 }
 function carePlan(r,index){return F.carePlan(state,r,index,currentCareerTime().free,necessaryPetCareHours(),payRates());}
 function deferredPlan(pool,r,index){return D?.plan(state,pool,pool===S?'sharedEvents':'familyEvents',r,index,currentCareerTime().free,necessaryPetCareHours(),payRates());}
 function previewDeferred(pool,r,index){
  const p=deferredPlan(pool,r,index);if(!p)return status('当前条件已变化，请返回本卡重新选择。');
  const o=pool.cards.find(c=>c.id===r.cardId).choices[index],month=r.month,id=r.cardId,chosenSlot=slot,token=activeKey;
  let panel=overlay.querySelector('.family-care-panel');if(!panel){panel=document.createElement('section');panel.className='family-care-panel';overlay.append(panel);}
  overlay.querySelector('.family-revealed').hidden=true;const short=Math.max(0,p.cost-state.cash);
  panel.innerHTML='<h2>安排所需时间</h2><p>'+esc(o.label)+'</p><p>'+esc(effectText(o))+'</p><p>当前没有可请假的在职工时，缺少的 '+p.hours+' 小时将从下一个有可用自由时间的月份开始扣除。本次不扣工资或小费，也不会推进月份。</p>'+(short?'<p>现金还差 '+priceText(short)+'，请先办理贷款，到账后再确认支付。</p>':'')+'<button type="button" data-deferred-confirm>'+(short?'先申请贷款':'确认本次安排及时间顺延')+'</button><button type="button" data-deferred-back>返回本卡选项</button>';
  const valid=()=>slot===chosenSlot&&activeKey===token&&state.month===month&&record(pool,month)?.cardId===id&&record(pool,month).status==='pending'?record(pool,month):null;
  panel.querySelector('[data-deferred-back]').onclick=()=>{if(!valid())return;panel.remove();overlay.querySelector('.family-revealed').hidden=false;overlay.querySelector('.family-choice')?.focus();};
  const b=panel.querySelector('[data-deferred-confirm]');b.onclick=()=>{const now=valid();if(!now)return;const fresh=deferredPlan(pool,now,index);if(!fresh)return;if(state.cash<fresh.cost)return deferredLoan(pool,now,index,fresh.cost-state.cash);
   const ok=commit(()=>{if(!D.resolve(state,pool,pool===S?'sharedEvents':'familyEvents',month,id,index,currentCareerTime().free,necessaryPetCareHours(),payRates()))return false;if(state.homeArrival)state.homeArrival.status='completed';return true;});
   if(ok!==true){showCard(record(pool,month),false);status('暂未保存，事件和顺延时间均未结算，请重试。');return;}dispose();baseRoom();
  };b.focus();
 }
 function deferredLoan(pool,r,index,short){
  const month=r.month,id=r.cardId,chosenSlot=slot,token=activeKey;let returned=false;
  const valid=()=>slot===chosenSlot&&activeKey===token&&state.month===month&&record(pool,month)?.cardId===id&&record(pool,month).status==='pending'?record(pool,month):null;
  const back=()=>{restoreLoan();clearModals();const now=valid();if(!now)return;showCard(now,false);if(deferredPlan(pool,now,index))previewDeferred(pool,now,index);};
  openBankLoan(short,{after:()=>{if(deferSave){returned=true;return;}back();}});
  const node=el('eventTitle').closest('.card');loanHost={node,parent:node.parentNode,next:node.nextSibling};overlay.querySelector('.family-care-panel').hidden=true;overlay.append(node);node.inert=false;node.setAttribute('aria-hidden','false');
  const b=el('actions').firstElementChild,handler=b.onclick;b.onclick=e=>{if(!loanHost||!valid())return;const count=state.loans.length;returned=false;const ok=commit(()=>{handler(e);return returned&&state.loans.length===count+1;});back();if(ok!==true)status('贷款未保存，未新增借款，也未结算事件或顺延时间，请重试。');};el('wlLoanAmount').focus();
 }
 function sharedPlan(r,index){const free=currentCareerTime().free,reserve=necessaryPetCareHours(),p=S.plan(state,r,index,free,reserve,payRates());if(p?.hours&&!S.cards.find(c=>c.id===r.cardId).choices.every((_,i)=>S.missing(state,r,i,free,reserve).length))return null;return p;}
 function previewShared(r,index){
  const p=sharedPlan(r,index);if(!p)return status('此选项的自由时间不足，请返回选择可完成的另一项；暂未扣款。');
  const o=S.cards.find(c=>c.id===r.cardId).choices[index],month=r.month,id=r.cardId,chosenSlot=slot,token=activeKey;
  let panel=overlay.querySelector('.family-care-panel');if(!panel){panel=document.createElement('section');panel.className='family-care-panel';overlay.append(panel);}
  overlay.querySelector('.family-revealed').hidden=true;
  const short=Math.max(0,p.cost-state.cash);
  panel.innerHTML='<h2>处理当前安排</h2><p>'+esc(o.label)+'</p><p>'+esc(effectText(o))+'</p>'+(p.hours?'<p>需请假 '+p.hours+' 小时补足时间。本月月底工资减少 '+priceText(p.wages)+'，小费减少 '+priceText(p.tips)+'。</p>':'')+(short?'<p>现金还差 '+priceText(short)+'。请先办理贷款，到账后再确认支付。</p>':'')+'<button type="button" data-shared-confirm>'+(short?'先申请贷款':'确认'+(p.hours?'请假并':'')+'完成安排')+'</button><button type="button" data-shared-back>返回本卡选项</button>';
  const valid=()=>slot===chosenSlot&&activeKey===token&&record(S,month)?.cardId===id&&record(S,month).status==='pending'&&state.month===month?record(S,month):null;
  panel.querySelector('[data-shared-back]').onclick=()=>{const now=valid();if(!now)return;panel.remove();overlay.querySelector('.family-revealed').hidden=false;overlay.querySelector('.family-choice')?.focus();};
  const b=panel.querySelector('[data-shared-confirm]');b.onclick=()=>{const now=valid();if(!now)return;const fresh=sharedPlan(now,index);if(!fresh)return;if(state.cash<fresh.cost)return sharedLoan(now,index,fresh.cost-state.cash);
   const ok=commit(()=>{if(!S.resolveWithLeave(state,month,index,currentCareerTime().free,necessaryPetCareHours(),payRates()))return false;if(state.homeArrival)state.homeArrival.status=S.toolboxPending(record(S,month))?'ready':'completed';return true;});
   if(ok!==true){showCard(record(S,month),false);status('暂未保存，事件、请假和付款均未结算，请重试。');return;}if(S.toolboxPending(record(S,month)))return showCard(record(S,month),false);dispose();baseRoom();
  };b.focus();
 }
 function sharedLoan(r,index,short){
  const month=r.month,id=r.cardId,chosenSlot=slot,token=activeKey;let returned=false;
  const valid=()=>slot===chosenSlot&&activeKey===token&&state.month===month&&record(S,month)?.cardId===id&&record(S,month).status==='pending'?record(S,month):null;
  const back=()=>{restoreLoan();clearModals();const now=valid();if(!now)return;showCard(now,false);previewShared(now,index);};
  openBankLoan(short,{after:()=>{if(deferSave){returned=true;return;}back();}});
  const node=el('eventTitle').closest('.card');loanHost={node,parent:node.parentNode,next:node.nextSibling};overlay.querySelector('.family-care-panel').hidden=true;overlay.append(node);node.inert=false;node.setAttribute('aria-hidden','false');
  const button=el('actions').firstElementChild,handler=button.onclick;button.onclick=e=>{if(!loanHost||!valid())return;const count=state.loans.length;returned=false;const ok=commit(()=>{handler(e);return returned&&state.loans.length===count+1;});back();if(ok!==true)status('贷款未保存，未新增借款，也未支付事件费用，请重试。');};el('wlLoanAmount').focus();
 }
 function currentCare(month){const r=state?.familyEvents?.records[month];return r?.cardId==='care'&&r.status==='pending'&&r.month===state.month?r:null;}
 function previewCare(r,index){
  const p=carePlan(r,index);if(!p)return status('当前无法安排请假，请重新检查照护选项。');
  let panel=overlay.querySelector('.family-care-panel');if(!panel){panel=document.createElement('section');panel.className='family-care-panel';overlay.append(panel);}
  const o=F.cards.find(c=>c.id==='care').choices[index],short=Math.max(0,p.cost-state.cash),month=r.month,chosenSlot=slot;
  overlay.querySelector('.family-revealed').hidden=true;
  panel.innerHTML='<h2>安排家庭照护</h2><p>'+esc(o.label)+'</p><p>'+esc(effectText(o))+'</p>'+(p.hours?'<p>自由时间不足，需请假 <b>'+p.hours+' 小时</b>补足。本月月底工资减少 '+priceText(p.wages)+'，小费减少 '+priceText(p.tips)+'。上月已结算收入不变。</p>':'<p>自由时间足够，无需请假。</p>')+'<p>本次现金支出 '+priceText(p.cost)+(short?'，尚缺 '+priceText(short)+'。请先申请贷款，到账后再确认支付。':'。')+'</p><button type="button" data-care-confirm></button><button type="button" data-care-back>返回照护选项</button>';
  const valid=()=>slot===chosenSlot&&activeKey===month+':care'&&currentCare(month);
  const b=panel.querySelector('[data-care-confirm]');b.textContent=short?'先申请贷款':'确认'+(p.hours?'请假并':'')+'完成照护';
  b.onclick=()=>{const now=valid();if(!now)return;const fresh=carePlan(now,index);if(!fresh)return;if(state.cash<fresh.cost)return careLoan(now,index,fresh.cost-state.cash);
   const ok=commit(()=>{const t=currentCareerTime(),reserve=necessaryPetCareHours(),rates={working:true,availableWorkHours:t.monthlyWork??t.weeklyHours*4,wageRate:fresh.hours?fresh.wages/fresh.hours:0,tipRate:fresh.hours?fresh.tips/fresh.hours:0};if(!F.resolveCare(state,month,index,t.free,reserve,rates))return false;if(state.homeArrival)state.homeArrival.status='completed';return true;});
   if(ok!==true){showCard(currentCare(month),false);status('暂未保存，照护和请假均未结算，请重试。');return;}dispose();baseRoom();
  };
  panel.querySelector('[data-care-back]').onclick=()=>{if(!valid())return;panel.remove();overlay.querySelector('.family-revealed').hidden=false;overlay.querySelector('.family-choice')?.focus();};b.focus();
 }
 function careLoan(r,index,short){
  const month=r.month,chosenSlot=slot;let returned=false;
  const valid=()=>slot===chosenSlot&&activeKey===month+':care'&&currentCare(month);
  const back=()=>{restoreLoan();clearModals();const now=valid();if(!now)return;showCard(now,false);previewCare(now,index);};
  // Host the existing bank form inside the locked family dialog, keeping its amount,
  // term, APR and repayment rules. Cancelling returns to the same unpaid card.
  openBankLoan(short,{after:()=>{if(deferSave){returned=true;return;}back();}});
  const node=el('eventTitle').closest('.card');loanHost={node,parent:node.parentNode,next:node.nextSibling};overlay.querySelector('.family-care-panel').hidden=true;overlay.append(node);node.inert=false;node.setAttribute('aria-hidden','false');
  const confirm=el('actions').firstElementChild,handler=confirm.onclick;
  confirm.onclick=event=>{if(!loanHost||!valid())return;const count=state.loans.length;returned=false;
   const ok=commit(()=>{handler(event);return returned&&state.loans.length===count+1;});
   back();if(ok!==true)status('贷款暂未保存，未新增借款，也未支付照护费用，请重试。');
  };el('wlLoanAmount').focus();
 }
 function status(message){let p=overlay?.querySelector('.family-status');if(p){p.textContent=message;p.hidden=false;p.focus();}}
 function showCard(r,animate){
  dispose();const pool=poolOf(r),followup=pool===S&&S.toolboxPending(r),c=followup?S.toolboxCard(r):pool.cards.find(c=>c.id===r.cardId);if(!c)return;activeKey=r.month+':'+(pool===S?'shared:':'')+r.cardId+(followup?':followup':'');
  const face=pool===S?(c.art||'assets/shared/'+c.id+'-20261102.webp'):asset(c.id);
  const back=pool===S?'assets/shared/back-20261102.webp':asset('back');
  // Before any animation or skip control is shown, persist the exact selected card.
  if(!r.presented&&commit(()=>{r.presented=true;})===false){activeKey=null;return;}
  overlay=document.createElement('section');overlay.id='familyHomeEvent';overlay.className='family-home-event';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','居住事件：'+c.title);
  overlay.innerHTML='<div class="family-backdrop"></div><div class="family-stage"><header class="family-welcome"><h1>欢迎回家</h1><p>家里的小故事，正在发生</p></header><div class="family-orbit">'+[0,1,2,3].map(i=>'<img class="family-satellite satellite-'+i+'" src="'+back+'" alt="" aria-hidden="true">').join('')+'</div><div class="family-flipper"><div class="family-back"><img src="'+back+'" alt="卡片背面"></div><div class="family-front"><img src="'+face+'" alt="'+esc(c.title)+'"></div></div><button type="button" class="family-skip">跳过动画</button></div><div class="family-revealed" hidden></div><p class="family-status" role="status" tabindex="-1" hidden></p>';
  document.body.append(overlay);document.body.classList.add('family-event-open');
  const final=overlay.querySelector('.family-revealed');
  final.innerHTML='<div class="family-face"><img src="'+face+'" alt="'+esc(c.title+'。'+c.desc)+'">'+c.choices.map((o,i)=>{const text=effectText(o,pool===S),label=o.label+(text?'；'+text:'');return '<button type="button" class="family-choice family-choice-'+i+'" data-family-choice="'+i+'" aria-label="'+esc(label)+'"><span class="family-sr">'+esc(label)+'</span></button>';}).join('')+'</div><div class="family-accessible"><h2>'+esc(c.title)+'</h2><p>'+esc(c.desc)+'</p></div>';
  final.querySelector('.family-face').dataset.card=c.id;
  const chosenSlot=slot,token=activeKey;final.querySelector('.family-face').dataset.pool=pool===S?'shared':'family';
  final.querySelectorAll('[data-family-choice]').forEach(b=>{const i=Number(b.dataset.familyChoice),miss=followup?[]:pool.missing(state,r,i,currentCareerTime().free,necessaryPetCareHours());b.setAttribute('aria-disabled',String(!!miss.length&&!deferredPlan(pool,r,i)&&!(pool===S?sharedPlan(r,i):r.cardId==='care'&&carePlan(r,i))));if(pool===S&&c.hotspots){const box=c.hotspots[i];b.style.top=box[0]+'%';b.style.height=box[1]+'%';}b.onclick=()=>{if(slot!==chosenSlot||activeKey!==token||state.month!==r.month)return;const fresh=record(pool,r.month);if(fresh?.cardId!==r.cardId)return;if(followup){if(!S.toolboxPending(fresh))return;const ok=commit(()=>{if(!S.claimToolbox(state,r.month))return false;if(state.homeArrival)state.homeArrival.status='completed';return true;});if(ok!==true){status('暂未保存，奖励未领取，请重试。');return;}dispose();baseRoom();return;}if(fresh.status!=='pending')return;selected(fresh,i);};});
  const reveal=()=>{if(!overlay)return;for(const t of timers)clearTimeout(t);timers.clear();overlay.classList.add('revealed');overlay.querySelector('.family-stage').hidden=true;final.hidden=false;final.querySelector('button')?.focus({preventScroll:true});};
  overlay.querySelector('.family-skip').onclick=reveal;
  if(!animate||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){reveal();return;}
  // Five backs emerge, orbit for 1.6 seconds, one is selected, then a real 3D flip.
  later(()=>overlay?.classList.add('orbiting'),100);
  later(()=>overlay?.classList.add('chosen'),1700);
  later(()=>overlay?.classList.add('flipping'),2200);
  later(reveal,2950);
 }
 document.addEventListener('click',e=>{if(activeKey&&!e.target.closest('#familyHomeEvent')){e.preventDefault();e.stopImmediatePropagation();}},true);
 document.addEventListener('keydown',e=>{if(!activeKey)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();}if(e.key==='Tab'){const buttons=[...overlay.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(b=>!b.disabled&&b.getClientRects().length);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}},true);
})();

