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
  const paper=node('div',null,'career-paper'),scene=node('div',null,'career-scene'),img=node('img');scene.dataset.art=art;img.src='assets/career-learning-20261115/'+art+'.webp';if(art==='management'||art==='customer-service')img.src='assets/skill-scenes/soft/'+art+'.webp';if(art==='career'){section.classList.add('career-cafe-home');img.src='assets/career-crayon/cafe.webp';}img.alt='';scene.append(img);paper.append(scene);section.append(paper);
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
  const sections=[...body.querySelectorAll(':scope > .career-panel')],icons=promotionCard?['management','coffee']:['coffee','management','clock'];sections.forEach((section,i)=>{const h=section.querySelector('h2'),icon=node('span',null,'career-heading-icon');icon.innerHTML=coffeeIcon(icons[i]);h.prepend(icon);});
  const rail=node('div',null,'career-scroll-rail'),thumb=node('div',null,'career-scroll-thumb');thumb.tabIndex=0;thumb.setAttribute('role','scrollbar');thumb.setAttribute('aria-label',incomeCard?'滚动职业收入':'滚动职业信息');thumb.setAttribute('aria-controls',scroll.id);thumb.setAttribute('aria-orientation','vertical');thumb.setAttribute('aria-valuemin','0');rail.append(thumb);viewport.append(rail);
  function update(){if(!p.valid())return;const max=Math.max(0,scroll.scrollHeight-scroll.clientHeight),height=Math.min(rail.clientHeight,Math.max(44,rail.clientHeight*scroll.clientHeight/Math.max(1,scroll.scrollHeight))),travel=Math.max(0,rail.clientHeight-height);thumb.style.height=height+'px';thumb.style.transform='translateY('+(max?travel*scroll.scrollTop/max:0)+'px)';thumb.setAttribute('aria-valuemax',String(max));thumb.setAttribute('aria-valuenow',String(Math.round(scroll.scrollTop)));thumb.setAttribute('aria-disabled',String(!max));}
  scroll.addEventListener('scroll',update,{passive:true});const observer=new ResizeObserver(update);observer.observe(scroll);observer.observe(body);p.section._careerCleanup=()=>observer.disconnect();requestAnimationFrame(update);header.querySelector('button').focus({preventScroll:true});
  let drag=null;thumb.onpointerdown=e=>{if(!p.valid())return;drag={y:e.clientY,top:scroll.scrollTop};thumb.setPointerCapture(e.pointerId);e.preventDefault();};thumb.onpointermove=e=>{if(!drag||!p.valid())return;const travel=rail.clientHeight-thumb.offsetHeight,max=scroll.scrollHeight-scroll.clientHeight;if(travel>0)scroll.scrollTop=drag.top+(e.clientY-drag.y)*max/travel;};thumb.onpointerup=thumb.onpointercancel=()=>{drag=null;};
  rail.onclick=e=>{if(e.target!==rail||!p.valid())return;scroll.scrollTop=(e.clientY-rail.getBoundingClientRect().top)/Math.max(1,rail.clientHeight)*(scroll.scrollHeight-scroll.clientHeight);};thumb.onkeydown=e=>{if(!p.valid())return;const delta={ArrowDown:64,ArrowUp:-64,PageDown:scroll.clientHeight*.8,PageUp:-scroll.clientHeight*.8};if(e.key in delta){e.preventDefault();scroll.scrollTop+=delta[e.key];}else if(e.key==='Home'||e.key==='End'){e.preventDefault();scroll.scrollTop=e.key==='Home'?0:scroll.scrollHeight;}};
 }
 function room(){close();openRoom();}
 function learning(){if(!state)return;const p=panel('学习','learning-banner',room),list=node('div',null,'career-list');p.content.append(node('p','今天，想学点什么？'),list);
  p.choice(list,'学历学习','查看学历路线与学习进度 →','assets/career-learning-20261115/education-tile.webp',education);
  p.choice(list,'职业技能 Skills','拉花 · 手冲咖啡 · 管理课程 →','assets/career-learning-20261115/skills-tile.webp',()=>skills('learning'));
  p.choice(list,'兴趣爱好','咖啡品鉴 · 烘焙 · 摄影 · 绘画 →','assets/career-learning-20261115/hobbies-tile.webp',hobbies);
  p.button('返回房屋',room).classList.add('career-back');
 }
 const originalEducation=openEducation;
 function education(){if(state.study||state.education!=='highschool'||(state.educationPlans?.graduates||[]).some(g=>!g.seen)){close();return originalEducation();}const p=panel('学历学习','education',learning),list=node('div',null,'career-list');p.content.append(node('p','当前学历：高中'),node('p','选择一条适合自己的学习路线。'),list);
  for(const [id,title,sub]of [['associate','转学型副学士 AA','先读 AA，再衔接本科'],['bachelorDirect','直接读本科','查看本科课程与学习安排']])p.choice(list,title,sub+' →','assets/career-learning-20261115/education.webp',()=>{close();EducationPages.route(id);});
  p.button('返回学习',learning).classList.add('career-back');
 }
 function hobbies(){const p=panel('兴趣爱好','hobbies',learning),list=node('div',null,'career-list career-hobby-grid');p.content.append(list);for(const id of H.hobbies){const a=H.activities[id],xp=H.xp(state,id);p.choice(list,a.name,'Lv.'+H.level(xp)+(xp>=800?' · 已满级':'')+' · 查看 →','assets/hobbies/'+a.art+'.webp',()=>{close();HobbyPages.detail(id);});}p.button('返回学习',learning).classList.add('career-back');}
 let skillOrigin='learning';
 function skills(origin=skillOrigin){skillOrigin=origin;const back=origin==='career'?career:learning,p=panel('职业技能','skills',back),list=node('div',null,'career-list');p.section.classList.add('career-skills-room');p.content.append(list);
  for(const id of ['latte','pourOver']){const a=H.activities[id];const entry=p.choice(list,a.name,'Lv.'+H.level(H.xp(state,id))+' · 查看练习 →','assets/career-learning-20261115/skill-thumbnails-confirmed.png',()=>{close();HobbyPages.detail(id);});entry.querySelector('.career-thumb').classList.add('career-specialty-thumb',id==='latte'?'career-latte-thumb':'career-pour-thumb');}
  p.choice(list,'管理课程','管理技能 Lv.'+R.skillLevel(state,'management')+' · 查看课程 →','assets/career-learning-20261115/management.webp',management);
  p.button(origin==='career'?'返回我的职业':'返回学习',back).classList.add('career-back');
 }
 function management(notice='',back=skills){if(typeof notice!=='string')notice='';coffeeCareerData();const p=panel('管理基础课程','management',back),opts=()=>({free:currentCareerTime().free,reserve:necessaryPetCareHours(),recovery:isRecoveryMonth(state),save}),expected=R.courseToken(state),miss=R.courseMissing(state,opts()),xp=Math.max(0,state.coffee.skills.management.xp||0);
  p.content.append(node('p','学习沟通协调、任务安排与团队管理。','career-skill-intro'));
  const level=p.box('管理技能 Lv.'+R.skillLevel(state,'management'));level.classList.add('career-management-level');const bar=node('progress');bar.max=400;bar.value=xp;bar.setAttribute('aria-label','管理技能累计经验');level.append(bar,node('p',xp+' / 400 XP'));
  const stats=p.box('本次学习');p.row(stats,'课程费用',money(120));p.row(stats,'自由时间','−3小时');p.row(stats,'能量','−1');p.row(stats,'管理经验',R.skillLevel(state,'management')>=5?'已满级':'+'+Math.min(10,400-xp)+'XP');
  p.content.append(node('p','本月已学习 '+R.courseRows(state).length+'次','career-note'),p.message);p.message.textContent=notice||miss.join('；');
  p.button(R.skillLevel(state,'management')>=5?'已满级':'确认学习',b=>{b.disabled=true;const r=R.course(state,expected,opts());if(!r.ok){p.message.textContent=r.reason;b.disabled=false;return;}render();management('本次课程已保存。',back);},{primary:true,disabled:!!miss.length});p.button(back===career?'返回我的职业':'返回职业技能',back).classList.add('career-back');
  p.section.classList.add('career-management-card');stats.classList.add('career-management-stats');[...stats.querySelectorAll('.career-row')].forEach((row,i)=>{const icon=node('span',null,'career-course-icon');icon.innerHTML=coffeeIcon(['money','clock','energy','management'][i]);row.prepend(icon);});compactCareer(p);const badge=node('span','课程档案','career-course-badge');p.section.querySelector('.career-fixed-heading header').append(badge);
 }
 function career(){coffeeCareerData();const k=R.role(state.job),p=panel('我的职业','career',room),work=p.box('工作'),x=coffeeMonthlyIncome();work.classList.add('career-job-summary');p.row(work,'岗位',state.job||'未就业');p.row(work,'工资',money(x?.baseWages??(state.job&&!state.retired&&!state.unemployedMonths?state.salary:0))+'/月');p.row(work,'时间',state.job&&!state.retired?(state.workHoursPerWeek||R.roles[k]?.weekly||40)+'小时/周':'—');p.row(work,'小费',money(x?.baseTips||0)+'/月');
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
  if(R.next(state))p.button('查看晋升条件',promotion,{parent:growth});p.button('职业学习',()=>skills('career'),{parent:growth});const other=p.box('其他选择');p.button('查看其他工作机会',()=>{close();openCareerMarket();},{parent:other});p.button(state.pendingResignation?'已安排下个月离职':'申请辞职',resignation,{parent:other,disabled:!state.job});p.button('返回房屋',room).classList.add('career-back');compactCareer(p);
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
 window.CareerPages={panel,compactCareer,introduction,learning,education,skills,hobbies,management,career,promotion,adjustment,resignation,income,afterArrival,close};
 openEducation=education;openWorkAdjustment=career;openCoffeeCourses=()=>skills('career');previewCoffeePromotion=promotion;confirmCoffeePromotion=()=>R.promote(state,R.promotionToken(state),save).ok;
 $('hobbyBtn').onclick=hobbies;
 // Capture the study hotspot before the legacy listener; all other room actions remain original.
 document.addEventListener('click',e=>{const b=e.target.closest('[data-room="study"]');if(!b||b.disabled||document.querySelector('.event-active')||!$('wlDrawer').hidden)return;e.stopImmediatePropagation();learning();},true);
 const auditBefore=showMonthlyAudit;showMonthlyAudit=function(s){if(s.careerIncome&&state?.homeArrival&&state.month>=state.homeArrival.targetMonth&&state.homeArrival.fromMonth===s.month-1){state.homeArrival.status='ready';save();return openRoom();}return auditBefore(s);};
})();

