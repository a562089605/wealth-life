// Approved illustration headers + actual DOM/data. No preview values are used as player state.
(function(){'use strict';const R=CareerLearningRules,H=HobbyLearning;let active=null;
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
 const date=m=>'第'+(Math.floor(m/12)+1)+'年 · '+(m%12+1)+'月';
 function close(){active?._careerCleanup?.();active?.remove();active=null;document.body.classList.remove('career-pages-open');}
 const priorClear=clearModals;clearModals=function(){close();return priorClear.apply(this,arguments);};
 const priorHome=home;home=function(){close();return priorHome.apply(this,arguments);};
 function panel(title,art,back,month=state.month,keepRoom=false){close();clearModals();window.HobbyPages?.close();window.EducationPages?.close();window.RelationshipPages?.close();window.PetPages?.close();if(!keepRoom)window.hideRoom?.();
  const owner=state,chosen=slot,cycle=state.month,section=node('section',null,'career-overlay');active=section;section.setAttribute('role','dialog');section.setAttribute('aria-modal','true');section.setAttribute('aria-label',title);document.body.append(section);document.body.classList.add('career-pages-open');
  const valid=()=>state===owner&&slot===chosen&&state.month===cycle&&active===section&&section.isConnected;
  const paper=node('div',null,'career-paper'),scene=node('div',null,'career-scene'),img=node('img');scene.dataset.art=art;img.src='assets/career-learning-20261115/'+art+'.webp';if(art==='management'||art==='customer-service')img.src='assets/practice-crayon/'+art+'.webp';if(art==='career'){section.classList.add('career-cafe-home');img.src='assets/career-crayon/cafe.webp';}if(art==='school'){section.classList.add('career-school');img.src='assets/school-career/classroom.webp';}img.alt='';scene.append(img);paper.append(scene);section.append(paper);
  const content=node('div',null,'career-content'),header=node('header');paper.append(content);const returnButton=node('button','← 返回');returnButton.type='button';returnButton.onclick=()=>{if(valid())back();};header.append(returnButton,node('span',date(month)));content.append(header,node('h1',title));
  const message=node('p','','career-message');message.setAttribute('role','status');
  function button(label,fn,{primary=false,disabled=false,parent=content}={}){const b=node('button',label,primary?'career-primary':'');b.type='button';b.disabled=disabled;b.onclick=()=>{if(valid())fn(b);};parent.append(b);return b;}
  function box(title){const e=node('section',null,'career-panel');if(title)e.append(node('h2',title));content.append(e);return e;}
  function row(parent,label,value,met){const e=node('div',null,'career-row'+(met?' career-met':''));e.append(node('span',(met?'✓ ':'')+label),node('span',value));parent.append(e);return e;}
  function choice(parent,title,subtitle,artwork,fn){const b=button('',fn,{parent});b.className='career-choice';const thumb=node('div',null,'career-thumb'),im=node('img');im.src=artwork;im.alt='';if(artwork.endsWith('-tile.webp'))thumb.classList.add('career-learning-tile');thumb.append(im);const text=node('span');text.append(node('strong',title),node('small',subtitle));b.append(thumb,text);return b;}
  section.onkeydown=e=>{if(e.key==='Escape'&&valid()){e.preventDefault();back();}if(e.key==='Tab'){const bs=[...section.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(b=>b.getClientRects().length),first=bs[0],last=bs.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};returnButton.focus({preventScroll:true});return {content,valid,button,box,row,choice,message,section};
 }
 function compactCareer(p,promotionCard=false){
  const incomeCard=p.section.classList.contains('career-income-fixed');
  p.section.classList.add('career-fixed');if(promotionCard)p.section.classList.add('career-promotion-fixed');const paper=p.section.querySelector('.career-paper'),heading=node('div',null,'career-fixed-heading'),header=p.content.querySelector('header'),title=p.content.querySelector('h1'),viewport=node('div',null,'career-scroll-viewport'),scroll=node('div',null,'career-fixed-scroll'),body=node('div',null,'career-scroll-body');
  header.insertBefore(title,header.lastChild);heading.append(header);paper.prepend(heading);for(const child of [...p.content.children])body.append(child);scroll.append(body);scroll.id=incomeCard?'career-income-scroll':promotionCard?'career-promotion-scroll':'career-home-scroll';scroll.tabIndex=0;scroll.setAttribute('aria-label',incomeCard?'本月职业收入，可上下滑动':promotionCard?'晋升条件与待遇，可上下滑动':'职业信息，可上下滑动');viewport.append(scroll);p.content.replaceChildren(viewport);
  const sections=[...body.querySelectorAll(':scope > .career-panel')],icons=promotionCard?['management','coffee']:['coffee','management','clock'];sections.forEach((section,i)=>{if(p.section.classList.contains('career-school'))return;const h=section.querySelector('h2'),icon=node('span',null,'career-heading-icon');icon.innerHTML=coffeeIcon(icons[i]);h.prepend(icon);});
  const rail=node('div',null,'career-scroll-rail'),thumb=node('div',null,'career-scroll-thumb');thumb.tabIndex=0;thumb.setAttribute('role','scrollbar');thumb.setAttribute('aria-label',incomeCard?'滚动职业收入':'滚动职业信息');thumb.setAttribute('aria-controls',scroll.id);thumb.setAttribute('aria-orientation','vertical');thumb.setAttribute('aria-valuemin','0');rail.append(thumb);viewport.append(rail);
  function update(){if(!p.valid())return;const max=Math.max(0,scroll.scrollHeight-scroll.clientHeight),height=Math.min(rail.clientHeight,Math.max(44,rail.clientHeight*scroll.clientHeight/Math.max(1,scroll.scrollHeight))),travel=Math.max(0,rail.clientHeight-height);thumb.style.height=height+'px';thumb.style.transform='translateY('+(max?travel*scroll.scrollTop/max:0)+'px)';thumb.setAttribute('aria-valuemax',String(max));thumb.setAttribute('aria-valuenow',String(Math.round(scroll.scrollTop)));thumb.setAttribute('aria-disabled',String(!max));}
  scroll.addEventListener('scroll',update,{passive:true});const observer=new ResizeObserver(update);observer.observe(scroll);observer.observe(body);p.section._careerCleanup=()=>observer.disconnect();requestAnimationFrame(update);header.querySelector('button').focus({preventScroll:true});
  let drag=null;thumb.onpointerdown=e=>{if(!p.valid())return;drag={y:e.clientY,top:scroll.scrollTop};thumb.setPointerCapture(e.pointerId);e.preventDefault();};thumb.onpointermove=e=>{if(!drag||!p.valid())return;const travel=rail.clientHeight-thumb.offsetHeight,max=scroll.scrollHeight-scroll.clientHeight;if(travel>0)scroll.scrollTop=drag.top+(e.clientY-drag.y)*max/travel;};thumb.onpointerup=thumb.onpointercancel=()=>{drag=null;};
  rail.onclick=e=>{if(e.target!==rail||!p.valid())return;scroll.scrollTop=(e.clientY-rail.getBoundingClientRect().top)/Math.max(1,rail.clientHeight)*(scroll.scrollHeight-scroll.clientHeight);};thumb.onkeydown=e=>{if(!p.valid())return;const delta={ArrowDown:64,ArrowUp:-64,PageDown:scroll.clientHeight*.8,PageUp:-scroll.clientHeight*.8};if(e.key in delta){e.preventDefault();scroll.scrollTop+=delta[e.key];}else if(e.key==='Home'||e.key==='End'){e.preventDefault();scroll.scrollTop=e.key==='Home'?0:scroll.scrollHeight;}};
 }
 function room(){close();openRoom();}
 function learning(){
  if(!state)return;
  const roomArt=elRoomArtwork();
  const p=panel('学习','learning-banner',room);
  p.section.classList.add('career-study-story');
  if(roomArt)p.section.style.setProperty('--learning-room-art','url("'+roomArt+'")');
  const scene=p.section.querySelector('.career-scene');
  const month=p.content.querySelector('header > span');
  const title=p.content.querySelector('h1');
  p.content.replaceChildren(title,month);
  scene.remove();
  title.className='career-study-heading';
  month.className='career-study-date';
  if(state.month===0)month.classList.add('career-study-art-date');
  for(const [label,action,key] of [
   ['学历学习',education,'education'],['职业技能',()=>skills('learning'),'skills'],
   ['兴趣爱好',hobbies,'hobbies'],['返回房屋',room,'back']
  ]){
   const button=p.button(label,action);
   button.className='career-study-target career-study-'+key;
  }
  p.content.querySelector('button').focus({preventScroll:true});
 }
 function elRoomArtwork(){
  return document.querySelector('#roomView .room-canvas>img')?.getAttribute('src');
 }
 const originalEducation=openEducation;
 function education(){if(state.study||state.education!=='highschool'||(state.educationPlans?.graduates||[]).some(g=>!g.seen)){close();return originalEducation();}const p=panel('学历学习','education-route-banner',learning),list=node('div',null,'career-list');
  p.section.classList.add('career-education-route');
  p.content.append(node('p','当前学历：高中','career-education-level'),list);
  for(const [id,title,sub,art]of [
   ['associate','转学型副学士 AA','先读 AA，再衔接本科','education-route-aa'],
   ['bachelorDirect','直接读本科','查看本科课程与学习安排','education-route-bachelor']
  ])p.choice(list,title,sub,'assets/career-learning-20261115/'+art+'.webp',()=>{close();EducationPages.route(id);});
  p.button('返回学习',learning).classList.add('career-back');
 }
 function hobbies(){const p=panel('兴趣爱好','hobbies',learning),list=node('div',null,'career-list career-hobby-grid');p.content.append(list);for(const id of H.hobbies){const a=H.activities[id],xp=H.xp(state,id);p.choice(list,a.name,'Lv.'+H.level(xp)+(xp>=800?' · 已满级':'')+' · 查看 →','assets/hobbies/'+a.art+'.webp',()=>{close();HobbyPages.detail(id);});}p.button('返回学习',learning).classList.add('career-back');}
 let skillOrigin='learning';
 function skills(origin=skillOrigin){
  skillOrigin=origin;
  const back=origin==='career'?career:learning;
  const p=panel('职业技能','skills',back);
  const art='assets/career-learning-20261115/';
  p.section.classList.add('career-skills-room');
  const paper=p.section.querySelector('.career-paper');
  const scene=paper.querySelector('.career-scene');
  scene.querySelector('img').src=art+'skills-crayon-banner.webp';
  const heading=node('div',null,'career-skills-heading');
  heading.append(p.content.querySelector('header'),p.content.querySelector('h1'));
  paper.prepend(heading);
  const list=node('div',null,'career-list');
  p.content.append(list);
  function skillChoice(title,level,thumbnail,open){
   const entry=p.choice(list,title,'Lv.'+level,art+thumbnail,open);
   const arrow=node('span','›','career-skills-arrow');
   arrow.setAttribute('aria-hidden','true');
   entry.append(arrow);
  }
  skillChoice(H.activities.latte.name,H.level(H.xp(state,'latte')),'skills-crayon-latte.webp',()=>{close();HobbyPages.detail('latte');});
  skillChoice(H.activities.pourOver.name,H.level(H.xp(state,'pourOver')),'skills-crayon-pour.webp',()=>{close();HobbyPages.detail('pourOver');});
  skillChoice('管理课程',R.skillLevel(state,'management'),'skills-crayon-management.webp',()=>management());
  p.button(origin==='career'?'返回我的职业':'返回学习',back).classList.add('career-back');
  heading.querySelector('button').focus({preventScroll:true});
 }
 function management(notice='',back=skills){if(typeof notice!=='string')notice='';coffeeCareerData();const p=panel('管理基础课程','management',back),opts=()=>({free:currentCareerTime().free,reserve:necessaryPetCareHours(),recovery:isRecoveryMonth(state),save}),expected=R.courseToken(state),miss=R.courseMissing(state,opts()),xp=Math.max(0,state.coffee.skills.management.xp||0);
  p.content.append(node('p','学习沟通协调、任务安排与团队管理。','career-skill-intro'));
  const level=p.box('管理技能 Lv.'+R.skillLevel(state,'management'));level.classList.add('career-management-level');const bar=node('progress');bar.max=400;bar.value=xp;bar.setAttribute('aria-label','管理技能累计经验');level.append(bar,node('p',xp+' / 400 XP'));
  const stats=p.box('本次学习');p.row(stats,'课程费用',money(120));p.row(stats,'自由时间','−3小时');p.row(stats,'能量','−1');p.row(stats,'管理经验',R.skillLevel(state,'management')>=5?'已满级':'+'+Math.min(10,400-xp)+'XP');
  p.content.append(node('p','本月已学习 '+R.courseRows(state).length+'次','career-note'),p.message);p.message.textContent=notice||miss.join('；');
  p.button(R.skillLevel(state,'management')>=5?'已满级':'确认学习',b=>{b.disabled=true;const r=R.course(state,expected,opts());if(!r.ok){p.message.textContent=r.reason;b.disabled=false;return;}render();management('本次课程已保存。',back);},{primary:true,disabled:!!miss.length});p.button(back===career?'返回我的职业':'返回职业技能',back).classList.add('career-back');
  p.section.classList.add('career-management-card');stats.classList.add('career-management-stats');[...stats.querySelectorAll('.career-row')].forEach((row,i)=>{const icon=node('span',null,'career-course-icon');icon.innerHTML=coffeeIcon(['money','clock','energy','management'][i]);row.prepend(icon);});compactCareer(p);const badge=node('span','课程档案','career-course-badge');p.section.querySelector('.career-fixed-heading header').append(badge);
 }
 function career(){if(SchoolCareer.role(state.job)){if(showReadySchoolPromotion(schoolWork))return;return schoolWork();}coffeeCareerData();const k=R.role(state.job),p=panel('我的职业','career',room,state.month,true),work=p.box('工作'),x=coffeeMonthlyIncome();work.classList.add('career-job-summary');p.row(work,'岗位',state.job||'未就业');p.row(work,'工资',money(x?.baseWages??(state.job&&!state.retired&&!state.unemployedMonths?state.salary:0))+'/月');p.row(work,'时间',state.job&&!state.retired?(state.workHoursPerWeek||R.roles[k]?.weekly||40)+'小时/周':'—');p.row(work,'小费',money(x?.baseTips||0)+'/月');
  if(k==='manager'){
   p.section.classList.add('career-store-manager');
   p.section.querySelector('.career-scene img').src=CareerEventData.cards['manager-equipment'].art;
  }
  if(window.CafeEquityPages){
   const position=CafeEquity.position(state);
   if(CafeEquity.eligible(state)&&!CafeEquity.current(state)?.shares&&!CafeEquity.current(state)?.trade)p.button('门店股权购买',CafeEquityPages.invitation,{parent:work}).classList.add('career-equity-entry');
   if(position.length)p.button('我的股份',()=>CafeEquityPages.holdings(),{parent:work});
  }
  const growth=p.box('职业成长'),list=node('div',null,'career-skill-list');growth.classList.add('career-growth-options');growth.append(list);
  const serviceLevel=R.skillLevel(state,'service'),serviceXP=Math.floor(state.coffee.skills.service.xp);
  const serviceProgress=serviceLevel===5?serviceXP+' XP · 已满级':serviceXP+' / '+(serviceLevel*100)+' XP';
  const managementXP=Math.floor(state.coffee.skills.management.xp);
  const entries=['latte','pourOver'].map(id=>[
   H.activities[id].name,R.specialty(state,id),H.xp(state,id)+' XP',id,
   ()=>{close();HobbyPages.detail(id,'',career);}
  ]);
  entries.push(['顾客服务',serviceLevel,serviceProgress,'customer-service',()=>serviceSkill(serviceLevel,serviceProgress)]);
  entries.push(['管理技能',R.skillLevel(state,'management'),managementXP+' / 400 XP','management',()=>management('',career)]);
  for(const [name,level,experience,art,open] of entries){
   const entry=p.button('',open,{parent:list});entry.classList.add('career-skill-entry');
   const illustration=node('img',null,'career-skill-illustration');
   illustration.src='assets/career-crayon/'+art+'.webp';illustration.alt='';
   const summary=node('span',null,'career-skill-summary');
   summary.append(node('strong',name),node('small',experience));
   const rank=node('span','Lv. '+level,'career-skill-level');
   const arrow=node('span','›','career-skill-arrow');arrow.setAttribute('aria-hidden','true');
   entry.append(illustration,summary,rank,arrow);
  }
  if(R.next(state))p.button('查看晋升条件',promotion,{parent:growth});const other=p.box('其他选择');p.button('查看其他工作机会',()=>{close();openCareerMarket();},{parent:other});p.button(state.pendingResignation?'已安排下个月离职':'申请辞职',resignation,{parent:other,disabled:!state.job});p.button('返回房屋',room).classList.add('career-back');
  window.showRoomBehindPanel?.();
  p.section.classList.add('career-story-profile');
  compactCareer(p);
 }
 function serviceSkill(level,experience){
  const p=panel('顾客服务','customer-service',career),progress=p.box('顾客服务 Lv.'+level);
  p.section.classList.add('career-service-card');
  const bar=node('progress');bar.max=level===5?400:level*100;
  bar.value=Math.floor(state.coffee.skills.service.xp);bar.setAttribute('aria-label','顾客服务经验');
  progress.append(bar,node('p',experience,'career-service-xp'));
  p.row(progress,'经验来源','日常工作');
  p.button('返回我的职业',career).classList.add('career-back');
  compactCareer(p);
 }
 function schoolWork(){
  const S=SchoolCareer,working=S.working(state),p=panel('我的职业','school',room);
  if(state.job==='小学校长'){
   const box=p.box('工作'),time=currentCareerTime();
   p.row(box,'岗位',state.job);
   p.row(box,'工资',money(working?state.annualSalary:0)+'/年');
   p.row(box,'本月工作时间',time.monthlyWork+' 小时');
   p.row(box,'本月自由时间',time.free+' 小时');
   const growth=p.box('职业成长');
   growth.append(node('p','已达到本职业最高岗位'));
   p.button('职业历程',schoolHistory,{parent:growth});
   p.button('查看其他工作机会',()=>{close();openCareerMarket();});
   p.button('申请辞职',resignation);
   p.button('返回房屋',room,{primary:true});
   compactCareer(p);
   return;
  }
  p.section.classList.add('school-work-illustrated');
  p.section.querySelector('.career-scene').remove();
  p.content.replaceChildren();
  const card=node('div',null,'school-work-art'),img=node('img');
  img.src='assets/school-career/work-card.webp';
  img.alt='我的职业：青年教师在教室里备课';
  img.width=941;img.height=1672;
  card.append(img);p.content.append(card);
  const values={
   date:date(state.month),job:state.job,salary:money(working?state.salary:0)+'/月',
   hours:working?currentCareerTime().monthlyWork+'小时':'—',
   free:working?currentCareerTime().free+'小时':'—',
   instruction:'教学设计 Lv.'+S.level(state,'instruction'),
   communication:'沟通协调 Lv.'+S.level(state,'communication'),
   administration:'学校管理 '+(state.job==='小学教师'?'待解锁':'Lv.'+S.level(state,'administration')),
  };
  const captions={job:'岗位',salary:'工资',hours:'本月工作时间',free:'本月自由时间'};
  for(const [id,value] of Object.entries(values)){
   const field=node('span',value,'school-work-value school-work-'+id);
   if(captions[id])field.setAttribute('aria-label',captions[id]+' '+value);
   card.append(field);
  }
  for(const [id,label,action,disabled] of [
   ['back','返回',room,false],
   ['skills','查看职业技能',schoolSkills,!working],
   ['promotion',state.job==='小学校长'?'职业历程':'查看晋升条件',state.job==='小学校长'?schoolHistory:schoolPromotion,!working],
   ['home','返回房屋',room,false],
  ]){
   const button=p.button('',()=>action(),{parent:card,disabled});
   button.classList.add('school-work-hit','school-work-hit-'+id);
   button.setAttribute('aria-label',label);
  }
  if(working&&S.reviewTasks(state).length)schoolReviewEntry(p);
  if(working&&state.job==='小学副校长')p.button('全校改进项目 · '+Number(S.projectProgress(state)===3)+'/1',schoolProject);
  const track=p.box('小学教师晋升路线');
  for(const {name,base,allowance=0} of S.stages)p.row(track,name,money(base+allowance)+'/年'+(allowance?'（含 '+money(allowance)+' 岗位津贴）':''));
  const other=p.box('其他选择');
  p.button('查看其他工作机会',()=>{close();openCareerMarket();},{parent:other});
  p.button(state.pendingResignation?'已安排下个月离职':'申请辞职',resignation,{parent:other});
  card.querySelector('button').focus({preventScroll:true});
 }
 function schoolSkills(notice=''){
  const S=SchoolCareer,job=state.job,month=state.month;
  if(!S.working(state))return career();
  const p=panel('小学教师职业技能','school',career);
  if(notice)p.content.append(node('p',notice));
  for(const [id,skill] of Object.entries(S.skills)){
   const box=p.box(skill.name),level=S.level(state,id);
   const progress=level===S.thresholds.length?'已满级':S.xp(state,id)+' / '+S.thresholds[level]+' XP';
   p.row(box,'Lv.'+level,progress);
   const blocked=S.practiceBlock(state,id);
   if(blocked)box.append(node('p',blocked));
   const list=node('div',null,'school-option-list');
   box.append(list);
   const card=p.button('',()=>{
    if(state.job!==job||state.month!==month)return schoolSkills();
    schoolSkills(S.practice(state,id)?'练习已保存。':'本次未保存，请重试。');
   },{parent:list,disabled:!!blocked});
   const art=node('img');
   art.src='assets/school-career/skill-'+id+'.webp';
   art.alt='';
   const detail=node('span');
   detail.append(node('strong',skill.practice),node('small',skill.hours+' 小时 · 能量 −2 · +10 XP'));
   card.append(art,detail);
  }
  p.button('返回我的职业',career);
  compactCareer(p,true);
 }
 function schoolArtwork(p,id,description){
  const img=node('img');
  img.src='assets/school-career/'+id+'.webp';
  img.alt=description;
  img.style.cssText='display:block;width:100%;height:auto;border-radius:12px';
  p.content.append(img);
 }
 function schoolHistory(){
  const p=panel('职业历程','school',career);
  schoolArtwork(p,'approved-history','小学教师、资深小学教师、年级组长、小学副校长、小学校长（当前岗位）');
  p.button('返回职业页',career);
  compactCareer(p,true);
 }
 function schoolReviewEntry(p){
  const S=SchoolCareer,management=S.reviewType(state)==='management';
  const label=management?'管理跟进':'教学改进';
  const box=p.box(management?'年度管理考核':'年度教学考核');
  p.row(box,management?'日常管理':'日常教学','随上班自动记录');
  p.row(box,label,'本学年 '+Number(!!S.improvement(state))+'/1');
  const check=S.requirements(state).find(([name])=>name.startsWith('年度'));
  if(check)p.row(box,check[0],check[1]);
  p.button(label,schoolImprovement,{parent:box});
  if(state.schoolCareer?.latestReview)p.button('查看最近考核结果',()=>schoolReviewResult(state.schoolCareer.latestReview,career),{parent:box});
 }
 function schoolPaintedCard(p,asset,alt){
  p.section.classList.add('school-painted-improvement');
  p.section.querySelector('.career-scene').remove();
  const card=node('div',null,'school-improvement-art');
  const img=node('img');
  img.src='assets/school-career/'+asset+'.webp';
  img.alt=alt;
  card.append(img);
  p.content.replaceChildren(card);
  return card;
 }
 function improvementHit(p,card,label,action,[x,y,w,h]){
  const button=p.button('',action,{parent:card});
  button.setAttribute('aria-label',label);
  button.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';
  button.classList.add('school-improvement-hit');
  return button;
 }
 function schoolImprovement(notice=''){
  const S=SchoolCareer,management=S.reviewType(state)==='management',job=state.job,month=state.month;
  const label=management?'管理跟进':'教学改进';
  const p=panel(label,'school',career),done=S.improvement(state);
  const tasks=S.reviewTasks(state);
  function choose(i){
   const [title,description]=tasks[i];
   const q=panel(title,'school',schoolImprovement);
   const confirm=()=>{
    if(state.job!==job||state.month!==month)return career();
    if(S.improve(state,i))schoolImprovement('已完成。');
    else q.message.textContent='当前可用自由时间不足或无法执行。';
   };
   if(!management){
    const card=schoolPaintedCard(q,'approved-improvement-'+i,title+'。'+description+' 消耗 4 小时自由时间，本学年教学改进 0/1 → 1/1。');
    const buttons=[
     [[15,84,34,10],[50,84,37,10]],
     [[15,84,34,10],[50,84,37,10]],
     [[16,84,32,10],[50,84,33,10]],
    ][i];
    improvementHit(q,card,'返回选择',schoolImprovement,buttons[0]).focus({preventScroll:true});
    improvementHit(q,card,'确认执行',confirm,buttons[1]);
   }else{
    q.content.append(node('p',description),q.message);
    q.row(q.content,'自由时间','消耗 4 小时');
    q.row(q.content,'本学年'+label,'0/1 → 1/1');
    q.button('确认执行',confirm,{primary:true});
    q.button('返回选择',schoolImprovement);
    compactCareer(q,true);
   }
   if(!management)q.content.append(q.message);
  }
  if(management&&!done){
   const card=schoolPaintedCard(p,'approved-management-menu',
    '年度管理考核。日常管理随上班自动记录。管理跟进本学年 0/1，任选一项消耗 4 小时自由时间。');
   const reviews=S.requirements(state).find(([name])=>name==='年度管理考核');
   paintedValue(card,[82,78,10,3.4],reviews?.[1].match(/^(\d+) /)?.[1]+'/2');
   paintedValue(card,[74,86.4,11,3.4],Number(S.projectProgress(state)===3)+'/1');
   if(S.schoolYear(state)>0)paintedValue(card,[78,2,19,4.5],'第 '+(S.schoolYear(state)+1)+' 学年');
   improvementHit(p,card,'返回职业页',career,[3,2,20,5]).focus({preventScroll:true});
   for(const [i,[title]] of tasks.entries())improvementHit(p,card,title,()=>choose(i),[74,55.5+i*7.1,20,4.6]);
   improvementHit(p,card,'全校改进项目',schoolProject,[2,84.5,96,7]);
   improvementHit(p,card,'返回房屋',room,[28,92.7,44,6.5]);
   return;
  }
  if(!management&&!done){
   const card=schoolPaintedCard(p,'approved-improvement-menu','年度教学考核。日常教学随上班自动记录。教学改进本学年 0/1，任选一项消耗 4 小时自由时间，学年末自动评定。');
   const period=node('span','第 '+(S.schoolYear(state)+1)+' 学年','school-improvement-year');
   const position=node('span',job,'school-improvement-job');
   if(S.schoolYear(state)>0)card.append(period);
   if(job!=='小学教师')card.append(position);
   improvementHit(p,card,'返回职业页',career,[3,2,20,5]).focus({preventScroll:true});
   for(const [i,[title]] of tasks.entries())improvementHit(p,card,title,()=>choose(i),[75,58.5+i*8.5,19,6]);
   improvementHit(p,card,'返回房屋',room,[28,91,44,8]);
   return;
  }
  if(typeof notice==='string'&&notice)p.content.append(node('p',notice));
  p.content.append(node('p','本学年 '+Number(!!done)+'/1 · 学年末自动评定'));
  if(done)p.content.append(node('p','已完成 · '+tasks[done.index][0]));
  else for(const [i,[title]] of tasks.entries())p.button(title,()=>choose(i));
  p.button('返回职业页',career);
  compactCareer(p,true);
 }
 function schoolReviewResult(result,back){
  const management=result.type==='management',label=management?'管理':'教学';
  const p=panel('年度'+label+'考核','school',back);
  const box=p.box('第 '+result.year+' 学年');
  p.row(box,'日常'+label,result.daily?'已完成':'未完成');
  p.row(box,management?'管理跟进':'教学改进',result.task?'已完成 · '+result.task:'未完成');
  p.row(box,'考核结果',result.passed?'合格':'未合格',result.passed);
  const total=result.total;
  if(total!=null)p.row(box,'晋升进度',total+'/'+result.target);
  p.button('继续',()=>{close();back();},{primary:true});
  compactCareer(p,true);
 }
 function paintedValue(card,region,value){
  const [x,y,w,h]=region,field=node('span',value,'school-painted-value');
  field.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';
  card.append(field);
  return field;
 }
 function schoolProject(){
  const S=SchoolCareer,progress=S.projectProgress(state),job=state.job,month=state.month;
  const p=panel('全校改进项目','school',career);
  const card=schoolPaintedCard(p,'approved-project',
   '全校改进项目：早上第一节课，谁还没到？按月完成查原因、试办法、看结果。');
  if(progress){
   paintedValue(card,[35,45.2,10,3.4],progress+'/3');
   paintedValue(card,[84.5,45.2,10,3.4],Number(progress===3)+'/1');
  }
  const steps=[
   [73.8,55.9,22,5.1],[73.8,67.7,22,5.1],[72,79.7,24.5,5.1],
  ];
  const actions=['开始','试行改进办法','提交总结'];
  const blocked=!S.working(state)||S.entry(state).project?.month===month||isRecoveryMonth(state);
  for(const [i,region] of steps.entries()){
   if(i<progress||i===progress&&(progress>0||blocked)){
    const text=i<progress?'已完成':blocked?'待开放':actions[i];
    const value=paintedValue(card,region,text);
    value.classList.add('school-painted-step');
    if(i===progress&&!blocked)value.classList.add('school-painted-step-ready');
   }
   if(i===progress&&!blocked)improvementHit(p,card,actions[i],()=>{
    if(state.job!==job||state.month!==month)return career();
    if(S.advanceProject(state))schoolProject();
    else p.message.textContent='当前无法推进，请在下个月再试。';
   },region);
  }
  p.content.append(p.message);
  improvementHit(p,card,'返回',career,[3,2,17,4]).focus({preventScroll:true});
  improvementHit(p,card,'返回职业页',career,[25,91,50,7.5]);
 }
 function schoolOpenClass(){
  const S=SchoolCareer,attempt=S.drawOpenClass(state);
  if(!attempt)return schoolPromotion('公开课未能打开。');
  const card=S.openClasses.find(item=>item.id===attempt.id);
  const q=panel(card.title,'school',schoolPromotion);
  schoolArtwork(q,'approved-'+card.id,card.title+'，公开课情境与三个选项');
  for(const [choice,label] of card.choices.entries())q.button('ABC'[choice]+' · '+label,()=>{
   const result=S.resolveOpenClass(state,attempt,choice);
   if(!result){q.message.textContent='本次未保存，请重试。';return;}
   const feedback=(result.passed?'公开课通过。':'公开课未通过。')+result.feedback;
   if(!showReadySchoolPromotion(()=>schoolPromotion(feedback)))schoolPromotion(feedback);
  });
  q.content.append(q.message);
  q.button('返回晋升条件',schoolPromotion);
  compactCareer(q,true);
 }
 function schoolPromotion(notice=''){
  const S=SchoolCareer,current=state.job,month=state.month,stage=S.role(current),index=S.stages.indexOf(stage),next=S.stages[index+1];
  if(!next||!S.working(state))return career();
  const p=panel('晋升'+next.name,'school',career),checks=p.box('晋升条件'),r=S.entry(state);
  for(const [label,value,met] of S.requirements(state))p.row(checks,label,value+' · '+(met?'已满足':'待完成'),met);
  if(typeof notice==='string'&&notice)p.content.append(node('p',notice));
  function scenario(id,submit){
   const card=S.scenarios[id];
   p.button(card.title,()=>{
    const q=panel(card.title,'school',schoolPromotion);
    const select=i=>{
     if(state.job!==current||state.month!==month)return career();
     const passed=i===card.answer;
     const saved=submit(passed),message=saved?(passed?'已通过并保存。':'本次未通过，结果已保存。'):'本次未保存，请重试。';
     if(!saved||!passed||!showReadySchoolPromotion(()=>schoolPromotion(message)))schoolPromotion(message);
    };
    const regions={
     sports:[[3,56.2,94,11.5],[3,69.4,94,13],[3,83.8,94,12.7]],
     parents:[[3,56.1,94,11.7],[3,69.3,94,12],[3,82.9,94,13.6]],
     cafeteria:[[4.7,53.4,90.6,13],[4.7,67.9,90.6,13],[4.7,82.4,90.6,13]],
     deputy:[[3,54.6,94,12.4],[3,68.4,94,13.9],[3,83.4,94,12.8]],
     principal:[[3,54.6,94,12.4],[3,68.4,94,12.4],[3,81.8,94,14.5]],
    }[id];
    const painted=schoolPaintedCard(q,'approved-'+id+'-card',[card.title,card.intro,card.prompt].filter(Boolean).join(' '));
    for(const [i,[name,detail]] of card.choices.entries()){
     improvementHit(q,painted,'ABC'[i]+' · '+name+'。'+detail,()=>select(i),regions[i]);
    }
    q.button('返回晋升条件',schoolPromotion).focus({preventScroll:true});

   });
  }
  if(S.reviewTasks(state).length)p.button(S.reviewType(state)==='management'?'管理跟进':'教学改进',schoolImprovement);
  if(index<2){
   const classes=S.openClassRecord(state);
   if(S.openClassPasses(classes)<S.requiredOpenClassPasses){
    if(classes.taskAttempt!==month&&S.canTeach(state))p.button('报名公开课',schoolOpenClass);
    else p.content.append(node('p',classes.taskAttempt===month?'本月已参加公开课。':'教学月可报名公开课。'));
   }
  }
  if(index===1)for(const id of ['sports','parents']){
   if(!S.collaborationPassed(state,id)&&r.collaborationAttempt?.[id]!==month)scenario(id,passed=>S.collaborate(state,id,passed));
  }
  if(index===2){
   if(!S.hasMasters(state))p.button('查看学历学习',education);
   else if(!r.task&&r.taskAttempt!==month)scenario('cafeteria',passed=>S.assess(state,passed));
  }
  if(index===3)p.button('全校改进项目',schoolProject);
  const interview=S.interview(current);
  if(interview){
   const status=S.interviewStatus(state);
   if(S.canInterview(state))scenario(interview.card,passed=>S.completeInterview(state,passed));
   else if(!status.passed&&status.attempted)p.content.append(node('p','本学年'+interview.task+'未通过，下学年可再参加。'));
  }
  if(state.schoolCareer?.pending)p.content.append(node('p','晋升已安排，下月上任。'));
  else if(schoolPromotionReady())p.button('查看晋升通知',()=>schoolPromotionOffer(schoolPromotion),{primary:true});
  p.button('返回我的职业',career);
  compactCareer(p,true);
 }
 function schoolPromotionReady(){
  const S=SchoolCareer,stage=S.role(state.job);
  return S.working(state)&&!!stage?.months&&!state.pendingResignation&&!state.schoolCareer?.pending&&
   S.entry(state).applicationYear!==S.year(state)&&S.requirements(state).every(row=>row[2]);
 }
 function showReadySchoolPromotion(back){
  if(!schoolPromotionReady()||state.schoolCareer?.seenOffers?.[state.job])return false;
  const saved=R.atomic(state,()=>{
   (state.schoolCareer.seenOffers??={})[state.job]=true;
   return {};
  },save);
  if(!saved.ok)return false;
  schoolPromotionOffer(back);
  return true;
 }
 function schoolPromotionOffer(back){
  const S=SchoolCareer,current=state.job,month=state.month,index=S.stages.indexOf(S.role(current)),next=S.stages[index+1];
  if(!next||!schoolPromotionReady())return back();
  const q=panel('升任'+next.name,'school',()=>{close();back();});
  q.section.querySelector('.career-scene')?.remove();
  schoolArtwork(q,'approved-promotion-'+index,'升任'+next.name+'，晋升条件已达标');
  const pay=q.box('新岗位待遇（常规教学月）'),annual=next.base+(next.allowance||0);
  q.row(pay,'工资',index===3?money(annual)+'/年':money(annual/12)+'/月');
  q.row(pay,'工作时间','160 小时/月');
  q.row(pay,'自由时间','100 小时/月');
  q.content.append(q.message);
  q.button('接受晋升',()=>{
   if(state.job!==current||state.month!==month)return;
   if(!S.apply(state,true)){q.message.textContent='本次未保存，请重试。';return;}
   close();back();
  },{primary:true});
  q.button('稍后决定',()=>{close();back();});
  compactCareer(q,true);
 }
 function promotion(notice=''){if(typeof notice!=='string')notice='';coffeeCareerData();const next=R.next(state);if(!next)return career();const p=panel(next==='manager'?'晋升店长':'晋升值班主管',next==='manager'?'manager-promotion':'shift-promotion',career),box=p.box('晋升条件'),token=R.promotionToken(state),pending=state.coffee.progression.pending;
  if(next==='manager')p.section.classList.add('career-manager-promotion');
  for(const r of R.requirements(state)){let value=r.id==='trust'?r.value+' / '+r.target:r.unit?r.value+' / '+r.target+r.unit:'Lv.'+r.value+' / Lv.'+r.target;if(r.id==='service')value+='（'+((r.target-1)*100)+' XP）';if(r.id==='specialty')value=r.detail+'；拉花 Lv.'+r.levels.latte+'｜手冲咖啡 Lv.'+r.levels.pourOver+(r.value>=r.target?' · 已满足':' · 尚未满足');p.row(box,r.label,value,r.value>=r.target);}
  const cfg=R.roles[next],pay=p.box('晋升后待遇');p.row(pay,'岗位基础年薪',money(cfg.base));p.row(pay,'按当前学历预计年薪',money(R.annual(state,next)));const calendarMonth=coffeeCalendar().month,tips=next==='manager'?coffeeSeason(calendarMonth).tips*1.5:shiftBaseTips(calendarMonth);p.row(pay,'本季基础小费',money(tips)+'/月');if(next==='manager'){p.row(pay,'固定奖金',money(500)+'/月');pay.append(node('p','当月有缺席则无固定奖金，加班不能补回。','career-note'));}p.row(pay,'每周工作',cfg.weekly+'小时');p.row(pay,'基础自由时间',(260-cfg.weekly*4)+'小时/月');pay.append(node('p','工资按最高学历加成计算。','career-note'));
  p.content.append(p.message);p.message.textContent=notice||'';const miss=R.missing(state);p.button(pending?'已确认，下个月生效':miss.length?'条件尚未满足':'确认晋升，下个月生效',b=>{b.disabled=true;const r=R.promote(state,token,save);if(!r.ok){p.message.textContent=r.reason;b.disabled=false;return;}render();promotion('晋升安排已保存，下个月生效。');},{primary:true,disabled:!!pending||!!miss.length});p.button('返回我的职业',career).classList.add('career-back');compactCareer(p,true);
 }
 const generalCareerMarket=openCareerMarket;
 function opportunities(){if(window.CafeEquity?.hasDelegatedControl(state)&&!CafeEquity.requiresManagement(state)){close();return generalCareerMarket();}const p=panel('其他工作机会','adjustment',career);p.content.append(node('p','暂时没有新的工作机会。','career-note'));p.button('返回我的职业',career).classList.add('career-back');compactCareer(p);}
 function adjustment(){return resignation();}
 function resignation(){const job=state.job,scheduled=state.pendingResignation,p=panel('辞职确认','resignation',career);if(window.CafeEquity?.requiresManagement(state)){p.content.append(node('p','持股低于 51% 时须自己管理门店。请先增持至 51% 或卖出股份。'));p.button('返回我的职业',career,{primary:true});return compactCareer(p);}p.content.append(node('p',job||'未就业'),node('h2','确定离开当前工作吗？'),node('p','本月仍正常结算应得工资，辞职从下个月开始生效。'),p.message);
  p.button(scheduled?'已安排，下个月离职':'确认辞职',b=>{if(state.job!==job||!job||state.pendingResignation||window.CafeEquity?.requiresManagement(state))return;b.disabled=true;const r=R.atomic(state,()=>{state.pendingResignation={from:job,requestedCycle:state.month,effectiveCycle:state.month+1};if(state.coffee?.progression)state.coffee.progression.pending=null;return {};},save);if(!r.ok){p.message.textContent=r.reason;b.disabled=false;return;}render();career();},{disabled:!!scheduled||!job});p.button(scheduled?'返回我的职业':'继续当前工作',career,{primary:true});compactCareer(p);
 }
 function paintArrivalIncome(p){
  p.section.classList.add('career-arrival-income');
  const paper=p.section.querySelector('.career-paper');
  const scene=paper.querySelector('.career-scene');
  scene.querySelector('img').src='assets/career-learning-20261115/income-crayon.webp';
  const header=p.content.querySelector('header');
  const title=p.content.querySelector('h1');
  header.prepend(title);
  const closeButton=header.querySelector('button');
  closeButton.textContent='×';
  closeButton.setAttribute('aria-label','返回房屋');
  const back=p.content.querySelector('.career-back');
  paper.prepend(header);
  p.content.prepend(scene);
  paper.append(back);
  p.content.tabIndex=0;
  p.content.setAttribute('aria-label','职业收入明细');
  closeButton.focus({preventScroll:true});
 }
 function income(receipt=null,automatic=false){const settled=receipt||state.lastSettlement,hasActual=!!settled?.careerIncome,x=hasActual?settled.careerIncome:coffeeMonthlyIncome(),month=hasActual?settled.month-1:state.month,p=panel('本月职业收入','income-banner',automatic?room:career,month,automatic);
  if(!automatic)p.section.classList.add('career-income-fixed');
  const layout=automatic?paintArrivalIncome:compactCareer;
  if(!x){p.content.append(node('p','本月没有职业收入记录。'));p.button(automatic?'返回房屋':'返回我的职业',automatic?room:career).classList.add('career-back');layout(p);return;}
  if(automatic){
   const total=node('div',null,'career-arrival-total');
   total.append(node('span','税前合计'),node('strong',money(x.total)));
   p.content.append(total);
  }
  const box=p.box('收入明细'),table=node('table',null,'career-income-table'),head=node('thead'),headRow=node('tr');table.setAttribute('aria-label',hasActual?'本月已结算职业收入':'本月预计职业收入');for(const label of ['项目','金额']){const th=node('th',label);th.scope='col';headRow.append(th);}head.append(headRow);table.append(head);const body=node('tbody');table.append(body);function entry(label,amount){const row=node('tr'),th=node('th',label);th.scope='row';row.append(th,node('td',money(amount)));body.append(row);}if(automatic)head.className='career-arrival-table-head';entry('基础工资',x.baseWages);entry('基础小费',x.baseTips);if(x.fixedBonus!=null)entry('固定奖金',x.fixedBonus);const eventWages=x.eventWages??x.extraWages;if(eventWages)entry(x.familyLeave?.hours?'工资调整（含请假）':x.eventId==='cut'&&eventWages<0?'排班工资调整':'加班工资',eventWages);if(x.eventBonus)entry('职业事件奖金',x.eventBonus);if(x.extraTips)entry('小费调整',x.extraTips);if(!automatic){const foot=node('tfoot'),sum=node('tr'),sumLabel=node('th','税前合计');sumLabel.scope='row';sum.append(sumLabel,node('td',money(x.total)));foot.append(sum);table.append(foot);}box.append(table);
  const status=p.box('结算状态');status.append(node('p',hasActual?'已结算':'待月末结算'),node('p',hasActual?'本月职业收入已按月末账单结算。':'这是本月预计收入，尚未到账。','career-note'));
  const t=p.box('工作时间');p.row(t,'基础工时',x.baseWeeklyHours+'小时/周');p.row(t,'本月临时工时',(x.workHoursDelta>0?'+':'')+x.workHoursDelta+'小时');p.row(t,'本月自由时间',x.freeHours+'小时');p.button(automatic?'返回房屋':'返回我的职业',automatic?room:career).classList.add('career-back');layout(p);
 }
 function afterArrival(){const a=state?.homeArrival,r=state?.careerLearning?.receipts?.[state?.month-1];if(!a||a.status!=='completed'||a.fromMonth!==state.month-1||!r||r.shown||state.requiredIncident||isRecoveryMonth(state)||state.gameOver?.final)return false;
  const result=R.atomic(state,()=>{r.shown=true;return {};},save);if(!result.ok)return false;income(r.settlement,true);return true;
 }
 function introduction(){const r=state.town?.movement?.relationshipLifeCard;if(!r||r.kind!=='landlord-introduction'||r.status!=='pending')return false;const p=panel('牵线介绍业内人士','landlord-introduction',()=>{close();showTown();});p.content.append(node('p',r.personName+'说：“我认识另一家咖啡店的合伙人，你要是有兴趣，我可以找个时间介绍你们认识。”'));const box=p.box('好呀，谢谢你帮忙介绍！');p.row(box,'自由时间','−1小时');p.row(box,'房东亲密度','+3');p.row(box,'认识咖啡店合伙人','初始亲密度10');p.content.append(p.message);p.button('好呀，谢谢你帮忙介绍！',b=>{b.disabled=true;const result=RelationshipLifeCards.confirm(state,r.id,0,{free:Math.max(0,currentCareerTime().free-necessaryPetCareHours()),save});if(!result.ok){p.message.textContent=result.reason==='time'?'自由时间不足。':'本次未保存，请重试。';b.disabled=false;return;}close();render();finish();},{primary:true});return true;}
 openCareerMarket=opportunities;$('jobMarketBtn').onclick=opportunities;
 window.CareerPages={panel,compactCareer,introduction,learning,education,skills,hobbies,management,career,promotion,adjustment,resignation,income,afterArrival,schoolReviewResult,showReadySchoolPromotion,close};
 openEducation=education;openWorkAdjustment=career;openCoffeeCourses=()=>skills('career');previewCoffeePromotion=promotion;confirmCoffeePromotion=()=>R.promote(state,R.promotionToken(state),save).ok;
 $('hobbyBtn').onclick=hobbies;
 // Capture the study hotspot before the legacy listener; all other room actions remain original.
 document.addEventListener('click',e=>{const b=e.target.closest('[data-room="study"]');if(!b||b.disabled||document.querySelector('.event-active')||!$('wlDrawer').hidden)return;e.stopImmediatePropagation();learning();},true);
 const auditBefore=showMonthlyAudit;showMonthlyAudit=function(s){if(s.careerIncome&&state?.homeArrival&&state.month>=state.homeArrival.targetMonth&&state.homeArrival.fromMonth===s.month-1){state.homeArrival.status='ready';save();return openRoom();}return auditBefore(s);};
})();

