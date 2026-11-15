// Approved illustration headers + actual DOM/data. No preview values are used as player state.
(function(){'use strict';const R=CareerLearningRules,H=HobbyLearning;let active=null;
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
 const money=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 const date=m=>'第'+(Math.floor(m/12)+1)+'年 · '+(m%12+1)+'月';
 function close(){active?.remove();active=null;document.body.classList.remove('career-pages-open');}
 const priorClear=clearModals;clearModals=function(){close();return priorClear.apply(this,arguments);};
 const priorHome=home;home=function(){close();return priorHome.apply(this,arguments);};
 function panel(title,art,back,month=state.month){close();clearModals();window.HobbyPages?.close();window.EducationPages?.close();window.RelationshipPages?.close();window.PetPages?.close();window.hideRoom?.();
  const owner=state,chosen=slot,cycle=state.month,section=node('section',null,'career-overlay');active=section;section.setAttribute('role','dialog');section.setAttribute('aria-modal','true');section.setAttribute('aria-label',title);document.body.append(section);document.body.classList.add('career-pages-open');
  const valid=()=>state===owner&&slot===chosen&&state.month===cycle&&active===section&&section.isConnected;
  const paper=node('div',null,'career-paper'),scene=node('div',null,'career-scene'),img=node('img');img.src='assets/career-learning-20261115/'+art+'.webp';img.alt='';scene.append(img);paper.append(scene);section.append(paper);
  const content=node('div',null,'career-content'),header=node('header');paper.append(content);const returnButton=node('button','← 返回');returnButton.type='button';returnButton.onclick=()=>{if(valid())back();};header.append(returnButton,node('span',date(month)));content.append(header,node('h1',title));
  const message=node('p','','career-message');message.setAttribute('role','status');
  function button(label,fn,{primary=false,disabled=false,parent=content}={}){const b=node('button',label,primary?'career-primary':'');b.type='button';b.disabled=disabled;b.onclick=()=>{if(valid())fn(b);};parent.append(b);return b;}
  function box(title){const e=node('section',null,'career-panel');if(title)e.append(node('h2',title));content.append(e);return e;}
  function row(parent,label,value,met){const e=node('div',null,'career-row'+(met?' career-met':''));e.append(node('span',(met?'✓ ':'')+label),node('span',value));parent.append(e);return e;}
  function choice(parent,title,subtitle,artwork,fn){const b=button('',fn,{parent});b.className='career-choice';const thumb=node('div',null,'career-thumb'),im=node('img');im.src=artwork;im.alt='';thumb.append(im);const text=node('span');text.append(node('strong',title),node('small',subtitle));b.append(thumb,text);return b;}
  section.onkeydown=e=>{if(e.key==='Escape'&&valid()){e.preventDefault();back();}if(e.key==='Tab'){const bs=[...section.querySelectorAll('button:not(:disabled)')],first=bs[0],last=bs.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};returnButton.focus({preventScroll:true});return {content,valid,button,box,row,choice,message,section};
 }
 function room(){close();openRoom();}
 function learning(){if(!state)return;const p=panel('学习','learning',room),list=node('div',null,'career-list');p.content.append(node('p','今天，想学点什么？'),list);
  p.choice(list,'学历学习','查看学历路线与学习进度 →','assets/career-learning-20261115/education.webp',education);
  p.choice(list,'职业技能 Skills','拉花 · 手冲咖啡 · 管理课程 →','assets/career-learning-20261115/skills.webp',()=>skills('learning'));
  p.choice(list,'兴趣爱好','咖啡品鉴 · 烘焙 · 摄影 · 绘画 →','assets/career-learning-20261115/hobbies.webp',hobbies);
  p.content.append(node('p','先查看安排，确认学习后才结算。','career-note'));p.button('返回房屋',room).classList.add('career-back');
 }
 const originalEducation=openEducation;
 function education(){if(state.study||state.education!=='highschool'||(state.educationPlans?.graduates||[]).some(g=>!g.seen)){close();return originalEducation();}const p=panel('学历学习','education',learning),list=node('div',null,'career-list');p.content.append(node('p','当前学历：高中'),node('p','选择一条适合自己的学习路线。'),list);
  for(const [id,title,sub]of [['associate','转学型副学士 AA','先读 AA，再衔接本科'],['bachelorDirect','直接读本科','查看本科课程与学习安排']])p.choice(list,title,sub+' →','assets/career-learning-20261115/education.webp',()=>{close();EducationPages.route(id);});
  p.content.append(node('p','查看路线不报名，也不扣费。','career-note'));p.button('返回学习',learning).classList.add('career-back');
 }
 function hobbies(){const p=panel('兴趣爱好','hobbies',learning),list=node('div',null,'career-list career-hobby-grid');p.content.append(list);for(const id of H.hobbies){const a=H.activities[id],xp=H.xp(state,id);p.choice(list,a.name,'Lv.'+H.level(xp)+(xp>=800?' · 已满级':'')+' · 查看 →','assets/hobbies/'+a.art+'.webp',()=>{close();HobbyPages.detail(id);});}p.content.append(node('p','查看不扣费，确认练习后才结算。','career-note'));p.button('返回学习',learning).classList.add('career-back');}
 let skillOrigin='learning';
 function skills(origin=skillOrigin){skillOrigin=origin;const back=origin==='career'?career:learning,p=panel('职业技能','skills',back),list=node('div',null,'career-list');p.content.append(list);
  for(const id of ['latte','pourOver']){const a=H.activities[id];p.choice(list,a.name,'Lv.'+H.level(H.xp(state,id))+' · 查看练习 →','assets/hobbies/'+a.art+'.webp',()=>{close();HobbyPages.detail(id);});}
  p.choice(list,'管理课程','管理技能 Lv.'+R.skillLevel(state,'management')+' · 查看课程 →','assets/career-learning-20261115/management.webp',management);
  p.content.append(node('p','查看不扣费，确认学习后才结算。','career-note'));p.button(origin==='career'?'返回我的职业':'返回学习',back).classList.add('career-back');
 }
 function management(notice=''){coffeeCareerData();const p=panel('管理基础课程','management',()=>skills()),opts=()=>({free:currentCareerTime().free,reserve:necessaryPetCareHours(),recovery:isRecoveryMonth(state),save}),expected=R.courseToken(state),miss=R.courseMissing(state,opts()),xp=Math.max(0,state.coffee.skills.management.xp||0);
  p.content.append(node('p','学习沟通协调、任务安排与团队管理。'),node('p','通过案例讨论和练习，积累管理知识。','career-note'));
  const level=p.box('管理技能 Lv.'+R.skillLevel(state,'management'));level.append(node('p',xp+' / 400 XP'));
  const stats=p.box('本次学习');p.row(stats,'课程费用',money(120));p.row(stats,'自由时间','−10小时');p.row(stats,'能量','−3');p.row(stats,'管理经验',R.skillLevel(state,'management')>=5?'已满级':'+'+Math.min(20,400-xp)+'XP');
  p.content.append(node('p','本月职业课程 '+R.courseRows(state).length+' / 3次','career-note'),p.message);p.message.textContent=notice||miss.join('；');
  p.button(R.skillLevel(state,'management')>=5?'已满级':'确认学习',b=>{b.disabled=true;const r=R.course(state,expected,opts());if(!r.ok){p.message.textContent=r.reason;b.disabled=false;return;}render();management('本次课程已保存。');},{primary:true,disabled:!!miss.length});p.button('返回职业技能',()=>skills()).classList.add('career-back');
 }
 function career(){coffeeCareerData();const k=R.role(state.job),p=panel('我的职业','career',room),job=p.box('当前工作');p.row(job,'岗位',state.job||'未就业');if(state.job)p.row(job,'每周工作',(state.workHoursPerWeek||R.roles[k]?.weekly||40)+'小时');
  const work=p.box('本月工作');if(k==='barista'||k==='shiftLead')p.button('查看本月职业安排',()=>{close();openCoffeeCareerEvent();},{primary:true,parent:work});else if(k==='manager')work.append(node('p','本月按店长岗位安排工作。','career-note'));
  const x=coffeeMonthlyIncome();if(x){p.row(work,'基础工资',money(x.baseWages));p.row(work,'基础小费',money(x.baseTips));if(x.fixedBonus!=null)p.row(work,'固定奖金',money(x.fixedBonus));p.row(work,'额外收入',money((x.extraWages||0)+(x.extraTips||0)));}else work.append(node('p',state.retired?'当前已退休':'当前没有在职工资'));
  p.button('查看收入明细',()=>income(null,false),{parent:work});const growth=p.box('职业成长'),grid=node('div',null,'career-growth');growth.append(grid);
  for(const [name,lv,note]of [['拉花',R.specialty(state,'latte'),'专门练习提升'],['手冲咖啡',R.specialty(state,'pourOver'),'专门练习提升'],['顾客服务',R.skillLevel(state,'service'),'通过日常工作积累'],['管理技能',R.skillLevel(state,'management'),'岗位实践与管理课程']]){const cell=node('div');cell.append(node('strong',name+' Lv.'+lv),node('small',note));grid.append(cell);}
  if(R.next(state))p.button('查看晋升条件',promotion,{parent:growth});p.button('职业学习',()=>skills('career'),{parent:growth});const other=p.box('其他选择');p.button('查看其他工作机会',()=>{close();openCareerMarket();},{parent:other});p.button('工作调整',adjustment,{parent:other});p.button('返回房屋',room).classList.add('career-back');
 }
 function promotion(notice=''){coffeeCareerData();const next=R.next(state);if(!next)return career();const p=panel(next==='manager'?'晋升店长':'晋升值班主管',next==='manager'?'manager-promotion':'shift-promotion',career),box=p.box('晋升条件'),token=R.promotionToken(state),pending=state.coffee.progression.pending;
  for(const r of R.requirements(state)){let value=r.id==='trust'?r.value+' / '+r.target:r.unit?r.value+' / '+r.target+r.unit:'Lv.'+r.value+' / Lv.'+r.target;if(r.id==='specialty')value=r.detail+'；拉花 Lv.'+r.levels.latte+'｜手冲咖啡 Lv.'+r.levels.pourOver+(r.value>=r.target?' · 已满足':' · 尚未满足');p.row(box,r.label,value,r.value>=r.target);}
  const cfg=R.roles[next],pay=p.box('晋升后待遇');p.row(pay,'岗位基础年薪',money(cfg.base));p.row(pay,'按当前学历预计年薪',money(R.annual(state,next)));const tips=coffeeSeason(coffeeCalendar().month).tips*(next==='manager'?1.5:1.3);p.row(pay,'本季基础小费',money(tips)+'/月');if(next==='manager'){p.row(pay,'固定奖金',money(500)+'/月');pay.append(node('p','当月有缺席则无固定奖金，加班不能补回。','career-note'));}p.row(pay,'每周工作',cfg.weekly+'小时');p.row(pay,'基础自由时间',(260-cfg.weekly*4)+'小时/月');pay.append(node('p','工资按最高学历加成计算。','career-note'));
  p.content.append(node('p','满足全部条件后确认，下个月生效。','career-note'),p.message);p.message.textContent=notice||'';const miss=R.missing(state);p.button(pending?'已确认，下个月生效':miss.length?'条件尚未满足':'确认晋升，下个月生效',b=>{b.disabled=true;const r=R.promote(state,token,save);if(!r.ok){p.message.textContent=r.reason;b.disabled=false;return;}render();promotion('晋升安排已保存，下个月生效。');},{primary:true,disabled:!!pending||!!miss.length});p.button('返回我的职业',career).classList.add('career-back');
 }
 function adjustment(){const p=panel('工作调整','adjustment',career),box=p.box('当前工作');p.row(box,'岗位',state.job||'未就业');p.row(box,'当前税前年薪',money(state.annualSalary));p.content.append(node('p','查看其他工作机会，不影响当前工作。'));p.button('查看其他工作机会',()=>{close();openCareerMarket();},{primary:true});p.button('申请辞职',resignation,{disabled:!state.job});p.button('返回我的职业',career).classList.add('career-back');}
 function resignation(){const job=state.job,p=panel('辞职确认','resignation',adjustment);p.content.append(node('p',job||'未就业'),node('h2','确定离开当前工作吗？'),node('p','确认后将不再获得这份工作的工资。'),p.message);
  p.button('确认辞职',b=>{if(state.job!==job||!job)return;b.disabled=true;const r=R.atomic(state,()=>{state.job=null;state.salary=0;state.annualSalary=0;state.unemployedMonths=0;if(state.coffee?.progression)state.coffee.progression.pending=null;return {};},save);if(!r.ok){p.message.textContent=r.reason;b.disabled=false;return;}render();career();});p.button('继续当前工作',career,{primary:true});
 }
 function income(receipt=null,automatic=false){const settled=receipt||state.lastSettlement,hasActual=!!settled?.careerIncome,x=hasActual?settled.careerIncome:coffeeMonthlyIncome(),month=hasActual?settled.month-1:state.month,p=panel('本月职业收入','income',automatic?room:career,month);
  if(!x){p.content.append(node('p','本月没有职业收入记录。'));p.button(automatic?'返回房屋':'返回我的职业',automatic?room:career).classList.add('career-back');return;}
  const box=p.box('收入明细');p.row(box,'基础工资',money(x.baseWages));p.row(box,'基础小费',money(x.baseTips));if(x.fixedBonus!=null)p.row(box,'固定奖金',money(x.fixedBonus));p.row(box,'职业事件额外工资',money(x.eventWages??x.extraWages));if(x.eventBonus)p.row(box,'职业事件奖金',money(x.eventBonus));p.row(box,'职业事件额外小费',money(x.extraTips));if(x.familyLeave?.hours)p.row(box,'请假收入调整','已计入上述工资及小费');
  const total=p.box(hasActual?'本月实际税前收入':'本月预计税前收入');total.append(node('strong',money(x.total),'career-total'));const status=p.box('结算状态');status.append(node('p',hasActual?'已结算':'待月末结算'),node('p',hasActual?'本月职业收入已按月末账单结算。':'这是本月预计收入，尚未到账。','career-note'));
  const t=p.box('工作时间');p.row(t,'基础工时',x.baseWeeklyHours+'小时/周');p.row(t,'本月临时工时',(x.workHoursDelta>0?'+':'')+x.workHoursDelta+'小时');p.row(t,'本月自由时间',x.freeHours+'小时');p.button(automatic?'返回房屋':'返回我的职业',automatic?room:career).classList.add('career-back');
 }
 function afterArrival(){const a=state?.homeArrival,r=state?.careerLearning?.receipts?.[state?.month-1];if(!a||a.status!=='completed'||a.fromMonth!==state.month-1||!r||r.shown||state.requiredIncident||isRecoveryMonth(state)||state.gameOver?.final)return false;
  const result=R.atomic(state,()=>{r.shown=true;return {};},save);if(!result.ok)return false;income(r.settlement,true);return true;
 }
 function introduction(){const r=state.town?.movement?.relationshipLifeCard;if(!r||r.kind!=='landlord-introduction'||r.status!=='pending')return false;const p=panel('牵线介绍业内人士','landlord-introduction',()=>{close();showTown();});p.content.append(node('p',r.personName+'说：“我认识另一家咖啡店的合伙人，你要是有兴趣，我可以找个时间介绍你们认识。”'));const box=p.box('好呀，谢谢你帮忙介绍！');p.row(box,'自由时间','−1小时');p.row(box,'房东亲密度','+3');p.row(box,'认识咖啡店合伙人','初始亲密度10');p.content.append(p.message);p.button('好呀，谢谢你帮忙介绍！',b=>{b.disabled=true;const result=RelationshipLifeCards.confirm(state,r.id,0,{free:Math.max(0,currentCareerTime().free-necessaryPetCareHours()),save});if(!result.ok){p.message.textContent=result.reason==='time'?'自由时间不足。':'本次未保存，请重试。';b.disabled=false;return;}close();render();finish();},{primary:true});return true;}
 window.CareerPages={introduction,learning,education,skills,hobbies,management,career,promotion,adjustment,resignation,income,afterArrival,close};
 openEducation=education;openWorkAdjustment=career;openCoffeeCourses=()=>skills('career');previewCoffeePromotion=promotion;confirmCoffeePromotion=()=>R.promote(state,R.promotionToken(state),save).ok;
 $('hobbyBtn').onclick=hobbies;
 // Capture the study hotspot before the legacy listener; all other room actions remain original.
 document.addEventListener('click',e=>{const b=e.target.closest('[data-room="study"]');if(!b||b.disabled||document.querySelector('.event-active')||!$('wlDrawer').hidden)return;e.stopImmediatePropagation();learning();},true);
 const auditBefore=showMonthlyAudit;showMonthlyAudit=function(s){if(s.careerIncome&&state?.homeArrival&&state.month>=state.homeArrival.targetMonth&&state.homeArrival.fromMonth===s.month-1){state.homeArrival.status='ready';save();return openRoom();}return auditBefore(s);};
})();
