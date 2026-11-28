// Incremental integration with the original salary, save and month-end transactions.
(function(){'use strict';const R=CareerLearningRules,copy=x=>JSON.parse(JSON.stringify(x));
 const priorSave=save;save=function(){if(!state)return priorSave();const before=copy(state);try{const raw=localStorage.getItem(key(slot)),backup=key(slot)+'_before_career_learning_20261115';if(raw&&localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);R.payData(state,!!raw);if(state.coffee)state.coffee.managerTrust=R.trust(state.coffee.managerTrust);if(priorSave()===false)throw Error('save');return true;}catch(e){for(const k of Object.keys(state))delete state[k];Object.assign(state,before);return false;}};
 // These replace automatic skill raises, while preserving the old skill/pay records untouched.
 captureCoffeePayMilestones=function(s=state){return s.coffeePay||{version:1,skillRates:{},educationRate:0,lastAppliedMonth:-1};};
 const oldAnnual=coffeeAnnualPay;coffeeAnnualPay=function(s=state,k=coffeeSalaryRole(s.job)){return R.roles[k]?R.annual(s,k):oldAnnual(s,k);};
 applyCoffeeSalaryForNextMonth=function(settlement){const k=R.role(state.job);if(!k||state.retired)return false;const d=R.payData(state);if(d.lastAppliedMonth===state.month)return false;const before=state.annualSalary||state.salary*12,value=R.annual(state,k);d.lastAppliedMonth=state.month;state.annualSalary=value;state.salary=roundCash(value/12);if(before!==value)settlement.coffeeSalaryChange={before,after:value,effectiveMonth:state.month};if(settlement.coffeePromotion)settlement.coffeePromotion.salary=state.salary;return true;};
 coffeePromotionMissing=()=>R.missing(state);coffeePromotedAnnual=()=>R.promotionAnnual(state,'shiftLead');
 const previousCareerSalary=careerSalary;careerSalary=function(c){const k=R.role(c.name);return k?R.annual(state,k):previousCareerSalary(c);};
 const previousCareerMissing=careerMissing;careerMissing=function(c){return R.role(c.name)==='manager'?['请在当前值班主管岗位满足条件后确认晋升店长']:previousCareerMissing(c);};
 const oldProgress=applyCareerProgression;applyCareerProgression=function(){if(R.role(state.job))return;return oldProgress();};
 completeCoffeeCareerMonth=function(s){const x=s.careerIncome,k=x&&(x.role||'barista');if(!x||!(x.baseWages>0)||!R.roles[k])return;const p=coffeeCareerData(),cycle=x.cycle;if(cycle<=p.lastCycle)return;p.lastCycle=cycle;
  const hours=R.monthlyHours(R.roles[k].weekly);
  const event=state.coffee.monthly;
  // Older saved overtime pays its locked XP at event confirmation.
  const legacyOvertime=k==='barista'&&event?.cycle===cycle&&event.status==='resolved'&&!event.serviceXpAtMonthEnd?Math.max(0,event.workHoursDelta||0):0;
  const workedHours=Math.max(0,hours+(x.workHoursDelta||0)-legacyOvertime);
  const factor=Math.max(0,Math.min(1,(hours+Math.min(0,x.workHoursDelta||0))/hours)),gains=k==='barista'?{service:workedHours/8}:{service:roundCash((k==='partner'?10:15)*factor),management:roundCash(15*factor)};coffeeSkillGain(gains);p[k==='barista'?'baristaMonths':k==='shiftLead'?'shiftMonths':k==='partner'?'partnerMonths':'managerMonths']=(p[k==='barista'?'baristaMonths':k==='shiftLead'?'shiftMonths':k==='partner'?'partnerMonths':'managerMonths']||0)+1;p.normalMonths++;const trust=R.trust(state.coffee.managerTrust);state.coffee.managerTrust=R.trust(trust+(p.normalMonths%2===0?1:0));s.coffeeGrowth={...gains,managerTrust:state.coffee.managerTrust-trust};
  const pending=p.pending;if(pending&&state.month>=pending.effectiveCycle){const next=R.role(pending.to);if(R.working(state)&&state.job===pending.from&&next){state.annualSalary=R.promotedPay(state,next);state.job=R.roles[next].name;state.workHoursPerWeek=R.roles[next].weekly;state.salary=roundCash(state.annualSalary/12);state.careerStartedAt=state.month;p[next==='shiftLead'?'shiftMonths':'managerMonths']=0;(state.timeline??=[]).push('晋升'+R.roles[next].name+'，下个月起按新岗位结算');s.coffeePromotion={job:state.job,salary:state.salary};}p.pending=null;}
 };
 // Old pending job-event quotes remain frozen; new ordinary work does not grant specialist XP.
 const courseGuard=coffeeCourseMissing;coffeeCourseMissing=function(c){return c.id==='management'?R.courseMissing(state,{free:currentCareerTime().free,reserve:necessaryPetCareHours(),recovery:isRecoveryMonth(state)}):['该课程已调整，请从职业技能页面查看。'];};
 const oldCourse=completeCoffeeCourse;completeCoffeeCourse=function(id,count,cycle){if(id!=='management'||cycle!=null&&cycle!==state.month||count!=null&&count!==R.courseRows(state).length)return false;const result=R.course(state,R.courseToken(state),{free:currentCareerTime().free,reserve:necessaryPetCareHours(),recovery:isRecoveryMonth(state),save});if(result.ok){render();CareerPages.management('本次课程已保存。');}return result.ok;};
 function leave(){return [window.FamilyEvents,window.SharedEvents,window.StudioEvents,window.ApartmentEvents].filter(Boolean).reduce((a,p)=>{const l=p.leave(state);a.hours+=l.hours;a.wages+=l.wages;a.tips+=l.tips;return a;},{hours:0,wages:0,tips:0});}
 const priorIncome=coffeeMonthlyIncome;coffeeMonthlyIncome=function(){const role=R.role(state?.job);if(!['manager','partner'].includes(role))return priorIncome();coffeeCareerData();if(!R.working(state))return null;const t=currentCareerTime(),l=leave(),calendar=coffeeCalendar(),tips=role==='partner'?0:coffeeSeason(calendar.month).tips*1.5,bonus=role==='partner'||l.hours>0||state.unpaidLeave?.month===state.month&&state.unpaidLeave.hours>0?0:500,base=roundCash(state.salary||0),total=roundCash(Math.max(0,base+tips+bonus-l.wages-l.tips));return {cycle:state.month,year:calendar.year,calendarMonth:calendar.month,role,season:coffeeSeason(calendar.month).name,baseWages:base,baseTips:tips,fixedBonus:bonus,extraWages:roundCash(-l.wages),extraTips:roundCash(-l.tips),eventWages:roundCash(-l.wages),eventBonus:0,total,recurring:total,baseWeeklyHours:45,workHoursDelta:-l.hours,freeHours:t.free,baseFreeHours:80,...(l.hours?{familyLeave:l}:{})};};
 const finalBefore=finalizeCoffeeMonth;finalizeCoffeeMonth=function(s){finalBefore(s);const leaving=state.pendingResignation;if(leaving&&state.month>=leaving.effectiveCycle){if(state.job===leaving.from){state.job=null;state.salary=0;state.annualSalary=0;state.unemployedMonths=0;if(state.coffee?.progression)state.coffee.progression.pending=null;s.resignation={job:leaving.from,effectiveCycle:state.month};}delete state.pendingResignation;}if(state.homeArrival&&s.careerIncome){const d=R.payData(state);d.receipts??={};d.receipts[s.month-1]??={shown:false,settlement:copy({month:s.month,careerIncome:s.careerIncome})};}};
 // Preserve existing stage/skill records while enabling the confirmed manager job.
 const oldOpen=openGame;openGame=function(){if(state?.coffee)state.coffee.managerTrust=R.trust(state.coffee.managerTrust);return oldOpen();};
 coffeeProgressMarkup=function(){const k=R.role(state?.job);if(!k)return '';return '<section class="wl-panel"><h3>咖啡店 · 职业发展</h3><p>技能用于晋升，工资按岗位及最高学历计算。</p><button data-confirmed-career>查看我的职业</button></section>';};
 document.addEventListener('click',e=>{if(e.target.closest('[data-confirmed-career]'))CareerPages.career();});
})();

window.SchoolCareer=(()=>{
 const stages=[
  {name:'小学教师',base:JOBS.teacher[1],months:36,reviews:true,task:'公开课'},
  {name:'资深小学教师',base:55200,months:12,reviews:true,task:'年级协作',prompt:'同年级各班进度不同。你如何主持集体备课？',choices:['先统一学习目标，再按各班情况调整进度','要求所有班级照搬同一份教案']},
  {name:'年级组长',base:55200,allowance:1200,months:12,task:'教育领导资格评估',prompt:'学校准备调整学生支持方案。你如何判断该优先解决什么？',choices:['结合出勤、学习数据和师生反馈确定优先事项','只根据上次考试排名决定']},
  {name:'小学副校长',base:78000,months:36,reviews:true,task:'全校改进项目',prompt:'你负责改善全校学生出勤，如何跟进项目？',choices:['识别缺勤原因，协调家庭支持并定期检查出勤数据','公布出勤排名，学年结束再检查']},
  {name:'小学校长',base:100000},
 ];
 const skills={
  instruction:{name:'教学设计',practice:'备课与教案复盘',hours:3},
  communication:{name:'沟通协调',practice:'家校沟通演练',hours:3},
  administration:{name:'学校管理',practice:'学校管理案例研习',hours:4},
 };
 const thresholds=[30,70,120,180,250];
 const xp=(s,id)=>s.schoolCareer?.skills?.[id]??0;
 const level=(s,id)=>thresholds.filter(target=>xp(s,id)>=target).length;
 const practiceXP=10;
 const allowanceMilestones=[{level:3,xp:thresholds[2],monthly:50},{level:5,xp:thresholds[4],monthly:100}];
 function skillAllowanceForXP(value){
  return allowanceMilestones.reduce((amount,milestone)=>value>=milestone.xp?milestone.monthly:amount,0);
 }
 function skillAllowance(s){
  if(!working(s))return 0;
  return Object.keys(skills).reduce((amount,id)=>amount+
   (id==='administration'&&s.job===stages[0].name?0:skillAllowanceForXP(xp(s,id))),0);
 }
 const openClasses=[
  {id:'experiment',title:'四年级科学公开课',choices:['老师当场做一遍','先看看全班的数据','请第三组再试一次'],answer:2,feedback:'学生统一放车条件后复测，只有路面发生变化。'},
  {id:'methods',title:'二年级-进位加法公开课',choices:['用小棒摆给大家看','在黑板上重算一遍','让同桌对照算式找差别'],answer:0,feedback:'学生看到十根散棒捆成一捆，理解了进位的 1 表示一个十。'},
  {id:'chart',title:'四年级-条形统计图公开课',choices:['示范如何找差值','记进明天的备课计划','让全班同时亮出答案'],answer:2,feedback:'全班同时作答，便于发现还有谁混淆数值和差值。'},
  {id:'projector',title:'投影突然坏了',choices:['把步骤画到黑板上','学生先做，老师查投影','用纸片做桌面演示'],answer:2,feedback:'学生通过实际折叠和同桌解释理解了轴对称。'},
  {id:'materials',title:'一年级-图形拼搭公开课',choices:['停下来示范材料流程','逐桌补齐材料','每桌指定一位材料员'],answer:2,feedback:'材料员负责领还，其他同学可以先画方案。'},
 ];
 const requiredOpenClassPasses=3;
 const openClassXP=5;
 const openClassRecord=s=>entry(s,stages[0].name);
 const openClassPasses=r=>r.openClassPasses??(r.task?1:0);
 const canTeach=s=>working(s)&&stages.slice(0,2).includes(role(s.job))&&
  ![6,7,12].includes(coffeeCalendar(s.month).month)&&!isRecoveryMonth(s);
 function drawOpenClass(s){
  const r=openClassRecord(s);
  if(!canTeach(s)||openClassPasses(r)>=requiredOpenClassPasses||r.taskAttempt===s.month)return null;
  if(r.openClass?.month===s.month&&r.openClass.version===2)return r.openClass;
  const available=openClasses.filter(card=>!r.passedClasses?.includes(card.id));
  const card=available.find(item=>!r.openClassSeen?.includes(item.id))||available[0];
  return CareerLearningRules.atomic(s,()=>{
   const row=record(s,stages[0].name);
   (row.openClassSeen??=[]).push(card.id);
   row.openClass={id:card.id,month:s.month,version:2};
   return {};
  },save).ok?openClassRecord(s).openClass:null;
 }
 function resolveOpenClass(s,attempt,choice){
  const r=openClassRecord(s),card=openClasses.find(item=>item.id===attempt?.id);
  if(!canTeach(s)||!card||openClassPasses(r)>=requiredOpenClassPasses||r.taskAttempt===s.month||
     r.openClass?.month!==s.month||attempt.month!==s.month||r.openClass.id!==card.id||
     r.passedClasses?.includes(card.id)||!card.choices[choice])return null;
  const passed=choice===card.answer;
  const result=CareerLearningRules.atomic(s,()=>{
   const row=record(s,stages[0].name);
   row.openClassPasses=openClassPasses(r)+Number(passed);
   let instructionXP=0;
   if(passed){
    (row.passedClasses??=[]).push(card.id);
    const before=xp(s,'instruction');
    instructionXP=Math.max(0,Math.min(openClassXP,thresholds.at(-1)-before));
    if(instructionXP)(s.schoolCareer.skills??={}).instruction=before+instructionXP;
   }
   row.taskAttempt=s.month;
   row.openClassResult={id:card.id,choice,month:s.month,passed};
   return {instructionXP};
  },save);
  return result.ok?{passed,instructionXP:result.instructionXP,feedback:passed?card.feedback:'之后的教学月可以再试。'}:null;
 }
 const scenarios={
  sports:{label:"年级协作",title:"运动会调课安排",answer:1,
   prompt:"下个月运动会开三天，四年级三个班原来的课都得挪。备课会上，科学老师看了眼课表：「实验室一次只能进一个班，我还带五年级，三个班可别排到一块儿。」教务处给了三个机动教学日，请你周五前交一张调课表。你怎么安排？",
   choices:[
    ["把原课表原样挪过去","直接把三天的课程搬到三个机动日，有冲突再请任课老师换课。"],
    ["先排共用老师和教室","三个班一起核对缺的课。先把科学实验等需要共用老师或教室的课错开，再排其余课程，交教务处审核。"],
    ["请各班先排自己的课","各班按进度列出补课时间，周五把三份课表一起交给教务处协调。"],
   ]},
  parents:{label:"年级协作",title:"家长会安排",answer:2,
   prompt:"下周五，四年级三个班同时开家长会，每班只有 40 分钟。学校请各班都讲清楚这学期的作业和请假安排。一班老师想多留些时间讲班里的阅读情况，三班老师说：「有几位家长想聊孩子最近的作业，我想散会后单独跟他们谈。」大家问你，这场会怎么安排？",
   choices:[
    ["三个班用同一份讲稿","你把学校通知和年级学习情况整理成一份讲稿，各班按同一流程开会，最后留几分钟答疑。"],
    ["请各班老师自己安排","你把学校通知发给三位班主任，由他们各自决定怎么讲、要不要留时间和家长单独谈。"],
    ["共用一页说明，各班留出自己的时间","请一位老师把作业和请假安排整理成一页，三个班开场都讲清楚。接下来各班讲自己的情况，想聊孩子个人情况的家长由班主任提前约好会后时间。"],
   ]},
  cafeteria:{label:"副校长资格评估",title:"饭堂拥堵",answer:1,
   prompt:"这几天，三、四年级一到中午就同时进饭堂，打饭的队伍排到了门外。四年级老师说：「后面的孩子刚坐下，午休铃就响了。」饭堂师傅也说：「靠门的窗口排满了，里面那个窗口还有空。」学校请你牵头试行一周的新安排。你怎么做？",
   choices:[
    ["先把学生分到两个窗口","两个年级照常到饭堂，由值班老师在门口把队伍分到两个窗口，先看看能不能把长队缩短。"],
    ["把到场时间和取餐窗口一起排好","和两个年级、饭堂负责人定好各班到场时间和取餐窗口，值班老师按表带队。试行一周，记录各批排队多久、最后一批有没有足够时间吃饭。"],
    ["先让四年级提早去饭堂","请四年级提前五分钟到，三年级照常。窗口安排先照旧，一周后听听两边老师的反馈。"],
   ]},
  deputy:{label:"副校长岗位面试",title:"上任后的第一个月",answer:1,
   intro:"「我当年级组长时，负责过运动会后的调课。三个班的老师先把共用的实验室和任课老师排好，再一起核对剩下的课表。」",
   prompt:"「如果由你分管全校教学，你会怎么开展工作？学校想给新教师安排听课，但有人说老教师的课表已经很满。你上任第一个月会怎么做？」",
   choices:[
    ["先给每位新教师配一位指导老师","请各年级推荐有经验的老师，配对后由双方自己约时间。月底汇总谁已经听过课、谁还没约上。"],
    ["先集中答疑，再按需安排听课","请新教师整理课堂上遇到的问题，请有经验的老师集中答疑。对需要看课堂示范的问题，由教务处协调时间，安排新教师听一节现有的课。月底请新教师分享自己试了什么、效果怎样。"],
    ["先办一次全校示范课","请一位有经验的老师上课，新教师一起听，课后集中提问。月底收集大家的反馈，再决定下一次示范课讲什么。"],
   ]},
  principal:{label:"校长选聘",title:"这笔预算先花在哪里？",answer:2,
   intro:"「担任副校长期间，我牵头做过出勤改进。我们先核对迟到原因，再选一个年级试行，最后用出勤记录检查效果。」",
   prompt:"「下学期只有一笔专项经费。两个班的投影经常黑屏，图书馆也有一批低年级读物需要添补。预算只够先做一项。如果你来当校长，你会怎么决定？」",
   choices:[
    ["先更新两个班的投影","先让每天受影响的课堂恢复正常，低年级读物等下一轮经费再补。"],
    ["先添低年级读物","新书能让整个低年级轮流借阅。投影出问题的班先借用备用设备。"],
    ["先核实影响和解决成本，再定优先项","请后勤查投影能不能修、有没有备用设备，同时请图书管理员核对借阅需求和缺书情况。和校务团队定下优先项，把理由和另一项的临时安排一起告诉老师。"],
   ]},
 };
 const interviews=[null,null,{key:'deputyInterview',task:'副校长岗位面试',card:'deputy'},
  {key:'principalSelection',task:'校长选聘',card:'principal'}];
 const projectSteps=[
  ['查原因','和班主任、门卫核对记录，分清是晚到校，还是到了却没及时进校。'],
  ['试办法','在迟到较多的年级试行。调整入校引导，并由班主任跟进反复晚到的学生。'],
  ['看结果','对照试行前后的迟到记录，提交总结。'],
 ];
 const teachingTasks=[
  ['参加集体备课','和同年级老师一起看学生常错的题，改一份课堂练习。'],
  ['听课后调整教案','听一节同事的课，把适合自己班的做法写进下一节课的教案。'],
  ['跟进学生错题','找出学生反复出错的原因，安排针对性练习，再用一道新题检查。'],
 ];
 const managementTasks=[
  ['跟进家长反馈','和班主任核实情况，明确由谁处理、什么时候回复家长。'],
  ['复盘一次值班安排','和值班老师核对哪段时间最忙，调整交接时间。'],
  ['回访一次教师培训','了解哪些做法已用进课堂，并记录还需要什么支持。'],
 ];
 const role=job=>stages.find(stage=>stage.name===job);
 const working=s=>!!role(s.job)&&!s.retired&&!s.unemployedMonths;
 const entry=(s,job=s.job)=>s.schoolCareer?.records?.[job]??{months:0,reviews:{}};
 const record=(s,job=s.job)=>(((s.schoolCareer??={}).records??={})[job]??={months:0,reviews:{}});
 const year=s=>Math.floor((s.month+5)/12);
 const hasMasters=s=>s.schoolCareer?.leadershipDegree===true||
  (EDU_RANK[s.education]??0)>=EDU_RANK.master;
 const interview=job=>interviews[stages.indexOf(role(job))];
 function interviewStatus(s){
  const cfg=interview(s.job),r=entry(s);
  return cfg?{passed:r[cfg.key+'Passed']===true,
   attempted:r[cfg.key+'Year']===year(s)}:{passed:false,attempted:false};
 }
 function canInterview(s){
  if(!working(s)||!interview(s.job)||s.pendingResignation||s.schoolCareer?.pending)return false;
  const status=interviewStatus(s);
  return !status.passed&&!status.attempted&&entry(s).applicationYear!==year(s)&&
   requirements(s).slice(0,-1).every(row=>row[2]);
 }
 function completeInterview(s,passed){
  if(!canInterview(s))return false;
  const {key}=interview(s.job);
  return CareerLearningRules.atomic(s,()=>{
   const r=record(s);
   r[key+'Year']=year(s);
   r[key+'Passed']=passed;
   return {};
  },save).ok;
 }
 function requirements(s){
  const stage=role(s.job),r=entry(s);
  if(!stage?.months)return [];
  const checks=[['当前岗位资历',r.months+' / '+stage.months+' 个月',r.months>=stage.months]];
  if(stage===stages[0]||stage===stages[1]){
   const senior=stage===stages[1],target=senior?3:2;
   const reviews=[openClassRecord(s),...(senior?[r]:[])]
    .flatMap(row=>Object.values(row.reviews)).filter(value=>value===true).length;
   const classes=openClassPasses(openClassRecord(s));
   checks.push(['年度教学考核',reviews+' / '+target+' 次及格',reviews>=target]);
   checks.push(['公开课',classes+' / '+requiredOpenClassPasses+' 次通过',classes>=requiredOpenClassPasses]);
   if(senior){const count=collaborationCount(s);checks.push(['年级协作任务',count+' / 2',count===2]);}
   return checks;
  }
  if(stage===stages[3]){
   const passed=Object.values(r.reviews).filter(value=>value===true).length;
   checks.push(['年度管理考核',passed+' / 2 次合格',passed>=2]);
  }
  if(stage===stages[2])checks.push(['学历','硕士或以上',hasMasters(s)]);
  checks.push([stage.task,'已通过',!!r.task]);
  const selection=interview(s.job);
  if(selection)checks.push([selection.task,'已通过',interviewStatus(s).passed]);
  return checks;
 }
 function practiceBlock(s,id){
  const skill=skills[id];
  if(!working(s)||!skill)return '当前无法练习。';
  if(id==='administration'&&s.job===stages[0].name)return '晋升资深小学教师后开放。';
  if(level(s,id)===thresholds.length)return '已满级。';
  if(s.schoolCareer?.practice?.month===s.month&&s.schoolCareer.practice.done[id])return '本月已练习。';
  if(isRecoveryMonth(s))return '康复期间暂停练习。';
  if(s.energy<2)return '能量不足。';
  if(currentCareerTime().free-necessaryPetCareHours()<skill.hours)return '可用自由时间不足。';
  return '';
 }
 function practice(s,id){
  if(practiceBlock(s,id))return false;
  return CareerLearningRules.atomic(s,()=>{
   const d=s.schoolCareer??={records:{}};
   if(d.practice?.month!==s.month)d.practice={month:s.month,hours:0,done:{}};
   d.practice.hours+=skills[id].hours;
   d.practice.done[id]=true;
   (d.skills??={})[id]=Math.min(xp(s,id)+practiceXP,thresholds.at(-1));
   s.energy-=2;
   return {};
  },save).ok;
 }
 const schoolYear=s=>Math.floor((s.month+7)/12);
 const reviewType=s=>role(s.job)===stages[3]?'management':'teaching';
 const reviewTasks=s=>!role(s.job)?.reviews?[]:reviewType(s)==='management'?managementTasks:teachingTasks;
 const improvement=s=>s.schoolCareer?.improvements?.[reviewType(s)]?.[schoolYear(s)];
 const excellenceRules={
  '小学教师':{bonus:300,skills:[['instruction',2]]},
  '资深小学教师':{bonus:400,skills:[['instruction',2],['communication',2]]},
  '小学副校长':{bonus:500,skills:[['administration',3]]}
 };
 function excellence(s){
  const rule=excellenceRules[s.job];
  if(!rule)return null;
  const targets=rule.skills.map(([id,level])=>({
   name:skills[id].name,level,xp:xp(s,id),target:thresholds[level-1]
  }));
  return {bonus:rule.bonus,targets,met:targets.every(t=>t.xp>=t.target)};
 }
 const awardDue=s=>Object.values(s.schoolCareer?.annualAwards??{})
  .filter(award=>award.paidMonth==null&&award.earnedMonth<s.month)
  .reduce((total,award)=>total+award.amount,0);
 function settleAnnualAwards(s){
  for(const award of Object.values(s.schoolCareer?.annualAwards??{})){
   if(award.paidMonth==null&&award.earnedMonth<s.month)award.paidMonth=s.month;
  }
 }
 function improve(s,index){
  const task=reviewTasks(s)[index];
  if(!working(s)||!task||improvement(s)||isRecoveryMonth(s)||
     currentCareerTime().free-necessaryPetCareHours()<4)return false;
  return CareerLearningRules.atomic(s,()=>{
   record(s);
   const data=s.schoolCareer, entries=(data.improvements??={})[reviewType(s)]??={};
   entries[schoolYear(s)]={index,month:s.month};
   const spending=data.improvementTime??={};
   spending[s.month]=4+(spending[s.month]||0);
   return {};
  },save).ok;
 }
 const collaborationPassed=(s,id)=>entry(s).collaboration?.[id]===true||
  (id==='sports'&&entry(s).task===true);
 const collaborationCount=s=>['sports','parents'].filter(id=>collaborationPassed(s,id)).length;
 function collaborate(s,id,passed){
  if(!working(s)||role(s.job)!==stages[1]||!['sports','parents'].includes(id)||
     collaborationPassed(s,id)||entry(s).collaborationAttempt?.[id]===s.month)return false;
  return CareerLearningRules.atomic(s,()=>{
   const row=record(s);
   (row.collaborationAttempt??={})[id]=s.month;
   if(passed)(row.collaboration??={})[id]=true;
   return {};
  },save).ok;
 }
 function assess(s,passed){
  if(!working(s)||role(s.job)!==stages[2]||!hasMasters(s)||entry(s).task||
     entry(s).taskAttempt===s.month)return false;
  return CareerLearningRules.atomic(s,()=>{
   const row=record(s);row.taskAttempt=s.month;row.task=passed;
   return {};
  },save).ok;
 }
 const projectProgress=s=>entry(s).task?3:(entry(s).project?.progress||0);
 function advanceProject(s){
  const progress=projectProgress(s);
  if(!working(s)||role(s.job)!==stages[3]||progress>=3||
     entry(s).project?.month===s.month||isRecoveryMonth(s))return false;
  return CareerLearningRules.atomic(s,()=>{
   const row=record(s);
   row.project={progress:progress+1,month:s.month};
   if(progress===2)row.task=true;
   return {};
  },save).ok;
 }
 function apply(s,passed){
  const stage=role(s.job),index=stages.indexOf(stage),r=entry(s);
  if(!working(s)||!stage.months||s.pendingResignation||s.schoolCareer?.pending||
     r.applicationYear===year(s)||requirements(s).some(row=>!row[2]))return false;
  return CareerLearningRules.atomic(s,()=>{
   record(s).applicationYear=year(s);
   if(passed)s.schoolCareer.pending={from:s.job,to:stages[index+1].name,month:s.month+1};
   return {};
  },save).ok;
 }
 function closeMonth(s,settlement={},worked=working(s)){
  if(!worked||!role(s.job))return;
  const row=record(s);
  row.months++;
  if(!role(s.job).reviews)return;
  const calendar=coffeeCalendar(s.month),key=schoolYear(s);
  if(![6,7,12].includes(calendar.month))(row.dailyTeaching??={})[key]=true;
  if(calendar.month!==5)return;
  const id='school-'+key;
  if(stages.some(stage=>Object.hasOwn(entry(s,stage.name).reviews??{},id)))return;
  const type=reviewType(s),daily=type==='management'||row.dailyTeaching?.[key]===true;
  const task=reviewTasks(s)[improvement(s)?.index]?.[0]||null;
  row.reviews[id]=daily&&!!task;
  const reviewCheck=requirements(s).find(([name])=>name.startsWith('年度'));
  const goal=excellence(s),excellent=row.reviews[id]&&goal.met;
  const bonus=excellent?goal.bonus:0;
  const rating=excellent?'优秀':row.reviews[id]?'合格':'未合格';
  const result={year:key+1,type,daily,task,passed:row.reviews[id],rating,bonus,job:s.job,targets:goal.targets,
   total:Number(reviewCheck?.[1].split(' / ')[0]||0),target:type==='management'||role(s.job)===stages[0]?2:3};
  (s.schoolCareer.reviewHistory??={})[id]=result;
  if(bonus)(s.schoolCareer.annualAwards??={})[id]={amount:bonus,earnedMonth:s.month};
  settlement.schoolReview=result;
  s.schoolCareer.latestReview=result;
 }
 function deliver(s,settlement){
  const pending=s.schoolCareer?.pending;
  if(!pending||pending.month>s.month)return;
  delete s.schoolCareer.pending;
  if(!working(s)||s.job!==pending.from||s.pendingResignation)return;
  const next=role(pending.to);
  s.job=next.name;
  s.workHoursPerWeek=40;
  s.annualSalary=next.base+(next.allowance||0);
  s.salary=roundCash(s.annualSalary/12);
  s.careerStartedAt=s.month;
  s.timeline.push('晋升'+s.job+'，本月起按新岗位结算');
  settlement.schoolPromotion={job:s.job,annualSalary:s.annualSalary};
 }
 return {stages,role,working,entry,year,hasMasters,canInterview,completeInterview,interviewStatus,requirements,apply,closeMonth,deliver,
  skills,thresholds,xp,level,practiceXP,allowanceMilestones,skillAllowanceForXP,skillAllowance,practiceBlock,practice,openClasses,canTeach,drawOpenClass,resolveOpenClass,openClassPasses,openClassRecord,requiredOpenClassPasses,
  interview,scenarios,collaborationPassed,collaborate,assess,reviewTasks,reviewType,schoolYear,improvement,improve,excellence,awardDue,settleAnnualAwards,projectSteps,projectProgress,advanceProject};
})();

{
 const priorCareerTime=currentCareerTime;
 currentCareerTime=function(){
  const time=priorCareerTime();
  const practice=state?.schoolCareer?.practice;
  const hours=(practice?.month===state?.month?(practice?.hours||0):0)+
   (state?.schoolCareer?.improvementTime?.[state?.month]||0);
  return hours?{...time,free:Math.max(0,time.free-hours)}:time;
 };
}
