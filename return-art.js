// Scenes are decorative: original policy and settlement actions remain authoritative.
function appendReturnScene(scene,title){
 if(!scene||$('eventTitle').textContent!==title)return;
 const hero=document.createElement('div');hero.className='health-art-window';hero.style.aspectRatio=scene.w+'/'+scene.h;
 const img=document.createElement('img');img.src='assets/career/'+scene.file+'.webp';img.alt=title+'场景';img.style.width=(scene.width/scene.w*100)+'%';img.style.left=(-scene.x/scene.w*100)+'%';img.style.top=(-scene.y/scene.h*100)+'%';hero.append(img);
 $('eventData').prepend(hero);$('eventData').style.display='block';
}
const POLICY_ART={file:'insurance',width:1024,x:560,y:20,w:440,h:280};
function returnArtScene(type,title,data){
 if(type==='医疗保险'&&title==='医疗保障选择')return POLICY_ART;
 if(type==='发薪日'&&title==='核对本月收支')return {file:'payday',width:1254,x:160,y:95,w:940,h:450};
 if(type!=='本月探索结束'||title!=='返回房屋结算')return null;
 const reason=String(data.find(x=>x[0]==='返回原因')?.[1]||'');
 const file=reason.includes('能量')?'return-energy':reason.includes('压力')?'return-stress':null;
 return file?{file,width:1254,x:160,y:95,w:940,h:440}:null;
}
const returnArtShowBefore=showEvent;
showEvent=function(type,title,desc,data=[],actions=[]){const result=returnArtShowBefore(type,title,desc,data,actions);appendReturnScene(returnArtScene(type,title,data),title);return result};
// openInsurance renders its form after showEvent; attach the scene after that form.
const returnArtInsuranceBefore=openInsurance;
openInsurance=function(type){const result=returnArtInsuranceBefore(type);if(type!=='health')appendReturnScene(POLICY_ART,'保险与保障');return result};
