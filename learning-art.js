// Menu navigation never enrolls, charges money or consumes course time.
openLearning=function(){
 showEvent('LEARNING','学习与技能','先查看课程，确认后才执行。',[],[]);
 const panel=document.createElement('div');panel.className='hobby-art-menu';
 const img=document.createElement('img');img.src='assets/career/learning.webp';img.alt='学习菜单：提升学历、职业技能、兴趣学习';panel.append(img);
 const add=(name,x,y,w,h,action)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',name);b.title=name;b.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';b.onclick=action;panel.append(b)};
 add('提升学历',23,33.5,54,12,openEducation);
 add('职业技能',23,47,54,12,openCoffeeCourses);
 add('兴趣学习',23,60.5,54,12,()=>$('hobbyBtn').click());
 add('返回小屋',35,88,30,7,()=>townEnabled()&&!townPending()?townHome():finish());
 add('关闭学习菜单',71,10,6,6,finish);
 const time=document.createElement('span');time.className='learning-art-time';time.textContent=Math.max(0,currentCareerTime().free)+'h';panel.append(time);
 $('actions').innerHTML='';$('eventData').innerHTML='';$('eventData').append(panel);$('eventData').style.display='block';
};
const learningArtShowBefore=showEvent;
showEvent=function(type,title,desc,data=[],actions=[]){
 const result=learningArtShowBefore(type,title,desc,data,actions);
 if(type!=='职业学习')return result;
 const file=title==='门店管理基础'?'management-course':title==='顾客服务基础'?'service-course':null;
 if(!file)return result;
 const hero=document.createElement('div');hero.className='course-art-window';
 const img=document.createElement('img');img.src='assets/career/'+file+'.webp';img.alt=title+'学习场景';hero.append(img);
 $('eventData').prepend(hero);$('eventData').style.display='block';
 return result;
};
