// Page wrappers keep the original policy handlers and completed transaction rules.
function paintPetCarePayment(p){
 const card=$('eventTitle').closest('.event');card.classList.add('pet-payment-painted');
 const hero=document.createElement('div');hero.className='pet-payment-portrait';hero.innerHTML=PetArt.portrait(petCareSpecies(p));$('eventData').prepend(hero);
}
function openPetTimeShortage(selections){
 const owner=state,month=state.month,q=petCareQuote(state,selections),free=currentCareerTime().free;
 if(q.blocked||!q.rows?.length||free>=q.hours)return false;
 if(state.petCareDraft?.month!==month)state.petCareDraft={month,selections:{}};
 Object.assign(state.petCareDraft.selections,selections);save();let panel;
 showEvent('宠物照护缺时','照护时间不足','',[],[['返回调整安排',()=>{if(state===owner&&state.month===month&&panel?.isConnected)openPetHub()},true]]);
 $('eventTitle').closest('.event').classList.add('pet-funds-painted','pet-time-painted');
 panel=document.createElement('div');panel.className='pet-funds-panel';panel.innerHTML='<div class="pet-funds-art"><img src="assets/career/pet-time-shortage.webp" alt="时钟与宠物照护清单"></div><dl><div><dt>剩余自由时间</dt><dd>'+free+' 小时</dd></div><div><dt>本次照护需要</dt><dd>'+q.hours+' 小时</dd></div><div class="short"><dt>还差</dt><dd>'+(q.hours-free)+' 小时</dd></div></dl><p class="pet-funds-required">完成本月必要照护后，<br>才能前往城镇地图。</p><p class="pet-funds-saved">已选安排已保留，尚未扣款或消耗时间。</p><p class="pet-funds-advice">可改选专业清洁，或调整尚未执行的安排。</p><small>康复期间可按原规则委托，不会自动替你选择。</small>';
 $('eventData').replaceChildren(panel);$('eventData').style.display='block';
 for(const b of $('actions').querySelectorAll('button')){if(b.textContent.startsWith('确认本月'))b.remove();else b.dataset.petFundsAction='adjust'}
 return true;
}
(function(){
 const policyBefore=openPetPolicy;
 openPetPolicy=function(id){
  const p=(state.pets||[]).find(p=>p.id===id);if(!p)return;
  policyBefore(id);if($('eventTitle').textContent!==(p.name||p.type||'宠物')+' · 保障')return;
  const policy=state.insurance?.[p.insuranceKey],active=policy?.active&&(!Number.isInteger(policy.startMonth)||policy.startMonth<=state.month);
  $('eventTitle').closest('.event').classList.add('pet-policy-painted');
  const hero=document.createElement('div');hero.className='pet-policy-hero';hero.innerHTML=PetArt.portrait(petCareSpecies(p),'policy')+'<div><strong></strong><span></span></div>';hero.querySelector('strong').textContent=(p.name||p.type||'宠物')+' · '+PET_ADOPTION[petCareSpecies(p)].name;hero.querySelector('span').textContent=active?'✓ 当前保障中':'○ 当前未投保';$('eventData').prepend(hero);
  const scope=document.createElement('section');scope.className='pet-policy-scope';scope.innerHTML='<h3>保障范围</h3><p>疾病治疗、意外受伤治疗</p><p>有效保单按 '+Math.round((policy?.coverage??.8)*100)+'% 赔付医疗费用；清洁、例行体检和日常养护不赔付。</p><p>每只宠物单独管理。本月保障与已付保费按原规则保留，取消从下月生效。</p>'; $('eventData').append(scope);$('eventData').style.display='block';
 };
 const before=showEvent;showEvent=function(...args){for(const c of ['pet-policy-painted','pet-payment-painted','pet-time-painted'])document.querySelector('.'+c)?.classList.remove(c);return before(...args)};
})();
