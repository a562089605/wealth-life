// Decorative scene windows exclude historical amounts, thresholds and buttons.
function healthArtScene(type,title){
 if(type==='休息'&&title==='额外休息4小时')return {file:'rest-arrange',width:1024,x:32,y:290,w:960,h:470};
 if(type==='额外休息'&&title==='休息完成')return {file:'rest-complete',width:1024,x:32,y:307,w:960,h:530};
 if(type==='医疗与康复'&&title==='严重健康问题')return {file:'hospital-recovery',width:1024,x:25,y:270,w:975,h:390};
 if((type==='医疗与康复'&&title==='整月康复安排')||(type==='整月康复'&&title==='完成本月康复'))return {file:'month-recovery',width:1254,x:145,y:78,w:963,h:495};
 return null;
}
const healthArtShowBefore=showEvent;
showEvent=function(type,title,desc,data=[],actions=[]){
 const result=healthArtShowBefore(type,title,desc,data,actions),scene=healthArtScene(type,title);
 // A critical-health interceptor may have shown a different event instead.
 if(!scene||$('eventTitle').textContent!==title)return result;
 const hero=document.createElement('div');hero.className='health-art-window';hero.style.aspectRatio=scene.w+'/'+scene.h;
 const image=document.createElement('img');image.src='assets/career/'+scene.file+'.webp';image.alt=title+'场景';
 image.style.width=(scene.width/scene.w*100)+'%';image.style.left=(-scene.x/scene.w*100)+'%';image.style.top=(-scene.y/scene.h*100)+'%';hero.append(image);
 $('eventData').prepend(hero);$('eventData').style.display='block';return result;
};
