// Artwork menus preview existing choices; the existing action owns payment and XP.
const hobbyArtShowBefore=showEvent;
showEvent=function(type,title,desc,data=[],actions=[]){
 const result=hobbyArtShowBefore(type,title,desc,data,actions);
 if(type!=='HOBBY'||title!=='发展兴趣')return result;
 const names=['摄影','电影创作','烹饪','音乐','园艺','语言学习'];
 const panel=document.createElement('div');panel.className='hobby-art-menu';
 const art=document.createElement('img');art.src='assets/career/hobbies.webp';art.alt='兴趣学习：摄影、电影创作、烹饪、音乐、园艺、语言学习';panel.append(art);
 const add=(label,x,y,w,h,click)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);b.title=label;b.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';b.onclick=click;panel.append(b);return b};
 names.forEach((name,i)=>{
  const original=actions.find(a=>a[0]==='练习 '+name);if(!original)return;
  const row=data.find(d=>d[0]===name);
  add('查看'+name+'详情',23,26.4+i*8.6,54,7.5,()=>{
   showEvent('HOBBY','兴趣详情：'+name,'查看详情不会扣款或增加经验；确认后按当前兴趣规则执行。',row?[row]:[],[
    ['确认练习 '+name,()=>{if(monthSelection('hobby'))return $('hobbyBtn').click();original[1]()},true,!!original[3]],
    ['返回兴趣列表',()=>$('hobbyBtn').click(),false]
   ]);
  });
 });
 const time=document.createElement('span');time.className='hobby-art-time';time.textContent=Math.max(0,currentCareerTime().free)+'h';panel.append(time);
 add('返回学习安排',35,88.5,31,6,openLearning);
 add('返回学习安排',23,8.5,6,6,openLearning);
 add('关闭兴趣学习',71,8.5,6,6,finish);
 $('actions').innerHTML='';$('eventData').innerHTML='';$('eventData').append(panel);$('eventData').style.display='block';
 return result;
};
