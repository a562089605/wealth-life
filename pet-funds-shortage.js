// Render the original shortage illustration with a live quote; no borrowing or payment here.
function openPetFundsShortage(selections){
 const owner=state,month=state.month,q=petCareQuote(state,selections);
 if(q.blocked||!q.rows?.length||state.cash>=q.cost)return false;
 if(state.petCareDraft?.month!==month)state.petCareDraft={month,selections:{}};
 Object.assign(state.petCareDraft.selections,selections);save();
 const needed=q.cost,short=roundCash(needed-state.cash);let panel;
 const active=()=>state===owner&&state.month===month&&panel?.isConnected;
 showEvent('宠物照护缺款','照护费用不足','',[],[
  ['前往银行借贷',()=>{if(!active())return;const fresh=petCareQuote(state,selections);if(fresh.blocked||!fresh.rows?.length||state.cash>=fresh.cost)return openPetHub();openBankLoan(Math.max(1,Math.ceil(fresh.cost-state.cash)),{after:openPetHub})},true],
  ['返回调整安排',()=>{if(active())openPetHub()},false]
 ]);
 $('eventTitle').closest('.event').classList.add('pet-funds-painted');
 panel=document.createElement('div');panel.className='pet-funds-panel';
 panel.innerHTML='<div class="pet-funds-art"><img src="assets/career/pet-funds-shortage.webp" alt="空钱包、零钱与宠物照护清单"></div><dl><div><dt>当前现金</dt><dd>'+priceText(state.cash)+'</dd></div><div><dt>本次待支付</dt><dd>'+priceText(needed)+'</dd></div><div class="short"><dt>还差</dt><dd>'+priceText(short)+'</dd></div></dl><p class="pet-funds-required">完成本月必要照护后，<br>才能前往城镇地图。</p><p class="pet-funds-saved">已选安排已保留，尚未扣款。</p><p class="pet-funds-advice">推荐借款 '+priceText(Math.ceil(short))+'，可自行修改金额。</p><small>可更换清洁方式，或调整其他未支付开支。</small>';
 $('eventData').replaceChildren(panel);$('eventData').style.display='block';
 for(const b of $('actions').querySelectorAll('button')){
  if(b.textContent.startsWith('确认本月')){b.remove();continue;}
  b.dataset.petFundsAction=b.textContent==='前往银行借贷'?'bank':'adjust';
 }
 return true;
}
(function(){const before=showEvent;showEvent=function(...args){document.querySelector('.pet-funds-painted')?.classList.remove('pet-funds-painted');return before(...args)}})();
