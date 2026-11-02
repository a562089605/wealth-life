// Return-home lifecycle and portrait card animation. Existing settlement remains authoritative.
(function(){
 const F=FamilyEvents,el=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const asset=id=>'assets/family/'+id+'-20261102.webp';
 let overlay=null,activeKey=null,settling=false,internalRoom=false;
 const saveBefore=save;save=function(){if(!state)return;try{const k=key(slot),backup=k+'_before_family_20261102',raw=localStorage.getItem(k);if(raw&&!localStorage.getItem(backup))localStorage.setItem(backup,raw);return saveBefore();}catch(e){console.error('Save failed; family transaction will be restored',e);return false;}};
 const timers=new Set();
 function later(fn,ms){const t=setTimeout(()=>{timers.delete(t);fn();},ms);timers.add(t);return t;}
 function dispose(){for(const t of timers)clearTimeout(t);timers.clear();overlay?.remove();overlay=null;activeKey=null;document.body.classList.remove('family-event-open');}
 function commit(change){const before=JSON.parse(JSON.stringify(state));try{const result=change();if(save()===false)throw Error('save failed');return result;}catch(e){state=before;console.error('Family event transaction restored',e);return false;}}
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
  let r=state.familyEvents?.records[state.month];
  if(!r){if(commit(()=>F.draw(state))===false)return true;r=state.familyEvents.records[state.month];}
  if(r.status!=='pending'){completeArrival();return true;}
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
 const timeBefore=currentCareerTime;currentCareerTime=function(){const t=timeBefore(),used=state?F.used(state):0;return {...t,free:Math.max(0,t.free-used),familyHours:used};};
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
 function effectText(o){const a=[];if(o.cash)a.push('现金 '+(o.cash>0?'+':'−')+'$'+Math.abs(o.cash));if(o.hours)a.push('自由时间 −'+o.hours+'小时');for(const [k,label]of [['energy','能量'],['happiness','幸福度'],['stress','压力']])if(o[k])a.push(label+' '+(o[k]>0?'+':'−')+Math.abs(o[k]));return a.join(' · ')||'不消耗时间 · 属性不变';}
 function selected(r,index){
  if(!activeKey)return;const reasons=F.missing(state,r,index,currentCareerTime().free,necessaryPetCareHours());
  if(reasons.length){status(reasons.join('；')+'，尚未结算。');return;}
  const ok=commit(()=>{if(!F.resolve(state,r.month,r.cardId,index,currentCareerTime().free,necessaryPetCareHours()))return false;if(state.homeArrival)state.homeArrival.status='completed';return true;});
  if(ok!==true){status('暂未保存，未结算，请重试。');return;}
  dispose();baseRoom();
 }
 function status(message){let p=overlay?.querySelector('.family-status');if(p){p.textContent=message;p.hidden=false;p.focus();}}
 function showCard(r,animate){
  dispose();const c=F.cards.find(c=>c.id===r.cardId);if(!c)return;activeKey=r.month+':'+r.cardId;
  // Before any animation or skip control is shown, persist the exact selected card.
  if(commit(()=>{r.presented=true;})===false){activeKey=null;return;}
  overlay=document.createElement('section');overlay.id='familyHomeEvent';overlay.className='family-home-event';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','居住事件：'+c.title);
  overlay.innerHTML='<div class="family-backdrop"></div><div class="family-stage"><header class="family-welcome"><h1>欢迎回家</h1><p>家里的小故事，正在发生</p></header><div class="family-orbit">'+[0,1,2,3].map(i=>'<img class="family-satellite satellite-'+i+'" src="'+asset('back')+'" alt="" aria-hidden="true">').join('')+'</div><div class="family-flipper"><div class="family-back"><img src="'+asset('back')+'" alt="卡片背面"></div><div class="family-front"><img src="'+asset(c.id)+'" alt="'+esc(c.title)+'"></div></div><button type="button" class="family-skip">跳过动画</button></div><div class="family-revealed" hidden></div><p class="family-status" role="status" tabindex="-1" hidden></p>';
  document.body.append(overlay);document.body.classList.add('family-event-open');
  const final=overlay.querySelector('.family-revealed');
  final.innerHTML='<div class="family-face"><img src="'+asset(c.id)+'" alt="'+esc(c.title+'。'+c.desc)+'">'+c.choices.map((o,i)=>'<button type="button" class="family-choice family-choice-'+i+'" data-family-choice="'+i+'" aria-label="'+esc(o.label+'；'+effectText(o))+'"><span class="family-sr">'+esc(o.label+'。'+effectText(o))+'</span></button>').join('')+'</div><div class="family-accessible"><h2>'+esc(c.title)+'</h2><p>'+esc(c.desc)+'</p></div>';
  final.querySelector('.family-face').dataset.card=c.id;
  final.querySelectorAll('[data-family-choice]').forEach(b=>{const i=Number(b.dataset.familyChoice),miss=F.missing(state,r,i,currentCareerTime().free,necessaryPetCareHours());b.setAttribute('aria-disabled',String(!!miss.length));b.onclick=()=>selected(state.familyEvents.records[r.month],i);});
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
 document.addEventListener('keydown',e=>{if(!activeKey)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();}if(e.key==='Tab'){const buttons=[...overlay.querySelectorAll('button')].filter(b=>b.getClientRects().length);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}},true);
})();
