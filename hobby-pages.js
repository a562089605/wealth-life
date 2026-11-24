// Approved artwork headers with live values and real, guarded controls.
(function(){'use strict';const H=HobbyLearning;let overlay=null;
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
 const blockedText={max:'已满级',recovery:'当前需先安心疗养',funds:'现金不足',time:'可安排的自由时间不足',energy:'能量不足',stale:'页面已过期，请重新打开',save:'保存失败，本次练习已全部撤回，请重试。'};
 function close(){overlay?.remove();overlay=null;document.body.classList.remove('hobby-pages-open');}
 const priorClear=clearModals;clearModals=function(){close();return priorClear.apply(this,arguments)};
 const priorTime=currentCareerTime;currentCareerTime=function(){const t=priorTime();return !state?t:{...t,free:Math.max(0,t.free-H.hours(state)),hobbyActivityHours:H.hours(state)};};
 function options(){return {free:currentCareerTime().free,reserve:typeof necessaryPetCareHours==='function'?necessaryPetCareHours():0,recovery:isRecoveryMonth(state),save};}
 function panel(title,art,back){close();clearModals();window.EducationPages?.close();window.RelationshipPages?.close();window.PetPages?.close();window.hideRoom?.();
  const owner=state,chosen=slot,month=state.month,section=node('section',null,'hobby-overlay');overlay=section;section.setAttribute('role','dialog');section.setAttribute('aria-modal','true');section.setAttribute('aria-label',title);document.body.append(section);document.body.classList.add('hobby-pages-open');
  const valid=()=>state===owner&&slot===chosen&&state.month===month&&overlay===section&&section.isConnected;
  const paper=node('div',null,'hobby-paper'),scene=node('div',null,'hobby-scene'),img=node('img');img.src=art.endsWith('.webp')?art:'assets/hobbies/'+art+'.webp';img.alt='';scene.append(img);paper.append(scene);section.append(paper);
  const content=node('div',null,'hobby-content');paper.append(content);const head=node('header'),returnButton=node('button','返回');returnButton.type='button';returnButton.onclick=()=>{if(valid())back();};head.append(returnButton);content.append(head,node('h1',title));
  section.onkeydown=e=>{if(e.key==='Escape'&&valid()){e.preventDefault();back();}if(e.key==='Tab'){const all=[...section.querySelectorAll('button')].filter(b=>!b.disabled),first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};returnButton.focus({preventScroll:true});
  function button(text,fn,primary=false,disabled=false,parent=content){const b=node('button',text,primary?'hobby-primary':'');b.type='button';b.disabled=disabled;b.onclick=()=>{if(valid())fn(b);};parent.append(b);return b;}
  return {content,valid,button};
 }
 function room(){close();openRoom();}
 function menu(kind='hobby'){if(!state)return;if(window.CareerPages)return kind==='specialist'?CareerPages.skills():CareerPages.hobbies();const skills=kind==='specialist',ctx=panel(skills?'饮品制作专项':'兴趣爱好',skills?'latte-art-confirmed':'coffee-tasting-10xp-confirmed',room);
  const list=node('div',null,'hobby-list');ctx.content.append(list);
  for(const [id,a]of Object.entries(H.activities)){if(a.kind!==kind)continue;const n=H.xp(state,id),b=ctx.button('',()=>detail(id),false,false,list);b.className='hobby-choice';b.append(node('strong',a.name),node('span','Lv.'+H.level(n)+(n>=800?' · 已满级':' · '+n+' XP')),node('small',money(a.cost)+' · '+a.hours+'小时 · 能量−'+a.energy));}
  if(!skills){const old=[...new Set([...Object.keys(state.hobbies||{}),...Object.keys(state.hobbyXP||{})])];if(old.length){const history=node('details',null,'hobby-legacy');history.append(node('summary','原有兴趣记录'));for(const name of old)history.append(node('p',name+(Number.isFinite(state.hobbies?.[name])?' · Lv.'+state.hobbies[name]:'')+(Number.isFinite(state.hobbyXP?.[name])?' · '+state.hobbyXP[name]+' XP':' · 经验未记录')));ctx.content.append(history);}}
  ctx.button(skills?'返回房屋':'饮品制作专项',skills?room:()=>menu('specialist'));if(!skills)ctx.button('返回房屋',room);
 }
 function detail(id,notice='',returnToCareer=null){if(!state||!H.activities[id])return;const a=H.activities[id],back=returnToCareer||(()=>menu(a.kind)),art=a.kind==='hobby'?'assets/hobby-review/'+id+'.webp':a.practiceArt||(id==='latte'?'assets/career-crayon/cafe.webp':'assets/practice-crayon/'+id+'.webp'),ctx=panel(a.name,art,back),n=H.xp(state,id),lv=H.level(n),expected=H.token(state,id),q=H.quote(state,id,options());
  ctx.content.closest('.hobby-overlay').classList.add('hobby-latte-card','hobby-crayon-card');
  if(a.kind==='hobby')ctx.content.closest('.hobby-overlay').classList.add('personal-hobby-card');
  const progress=node('div',null,'hobby-level');progress.append(node('strong','Lv.'+lv+(n>=800?' · 已满级':'')));
  if(n<800){const start=H.thresholds[lv],end=H.thresholds[lv+1],bar=node('progress');bar.max=end-start;bar.value=n-start;bar.setAttribute('aria-label','当前等级经验');progress.append(bar,node('span',(n-start)+' / '+(end-start)+' XP'));}ctx.content.append(progress);
  const grid=node('dl',null,'hobby-stats'),stats=[['费用',money(a.cost)],['自由时间','−'+a.hours+'小时'],['能量','−'+a.energy],[a.name==='咖啡品鉴'?'品鉴经验':a.name==='手冲咖啡'?'手冲经验':a.name+'经验',n>=800?'已满级':'+'+Math.min(a.xp,800-n)+' XP']];
  if(a.kind==='hobby')stats.push(['幸福度','+4'],['压力','−4']);
  for(const [label,value]of stats){const box=node('div');box.append(node('dt',label),node('dd',value));grid.append(box);}ctx.content.append(grid);
  const resources=node('p','现金 '+money(state.cash)+' · 自由时间 '+currentCareerTime().free+'小时 · 能量 '+Math.round(state.energy),'hobby-resources');ctx.content.append(resources);
  const status=node('p',notice||(!q.ok&&q.reason!=='max'?blockedText[q.reason]:''),'hobby-message');status.setAttribute('role','status');ctx.content.append(status);
  ctx.button(n>=800?'已满级':a.action,b=>{b.disabled=true;const r=H.confirm(state,id,expected,options());if(!r.ok){status.textContent=blockedText[r.reason]||'本次未完成';b.disabled=false;return;}render();detail(id,'本次练习已保存。',returnToCareer);},true,!q.ok);
  if(a.kind!=='hobby'||returnToCareer)ctx.button(returnToCareer?'返回我的职业':a.kind==='hobby'?'返回兴趣爱好':'返回职业技能',back);
  if(a.kind==='hobby'){
   const header=ctx.content.querySelector('header'),title=ctx.content.querySelector('h1');
   header.querySelector('button').textContent='← 返回兴趣爱好';
   header.append(title);ctx.content.parentElement.prepend(header);
   const icons=['cost','time','energy','xp','happiness','stress'];
   [...grid.children].forEach((cell,i)=>{
    const icon=node('img',null,'personal-hobby-stat-icon');
    icon.src='assets/hobby-review/stat-'+icons[i]+'.webp';icon.alt='';
    cell.insertBefore(icon,cell.lastElementChild);
   });
   ctx.content.tabIndex=0;
   ctx.content.setAttribute('aria-label',a.name+'练习，可上下滑动');
  }else{const paper=ctx.content.parentElement,header=ctx.content.querySelector('header'),title=ctx.content.querySelector('h1');header.append(title,node('span','练习档案','hobby-file-label'));paper.prepend(header);
   const level=ctx.content.querySelector('.hobby-level');level.prepend(node('span','当前等级','hobby-level-label'));
   const grid=ctx.content.querySelector('.hobby-stats'),caption=node('h2','本次练习','hobby-practice-heading');grid.before(caption);
   const icons=['cost','time','energy','xp'],paths={cost:'<path d="M9 4h14l-3 7c10 8 12 19-4 19S2 19 12 11Z"/><path d="M11 11h10M19 16c-7-3-9 4-3 5s4 7-3 4m3-12v15"/>',time:'<circle cx="16" cy="17" r="12"/><path d="M16 9v9l6 3M12 2h8"/>',energy:'<path d="M12 3h8v4h6v23H6V7h6Z"/><path d="m18 11-7 10h6l-3 7 8-11h-6Z"/>',xp:'<path d="M16 9C10 4 4 6 3 7v21c5-3 9-2 13 1 4-3 8-4 13-1V7c-4-2-9-2-13 2Zm0 0v20M7 12l5 1M7 17l5 1M20 13l5-1M20 18l5-1"/>'};
   [...grid.children].forEach((cell,i)=>{const icon=node('span',null,'hobby-stat-icon');icon.setAttribute('aria-hidden','true');icon.innerHTML=i>=4?coffeeIcon(i===4?'happiness':'stress'):'<svg viewBox="0 0 32 34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+paths[icons[i]]+'</svg>';cell.prepend(icon);});
   ctx.content.tabIndex=0;ctx.content.setAttribute('aria-label',a.name+'练习，可上下滑动');}
 }
 $('hobbyBtn').onclick=()=>menu();
 const originalCourses=openCoffeeCourses;openCoffeeCourses=function(){originalCourses();if(!state)return;const owner=state,chosen=slot,month=state.month,box=node('section',null,'wl-panel');box.append(node('h3','饮品制作专项'));const b=node('button','拉花与手冲咖啡');b.type='button';b.onclick=()=>{if(state===owner&&slot===chosen&&state.month===month&&box.isConnected)menu('specialist');};box.append(b);$('eventData').append(box);};
 // New annual selections use the same activity quote; preserve existing old plans.
 const prepareBefore=prepareAnnualMonth;prepareAnnualMonth=function(){if(!state||state.annualPlan?.hobbyVersion!==1)return prepareBefore();const before=JSON.parse(JSON.stringify(state));try{return prepareBefore();}catch(e){for(const k of Object.keys(state))delete state[k];Object.assign(state,before);throw e;}};
 window.HobbyPages={open:menu,detail,close};
})();

