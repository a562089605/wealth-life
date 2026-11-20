// All changing text and controls are real DOM; approved artwork is reused only for the illustration header.
(function(){'use strict';const E=CareerEventRules,D=CareerEventData.cards;let msg=null;
 function message(text){if(msg?.isConnected)msg.textContent=text;}
 function rows(e){const result=[],signedMoney=n=>(n>0?'+':'−')+money(Math.abs(n));for(const [k,label,unit]of [['wages','加班工资','$'],['tips','额外小费','$'],['bonus','奖金','$'],['hours','工作时间','h'],['energy','能量',''],['stress','压力',''],['happiness','幸福',''],['service','服务经验',' XP'],['management','管理经验',' XP'],['latte','拉花经验',' XP'],['pourOver','手冲咖啡经验',' XP'],['trust','上司认可度',''],['sales','门店营业额','%'],['storeNet','门店经营收益','$'],['monthlySaving','次月起每月减支','$'],['retain','本月最多留存','$']]){let n=e?.[k];if(!n)continue;if((k==='latte'||k==='pourOver')&&!e.actualReceipt){n=Math.max(0,Math.min(n,800-HobbyLearning.xp(state,k)));if(!n)continue;}const displayLabel=n<0&&e.hours<0?(k==='wages'?'工资扣减':k==='tips'?'小费扣减':label):label;result.push([displayLabel,unit==='$'?signedMoney(n):(n>0?'+':'−')+Math.abs(unit==='%'?Math.round(n*100):n)+unit]);if(k==='hours')result.push(['自由时间',(n>0?'−':'+')+Math.abs(n)+'h']);}return result;}
 function effects(e,hideWorkHours=false,serviceXpAtMonthEnd=false){const box=document.createElement('div');box.className='career-event-effects';for(const [label,value]of rows(e)){if(hideWorkHours&&label==='工作时间')continue;const row=document.createElement('div'),l=document.createElement('span'),v=document.createElement('strong');l.textContent=serviceXpAtMonthEnd&&label==='服务经验'?'顾客服务（月底结算）':label;v.textContent=value;row.append(l,v);box.append(row);}if(e?.storeCost&&isPartner()){const row=document.createElement('div'),label=document.createElement('span'),value=document.createElement('strong');label.textContent='门店支出';value.textContent='−'+money(e.storeCost);row.append(label,value);box.append(row);}for(const [key,label,format] of [
  ['machineWarrantyMonths','免故障维修',n=>n+' 个月'],
  ['machineLoanRevenueRate','本月营业收入',n=>'减少 '+Math.round(n*100)+'%，下月须修或换']
 ]){if(!e?.[key])continue;const row=document.createElement('div'),name=document.createElement('span'),value=document.createElement('strong');name.textContent=label;value.textContent=format(e[key]);row.append(name,value);box.append(row);}if(!box.children.length)box.textContent='无变化';return box;}
 function screen(artId,title,story){
  const partner=artId?.startsWith('partner-');
  showEvent(partner?'合伙人事件':'职业事件',title,story,[],[]);
  const box=$('eventData'),modal=$('eventTitle').closest('.event');
  box.replaceChildren();
  box.style.display='block';
  box.insertAdjacentHTML('afterbegin',careerHero(artId));
  modal.classList.add('coffee-painted-event','career-event-live');
  if(partner){
   modal.classList.add('partner-painted-card');
   modal.dataset.partnerEvent=artId;
   box.append($('eventType').parentElement,$('eventTitle'),$('eventDesc'));
  }
  msg=document.createElement('p');
  msg.className='career-event-message';
  msg.setAttribute('role','status');
  box.append(msg);
  return box;
 }
 function button(box,label,fn,disabled=false){const b=document.createElement('button');b.type='button';b.className='career-event-option';b.disabled=disabled;b.textContent=label;const owner=state,chosen=slot,month=state.month;b.onclick=()=>{if(state!==owner||slot!==chosen||state.month!==month||!b.isConnected)return;b.disabled=true;try{fn();}finally{if(b.isConnected)b.disabled=disabled;}};box.append(b);return b;}
 function exit(box){button(box,'继续',finish);}
 function normalWork(){return false;}
 function barista(){const r=ensureCoffeeMonth();if(r.saveFailed){const b=screen(null,'暂未保存','本次职业安排尚未保存，请重试。');button(b,'重试',barista);return true;}if(!r.eventId)return normalWork();if(r.eventId==='cut'&&r.follow){const d=D[r.follow.artId],b=screen(d.id,d.title,d.story);b.append(effects(r.follow.settled?{...r.resolvedEffects,actualReceipt:true}:r.follow.effects,true));if(r.follow.settled)exit(b);else button(b,'确认结果',()=>settleCoffeeCutFollow(r.cycle));return true;}const d=D['barista-'+r.eventId],b=screen(d.id,d.title,d.story||COFFEE_EVENTS[r.eventId].desc);if(r.status!=='pending'){b.append(effects({...r.resolvedEffects,actualReceipt:true},(['staff','busy','cut'].includes(r.eventId)||r.eventId==='departure'&&r.serviceXpAtMonthEnd),r.serviceXpAtMonthEnd));exit(b);return true;}for(let i=0;i<d.options.length;i++){const e=r.quotes[i],miss=E.guard(state,e,CareerEventRuntime.options()),buttonNode=button(b,String.fromCharCode(65+i)+'  '+(e.label||d.options[i].label),()=>resolveCoffeeEvent(r.cycle,r.eventId,i),!!miss);if(r.eventId==='cut'&&i===1&&r.cutFlowVersion){const dialogue=document.createElement('p');dialogue.textContent=d.options[i].description;buttonNode.append(dialogue);}else buttonNode.append(effects(e,(['staff','busy','cut'].includes(r.eventId)||r.eventId==='departure'&&r.serviceXpAtMonthEnd),r.serviceXpAtMonthEnd));if(miss){const note=document.createElement('small');note.textContent=miss;buttonNode.append(note);}}button(b,'稍后决定',finish);return true;}
 function shift(){const r=ensureShiftMonth();if(r.saveFailed){const b=screen(null,'暂未保存','本次职业安排尚未保存，请重试。');button(b,'重试',shift);return true;}if(!r.eventId)return normalWork();const d=D['shift-'+r.eventId];if(r.followGenerated){const f=r.follow,id=f.artId||'shift-'+r.eventId+'-'+(f.success?'success':'failure'),fd=D[id],b=screen(id,fd.title,fd.story||f.desc),receipt=r.receipts?.find(x=>x.phase==='follow');b.append(effects(receipt?{...receipt.effects,actualReceipt:true}:f.effects,id==='shift-schedule-failure'));if(f.settled)exit(b);else button(b,'确认结果',()=>settleShiftFollow(r.cycle,r.eventId));return true;}const b=screen(d.id,d.title,d.story||SHIFT_EVENTS[r.eventId].desc);if(r.status!=='pending'){const e=(r.receipts||[]).reduce((a,x)=>{for(const [k,v]of Object.entries(x.effects))if(typeof v==='number')a[k]=(a[k]||0)+v;return a;},{});b.append(effects({...e,actualReceipt:true},r.eventId==='schedule'||r.eventId==='acting'));button(b,r.eventId==='praise'?'开心接受':'继续',()=>{const result=E.transaction(state,()=>{r.presented=true;return {};},save);if(result.ok)finish();else message(result.reason);});return true;}for(let i=0;i<d.options.length;i++){const e=r.quotes?.[i]||{},miss=E.guard(state,e,CareerEventRuntime.options()),bn=button(b,(d.options.length>1?String.fromCharCode(65+i)+'  ':'')+(e.label||d.options[i].label),()=>resolveShiftEvent(r.cycle,r.eventId,i),!!miss);if((!e.label||e.label===d.options[i].label)&&d.options[i].description){const p=document.createElement('p');p.textContent=d.options[i].description;bn.append(p);}if(Object.keys(e).length)bn.append(effects(e,r.eventId==='schedule'&&i===2||r.eventId==='acting'&&i===0));if(miss){const n=document.createElement('small');n.textContent=miss;bn.append(n);}}button(b,'稍后决定',finish);return true;}
 const partnerNotes={
  'manager-departure':'亲自交接会占用自由时间。额外工资由门店支付，计入本月经营成本。',
  'manager-equipment':'维修费由门店承担，会从本月利润中扣除。',
  'manager-decline':'改善成功会提高门店营业额，之后的分红仍按可分配利润计算。',
  'manager-research':'试做费用计入门店成本，新品成功后可提高营业额。',
  'manager-excellent':'门店支付本次奖金，并在计算本月可分配利润时计入成本。'
 };
 const isPartner=()=>CareerLearningRules.role(state.job)==='partner';
 function storeScreen(record,card){
  const note=record.cardId==='partner-machine'&&record.status==='pending'&&E.machineLoanDue(state)
   ? '备用机该归还了。请临时维修或更换机器。临时维修费可从本月营业款支付。'
   : isPartner()&&partnerNotes[record.cardId];
  const story=record.cardId==='partner-machine'&&note?note:[card.story,note].filter(Boolean).join(' ');
  return screen(card.id,card.title,story);
 }
 function requireEventChoice(box){
  box.closest('.event').classList.add('career-choice-required');
  $('eventClose').hidden=true;
 }
 const referenceCards=['partner-order','partner-reserve','partner-bakery'];
 function manager(){const r=E.pending(state);if(!r)return false;const follow=r.status==='followup',d=D[follow?r.follow.cardId:r.cardId],b=storeScreen(r,d);if(follow){b.append(effects(r.follow.effects));button(b,d.confirmLabel||'确认结果',()=>{const out=E.settleFollow(state,r.id,CareerEventRuntime.options());if(!out.ok)return message(out.reason);if(d.confirmLabel)finish();else result(out.record,d);});return true;}if(r.cardId==='partner-machine'||r.cardId==='partner-order')requireEventChoice(b);
 if(referenceCards.includes(r.cardId)){
  const modal=b.closest('.event');
  modal.classList.add('partner-reference-card');
  if(r.cardId==='partner-order')modal.classList.add('order-reference-card');
  b.querySelector('.career-event-hero img').src='assets/career-events-20261116/'+r.cardId.slice('partner-'.length)+'-reference-header.webp';
 }const options=E.eventOptions(state,r);for(let i=0;i<options.length;i++){const o=options[i],miss=E.optionGuard(state,r.cardId,o.effects,CareerEventRuntime.options()),bn=button(b,(options.length>1?String.fromCharCode(65+i)+'  ':'')+o.label,()=>{const out=E.choose(state,r.id,i,CareerEventRuntime.options());if(!out.ok)return message(out.reason);if(out.record.status==='followup')manager();else result(out.record,d);},!!miss);if(r.cardId.startsWith('partner-'))partnerOption(bn,o,i,r.cardId);else if(o.description){const p=document.createElement('p');p.textContent=o.description;bn.append(p);}if(Object.keys(o.effects).length&&!r.cardId.startsWith('partner-'))bn.append(effects(o.effects,r.cardId==='manager-departure'&&i===0));if(miss){const n=document.createElement('small');n.textContent=miss;bn.append(n);}}if(r.cardId!=='partner-machine'&&r.cardId!=='partner-order')button(b,'稍后决定',finish);return true;}
 function partnerOption(button,option,index,cardId){
  const letter=document.createElement('span'),copy=document.createElement('span');
  letter.className='partner-option-letter';
  letter.textContent=String.fromCharCode(65+index);
  letter.setAttribute('aria-hidden','true');
  copy.className='partner-option-copy';
  const label=document.createElement('strong'),description=document.createElement('span');
  label.textContent=option.label;
  description.textContent=option.description||'';
  copy.append(label,description);
  button.classList.add('partner-painted-option');
  button.dataset.tone=index;
  button.replaceChildren(letter,copy);
  if(cardId!=='partner-machine'&&!referenceCards.includes(cardId))return;
  button.classList.add('illustrated-partner-option');
  let lines=description.textContent.replace(/。$/,'').split('，');
  if(cardId==='partner-order'&&index===0){
   const {hours,energy,stress,wages,storeNet}=option.effects;
   lines=['自由时间 −'+hours+' 小时',
    '能量 −'+Math.abs(energy)+' · 压力 +'+stress,
    '加班费 '+money(wages),
    '门店净增 '+money(storeNet-wages)];
  }
  description.replaceChildren();
  for(const piece of lines){
   const line=document.createElement('span');
   for(const text of piece.split(/(\$[\d,]+(?:\.\d+)?|\d+%)/)){
    if(/^\$|%$/.test(text)){
     const amount=document.createElement('b');
     amount.textContent=text;
     line.append(amount);
    }else line.append(text);
   }
   description.append(line);
  }
  const art=document.createElement('img');
  art.className='partner-option-art';
  art.src='assets/career-events-20261116/'+cardId.slice('partner-'.length)+'-option-'+String.fromCharCode(97+index)+'.webp';
  if(cardId==='partner-order'&&index===0)art.src='assets/career-events-20261116/order-a-clock.webp';
  art.alt='';
  button.append(art);

 }
 function bakeryResult(r){
  const {storeNet,storeCost}=r.receipts.at(-1).effects;
  const net=roundCash(storeNet-storeCost);
  const stories=r.choice===0
   ? ['少量试卖没达到预期。','几位熟客试了试，刚好收回成本。','套餐很受熟客欢迎，还有人问下周能不能再买到。']
   : ['宣传做了，销量却没跟上。','推广带来了一些订单，刚好收回成本。','推出套餐后，多了不少顾客来店里吃早餐。'];
  const b=screen('partner-bakery','早餐套餐卖得怎么样？',stories[Math.sign(net)+1]);
  b.querySelector('.career-event-hero img').src='assets/career-events-20261116/partner-bakery-result.webp';
  b.closest('.event').classList.add('bakery-result-card');
  const panel=document.createElement('div'),art=document.createElement('img');
  panel.className='bakery-result-summary';
  art.src='assets/career-events-20261116/bakery-result-pastry.webp';
  art.alt='';
  const outcome=document.createElement('strong'),amount=document.createElement('b');
  outcome.textContent=net===0?'收支打平':net>0?'门店净赚 ':'门店净亏 ';
  if(net!==0){
   amount.textContent=money(Math.abs(net));
   outcome.append(amount);
  }
  const note=document.createElement('span');
  note.textContent='已扣除原料和启动费用';
  panel.append(art,outcome,note);
  b.append(panel);
  requireEventChoice(b);
  button(b,'继续',()=>{
   const out=E.acknowledgeBakeryResult(state,r.id,save);
   if(!out.ok)return message(out.reason);
   clearModals();
   settleMonth();
  });
 }
 function result(r,d){
  const receipt={...r.receipts.at(-1).effects,actualReceipt:true};
  if(d.id==='partner-bakery'){finish();return;}
  if(d.id==='partner-reserve'){
   const b=receipt.deferDividend
    ? screen(d.id,'已安排延後領取','8 月先領本應分紅的 2/3。餘下的 1/3 在 9 月補發，並加發延後部分的 10%。')
    : screen(d.id,'照常領取分紅','本月按原有月結規則領取分紅。');
   exit(b);
   return;
  }
  const b=storeScreen(r,d);
  if(d.id==='partner-order'&&r.choice===0)receipt.storeNet=roundCash(receipt.storeNet-(receipt.wages||0));
  b.append(effects(receipt,(d.id==='manager-departure'||d.id==='partner-order')&&r.choice===0));
  exit(b);
 }
 for(const id of ['eventBackdrop','eventClose']){
  $(id).addEventListener('click',event=>{
   if(document.querySelector('.event-active.career-choice-required'))event.stopImmediatePropagation();
  },true);
 }
 function restoreEventHeader(){
  const title=$('eventTitle'),modal=title.closest('.event');
  if(modal.classList.contains('partner-painted-card')){
   $('eventData').before($('eventType').parentElement,title,$('eventDesc'));
   modal.classList.remove('partner-painted-card','partner-reference-card','order-reference-card','bakery-result-card','career-choice-required');
   delete modal.dataset.partnerEvent;
  }
  modal.classList.remove('career-event-live');
 }
 const previousShow=showEvent;
 showEvent=function(...args){restoreEventHeader();return previousShow(...args);};
 const previousClear=clearModals;
 clearModals=function(...args){restoreEventHeader();return previousClear(...args);};
 window.CareerEventPages={barista,shift,manager,bakeryResult,message,rows};openShiftEvent=shift;openShiftFollow=shift;const previous=openCoffeeCareerEvent;openCoffeeCareerEvent=function(){return shiftWorking()?shift():coffeeWorking()?barista():state&&E.runsStore(state)?manager():previous();};
})();
