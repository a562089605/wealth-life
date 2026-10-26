// Visual layout only: retain the original form nodes, handlers, frozen quote and payment action.
function paintPetAdoptionQuote(q){
 if(q?.species!=='dog'||!document.querySelector('.pet-adoption-painted'))return;
 const rows=[['领养及初始设施',q.adopt],['本月基础养护',q.monthly],['本月可选保险',q.premium]];
 $('petAdoptionQuote').innerHTML='<h3>本次领养费用</h3><dl>'+rows.map(([name,n])=>'<div><dt>'+name+'</dt><dd>'+priceText(n)+'</dd></div>').join('')+'<div class="pet-quote-total"><dt>本次合计</dt><dd>'+priceText(q.total)+'</dd></div><div class="pet-quote-balance"><dt>支付后现金</dt><dd>'+priceText(state.cash-q.total)+'</dd></div></dl><p class="pet-adoption-included">首次体检与清洁、猫狗本月驱虫已包含。</p>';
}
(function(){
 const showBefore=showEvent;
 showEvent=function(...args){document.querySelector('.pet-adoption-painted')?.classList.remove('pet-adoption-painted');document.getElementById('petAdoptionHero')?.remove();return showBefore(...args)};
 const previewBefore=previewPetAdoption;
 previewPetAdoption=function(species){
  const result=previewBefore(species);
  if(species!=='dog'||$('eventTitle').textContent!=='领养柯基'||!$('petAdoptionName'))return result;
  const card=$('eventTitle').closest('.event');card.classList.add('pet-adoption-painted');
  const hero=document.createElement('figure');hero.id='petAdoptionHero';
  hero.innerHTML='<div class="pet-corgi-portrait"><img src="assets/career/pet-corgi-adoption.webp" alt="原领养插画中的可爱柯基"></div><figcaption><span>新伙伴 · 柯基</span><strong>给它一个名字，<br>开启一起的生活。</strong><small>取名和查看费用不会扣款</small></figcaption>';
  $('eventTitle').after(hero);
  paintPetAdoptionQuote(petAdoptionQuote(species,$('petAdoptionInsurance').checked));
  for(const b of $('actions').querySelectorAll('button'))b.dataset.adoptionAction=b.textContent==='确认领养'?'adopt':b.textContent==='返回品种选择'?'back':'review';
  return result;
 };
})();
