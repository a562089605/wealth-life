// Existing life landings own the draw; there is no new home activity or paid interaction.
(function(){'use strict';
 const P=PetMapEvents;let active=null;
 const el=(tag,text,cls='')=>{const e=document.createElement(tag);e.className=cls;e.textContent=text;return e;};
 const current=()=>state?.town?.movement;
 const record=()=>current()&&state.petMapEvents?.records[P.key(state,current())];
 function close(){active?.remove();active=null;document.body.classList.remove('pet-pages-open');}
 function persist(){const k=key(slot),raw=localStorage.getItem(k);for(const suffix of ['_before_pet_events_20261105','_before_pet35_20261106']){const bk=k+suffix;if(raw&&!localStorage.getItem(bk))localStorage.setItem(bk,raw);}return save();}
 function show(){close();const r=record();if(!r||r.status!=='pending')return false;
  clearModals();window.PetPages?.close();window.PetAdoptionEntry?.close();const owner=state,chosenSlot=slot,k=r.key,q=r.quote;
  const node=el('section','','pet-pages-overlay pet-map-overlay');node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label',q.title);document.body.append(node);active=node;document.body.classList.add('pet-pages-open');
  const valid=()=>active===node&&node.isConnected&&state===owner&&slot===chosenSlot&&record()?.key===k&&record()?.status==='pending'&&state.month===r.month;
  const wrap=el('div','','pet-map-wrap');node.append(wrap);wrap.append(el('p',q.petName,'pet-map-name'));
  const card=el('div','','pet-map-card');wrap.append(card);const picture=el('img','','pet-map-art');picture.alt=q.title;
  const art=P.cardForRecord(r),medical=q.medical??['unwell','injury'].includes(r.id);
  if(art){picture.src=art.art;card.dataset.card=art.id;card.append(picture);}else{
   card.classList.add('pet-map-generic');card.append(el('p','生活事件卡·宠物','pet-map-category'),el('h2',q.title));const hero=el('div','','pet-map-portrait');picture.src='assets/pets/success-'+q.species+'-20261104.webp';hero.append(picture);card.append(hero,el('p',q.petName+(r.id==='unwell'?'有些不舒服，带它去看看医生吧。':r.id==='injury'?'玩耍时受伤了，带它去处理伤口吧。':'不小心弄坏了家里的东西，需要收拾和更换。')));
  }
  const status=el('p','','pet-message');status.setAttribute('role','status');
  const controls=art?card:el('div','','pet-map-summary');if(controls!==card)card.append(controls);
  if(!art){
   if(['unwell','injury'].includes(r.id)&&q.coverage!==null)controls.append(el('p','宠物保险已生效','pet-map-insurance'));
   const stats=el('dl','','pet-map-stats'),rows=[];
   if(q.cost)rows.push([['unwell','injury'].includes(r.id)?'预计自付':'本次费用',priceText(q.cost)]);
   rows.push(['自由时间','−'+q.hours+'小时'],['能量',(q.energy>0?'+':'')+q.energy],['压力',(q.stress>0?'+':'')+q.stress]);if(q.happiness)rows.push(['幸福度','+'+q.happiness]);
   for(const [label,value]of rows){stats.append(el('dt',label),el('dd',value));}controls.append(stats);
   if(q.contact){const c=q.contact;controls.append(el('p','新朋友：'+c.name+' · '+(c.gender==='female'?'女':'男')+' · '+c.age+'岁 · '+c.job),el('p','初始亲密度 10'));}
  }
  if(art){
   const summary=[['自由时间',q.hours+'小时'],['能量',q.energy||0],['幸福度',q.happiness||0],['压力',q.stress||0]];
   if(q.gross)summary.unshift([medical?'预计自付':'本次费用',priceText(q.cost)]);
   card.append(el('p',summary.map(([k,v])=>k+' '+v).join('；'),'pet-map-accessible'));
   if(medical&&q.cost!==q.gross){const amount=el('span',priceText(q.cost),'pet-map-medical-price');const box=art.priceBox;['left','top','width','height'].forEach((k,i)=>amount.style[k]=box[i]+'%');if(r.id==='injury'||r.id==='accident')amount.classList.add('pet-map-injury-price');card.append(amount);}
  }
  const pay=el('button',q.button,art?'pet-hit pet-map-confirm':'pet-solid-button');pay.type='button';controls.append(pay);
  if(art)['left','top','width','height'].forEach((k,i)=>pay.style[k]=art.buttonBox[i]+'%');
  if(art&&q.contact){const c=q.contact;wrap.append(el('p','新朋友：'+c.name+' · '+(c.gender==='female'?'女':'男')+' · '+c.age+'岁 · '+c.job,'pet-map-contact'));}
  if(art&&medical&&q.cost!==q.gross)wrap.append(el('p','本次保险承担 '+priceText(q.gross-q.cost)+' · 自付 '+priceText(q.cost),'pet-map-coverage'));
  function refresh(){const now=record()?.quote;pay.disabled=!valid()||!now||state.cash<now.cost||!r.forced&&currentCareerTime().free<now.hours;}
  pay.onclick=()=>{if(!valid()||pay.disabled)return;pay.disabled=true;const free=currentCareerTime().free;
   const ok=P.atomic(state,()=>P.execute(state,k,{free,forcedTime:x=>recordForcedEventTime(state,x)}),persist);
   if(!ok){status.textContent='暂未完成，请重试。';refresh();return;}
   close();render();finish();
  };
  wrap.append(status);
  if(state.cash<q.cost){const funding=el('button','查看资金处理','pet-solid-button');funding.onclick=()=>{if(!valid())return;close();showFundingOptions(q.cost,()=>{if(state===owner&&slot===chosenSlot&&record()?.key===k)show();});};wrap.append(funding);}
  if(!r.forced&&currentCareerTime().free<q.hours)status.textContent='自由时间不足。';
  const later=el('button','返回地图，稍后处理','pet-solid-button');later.onclick=()=>{if(!valid())return;close();render();};wrap.append(later);refresh();pay.disabled?later.focus({preventScroll:true}):pay.focus({preventScroll:true});return true;
 }
 const timeBefore=currentCareerTime;currentCareerTime=function(){const t=timeBefore();return state?{...t,free:Math.max(0,t.free-(state.petMapEvents?.hours[state.month]||0))}:t;};
 const landingBefore=openTownLanding;openTownLanding=function(){const move=current();if(!townEnabled()||!move||move.resolved||TOWN_TYPES[move.to]!=='life')return landingBefore();
  const k=P.key(state,move);if(!state.petMapEvents?.records[k]){
   const owner=state,ok=P.atomic(state,()=>{move.opened=true;P.draw(state,move,{free:currentCareerTime().free,names:NPC_NAMES,jobs:NPC_JOBS});},persist);
   if(!ok){showEvent('生活事件','暂未保存','请重试。',[],[['重新打开',()=>{if(state===owner)openTownLanding();},true]]);return;}
  }
  const r=record();if(r?.status==='pending')return show();if(r?.status==='resolved')return;return landingBefore();
 };
 // Resolve a drawn mandatory medical/property event before a zero-time return or another finish action.
 const waitingForcedPet=()=>{const r=record(),m=current();return townEnabled()&&!state.gameOver?.final&&!state.financialCrisis?.finalConfirmed&&!isRecoveryMonth(state)&&!(state.crisis&&state.crisis.ackMonth!==state.month)&&m&&!m.resolved&&r?.status==='pending'&&r.forced&&r.month===state.month&&!state.requiredIncident&&!unfinishedTreatment()&&!healthTreatmentKind(state.health);};
 const markReturnBefore=markExplorationReturn;markExplorationReturn=function(){if(waitingForcedPet())return false;return markReturnBefore.apply(this,arguments);};
 const forcedReturnBefore=openForcedTimeReturn;openForcedTimeReturn=function(){if(waitingForcedPet())return show();return forcedReturnBefore.apply(this,arguments);};
 const forcedFinishBefore=finish;finish=function(){if(waitingForcedPet())return show();return forcedFinishBefore.apply(this,arguments);};
 for(const name of ['home','openGame','openRoom']){const before=window[name];window[name]=function(...args){close();return before.apply(this,args);};}
 const rollBefore=rollTown;rollTown=function(){if(active?.isConnected)return;return rollBefore();};
 const showBefore=showEvent;showEvent=function(type,...args){if(type==='读档成功'&&townEnabled()&&record()?.status==='pending'&&!state.gameOver?.final&&!state.financialCrisis?.finalConfirmed&&!state.requiredIncident&&!unfinishedTreatment()&&!healthTreatmentKind(state.health)&&!timeReturnPending())return show();return showBefore(type,...args);};
 document.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Escape'){e.preventDefault();close();render();}if(e.key==='Tab'){const list=[...active.querySelectorAll('button:not(:disabled)')],first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
 window.PetMapEventUI={show,close};
})();
