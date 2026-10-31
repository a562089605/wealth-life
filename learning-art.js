// Navigation only: preview existing branches before paying or consuming time.
function openLearningHobby(name){
 $('hobbyBtn').click();
 if($('eventTitle').textContent!=='发展兴趣')return;
 const b=[...$('eventData').querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='查看'+name+'详情');
 if(b)b.click();
}
function openLearningSkills(){
 showEvent('LEARNING','兴趣技巧学习','选择想学的方向，先查看详情；确认后才支付费用或执行学习。',[['剩余自由时间',currentCareerTime().free+'h']],[['返回学习',openLearning,false]]);
 const list=document.createElement('div');list.className='learning-branches';
 const group=(title,entries)=>{const section=document.createElement('section'),heading=document.createElement('h3');heading.textContent=title;section.append(heading);const grid=document.createElement('div');grid.className='learning-branch-grid';
  for(const [name,note,action]of entries){const b=document.createElement('button');b.type='button';b.className='learning-branch';b.setAttribute('aria-label','查看'+name);const label=document.createElement('strong'),detail=document.createElement('span');label.textContent=name;detail.textContent=note;b.append(label,detail);b.onclick=action;grid.append(b);}section.append(grid);list.append(section);
 };
 group('兴趣学习',['摄影','电影创作','烹饪','音乐','园艺','语言学习'].map(name=>[name,'8h · 每月自选一次',()=>openLearningHobby(name)]));
 group('职业技巧',COFFEE_COURSES.filter(c=>!c.advanced).map(c=>[c.name,c.hours+'h · '+priceText(c.cost),()=>previewCoffeeCourse(c.id)]));
 $('eventData').append(list);$('eventData').style.display='block';
}
openLearning=function(){
 showEvent('LEARNING','学习','选择一个学习方向，再查看其中的课程。',[],[]);
 const panel=document.createElement('div');panel.className='hobby-art-menu learning-direction-menu';
 const img=document.createElement('img');img.src='assets/career/learning.webp';img.alt='暖色手绘书房与学习手账';panel.append(img);
 const board=document.createElement('div');board.className='learning-choice-board';
 for(const [name,description,action]of [['兴趣技巧学习','兴趣练习 · 职业技巧',openLearningSkills],['学历学习','查看学历路线与学习计划',openEducation]]){
  const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',name);const title=document.createElement('strong'),note=document.createElement('span');title.textContent=name;note.textContent=description;b.append(title,note);b.onclick=action;board.append(b);
 }panel.append(board);
 const add=(name,x,y,w,h,action)=>{const b=document.createElement('button');b.type='button';b.className='art-menu-label';b.textContent=name;b.setAttribute('aria-label',name);b.title=name;b.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';b.onclick=action;panel.append(b)};
 add('返回房屋',35,88,30,7,()=>townEnabled()&&!townPending()?townHome():finish());
 const time=document.createElement('span');time.className='learning-art-time';time.textContent=Math.max(0,currentCareerTime().free)+'h';panel.append(time);
 $('actions').innerHTML='';$('eventData').innerHTML='';$('eventData').append(panel);$('eventData').style.display='block';
};
const learningArtShowBefore=showEvent;
showEvent=function(type,title,desc,data=[],actions=[]){
 if(type==='职业学习')actions=actions.map(a=>a[0]==='返回课程'||a[0]==='返回'?['返回兴趣技巧学习',openLearningSkills,false]:a);
 const result=learningArtShowBefore(type,title,desc,data,actions);
 if(type!=='职业学习')return result;
 const file=title==='门店管理基础'?'management-course':title==='顾客服务基础'?'service-course':null;
 if(!file)return result;
 const hero=document.createElement('div');hero.className='course-art-window';
 const img=document.createElement('img');img.src='assets/career/'+file+'.webp';img.alt=title+'学习场景';hero.append(img);
 $('eventData').prepend(hero);$('eventData').style.display='block';
 return result;
};
