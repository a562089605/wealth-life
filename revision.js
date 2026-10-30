// V27.8 candidate: saved choices, conditional events and explicit financial contracts.
const ROLE_TRAITS={education:{name:'善于沟通',socialBonus:2,opportunity:.08,jobBonus:.06},film:{name:'视觉创作',skill:'电影创作',opportunity:.07,jobBonus:.04},design:{name:'设计思维',skill:'摄影',opportunity:.06,jobBonus:.04},nursing:{name:'细心照护',socialBonus:1,opportunity:.04,jobBonus:.04},engineering:{name:'分析能力',skill:'园艺',opportunity:.05,jobBonus:.04},computing:{name:'逻辑思维',skill:'电影创作',opportunity:.05,jobBonus:.04},automotive:{name:'动手能力',skill:'园艺',opportunity:.06,jobBonus:.04},hospitality:{name:'服务意识',socialBonus:1,skill:'烹饪',opportunity:.06,jobBonus:.04},general:{name:'适应能力',opportunity:.03,jobBonus:.03}};
function roleTrait(){return ROLE_TRAITS[state.characterDomain||state.major]||ROLE_TRAITS.general}
function ensureCharacter(){state.characterDomain??=state.major||'general';state.characterTrait??=roleTrait().name;state.progressionVersion??=277;}
function attributeModifier(){return Math.max(-.35,Math.min(.12,((state.energy??50)-50)*.002+((state.happiness??50)-50)*.001+((state.health??50)-50)*.001-Math.max(0,(state.stress??0)-50)*.002))}
function careerSkill(c){return c.skill||({education:'语言学习',film:'电影创作',design:'摄影',hospitality:'烹饪',automotive:'园艺',computing:'电影创作'})[c.domain||inferDomain(c.name)]}
function careerSalary(c){const d=c.domain||inferDomain(c.name),exp=d==='general'?state.experienceYears||0:(state.domainExperience[d]||0)/12;return Math.round(c.salary*(1+Math.min(.2,Math.max(0,exp-c.minExp)*.02)+Math.max(0,(EDU_RANK[state.education]||0)-(EDU_RANK[c.edu]||0))*.025+Math.min(.08,hobbyLevel(careerSkill(c))*.01)))}
function careerSuccessChance(c){return Math.max(.1,Math.min(.95,.55+Math.min(.25,(state.experienceYears||0)*.03)+attributeModifier()+(roleTrait().jobBonus||0)))}
CAREERS.push(
 {name:'仓库理货员',edu:'highschool',minExp:0,salary:32000,domain:'general'},
 {name:'零售店员',edu:'highschool',minExp:0,salary:31000,domain:'general'},
 {name:'酒店前台',edu:'highschool',minExp:0,salary:35000,domain:'hospitality'},
 {name:'客户服务专员',edu:'highschool',minExp:0,salary:37000,domain:'general'},
 {name:'餐厅服务员',edu:'highschool',minExp:0,salary:33000,domain:'hospitality'},
 {name:'厨房助理',edu:'highschool',minExp:0,salary:30000,domain:'hospitality'},
 {name:'主厨',edu:'highschool',minExp:3,salary:56000,domain:'hospitality',skill:'烹饪'},
 {name:'助理剪辑师',edu:'associate',minExp:0,salary:40000,domain:'film',skill:'电影创作'},
 {name:'资深影视剪辑师',edu:'bachelor',minExp:5,salary:78000,domain:'film',skill:'电影创作'},
 {name:'高级教师',edu:'bachelor',minExp:5,salary:59000,domain:'education'},
 {name:'护理主管',edu:'bachelor',minExp:5,salary:92000,domain:'nursing'},
 {name:'数据分析师',edu:'bachelor',minExp:0,salary:64000,domain:'computing'},
 {name:'高级机械工程师',edu:'bachelor',minExp:5,salary:98000,domain:'engineering'}
);
function applyCareerProgression(){if(!state.job||state.retired||state.unemployedMonths>0)return;const months=state.domainExperience[inferDomain(state.job)]||0,c=CAREERS.find(c=>c.name===state.job),skill=c?careerSkill(c):null;const next=months>=60&&hobbyLevel(skill)>=4?2:months>=24&&hobbyLevel(skill)>=2?1:0;state.careerRanks??={};const rank=state.careerRanks[state.job]||0;if(next<=rank||state.month-(state.lastPromotionMonth??-12)<12)return;state.careerRanks[state.job]=next;state.salary=roundCash(state.salary*1.05);state.annualSalary=roundCash(state.salary*12);state.lastPromotionMonth=state.month;state.pendingCareerNotice={job:state.job,rank:next,salary:state.salary};state.timeline.push(state.job+' 晋升等级 '+next+'，经验与技能加薪5%');}
function currentBankAPR(){const ec=ECONOMIES[state.economy||0],shock=state.worldShock?.monthsLeft>0?WORLD_SHOCKS[state.worldShock.index]:null;return Math.min(.22,Math.max(.035,ec.rate+.015+Math.max(-.01,((state.annualInflation??.025)-.025)*.5)+(shock?.rate||0)))}
function latePaymentCharge(row,loan){return loan.latePolicy==='fee5cap35'?roundCash(Math.min(row.due*.05,loan.lateFeeCap??35)):roundCash(row.due*.03/12)}
function bondYield(months){const base=ECONOMIES[state.economy||0].rate,years=Math.min(5,Math.max(1,months/12)),premium=(years-1)*(state.economy===3?-.001:.002);return Math.max(.005,base+premium)}
function simulatedMarketReturn(ec,shock){const u=Math.max(.00001,Math.random()),v=Math.random(),z=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);const annual=[.07,.11,.015,-.12,.035][state.economy||0];return Math.max(-.22,Math.min(.22,Math.pow(1+annual,1/12)-1+z*.035+(shock?.market||0)))}
V26_INSTRUMENTS.push(
 {id:'smallcap',name:'国内小盘 ETF',kind:'ETF',desc:'分散持有小型上市公司，波动和经营风险较高。',beta:1.3,region:'us'},
 {id:'emerging',name:'新兴市场 ETF',kind:'ETF',desc:'新兴经济体股票组合，包含汇率与地区风险。',beta:1.3,region:'intl'},
 {id:'treasuryfund',name:'国债基金',kind:'基金',desc:'持有多个期限的国债，利率上涨时净值可能下跌。无固定到期保本承诺。',beta:.15,region:'bond'},
 {id:'income',name:'股息平衡基金',kind:'基金',desc:'股息股票与防御资产混合配置，分配不保证。',beta:.65,region:'world'},
 {id:'blue',name:'BLUE 能源',kind:'股票',desc:'模拟能源企业，受商品价格与经营状况影响。',beta:1.6,region:'us'},
 {id:'orbit',name:'ORBIT 物流',kind:'股票',desc:'模拟运输公司，受需求、油价与融资成本影响。',beta:1.4,region:'us'},
 {id:'care',name:'CARE 医疗',kind:'股票',desc:'模拟医疗公司，存在研发、监管与公司经营风险。',beta:1.2,region:'us'}
);
ETF_YIELDS.smallcap=.018;ETF_YIELDS.emerging=.028;
const initQuotesBefore277=initQuotes;initQuotes=function(){initQuotesBefore277();for(const i of V26_INSTRUMENTS)state.marketQuotes[i.id]??={price:100,previous:100,history:[{month:state.month,price:100}]}};
const financeBefore277=syncFinance;syncFinance=function(){if(!state)return;ensureCharacter();initQuotes();for(const a of state.assets||[])if(a.kind==='savings'){a.rate=Math.max(.005,ECONOMIES[state.economy||0].rate-.02);a.cf=roundCash(a.cost*a.rate/12)}financeBefore277()};
const advanceBefore277=advanceQuotes;advanceQuotes=function(change,month){const old=state.marketQuotes?.treasuryfund?.price;advanceBefore277(change,month);const q=state.marketQuotes.treasuryfund;if(q&&q.history.at(-1)?.month===month){const rate=ECONOMIES[state.economy||0].rate,last=state.previousBondFundRate??rate;q.price=roundCash((old??100)*(1+rate/12-4*(rate-last)));q.history.at(-1).price=q.price;state.previousBondFundRate=rate;for(const a of state.assets)if(a.instrument==='treasuryfund')a.value=roundCash(a.shares*q.price)}};
const marketBefore277=openMarket;openMarket=function(kind){marketBefore277(kind);for(const b of $('eventData').querySelectorAll('[data-v26=market]')){const cfg=V26_INSTRUMENTS.find(i=>i.id===b.dataset.key),q=quoteFor(cfg.id);b.insertAdjacentHTML('beforeend',quoteChart(q));}};
// New deposits and loans use the present simulated rate; signed contracts remain fixed.
openCD=function(){const rate=Math.max(.005,ECONOMIES[state.economy||0].rate-.012);showEvent('CD','12个月 CD','固定年利率，锁定12次月末结算，到期一次返本付息。',[['本金','$1,000'],['年利率',(rate*100).toFixed(2)+'%'],['到期利息',priceText(1000*rate)]],[['确认存入 $1,000',()=>{if(!spendConfirmed('cdPurchase',1000))return;state.assets.push({id:assetId(),name:'12个月CD',kind:'cd',cost:1000,cf:0,rate,maturesAt:state.month+12,interestAccrued:0});save();finish()},true,state.cash<1000],['取消',finish,false]])};$('cdBtn')&&($('cdBtn').onclick=openCD);
const bondsBefore277=openBonds;openBonds=function(){bondsBefore277();$('eventDesc').textContent='固定票息在买入时锁定，到期还本；提前出售按市值。正常环境设期限溢价，衰退环境允许倒挂。此处为模拟报价。';for(const [i,b]of [...$('actions').children].entries())if(i<BOND_TERMS.length)b.textContent='查看 '+BOND_TERMS[i]+'个月 · 年票息 '+(bondYield(BOND_TERMS[i])*100).toFixed(2)+'%'};
V26_OFFERS.push(
 {id:'microcompany',name:'收购小型订阅公司',cost:2000,cf:200,chance:.5,effects:{energy:-10,stress:8},desc:'高风险微型业务。客户流失或交接失败会损失投入；成功后月净收入已扣运营成本。'},
 {id:'laundryshare',name:'洗衣店少数股权',cost:6500,cf:105,chance:.85,effects:{stress:2},desc:'核查账目后投资，成功后按月分配净利润。'},
 {id:'parking',name:'停车位出租权',cost:3200,cf:55,chance:.9,effects:{energy:-2},desc:'签约取得经营权；需要找到租户，净收入已扣管理成本。'},
 {id:'website',name:'小型网站收购',cost:4200,cf:90,chance:.7,effects:{energy:-5,stress:3},desc:'收入依赖流量和续费，交接可能失败。'}
);
const opportunityBefore277=opportunityChance;opportunityChance=function(o){const communication=['tutor','market-research','stall','design'].includes(o.id),creative=['photo','editing','design','rental'].includes(o.id);return o.chance===1?1:Math.max(.05,Math.min(.95,opportunityBefore277(o)+attributeModifier()+(communication&&state.characterDomain==='education'?roleTrait().opportunity:creative&&['film','design'].includes(state.characterDomain)?roleTrait().opportunity:0)))};
// One saved interaction per month has its own outcome; repeated opening cannot farm effects.
const SOCIAL_SCENES=[
 {title:'聊聊近况',desc:'对方谈起最近的生活变化。',gain:7,happiness:3},
 {title:'共同爱好',desc:'你们分享了各自喜欢的电影、音乐和创作。',gain:9,happiness:4},
 {title:'意见分歧',desc:'你们对一个话题意见不同，试着耐心听完。',gain:3,happiness:-1},
 {title:'互相鼓励',desc:'对方最近有些压力，你们聊了各自的目标。',gain:8,happiness:3},
 {title:'一起筹划周末',desc:'你们讨论下一次见面的安排。',gain:6,happiness:4},
 {title:'老照片与回忆',desc:'一张旧照片让你们聊起以前的经历。',gain:10,happiness:4}
];
function socialRecord(p){return SocialRecords.find(state,p)}
openSocialPerson=function(i){const p=state.people[i];if(!p)return;const done=socialRecord(p);showEvent('关系互动',p.name+' · '+relationStage(p),'选择相处方式。',[['身份',p.status||p.job],['亲密度',Math.round(p.relation)+'/100']],[['确认一起吃饭 · $45',()=>doSocial(p,45,8,'socialMeal'),true,!!done||state.cash<45],['确认聊天 · $0',()=>doSocial(p,0,5,'socialCoffee'),false,!!done],['确认散步交流 · $0',()=>doSocial(p,0,4,'socialWalk'),false,!!done],['返回',finish,false]])};
doSocial=function(p,cost,points,kind){
 if(!state?.people?.includes(p)||socialRecord(p))return false;
 const confirmedCosts={socialMeal:45,socialCoffee:0,socialWalk:0};
 if(!Object.prototype.hasOwnProperty.call(confirmedCosts,kind))return false;
 cost=confirmedCosts[kind];
 if(!spendConfirmed(kind,cost,{person:p.id??p.name}))return false;
 const prior={relation:p.relation,energy:state.energy,social:state.social,happiness:state.happiness};
 state.socialSequence=(state.socialSequence||0)+1;
 const personIndex=state.people.indexOf(p),scene=SOCIAL_SCENES[(state.month+personIndex*2+state.socialSequence)%SOCIAL_SCENES.length],success=Math.random()<Math.max(.2,Math.min(.98,.8+attributeModifier()+(roleTrait().socialBonus||0)*.025));
 const gain=success?scene.gain+(roleTrait().socialBonus||0):2;
 p.relation=Math.min(100,p.relation+gain);state.social=Math.min(100,state.social+3);state.happiness=Math.max(0,Math.min(100,state.happiness+(success?scene.happiness:-2)));state.energy=Math.max(0,state.energy-2);
 const receipt={month:state.month,person:p.id??p.name,kind,scene:scene.title,success,cost,gain,appliedGain:Math.round((p.relation-prior.relation)*100)/100,effects:{energy:state.energy-prior.energy,social:state.social-prior.social,happiness:state.happiness-prior.happiness}};
 // Persist the time debit together with the outcome, not in a later save.
 if(typeof socialInteractionHours==='function')receipt.hours=socialInteractionHours(kind);
 SocialRecords.add(state,p,receipt);save();
 showEvent('关系结果',scene.title,scene.desc+(success?' 这次交流让彼此更了解。':' 你有些疲惫，对话很快结束。'),[['关系变化','+'+receipt.appliedGain],['亲密度',Math.round(p.relation)+'/100']],[['继续',finish,true]]);
 return true;
};
// Buyer offers settle the chosen asset exactly once, paying off its secured loan first.
function createBuyerOffer(){state.buyerOffers??={};const saved=state.buyerOffers[state.month];if(saved)return saved;const eligible=state.assets.filter(a=>a.kind==='rental'||V26_INSTRUMENTS.some(i=>i.id===a.instrument&&i.kind==='股票'));if(!eligible.length)return null;const a=eligible[Math.floor(Math.random()*eligible.length)],premium=.04+Math.random()*.08;return state.buyerOffers[state.month]={assetId:a.id,gross:roundCash(a.value*(1+premium)),premium,status:'open',name:a.name}}
function openBuyerOffer(){const o=createBuyerOffer();if(!o||o.status!=='open')return false;const a=state.assets.find(a=>a.id===o.assetId);if(!a){o.status='expired';return false}save();showEvent('市场买家',o.name+' · 收购报价','一位买家提出高于当前估价的收购价。确认后出售全部这笔资产；放弃则继续持有。',[['当前估价',priceText(a.value)],['买家报价',priceText(o.gross)],['清偿贷款',priceText(a.mortgage||0)],['预计净到账',priceText(o.gross-(a.mortgage||0))]],[['确认出售给买家',()=>{if(o.status!=='open'||state.cash+o.gross-(a.mortgage||0)<0)return;const i=state.assets.findIndex(a=>a.id===o.assetId);if(i<0)return;const net=roundCash(o.gross-(state.assets[i].mortgage||0));state.cash=roundCash(state.cash+net);state.assets.splice(i,1);o.status='sold';state.financeLedger??=[];state.financeLedger.push({kind:'assetSale',month:state.month,amount:net,assetId:o.assetId});save();finish()},true,state.cash+o.gross-(a.mortgage||0)<0],['继续持有',()=>{o.status='declined';save();finish()},false]]);return true}
// Required costs are saved before display and cannot be dismissed to avoid payment.
function requireIncident(title,cost){state.requiredIncident??={id:'incident-'+state.month+'-'+title,month:state.month,title,cost,status:'unpaid'};save();openRequiredIncident()}
function openRequiredIncident(){const x=state.requiredIncident;if(!x||x.status==='paid')return;showEvent('必要生活事件',x.title,'这笔费用需要处理。可使用现金、应急金或筹款后付款。',[['本次应付',priceText(x.cost)],['现金',priceText(state.cash)],['应急金',priceText(state.emergencyFund||0)],...(x.gross!=null?[['医疗原费用',priceText(x.gross)],['保险承担',priceText(x.gross-x.cost)]]:[])],[['确认支付 '+priceText(x.cost),()=>payRequiredIncident(x.title,x.cost),true,state.cash+(state.emergencyFund||0)<x.cost],['筹措费用',()=>openIncidentFunding(x.title,x.cost),false]]);$('eventClose').hidden=true;}
function payRequiredIncident(title,cost){if(!state.requiredIncident)state.requiredIncident={id:'incident-'+state.month+'-'+title,title,cost,status:'unpaid'};const x=state.requiredIncident;if(x.status==='paid')return;const use=Math.min(state.emergencyFund||0,Math.max(0,cost-state.cash));if(state.cash+use<cost)return openIncidentFunding(title,cost);state.emergencyFund=roundCash((state.emergencyFund||0)-use);state.cash=roundCash(state.cash+use);if(use)(state.financeLedger??=[]).push({kind:'emergencyWithdrawal',month:state.month,amount:use});if(!spendConfirmed('lifeIncident',cost,{incident:x.id}))return;x.status='paid';if(x.gross!=null){state.medicalEvents??=[];state.medicalEvents.push({month:state.month,gross:x.gross,due:x.cost,insured:x.cost===0})}state.requiredIncident=null;state.health=Math.min(100,state.health+2);save();finish()}
function openIncidentFunding(title,cost){if(!state.requiredIncident)state.requiredIncident={id:'incident-'+state.month+'-'+title,title,cost,status:'unpaid'};showEvent('费用筹措',title,'选择资金来源，处理后回到待付账单。',[['尚缺',priceText(Math.max(0,cost-state.cash-(state.emergencyFund||0)))]],[['查看银行贷款',()=>openBankLoan(Math.max(1,Math.ceil(cost-state.cash-(state.emergencyFund||0))),{after:openRequiredIncident}),true],['返回账单',openRequiredIncident,false]]);$('eventClose').hidden=true;}
openMedicalEvent=function(){if(state.requiredIncident)return openRequiredIncident();const gross=600+Math.floor(Math.random()*5)*200,due=roundCash(gross*(1-(typeof medicalCoverage==='function'?medicalCoverage():state.insurance.health?.active?1:0)));state.requiredIncident={id:'medical-'+state.month,month:state.month,title:'疾病就医',cost:due,gross,status:'unpaid'};save();openRequiredIncident()};
const eventBefore277=showEvent;showEvent=function(type,title,desc,data=[],actions=[]){$('eventClose').hidden=false;if(state?.gameOver&&type!=='人生结束'){showGameOver();return}if(state?.requiredIncident?.status==='unpaid'&&!['资金处理','破产确认','宠物托付','必要生活事件','费用筹措','银行','资金补救','资产变现','出售预览','SALE','贷款调整','重组预览'].includes(type)){openRequiredIncident();return}if(type==='生活事件'&&actions.some(a=>a[0]==='筹措费用')){const row=data.find(d=>d[0]==='本次费用');const cost=Number(String(row?.[1]||'0').replace(/[^\d.]/g,''));requireIncident(title,cost);return}eventBefore277(type,title,desc,data,actions)};
const finishBefore277=finish;finish=function(){if(state?.requiredIncident?.status==='unpaid'){openRequiredIncident();return}finishBefore277()};
// Event resolution uses a saved once-per-month guard, not repeated rolls on reopen.
const eventMonthBefore277=monthlyEvent;monthlyEvent=function(){if(state.gameOver)return showGameOver();if(state.requiredIncident)return openRequiredIncident();if(state.resolvedWorldEventMonth===state.month){finish();return}state.resolvedWorldEventMonth=state.month;save();if(state.pendingCareerNotice){const n=state.pendingCareerNotice;state.pendingCareerNotice=null;save();showEvent('职业成长','经验与技能带来晋升',n.job+' 晋升到成长等级 '+n.rank+'。',[['税前月薪',priceText(n.salary)]],[['继续',finish,true]]);return}if(Math.random()<.18&&openBuyerOffer())return;if(Math.random()<.06){requireIncident(state.carOwned?'车辆必要维修':'家用电器损坏',state.carOwned?420:180);return}eventMonthBefore277()};
function gameOverReason(){if(state.happiness<50)return'幸福低于50';for(const k of ['health','energy','social'])if(state[k]<=0)return V26_STATS[k]+'耗尽';return null}
function showGameOver(){if(!state.gameOver)return;eventBefore277('人生结束','本局结束',state.gameOver.reason+'。可返回存档列表开始新人生；本局记录保留。',[['已度过',state.month+'个月'],['净资产',priceText(calcMetrics().nw)]],[['保存并返回存档',()=>{save();home()},true]]);$('eventClose').hidden=true}
const renderBefore277=render;render=function(){if(!state)return;renderBefore277();const c=CAREERS.find(c=>c.name===state.job);$('jobName').textContent=(state.job||'未就业')+' · '+priceText(state.salary||0)+'/月';$('age').textContent=state.age+'岁 · 工作经验 '+((state.workMonths||0)/12).toFixed(1)+'年 · '+roleTrait().name+(c?' · 成长等级 '+(state.careerRanks?.[c.name]||0):'');const reason=gameOverReason();if(reason&&!state.gameOver){state.gameOver={month:state.month,reason};save()}if(state.gameOver)showGameOver()};
const choicesBefore277=window.v26Choices;window.v26Choices=function(key,api){let html=choicesBefore277(key,api);if(key==='relations'){if(state.people.length&&state.people.every(p=>socialRecord(p)))return '<div class="wl-panel"><h3>本月联系人互动均已完成</h3><p>'+batchEscape(socialRecord().scene)+'</p><button class="primary" data-r277="socialContinue">继续下一阶段 →</button></div>'+api.option('本月不花钱','保留现金。',()=>completeMonthlyStep(4));}return html};
document.addEventListener('click',e=>{if(e.target.closest('[data-r277=socialContinue]'))completeMonthlyStep(4)});
// Upgrade only the number of unresolved offers; keep the three existing choices and outcomes.
const offersBefore277=monthlyOffers;monthlyOffers=function(){const o=offersBefore277();if(!o.resolved&&o.ids.length<4){const extra=V26_OFFERS.filter(x=>!o.ids.includes(x.id));if(extra.length){o.ids.push(extra[((state.offerSeed||0)+state.month)%extra.length].id);save()}}return o};
const initialBefore277=$('start').onclick;$('start').onclick=()=>{initialBefore277();const bonuses={education:{social:8,happiness:3},film:{happiness:6,energy:-2},design:{happiness:5,social:2},nursing:{health:5,happiness:2},engineering:{energy:5},computing:{energy:3,happiness:3},automotive:{health:5,energy:3},hospitality:{social:6,energy:3},general:{energy:3}}[state.characterDomain]||{};for(const[k,v]of Object.entries(bonuses))state[k]=Math.max(0,Math.min(100,state[k]+v));state.characterStatsApplied=true;save();refreshCardHeader()};
const openBefore277=openGame;openGame=function(){openBefore277();if(state?.requiredIncident?.status==='unpaid')openRequiredIncident()};

// Career reference is a read-only view of the same salary and qualification state.
function learningCareerCard(){
 const c=CAREERS.find(c=>c.name===state.job),domain=c?.domain||inferDomain(state.job),skill=c?careerSkill(c):null;
 const working=!!state.job&&!state.retired&&!(state.unemployedMonths>0),salary=working?state.salary||0:0;
 const higher=c?CAREERS.filter(x=>x.name!==c.name&&(x.domain||inferDomain(x.name))===domain&&x.salary>c.salary).sort((a,b)=>a.salary-b.salary).slice(0,2):[];
 const recommended=skill?batchEscape(skill)+' · 当前 Lv.'+hobbyLevel(skill)+'':c?'优先提升岗位所需的专业知识、学历与执照。':'先在工作阶段选择职业，再按岗位要求安排学习。';
 const direction=higher.length?higher.map(x=>batchEscape(x.name)+'：'+batchEscape(careerMissing(x).length?'尚缺 '+careerMissing(x).join('、'):'当前资格符合，可到工作市场申请')).join('<br>'):c?'积累相关经验与技能，争取当前岗位成长；换岗需另行申请。':'选择起点 → 积累经验与相关技能 → 查看符合资格的岗位。';
 return '<section class="wl-panel" id="learningCareerCard" aria-label="职业参考"><h3>我的职业</h3><p><b>'+batchEscape(state.retired?'已退休':state.job||'未就业')+'</b>'+(state.unemployedMonths>0?' · 暂时失业':'')+'<br>当前税前月薪 <b>'+priceText(salary)+'</b> · 折合年薪 '+priceText(salary*12)+'</p><p><b>推荐技能</b><br>'+recommended+'</p><p><b>职业发展方向</b><br>'+direction+'</p><small>完成更高学历后按规定比例提高当前薪资，下月起结算；换岗需要另行申请。</small></section>';
}
const careerLearningChoices=window.v26Choices;
window.v26Choices=function(key,api){const content=careerLearningChoices(key,api);return key==='learning'?learningCareerCard()+content:content};

const educationPreviewBeforeRaise=openEducation;
openEducation=function(){educationPreviewBeforeRaise();const target=state.study?.target||EDU[state.education]?.next;if(!target)return;const rate=educationRaiseRate(target),note=document.createElement('p');note.className='wl-note';note.textContent='完成'+EDU[target].name+'后，当前税前薪资提高 '+Math.round(rate*100)+'%，从毕业后的下个月起结算。报名或贷款不会立刻加薪；未就业时没有工资可增加。';$('eventData').append(note);$('eventData').style.display='block'};

