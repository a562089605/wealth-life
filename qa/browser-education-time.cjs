// Isolated local QA fixture. Never connects to or modifies the deployed game.
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.join(__dirname,'..'),results=[],errors=[];
(async()=>{
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname,f=path.join(root,name==='/'?'index.html':name);try{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.webp')?'image/webp':'text/html');res.end(fs.readFileSync(f))}catch{res.statusCode=404;res.end('missing local QA asset')}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port+'/');
  await p.getByRole('button',{name:'查看职业预览',exact:true}).click();await p.getByRole('button',{name:'选择这个人生',exact:true}).click();
  await p.evaluate(()=>{slot=90;state.housing='family';state.housingCost=0;state.cash=20000;state.health=80;state.energy=80;state.stress=20;save();window.eduBaseline=JSON.stringify(state);townHome();});
  async function reset(){await p.evaluate(()=>{clearModals();roomReview=null;state=JSON.parse(window.eduBaseline);pending=false;slot=90;render();townHome();});}
  async function preview(){await p.locator('#roomView [data-room="learn"]').click();await p.getByRole('button',{name:'学历学习',exact:true}).click();await p.getByRole('button',{name:'查看专科学位',exact:true}).click();}
  async function run(name,fn){await reset();await fn();results.push(name);console.log('PASS:',name);}
  await run('two visible learning directions and all nine interest/skill branches',async()=>{
   await p.locator('#roomView [data-room="learn"]').click();
   assert.equal(await p.locator('.learning-painted-choices button').count(),2);assert.equal(await p.evaluate(async()=>{const image=new Image();image.src='assets/career/learning-embedded.webp';await image.decode();return image.naturalWidth}),1536);
   assert.deepEqual(await p.locator('.learning-painted-choices strong').allTextContents(),['兴趣技巧学习','学历学习']);
   fs.mkdirSync(path.join(root,'progress/evidence'),{recursive:true});
   await p.screenshot({path:path.join(root,'progress/evidence/learning-menu-2026-10-30.png')});
   await p.getByRole('button',{name:'兴趣技巧学习',exact:true}).click();
   assert.equal(await p.locator('.learning-branch').count(),9);
   await p.screenshot({path:path.join(root,'progress/evidence/learning-skills-2026-10-30.png')});
   for(const name of ['摄影','电影创作','烹饪','音乐','园艺','语言学习','饮品制作基础','顾客服务基础','门店管理基础']){
    await p.getByRole('button',{name:'查看'+name,exact:true}).click();assert.match(await p.locator('#eventTitle').innerText(),new RegExp(name));
    await p.getByRole('button',{name:'返回兴趣技巧学习',exact:true}).click();
   }
   assert.deepEqual(await p.evaluate(()=>({cash:state.cash,study:state.study,free:currentCareerTime().free})),{cash:20000,study:null,free:100});
   await p.getByRole('button',{name:'返回学习',exact:true}).click();await p.getByRole('button',{name:'学历学习',exact:true}).click();
   assert.equal(await p.locator('[aria-label^="查看"]').filter({hasText:/学位/}).count(),4);
   await p.locator('.learning-painted-art').waitFor();
   await p.screenshot({path:path.join(root,'progress/evidence/learning-degrees-2026-10-30.png')});
  });
  await run('real menu, previews, enrollment, repeated callback and remaining-time display',async()=>{
   await preview();assert.equal(await p.evaluate(()=>currentCareerTime().free),100);assert.match(await p.locator('.learning-painted-sheet').innerText(),/30 个学习月/);
   assert.match(await p.locator('#eventDesc').innerText(),/报名后将持续参加课程/);
   await p.evaluate(()=>{window.eduOldConfirm=document.querySelector('.learning-painted-footer button').onclick});
   await p.getByRole('button',{name:/确认持续学习/}).click();
   assert.deepEqual(await p.evaluate(()=>({cash:state.cash,free:currentCareerTime().free,progress:state.study.progress,total:state.study.total})),{cash:13000,free:80,progress:0,total:30});
   await p.evaluate(()=>window.eduOldConfirm({preventDefault(){},stopPropagation(){}}));assert.equal(await p.evaluate(()=>state.cash),13000);
   await p.evaluate(()=>{clearModals();roomReview=null;openEducation()});assert.equal(await p.getByRole('button',{name:/退出学习|撤销.*报名/}).count(),0);
   assert.match(await p.locator('#eventData').innerText(),/每月学习安排/);
  });
  await run('loan preview and cancellation neither enroll nor consume hours',async()=>{
   await preview();await p.getByRole('button',{name:'申请学生贷款',exact:true}).click();await p.getByRole('button',{name:'取消',exact:true}).click();
   assert.deepEqual(await p.evaluate(()=>({study:state.study,cash:state.cash,free:currentCareerTime().free,loans:state.loans.length})),{study:null,cash:20000,free:100,loans:0});
  });
  for(const mode of ['close','month','save'])await run('stale enrollment callback rejected: '+mode,async()=>{
   await preview();await p.evaluate(mode=>{window.eduOldConfirm=document.querySelector('.learning-painted-footer button').onclick;if(mode==='close')clearModals();if(mode==='month')state.month++;if(mode==='save')state=structuredClone(state);window.eduOldConfirm({preventDefault(){},stopPropagation(){}})},mode);
   assert.equal(await p.evaluate(()=>state.study),null);assert.equal(await p.evaluate(()=>state.cash),20000);
  });
  await run('insufficient hours and newly changed resources block payment',async()=>{
   await p.evaluate(()=>{state.extraRest={month:0,entries:Array.from({length:21},()=>({hours:4}))}});await preview();assert.equal(await p.getByRole('button',{name:/确认持续学习/}).isDisabled(),true);
   await reset();await preview();await p.evaluate(()=>{state.cash=100});await p.getByRole('button',{name:/确认持续学习/}).click();assert.equal(await p.evaluate(()=>state.study),null);
  });
  await run('study, skill course and extra rest add their hours without duplication',async()=>{
   await preview();await p.getByRole('button',{name:/确认持续学习/}).click();await p.evaluate(()=>{clearModals();roomReview=null;previewCoffeeCourse('service')});
   await p.getByRole('button',{name:'确认学习',exact:true}).click();assert.equal(await p.evaluate(()=>currentCareerTime().free),74);
   await p.evaluate(()=>{clearModals();openExtraRest()});await p.getByRole('button',{name:'确认休息4h',exact:true}).click();assert.equal(await p.evaluate(()=>currentCareerTime().free),70);
  });
  await run('legacy enrollment reload preserves progress, fees, loan and repeatable time view',async()=>{
   await p.evaluate(()=>{state.month=16;state.study={target:'associate',progress:9,total:24};state.loans=[{id:'qa',type:'学生贷款',balance:3500,principal:3500,apr:.05,monthsLeft:36,payment:105}];save();state=load(90);openGame();clearModals();roomReview=null;openEducation()});
   assert.deepEqual(await p.evaluate(()=>({progress:state.study.progress,cash:state.cash,loan:state.loans[0].balance,free:currentCareerTime().free})),{progress:9,cash:20000,loan:3500,free:80});
  });
  async function spendRemainingAndSettle(){
   await p.evaluate(()=>{clearModals();roomReview=null;state.extraRest={month:state.month,entries:Array.from({length:Math.floor(currentCareerTime().free/4)},()=>({hours:4}))};state.monthlyPayments={month:state.month,housing:state.housingCost,living:livingTotal(),premiums:premiumsTotal()};pending=false;state.town.movement=null;openHomeMonthEnd()});
   await p.getByRole('button',{name:'确认不出门，结算本月',exact:true}).click();
  }
  await run('real monthly settlement advances once and reserves 20h for next month',async()=>{
   await preview();await p.getByRole('button',{name:/确认持续学习/}).click();await spendRemainingAndSettle();
   assert.deepEqual(await p.evaluate(()=>({month:state.month,progress:state.study.progress,free:currentCareerTime().free,hours:state.lastSettlement.educationStudy.hours})),{month:1,progress:1,free:80,hours:20});
   assert.match(await p.locator('#eventData').innerText(),/本月学习 20h/);
  });
  await run('actual health treatment pauses study and resumes after recovery without tuition',async()=>{
   await preview();await p.getByRole('button',{name:/确认持续学习/}).click();await p.evaluate(()=>{clearModals();roomReview=null;openTownLiving()});await p.locator('[data-v26="living"]').click();await p.evaluate(()=>{clearModals();state.health=20;openHealthTreatment()});
   await p.getByRole('button',{name:'确认支付并安排康复',exact:true}).click();assert.equal(await p.evaluate(()=>educationMonthlyHours(state)),0);
   await p.getByRole('button',{name:'确认执行本月康复',exact:true}).click();
   assert.deepEqual(await p.evaluate(()=>({month:state.month,progress:state.study.progress,hours:state.lastSettlement.educationStudy.hours,free:currentCareerTime().free,tuition:state.financeLedger.filter(x=>x.kind==='tuitionPayment').length})),{month:1,progress:0,hours:0,free:80,tuition:1});
  });
  await run('graduation final month keeps its 20h audit and next month releases obligation',async()=>{
   const before=await p.evaluate(()=>({salary:state.salary,job:state.job,locked:CAREERS.filter(c=>c.edu==='associate').every(c=>careerMissing(c).some(m=>m.startsWith('学历：')))}));assert.equal(before.locked,true);await p.evaluate(()=>{state.study={target:'associate',progress:29,total:30}});await spendRemainingAndSettle();
   assert.deepEqual(await p.evaluate(()=>({study:state.study,education:state.education,free:currentCareerTime().free,hours:state.lastSettlement.educationStudy.hours,graduated:state.lastSettlement.educationStudy.graduated})),{study:null,education:'associate',free:100,hours:20,graduated:true});
   const reward=await p.evaluate(()=>({salary:state.salary,job:state.job,priorWages:state.lastSettlement.careerIncome.baseWages,academicUnlocked:CAREERS.filter(c=>c.edu==='associate').every(c=>!careerMissing(c).some(m=>m.startsWith('学历：'))),bachelorStillLocked:CAREERS.filter(c=>c.edu==='bachelor').every(c=>careerMissing(c).some(m=>m.startsWith('学历：'))),otherGates:CAREERS.filter(c=>c.edu==='associate').some(c=>careerMissing(c).some(m=>m.startsWith('专业：')))}));
   assert.equal(reward.salary,Math.round(before.salary*1.08*100)/100);assert.equal(reward.job,before.job);assert.equal(reward.priorWages,Math.round(before.salary*100)/100);assert.equal(reward.academicUnlocked,true);assert.equal(reward.bachelorStillLocked,true);assert.equal(reward.otherGates,false);
   await p.evaluate(()=>{clearModals();roomReview=null;openCareerMarket();save();state=load(90)});assert.equal(await p.evaluate(()=>state.salary),reward.salary);

  });
  await run('forced-event debt and education time coexist',async()=>{
   await p.evaluate(()=>{state.study={target:'associate',progress:2,total:24};recordForcedEventTime(state,{id:'qa-debt',month:0,hours:8,available:3});state.month=1});assert.equal(await p.evaluate(()=>currentCareerTime().free),75);
  });
  await run('simple associate study has no major selector and keeps experience requirements',async()=>{
   await preview();assert.equal(await p.getByRole('combobox',{name:'选择专科专业'}).count(),0);assert.equal(await p.getByRole('button',{name:/确认持续学习/}).isDisabled(),false);
   await p.getByRole('button',{name:/确认持续学习/}).click();assert.equal(await p.evaluate(()=>state.study.major),undefined);assert.equal(await p.evaluate(()=>state.major),'hospitality');
   await p.evaluate(()=>{state.study.progress=29});await spendRemainingAndSettle();
   const gates=await p.evaluate(()=>({jobs:CAREERS.filter(c=>c.edu==='associate').map(c=>({name:c.name,missing:careerMissing(c)})),bachelor:CAREERS.filter(c=>c.edu==='bachelor').every(c=>careerMissing(c).some(m=>m.startsWith('学历：')))}));
   assert.equal(gates.jobs.length,3);assert(gates.jobs.every(c=>!c.missing.some(m=>m.startsWith('学历：')||m.startsWith('专业：'))));assert(gates.jobs.find(c=>c.name==='平面设计师').missing.includes('相关经验 1 年'));assert.equal(gates.bachelor,true);
  });
  await run('editing assistant recruitment is closed; legacy titles and actual salaries preserved',async()=>{
   await p.evaluate(()=>{state.education='associate';openCareerMarket()});
   const roles=await p.evaluate(()=>CAREERS.filter(c=>c.edu==='associate').map(c=>({name:c.name,salary:c.salary,minExp:c.minExp})));
   assert.equal(roles.length,3);assert.deepEqual(roles.find(c=>c.name==='影视剪辑助理'),{name:'影视剪辑助理',salary:40000,minExp:0});assert.equal(roles.some(c=>c.name==='助理剪辑师'),false);
   assert.equal(await p.getByRole('button',{name:'确认申请 影视剪辑助理',exact:true}).count(),0);
   for(const [job,salary] of [['助理剪辑师',3467.89],['影视剪辑助理',3166.67]]){
    await p.evaluate(({job,salary})=>{clearModals();state.job=job;state.salary=salary;state.annualSalary=salary*12;save();state=load(90);openGame();clearModals();openCareerMarket()}, {job,salary});
    assert.deepEqual(await p.evaluate(()=>({job:state.job,salary:state.salary})),{job,salary});
    assert.equal(await p.evaluate(()=>careerDefinition(state.job).skill),'电影创作');
   }
  });
  await run('bachelor compounds 12 percent on current coffee wage and survives later payroll',async()=>{
   await p.evaluate(()=>{state.education='associate';state.salary=2880;state.annualSalary=34560;captureCoffeePayMilestones();state.study={target:'bachelor',total:30,progress:29}});
   await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.salary),3225.6);assert.equal(await p.evaluate(()=>state.lastSettlement.careerIncome.baseWages),2880);
   assert.equal(await p.evaluate(()=>state.lastSettlement.educationRaise.rate),.12);
   const conditions=await p.evaluate(()=>({noMajorGates:CAREERS.filter(c=>c.edu==='bachelor').every(c=>!careerMissing(c).some(m=>m.startsWith('专业：')||m.startsWith('学历：'))),nursingLicense:careerMissing(CAREERS.find(c=>c.name==='注册护士 RN')).includes('RN 执照'),teachingLicense:careerMissing(CAREERS.find(c=>c.name==='小学教师')).includes('教师执照'),experience:careerMissing(CAREERS.find(c=>c.name==='高级软件开发者')).some(m=>m.startsWith('相关经验'))}));
   assert.deepEqual(conditions,{noMajorGates:true,nursingLicense:true,teachingLicense:true,experience:true});
   await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.salary),3225.6);assert.equal(await p.evaluate(()=>state.lastSettlement.careerIncome.baseWages),3225.6);
   await p.evaluate(()=>{save();state=load(90);openGame()});assert.equal(await p.evaluate(()=>state.salary),3225.6);
  });
  await run('bachelor gives a generic worker 3000 to 3360 without changing job',async()=>{
   await p.evaluate(()=>{state.job='行政助理';state.salary=3000;state.annualSalary=36000;state.education='associate';state.study={target:'bachelor',total:30,progress:29}});
   await spendRemainingAndSettle();assert.deepEqual(await p.evaluate(()=>({job:state.job,salary:state.salary})),{job:'行政助理',salary:3360});
  });
  await run('all twelve bachelor roles remain closed and retain original eligibility gates',async()=>{
   const result=await p.evaluate(()=>{
    state.education='bachelor';state.experienceYears=0;state.domainExperience={};state.licenses=[];
    const roles=CAREERS.filter(c=>c.edu==='bachelor');
    return roles.map(c=>{const initial=careerMissing(c);const d=c.domain||inferDomain(c.name);state.experienceYears=c.minExp;state.domainExperience[d]=c.minExp*12;state.licenses=['RN','teaching'];const eligible=careerMissing(c);state.experienceYears=0;state.domainExperience={};state.licenses=[];return {name:c.name,minExp:c.minExp,domain:d,initial,eligible}});
   });
   assert.equal(result.length,12);assert.equal(new Set(result.map(c=>c.name)).size,12);
   for(const c of result){assert.equal(c.initial.some(m=>m.startsWith('学历：')||m.startsWith('专业：')),false,c.name);assert.deepEqual(c.eligible,['该岗位暂未开放'],c.name);if(c.minExp>0)assert(c.initial.some(m=>m.startsWith(c.domain==='general'?'工作经验':'相关经验')),c.name);if(c.domain==='education')assert(c.initial.includes('教师执照'));if(c.domain==='nursing')assert(c.initial.includes('RN 执照'));}
  });
  await run('closed careers stay hidden and reject direct calls with full qualifications',async()=>{
   await p.evaluate(()=>{state.education='doctorate';state.domainExperience={computing:120,education:120,nursing:120,research:120};state.experienceYears=10;state.licenses=['RN','teaching'];openCareerMarket()});
   const before=await p.evaluate(()=>({job:state.job,salary:state.salary}));
   const closed=await p.evaluate(()=>CAREERS.map((c,i)=>({name:c.name,i,open:careerRecruitmentOpen(c)})).filter(c=>!c.open));
   assert(closed.length>=17);
   for(const c of closed){assert.equal(await p.getByRole('button',{name:'确认申请 '+c.name,exact:true}).count(),0);await p.evaluate(i=>applyCareer(i),c.i);}
   assert.deepEqual(await p.evaluate(()=>({job:state.job,salary:state.salary})),before);
  });
  await run('master preview and enrollment keep 24 months 24000 tuition and 20 hours',async()=>{
   await p.evaluate(()=>{state.education='bachelor';state.cash=30000;openEducation()});await p.getByRole('button',{name:'查看硕士学位',exact:true}).click();
   assert.match(await p.locator('.learning-painted-sheet').innerText(),/24 个学习月/);assert.match(await p.locator('.learning-painted-sheet').innerText(),/24,000/);assert.doesNotMatch(await p.locator('.learning-painted-sheet').innerText(),/18%|游戏简化|存档兼容/);assert.equal(await p.getByRole('combobox').count(),0);
   await p.screenshot({path:path.join(root,'progress/evidence/master-preview-2026-10-30.png'),fullPage:true});
   await p.getByRole('button',{name:/确认持续学习/}).click();assert.deepEqual(await p.evaluate(()=>({target:state.study.target,total:state.study.total,free:currentCareerTime().free,cash:state.cash})),{target:'master',total:24,free:80,cash:6000});
  });
  await run('master adds 18 percent to current coffee pay, old month uses prior wage',async()=>{
   await p.evaluate(()=>{state.education='bachelor';state.salary=3225.6;state.annualSalary=38707.2;captureCoffeePayMilestones();preserveCoffeeEducationRaise(state);state.study={target:'master',total:24,progress:23}});
   await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.education),'master');assert.equal(await p.evaluate(()=>state.salary),3806.21);assert.equal(await p.evaluate(()=>state.lastSettlement.careerIncome.baseWages),3225.6);assert.equal(await p.evaluate(()=>state.lastSettlement.educationRaise.rate),.18);
   await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.salary),3806.21);assert.equal(await p.evaluate(()=>state.lastSettlement.careerIncome.baseWages),3806.21);
   await p.evaluate(()=>{save();state=load(90);openGame()});assert.equal(await p.evaluate(()=>state.salary),3806.21);
  });
  await run('master follows recovery pause without losing saved plan',async()=>{
   await p.evaluate(()=>{state.education='bachelor';state.study={target:'master',total:24,progress:8};openTownLiving()});await p.locator('[data-v26="living"]').click();await p.evaluate(()=>{clearModals();state.health=20;openHealthTreatment()});
   await p.getByRole('button',{name:'确认支付并安排康复',exact:true}).click();await p.getByRole('button',{name:'确认执行本月康复',exact:true}).click();assert.equal(await p.evaluate(()=>state.study.progress),8);assert.equal(await p.evaluate(()=>state.lastSettlement.educationStudy.hours),0);assert.equal(await p.evaluate(()=>currentCareerTime().free),80);
  });
  async function doctoratePreview(cash=60000){
   await p.evaluate(cash=>{clearModals();roomReview=null;state.education='master';state.cash=cash;openEducation()},cash);
   await p.getByRole('button',{name:'查看博士学位',exact:true}).click();
  }
  await run('doctorate player copy, 60-hour commitment, fee and saved plan are clear',async()=>{
   await doctoratePreview();assert.match(await p.locator('.learning-painted-sheet').innerText(),/48 个学习月/);assert.match(await p.locator('.learning-painted-sheet').innerText(),/48,000/);assert.match(await p.locator('.learning-painted-sheet').innerText(),/60h/);assert.doesNotMatch(await p.locator('.learning-painted-sheet').innerText(),/25%|培养方式|游戏简化|不模拟|不补造|历史记录/);assert.equal(await p.getByRole('combobox').count(),0);
   await p.screenshot({path:path.join(root,'progress/evidence/doctorate-preview-2026-10-30.png'),fullPage:true});
   await p.getByRole('button',{name:/确认持续学习/}).click();assert.deepEqual(await p.evaluate(()=>({target:state.study.target,total:state.study.total,cash:state.cash,free:currentCareerTime().free})),{target:'doctorate',total:48,cash:12000,free:40});
   await p.evaluate(()=>{save();state=load(90);clearModals();openEducation()});assert.match(await p.locator('.learning-painted-sheet').innerText(),/博士/);assert.match(await p.locator('.learning-painted-sheet').innerText(),/0\/48/);
  });
  await run('doctorate resource checks and repeated confirmation are protected',async()=>{
   await doctoratePreview(47999);assert.equal(await p.getByRole('button',{name:/确认持续学习/}).isDisabled(),true);assert.equal(await p.evaluate(()=>state.study),null);
   await reset();await p.evaluate(()=>{state.extraRest={month:0,entries:Array.from({length:21},()=>({hours:4}))}});await doctoratePreview();assert.equal(await p.getByRole('button',{name:/确认持续学习/}).isDisabled(),true);
   for(const mode of ['close','month','save']){
    await reset();await doctoratePreview();await p.evaluate(mode=>{const callback=document.querySelector('.learning-painted-footer button').onclick;if(mode==='close')clearModals();if(mode==='month')state.month++;if(mode==='save')state=structuredClone(state);callback({preventDefault(){},stopPropagation(){}})},mode);assert.equal(await p.evaluate(()=>state.study),null);assert.equal(await p.evaluate(()=>state.cash),60000);
   }
   await reset();await doctoratePreview();await p.evaluate(()=>window.qaDoctorConfirm=document.querySelector('.learning-painted-footer button').onclick);await p.getByRole('button',{name:/确认持续学习/}).click();await p.evaluate(()=>window.qaDoctorConfirm({preventDefault(){},stopPropagation(){}}));assert.equal(await p.evaluate(()=>state.cash),12000);assert.equal(await p.evaluate(()=>state.financeLedger.filter(x=>x.kind==='tuitionPayment').length),1);
  });
  await run('doctorate student loan cancellation and disbursement do not auto-enroll',async()=>{
   await doctoratePreview(1000);await p.getByRole('button',{name:'申请学生贷款',exact:true}).click();await p.getByRole('button',{name:'取消',exact:true}).click();assert.equal(await p.evaluate(()=>state.loans.length),0);assert.equal(await p.evaluate(()=>state.cash),1000);
   await p.getByRole('button',{name:'申请学生贷款',exact:true}).click();await p.getByRole('button',{name:'确认贷款',exact:true}).click();assert.equal(await p.evaluate(()=>state.study),null);assert.equal(await p.evaluate(()=>state.cash),49000);
   await p.getByRole('button',{name:/确认持续学习/}).click();assert.equal(await p.evaluate(()=>state.cash),1000);assert.equal(await p.evaluate(()=>state.study.target),'doctorate');assert.equal(await p.evaluate(()=>state.loans.length),1);
  });
  await run('doctorate pauses in real recovery and resumes with no repeated tuition',async()=>{
   await doctoratePreview();await p.getByRole('button',{name:/确认持续学习/}).click();await p.evaluate(()=>{clearModals();openTownLiving()});await p.locator('[data-v26="living"]').click();await p.evaluate(()=>{clearModals();state.health=20;openHealthTreatment()});await p.getByRole('button',{name:'确认支付并安排康复',exact:true}).click();await p.getByRole('button',{name:'确认执行本月康复',exact:true}).click();
   assert.equal(await p.evaluate(()=>state.study.progress),0);assert.equal(await p.evaluate(()=>state.lastSettlement.educationStudy.hours),0);assert.equal(await p.evaluate(()=>currentCareerTime().free),40);assert.equal(await p.evaluate(()=>state.financeLedger.filter(x=>x.kind==='tuitionPayment').length),1);
  });
  await run('doctorate goes through all 48 real settlements and grants 25 percent once',async()=>{
   await doctoratePreview();await p.getByRole('button',{name:/确认持续学习/}).click();
   let before;
   for(let i=0;i<48;i++){
    await p.evaluate(()=>{state.health=80;state.energy=80;state.stress=20;Math.random=()=>.99});
    if(i===47)before=await p.evaluate(()=>state.salary);
    await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.month),i+1);if(i<47)assert.equal(await p.evaluate(()=>state.study.progress),i+1);
   }
   assert.deepEqual(await p.evaluate(()=>({education:state.education,study:state.study,free:currentCareerTime().free,rate:state.lastSettlement.educationRaise.rate,tuition:state.financeLedger.filter(x=>x.kind==='tuitionPayment').length})),{education:'doctorate',study:null,free:100,rate:.25,tuition:1});
   const salary=await p.evaluate(()=>state.salary);assert.equal(salary,Math.round(before*1.25*100)/100);assert.equal(await p.evaluate(()=>state.lastSettlement.careerIncome.baseWages),before);
   await p.getByRole('button',{name:'查看毕业回执',exact:true}).click();assert.match(await p.locator('.learning-painted-sheet').innerText(),/48 个学习月/);assert.match(await p.locator('.learning-painted-sheet').innerText(),/48,000/);assert.doesNotMatch(await p.locator('.learning-painted-sheet').innerText(),/25%|游戏简化|不补造|沿用已有/);assert.equal(await p.evaluate(()=>state.salary),salary);
   await p.screenshot({path:path.join(root,'progress/evidence/doctorate-graduation-2026-10-30.png'),fullPage:true});await p.getByRole('button',{name:'返回本月账单',exact:true}).click();assert.equal(await p.evaluate(()=>state.salary),salary);
   await p.evaluate(()=>{state.health=80;state.energy=80;state.stress=20});await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.salary),salary);
   await p.evaluate(()=>{save();state=load(90);clearModals();openEducation()});await p.getByRole('button',{name:'查看博士学位',exact:true}).click();assert.equal(await p.getByRole('button',{name:/确认持续学习/}).count(),0);assert.equal(await p.evaluate(()=>state.salary),salary);
  });
  await run('doctorate and professional saves retain degree while research hiring remains closed',async()=>{
   for(const degree of ['master','professional','doctorate']){
    await p.evaluate(degree=>{state.education=degree;save();state=load(90);clearModals();openCareerMarket()},degree);
    assert.equal(await p.evaluate(()=>state.education),degree);
    assert.equal(await p.getByRole('button',{name:'确认申请 研究员',exact:true}).count(),0);
    assert.equal(await p.evaluate(()=>careerMissing(CAREERS.find(c=>c.name==='研究员')).includes('该岗位暂未开放')),true);
   }
  });
  await run('four distinct academic scenes and dedicated graduation scene load',async()=>{
   const degrees=['associate','bachelor','master','doctorate'],labels=['专科学位','学士学位','硕士学位','博士学位'];
   for(let i=0;i<degrees.length;i++){
    await p.evaluate(i=>{state.study=null;state.education=['highschool','associate','bachelor','master'][i];clearModals();openEducation()},i);
    await p.getByRole('button',{name:'查看'+labels[i],exact:true}).click();
    assert.equal(await p.locator('.learning-painted-scene').getAttribute('data-education-scene'),degrees[i]);
    assert.match(await p.locator('.learning-painted-art').evaluate(el=>getComputedStyle(el).backgroundImage),/education-stages.webp/);
    assert.equal(await p.evaluate(async()=>{const im=new Image();im.src='assets/career/education-stages.webp';await im.decode();return im.naturalWidth>0}),true);
    await p.screenshot({path:path.join(root,'progress/evidence/'+degrees[i]+'-scene-2026-10-30.png')});
   }
   await p.evaluate(()=>openEducationGraduationReceipt({month:1,educationStudy:{target:'associate',graduated:true,progressAfter:30,tuition:7000,hours:20},educationRaise:{after:2880}}));
   assert.equal(await p.locator('.learning-painted-scene').getAttribute('data-education-scene'),'graduation');
   assert.doesNotMatch(await p.locator('.learning-painted-sheet').innerText(),/研究员|对应岗位|25%/);
   await p.screenshot({path:path.join(root,'progress/evidence/graduation-scene-2026-10-30.png')});
  });
  await run('real confirmed promotion and bachelor graduation in same month retain both rewards',async()=>{
   await p.evaluate(()=>{state.education='associate';state.salary=2880;state.annualSalary=34560;const data=coffeeCareerData();data.baristaMonths=6;state.coffee.skills.coffee.xp=200;state.coffee.skills.service.xp=200;state.coffee.managerTrust=4;captureCoffeePayMilestones();state.study={target:'bachelor',total:30,progress:29};});
   await p.evaluate(()=>previewCoffeePromotion());await p.getByRole('button',{name:'确认晋升，下个月生效',exact:true}).click();
   await spendRemainingAndSettle();
   const result=await p.evaluate(()=>({job:state.job,salary:state.salary,expected:roundCash(coffeeAnnualPay()/12),raise:state.lastSettlement.educationRaise,promotion:state.lastSettlement.coffeePromotion}));
   assert.equal(result.job,'值班主管 Shift Lead');assert.equal(result.salary,result.expected);assert(result.salary>3225.6);assert.equal(result.raise.rate,.12);assert.equal(result.raise.nextMonthSalary,result.salary);assert.equal(result.promotion.salary,result.salary);
   await p.getByRole('button',{name:'查看毕业回执',exact:true}).click();assert.match(await p.locator('.learning-painted-sheet').innerText(),new RegExp(result.salary.toLocaleString('en-US',{minimumFractionDigits:2}).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
   await p.evaluate(()=>{save();state=load(90);clearModals()});await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.lastSettlement.careerIncome.baseWages),result.salary);
  });
  await run('graduation during temporary unemployment changes only return-to-work pay',async()=>{
   await p.evaluate(()=>{state.unemployedMonths=3;state.education='associate';state.salary=2880;state.annualSalary=34560;captureCoffeePayMilestones();state.study={target:'bachelor',total:30,progress:29}});
   await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.lastSettlement.grossSalary),0);assert.equal(await p.evaluate(()=>state.lastSettlement.educationStudy.employmentStatus),'temporarilyUnemployed');
   assert.equal(await p.evaluate(()=>state.salary),3225.6);await p.getByRole('button',{name:'查看毕业回执',exact:true}).click();
   let text=await p.locator('.learning-painted-sheet').innerText();assert.match(text,/复工后月薪/);assert.match(text,/失业期间不发工资/);assert.doesNotMatch(text,/毕业后的下一月/);
   await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.lastSettlement.grossSalary),0);await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.lastSettlement.grossSalary),0);await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.lastSettlement.careerIncome.baseWages),3225.6);
  });
  await run('jobless graduation keeps degree and timeline, without inventing a salary increase',async()=>{
   await p.evaluate(()=>{state.job=null;state.salary=0;state.annualSalary=0;state.education='associate';state.study={target:'bachelor',total:30,progress:29}});
   await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.education),'bachelor');assert.equal(await p.evaluate(()=>state.lastSettlement.grossSalary),0);assert.equal(await p.evaluate(()=>state.lastSettlement.educationRaise),undefined);assert.equal(await p.evaluate(()=>state.salary),0);assert.equal(await p.evaluate(()=>state.timeline.some(t=>t.includes('完成学士'))),true);
   await p.getByRole('button',{name:'查看毕业回执',exact:true}).click();assert.match(await p.locator('.learning-painted-sheet').innerText(),/入职后按岗位工资计薪/);assert.doesNotMatch(await p.locator('.learning-painted-sheet').innerText(),/毕业后月薪|工资生效/);
   await p.evaluate(()=>{save();state=load(90);clearModals();window.qaExpectedOffer=careerSalary(CAREERS.find(c=>coffeeSalaryRole(c.name)==='barista'));state.domainExperience.hospitality=60;state.experienceYears=5;Math.random=()=>0;openCareerMarket()});
   const quote=await p.evaluate(()=>careerSalary(CAREERS.find(c=>coffeeSalaryRole(c.name)==='barista')));await p.getByRole('button',{name:'确认申请 咖啡师 Barista',exact:true}).click();await p.getByRole('button',{name:'申请新单位',exact:true}).click();assert.equal(await p.evaluate(()=>state.salary),Math.round(quote/12*100)/100);assert.equal(await p.evaluate(()=>state.lastSettlement.educationRaise),undefined);
  });
  await run('retired graduation records degree without changing retirement income or wages',async()=>{
   const prior=await p.evaluate(()=>{state.retired=true;state.education='associate';state.study={target:'bachelor',total:30,progress:29};return {salary:state.salary,ss:state.retirement.ssMonthly}});
   await spendRemainingAndSettle();assert.equal(await p.evaluate(()=>state.education),'bachelor');assert.equal(await p.evaluate(()=>state.lastSettlement.educationRaise),undefined);assert.deepEqual(await p.evaluate(()=>({salary:state.salary,ss:state.retirement.ssMonthly})),prior);
   await p.getByRole('button',{name:'查看毕业回执',exact:true}).click();assert.match(await p.locator('.learning-painted-sheet').innerText(),/退休收入不变/);assert.doesNotMatch(await p.locator('.learning-painted-sheet').innerText(),/毕业后月薪|工资生效/);
  });
  await run('doctorate time remains reserved across coffee roles and optional overtime cannot exceed free time',async()=>{
   for(const job of ['咖啡师','值班主管 Shift Lead','店长','管理合伙人']){
    const result=await p.evaluate(job=>{state.job=job;state.workHoursPerWeek=coffeeSalaryRole(job)==='barista'||coffeeSalaryRole(job)==='shiftLead'?40:45;state.study={target:'doctorate',total:48,progress:2,monthlyHours:60};clearModals();return currentCareerTime()},job);
    assert.equal(result.educationHours,60);assert.equal(result.free,result.baseFree-60);assert(result.free>=20);
   }
   await p.evaluate(()=>{state.job='值班主管 Shift Lead';state.workHoursPerWeek=40;state.extraRest={month:state.month,entries:Array.from({length:10},()=>({hours:4}))};shiftData().monthly={cycle:state.month,eventId:'schedule',status:'pending',mainApplied:false,applied:[],quotes:[{hours:8},{hours:0}],extraWages:0,extraTips:0,bonus:0,workHoursDelta:0};});
   assert.equal(await p.evaluate(()=>currentCareerTime().free),0);const before=await p.evaluate(()=>JSON.stringify({study:state.study,cash:state.cash,record:shiftRecord()}));assert.equal(await p.evaluate(()=>resolveShiftEvent(state.month,'schedule',0)),false);assert.equal(await p.evaluate(()=>JSON.stringify({study:state.study,cash:state.cash,record:shiftRecord()})),before);
  });
  async function hobbyPreview(name='摄影'){
   await p.evaluate(()=>{clearModals();roomReview=null;openLearningSkills()});await p.getByRole('button',{name:'查看'+name,exact:true}).click();
  }
  await run('hobby preview is free; confirmed practice costs 8 hours and cannot repeat this month',async()=>{
   await hobbyPreview();assert.match(await p.locator('.learning-painted-sheet').innerText(),/8h/);assert.equal(await p.evaluate(()=>state.cash),20000);assert.equal(await p.evaluate(()=>currentCareerTime().free),100);
   await p.evaluate(()=>window.qaHobbyCallback=document.querySelector('.learning-painted-footer button').onclick);await p.getByRole('button',{name:'确认练习 摄影',exact:true}).click();
   assert.deepEqual(await p.evaluate(()=>({cash:state.cash,free:currentCareerTime().free,xp:hobbyXP('摄影'),selection:monthSelection('hobby')})),{cash:19910,free:92,xp:35,selection:'摄影'});
   await p.evaluate(()=>window.qaHobbyCallback());assert.equal(await p.evaluate(()=>hobbyXP('摄影')),35);
   await hobbyPreview('音乐');assert.equal(await p.getByRole('button',{name:'确认练习 音乐',exact:true}).isDisabled(),true);
   await p.evaluate(()=>{save();state=load(90);clearModals()});assert.equal(await p.evaluate(()=>currentCareerTime().free),92);assert.equal(await p.evaluate(()=>(state.financeLedger||[]).filter(x=>x.kind==='hobbyPractice').length),1);
  });
  await run('all six hobby branches preserve fees and gain XP only on confirmation',async()=>{
   for(const [name,cost] of Object.entries({'摄影':90,'电影创作':120,'烹饪':65,'音乐':80,'园艺':55,'语言学习':45})){
    await reset();await hobbyPreview(name);assert.equal(await p.locator('.learning-painted-scene').getAttribute('data-hobby-scene'),name);assert.match(await p.locator('.learning-painted-art').evaluate(el=>getComputedStyle(el).backgroundImage),/hobby-scenes.webp/);await p.evaluate(async()=>{const im=new Image();im.src='assets/career/hobby-scenes.webp';await im.decode()});await p.screenshot({path:path.join(root,'progress/evidence/hobby-'+Object.keys({'摄影':0,'电影创作':1,'烹饪':2,'音乐':3,'园艺':4,'语言学习':5}).indexOf(name)+'-2026-10-30.png')});await p.getByRole('button',{name:'确认练习 '+name,exact:true}).click();assert.equal(await p.locator('.learning-painted-scene').getAttribute('data-hobby-scene'),name);assert.equal(await p.evaluate(()=>state.cash),20000-cost);assert.equal(await p.evaluate(name=>hobbyXP(name),name),35);assert.equal(await p.evaluate(()=>currentCareerTime().free),92);
   }
   await p.screenshot({path:path.join(root,'progress/evidence/hobby-practice-2026-10-30.png')});
  });
  await run('hobby confirmations reject stale close, month and save callbacks',async()=>{
   for(const mode of ['close','month','save']){
    await reset();await hobbyPreview();await p.evaluate(mode=>{const cb=document.querySelector('.learning-painted-footer button').onclick;if(mode==='close')clearModals();if(mode==='month')state.month++;if(mode==='save')state=structuredClone(state);cb({preventDefault(){},stopPropagation(){}})},mode);assert.equal(await p.evaluate(()=>state.cash),20000);assert.equal(await p.evaluate(()=>hobbyXP('摄影')),0);
   }
  });
  await run('hobbies respect time, cash, pet reservation, and recovery changes after preview',async()=>{
   await p.evaluate(()=>window.qaOriginalPetHours=necessaryPetCareHours);
   for(const mode of ['hours','cash','pets','recovery']){
    await reset();await hobbyPreview();await p.evaluate(mode=>{if(mode==='hours')state.extraRest={month:0,entries:Array.from({length:24},()=>({hours:4}))};if(mode==='cash')state.cash=89;if(mode==='pets')necessaryPetCareHours=()=>95;if(mode==='recovery')state.health=20;document.querySelector('.learning-painted-footer button').onclick({preventDefault(){},stopPropagation(){}})},mode);
    assert.equal(await p.evaluate(()=>hobbyXP('摄影')),0);assert.equal(await p.evaluate(()=>(state.financeLedger||[]).filter(x=>x.kind==='hobbyPractice').length),0);await p.evaluate(()=>necessaryPetCareHours=window.qaOriginalPetHours);
   }
  });
  await run('degree, hobby, coffee skill and rest time add once; old practices are not backcharged',async()=>{
   await p.evaluate(()=>{state.study={target:'associate',progress:0,total:30,monthlyHours:20}});await hobbyPreview();await p.getByRole('button',{name:'确认练习 摄影',exact:true}).click();
   await p.evaluate(()=>{clearModals();completeCoffeeCourse('coffee',0,state.month);state.extraRest={month:state.month,entries:[{hours:4}]};save();state=load(90)});assert.equal(await p.evaluate(()=>currentCareerTime().free),60);
   await p.evaluate(()=>{state.month++;state.study.progress++;});assert.equal(await p.evaluate(()=>currentCareerTime().free),80);
   await reset();await p.evaluate(()=>{state.hobbyXP={'摄影':350};setMonthSelection('hobby','摄影');save();state=load(90)});assert.equal(await p.evaluate(()=>currentCareerTime().free),100);assert.equal(await p.evaluate(()=>hobbyXP('摄影')),350);
  });
  await run('annual hobby preflight stops before fees when combined activity hours do not fit',async()=>{
   await p.evaluate(()=>{state.annualPlan={life:'balanced',hobby:'摄影'};state.annualRun={preparedMonth:null,paused:false};state.extraRest={month:0,entries:Array.from({length:24},()=>({hours:4}))};});
   const before=await p.evaluate(()=>({cash:state.cash,ledger:(state.financeLedger||[]).length}));assert.equal(await p.evaluate(()=>prepareAnnualMonth()),false);assert.deepEqual(await p.evaluate(()=>({cash:state.cash,ledger:(state.financeLedger||[]).length})),before);assert.equal(await p.evaluate(()=>state.annualRun.paused),true);
  });
  await run('coffee course previews reject stale close, month and save confirmations',async()=>{
   for(const mode of ['close','month','save']){
    await reset();await p.evaluate(()=>previewCoffeeCourse('coffee'));await p.locator('.learning-painted-footer').waitFor();
    await p.evaluate(mode=>{const cb=document.querySelector('.learning-painted-footer button').onclick;if(mode==='close')clearModals();if(mode==='month')state.month++;if(mode==='save')state=structuredClone(state);cb({preventDefault(){},stopPropagation(){}})},mode);
    assert.equal(await p.evaluate(()=>state.cash),20000);assert.equal(await p.evaluate(()=>state.coffee?.skills?.coffee?.xp||0),0);
   }
  });
  await run('six illustrated hobby pages keep paper and actions within 320, 390 and 800 pixel views',async()=>{
   for(const width of [320,390,800])for(const name of ['摄影','电影创作','烹饪','音乐','园艺','语言学习']){
    await p.setViewportSize({width,height:844});await hobbyPreview(name);
    const fit=await p.evaluate(()=>{const scene=document.querySelector('.learning-painted-scene').getBoundingClientRect(),paper=document.querySelector('.learning-painted-sheet').getBoundingClientRect(),footer=document.querySelector('.learning-painted-footer').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,paper:paper.left>=scene.left&&paper.right<=scene.right,footer:footer.bottom<=scene.bottom&&footer.right<=scene.right}});
    assert.deepEqual(fit,{overflow:false,paper:true,footer:true});
   }
   await p.setViewportSize({width:390,height:844});
  });
  const directionLayouts=[];await reset();
  for(const width of [320,390,800])for(const mode of ['root','skills','degrees']){
   await p.setViewportSize({width,height:900});await p.evaluate(mode=>{clearModals();roomReview=null;if(mode==='root')openLearning();if(mode==='skills')openLearningSkills();if(mode==='degrees')openEducation();},mode);
   const size=await p.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth}));assert.equal(size.overflow,false);directionLayouts.push({mode,...size});
  }
  const layouts=[];await reset();await preview();
  fs.mkdirSync(path.join(root,'progress/evidence'),{recursive:true});
  for(const width of [320,390,800]){
   await p.setViewportSize({width,height:900});await p.locator('.learning-painted-art').waitFor();
   const layout=await p.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,img:!!document.querySelector('.learning-painted-art')}));assert.equal(layout.overflow,false);assert.equal(layout.img,true);layouts.push(layout);
  }
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(root,'progress/evidence/education-preview-2026-10-30.png'),fullPage:true});
  await p.getByRole('button',{name:/确认持续学习/}).click();await p.evaluate(()=>{clearModals();roomReview=null;openEducation()});await p.screenshot({path:path.join(root,'progress/evidence/education-plan-2026-10-30.png'),fullPage:true});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(root,'progress/education-browser-2026-10-30.json'),JSON.stringify({results,layouts,directionLayouts,pageErrors:errors,limitations:'Local Chromium with isolated fixtures; service workers blocked. Not real Safari, complete offline or all historical saves.'},null,2));
  console.log('PASS:',results.length,'browser groups;',layouts.length+directionLayouts.length,'layouts; page errors:',errors.length);
 }finally{await b.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
