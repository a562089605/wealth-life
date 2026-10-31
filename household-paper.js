// Hand-painted household cards over the existing previews and transaction buttons.
(function(){
 const titles={family:'与家人同住的温暖卧室',shared:'合租公寓的公共客厅',studio:'卧室与厨房同处一个空间的Studio',rent1:'有独立卧室的一居室'};
 const cells={family:0,shared:1,studio:2,rent1:3};
 function art(i){const d=document.createElement('div');d.className='household-scene';d.style.setProperty('--house-x',(i%3*50)+'%');d.style.setProperty('--house-y',(Math.floor(i/3)*100)+'%');d.setAttribute('role','img');d.setAttribute('aria-label',Object.keys(cells).find(k=>cells[k]===i)?titles[Object.keys(cells).find(k=>cells[k]===i)]:i===4?'食材、面包和日常生活用品':'钥匙、押金与住房合同');return d;}
 function note(s){const p=document.createElement('p');p.className='life-paper-note';p.textContent=s;return p;}
 function row(k,v){const d=document.createElement('div');d.className='life-paper-row';const a=document.createElement('span'),b=document.createElement('strong');a.textContent=k;b.textContent=v;d.append(a,b);return d;}
 function board(title){
  if($('eventTitle').textContent!==title)return null;
  const b=document.createElement('div');b.className='life-paper household-board';b.append(row('第'+(Math.floor(state.month/12)+1)+'年 · 第'+(state.month%12+1)+'月','现金 '+priceText(state.cash)));
  $('eventTitle').closest('.event').classList.add('life-pages-painted','household-painted');$('eventData').replaceChildren(b);$('eventData').style.display='block';return b;
 }
 function actions(){for(const b of $('actions').querySelectorAll('button'))b.dataset.lifePaperAction=b.textContent.startsWith('确认本月')?'review':b.classList.contains('primary')||b.matches('[data-v26="living"]')?'confirm':'back';}
 const housingBefore=openHousing;
 openHousing=function(...args){
  const result=housingBefore(...args);if($('eventTitle').textContent!=='选择住房')return result;
  const options=[...$('eventData').querySelectorAll('[data-housing-preview]')],handover=$('eventData').querySelector('[data-lease-handover]'),cancel=$('eventData').querySelector('[data-lease-cancel]'),b=board('选择住房');if(!b)return result;
  b.append(note('选一处适合自己的住处。先看详情，再确认付款。'));
  if(state.pendingHousingMove){b.append(note('已预约：'+state.pendingHousingMove.name+'。'+(housingHandoverDue()?'本月办理交接后入住。':'下月入住，预约尚未扣款。')));if(cancel){cancel.classList.add('household-inline');b.append(cancel);}}
  if(handover){b.append(art(5));handover.classList.add('household-inline');b.append(handover);}
  const grid=document.createElement('div');grid.className='household-options';
  for(const button of options){
   const key=button.dataset.key,h=housingChoices().find(h=>h[3]===key);if(!h)continue;const q=housingQuote(h),i=cells[key];
   button.className='household-option';button.setAttribute('aria-label',h[0]);button.replaceChildren();if(i!=null)button.append(art(i));
   const name=document.createElement('strong'),price=document.createElement('b'),detail=document.createElement('small'),link=document.createElement('span');name.textContent=h[0];price.textContent=priceText(q.monthly)+'/月';
   detail.textContent=q.scheduled?'预约下月入住，本次不扣款':q.current?'本月尚需房租 '+priceText(q.rent):'房租 '+priceText(q.rent)+' · 押金 '+priceText(q.deposit);
   link.textContent=q.scheduled?'查看预约详情 ›':'查看付款详情 '+priceText(q.total)+' ›';button.append(name,price,detail,link);grid.append(button);
  }b.append(grid,note('租房押金为一个月房租，退租交接返还。住房费用已包含水电与家庭网络。'));actions();return result;
 };
 $('housingBtn').onclick=openHousing;
 const previewBefore=previewHousingChoice;
 previewHousingChoice=function(key){
  const result=previewBefore(key),h=housingChoices().find(h=>h[3]===key);if(!h)return result;const q=housingQuote(h),title=q.scheduled?'换房预约预览':'住房付款预览',b=board(title);if(!b)return result;
  b.append(art(cells[key]??5),row('住处',h[0]),row('月住房费',priceText(q.monthly)),row('本次新押金',priceText(q.deposit)),row('本次支付',priceText(q.total)),row('支付后现金',priceText(state.cash-q.total)));
  if(q.scheduled)b.append(row('入住时间','次月交接'),row('预计退回原押金',priceText(heldHousingDeposit())),row('预计交接净付款',priceText(q.deposit+q.monthly-heldHousingDeposit())),note('预约现在不扣款；下月交接时退旧押金，再支付新押金和房租。'));
  else b.append(note('确认才付款。本月已付房租不会重复收取；押金属于可退资产。'));actions();return result;
 };
 const handoverBefore=openHousingHandover;
 openHousingHandover=function(...args){
  const result=handoverBefore(...args),b=board('退旧押金，入住新住处');if(!b)return result;const q=housingHandoverQuote();if(!q)return result;
  b.append(art(5),row('新住处',q.name),row('退回旧押金',priceText(q.refund)),row('新押金',priceText(q.deposit)),row('本月房租',priceText(q.monthly)),row('交接后现金',priceText(state.cash-q.net)),row('尚缺',priceText(q.shortfall)),note('确认时统一结算。资金不足不会部分扣款，也不会重复收旧房本月房租。'));actions();return result;
 };
 const livingBefore=openTownLiving;
 openTownLiving=function(...args){
  const result=livingBefore(...args);if($('eventTitle').textContent!=='本月必要生活成本')return result;
  const pay=$('eventData').querySelector('[data-v26="living"]'),fund=$('eventData').querySelector('[data-town="livingFund"]'),b=board('本月必要生活成本');if(!b)return result;
  const due=roundCash(Math.max(0,livingTotal()-(paymentReceipt().living||0)));
  $('eventTitle').closest('.event').classList.add('living-embedded');
  const scene=document.createElement('figure');scene.className='living-painted-scene';const image=document.createElement('img');image.src='assets/career/living-bill-scene.webp';image.alt='阳光下的生活食材、手写账单纸和付款木牌';scene.append(image);
  const ledger=document.createElement('div');ledger.className='living-painted-ledger';const amount=document.createElement('div');amount.className='household-total';const label=document.createElement('span'),value=document.createElement('strong');label.textContent=due?'本次尚需支付':'✓ 本月生活费已付清';value.textContent=priceText(due);amount.append(label,value);ledger.append(amount);
  ledger.append(row('基础生活',priceText(livingBaseAmount(state))),row('宠物日常养护',priceText(petMonthly())),row('车辆燃油及维护',priceText(state.carRunningCost||0)),row('本月生活费已付',priceText(paymentReceipt().living||0)));scene.append(ledger);
  if(pay){pay.classList.add('living-embedded-pay');scene.append(pay);}b.append(scene,note('确认才支付，已付费用不会重复扣除。'),note('住房、保险和贷款分别在对应入口处理。'));
  if(fund)$('actions').prepend(fund);actions();return result;
 };
 function restBoard(title,done=false){
  const b=board(title);if(!b)return;const missing=done?[]:restMissing();
  const scene=document.createElement('div');scene.className='household-rest-scene';scene.setAttribute('role','img');scene.setAttribute('aria-label','房屋里的圆脸女孩在绿沙发上安静休息');b.append(scene,row('剩余自由时间',currentCareerTime().free+'小时'),row('费用','免费'));
  if(done){const r=monthlyRest().entries.at(-1);if(r)b.append(row('本次自由时间减少',r.hours+'小时'),row('实际能量变化',signed(r.energy)),row('实际压力变化',signed(r.stress)),row('实际健康变化',signed(r.health)));b.append(note('这次休息已完成。需要继续休息时，再明确安排一次。'));}
  else{b.append(row('自由时间减少','4小时'),row('能量','增加6点'),row('压力','减少2点'),row('健康','增加1点'),note('按状态上下限结算，可重复安排；确认后才执行。'));if(missing.length)b.append(note('暂不能安排：'+missing.join('；')));}
  actions();
 }
 function signed(n){return(n>0?'+':'')+n;}
 const restBefore=openExtraRest;openExtraRest=function(...args){const result=restBefore(...args);restBoard('额外休息4小时');return result;};
 const restConfirmBefore=confirmExtraRest;confirmExtraRest=function(...args){const result=restConfirmBefore(...args);if(result===true)restBoard('休息完成',true);return result;};
 const before=showEvent;showEvent=function(...args){document.querySelector('.household-painted')?.classList.remove('household-painted','living-embedded');return before(...args)};
})();
