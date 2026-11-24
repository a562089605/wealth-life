// Separate the approved character selection from the detailed career preview.
(function(){
 const el=id=>document.getElementById(id);
 const approvedDetails=window.coffeeStartMarkup;
 window.coffeeSelectionMarkup=function(){return '<section id="careerSelection" aria-label="选择职业"><header><p class="career-brand">财富人生 · WEALTH LIFE</p><h2>选择你的人生起点</h2><p>从一份工作，开启自己的故事</p></header><div class="career-character"><button type="button" data-career-selection="prev" aria-label="上一个职业">‹</button><img src="assets/career/barista-character-20261101.webp" width="1254" height="1254" alt="咖啡师小人物：丸子头、绿色围裙，双手捧着一杯拿铁"><button type="button" data-career-selection="next" aria-label="下一个职业">›</button></div><h3>咖啡师 <small>Barista</small></h3><p class="career-start-data">20岁 · 高中学历<br>初始现金 $10,000.00 · 债务 $0.00</p><p class="career-income">基础年薪 $32,000.00 ＋ 浮动小费</p><div class="career-selection-actions"><button type="button" data-career-selection="browse">浏览该职业 →</button><button type="button" data-career-selection="choose">选择该职业，进入游戏 →</button></div><button type="button" class="career-selection-back" data-career-selection="home">← 返回首页</button></section>';};
 window.coffeeStartMarkup=()=>window.coffeeSelectionMarkup();
 const teacherPortrait='assets/school-career/teacher-portrait.webp';
 const teacherPay=()=>money(JOBS.teacher[1]);
 window.teacherSelectionMarkup=()=>window.coffeeSelectionMarkup()
  .replace('assets/career/barista-character-20261101.webp',teacherPortrait)
  .replace('width="1254" height="1254"','width="627" height="627"')
  .replace('咖啡师小人物：丸子头、绿色围裙，双手捧着一杯拿铁','穿绿背心、抱着教案本的青年男教师')
  .replace('咖啡师 <small>Barista</small>','小学教师 <small>Elementary Teacher</small>')
  .replace('20岁 · 高中学历','22岁 · 本科学历')
  .replace('基础年薪 $32,000.00 ＋ 浮动小费','基础年薪 '+teacherPay());
 function teacherOverview(){
  return `<section id="careerSelection" class="teacher-overview" aria-label="小学教师职业总览">
   <img src="assets/school-career/teacher-overview.webp" width="1221" height="1289" alt="小学教师。22 岁，本科学历，开局已入职，初始现金 10,000 美元，无债务。税前年薪 50,400 美元，每月 4,200 美元，寒暑假照常发薪。正常教学月上班 160 小时，自由时间 100 小时。12 月寒假上班 96 小时，自由时间 164 小时。6、7 月暑假不上班，自由时间 260 小时。压力中等，收入稳定性高。职业技能为教学设计、沟通协调、学校管理。晋升路线为小学教师、资深小学教师、年级组长、副校长、校长。">
   <button type="button" class="teacher-overview-back" data-career-selection="back" aria-label="返回职业选择"></button>
   <button type="button" class="teacher-overview-choose" data-career-selection="choose" aria-label="选择这个人生：小学教师"></button>
   <button type="button" class="teacher-overview-other" data-career-selection="next" aria-label="看看其他职业"></button>
  </section>`;
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-career-selection]');
  if(!b||b.disabled||el('home').classList.contains('hidden')||el('newGame').classList.contains('hidden'))return;
  switch(b.dataset.careerSelection){
   case 'browse':if(el('job').value==='teacher'){el('wlJob').innerHTML=teacherOverview();el('wlJob').querySelector('button').focus();break;}el('wlJob').innerHTML=approvedDetails().replace('data-coffee-intro="back"','data-career-selection="back"').replace('← 返回存档','← 返回职业选择');break;
   case 'choose':el('start').click();break;
   case 'back':el('job').dispatchEvent(new Event('change',{bubbles:true}));el('wlJob').querySelector('[data-career-selection=browse]')?.focus();break;
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
