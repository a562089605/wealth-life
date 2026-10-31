// Presentation only: reparent the existing live controls; never recreate transactions.
(function(){
 let sequence=0;
 function paint(type,title,description){
  const event=$('eventTitle').closest('.event'),data=$('eventData');
  if(!event.classList.contains('event-active')||$('eventTitle').textContent!==title)return;
  const education=type==='EDUCATION',root=type==='LEARNING'&&title==='学习';
  const scene=document.createElement('div');scene.className='learning-painted-scene';
  scene.style.setProperty('--learning-panel',root?'0%':education?'100%':'50%');
  if(education){
   const stages=['associate','bachelor','master','doctorate'];
   const target=stages.find(key=>title.includes(EDU[key].name))||(title==='当前学习计划'?state.study?.target:null);
   const panel=title.includes('毕业回执')?4:stages.indexOf(target);
   if(panel>=0){scene.dataset.educationScene=panel===4?'graduation':target;scene.style.setProperty('--education-panel',(panel*25)+'%');}
  }
  if(type==='HOBBY'){
   const names=['摄影','电影创作','烹饪','音乐','园艺','语言学习'];
   const name=names.find(name=>title==='兴趣详情：'+name||(title==='完成一次练习'&&description.startsWith(name+'的练习')));
   if(name){scene.dataset.hobbyScene=name;scene.style.setProperty('--hobby-panel',(names.indexOf(name)*20)+'%');}
  }
  const art=document.createElement('div');art.className='learning-painted-art';art.setAttribute('role','img');art.setAttribute('aria-label',education?'女孩在书房温习，学位帽与书本环绕学习纸页':root?'女孩在暖色书房阅读，学习方向嵌入手账纸页':'女孩绘画与练习技巧，纸页旁有相机、乐器和咖啡工具');if(scene.dataset.educationScene)art.setAttribute('aria-label',scene.dataset.educationScene==='graduation'?'女孩身穿学位袍，手持毕业证书，庆祝完成学业':EDU[scene.dataset.educationScene].name+'学习场景');if(scene.dataset.hobbyScene)art.setAttribute('aria-label',scene.dataset.hobbyScene+'专属练习场景');scene.append(art);
  const paper=document.createElement('div');paper.className='learning-painted-sheet';paper.tabIndex=0;paper.setAttribute('aria-label',title+'，内容可上下滚动');
  const heading=document.createElement('h2');heading.textContent=title;paper.append(heading);
  const subtitle=document.createElement('p');subtitle.className='learning-painted-note';subtitle.textContent=type==='LEARNING'&&title==='兴趣技巧学习'?'纸页内可上下滑动，点击分支先看详情；确认后才执行。':description;paper.append(subtitle);
  const footer=document.createElement('div');footer.className='learning-painted-footer';
  if(root){
   const time=document.createElement('p');time.className='learning-painted-time';time.textContent='剩余自由时间 '+currentCareerTime().free+'h';paper.append(time);
   const choices=document.createElement('div');choices.className='learning-painted-choices';
   for(const button of data.querySelectorAll('.learning-choice-board button'))choices.append(button);
   paper.append(choices);const back=data.querySelector('[aria-label="返回房屋"]');if(back)footer.append(back);
  }else if(type==='LEARNING'&&title==='兴趣技巧学习'){
   const list=data.querySelector('.learning-branches');if(list)paper.append(list);
  }else if(education&&title==='提升学历'){
   const choices=document.createElement('div');choices.className='learning-painted-choices learning-degree-choices';
   for(const button of data.querySelectorAll('button[aria-label^="查看"]')){button.removeAttribute('style');choices.append(button);}paper.append(choices);
   const back=data.querySelector('[aria-label="返回学习"]');if(back){back.removeAttribute('style');footer.append(back);}
  }else{
   // Keep dynamic rows and original content, while replacing the former small hero.
   for(const child of [...data.children]){
    if(child.matches('.course-art-window,.associate-art-window'))continue;
    paper.append(child);
   }
  }
  for(const button of [...$('actions').children])footer.append(button);
  footer.dataset.count=String(footer.children.length);scene.append(paper,footer);
  data.replaceChildren(scene);data.style.display='block';event.classList.add('learning-painted-event');
 }
 const before=showEvent;
 showEvent=function(type,title,description,data=[],actions=[]){
  document.querySelector('.learning-painted-event')?.classList.remove('learning-painted-event');
  const token=++sequence,result=before(type,title,description,data,actions);
  if(['LEARNING','EDUCATION','职业学习','HOBBY'].includes(type))queueMicrotask(()=>{if(token===sequence)paint(type,title,description)});
  return result;
 };
})();
