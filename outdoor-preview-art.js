// Illustrated composition over original optional-activity quotes, receipts and callbacks.
function paintOutdoorPreview(panel,i=0,done=false){
 const resources=['outdoor-preview-embedded','activity-home-rest-embedded','activity-friends-meal-embedded','activity-hobby-embedded','activity-weekend-trip-embedded','activity-concert-embedded','activity-phone-embedded','activity-fine-dining-embedded','activity-simple-life-embedded'];
 const option=V26_LIFE[i];if(!option||!resources[i])return;
 const root=$('eventTitle').closest('.event');root.classList.add('outdoor-embedded');
 panel.querySelector('.life-activity-scene')?.remove();
 const scene=document.createElement('figure');scene.className='outdoor-painted-scene';scene.dataset.activity=String(i);const image=document.createElement('img');image.src='assets/career/'+resources[i]+'.webp';image.alt=option.name+(done?'结果回执绘本场景，纸板显示实际内容，木牌保留原操作':'绘本场景，前景为动态费用效果纸板与真实确认木牌');scene.append(image);
 const sheet=document.createElement('div');sheet.className='outdoor-painted-sheet';sheet.tabIndex=0;sheet.setAttribute('aria-label',option.name+'安排费用与效果，可上下滚动');
 for(const node of [...panel.children].slice(1)){
  if(node.classList.contains('life-paper-row')&&['健康','能量','幸福度','压力','社交'].includes(node.firstElementChild?.textContent))node.classList.add('outdoor-effect');
  sheet.append(node);
 }
 scene.append(sheet);
 const confirm=[...$('actions').querySelectorAll('button')].find(b=>done?b.textContent==='返回生活安排':b.textContent.startsWith('确认安排 ·'));
 if(confirm){confirm.classList.add('outdoor-embedded-pay');scene.append(confirm)}
 panel.append(scene);
}
(function(){const before=showEvent;showEvent=function(...args){document.querySelector('.outdoor-embedded')?.classList.remove('outdoor-embedded');return before(...args)}})();
