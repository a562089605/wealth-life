// Available approved art + fixed quotes. No automatic draw/pool/weight is installed.
(function(root){'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x)),clamp=n=>Math.max(0,Math.min(100,n));
 const spec={id:'manager-experience',title:'经理分享工作经验',art:'assets/relationships/manager-experience-20261110.webp',minIntimacy:30,monthlyLimit:1,options:[{label:'和同事一起听',hours:1,energy:0,intimacy:4,happiness:2,stress:0,cash:0},{label:'肚子饿了，先去吃饭',hours:0,energy:2,intimacy:0,happiness:0,stress:0,cash:0}]};
 function create(s,personId,moveId){const p=s.people?.find(p=>p.id===personId);if(!p||p.id!==s.relationshipHome?.currentManagerId||!s.job||s.retired||s.unemployedMonths||p.relation<30||(s.relationshipLife?.receipts||[]).some(r=>r.month===s.month&&r.kind===spec.id))return null;return {id:s.month+':'+moveId+':'+spec.id,version:1,kind:spec.id,month:s.month,moveId,personId,personName:p.name,status:'pending',quotes:clone(spec.options),art:spec.art};}
 function confirm(s,recordId,index,{free,forcedTime,save}){const m=s.town?.movement,r=m?.relationshipLifeCard,p=s.people?.find(p=>p.id===r?.personId),q=r?.quotes?.[index];
  if(!m||m.resolved||!r||r.id!==recordId||r.version!==1||r.status!=='pending'||r.month!==s.month||r.moveId!==m.id||!p||![0,1].includes(index)||!q||!Number.isFinite(free)||free<0||!Number.isFinite(q.hours)||q.hours<0||![q.energy,q.intimacy,q.happiness,q.stress,q.cash].every(Number.isFinite)||q.cash!==0)return {ok:false,reason:'stale'};
  const before=clone(s);try{let time=null;if(q.hours>free){if(!forcedTime)throw Error('missing forced time');time=forcedTime({id:'relationship-'+r.id,month:s.month,hours:q.hours,available:free});}
   const used=time?time.used:q.hours,prior=p.relation;stateLessApply();function stateLessApply(){s.energy=clamp(s.energy+q.energy);s.happiness=clamp(s.happiness+q.happiness);s.stress=clamp(s.stress+q.stress);p.relation=clamp(p.relation+q.intimacy);p.lastContactMonth=s.month;}
   const d=s.relationshipLife??={version:1,hours:{},receipts:[]};d.hours[s.month]=(d.hours[s.month]||0)+used;r.status='resolved';r.choice=index;r.receipt={...q,used,time,appliedIntimacy:p.relation-prior};d.receipts.push({id:r.id,kind:r.kind,personId:p.id,month:s.month,choice:index,...r.receipt});m.resolved=true;m.completedMonth=s.month;(s.town.history??=[]).push({id:m.id,to:m.to,month:s.month,type:'community',relationshipCard:r.kind});
   if(q.hours>0&&(q.hours>=free))s.forcedTimeReturn={month:s.month,id:'relationship-'+r.id,debt:time?.debt||0};if(save()===false)throw Error('save failed');return {ok:true,receipt:r.receipt};
  }catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return {ok:false,reason:'save'};}
 }
 const api={spec,create,confirm};root.RelationshipLifeCards=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
if(typeof document!=='undefined'){
 (function(){const C=RelationshipLifeCards;let active=null;const current=()=>state?.town?.movement?.relationshipLifeCard;
  function close(){active?.remove();active=null;document.body.classList.remove('relationship-card-open');}
  function open(){const r=current(),move=state?.town?.movement;if(!r||r.version!==1||r.kind!==C.spec.id||r.status!=='pending'||move.resolved||r.month!==state.month||r.moveId!==move.id)return false;if(state.requiredIncident||state.gameOver?.final||unfinishedTreatment()||healthTreatmentKind(state.health)||isRecoveryMonth(state))return false;
   close();clearModals();window.RelationshipPages?.close();const owner=state,chosenSlot=slot,id=r.id,node=document.createElement('section');node.className='relationship-life-overlay';node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label',C.spec.title);active=node;document.body.append(node);document.body.classList.add('relationship-card-open');
   const valid=()=>active===node&&node.isConnected&&state===owner&&slot===chosenSlot&&current()?.id===id&&current()?.status==='pending'&&state.month===r.month;
   const wrap=document.createElement('div');wrap.className='relationship-life-wrap';const name=document.createElement('p');name.textContent='经理：'+r.personName;name.className='relationship-life-person';wrap.append(name);const canvas=document.createElement('div');canvas.className='relationship-life-canvas';const img=document.createElement('img');img.src=C.spec.art;img.alt=C.spec.title+'。A：自由时间−1小时，经理亲密度+4、幸福度+2。B：能量+2，不额外扣时间或餐费。';canvas.append(img);wrap.append(canvas);
   const message=document.createElement('p');message.setAttribute('role','status');message.className='relationship-life-message';
   r.quotes.forEach((q,index)=>{const b=document.createElement('button');b.className='relationship-life-hit choice-'+index;b.type='button';b.setAttribute('aria-label',q.label);b.innerHTML='<span class="relationship-sr"></span>';b.firstElementChild.textContent=q.label;b.onclick=()=>{if(!valid())return;b.disabled=true;const result=C.confirm(state,id,index,{free:currentCareerTime().free,forcedTime:x=>recordForcedEventTime(state,x),save});if(!result.ok){message.textContent='本次未保存，所有效果已恢复，请重试。';b.disabled=false;return;}close();render();finish();};canvas.append(b);});wrap.append(message);node.append(wrap);canvas.querySelector('button').focus({preventScroll:true});return true;
  }
  const previousTime=currentCareerTime;currentCareerTime=function(){const t=previousTime();return !state?t:{...t,free:Math.max(0,t.free-(state.relationshipLife?.hours?.[state.month]||0))};};
  const previousClear=clearModals;clearModals=function(){close();return previousClear.apply(this,arguments)};
  const previousResume=resumeTownMove;resumeTownMove=function(){if(current()?.status==='pending'&&open())return;return previousResume.apply(this,arguments)};
  window.RelationshipLifePages={open,close};
 })();
}
