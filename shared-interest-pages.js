// Render already-saved events only; no automatic map selection is enabled here.
(function(){'use strict';const C=SharedInterestCards;let active=null;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
 const current=()=>C.current(state),waiting=()=>{const r=current();return !!r&&r.month===state.month&&!state.town.movement.resolved&&['pending','followup'].includes(r.status);};
 const blocked=()=>!state||state.requiredIncident||state.gameOver?.final||unfinishedTreatment()||healthTreatmentKind(state.health)||isRecoveryMonth(state);
 const opts=()=>({free:currentCareerTime().free,reserve:typeof necessaryPetCareHours==='function'?necessaryPetCareHours():0,recovery:isRecoveryMonth(state),save});
 function close(){active?.remove();active=null;document.body.classList.remove('shared-interest-open');}
 const text={funds:'现金不足，请先筹措费用。',time:'自由时间不足，或需预留宠物照护时间。',energy:'能量不足，请先休息。',recovery:'请先处理当前健康或必要事项。',stale:'页面已过期，请重新打开。',save:'本次未保存，所有变化已撤回，请重试。'};
 function stats(e,hobby){const d=el('dl',null,'interest-stats');
  for(const [k,label]of [['cash','金钱'],['hours','自由时间'],['energy','能量'],['xp',hobby==='tasting'?'品鉴经验':HobbyLearning.activities[hobby].name+'经验'],['happiness','幸福度'],['stress','压力'],['intimacy','亲密度']]){
   if(!e[k])continue;const v=e[k],row=el('div');row.append(el('dt',label),el('dd',k==='cash'?(v>0?'+':'−')+money(Math.abs(v)):k==='hours'?'−'+v+'小时':(v>0?'+':'−')+Math.abs(v)+(k==='xp'?' XP':'')));d.append(row);
  }return d;
 }
 function open(){if(!waiting()||blocked())return false;close();clearModals();window.RelationshipPages?.close();window.HobbyPages?.close();window.hideRoom?.();
  const r=current(),def=C.cards[r.kind];if(!def)return false;
  const owner=state,chosen=slot,id=r.id,phase=r.status,follow=phase==='followup',art=follow?r.lockedOutcome:def;
  const title=art.title,section=el('section',null,'interest-overlay');active=section;section.setAttribute('role','dialog');section.setAttribute('aria-modal','true');section.setAttribute('aria-label',title);document.body.append(section);document.body.classList.add('shared-interest-open');
  const paper=el('div',null,'interest-paper'),scene=el('div',null,'interest-scene'),img=el('img');img.src=art.art;img.alt='';scene.append(img);paper.append(scene);section.append(paper);
  const body=el('div',null,'interest-content');paper.append(body);body.append(el('p',HobbyLearning.activities[r.hobby].name+' · '+r.personName,'interest-person'),el('h1',title),el('p',follow?art.scene:def.scene,'interest-story'));
  const valid=()=>active===section&&section.isConnected&&state===owner&&slot===chosen&&state.month===r.month&&current()?.id===id&&current()?.status===phase;
  const message=el('p',null,'interest-message');message.setAttribute('role','status');
  const choices=follow?[{label:art.label}]:r.options;
  choices.forEach((q,index)=>{
   const quote=C.quote(state,r,index,opts()),effects=quote.ok?quote.effects:{...(follow?art.effects:q.effects)};
   if(effects.xp)effects.xp=Math.min(effects.xp,Math.max(0,800-HobbyLearning.xp(state,r.hobby)));
   const box=el('div',null,'interest-option '+(index===1?'interest-option-b':'')),b=el('button',q.label,'interest-action');b.type='button';box.append(b,stats(effects,r.hobby));body.append(box);
   if(!quote.ok){box.append(el('p',text[quote.reason]||'暂不能结算','interest-hint'));}
   b.onclick=()=>{if(!valid())return;for(const btn of section.querySelectorAll('button'))btn.disabled=true;
    const result=C.confirm(state,id,index,phase,opts());
    if(!result.ok){message.textContent=text[result.reason]||text.save;for(const btn of section.querySelectorAll('button'))btn.disabled=false;
     if(result.reason==='funds'&&!body.querySelector('.interest-funding')){const fund=el('button','筹措本次费用','interest-funding');fund.type='button';fund.onclick=()=>{if(!valid())return;const required=Math.max(0,-(effects.cash||0)-(index===def.followup?.choice?(r.lockedOutcome?.effects.cash||0):0));close();showFundingOptions(required,()=>{if(state===owner&&slot===chosen)open();});};body.append(fund);}return;
    }
    close();if(result.followup){open();return;}render();finish();
   };
  });body.append(message);
  // Resource adjustment stays in this month; the saved event remains pending.
  const adjust=el('button','返回房屋调整','interest-adjust');adjust.type='button';adjust.onclick=()=>{if(!valid())return;close();openRoom();};body.append(adjust);
  section.onkeydown=e=>{if(e.key==='Tab'){const all=[...section.querySelectorAll('button')].filter(b=>!b.disabled),first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};section.querySelector('button')?.focus({preventScroll:true});return true;
 }
 const priorSave=save;save=function(){if(!state)return priorSave();const before=JSON.parse(JSON.stringify(state));try{const k=key(slot),raw=localStorage.getItem(k),backup=k+'_before_shared_interest_20261114';if(raw&&localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);if(priorSave()===false)throw Error('save');return true;}catch(e){for(const k of Object.keys(state))delete state[k];Object.assign(state,before);return false;}};
 const priorTime=currentCareerTime;currentCareerTime=function(){const t=priorTime();return !state?t:{...t,free:Math.max(0,t.free-C.hours(state)),sharedInterestHours:C.hours(state)};};
 const priorClear=clearModals;clearModals=function(){close();return priorClear.apply(this,arguments);};
 for(const name of ['resumeTownMove','finish','openForcedTimeReturn']){const prior=window[name];window[name]=function(){if(waiting()&&open())return;return prior.apply(this,arguments);};}
 const priorRoll=rollTown;rollTown=function(){if(waiting()){open();return;}return priorRoll.apply(this,arguments);};
 const priorSettlement=settleMonth;settleMonth=function(){if(waiting()){open();return false;}return priorSettlement.apply(this,arguments);};
 const priorGame=openGame;openGame=function(){const result=priorGame.apply(this,arguments);if(waiting())open();return result;};
 const priorShow=showEvent;showEvent=function(type,...args){if(type==='读档成功'&&waiting()&&open())return;return priorShow(type,...args);};
 window.SharedInterestPages={open,close,waiting};
})();
