// Approved images and real accessible controls for explicitly saved cards, never an automatic selector.
(function(){'use strict';const C=RelationshipLifeCards;let active=null;
 const current=()=>state?.town?.movement?.relationshipLifeCard;
 const waiting=()=>{const r=current();return r&&['pending','followup'].includes(r.status)&&r.month===state.month&&!state.town.movement.resolved;};
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
 const redraws={
  'manager-care':'经理察觉你最近有些疲惫，问你要不要聊聊。',
  'manager-experience':'午休时，经理和同事们聊起刚入行时的趣事和经验。',
  'manager-tasting':'店里正在试做新饮品，经理请你试喝并提点意见。',
  'manager-bonus':'经理把奖金递给你，感谢你最近的努力。',
  'manager-pickup':'店里临时缺货，经理问你能不能去附近取货。全程算额外工作。',
  'manager-extra-shifts':'店里最近人手紧，经理问你能不能多上5天班，其中3天是周末、2天是平日。',
  'coworker-chat':'下班时，同事问你要不要一起去尝尝新开的餐厅。',
  'coworker-snack':'休息时，同事拿出小点心，请你一起尝尝。',
  'coworker-bookshelf':'同事最近要搬家，问你那天能不能过去搭把手。',
  'coworker-order':'午休时，同事准备点外卖，问你要不要一起拼单。',
  'coworker-job':'同事问你有没有空帮忙布置画展，结束后会付你报酬。',
  'moving-meal':'搬完家后，同事请你一起吃顿饭，感谢你来帮忙。',
  'petfriend-chat':'散步时，你遇到一位宠友，聊起了平时养宠的小趣事。',
  'petfriend-organizer':'宠友送给你宠物护理券。',
  'petfriend-shop':'路过宠物用品店时，宠友问你要不要一起进去看看。',
  'petfriend-late':'散步时，两只宠物起了点冲突。',
  'petfriend-job':'宠友介绍你去咖啡店帮一天忙。'
 };
 const metricArt={
  hours:'assets/hobby-review/stat-time.webp',
  cash:'assets/hobby-review/stat-cost.webp',
  energy:'assets/hobby-review/stat-energy.webp',
  intimacy:'assets/approved-skills/leaf.webp',
  happiness:'assets/hobby-review/stat-happiness.webp',
  stress:'assets/hobby-review/stat-stress.webp'
 };
 function drawOption(button,q,def){
  button.append(el('span',q.label,'relationship-redraw-label'));
  const fields=[
   ['hours','◷','自由时间','小时'],['cash','🪙',def.payMode==='pickup'?'额外工资':def.payMode==='shifts'?'工资＋小费':def.incomeKind==='bonus'?'奖金':q.cash>0?'报酬':'现金',''],
   ['energy','⚡','能量',''],['intimacy','🌿',def.role+'亲密度',''],['happiness','♥','幸福度',''],
   ['stress','☁','压力',''],['careCoupons','🎟','护理券','张']
  ].filter(([key])=>q[key]);
  if(fields.length){
   const effects=el('span',null,'relationship-redraw-effects');
   effects.dataset.count=fields.length;
   for(const [key,icon,label,unit] of fields){
    const value=key==='hours'?-q[key]:q[key];
    const metric=el('span',null,'relationship-redraw-metric'),mark=el('span',icon,'relationship-redraw-icon '+key),copy=el('span',null,'relationship-redraw-effect-text');
    mark.setAttribute('aria-hidden','true');
    if(metricArt[key]){
     const iconImage=el('img');
     iconImage.src=metricArt[key];iconImage.alt='';mark.replaceChildren(iconImage);
    }
    const amount=el('strong',(value<0?'−':'+')+(key==='cash'?priceText(Math.abs(value)):Math.abs(value)));
    if(unit)amount.append(el('small',unit));
    copy.append(el('span',label),amount);metric.append(mark,copy);effects.append(metric);
   }
   button.append(effects);
  }
  if(q.followup==='moving-meal')button.append(el('span','后续 · 搬完家，一起吃顿饭','relationship-redraw-note'));
 }
 function close(){active?.remove();active=null;document.body.classList.remove('relationship-card-open');}
 const canOpen=()=>!!state&&!state.requiredIncident&&!state.gameOver?.final&&!unfinishedTreatment()&&!healthTreatmentKind(state.health)&&!isRecoveryMonth(state);
 function open(){const r=current();if(!waiting()||!canOpen())return false;
  if(window.townHousingBlocked?.())return true;
  close();clearModals();window.PetPages?.close();window.RelationshipPages?.close();const owner=state,chosen=slot,id=r.id,phase=r.status,def=C.cards[r.kind];if(!def)return false;if(def.introduction&&window.CareerPages)return CareerPages.introduction();
  const f=phase==='followup'?r.followup:null,options=f?f.options:r.quotes,boxes=f?f.boxes:r.boxes||(r.version===1?[[3,52,94,20],[3,72.5,94,23]]:def.boxes),title=f?f.title:r.title||def.title;
  const node=el('section',null,'relationship-life-overlay');active=node;node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label',title);document.body.append(node);document.body.classList.add('relationship-card-open');
  const redrawKey=f?.key||(!f&&r.kind),redraw=(!f&&r.story)||redraws[redrawKey];
  const art=f?f.art:r.art;
  const cardArtFolder='assets/relationships/cards/';
  const outcomeArt={
   [cardArtFolder+'success-20261113.webp']:{file:'success-20261113-art.webp',bottom:56.5},
   [cardArtFolder+'failure-20261113.webp']:{file:'failure-20261113-art.webp',bottom:54.5}
  }[art];
  const visualBoxes={
   [cardArtFolder+'manager-01-care.webp']:[[3,57,94,23],[3,81,94,18]],
   [cardArtFolder+'petfriend-05-cafe-day-job.webp']:[[10,79,80,12],[6,91,88,8]]
  }[art]||boxes;
  const wrap=el('div',null,'relationship-life-wrap'),canvas=el('div',null,'relationship-life-canvas'),img=el('img');img.src=art;img.alt=title+'。'+options.map(q=>q.label+'：'+(q.newRegular?'熟客加入关系网，初始亲密度10':'')+[['hours','自由时间−'],['cash','金钱'],['energy','能量'],['stress','压力'],['happiness','幸福'],['intimacy','亲密度'],['studyMonths','学习剩余时间−'],['careCoupons','免费外出护理次数＋']].filter(([k])=>q[k]).map(([k,label])=>label+(q[k]>0&&!['hours','studyMonths'].includes(k)?'+':'')+q[k]+(k==='hours'?'小时':k==='studyMonths'?'个月':'')).join('，')).join('；');if(redraw){
   canvas.classList.add('relationship-redraw');
   if(!r.story||f)img.src='assets/relationships/redraw/'+redrawKey+'.webp';
   img.alt='';
   canvas.append(el('p','关系生活卡 · '+def.role,'relationship-redraw-tag'),el('h2',title),img);
   if(!f&&!r.story){
    const conditions=[def.minIntimacy&&'亲密度 ≥'+def.minIntimacy,def.coffeeOnly&&'咖啡店限定'].filter(Boolean);
    if(conditions.length)canvas.append(el('p',conditions.join(' · '),'relationship-redraw-note'));
   }
   canvas.append(el('p',redraw,'relationship-redraw-story'));
  }else canvas.append(img);
  if(outcomeArt){
   // Show the approved scene while keeping the original settlement figures visible.
   const scene=el('img');
   scene.src=cardArtFolder+outcomeArt.file;
   scene.alt='';
   Object.assign(scene.style,{position:'absolute',inset:'0',width:'100%',height:'100%',clipPath:'inset(0 0 '+(100-outcomeArt.bottom)+'% 0)',pointerEvents:'none'});
   canvas.append(scene);
  }
  if(!redraw&&!f&&def.payMode){const live=el('div',null,'relationship-live-pay '+def.payMode),q=r.quotes[0];live.append(el('span',def.payMode==='pickup'?'额外工资':'工资＋小费'),el('strong','+'+priceText(q.cash)));canvas.append(live);}
  wrap.append(el('p',(r.role||def.role)+'：'+r.personName,'relationship-life-person'),canvas);
  if(f?.key==='classmate')wrap.append(el('p','新同学：'+r.newClassmate.name+' · 初始亲密度10','relationship-life-person'));
  if(!f&&options[0]?.studyMonths&&EducationPlans.current(state.study))wrap.append(el('p','接受帮助前，需先付清剩余学费 '+EducationPlans.balance(state.study).toLocaleString('en-US',{style:'currency',currency:'USD'})+'；结清与帮助效果一并保存。','relationship-life-person'));
  const msg=el('p',null,'relationship-life-message');msg.setAttribute('role','status');
  const valid=()=>active===node&&node.isConnected&&state===owner&&slot===chosen&&current()?.id===id&&current()?.status===phase&&state.month===r.month;
  options.forEach((q,i)=>{const b=el('button',null,redraw?'relationship-redraw-option':'relationship-life-hit');b.type='button';if(redraw){drawOption(b,q,def);}else{b.setAttribute('aria-label',q.label);b.append(el('span',q.label,'relationship-sr'));const box=visualBoxes[i];['left','top','width','height'].forEach((k,j)=>b.style[k]=box[j]+'%');}b.onclick=()=>{if(!valid())return;b.disabled=true;const opts={free:currentCareerTime().free,forcedTime:x=>recordForcedEventTime(state,x),graduate:()=>completeEducation(state,state.month,{},true),save};const result=f?C.confirmFollowup(state,id,opts):C.confirm(state,id,i,opts);if(!result.ok){msg.textContent=({funds:'现金不足，请先筹措费用。',time:'自由时间不足，无法完成这个选项。',energy:'能量不足，暂不能接受。',job:'当前工作或上司已变化，不能结算这张工作卡。',pet:'当前没有适用的外出宠物。',study:'学习计划已变化，当前卡片暂不能结算。',lease:'当前租约已变化，当前卡片暂不能结算。'})[result.reason]||'本次未保存，结算已恢复，请重试。';b.disabled=false;if(result.reason==='funds'&&!wrap.querySelector('.relationship-funding')){const fund=el('button','筹措本次费用','relationship-funding');fund.onclick=()=>{if(!valid())return;close();showFundingOptions(Math.max(-q.cash,q.studyMonths&&EducationPlans.current(state.study)?EducationPlans.balance(state.study):0),()=>{if(state===owner&&slot===chosen)open();});};wrap.append(fund);}return;}close();if(result.followup){open();return;}render();if(result.receipt?.resultText){
   const resultCard=el('section',null,'relationship-life-overlay');active=resultCard;resultCard.setAttribute('role','dialog');resultCard.setAttribute('aria-modal','true');resultCard.setAttribute('aria-label',title);
   const panel=el('div',null,'relationship-life-wrap relationship-redraw');
   const next=el('button','继续','relationship-redraw-option');next.type='button';next.onclick=()=>{close();finish();};
   panel.append(el('h2',title),el('p',result.receipt.resultText,'relationship-redraw-story'),next);resultCard.append(panel);document.body.append(resultCard);document.body.classList.add('relationship-card-open');next.focus();
  }else finish();};canvas.append(b);});wrap.append(msg);node.append(wrap);
  const buttons=[...canvas.querySelectorAll('button')];node.onkeydown=e=>{if(e.key==='Tab'){const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};buttons[0]?.focus({preventScroll:true});return true;
 }
 const beforeTime=currentCareerTime;currentCareerTime=function(){const t=beforeTime();return !state?t:{...t,free:Math.max(0,t.free-(state.relationshipLife?.hours?.[state.month]||0))};};
 const beforeClear=clearModals;clearModals=function(){close();return beforeClear.apply(this,arguments);};
 const beforeResume=resumeTownMove;resumeTownMove=function(){if(waiting()&&open())return;return beforeResume.apply(this,arguments);};
 const beforeFinish=finish;finish=function(){if(waiting()&&open())return;return beforeFinish.apply(this,arguments);};
 const beforeReturn=openForcedTimeReturn;openForcedTimeReturn=function(){if(waiting()&&open())return;return beforeReturn.apply(this,arguments);};
 const beforeRoll=rollTown;rollTown=function(){if(waiting()){open();return;}return beforeRoll.apply(this,arguments);};
 const beforeShow=showEvent;showEvent=function(type,...args){if(type==='读档成功'&&waiting()&&open())return;return beforeShow(type,...args);};
 window.RelationshipLifePages={open,close,waiting,canOpen};
})();
