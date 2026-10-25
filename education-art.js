// Keep the existing education progression, tuition actions and loan accounting.
const educationArtOpenBefore=openEducation;
function educationArtChoice(target){
 if(state.study||EDU[state.education]?.next===target)return educationArtOpenBefore();
 const entry=Object.entries(EDU).find(([,ed])=>ed.next===target);
 showEvent('EDUCATION',EDU[target].name,'查看此页面不会报名、付款或借款。',[
  ['当前学历',EDU[state.education]?.name||state.education],
  ['入学路线',entry?'需先完成 '+entry[1].name:'现有版本尚未开放这项报名路线']
 ],[['返回学历选择',openEducation,true],['返回学习',openLearning,false]]);
}
openEducation=function(){
 if(!state)return;
 if(state.study)return educationArtOpenBefore();
 showEvent('EDUCATION','提升学历','选择学历查看入学路线；确认报名才付款。',[],[]);
 const panel=document.createElement('div');panel.className='hobby-art-menu';
 const image=document.createElement('img');image.src='assets/career/degrees.webp';image.alt='学历选择：专科、学士、硕士、专业学位';panel.append(image);
 const add=(name,x,y,w,h,action)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',name);b.title=name;b.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';b.onclick=action;panel.append(b)};
 [['associate','专科学位'],['bachelor','学士学位'],['master','硕士学位'],['professional','专业学位']].forEach(([target,label],i)=>add('查看'+label,23,33.4+i*12,54,10.5,()=>educationArtChoice(target)));
 add('返回学习',35,87.5,31,7,openLearning);
 add('返回学习',23,10.5,6,6,openLearning);
 add('关闭学历选择',71,10.5,6,6,finish);
 $('actions').innerHTML='';$('eventData').innerHTML='';$('eventData').append(panel);$('eventData').style.display='block';
};
const educationArtShowBefore=showEvent;
showEvent=function(type,title,desc,data=[],actions=[]){
 const result=educationArtShowBefore(type,title,desc,data,actions);
 if(type!=='EDUCATION'||!title.includes('Associate')||!title.includes('课程预览'))return result;
 const hero=document.createElement('div');hero.className='associate-art-window';
 const image=document.createElement('img');image.src='assets/career/associate-preview.webp';image.alt='专科学位：学位帽与书本';hero.append(image);
 $('eventData').prepend(hero);$('eventData').style.display='block';return result;
};
