// Restyle the existing life menu; move its original buttons without replacing actions.
(function(){
 const before=openRoomLife;
 openRoomLife=function(){
  const result=before();if($('eventTitle').textContent!=='本月生活安排')return result;
  const root=$('eventTitle').closest('.event');root.classList.add('life-hub-painted');
  const actions=[...$('actions').querySelectorAll('button')],bills=necessaryBills();
  const labels=['住房','基本生活费','保险','本月必要安排','可选生活活动'];
  const descriptions=['住处、房租与换房','饮食与日常养护','查看与管理有效保障',bills.length?bills.length+'项待处理':'本月必要事项已完成','运动、休闲与日常选择'];
  const board=document.createElement('div');board.className='life-hub-board';
  const toolbar=document.createElement('div');toolbar.className='life-hub-toolbar';const date=document.createElement('span');date.textContent='第'+(Math.floor(state.month/12)+1)+'年 · 第'+(state.month%12+1)+'月';const cash=document.createElement('strong');cash.textContent='现金 '+priceText(state.cash);toolbar.append(date,cash);board.append(toolbar);
  const hero=document.createElement('figure');hero.className='life-hub-scene';hero.innerHTML='<img src="assets/career/life-arrangements-embedded.webp" alt="暖阳下的生活小桌：房屋钥匙、食材、保障文件与安排手账">';board.append(hero);
  const strip=document.createElement('div');strip.className='life-hub-month';
  const total=roundCash(bills.reduce((n,r)=>n+(r.due||0),0));
  const amount=document.createElement('strong');amount.textContent=bills.length?'已列出待付 '+priceText(total):'本月必要事项已完成';
  const note=document.createElement('small');note.textContent=bills.some(r=>!r.due)?'另有待确认事项，金额以各项确认页为准':'已付费用不重复收取';strip.append(amount,note);hero.append(strip);
  const grid=document.createElement('div');grid.className='life-hub-options';
  labels.forEach((label,i)=>{
   const button=actions.find(b=>b.textContent===label);if(!button)return;
   button.classList.remove('primary');button.classList.add('life-hub-option');button.setAttribute('aria-label',label);
   button.dataset.lifeSpot=String(i);
   button.innerHTML='<span class="life-hub-copy"><strong>'+label+'</strong><small>'+descriptions[i]+'</small></span><span class="life-hub-arrow" aria-hidden="true">›</span>';
   grid.append(button);
  });hero.append(grid);
  const hint=document.createElement('p');hint.className='life-hub-hint';hint.textContent='先查看，再安排；打开页面不会扣款。';board.append(hint);
  $('eventData').replaceChildren(board);$('eventData').style.display='block';
  for(const b of $('actions').querySelectorAll('button'))b.dataset.lifeHubAction=b.textContent.startsWith('确认本月')?'review':'back';
  return result;
 };
 const showBefore=showEvent;showEvent=function(...args){document.querySelector('.life-hub-painted')?.classList.remove('life-hub-painted');return showBefore(...args)};
})();
