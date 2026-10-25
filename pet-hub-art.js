// Paint the existing pet hub without replacing any payment or confirmation action.
(function(){
 const showBefore=showEvent;
 showEvent=function(type,title,...args){
  const result=showBefore(type,title,...args);
  const card=$('eventTitle').closest('.event');
  card?.classList.remove('pet-hub-painted');
  document.getElementById('petHubIllustration')?.remove();
  if(type!=='宠物'||title!=='我的宠物'||$('eventTitle').textContent!=='我的宠物'||!card)return result;
  card.classList.add('pet-hub-painted');
  const scene=document.createElement('figure');scene.id='petHubIllustration';
  const img=document.createElement('img');img.src='assets/career/pet-hub.webp';img.alt='暖阳下的宠物照护角：柯基、灰猫、陆龟和绿植';scene.append(img);
  $('eventTitle').after(scene);
  if(!(state.pets||[]).length){
   const empty=document.createElement('p');empty.className='pet-hub-empty';empty.textContent='还没有小伙伴入住，可以先去看看。';scene.append(empty);
  }
  for(const b of $('actions').querySelectorAll('button')){
   const label=b.textContent;
   if(!b.hasAttribute('aria-label'))b.setAttribute('aria-label',label);
   b.dataset.petPaint=label==='领养新伙伴'?'adopt':label==='处理本月到期照护'?'care':label==='返回房屋'?'back':label.includes('确认本月宠物安排')?'confirm':'policy';
  }
  return result;
 };
})();
