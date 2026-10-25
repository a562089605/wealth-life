// Career selection precedes the existing preview; only the original start action creates a save.
(function(){
 let mode='selection',requestedSlot=null,starting=false;
 const root=$('home'),form=$('newGame'),panel=document.createElement('section');panel.id='careerSelection';
 panel.innerHTML='<h2>选择职业</h2><article class="career-entry-card"><img src="assets/career/barista-portrait.webp" alt="咖啡师：棕色发髻，墨绿围裙，手捧咖啡"><h3>咖啡师 <span>Barista</span></h3><button id="careerPreview" type="button" class="primary">查看职业预览</button></article><button id="careerLoadSaves" type="button" class="secondary">读取已有存档</button>';
 root.prepend(panel);
 function setMode(next){mode=next;root.classList.toggle('career-select',next==='selection');root.classList.toggle('career-preview',next==='preview');panel.hidden=next!=='selection';form.classList.toggle('hidden',next!=='preview');queueMicrotask(()=>{const title=document.querySelector('.wl-home-brand h1');if(title)title.textContent=next==='preview'?'职业预览':next==='selection'?'财富人生':'读取存档'});}
 function selection(){starting=false;setMode('selection');}
 function preview(){starting=false;$('job').value='barista';$('job').dispatchEvent(new Event('change',{bubbles:true}));const img=$('coffeeIntro')?.querySelector('.coffee-paper-scene img');if(img){const frame=document.createElement('div');frame.className='career-entry-preview-art';img.before(frame);frame.append(img)}setMode('preview');$('coffeeIntro')?.scrollIntoView({block:'start'});}
 const originalMarkup=window.coffeeStartMarkup;
 window.coffeeStartMarkup=function(){return originalMarkup().replace('← 返回存档','← 返回职业选择')};
 $('start').textContent='选择这个人生';
 $('cancel').textContent='看看其他职业';
 $('careerPreview').onclick=preview;
 $('careerLoadSaves').onclick=()=>{setMode('saves');buildHome();$('slots').querySelector('button')?.focus()};
 const originalBuild=buildHome;
 buildHome=function(){originalBuild();$('slots').querySelectorAll('.saveRow').forEach((row,i)=>{if(load(i+1))return;row.querySelector('button').onclick=()=>{requestedSlot=i+1;selection()}})};
 const originalStart=$('start').onclick;
 $('start').onclick=()=>{
  if(mode!=='preview'||starting)return;starting=true;
  let target=requestedSlot&&!load(requestedSlot)?requestedSlot:null;
  if(!target){for(let i=1;i<=slotCount();i++)if(!load(i)){target=i;break}}
  if(!target){target=slotCount()+1;setSlotCount(target)}
  slot=target;requestedSlot=null;mode='playing';originalStart();townStart();
 };
 $('cancel').onclick=selection;
 const originalHome=home;home=function(){originalHome();requestedSlot=null;selection()};
 buildHome();selection();
})();
