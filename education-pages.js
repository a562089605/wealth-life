// Actual data/controls over preserved approved illustration headers; no baked sample values.
(function(){'use strict';const E=EducationPlans,money=n=>'$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});let overlay=null;
 const assets={associate:'associate-enrollment-preview',bachelor:'bachelor-enrollment-preview',bachelorDirect:'bachelor-enrollment-preview',master:'master-enrollment-preview',doctorate:'doctorate-enrollment-preview',progress:'associate-progress-arrangement-label-preview',paused:'paused-study-progress-preview',pace:'change-study-arrangement-preview',pause:'pause-study-confirmation-preview',resume:'resume-study-confirmation-preview',withdraw:'withdraw-study-confirmation-preview',refund:'cancel-enrollment-refund-preview',graduation:'associate-graduation-preview'};
 const names={highschool:'高中',associate:'副学士 AA',bachelor:'本科',bachelorDirect:'本科',master:'硕士',doctorate:'专业博士',professional:'专业学位'};
 // Existing courses keep their original duration and payment receipt; only new enrollments use this catalog.
 Object.assign(EDU,{doctorate:{name:'博士 / Doctorate',next:null,months:0,cost:0,mult:EDU.master.mult}});EDU_RANK.doctorate=5;EDU.bachelorDirect={...EDU.bachelor,name:'本科'};
 for(const [target,r]of Object.entries(E.routes))Object.assign(EDU[r.from],{next:target,months:r.months.slow,cost:r.cost});
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
 function close(){overlay?.remove();overlay=null;document.body.classList.remove('education-open');}
 function available(){return Math.max(0,currentCareerTime().free-(typeof necessaryPetCareHours==='function'?necessaryPetCareHours():0));}
 function nextAvailable(){const t=currentCareerTime(),base=t.baseFree??100;const debts=Object.values(state.eventTimeLedger?.events||{}).filter(e=>e.month<=state.month).reduce((n,e)=>n+(e.remaining||0),0)+Object.values(state.housingTimeDebt?.entries||{}).reduce((n,e)=>n+(e.remaining||0),0);return Math.max(0,base-debts-(typeof necessaryPetCareHours==='function'?necessaryPetCareHours():0));}
 const lateTime=currentCareerTime;currentCareerTime=function(){const t=lateTime();if(!state)return t;const recovery=isRecoveryMonth(state),h=recovery?0:E.reserved(state);return {...t,free:recovery?0:Math.max(0,t.free-h),educationHours:h};};
 const legacy=openEducation;
 openEducation=function(){if(!state)return;if(isRecoveryMonth(state)||state.health<30)return openHealthTreatment();if(state.study&&!E.modern(state.study))return legacy();const g=(state.educationPlans?.graduates||[]).find(g=>!g.seen);if(g)return show('graduation',g);return show(state.study?'progress':'enroll');};
 $('studyBtn').onclick=()=>openEducation();
 function show(mode,graduate,routeChoice){close();clearModals();window.RelationshipPages?.close();window.hideRoom?.();const owner=state,chosen=slot,month=state.month,st=state.study,id=st?.id,revision=st?.revision;let pace=st?.pending?.pace||st?.pace||'slow';
 const target=mode==='graduation'?graduate.target:st?.route||st?.target||routeChoice||EDU[state.education]?.next,r=st&&!E.current(st)?E.legacyRoutes[target]:E.routes[target];
 const valid=()=>state===owner&&slot===chosen&&state.month===month&&overlay===section&&(!st? !state.study:state.study?.id===id&&state.study?.revision===revision);
 const section=node('section',null,'education-overlay');overlay=section;section.setAttribute('role','dialog');section.setAttribute('aria-modal','true');section.setAttribute('aria-label',({enroll:'学历学习',progress:'学习进度',pace:'更改学习安排',pause:'暂停学习',resume:'恢复学习',withdraw:'退出学习',refund:'撤销本月报名',graduation:'毕业完成'})[mode]);document.body.append(section);document.body.classList.add('education-open');
 const paper=node('div',null,'education-paper'),scene=node('div',null,'education-scene'),img=node('img');
 const progress=mode==='progress';
 img.src=progress?'assets/learning-redraw/progress.webp':'assets/education/'+assets[mode==='enroll'?(r?target:'progress'):mode]+'.webp';
 img.alt=progress?'暖色蜡笔插画：在书桌学习，柯基在旁休息。':'学历学习手绘场景';
 scene.append(img);paper.append(scene);section.append(paper);
 const back=node('button',progress?'← 返回房屋':'返回');back.type='button';
 back.setAttribute('aria-label',mode==='enroll'||progress||mode==='graduation'?'返回房屋':'返回学习进度');
 back.onclick=()=>{if(valid()){if(['enroll','progress','graduation'].includes(mode))returnRoom();else show('progress');}};
 if(progress){
  paper.classList.add('education-progress-paper');
  const heading=node('header',null,'education-progress-heading');
  heading.append(back,node('h1','学习进度'));
  paper.prepend(heading);
 }else scene.append(back);
 const content=node('div',null,'education-content');paper.append(content);const message=node('p',null,'education-message');message.setAttribute('role','status');
 function panel(){const p=node('div',null,'education-panel');content.append(p);return p;}
 function note(text,parent=content){parent.append(node('p',text,'education-notice'));}
 function button(label,fn,primary=false,disabled=false,parent=actions){const b=node('button',label,primary?'education-primary':'');b.type='button';b.disabled=disabled;b.onclick=()=>{if(!valid())return;b.disabled=true;const result=fn();if(result===false&&b.isConnected)b.disabled=false;};parent.append(b);return b;}
 function process(result,after){if(!result.ok){message.textContent=({time:'可安排的时间不足，请先调整其他安排。',funds:'现金不足，请先筹措学费。',stale:'学习计划已变化，请重新打开页面。',save:'未能保存，本次更改已全部撤回，请重试。'})[result.reason]||'本次未完成，请重试。';return false;}render();after();return true;}
 function options(resume=false){const cap=mode==='enroll'?available():nextAvailable(),group=node('div');group.setAttribute('role','radiogroup');group.setAttribute('aria-label','学习安排');content.append(group);const choices=[];
 for(const p of ['slow','fast']){const h=E.hours(p),months=st?E.projection(st,p):r.months[p],b=node('button',null,'education-option');b.type='button';b.setAttribute('role','radio');b.setAttribute('aria-checked',String(pace===p));b.setAttribute('aria-label',p==='slow'?'轻松进修':'加快进修');b.append(node('strong',(p==='slow'?'轻松进修':'加快进修')+(st?.pace===p?' · 当前安排':'')),node('span','每月学习 '+h+' 小时'),node('span',(mode==='enroll'?'报名后':'下月预计')+'剩余可安排时间 '+Math.max(0,cap-h)+' 小时'),node('span',(resume?'恢复后预计还需 ':st?'预计还需 ':'预计学制 ')+months+' 个月'));b.disabled=cap<h;if(b.disabled)b.append(node('span','时间不足，需保留必要宠物照护时间'));b.onclick=()=>{if(!valid())return;pace=p;for(const q of choices)q.b.setAttribute('aria-checked',String(q.p===pace));updateSubmit();};choices.push({p,b});group.append(b);}
 return ()=>cap<E.hours(pace);}
 let updateSubmit=()=>{},blocked=()=>false;const course=panel();course.append(node('h2',mode==='graduation'?'已获得'+names[target]+'学历':r?names[target]:'当前学历：'+(names[state.education]||EDU[state.education]?.name)));
 if(mode==='enroll'&&r){if(state.education==='highschool'){button('副学士 AA（就业型或转学型）',()=>show('enroll',null,'associate'),false,false,content);button('直接读本科',()=>show('enroll',null,'bachelorDirect'),false,false,content);}course.append(node('span',names[r.from]+' → '+r.name,'education-badge'),node('p','课程总费用 '+money(r.cost),'education-price'),node('p','学费 '+money(r.tuition)+' · 书籍费 '+money(r.books),'education-muted'));if(target==='associate')note('毕业后可申请要求副学士学历的岗位，也可继续升读本科。',course);content.append(node('h3','选择学习安排'));blocked=options();}
 else if(mode==='graduation'){const p=node('progress',null,'education-progress');p.max=1;p.value=1;course.append(p);note('本次学习计划已完成。',course);}
 else if(st){const p=node('progress',null,'education-progress');p.max=st.requiredUnits;p.value=st.completedUnits;course.append(node('span',st.paused?'学习已暂停':st.pace==='fast'?'加快进修':'轻松进修','education-badge'),node('div','课程完成 '+Math.min(100,Math.floor(st.completedUnits/st.requiredUnits*100))+'%','education-progress-count'),p);note('已学习 '+st.elapsedMonths+' 个月 · '+(st.paused?'进度保留': '预计还需 '+E.projection(st,st.pace)+' 个月'),course);
 if(st.pending)note('已安排：下月'+(st.pending.paused?'暂停学习':st.paused?'恢复学习':st.pending.pace==='fast'?'改为加快进修':'改为轻松进修')+'。',course);
 if(mode==='progress'){const times=panel();times.classList.add('education-study-times');times.append(node('h3','本月学习安排'));for(const [label,value]of [['学习预留',isRecoveryMonth(state)?0:E.reserved(state)],['剩余自由时间',currentCareerTime().free]]){const row=node('div',null,'education-row');row.append(node('span',label),node('strong',value+' 小时'));times.append(row);}const tuition=panel();tuition.classList.add('education-study-tuition');
 if(E.current(st)){
  const paid=st.paidCents/100,due=E.due(st);
  note('课程总费用 '+money(st.receipt.tuition),tuition);
  note('（含书籍费 '+money(st.receipt.books)+'）',tuition);
  const totals=node('div',null,'education-fee-totals');
  note('已缴 '+money(paid),totals);note('剩余 '+money(E.balance(st)),totals);tuition.append(totals);
  if(due>0)note('本期应缴 '+money(due),tuition);
 }else note('原课程学杂费 '+money(st.receipt.tuition)+' · 已支付，按原合同继续',tuition);
 }
 else if(mode==='pace'||mode==='resume'){content.append(node('h3',mode==='resume'?'选择恢复后的安排':'选择下月的安排'));blocked=options(mode==='resume');}
 else if(mode==='refund'){content.append(node('p','本次可退回 '+money(st.receipt.tuition),'education-price'));}}
 content.append(message);const actions=node('div',null,'education-actions');content.append(actions);
 function returnRoom(){close();openRoom();}
 if(mode==='enroll'&&r){const leadership=target==='master'&&window.SchoolCareer?.role(state.job);if(leadership)course.append(node('p','专业方向：教育领导'));const first=()=>Math.round(r.cost*100/r.months[pace])/100;const submit=button('确认报名 · 首期 '+money(first()),()=>process(E.enroll(state,target,pace,{available:available(),recovery:isRecoveryMonth(state),save,enroll:(s,study)=>{RelationshipLifeCards.enroll(s,study);TeacherRelationships.enroll(s,study);if(leadership)study.field='educationLeadership';}}),()=>show('progress')),true);updateSubmit=()=>{submit.textContent='确认报名 · 首期 '+money(first());submit.disabled=blocked()||state.cash<first();};updateSubmit();if(state.cash<first()){note('现金不足，请先筹措首期学费。');button('申请学生贷款',()=>{close();openBankLoan(first(),{type:'学生贷款',educationTarget:target,after:()=>openEducation()});});}button('返回，不报名',returnRoom);}
 else if(mode==='enroll'){note('当前没有更高学历课程，可以继续职业技能学习。');button('返回房屋',returnRoom,true);}
 else if(mode==='progress'){if(E.current(st)){button(E.due(st)>0?'缴清本期学费 · '+money(E.due(st)):'本月学费已缴清',()=>process(E.pay(state,id,revision,false,{save}),()=>show('progress')),true,E.due(st)===0);if(E.due(st)>state.cash)button('筹措学费',()=>{close();showFundingOptions(E.due(st),()=>openEducation());});}const manage=node('div',null,'education-management');content.insertBefore(manage,actions);if(st.paused)button('恢复学习',()=>show('resume'),true);else{button('更改学习安排',()=>show('pace'),false,false,manage);if(!E.current(st))button('暂停学习',()=>show('pause'),false,false,manage);}button('返回房屋',returnRoom,true);if(!E.current(st))button(E.cancelQuote(state)?'撤销本月报名':'退出学习',()=>show(E.cancelQuote(state)?'refund':'withdraw'));}
 else if(['pace','pause','resume'].includes(mode)){const submit=button(({pace:'确认更改，下月生效',pause:'确认暂停，下月生效',resume:'确认恢复，下月生效'})[mode],()=>process(E.schedule(state,id,revision,mode,pace,{available:nextAvailable(),save}),()=>show('progress')),true);updateSubmit=()=>submit.disabled=mode!=='pause'&&blocked();updateSubmit();button('返回，保留原安排',()=>show('progress'));}
 else if(mode==='withdraw'||mode==='refund'){button('返回，保留学习计划',()=>show('progress'),true);button(mode==='refund'?'确认撤销，退回 '+money(st.receipt.tuition):'确认退出，不退学费',()=>process(E.withdraw(state,id,revision,mode==='refund',{save}),()=>show('enroll')));}
 else if(mode==='graduation'){const acknowledge=next=>{const snapshot=JSON.parse(JSON.stringify(state)),actual=state.educationPlans.graduates.find(g=>g.id===graduate.id);if(!actual||actual.seen)return false;actual.seen=true;try{if(save()===false)throw Error('save');}catch(e){for(const k of Object.keys(state))delete state[k];Object.assign(state,snapshot);message.textContent='未能保存，请重试。';return false;}next();};button('返回房屋',()=>acknowledge(returnRoom),true);if(EDU[target]?.next)button('查看'+names[EDU[target].next]+'课程',()=>acknowledge(()=>show('enroll')));}
 section.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();back.click();}if(e.key==='Tab'){const bs=[...section.querySelectorAll('button:not(:disabled)')],first=bs[0],last=bs.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};back.focus({preventScroll:true});
 }
 const beforeSave=save;save=function(){if(!state)return beforeSave();try{const raw=localStorage.getItem(key(slot)),backup=key(slot)+'_before_education_20261113';if(raw&&localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);return beforeSave();}catch(e){return false;}};
 const beforeClear=clearModals;clearModals=function(){close();return beforeClear.apply(this,arguments);};
 const beforeShow=showEvent;showEvent=function(){close();return beforeShow.apply(this,arguments);};
 const beforeRoom=openRoom;openRoom=function(){close();return beforeRoom.apply(this,arguments);};
 const beforeHome=home;home=function(){close();return beforeHome.apply(this,arguments);};
 const beforeRender=render;render=function(){const result=beforeRender();if(E.modern(state?.study)){$('studyInfo').textContent=names[state.study.target]+' · '+(state.study.paused?'已暂停':'预计还需 '+E.projection(state.study,state.study.pace)+' 个月');$('studyBtn').textContent='查看学习进度';}return result;};
 window.EducationPages={open:()=>openEducation(),route:target=>show('enroll',null,target),close};
})();
