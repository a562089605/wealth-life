// Coffee-only seasonal income. state.month counts completed settlements; cycle 0 = January.
const COFFEE_ROLE='咖啡师 Barista';
const COFFEE_CONFIG={annualSalary:32000,weeklyHours:40,startAge:20,stress:'中',stability:'中',staffProbability:.20,departureProbability:.05,tipProbability:.08,businessWeights:{busy:30,cut:15,none:55}};
const COFFEE_EVENTS={
 staff:{name:'同事临时请假',category:'人员类事件',desc:'同事临时请假，经理询问你是否愿意顶一个完整8小时班。',choices:[
  {label:'去顶班',wages:0,tips:0,hours:8,energy:-4,stress:2,trust:1},
  {label:'婉拒',wages:0,tips:0,hours:0,energy:0,stress:0,trust:0}]},
 busy:{name:'周末爆单',category:'客流 / 经营类事件',desc:'周末门店订单突然增多，经理询问你是否愿意加班帮忙。',choices:[
  {label:'加班帮忙',wages:0,tips:0,hours:8,energy:-5,stress:3,trust:0},
  {label:'不加班',wages:0,tips:0,hours:0,energy:0,stress:0,trust:0}]},
 cut:{name:'经理削减排班',category:'客流 / 经营类事件',desc:'门店客流减少，经理提出削减一个8小时班。你可以接受削减8小时，或沟通后确定只削减4小时。',choices:[
  {label:'接受调整',wages:0,tips:0,hours:-8,energy:3,stress:0,trust:0},
  {label:'与经理沟通',wages:0,tips:0,hours:-4,energy:-1,stress:1,trust:0}]},
 tip:{name:'常客的大额小费',category:'顾客类事件',desc:'一位常客很喜欢你做的咖啡，夸奖了你的服务，并留下$20额外小费。',choices:[
  {label:'开心接受',wages:0,tips:20,hours:0,energy:0,stress:0,trust:0,happiness:3}]},
 departure:{name:'同事突然离职',category:'人员类事件',desc:'一名同事突然离职。新人到岗前，经理询问你是否愿意本月临时承担四个8小时班：两个普通工作日、两个周末。',choices:[
  {label:'接受临时加班',wages:0,tips:0,hours:32,energy:-12,stress:6,trust:2},
  {label:'不接受加班',wages:0,tips:0,hours:0,energy:0,stress:0,trust:0}]}
};
function coffeeSeason(calendarMonth){return calendarMonth===9?{key:'low',name:'淡季',tips:225,busy:.5,cut:2}:calendarMonth>=11?{key:'peak',name:'旺季',tips:450,busy:2,cut:.5}:{key:'normal',name:'普通月',tips:300,busy:1,cut:1}}
function coffeeCalendar(cycle=state.month){return{year:Math.floor(cycle/12)+1,month:cycle%12+1}}
function isCoffeeRole(job=state?.job){return job===COFFEE_ROLE||job==='Barista'||job==='咖啡师'}
function coffeeWorking(){return !!state&&isCoffeeRole()&&!state.retired&&!state.unemployedMonths}
function coffeeData(){state.coffee??={version:2,managerTrust:0,monthly:null};state.coffee.customerFavor??=0;state.coffee.version=2;return state.coffee}
function coffeeRecord(){const x=state?.coffee?.monthly;return x?.cycle===state.month?x:null}
// This is an absolute probability for personnel, not a weight in the seasonal pool.
// Independent business eligibility rolls; personnel chances stay season-independent.
function coffeeBusinessRates(month){return {busy:month===9?.30:month>=11?.70:.50,cut:month===9?.80:month>=11?.20:.50}}
function coffeeEventDistribution(month){const {busy:b,cut:c}=coffeeBusinessRates(month),remain=.67;return{staff:.20,departure:.05,tip:.08,busy:remain*b*(1-c/2),cut:remain*c*(1-b/2),none:remain*(1-b)*(1-c)}}
function sampleCoffeeEvent(month,random=Math.random){const u=random();if(u<.20)return'staff';if(u<.25)return'departure';if(u<.33)return'tip';const rates=coffeeBusinessRates(month),busy=random()<rates.busy,cut=random()<rates.cut;if(busy&&cut)return random()<.5?'busy':'cut';return busy?'busy':cut?'cut':null}
function ensureCoffeeMonth(){if(!coffeeWorking())return coffeeRecord();const c=coffeeData();if(c.monthly?.cycle===state.month)return c.monthly;const date=coffeeCalendar(),eventId=sampleCoffeeEvent(date.month);c.monthly={cycle:state.month,year:date.year,calendarMonth:date.month,eventId,status:eventId?'pending':'none',quoteContext:coffeeQuoteContext(date.month),quotes:null,extraWages:0,extraTips:0,workHoursDelta:0,choice:null};if(eventId)c.monthly.quotes=COFFEE_EVENTS[eventId].choices.map((x,i)=>coffeeQuote(eventId,i,c.monthly.quoteContext));save();return c.monthly}
// Pure shared conversion. A temporary shift changes this month only, never base weekly hours.
function careerTimeBudget(weeklyHours=40,workHoursDelta=0){return{weeklyHours,baseMonthlyWork:weeklyHours*4,monthlyWork:weeklyHours*4+workHoursDelta,baseFree:Math.max(0,260-weeklyHours*4),free:Math.max(0,260-weeklyHours*4-workHoursDelta),workHoursDelta}}
function currentCareerTime(){const c=CAREERS.find(c=>c.name===state?.job),weekly=coffeeWorking()?COFFEE_CONFIG.weeklyHours:(state?.workHoursPerWeek??c?.weeklyHours??40),delta=coffeeRecord()?.workHoursDelta||0;return careerTimeBudget(weekly,delta)}
function coffeeMonthlyIncome(){
 if(!state)return null;coffeeCareerData();const record=coffeeRecord(),working=coffeeWorking(),earned=record?.status==='resolved';if(!working&&!earned)return null;
 const date=coffeeCalendar(),season=coffeeSeason(date.month),base=state.job&&!state.retired&&!state.unemployedMonths?roundCash(state.salary||0):0;
 const baseTips=working?season.tips:0,extraWages=earned?record.extraWages:0,extraTips=earned?record.extraTips:0,time=currentCareerTime();
 return{cycle:state.month,year:date.year,calendarMonth:date.month,season:season.name,seasonKey:season.key,baseWages:base,baseTips,extraWages,extraTips,total:roundCash(Math.max(0,base+baseTips+extraWages+extraTips)),recurring:roundCash(base+baseTips),eventId:record?.eventId||null,eventChoice:record?.choice||null,baseWeeklyHours:time.weeklyHours,workHoursDelta:time.workHoursDelta,freeHours:time.free,baseFreeHours:time.baseFree};
}
function finalizeCoffeeMonth(settlement){if(!settlement.careerIncome)return;const data=state.coffee;if(data?.monthly?.cycle===settlement.careerIncome.cycle)data.monthly=null}
function coffeeIncomeMarkup(x,heading='本月职业收入'){return '<section class="wl-panel coffee-income"><h3>'+heading+'</h3><p>第'+x.year+'年 · '+x.calendarMonth+'月 · 本月状态：<b>'+x.season+'</b></p><table class="wl-review"><tr><th>基础工资</th><td>'+priceText(x.baseWages)+'</td></tr><tr><th>基础小费</th><td>'+priceText(x.baseTips)+'</td></tr><tr><th>职业事件额外工资</th><td>'+priceText(x.extraWages)+'</td></tr><tr><th>职业事件额外小费</th><td>'+priceText(x.extraTips)+'</td></tr><tr><th>最终职业收入（税前）</th><td>'+priceText(x.total)+'</td></tr></table><p>基础工时 '+x.baseWeeklyHours+'h/周 · 本月临时工时 '+(x.workHoursDelta>=0?'+':'')+x.workHoursDelta+'h<br>本月自由时间 '+x.freeHours+'h（基础 '+x.baseFreeHours+'h）</p></section>'}
function coffeeCareerMarkup(){if(!coffeeWorking())return'';const x=coffeeMonthlyIncome(),r=coffeeRecord();return coffeeIncomeMarkup(x)+'<div class="wl-panel coffee-event-entry"><p>压力：中 · 收入稳定性：中<br>经理好感 '+(state.coffee?.managerTrust||0)+'</p><button data-coffee="open">'+(r?.status==='resolved'?'查看本月职业卡结果':r?.status==='none'?'本月没有额外职业安排':'查看本月职业机会')+'</button></div>'}
function openCoffeeCareerEvent(){
 if(state?.requiredIncident){openRequiredIncident();return true}if(state?.gameOver?.final){showGameOver();return true}if(!coffeeWorking()){return false}const r=ensureCoffeeMonth();
 if(r.status!=='pending'){showEvent('咖啡师职业',r.status==='none'?'本月按正常排班工作':'本月职业安排已确认',r.status==='none'?'没有额外班次，保持基础工时。':'同一张职业卡不会重复增加收入或工时。',[['本月选择',r.choice||'正常排班'],['本月自由时间',currentCareerTime().free+'h']],[['返回',finish,true]]);return true}
 const e=COFFEE_EVENTS[r.eventId],season=coffeeSeason(r.calendarMonth),time=currentCareerTime();coffeeEnsureQuotes(r);
 showEvent('咖啡师职业机会',e.name,e.desc+' 收入随本月发薪结算；确认前不改变任何数值。',[],[['暂不决定',finish,false]]);
 const box=$('eventTitle').closest('.event');box.classList.add('coffee-painted-event');
 $('eventData').innerHTML=careerHero('barista-'+r.eventId)+'<div class="coffee-event-meta"><span>'+e.category+'</span><span>'+season.name+' · 基础小费 '+priceText(season.tips)+'</span><span>自由时间 '+time.free+'h</span></div><div class="coffee-painted-options">'+r.quotes.map((c,i)=>coffeeChoiceMarkup(r,c,i,time)).join('')+'</div>';$('eventData').style.display='block';return true;
}
function coffeeIcon(type){const paths={management:'<circle cx="12" cy="6" r="4"/><circle cx="4" cy="10" r="3"/><circle cx="20" cy="10" r="3"/><path d="M6 23v-6c0-7 12-7 12 0v6zM1 22v-6h4M19 16h4v6"/>',happiness:'<circle cx="12" cy="12" r="9"/><path d="M7 9h1M16 9h1M7 15q5 7 10 0"/>',coffee:'<path d="M4 5h12v9c0 7-12 7-12 0zM16 7h3c5 0 5 7-3 7M3 22h15"/>',service:'<path d="M4 5h12v9c0 7-12 7-12 0zM16 7h3c5 0 5 7-3 7"/>',money:'<ellipse cx="12" cy="7" rx="8" ry="3"/><path d="M4 7v5c0 4 16 4 16 0V7M4 12v5c0 4 16 4 16 0v-5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 5v7l5 3"/>',free:'<path d="M5 3h14M5 21h14M7 3c0 6 10 12 10 18M17 3c0 6-10 12-10 18"/>',energy:'<path d="M13 2L4 14h7l-1 8 10-13h-7z"/>',stress:'<circle cx="12" cy="12" r="9"/><path d="M7 9h1m8 0h1M8 17q4-6 8 0"/>',trust:'<path d="M12 22L3 13C-5 3 7-2 12 6c5-8 17-3 9 7z"/>',customer:'<path d="M3 7l5-3 4 2 4-2 5 3-3 9-5 5-4-2-4-5zM7 7l5 7 5-7M9 17l4-4"/>'};return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="#f7d887" stroke="#6d5037" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+paths[type]+'</svg>'}
function coffeeChoiceMarkup(r,c,i,time){const signed=n=>(n>0?'+':'')+n,changes=[['money','工资',c.wages,(c.wages>0?'+':'')+priceText(c.wages)],['money','额外小费',c.tips,(c.tips>0?'+':'')+priceText(c.tips)],['clock','工作时间',c.hours,signed(c.hours)+'h'],['free','自由时间',-c.hours,signed(-c.hours)+'h'],['energy','能量',c.energy,signed(c.energy)],['happiness','幸福度',c.happiness||0,signed(c.happiness||0)],['stress','压力',c.stress,signed(c.stress)],['coffee','Coffee XP',c.coffee,signed(c.coffee)+' XP'],['service','Service XP',c.service,signed(c.service)+' XP']];if(c.trust)changes.push(['trust','经理好感',c.trust,'+'+c.trust]);if(c.customer)changes.push(['customer','顾客好感',c.customer,'+'+c.customer]);const none=changes.every(x=>!x[2]);return '<button class="coffee-painted-choice '+(i?'coffee-choice-blue':'coffee-choice-gold')+'" data-coffee-choice="'+i+'" data-coffee-cycle="'+r.cycle+'" data-coffee-id="'+r.eventId+'" aria-label="'+c.label+'" '+(c.hours>0&&time.free<c.hours?'disabled':'')+'><strong><span>'+String.fromCharCode(65+i)+'</span>'+c.label+'</strong>'+(!none?'<p class="coffee-choice-total">本次收入调整 <b>'+((c.wages+c.tips)>0?'+':'')+priceText(c.wages+c.tips)+'</b>（税前，随本月发薪）</p>':'')+(none?'<p>'+({staff:'最近已经有点累了，不想加班',busy:'还是好好休息吧'}[r.eventId]||'这次不承担额外班次。')+'</p>':'<div class="coffee-change-grid">'+changes.filter(x=>!!x[2]).map(([type,label,value,display])=>{const good=type==='stress'||type==='clock'?value<0:value>0;return '<span>'+coffeeIcon(type)+'<b class="'+(good?'coffee-benefit':'coffee-cost')+'">'+display+'</b><small>'+label+'</small></span>'}).join('')+'</div>')+'<em>'+(c.hours>0&&time.free<c.hours?'自由时间不足':'确认选择 →')+'</em></button>'}
const coffeeShowBeforePaint=showEvent;showEvent=function(...args){$('eventTitle').closest('.event').classList.remove('coffee-painted-event');coffeeShowBeforePaint(...args)};
document.addEventListener('click',e=>{const b=e.target.closest('[data-coffee-choice]');if(!b||b.disabled)return;resolveCoffeeEvent(Number(b.dataset.coffeeCycle),b.dataset.coffeeId,Number(b.dataset.coffeeChoice))});

function resolveCoffeeEvent(cycle,id,index){const r=coffeeRecord();if(r)coffeeEnsureQuotes(r);const c=r?.quotes?.[index];if(!coffeeWorking()||!r||r.cycle!==cycle||r.eventId!==id||r.status!=='pending'||!c||c.hours>currentCareerTime().free)return false;
 const beforeStats={energy:state.energy,stress:state.stress,happiness:state.happiness};
 r.status='resolved';r.choice=c.label;r.extraWages=c.wages;r.extraTips=c.tips;r.workHoursDelta=c.hours;
 state.energy=Math.max(0,Math.min(100,state.energy+c.energy));state.stress=Math.max(0,Math.min(100,state.stress+c.stress));coffeeData().managerTrust=Math.max(0,(coffeeData().managerTrust||0)+c.trust);coffeeData().customerFavor=Math.min(100,Math.max(0,coffeeData().customerFavor+(c.customer||0)));r.customerFavorDelta=c.customer||0;if(c.happiness)state.happiness=Math.max(0,Math.min(100,state.happiness+c.happiness));const actual=structuredClone(c);actual.energy=state.energy-beforeStats.energy;actual.stress=state.stress-beforeStats.stress;if(c.happiness)actual.happiness=state.happiness-beforeStats.happiness;coffeeSkillGain(actual);r.resolvedEffects=actual;save();
 showEvent('咖啡师职业结果','已确认：'+c.label,'身心与经验变化已生效，收入调整随本月发薪，仅结算一次。',careerEffectRows(actual),[['继续',finish,true]]);return true;
}
// Register one background and one entry role without changing other careers or old saves.
JOBS.barista=[COFFEE_ROLE,COFFEE_CONFIG.annualSalary,2700,0,{},'highschool'];
CAREERS.push({name:COFFEE_ROLE,edu:'highschool',minExp:0,salary:32000,domain:'hospitality',weeklyHours:40,skill:'咖啡制作'});
const coffeeOption=document.createElement('option');coffeeOption.value='barista';coffeeOption.textContent=COFFEE_ROLE+'方向 · 高中';$('job').append(coffeeOption);$('job').value='barista';
const inferBeforeCoffee=inferDomain;inferDomain=function(job){return isCoffeeRole(job)?'hospitality':inferBeforeCoffee(job)};
const salaryBeforeCoffee=careerSalary;careerSalary=function(c){return isCoffeeRole(c.name)?COFFEE_CONFIG.annualSalary:salaryBeforeCoffee(c)};
const startBeforeCoffee=$('start').onclick;$('start').onclick=()=>{const coffee=$('job').value==='barista';startBeforeCoffee();if(coffee){const difference=20-state.age;state.age=state.startAge=20;for(const p of state.people||[])if(p.origin==='school')p.age+=difference;coffeeData();save();render()}};
const choicesBeforeCoffee=window.v26Choices;window.v26Choices=function(key,api){const html=choicesBeforeCoffee(key,api);if(!coffeeWorking())return html;if(key==='work'&&html!==undefined)return coffeeCareerMarkup()+html;if(key==='work')return coffeeCareerMarkup()+api.option('继续当前工作','保留当前岗位，继续本月安排。',()=>completeMonthlyStep(2),true)+api.option('查看工作调整','查看岗位或明确辞职。',openWorkAdjustment);if(key==='review')return coffeeCareerMarkup()+(html??'');return html};
const workBeforeCoffee=openWorkAdjustment;openWorkAdjustment=function(){workBeforeCoffee();if(coffeeWorking()){$('eventData').insertAdjacentHTML('afterbegin',coffeeCareerMarkup());$('eventData').style.display='block'}};
const workplaceBeforeCoffee=workplaceEvent;workplaceEvent=function(){if(coffeeWorking()&&townEnabled()){const r=ensureCoffeeMonth();if(r.status==='pending')return openCoffeeCareerEvent()}return workplaceBeforeCoffee()};
const settleBeforeCoffee=settleMonth;settleMonth=function(){
 const move=state?.town?.movement,validTown=!townEnabled()||(move&&!move.resolved&&move.payExpected&&state.month<move.payExpected);
 if(coffeeWorking()&&validTown&&!(typeof isRecoveryMonth==='function'&&isRecoveryMonth(state))&&state.turn?.index===9&&!state.requiredIncident&&!document.querySelector('.event-active')&&!state.gameOver?.final){const r=ensureCoffeeMonth();if(r.status==='pending'){openCoffeeCareerEvent();return}}
 return settleBeforeCoffee();
};
const auditBeforeCoffee=showMonthlyAudit;showMonthlyAudit=function(s){auditBeforeCoffee(s);if(s.careerIncome&&$('eventTitle').textContent.includes('结算完成')){$('eventMonth').textContent='第'+s.careerIncome.year+'年 · 第'+s.careerIncome.calendarMonth+'月';$('eventData').insertAdjacentHTML('afterbegin',coffeeIncomeMarkup(s.careerIncome,'咖啡师本月结算'));$('eventData').style.display='block'}};
const learningBeforeCoffee=learningCareerCard;learningCareerCard=function(){const html=learningBeforeCoffee();return coffeeWorking()?html+coffeeCareerMarkup():html};
document.addEventListener('click',e=>{if(e.target.closest('[data-coffee="open"]'))openCoffeeCareerEvent()});

// Approved career illustration: presentational only; the existing start button owns game creation.
window.coffeeStartMarkup=function(){return '<section id="coffeeIntro" aria-label="咖啡师职业介绍起始页"><div class="coffee-intro-toolbar"><button type="button" data-coffee-intro="back">← 返回存档</button><span>选择你的人生起点</span><button type="button" data-coffee-intro="other">其他职业 →</button></div><div class="coffee-intro-board"><div class="coffee-paper-scene"><img src="assets/career/intro.webp" width="1086" height="1448" alt="咖啡师在简单温暖的咖啡店制作拿铁，柯基在一旁休息"><button type="button" class="coffee-intro-choose" data-coffee-intro="choose" aria-label="选择这个人生：咖啡师">选择这个人生 →</button></div><div class="coffee-intro-text"><h3>咖啡师 Barista</h3><p class="coffee-intro-subtitle">20岁 · 现金 $10,000 · 初始债务 $0</p><h4>职业数据</h4><dl><div><dt>年收入</dt><dd>$32,000 + 小费波动</dd></div><div><dt>工作时间</dt><dd>40h / 周（约160h / 月）</dd></div><div><dt>自由时间</dt><dd>100h / 月</dd></div><div><dt>压力</dt><dd>中</dd></div><div><dt>收入稳定性</dt><dd>中</dd></div></dl><h4>职业特点</h4><ul><li>与不同的人交流，工作充满活力</li><li>小费带来额外收入，也有波动</li><li>入门门槛较低，无需高学历</li><li>学习饮品制作、服务与管理技能</li><li>早班、晚班和周末班较常见</li></ul><h4>职业发展方向</h4><p>咖啡师 → 值班主管 → 店长</p><div class="coffee-intro-branches"><span>成为合伙人<br><small>Partner</small></span><span>自己开咖啡店<br><small>Café Owner</small></span></div></div></div><p class="coffee-intro-note">开始后仍需主动确认入职。</p></section>'};
document.addEventListener('click',e=>{const b=e.target.closest('[data-coffee-intro]');if(!b||$('home').classList.contains('hidden')||$('newGame').classList.contains('hidden'))return;const action=b.dataset.coffeeIntro;if(action==='choose')$('start').click();if(action==='back'){$('cancel').click();$('slots').querySelector('button')?.focus()}if(action==='other'){const select=$('job');select.selectedIndex=(select.selectedIndex+1)%select.options.length;select.dispatchEvent(new Event('change',{bubbles:true}));$('wlNextJob')?.focus()}});

