// Artwork menus preview existing choices; the existing action owns payment and XP.
const hobbyArtShowBefore=showEvent;
showEvent=function(type,title,desc,data=[],actions=[]){
 const result=hobbyArtShowBefore(type,title,desc,data,actions);
 if(type!=='HOBBY'||title!=='发展兴趣')return result;
 const names=['摄影','电影创作','烹饪','音乐','园艺','语言学习'];
 const panel=document.createElement('div');panel.className='hobby-art-menu';
 const art=document.createElement('img');art.src='assets/career/hobbies.webp';art.alt='兴趣学习：摄影、电影创作、烹饪、音乐、园艺、语言学习';panel.append(art);
 const add=(label,x,y,w,h,click)=>{const b=document.createElement('button');b.type='button';b.className='art-menu-label';b.textContent=w<=6?(label.startsWith('关闭')?'×':'‹'):label.replace(/^查看/,'').replace(/详情$/,'');b.setAttribute('aria-label',label);b.title=label;b.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';b.onclick=click;panel.append(b);return b};
 names.forEach((name,i)=>{
  const original=actions.find(a=>a[0]==='练习 '+name);if(!original)return;
  const row=data.find(d=>d[0]===name);
  add('查看'+name+'详情',23,26.4+i*8.6,54,7.5,()=>{
   const owner=state,cycle=state.month,title='兴趣详情：'+name;let confirm;
   showEvent('HOBBY',title,'留出一段时间，练习喜欢的事。每月可选一次，也可以下个月再来。',row?[row,['本次安排','8h · 完成后获得35 XP'],['练习收获','放松心情、恢复精力，逐渐积累技巧'],...(hobbyPracticeMissing(name).length?[['暂不能练习',hobbyPracticeMissing(name).join('；')]]:[])]:[],[
    ['确认练习 '+name,()=>{if(state!==owner||state.month!==cycle||!eventActionCurrent(confirm,title))return false;return original[1]()},true,!!original[3]],
    ['返回兴趣技巧学习',openLearningSkills,false]
   ]);confirm=$('actions').firstElementChild;
  });
 });
 const time=document.createElement('span');time.className='hobby-art-time';time.textContent=Math.max(0,currentCareerTime().free)+'h';panel.append(time);
 add('返回学习安排',35,88.5,31,6,openLearning);
 add('返回学习安排',23,8.5,6,6,openLearning);
 add('关闭兴趣学习',71,8.5,6,6,finish);
 $('actions').innerHTML='';$('eventData').innerHTML='';$('eventData').append(panel);$('eventData').style.display='block';
 return result;
};
