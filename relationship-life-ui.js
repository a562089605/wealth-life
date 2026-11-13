// Approved images and real accessible controls for explicitly saved cards, never an automatic selector.
(function(){'use strict';const C=RelationshipLifeCards;let active=null;
 const current=()=>state?.town?.movement?.relationshipLifeCard;
 const waiting=()=>{const r=current();return r&&['pending','followup'].includes(r.status)&&r.month===state.month&&!state.town.movement.resolved;};
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
 function close(){active?.remove();active=null;document.body.classList.remove('relationship-card-open');}
 function open(){const r=current();if(!waiting()||state.requiredIncident||state.gameOver?.final||unfinishedTreatment()||healthTreatmentKind(state.health)||isRecoveryMonth(state))return false;
  close();clearModals();window.PetPages?.close();window.RelationshipPages?.close();const owner=state,chosen=slot,id=r.id,phase=r.status,def=C.cards[r.kind];if(!def)return false;
  const f=phase==='followup'?r.followup:null,options=f?f.options:r.quotes,boxes=f?f.boxes:r.boxes||(r.version===1?[[3,52,94,20],[3,72.5,94,23]]:def.boxes),title=f?f.title:r.title||def.title;
  const node=el('section',null,'relationship-life-overlay');active=node;node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label',title);document.body.append(node);document.body.classList.add('relationship-card-open');
  const wrap=el('div',null,'relationship-life-wrap'),canvas=el('div',null,'relationship-life-canvas'),img=el('img');img.src=f?f.art:r.art;img.alt=title+'。'+options.map(q=>q.label+'：'+[['hours','自由时间−'],['cash','金钱'],['energy','能量'],['stress','压力'],['happiness','幸福'],['intimacy','亲密度'],['studyMonths','学习剩余时间−'],['careCoupons','免费外出护理次数＋']].filter(([k])=>q[k]).map(([k,label])=>label+(q[k]>0&&!['hours','studyMonths'].includes(k)?'+':'')+q[k]+(k==='hours'?'小时':k==='studyMonths'?'个月':'')).join('，')).join('；');canvas.append(img);
  if(!f&&def.payMode){const live=el('div',null,'relationship-live-pay '+def.payMode),q=r.quotes[0];live.append(el('span',def.payMode==='pickup'?'额外工资':'工资＋小费'),el('strong','+'+priceText(q.cash)));canvas.append(live);}
  wrap.append(el('p',(r.role||def.role)+'：'+r.personName,'relationship-life-person'),canvas);
  if(f?.key==='classmate')wrap.append(el('p','新同学：'+r.newClassmate.name+' · 初始亲密度10','relationship-life-person'));
  const msg=el('p',null,'relationship-life-message');msg.setAttribute('role','status');
  const valid=()=>active===node&&node.isConnected&&state===owner&&slot===chosen&&current()?.id===id&&current()?.status===phase&&state.month===r.month;
  options.forEach((q,i)=>{const b=el('button',null,'relationship-life-hit');b.type='button';b.setAttribute('aria-label',q.label);b.append(el('span',q.label,'relationship-sr'));const box=boxes[i];['left','top','width','height'].forEach((k,j)=>b.style[k]=box[j]+'%');b.onclick=()=>{if(!valid())return;b.disabled=true;const opts={free:currentCareerTime().free,forcedTime:x=>recordForcedEventTime(state,x),graduate:()=>completeEducation(state,state.month,{},true),save};const result=f?C.confirmFollowup(state,id,opts):C.confirm(state,id,i,opts);if(!result.ok){msg.textContent=({funds:'现金不足，请先筹措费用。',time:'自由时间不足，不能接受这次额外工作。',energy:'能量不足，暂不能接受。',job:'当前工作或上司已变化，不能结算这张工作卡。',pet:'当前没有适用的外出宠物。',study:'学习计划已变化，当前卡片暂不能结算。',lease:'当前租约已变化，当前卡片暂不能结算。'})[result.reason]||'本次未保存，结算已恢复，请重试。';b.disabled=false;if(result.reason==='funds'&&!wrap.querySelector('.relationship-funding')){const fund=el('button','筹措本次费用','relationship-funding');fund.onclick=()=>{if(!valid())return;close();showFundingOptions(-q.cash,()=>{if(state===owner&&slot===chosen)open();});};wrap.append(fund);}return;}close();if(result.followup){open();return;}render();finish();};canvas.append(b);});wrap.append(msg);node.append(wrap);
  const buttons=[...canvas.querySelectorAll('button')];node.onkeydown=e=>{if(e.key==='Tab'){const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};buttons[0]?.focus({preventScroll:true});return true;
 }
 const beforeTime=currentCareerTime;currentCareerTime=function(){const t=beforeTime();return !state?t:{...t,free:Math.max(0,t.free-(state.relationshipLife?.hours?.[state.month]||0))};};
 const beforeClear=clearModals;clearModals=function(){close();return beforeClear.apply(this,arguments);};
 const beforeResume=resumeTownMove;resumeTownMove=function(){if(waiting()&&open())return;return beforeResume.apply(this,arguments);};
 const beforeFinish=finish;finish=function(){if(waiting()&&open())return;return beforeFinish.apply(this,arguments);};
 const beforeReturn=openForcedTimeReturn;openForcedTimeReturn=function(){if(waiting()&&open())return;return beforeReturn.apply(this,arguments);};
 const beforeRoll=rollTown;rollTown=function(){if(waiting()){open();return;}return beforeRoll.apply(this,arguments);};
 const beforeShow=showEvent;showEvent=function(type,...args){if(type==='读档成功'&&waiting()&&open())return;return beforeShow(type,...args);};
 window.RelationshipLifePages={open,close,waiting};
})();
