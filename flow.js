// V26: confirmed spending, paid-once monthly receipts and compact monthly choices.
function paymentReceipt(){return state?.monthlyPayments?.month===state.month?state.monthlyPayments:{housing:0,living:0,premiums:0}}
function paidThisMonth(){const r=paymentReceipt();return roundCash((r.housing||0)+(r.living||0)+(r.premiums||0)+(typeof paidLoanTotal==='function'?paidLoanTotal():0)+(typeof petPrepaidMonthly==='function'?petPrepaidMonthly():0))}
function livingTotal(){return roundCash(livingBaseAmount(state)+petMonthly()+(state.carRunningCost||0))}
function premiumsTotal(){return typeof PetInsurance!=='undefined'?PetInsurance.premiums(state):roundCash(Object.values(state.insurance||{}).reduce((n,p)=>n+(p.active?p.monthly:0),0))}
function remainingExpenses(){if(!state)return 0;const r=paymentReceipt(),living=livingTotal(),premiums=premiumsTotal(),other=state.expenses-(state.housingCost||0)-living-premiums;return roundCash(Math.max(0,(state.housingCost||0)-(r.housing||0))+Math.max(0,living-(r.living||0))+Math.max(0,premiums-(r.premiums||0))+Math.max(0,other-(typeof paidLoanTotal==='function'?paidLoanTotal():0)))}
function spendConfirmed(kind,amount,meta={}){amount=roundCash(amount);if(amount<0||!Number.isFinite(amount)||amount>0&&state.cash<amount)return false;if(amount===0)return true;state.cash=roundCash(state.cash-amount);state.financeLedger??=[];state.financeLedger.push({kind,month:state.month,amount,...meta});return true}
function payMonthly(category,amount){if(!spendConfirmed(category+'Payment',amount))return false;if(state.monthlyPayments?.month!==state.month)state.monthlyPayments={month:state.month,housing:0,living:0,premiums:0};state.monthlyPayments[category]=roundCash((state.monthlyPayments[category]||0)+amount);return true}
function completeMonthlyStep(index,alreadySaved=false){if(!alreadySaved){if(state.turn?.index===index&&document.getElementById('game').classList.contains('v24-running'))state.turn.index=index+1;save();}finish();if(document.getElementById('game').classList.contains('v24-running'))window.scrollTo({top:0,behavior:'instant'})}
function monthSelection(name){return state.monthChoices?.month===state.month?state.monthChoices[name]:null}
function setMonthSelection(name,value){if(state.monthChoices?.month!==state.month)state.monthChoices={month:state.month};state.monthChoices[name]=value}
function fundShortfall(amount,after){openBankLoan(Math.max(1,Math.ceil(amount-state.cash)),{after})}
const V26_STATS={health:'健康',energy:'能量',happiness:'幸福',stress:'压力',social:'社交'};
const V26_LIFE=[
 {name:'运动 / 户外',cost:25,desc:'散步、轻运动或户外活动。',effects:{health:4,energy:-3,happiness:2,stress:-6}},
 {name:'宅家休息',cost:45,desc:'留出时间休息，吃点喜欢的食物。',effects:{energy:8,happiness:4,stress:-6}},
 {name:'朋友聚餐',cost:85,desc:'维持友情，也需要花些能量。',effects:{energy:-2,happiness:7,social:6}},
 {name:'兴趣爱好',cost:120,desc:'为自己喜欢的事情留出时间。',effects:{energy:3,happiness:8,stress:-5}},
 {name:'周末短途旅行',cost:380,desc:'换个环境放松。',effects:{energy:6,happiness:14,stress:-8}},
 {name:'演唱会 / 主题乐园',cost:210,desc:'享受体验，但会消耗能量。',effects:{energy:-6,happiness:11,stress:-4}},
 {name:'升级手机',cost:950,desc:'新鲜感带来短期快乐。',effects:{happiness:7}},
 {name:'品质餐厅',cost:150,desc:'和重要的人吃一顿更好的晚餐。',effects:{energy:-2,happiness:8,social:6}},
 {name:'本月简单生活',cost:0,desc:'不额外消费，但缺少休息与娱乐。',effects:{energy:-1,happiness:-3}}
];
function effectText(e){return Object.entries(e).map(([k,v])=>V26_STATS[k]+' '+(v>0?'+':'')+v).join(' · ')}
function statTable(){return '<div class="wl-stat-reference"><b>当前状态</b><table><tbody>'+Object.entries(V26_STATS).map(([k,n])=>'<tr><th>'+n+'</th><td>'+Math.round(state[k]??0)+' / 100</td></tr>').join('')+'</tbody></table><small>各项满分100，压力越低越好。出门要求：健康≥30、能量≥20、幸福度≥20、压力＜80，并有剩余时间。低健康按医疗康复处理。</small></div>'}
function chooseLife(i){const o=V26_LIFE[i];if(monthSelection('life'))return;if(!spendConfirmed('lifestyle',o.cost,{choice:o.name}))return;for(const[k,v]of Object.entries(o.effects))state[k]=Math.max(k==='stress'||k==='social'?0:0,Math.min(100,(state[k]||0)+v));state.lifetimeFunSpend=(state.lifetimeFunSpend||0)+o.cost;setMonthSelection('life',o.name);completeMonthlyStep(3)}
function lifeMarkup(){const chosen=monthSelection('life');return (chosen?'<div class="wl-panel"><h3>本月已安排：'+chosen+'</h3><p>费用与状态已生效，不会重复执行。</p><button class="primary" data-v26="lifeContinue">继续下一步 →</button></div>':'<div class="wl-mini-grid">'+V26_LIFE.map((o,i)=>'<button class="wl-choice-card" data-v26="life" data-i="'+i+'" aria-label="确认 '+o.name+'" '+(state.cash<o.cost||blocked?'disabled':'')+'><strong>'+o.name+'</strong><b>'+money(o.cost)+'</b><small>'+effectText(o.effects)+'</small><small>'+o.desc+'</small><span>确认安排 →</span></button>').join('')+'</div>')+statTable()}
const housingOptionsBeforeV26=housingOptions;housingOptions=function(){const fees={family:0,shared:350,studio:500,rent1:700},infl=(state.cpiIndex||100)/100;return housingOptionsBeforeV26().map(h=>[h[0],h[1],Math.round(fees[h[3]]*infl),h[3]])};
function housingChoices(){const homes=housingOptions();if(state.housing&&state.housing!=='unselected'&&!homes.some(h=>h[3]===state.housing))homes.unshift([state.housing==='own'?'自住房':'当前住房（旧存档）',state.housingCost||0,0,state.housing]);return homes}
function housingQuote(h){const current=state.housing===h[3],paid=paymentReceipt().housing||0,move=current?0:h[2],rent=Math.max(0,h[1]-paid);return{move,rent,total:roundCash(move+rent),current}}
function confirmHousing(key){syncFinance();const h=housingChoices().find(h=>h[3]===key);if(!h)return;const q=housingQuote(h);if(state.cash<q.total)return;if(!spendConfirmed('movingCost',q.move,{housing:key}))return;if(!payMonthly('housing',q.rent))throw new Error('Housing receipt failed');state.housing=key;state.housingCost=h[1];state.paymentUpgradeNotice=false;state._computedExpenses=null;syncFinance();if(state.month===0){state.goalBaseExpenses=state.expenses;state.goalTarget=0}completeMonthlyStep(0)}
function housingMarkup(){const homes=housingChoices();return (state.paymentUpgradeNotice?'<div class="wl-panel"><p>旧存档已花的钱保留原账。本月住房费尚未支付，请先确认；查看此页不会扣款。</p></div>':'')+'<div class="wl-mini-grid">'+homes.map(h=>{const q=housingQuote(h);return '<button class="wl-choice-card" data-v26="housing" data-key="'+h[3]+'" aria-label="确认 '+(q.current?'继续当前住房':h[0])+'" '+(q.total>0&&state.cash<q.total?'disabled':'')+'><strong>'+(q.current?'继续当前住房':h[0])+'</strong><b>'+money(h[1])+'/月</b><small>本月住房待付 '+money(q.rent)+'<br>本次搬家/添置费 '+money(q.move)+'</small><span>确认支付 '+money(q.total)+' →</span></button>'}).join('')+'</div>'+(homes.some(h=>state.cash<housingQuote(h).total)?'<button data-v26="housingFund" class="wl-secondary">现金不足，查看贷款</button>':'')+'<p class="wl-note">点击卡片确认即付款并进入下一步。与家人同住无搬入费；换住房只补本月租金差额，搬家与添置费另列且不含房租，没有可退押金。已付住房费不在月末再扣。</p>'}
function openHousing(){showEvent('住房','选择住房','',[],[['返回',finish,false]]);$('eventData').innerHTML=housingMarkup();$('eventData').style.display='block'}
$('housingBtn').onclick=openHousing;
function livingMarkup(){const due=roundCash(Math.max(0,livingTotal()-(paymentReceipt().living||0)));return '<div class="wl-panel wl-cost"><h3>本月基本生活成本</h3><b class="wl-big-money">'+money(due)+'</b><p>基础生活 '+money(livingBaseAmount(state))+'<br>宠物照顾 '+money(petMonthly())+' · 车辆燃油/维护 '+money(state.carRunningCost||0)+'</p><small>本月住房已付 '+money(paymentReceipt().housing||0)+'。保险在保险步骤确认；贷款月供请在财富步骤的还款卡确认。</small><button data-v26="living" class="primary" '+(due>0&&state.cash<due?'disabled':'')+'>'+ (due?'确认支付 '+money(due):'本月已付，继续')+' →</button>'+(state.cash<due?'<button data-v26="livingFund">现金不足，查看贷款</button>':'')+'</div>'}
function insuranceMarkup(preselect){const items=Object.entries(INSURANCE).filter(([type])=>type==='auto').map(([type,c])=>{const active=!!state.insurance[type]?.active,locked=type==='auto'&&!state.carOwned||type==='pet'&&!state.pets?.length;return '<label class="wl-insurance-row"><input type="checkbox" data-insurance="'+type+'" '+(active||type===preselect?'checked ':'')+(active||locked?'disabled':'')+'><span><b>'+c[0]+'</b><small>'+ (locked?(type==='auto'?'拥有车辆后可买':'拥有宠物后可买'):active?'已投保，持续有效':'可选')+'</small></span><b>'+money(c[1])+'/月</b></label>'}).join('');return '<div class="wl-panel wl-insurance"><h3>本月保险方案</h3><p>医疗险单独选择：基础险$200.00/月赔80%，全额险$400.00/月赔100%。旧保单按原合同。</p><button data-medical-insurance>查看／选择医疗险</button><button data-pet-insurance '+(!state.pets?.length?'disabled':'')+'>查看／选择宠物保险</button>'+items+'<button data-home-insurance>查看／选择房险</button><p>本次应付 <b data-insurance-total></b><br><small>确认后支付本月尚未付的保费；以后持续按月收费。已付保费不在月末再扣。跳过仅表示不新增保单。</small></p><button data-v26="insuranceConfirm" class="primary">确认保险方案</button><button data-v26="insuranceSkip">跳过，不新增保险</button><small data-insurance-warning></small></div>'}
function insuranceDraftTotal(box){const selected=[...box.querySelectorAll('[data-insurance]:checked')].map(i=>i.dataset.insurance);const total=premiumsTotal()+selected.filter(k=>!state.insurance[k]?.active).reduce((n,k)=>n+INSURANCE[k][1],0);return{selected,due:roundCash(Math.max(0,total-(paymentReceipt().premiums||0)))}}
function refreshInsurance(){document.querySelectorAll('.wl-insurance').forEach(box=>{const{due}=insuranceDraftTotal(box);box.querySelector('[data-insurance-total]').textContent=money(due);box.querySelector('[data-v26="insuranceConfirm"]').disabled=due>0&&due>state.cash;box.querySelector('[data-insurance-warning]').textContent=due>state.cash?'现金不足：可减少新增保单，已有保单保费仍将于月末支付。':''})}
function openInsurance(type){showEvent('保险','保险与保障','',[],[['返回',finish,false]]);$('eventData').innerHTML=insuranceMarkup(type);$('eventData').style.display='block';refreshInsurance()}
buyInsurance=openInsurance;$('healthBtn').onclick=()=>openInsurance('health');

// Confirmed opening: no preset classmates; relationship lifecycle adds the already-known manager.
makePeople=function(){return []};
function workplaceEvent(){if(!state.job||state.retired||state.unemployedMonths>0||state.month<1)return false;const job=state.job;state.workContacts??={};const count=state.workContacts[job]||0;if(count>=2||count===1&&state.relationshipHome?.currentManagerId)return false;const role=count===0?'同事':'上司',name=(count===0?['Alex','Morgan',...NPC_NAMES]:['Morgan','Alex',...NPC_NAMES]).find(n=>!state.people.some(p=>p.name===n))||('工作联系人'+state.people.length);showEvent('工作关系','认识新的'+role,'你已在「'+job+'」工作。一次工作交流让你有机会认识'+name+'。',[['身份',role],['花费','$0.00']],[['打个招呼',()=>{if((state.workContacts[job]||0)!==count)return;state.people.push({id:'work-'+state.month+'-'+count,name,age:state.age+(count?8:2),job,sourceJob:job,status:role,origin:'work',city:state.city,relation:35,life:'在工作中认识的'+role,wealth:10000,careerLevel:1});state.workContacts[job]=count+1;finish()},true],['这次先不认识',finish,false]]);return true}
// Market records are game quotes, never live prices or invented historical returns.
const V26_INSTRUMENTS=[
 {id:'us500',name:'国内标普500 ETF',kind:'ETF',desc:'本国大型上市公司指数，约500家企业；不是《财富》500强排名。',beta:1,region:'us',risk:'股票市场风险'},
 {id:'ustotal',name:'国内全市场 ETF',kind:'ETF',desc:'覆盖本国大、中、小盘上市公司。',beta:1.05,region:'us',risk:'股票市场风险'},
 {id:'international',name:'国际股票 ETF（本国以外）',kind:'ETF',desc:'覆盖本国以外的发达及新兴市场，也有汇率和地区风险。',beta:1.05,region:'intl',risk:'市场、汇率、地区风险'},
 {id:'world',name:'全球股票 ETF',kind:'ETF',desc:'同时包含本国与国际股票，与国内 ETF 可能重叠。',beta:1,region:'world',risk:'全球股票市场风险'},
 {id:'nova',name:'NOVA 科技',kind:'股票',desc:'游戏中的单一科技公司；波动高于宽基ETF。',beta:1.8,region:'us',risk:'公司与市场风险'},
 {id:'harbor',name:'Harbor 消费',kind:'股票',desc:'游戏中的单一消费公司，经营表现会影响股价。',beta:1.45,region:'us',risk:'公司与市场风险'},
 {id:'blend',name:'平衡型基金',kind:'基金',desc:'游戏中股票与稳健资产混合配置，仍可能亏损。',beta:.65,region:'world',risk:'市场与利率风险'}
];
const FUND_OPENING_PRICES={
 blend:[93,94,95,94,96,98,97,96,99,101,100,99],
 treasuryfund:[100,101,102,101,100,99,98,98,99,100,101,101],
 income:[94,95,96,98,97,99,101,98,97,99,101,102]
};

function defaultQuote(){
 return {price:100,previous:100,history:[{month:state.month,price:100}]};
}

function addFundOpeningHistory(id,quote){
 const samples=FUND_OPENING_PRICES[id],opening=quote.history[0];
 if(!samples||opening?.month!==0)return quote;
 const history=samples.map((price,index)=>({
  month:index-samples.length,price:roundCash(opening.price*price/100),simulatedOpening:true
 }));
 if(quote.history.length===1)quote.previous=history.at(-1).price;
 quote.history.unshift(...history);
 return quote;
}

function initQuotes(){
 const quotes=state.marketQuotes??={};
 for(const item of V26_INSTRUMENTS){
  const quote=quotes[item.id]??window.ETFMarket?.openingQuote(item.id,state.month)??defaultQuote();
  quotes[item.id]=item.kind==='ETF'&&window.ETFMarket?
   ETFMarket.addOpeningHistory(item.id,quote):addFundOpeningHistory(item.id,quote);
 }
}

// Gold follows game progress; revisiting a screen or reloading cannot reroll a quote.
const GOLD_STEPS_PER_MONTH=10;
function goldProgress(s){
 const turnStep=s.turn?.month===s.month?s.turn.index||0:0;
 const town=s.town;
 if(!town)return Math.min(GOLD_STEPS_PER_MONTH,turnStep);
 const history=town.history||[];
 let moves=town.movement?.month===s.month&&!town.movement.resolved?1:0;
 for(let i=history.length-1;i>=0&&moves<GOLD_STEPS_PER_MONTH;i--){
  if(history[i].month!==s.month)break;
  moves++;
 }
 return Math.min(GOLD_STEPS_PER_MONTH,Math.max(turnStep,moves));
}
function syncGoldMarket(s,progress=goldProgress(s)){
 const quotes=s.marketQuotes??={};
 const q=quotes.gold??={price:100,previous:100,history:[{month:s.month,price:100}]};
 if(!q.goldSeries){
  const history=q.history.length?q.history:[{month:s.month,price:q.price}];
  const first=history[0];
  // A synthetic run-in, normalized to the first recorded price, with rallies and pullbacks.
  const opening=[95.8,96.4,96,97.1,98.1,97.7,98.8,98.3,99.5,100.1,99.2,98.4,
   98.9,99.6,100.8,101.1,100.5,99.7,100.1,101,100.6,99.8,99.4,99.7];
  q.goldSeries=opening.map((index,i)=>({
   step:first.month*GOLD_STEPS_PER_MONTH+i-opening.length,
   price:roundCash(first.price*index/100),opening:true
  })).concat(history.map(point=>({step:point.month*GOLD_STEPS_PER_MONTH,price:point.price}))).slice(-120);
  q.goldMonth=s.month;
  q.goldStep=0;
 }
 if(q.goldMonth!==s.month){q.goldMonth=s.month;q.goldStep=0}
 const economy=s.economy||0;
 const shock=s.worldShock?.monthsLeft>0?WORLD_SHOCKS[s.worldShock.index]:null;
 const inflation=s.annualInflation??.025;
 const realRate=(ECONOMIES[economy]?.rate??.055)-inflation;
 // A softer real-rate backdrop and recession demand can support gold, while individual moves still vary.
 const drift=(.03-realRate)*.035+(economy===3?.001:0)+(shock?.inflation||0)*.04;
 while(q.goldStep<progress){
  const step=s.month*GOLD_STEPS_PER_MONTH+(++q.goldStep);
  const noise=Math.sin(step*127.1+91.7)*43758.5453;
  const movement=drift+(noise-Math.floor(noise)-.5)*.018+Math.sin(step*.77)*.003;
  q.previous=q.price;
  q.price=Math.max(.01,roundCash(q.price*(1+movement)));
  q.goldSeries.push({step,price:q.price});
 }
 if(q.goldSeries.length>120)q.goldSeries=q.goldSeries.slice(-120);
 for(const asset of s.assets||[])if(asset.instrument==='gold')asset.value=roundCash(asset.shares*q.price);
 return q;
}

function quoteFor(id){
 if(id==='gold')return syncGoldMarket(state);
 const quote=state.marketQuotes?.[id];
 if(window.ETFMarket?.hasBenchmark(id)){
  const etf=quote?ETFMarket.addOpeningHistory(id,quote):ETFMarket.openingQuote(id,state.month)??defaultQuote();
  (state.marketQuotes??={})[id]=etf;
  return etf;
 }
 if(!Object.hasOwn(FUND_OPENING_PRICES,id))return quote??defaultQuote();
 const fund=addFundOpeningHistory(id,quote??defaultQuote());
 (state.marketQuotes??={})[id]=fund;
 return fund;
}
function advanceQuotes(change,month,inflation=state.annualInflation??.025){
 initQuotes();
 for(const [i,cfg] of V26_INSTRUMENTS.entries()){
  if(cfg.id==='gold'){
   const q=syncGoldMarket(state,GOLD_STEPS_PER_MONTH);
   if(q.history.at(-1)?.month!==month)q.history.push({month,price:q.price});
   continue;
  }
  const q=quoteFor(cfg.id);
  if(q.history.at(-1)?.month===month)continue;
  const cycle=Math.sin((month+1)*(i+2)*1.71)*.008;
  const regional=cfg.region==='intl'?-.22*change:cfg.region==='world'?-.08*change:0;
  let movement=(change+regional)*cfg.beta+cycle;
  if(cfg.kind==='ETF'&&window.ETFMarket){
   movement=ETFMarket.simulatedChange(q,change,inflation,cfg.beta,regional,cycle);
  }else if(cfg.kind==='基金'){
   const monthlyInflation=Math.pow(1+inflation,1/12)-1;
   if(cfg.region==='bond'){
    const marketYield=ECONOMIES[state.economy||0].rate+(inflation-.025)*.5;
    const previous=q.previousFundYield??((state.previousBondFundRate??ECONOMIES[0].rate)+((state.annualInflation??.025)-.025)*.5);
    // A diversified treasury fund has interest-rate duration, without a maturity payout.
    movement+=marketYield/12-4*(marketYield-previous);
    q.previousFundYield=marketYield;
   }else{
    movement=(1+movement)*(1+monthlyInflation)-1;
   }
  }
  const r=Math.max(-.25,Math.min(.25,movement));
  q.previous=q.price;
  q.price=Math.max(.01,roundCash(q.price*(1+r)));
  q.history.push({month,price:q.price});
  state.marketQuotes[cfg.id]=q;
 }
 for(const asset of state.assets)if(asset.instrument)asset.value=roundCash(asset.shares*quoteFor(asset.instrument).price);
}
const priceText=money;
const signedPercent=n=>(n>=0?'+':'')+(n*100).toFixed(2)+'%';
function quoteChart(q,periodLabel='个月点位'){const h=q.history.slice(-121),min=Math.min(...h.map(p=>p.price))*.98,max=Math.max(...h.map(p=>p.price))*1.02,points=h.map((p,i)=>(10+i*280/Math.max(1,h.length-1)).toFixed(2)+','+(115-(p.price-min)/(max-min)*100).toFixed(2)).join(' ');return '<svg class="wl-chart" viewBox="0 0 300 130" role="img" aria-label="游戏价格历史：'+h.length+periodLabel+'"><path d="M10 15H290M10 65H290M10 115H290" stroke="#8b9c9f" stroke-dasharray="4 5" fill="none"/><polyline points="'+points+'" fill="none" stroke="#26877f" stroke-width="3"/><circle cx="'+(h.length===1?10:290)+'" cy="'+(115-(h.at(-1).price-min)/(max-min)*100)+'" r="4" fill="#26877f"/></svg>'}
function returnPeriod(q,months){const last=q.history.at(-1),old=q.history.find(h=>h.month===last.month-months);return old?signedPercent(last.price/old.price-1):'记录不足'}
function openMarket(kind='ETF',back=finish,extraActions=[]){if(kind==='ETF'&&window.ETFPages)return ETFPages.showList(back===finish?undefined:back);if(kind==='股票'&&window.StockPages)return StockPages.open(back,extraActions);const instruments=V26_INSTRUMENTS.filter(i=>i.kind===kind);showEvent('投资',kind+'品种','选择品种，查看游戏内报价与交易详情。',[],[...extraActions,['返回',back,false]]);if(back!==finish)window.modalReturn=back;$('eventData').innerHTML='<div class="wl-mini-grid">'+instruments.map(i=>{const q=quoteFor(i.id);return '<button class="wl-choice-card" data-v26="market" data-key="'+i.id+'" aria-label="查看 '+i.name+'"><strong>'+i.name+'</strong><b>'+priceText(q.price)+'</b><small class="'+(q.price>=q.previous?'wl-up':'wl-down')+'">较上月 '+signedPercent(q.price/q.previous-1)+'</small><small>'+i.desc+'</small><span>查看购买详情 →</span></button>'}).join('')+'</div>'; $('eventData').style.display='block';if(kind==='基金')window.FundPages?.market(()=>openMarket(kind,back,extraActions))}

function openInstrument(id,back){const cfg=V26_INSTRUMENTS.find(i=>i.id===id);if(!cfg)return;if(cfg.kind==='ETF'&&window.ETFPages)return ETFPages.showDetail(cfg);const q=quoteFor(id),holdings=state.assets.filter(a=>a.instrument===id),cost=holdings.reduce((n,a)=>n+a.cost,0),value=holdings.reduce((n,a)=>n+a.value,0),pct=q.price/q.previous-1;
 const owner=state, month=state.month, price=q.price;
 const market=back??(()=>openMarket(cfg.kind));
 const reopen=()=>openInstrument(id,market);
 let bought=false;
 showEvent('投资预览',cfg.name,cfg.desc+(cfg.kind==='基金'?'':' 当前显示游戏月度价格；开局没有1/5/10年历史，不会编造收益。'),[],[['确认买入',()=>{
  const input=$('v26InvestAmount');
  if(bought||state!==owner||!input)return;
  const amount=input.valueAsNumber;
  if(!input.checkValidity()||!Number.isFinite(amount)||amount<=0||amount>state.cash)return;
  if(state.month!==month||quoteFor(id).price!==price)return reopen();
  if(cfg.kind!=='基金'||!window.StockPages){
   if(buyUnits(id,amount))finish();
   return;
  }
  const previous=structuredClone(state);
  if(!buyUnits(id,amount))return;
  try{
   if(save()===false)throw Error('save failed');
  }catch{
   state=previous;
   reopen();
   $('v26InvestAmount').value=amount;
   $('v26InvestAmount').dispatchEvent(new Event('input'));
   document.querySelector('[data-invest-preview]').textContent='买入未保存，请重试。';
   return;
  }
  bought=true;
  StockPages.showFundBuyReceipt(cfg,market,amount,price);
 },true,state.cash<=0],['返回品种列表',market,false],['取消',finish,false]]);
 if(back)window.modalReturn=market;
 $('eventData').innerHTML='<div class="wl-quote"><p>当前价格 <b>'+priceText(q.price)+'</b><span class="'+(pct>=0?'wl-up':'wl-down')+'"> 较上月 '+signedPercent(pct)+'</span></p>'+quoteChart(q)+'<div class="wl-periods"><span>1年<br>'+returnPeriod(q,12)+'</span><span>5年<br>'+returnPeriod(q,60)+'</span><span>10年<br>'+returnPeriod(q,120)+'</span></div><p>持仓市值 '+priceText(value)+' · 成本 '+priceText(cost)+'<br><span class="'+(value>=cost?'wl-up':'wl-down')+'">浮动盈亏 '+priceText(value-cost)+(cost?'（'+signedPercent(value/cost-1)+'）':'')+'</span></p><label>本次投入金额 <input id="v26InvestAmount" type="number" min="0.01" step="0.01" inputmode="decimal" value="'+Math.max(0,Math.min(200,state.cash))+'"></label><p data-invest-preview></p><small>支持碎股；本次确认后现金减少、资产增加。买入不代表未来保证上涨。</small></div>';$('eventData').style.display='block';function update(){const amt=Number($('v26InvestAmount').value),valid=Number.isFinite(amt)&&amt>0&&amt<=state.cash&&Math.abs(Math.round(amt*100)-amt*100)<.00001;$('actions').firstElementChild.disabled=!valid;document.querySelector('[data-invest-preview]').textContent=valid?'预计买入 '+(amt/q.price).toFixed(6)+' 份 · 剩余现金 '+priceText(roundCash(state.cash-amt)):'请输入可负担且最多两位小数的正金额'}$('v26InvestAmount').oninput=update;update();if(cfg.kind==='基金')window.FundPages?.decorate('buy',cfg)
}
buyInvestment=kind=>openMarket(kind);window.v241Invest=kind=>openMarket(kind);

const V26_OFFERS=[
 {id:'freelance',name:'周末资料整理',cost:60,reward:180,chance:.8,effects:{energy:-8},art:'assets/finance/scene-freelance.webp',desc:'社区档案室换了新柜子，还有几箱资料没归档。管理员在找人周末帮忙整理，按时交齐就结款。'},
 {id:'photo',name:'摄影接单设备',cost:900,cf:65,chance:.75,effects:{energy:-4},art:'assets/finance/scene-photo.webp',desc:'镇上的几家小店想定期更新商品照片。你可以先添置一套摄影设备，用样片争取长期合作。'},
 {id:'editing',name:'线上剪辑服务',cost:1400,cf:95,chance:.75,effects:{energy:-5},art:'assets/finance/scene-editing.webp',desc:'几家小店开始拍短片，却没人剪辑。你可以投入启动资金做样片，试着争取固定客户。'},
 {id:'stall',name:'周末社区摊位',cost:150,reward:300,chance:.7,effects:{energy:-6,social:3},art:'assets/finance/scene-stall.webp',desc:'社区集市临时空出一个摊位。管理员问你要不要来摆一天，摊位和原料要先付钱，收入看当天客流。'},
 {id:'rental',name:'二手器材出租',cost:800,cf:40,chance:.8,effects:{stress:2},art:'assets/finance/scene-rental.webp',desc:'镇上的活动团队偶尔需要借器材。你可以收一批二手设备，试着谈下固定出租合作。'},
 {id:'volunteer',name:'社区公益活动',cost:25,reward:0,chance:1,effects:{happiness:5,social:6,energy:-3},desc:'支付交通和物资费用，不产生金融回报。'}
];
function monthlyOffers(){if(state.monthlyOpportunities?.month===state.month)return state.monthlyOpportunities;state.offerSeed??=Math.floor(Math.random()*1000000);let x=(state.offerSeed+state.month*7919)>>>0;const rand=()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296},pool=[...V26_OFFERS];for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}state.monthlyOpportunities={month:state.month,ids:pool.slice(0,4).map(o=>o.id),resolved:null};save();return state.monthlyOpportunities}
function opportunityMarkup(){const offer=monthlyOffers();if(offer.resolved)return '<div class="wl-panel"><h3>本月已处理：'+offer.resolved+'</h3><p>每月最多选择一个机会。刷新与返回不会重置结果。</p><button data-v26="opportunityContinue" class="primary">继续月度确认 →</button></div>';return '<div class="wl-mini-grid wl-three">'+offer.ids.map(id=>{const o=V26_OFFERS.find(o=>o.id===id),blocked=typeof opportunityBlock==='function'?opportunityBlock(o):'';return '<button class="wl-choice-card" data-v26="opportunity" data-key="'+id+'" aria-label="确认机会 '+o.name+'" '+(state.cash<o.cost||blocked?'disabled':'')+'><strong>'+o.name+'</strong>'+(o.art?'<img class="town-opportunity-art" src="'+o.art+'" alt="">':'')+'<small>'+o.desc+'</small><b>投入 '+money(o.cost)+'</b><small>成功率 '+Math.round((typeof opportunityChance==='function'?opportunityChance(o):o.chance)*100)+'%<br>'+(o.cf?'成功后净收入 '+money(o.cf)+'/月':'成功后收入 '+money(o.reward))+'<br>失败可能损失 '+money(o.chance<1?o.cost-(o.recovery||0):0)+'<br>'+(o.hours?'自由时间 −'+o.hours+' 小时<br>':'')+effectText(o.effects)+(o.successEffects?'<br>成功后 '+effectText(o.successEffects):'')+(o.recovery?'<br>未成功时转卖回收 '+money(o.recovery):'')+(blocked?'<br>'+blocked:'')+'</small><span>确认选择 →</span></button>'}).join('')+'</div><button data-v26="opportunitySkip" class="wl-secondary">四个都不选，保留现金 →</button>'}
function showOpportunityCompletion(project, rows) {
 const note=project.cf?'持续收入从本月月末到账。':'';
 showEvent('机会结果',project.name,note,rows,[['继续',()=>completeMonthlyStep(8),true]]);
 const title=$('eventTitle'),card=title.closest('.event');
 card.dataset.opportunityCompletion='true';
 const image=document.createElement('img');
 image.className='opportunity-completion-art';
 image.src='assets/opportunity-results/'+project.id+'.webp';
 image.alt='';
 $('eventData').prepend(image);
 const status=document.createElement('span');
 status.className='opportunity-completion-badge';
 status.textContent='已完成';
 title.append(status);
 const icons={'本次投入':'money','已用自由时间':'clock','能量':'energy','实际一次性收入':'money','本次收入':'money','新增月净收入':'management','新增月收入':'management','当前被动收入':'money','成功后状态变化':'happiness'};
 for(const [index,tile] of [...$('eventData').querySelectorAll('.stat')].entries()){
  const glyph=document.createElement('span');
  glyph.className='opportunity-completion-icon';
  glyph.innerHTML=coffeeIcon(icons[rows[index][0]]||'trust');
  tile.prepend(glyph);
 }
}
function takeOpportunity(id){const offer=monthlyOffers(),o=V26_OFFERS.find(o=>o.id===id);if(offer.resolved||!offer.ids.includes(id)||!o)return;if(!spendConfirmed('opportunity',o.cost,{offer:id}))return;const success=Math.random()<o.chance;offer.resolved=o.name;offer.success=success;for(const[k,v]of Object.entries(o.effects))state[k]=Math.max(k==='stress'||k==='social'?0:0,Math.min(100,(state[k]||0)+v));if(success&&o.cf)state.assets.push({id:assetId(),name:o.name,kind:'business',cost:o.cost,value:o.cost,cf:o.cf});if(success&&o.reward){state.cash=roundCash(state.cash+o.reward);state.financeLedger.push({kind:'opportunityIncome',month:state.month,amount:o.reward,offer:id})}save();const rows=[['本次投入',money(o.cost)],['本次收入',money(success?(o.reward||0):0)],['新增月收入',money(success?(o.cf||0):0)]];if(success)showOpportunityCompletion(o,rows);else showEvent('机会结果','未成功：'+o.name,'前期投入已经支付，没有产生预期收入。',rows,[['继续',()=>completeMonthlyStep(8),true]])}
// Month-end events remain life/work incidents; monthly business choices are only the saved three offers.
monthlyEvent=function(){pending=true;if(maybeInsuredJobLoss())return;if(workplaceEvent())return;if(!state.worldShock&&maybeWorldShock())return;if(maybeDreamStory())return;if(Math.random()<.25&&maybePeopleStory())return;const pool=LIFE.filter(e=>eventEligible(e[0]));if(Math.random()<.3&&pool.length){const e=pool[Math.floor(Math.random()*pool.length)],cost=e[0]==='医疗自付额'&&state.healthInsurance?0:e[2];showEvent('生活事件',e[0],e[1]+' 本次需要处理并支付费用。',[['本次费用',money(cost)],['可用现金',money(state.cash)]],[['确认支付 '+money(cost),()=>{payRequiredIncident(e[0],cost)},true],['筹措费用',()=>openIncidentFunding(e[0],cost),false]]);return}finish()};

window.v26Choices=function(key,api){
 if(key==='learning'){
 const enrolled=!!state.study, practiced=(state.hobbyLearning?.receipts||[]).filter(r=>r.month===state.month&&r.kind==='hobby').map(r=>r.name).filter((name,i,all)=>all.indexOf(name)===i).join('、')||monthSelection('hobby');
 return api.option(enrolled?'查看当前学习计划':'学历学习',enrolled?EDU[state.study.target].name+' · '+(typeof EducationPlans!=='undefined'&&EducationPlans.modern(state.study)?(state.study.paused?'已暂停':'预计还需 '+EducationPlans.projection(state.study,state.study.pace)+'个月'):state.study.progress+'/'+state.study.total+'个月')+'，可同时发展兴趣。':'先预览学费，再确认投资自己。',()=>openEducation(),true)
 +api.option('练习兴趣技能',practiced?'本月已练习 '+practiced+'，仍可查看。':'与学历学习独立；按当前现金选择。',()=>$('hobbyBtn').click())
 +'<div class="wl-panel"><h3>'+((enrolled||practiced)?'完成本月自我投资':'本月暂不投资自己')+'</h3><p>'+ (enrolled?'学习计划已保留，学费不会重复扣除。':'未报名学历课程。')+(practiced?' 已完成兴趣练习：'+practiced+'。':' 可先练习兴趣，也可直接继续。')+'</p><button data-v26="learningContinue" class="primary">'+((enrolled||practiced)?'完成本月自我投资 →':'暂时跳过，继续 →')+'</button></div>';
 }
 if(key==='housing')return housingMarkup();
 if(key==='cost')return livingMarkup();
 if(key==='life')return lifeMarkup();
 if(key==='insurance')return insuranceMarkup();
 if(key==='opportunity')return opportunityMarkup();
 if(key==='review'){const m=calcMetrics(),cash=state.cash;return '<div class="wl-panel"><h3>本月收支确认</h3><table class="wl-review"><tr><th>当前现金</th><td>'+priceText(cash)+'</td></tr><tr><th>已付生活/住房/保费</th><td>'+priceText(m.prepaidExpenses)+'</td></tr><tr><th>月末收入（税后）</th><td>'+priceText(m.grossSalary-m.tax-m.kContrib+state.passive)+'</td></tr><tr><th>月末尚待支付</th><td>'+priceText(m.remainingExpenses)+'</td></tr><tr><th>预计结算后现金</th><td>'+priceText(roundCash(cash+m.remainingCF))+'</td></tr></table><p>工资、资产收入到账，仅补扣未付款项。投资市值变化不会直接变成现金；CD到期款另计。</p><button data-v26="settle" class="primary">确认结算，进入下个月 →</button></div>'}
};
window.v26Bind=()=>refreshInsurance();
document.addEventListener('change',e=>{if(e.target.matches('[data-insurance]'))refreshInsurance()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-v26]');if(!b||b.disabled)return;const kind=b.dataset.v26;if(['housing','living','insuranceConfirm','life','opportunity'].includes(kind))b.disabled=true;
 if(kind==='learningContinue')completeMonthlyStep(5);
 if(kind==='market')openInstrument(b.dataset.key);
 if(kind==='housing')confirmHousing(b.dataset.key);
 if(kind==='housingFund'){const total=Math.min(...housingOptions().map(h=>housingQuote(h).total));fundShortfall(total,openHousing)}
 if(kind==='living'){const due=roundCash(Math.max(0,livingTotal()-(paymentReceipt().living||0)));if(payMonthly('living',due))completeMonthlyStep(1)}
 if(kind==='livingFund'){const due=roundCash(Math.max(0,livingTotal()-(paymentReceipt().living||0)));fundShortfall(due,()=>{finish();startV24Turn(false)})}
 if(kind==='life')chooseLife(+b.dataset.i);
 if(kind==='lifeContinue')completeMonthlyStep(3);
 if(kind==='insuranceConfirm'){
  const box=b.closest('.wl-insurance');
  const {selected,due}=insuranceDraftTotal(box);
  if(selected.includes('pet'))return window.PetPages.openInsuranceSelection();
  const previous=structuredClone(state);
  if(!payMonthly('premiums',due)){refreshInsurance();return}
  for(const type of selected)if(!state.insurance[type]?.active)
   state.insurance[type]={name:INSURANCE[type][0],active:true,monthly:INSURANCE[type][1]};
  try{
   if(state.turn?.index===6&&$('game').classList.contains('v24-running'))state.turn.index=7;
   if(save()===false)throw Error('save failed');
  }catch(error){
   state=previous;
   refreshInsurance();
   box.querySelector('[data-insurance-warning]').textContent='保费和保单变更未保存，请重试。';
   return;
  }
  completeMonthlyStep(6,true);
 }
 if(kind==='insuranceSkip')completeMonthlyStep(6);
 if(kind==='opportunity')takeOpportunity(b.dataset.key);
 if(kind==='opportunitySkip'){const o=monthlyOffers();if(!o.resolved){o.resolved='未选择';save()}completeMonthlyStep(8)}
 if(kind==='opportunityContinue')completeMonthlyStep(8);
 if(kind==='settle')settleMonth();
});
$('lifestyleBtn').onclick=$('wellnessBtn').onclick=()=>{showEvent('生活','安排本月生活','',[],[['返回，不安排',finish,false]]);$('eventData').innerHTML=lifeMarkup();$('eventData').style.display='block'};
$('businessBtn').onclick=()=>{showEvent('机会','本月四个机会','',[],[['返回',finish,false]]);$('eventData').innerHTML=opportunityMarkup();$('eventData').style.display='block'};
function emergencyMonthlyExpenses(){
 const petCosts=(state.pets||[]).reduce((sum,pet)=>sum+petMonthlyFee(pet),0);
 return roundCash(livingBaseAmount(state)+(state.housingCost||0)+petCosts+
  (state.carRunningCost||0)+premiumsTotal()+loanBudgetTotal());
}

// Legacy direct-transfer buttons also require a preview before changing cash.
$('emergencyBtn').onclick=()=>{
 syncFinance();
 const amount=Math.max(0,Math.min(1000,state.cash));
 const monthly=emergencyMonthlyExpenses();
 const housingPending=!state.housing||state.housing==='unselected';
 const note='建议预留 3–6 个月的必要开支。遇到失业、收入中断或突发医疗费用时，这笔钱可以先用来付生活账单，减少临时借款或卖出投资的需要。'+
  (housingPending?'住房待选，参考金额暂未计入住房费。':'');
 const targets=monthly>0?[
  ['每月必要开支',money(monthly)],
  ['3–6 个月参考金额',money(monthly*3)+' 至 '+money(monthly*6)]
 ]:[];
 showEvent('应急金','划入应急金',note,[
  ...targets,['划入金额',money(amount)],['剩余现金',money(state.cash-amount)]
 ],[
  ['确认划入',()=>{
   if(!spendConfirmed('emergencyTransfer',amount))return;
   state.emergencyFund=(state.emergencyFund||0)+amount;
   finish();
  },true,amount<=0],
  ['取消',finish,false]
 ]);
};
const payDebtBase=payDebt;payDebt=function(name){const amount=Math.max(0,Math.min(1000,state.cash,state.debt[name]||0));showEvent('还款预览',name,'',[['还款金额',money(amount)],['剩余现金',money(state.cash-amount)],['剩余本金',money((state.debt[name]||0)-amount)]],[['确认还款',()=>{payDebtBase(name);finish()},true,amount<=0],['取消',finish,false]])};
const sellBase=sellAsset;
sellAsset=function(i,back=finish){
 const asset=state.assets[i];
 if(!asset)return;
 if(asset.kind==='cd')return previewCDWithdrawal(asset,back);
 const fund=V26_INSTRUMENTS.find(item=>item.kind==='基金'&&item.id===asset.instrument);
 const rental=asset.kind==='rental';
 const amount=rental?asset.value-asset.mortgage:asset.value??asset.cost;
 showEvent('出售预览',asset.instrument==='gold'?'卖出黄金':asset.name,
  rental?'确认后按当前游戏市值出售；投资房出售款先清偿对应房贷。':'确认后按当前游戏市值出售。',
  [...(rental?[['当前估值',priceText(asset.value)],['清偿房贷',priceText(asset.mortgage||0)]]:[]),
   [amount<0?'需补足现金':'预计到账',priceText(Math.abs(amount))]],[
   ['确认出售',()=>{
    if(state.assets[i]!==asset)return;
    sellBase(i,back);
    if($('eventTitle').textContent==='资产已出售')window.FundPages?.decorate('sold',fund,asset);
   },true,state.cash+amount<0],
   ['取消',back,false]
  ]);
 if(back!==finish)window.modalReturn=back;
 window.FundPages?.decorate('sell',fund,asset);
};
// Keep monetary previews explicit in retained modules without a second duplicate list.
const showFlowBase=showEvent;showEvent=function(type,title,desc,data=[],actions=[]){if((type==='HOBBY'&&title==='完成一次练习')||(type==='CAREER'&&title==='求职成功')){const practicedMonth=state.month,completedStep=type==='HOBBY'?5:2;actions=actions.map(a=>a[0]==='继续'?[a[0],()=>{if(type==='HOBBY')finish();else if(state.month===practicedMonth&&state.turn?.index===completedStep&&$('game').classList.contains('v24-running'))completeMonthlyStep(completedStep);else finish()},a[2],a[3]]:a)}if(type==='FAMILY'&&actions.some(a=>a[0]==='考虑孩子'))data=[...data,['新增育儿预算','$550.00/月，确认后从本月起生效']];if(type==='START')actions=[['开始住房安排',()=>{finish();startV24Turn(false)},true]];showFlowBase(type,title,desc,data,actions);const buttons=[...$('actions').children];buttons.forEach((b,i)=>{const label=actions[i]?.[0]||'',match=data.find(d=>label===d[0]||label==='练习 '+d[0]||label==='领养'+d[0]);if(match){b.classList.add('wl-choice-card');b.textContent='';const strong=document.createElement('strong');strong.textContent=label;const small=document.createElement('small');small.textContent=match[1];const confirm=document.createElement('span');confirm.textContent='确认选择 →';b.append(strong,small,confirm);b.setAttribute('aria-label',label)}});if(['HOBBY','PET','LIFESTYLE'].includes(type)&&buttons.some(b=>b.classList.contains('wl-choice-card')))$('eventData').innerHTML=''};
const renderFlowBase=render;render=function(){renderFlowBase();if(!state)return;const m=calcMetrics();$('net').textContent=money(m.monthlyCF);$('networkCount').textContent=state.people.length+' 人';$('peopleNetwork').replaceChildren();for(const p of state.people){const row=document.createElement('div');row.className='asset';const title=document.createElement('strong');title.textContent=p.name+' · '+(p.status||'认识的人');const detail=document.createElement('div');detail.className='sub';detail.textContent=p.age+'岁 · '+p.job+' · '+relationStage(p)+' '+Math.round(p.relation)+'/100 · '+p.life;row.append(title,detail);$('peopleNetwork').appendChild(row)}state.assets.forEach((a,i)=>{if(!a.instrument)return;const row=document.querySelector('[data-sell="'+i+'"]')?.closest('.asset.row');if(!row)return;const q=quoteFor(a.instrument),gain=roundCash(a.value-a.cost);row.firstElementChild.innerHTML='<b>'+a.name+'</b><br><small>买入 '+priceText(a.entryPrice)+' · 当前 '+priceText(q.price)+'<br>份额 '+a.shares.toFixed(6)+' · 成本 '+priceText(a.cost)+'</small>';const result=row.querySelector('.good');result.className=gain>=0?'wl-up':'wl-down';result.textContent='市值 '+priceText(a.value)+' · 浮盈亏 '+priceText(gain)+' ('+signedPercent(a.value/a.cost-1)+')';const detail=document.createElement('button');detail.textContent='查看走势';detail.onclick=()=>openInstrument(a.instrument);row.lastElementChild.appendChild(detail)})};
// Do not rewrite established later-game relationships when upgrading an older save.
const openFlowBase=openGame;openGame=function(){if(!state.paymentFlowVersion){state.paymentFlowVersion=26;if(state.housing&&state.housing!=='unselected'&&state.monthlyPayments?.month!==state.month){state.turn={month:state.month,index:0,startCash:state.turn?.startCash??state.cash};state.paymentUpgradeNotice=true}}if(state.month===0&&!state.schoolNetworkVersion){state.people=(state.people||[]).map((p,i)=>(p.partnerRole||p.businessPartner||state.romance?.name===p.name?p:{...p,origin:'school',status:i===2?'老师':'同学',job:i===2?'老师':'同学',age:i===2?Math.max(p.age||0,state.age+15):p.age}));state.schoolNetworkVersion=1}openFlowBase()};

const finishFlowBase=finish;finish=function(){finishFlowBase();if(!document.querySelector('.event-active')){$('eventData').innerHTML='';$('eventData').style.display='';}};

// Keep the CD purchase entry beside its balance in the wealth page.
const renderCDEntryBase=render;render=function(){renderCDEntryBase();const box=$('v22CDs');if(!state||!box)return;const b=document.createElement('button');b.id='buyCDFromWealth';b.className='primary';b.textContent='管理定期存款';b.onclick=openCD;box.appendChild(b)};

// One loss decision and at most one payment per monthly event, saved before its notice.
function maybeInsuredJobLoss(){
 if(!state.job||state.retired||state.unemployedMonths>0||state.month<1||state.jobLossCheckedMonth===state.month)return false;
 state.jobLossCheckedMonth=state.month;
 const probability=(state.economy===3?.055:.012)+(industryScore()<90?.018:0);
 if(Math.random()>=probability){save();return false}
 syncFinance();const salary=state.salary,months=2+Math.floor(Math.random()*3),insured=!!state.insurance.income?.active;
 const id='job-loss-'+state.month,amount=insured?roundCash(salary*.55):0;
 state.unemployedMonths=months;state.jobLossEvents??=[];state.incomeProtectionClaims??=[];
 if(!state.jobLossEvents.some(e=>e.id===id)){
  state.jobLossEvents.push({id,month:state.month,job:state.job,salary,months,insured,amount});
  if(amount>0&&!state.incomeProtectionClaims.some(c=>c.id===id)){
   state.cash=roundCash(state.cash+amount);state.incomeProtectionClaims.push({id,month:state.month,amount});
   state.financeLedger??=[];state.financeLedger.push({kind:'incomeProtectionClaim',id,month:state.month,amount});
  }
 }
 save();render();
 showEvent('失业事件','暂时失业',insured?'收入保障已按税前月薪55%一次性赔付到现金。这次失业不会再次理赔。':'本次发生时未投保收入保障，没有保险补助。之后投保不会补赔这次失业。',[
  ['停工时间',months+' 个月'],['期间工资','$0.00/月'],['一次性到账',priceText(amount)],['持续开支',priceText(state.expenses)+'/月']
 ],[['继续',finish,true]]);return true;
}
const k401ExplanationBase=open401Account;
open401Account=function(back){k401ExplanationBase(back);$('eventDesc').textContent='';appendRetirementReference('https://www.irs.gov/retirement-plans/401k-plans');const b=document.createElement('button');b.className='secondary';b.textContent='返回，不修改';b.onclick=finish;$('actions').appendChild(b)};
const iraExplanationBase=openIRAAccount;
openIRAAccount=function(back){iraExplanationBase(back);$('eventDesc').textContent='';appendRetirementReference('https://www.irs.gov/retirement-plans/individual-retirement-arrangements-iras')};
function appendRetirementReference(url){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='查看 IRS 官方说明（现实规则）';a.className='game-rule-tip';$('eventData').appendChild(a);$('eventData').style.display='block'}

// Education and hobbies are independent; never turn an empty wallet into an unexplained lock.
$('hobbyBtn').onclick=()=>{
 const hs=[['摄影',90],['电影创作',120],['烹饪',65],['音乐',80],['园艺',55],['语言学习',45]].sort((a,b)=>hobbyXP(b[0])-hobbyXP(a[0])),done=monthSelection('hobby');
 const data=hs.map(([name,cost])=>[name,'Lv.'+hobbyLevel(name)+' · '+(hobbyXP(name)%100)+'/100 XP · '+money(cost)+(state.cash<cost?' · 现金不足，还差 '+money(cost-state.cash):'')]);
 const acts=hs.map(([name,cost])=>['练习 '+name,()=>{
  if(monthSelection('hobby')||state.cash<cost)return;
  if(!spendConfirmed('hobbyPractice',cost,{hobby:name}))return;
  state.hobbyXP??={};state.hobbies??={};state.hobbyXP[name]=(state.hobbyXP[name]||0)+35;state.hobbies[name]=hobbyLevel(name);
  for(const k of ['happiness'])state[k]=Math.min(100,state[k]+4);state.energy=Math.min(100,state.energy+2);state.stress=Math.max(0,state.stress-4);
  setMonthSelection('hobby',name);safe50();save();
  showEvent('HOBBY','完成一次练习',name+' 获得 35 XP。学历课程继续保留。',[['等级','Lv.'+hobbyLevel(name)],['经验',(hobbyXP(name)%100)+'/100 XP']],[['继续',finish,true]]);
 },false,!!done||state.cash<cost]);
 acts.push(['返回学习安排',finish,true]);
 showEvent('HOBBY','发展兴趣','可用现金 '+money(state.cash)+'。'+(done?'本月已练习 '+done+'，下个月可继续。':'每月可练习一次，与学历课程独立。灰色选项表示现金不足，交学费不会自动替你选择兴趣。'),data,acts);
};

