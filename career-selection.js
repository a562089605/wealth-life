// Separate the approved character selection from the detailed career preview.
(function(){
 const el=id=>document.getElementById(id);
 const approvedDetails=window.coffeeStartMarkup;
 window.coffeeSelectionMarkup=function(){return '<section id="careerSelection" aria-label="选择职业"><header><p class="career-brand">财富人生 · WEALTH LIFE</p><h2>选择你的人生起点</h2><p>从一份工作，开启自己的故事</p></header><div class="career-character"><button type="button" data-career-selection="prev" aria-label="上一个职业">‹</button><img src="assets/career/barista-character-20261101.webp" width="1254" height="1254" alt="咖啡师小人物：丸子头、绿色围裙，双手捧着一杯拿铁"><button type="button" data-career-selection="next" aria-label="下一个职业">›</button></div><h3>咖啡师 <small>Barista</small></h3><p class="career-start-data">20岁 · 高中学历<br>初始现金 $10,000 · 债务 $0</p><p class="career-income">基础年薪 $32,000 ＋ 浮动小费</p><div class="career-selection-actions"><button type="button" data-career-selection="browse">浏览该职业 →</button><button type="button" data-career-selection="choose">选择该职业，进入游戏 →</button></div><button type="button" class="career-selection-back" data-career-selection="home">← 返回首页</button></section>';};
 window.coffeeStartMarkup=()=>window.coffeeSelectionMarkup();
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-career-selection]');
  if(!b||b.disabled||el('home').classList.contains('hidden')||el('newGame').classList.contains('hidden'))return;
  switch(b.dataset.careerSelection){
   case 'browse':el('wlJob').innerHTML=approvedDetails().replace('data-coffee-intro="back"','data-career-selection="back"').replace('← 返回存档','← 返回职业选择');break;
   case 'choose':el('start').click();break;
   case 'back':el('wlJob').innerHTML=window.coffeeSelectionMarkup();break;
   case 'home':el('cancel').click();break;
   case 'prev':case 'next':{
    const s=el('job'),d=b.dataset.careerSelection==='next'?1:-1;
    s.selectedIndex=(s.selectedIndex+d+s.options.length)%s.options.length;
    s.dispatchEvent(new Event('change',{bubbles:true}));break;
   }
  }
 });
 el('job').dispatchEvent(new Event('change',{bubbles:true}));
})();
