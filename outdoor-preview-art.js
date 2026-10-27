// Preview-only composition over the original optional-activity quote and callback.
function paintOutdoorPreview(panel){
 const root=$('eventTitle').closest('.event');root.classList.add('outdoor-embedded');
 panel.querySelector('.life-activity-scene')?.remove();
 const scene=document.createElement('figure');scene.className='outdoor-painted-scene';const image=document.createElement('img');image.src='assets/career/outdoor-preview-embedded.webp';image.alt='原圆脸丸子头女孩在湖边树荫下舒展身体，前景为费用效果纸板与确认木牌';scene.append(image);
 const sheet=document.createElement('div');sheet.className='outdoor-painted-sheet';sheet.tabIndex=0;sheet.setAttribute('aria-label','运动户外安排费用与效果，可上下滚动');
 for(const node of [...panel.children].slice(1)){
  if(node.classList.contains('life-paper-row')&&['健康','能量','幸福度','压力','社交'].includes(node.firstElementChild?.textContent))node.classList.add('outdoor-effect');
  sheet.append(node);
 }
 scene.append(sheet);
 const confirm=[...$('actions').querySelectorAll('button')].find(b=>b.textContent.startsWith('确认安排 ·'));
 if(confirm){confirm.classList.add('outdoor-embedded-pay');scene.append(confirm)}
 panel.append(scene);
}
(function(){const before=showEvent;showEvent=function(...args){document.querySelector('.outdoor-embedded')?.classList.remove('outdoor-embedded');return before(...args)}})();
