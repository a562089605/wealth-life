// Local V27.8 batch: explicit choices and a single auditable cash/debt/investment state.
const batchEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loanTargets(){return [...(state.loans||[]).filter(l=>l.balance>0).map(l=>({key:l.id,name:loanDebtName(l),l,balance:l.balance,set:n=>l.balance=n})),...Object.entries(state.debtSchedules||{}).filter(([k])=>state.debt[k]>0).map(([k,l])=>({key:'legacy:'+k,name:k,l,balance:state.debt[k],set:n=>{state.debt[k]=n}}))]}
function loanDisplayName(key,fallback){
 const index=(state.loans||[]).findIndex(loan=>loan.id===key||loanDebtName(loan)===key);
 if(index>=0){
  const type=state.loans[index].type==='学生贷款'?'学生贷款':'银行贷款';
  return type+' '+(index+1);
 }
 return String(fallback||'贷款').replace(/ · (?:bank|loan)-[^ ]+$/,'');
}
function currentLoanCycle(){
 if(state.loanCycle?.month!==state.month)state.loanCycle={month:state.month,items:[]};
 const cycle=state.loanCycle;
 for(const t of loanTargets())if(!cycle.items.some(x=>x.key===t.key)){
 const interest=roundCash(t.balance*t.l.apr/12),due=roundCash(t.l.monthsLeft===1?t.balance+interest:Math.min(t.l.payment,t.balance+interest));
 cycle.items.push({key:t.key,name:t.name,openingBalance:t.balance,apr:t.l.apr,due,interest,principal:roundCash(Math.max(0,due-interest)),status:'unpaid'});
 }
 for(const row of cycle.items){
  if(row.status==='paid')continue;
  const t=loanTargets().find(t=>t.key===row.key);
  if(!t){row.status='paid';row.due=0;row.principal=0;row.interest=0;continue}
  if(t.balance<row.openingBalance){row.openingBalance=t.balance;row.interest=roundCash(t.balance*row.apr/12);row.due=roundCash(Math.min(t.l.payment,t.balance+row.interest));row.principal=roundCash(Math.max(0,row.due-row.interest));}
 }
 return cycle;
}

function loanBudgetTotal(){return roundCash(currentLoanCycle().items.reduce((n,x)=>n+x.due,0))}
function paidLoanTotal(){return roundCash((state.loanCycle?.month===state.month?state.loanCycle.items:[]).filter(x=>x.status==='paid').reduce((n,x)=>n+x.due,0))}
function unpaidLoanRows(){
 return currentLoanCycle().items.filter(row=>row.status!=='paid'&&row.due>0);
}
function bankLoanArt(name){
 return '<img class="wl-bank-art" src="./assets/bank-loans/'+name+'.webp" alt="">';
}
function showLoanReceipt(loan,goBack=window.openRoom||finish,backLabel='返回房屋'){
 const firstDue=currentLoanCycle().items.find(row=>row.key===loan.id)?.due||0;
 showEvent('银行','贷款已到账','本月首期在出门前支付。',[
  ['本次到账','+'+priceText(loan.principal)],['放款后现金',priceText(state.cash)],
  ['还款期限',loan.monthsLeft+'个月'],['固定年利率',(loan.apr*100).toFixed(2)+'%'],
  ['本月首期',priceText(firstDue)]
 ],[
  ['前往本月还款',()=>openLoanPayments(goBack,backLabel),true],
  [backLabel,goBack,false]
 ]);
 $('eventData').insertAdjacentHTML('afterbegin',bankLoanArt('receipt'));
 window.modalReturn=goBack;
 if($('eventTitle').textContent==='贷款已到账')window.ApprovedBankCards?.receipt();
}
function payLoanInstallment(key,after,backLabel){
 const row=currentLoanCycle().items.find(x=>x.key===key),t=loanTargets().find(x=>x.key===key);
 if(!row||!t||row.status==='paid'||state.cash<row.due)return;
 const previous=JSON.parse(JSON.stringify(state));
 if(!spendConfirmed('loanInstallment',row.due,{loan:row.name,loanId:key,principal:row.principal,interest:row.interest}))return;
 t.set(Math.max(0,roundCash(t.balance-row.principal)));t.l.monthsLeft=Math.max(0,t.l.monthsLeft-1);row.status='paid';
 try{if(save()===false)throw Error('save failed')}catch(error){state=previous;console.error('Loan payment save failed',error);openLoanPayments(after,backLabel);$('eventDesc').textContent='还款未能存档，请重试。';return}
 openLoanPayments(after,backLabel);
}
function openLoanPayments(after=window.openRoom||finish,backLabel='返回房屋'){
 if(typeof after!=='function')after=window.openRoom||finish;
 syncFinance();
 const rows=currentLoanCycle().items,targets=loanTargets(),unpaid=unpaidLoanRows();
 const remaining=roundCash(unpaid.reduce((sum,row)=>sum+row.due,0));
 const shortfall=roundCash(Math.max(0,remaining-state.cash));
 showEvent('本月还款','本月贷款还款',unpaid.length?'还有 '+unpaid.length+' 笔本月月供待付。出门前需逐笔付清。':'本月月供已全部结清。',[],[
  ...(shortfall>0?[['查看筹款方式',()=>showFundingOptions(remaining,()=>openLoanPayments(after,backLabel)),true]]:[]),
  [backLabel,after,!shortfall]
 ]);
 if(state.requiredIncident?.status==='unpaid')return;
 if(backLabel!=='返回房屋')window.modalReturn=after;
 const cards=rows.map(row=>{
  const loan=targets.find(target=>target.key===row.key)?.l||state.loans.find(loan=>loan.id===row.key);
  const title=loanDisplayName(row.key,row.name);
  const paid=row.status==='paid';
  const short=roundCash(Math.max(0,row.due-state.cash));
  const origin=Number.isInteger(loan?.originMonth)?'第 '+(Math.floor(loan.originMonth/12)+1)+' 年第 '+(loan.originMonth%12+1)+' 月借入':'';
  return '<div class="wl-panel wl-bank-card"><h3>'+batchEscape(title)+'</h3><p>'+
   (origin?origin+'<br>':'')+(loan?.principal!=null?'借款金额 '+priceText(loan.principal)+'<br>':'')+
   '固定年利率 '+(row.apr*100).toFixed(2)+'%<br>本月月供 '+priceText(row.due)+
   ' · 本金 '+priceText(row.principal)+' · 利息 '+priceText(row.interest)+'</p>'+
   '<button data-batch="payLoan"'+(paid?' class="wl-loan-paid"':'')+' data-key="'+batchEscape(row.key)+'" '+(paid||short?'disabled':'')+'>'+
   (paid?'本月已付 '+priceText(row.due):'支付本期 '+priceText(row.due))+'</button>'+
   (!paid&&short?'<small>现金不足，还差 '+priceText(short)+'</small>':'')+'</div>';
 }).join('');
 const scroller=$('eventData');
 scroller.innerHTML=bankLoanArt(shortfall?'shortfall':'repay')+'<p>可用现金 '+priceText(state.cash)+' · 本月待付 '+priceText(remaining)+'</p>'+
  (cards||'<p>暂无贷款还款记录。</p>');
 scroller.style.display='block';
 scroller.scrollTop=0;
 for(const button of scroller.querySelectorAll('[data-batch="payLoan"]')){
  button.onclick=event=>{event.stopPropagation();payLoanInstallment(button.dataset.key,after,backLabel)};
 }
 if($('eventTitle').textContent==='本月贷款还款')window.ApprovedBankCards?.repayment();

}
function settleMonthlyDebts(settlement){
 const rows=currentLoanCycle().items;settlement.loanPayments=rows.map(x=>({...x}));
 for(const row of rows){if(row.status==='paid')continue;
 const t=loanTargets().find(t=>t.key===row.key);if(!t)continue;
 // Scheduled unpaid payments were in the budget; restore them because cash wasn't paid.
 state.cash=roundCash(state.cash+row.due);settlement.netCF=roundCash(settlement.netCF+row.due);
 const penalty=latePaymentCharge(row,t.l),capitalized=roundCash(row.interest+penalty);
 t.set(roundCash(t.balance+capitalized));t.l.overdueMonths=(t.l.overdueMonths||0)+1;
 settlement.loanPayments.find(x=>x.key===row.key).status='overdue';
 settlement.loanPayments.find(x=>x.key===row.key).penalty=penalty;
 settlement.loanPayments.find(x=>x.key===row.key).capitalized=capitalized;
 state.financeLedger??=[];state.financeLedger.push({month:state.month,kind:'loanOverdue',loan:row.name,amount:0,capitalized,penalty});
 }
}
// Career cards combine requirements and action; browsing never resigns.
function openCareerMarket(offers=CAREERS,back=finish){syncFinance();showEvent('职业市场','工作机会','',[],[['返回',back,true]]);
 $('eventData').innerHTML='<div class="wl-careers">'+CAREERS.map((c,i)=>({c,i})).filter(({c})=>offers.includes(c)).sort((a,b)=>careerMissing(a.c).length-careerMissing(b.c).length||a.i-b.i).map(({c,i})=>{const missing=careerMissing(c);return '<div class="wl-panel"><h3>'+batchEscape(c.name)+'</h3><b>'+priceText(careerSalary(c))+'/年</b><p>'+batchEscape(c.edu==='associate'?'学历门槛：AA 或以上':EDU[c.edu].name)+' · 相关经验 '+c.minExp+' 年<br>'+batchEscape(missing.length?'尚缺：'+missing.join('；'):'资格符合，可申请')+'</p><button data-batch="applyCareer" data-i="'+i+'" '+(missing.length?'disabled':'')+'>确认申请 '+batchEscape(c.name)+'</button></div>'}).join('')+'</div>';$('eventData').style.display='block';
}
function applyCareer(i){if(window.CafeEquity?.requiresManagement(state))return;const c=CAREERS[i];if(!c||careerMissing(c).length)return;
 if(Math.random()>=careerSuccessChance(c)){showEvent('CAREER','这次没有录取','原工作保持不变。可以返回查看其他职位。',[],[['返回职业市场',openCareerMarket,true],['继续本月',finish,false]]);return}
 state.job=c.name;state.annualSalary=careerSalary(c);state.salary=roundCash(state.annualSalary/12);state.careerStartedAt=state.month;state.lastPromotionMonth=state.month;state.unemployedMonths=0;save();showEvent('CAREER','求职成功','已确认入职，工资从本月月末计入。',[['职位',c.name],['年薪',priceText(state.annualSalary)]],[['继续',()=>completeMonthlyStep(2),true]]);
}
$('jobMarketBtn').onclick=openCareerMarket;
function openWorkAdjustment(){showEvent('职业预览','调整工作','',[['当前工作',state.job||'未就业'],['税前年薪',priceText(state.annualSalary||0)]],[['查看其他工作机会',openCareerMarket,true],['确认辞职',()=>{state.job=null;state.salary=0;state.annualSalary=0;state.unemployedMonths=0;save();finish()},false,!state.job],['返回，不修改',finish,false]])}
// Expanded saved monthly opportunity pool. Outcomes are resolved and shown before month end.
V26_OFFERS.push(
 {id:'laundry-equipment',name:'社区洗衣设备出租',cost:3200,cf:80,recovery:2300,chance:.85,hours:4,effects:{energy:-4},art:'assets/finance/big-laundry-equipment.webp',desc:'镇上的洗衣店想增设设备。你负责购买并安装，店方承担运营、水电和日常维护。'},
 {id:'station-lockers',name:'车站储物柜',cost:5000,cf:125,recovery:3600,chance:.8,hours:5,effects:{energy:-4},art:'assets/finance/big-station-lockers.webp',desc:'小镇车站想增设行李柜。你负责购置和安装，车站管理柜位并按月付租金。'},
 {id:'community-solar',name:'社区屋顶太阳能',cost:8000,cf:70,recovery:7650,chance:.8,hours:6,effects:{energy:-4},art:'assets/finance/big-community-solar.webp',fallbackLabel:'取消安装退回',fallbackNote:'场地方未签约，取消安装并退回预算，只扣勘察费。',desc:'社区中心想用屋顶发电。你出资参与设备安装，场地方按合同购电，月净收入已扣维护费。'},
 {id:'book-clearance',name:'旧书店库存收购',cost:3600,reward:4500,recovery:3000,chance:.75,hours:6,effects:{energy:-6},art:'assets/finance/big-book-clearance.webp',fallbackLabel:'清仓转卖到账',desc:'旧书店搬迁，店主想一次出清库存。你可以整批收购，再转卖给二手书商。'},
 {id:'subscription-takeover',name:'收购小型订阅公司',cost:4000,cf:200,recovery:3500,chance:.5,hours:6,effects:{energy:-10,stress:8},art:'assets/finance/big-subscription-takeover.webp',fallbackLabel:'交接失败退回',fallbackNote:'客户转签未达成，收购款退回，只扣审核费。',desc:'镇上的店铺每月付费刊登消息。原团队继续运营，客户同意转签后才完成收购。'},
 {id:'weekend-coffee',name:'周末咖啡摊',cost:120,reward:300,recovery:70,chance:.75,hours:4,effects:{energy:-6},art:'assets/finance/weekend-coffee-stall.webp',fallbackLabel:'客流冷清到账',fallbackNote:'客流比预期少，卖出的咖啡仍有营业收入。',desc:'周末集市空出一个摊位。你可以付摊位费、买咖啡豆和纸杯，备好几壶手冲等客人上门。'},
 {id:'pet-photos',name:'周末宠物摄影',cost:90,reward:240,recovery:50,chance:.8,hours:3,effects:{energy:-4},art:'assets/finance/weekend-pet-photos.webp',fallbackLabel:'客户取消保留定金',fallbackNote:'客户临时取消，你保留预约定金，已付的租用和准备费用照扣。',desc:'一位镇民约你给自家柯基拍照。你先预订场地、租设备和准备道具，顺利交付后收齐定金与尾款。'},
 {id:'bakery-bulk',name:'面包店团购',cost:35,reward:125,chance:.85,hours:2,effects:{energy:-3},art:'assets/finance/bakery-group-buy.webp',desc:'镇上的面包店请你统计邻居的团购订单。凑够数量后，面包店统一烘焙并支付组织费。'},
 {id:'tutor',name:'周末辅导项目',cost:80,reward:260,chance:.8,hours:3,art:'assets/finance/weekend-tutor.webp',effects:{energy:-5},desc:'支付教材和交通费，成功接到辅导项目后获得一次性报酬。'},
 {id:'repair',name:'社区维修摊位',cost:200,reward:480,chance:.7,art:'assets/finance/opportunity-repair.webp',hours:4,effects:{energy:-8},desc:'购置工具和材料，在周末集市接维修订单。'},
 {id:'craft',name:'手工小店',cost:450,cf:24,chance:.7,art:'assets/finance/opportunity-craft.webp',hours:5,recovery:250,effects:{energy:-5},successEffects:{happiness:3},desc:'出资购买缝纫机并试机。签约后由店主负责制作、销售和日常保养，从当月月底起按月支付租金。'},
 {id:'market-research',name:'付费用户访谈',cost:20,reward:90,chance:.9,hours:1,art:'assets/finance/paid-user-interview.webp',effects:{energy:-3},desc:'支付交通费，符合访谈条件才会得到报酬。'},
 {id:'garden',name:'社区园艺服务',cost:180,cf:12,chance:.8,art:'assets/finance/opportunity-garden.webp',hours:3,recovery:100,effects:{health:2,energy:-6},desc:'购置并布置共享工具。园艺小组负责日常养护，签约后按月支付工具租金。'},
 {id:'resale',name:'二手商品整理',cost:300,reward:430,chance:.65,art:'assets/finance/opportunity-resale.webp',hours:3,recovery:180,effects:{energy:-4},desc:'收购并整备旧物，在跳蚤市场出售。滞销时打包转卖给二手店。'},
 {id:'design',name:'小店海报接单',cost:75,reward:210,chance:.75,art:'assets/finance/opportunity-design.webp',hours:3,effects:{energy:-5,happiness:2},desc:'支付素材授权和打样费，为镇上的面包店设计海报，验收通过后付款。'},
 {id:'sound',name:'活动音响出租',cost:1600,cf:60,chance:.7,art:'assets/finance/opportunity-sound.webp',hours:4,recovery:1000,effects:{energy:-5,stress:3},desc:'购置音响、联系场地并试音。签约后，场地方负责搬运、调试和日常维护。'}
);
function opportunityChance(o){const hobby=({photo:'摄影',rental:'摄影',editing:'电影创作',garden:'园艺',stall:'烹饪',tutor:'语言学习'})[o.id];return o.chance===1?1:Math.max(.05,Math.min(.95,o.chance+(hobby?Math.min(.15,hobbyLevel(hobby)*.02):0)-Math.max(0,(state.stress||0)-85)*.002))}
function opportunityBlock(project){
 if(!project.hours)return '';
 if(currentCareerTime().free<project.hours)return '自由时间不足';
 if(state.energy<-(project.effects.energy||0))return '能量不足';
 return '';
}
const takeFastOpportunity=takeOpportunity;
takeOpportunity=function(id,back){
 const offer=monthlyOffers();
 if(offer.pool==='fast')return takeFastOpportunity(id,back);
 const project=V26_OFFERS.find(item=>item.id===id);
 if(!project||offer.resolved||!offer.ids.includes(id)||opportunityBlock(project)||state.cash<project.cost)return;
 const mapPurchase=typeof townOpportunityMove==='function'&&townOpportunityMove()?.offers===offer;
 const chance=opportunityChance(project),success=Math.random()<chance;
 const result=CareerLearningRules.atomic(state,()=>{
  if(!spendConfirmed('opportunity',project.cost,{offer:id}))return false;
  Object.assign(offer,{resolved:project.name,success,cost:project.cost,income:success?(project.reward||0):(project.recovery||0),newMonthlyIncome:success?(project.cf||0):0,chance});
  for(const [key,value] of Object.entries({...project.effects,...(success?project.successEffects:{})}))state[key]=Math.max(0,Math.min(100,(state[key]||0)+value));
  if(project.hours){
   const used=state.opportunityTime;
   state.opportunityTime={month:state.month,hours:(used?.month===state.month?used.hours:0)+project.hours};
  }
  if(success&&project.cf){
   const asset={id:assetId(),name:project.name,kind:'business',cost:project.cost,value:project.cost,cf:project.cf};
   if(mapPurchase)townBusinessAssets().push({...asset,offerId:project.id});
   else state.assets.push(asset);
  }
  if(offer.income){
   state.cash=roundCash(state.cash+offer.income);
   state.financeLedger.push({kind:'opportunityIncome',month:state.month,amount:offer.income,offer:id,...(!success?{recovery:true}:{})});
  }
  return {};
 },save);
 if(!result.ok){
  if(typeof townOpportunityMove==='function'&&townOpportunityMove())return openTownOpportunity(result.reason);
  showEvent('机会结果','机会未保存',result.reason,[],[['返回',finish,true]]);
  return;
 }
 const rows=[['本次投入',priceText(project.cost)],[!success&&project.recovery?(project.fallbackLabel||'转卖回收'):'实际一次性收入',priceText(offer.income)],['新增月净收入',priceText(offer.newMonthlyIncome)+'/月'],[mapPurchase?'地图预计月净收入':'当前被动收入',priceText(mapPurchase?journeyMapPassiveIncome():state.passive)+'/月']];
 if(!success&&project.recovery)rows.push(['本次净损失',priceText(project.cost-offer.income)]);
 if(success&&project.successEffects)rows.push(['成功后状态变化',effectText(project.successEffects)]);
 if(project.hours)rows.splice(1,0,['已用自由时间',project.hours+' 小时'],['能量',String(project.effects.energy)]);
 if(success)showOpportunityCompletion(project,rows);
 else showEvent('机会结果','未成功：'+project.name,project.recovery?(project.fallbackNote||'项目未达成，转卖回收款已到账。'):'本次投入已支付，没有产生预期收入。',rows,[['继续',()=>completeMonthlyStep(8),true]]);
};
// ETF monthly distributions are removed from quotes before cash/reinvestment: no free double return.
const ETF_YIELDS={us500:.018,ustotal:.02,international:.03,world:.024};
function ensureInvestSettings(){state.autoInvest??={};state.dividendReinvest??=true;}
function buyUnits(id,amount,kind='investmentBuy'){const cfg=V26_INSTRUMENTS.find(x=>x.id===id),q=quoteFor(id);if(!cfg||!Number.isFinite(amount)||amount<=0||amount>state.cash)return false;amount=roundCash(amount);if(amount<=0||!spendConfirmed(kind,amount,{instrument:id,price:q.price}))return false;initQuotes();state.assets.push({id:assetId(),name:cfg.name,kind:'market',category:cfg.kind,instrument:id,cost:amount,value:amount,shares:amount/q.price,entryPrice:q.price,entryMonth:state.month,cf:0});return true}
function openInvestSettings(id,after=finish){ensureInvestSettings();const cfg=V26_INSTRUMENTS.find(x=>x.id===id);if(!cfg||cfg.kind!=='ETF')return;
 showEvent('ETF 设置',cfg.name+' · 每月自动购买','',[],[['确认保存设置',()=>{const amount=Number($('batchAutoAmount').value);if(!Number.isFinite(amount)||amount<0||Math.abs(roundCash(amount)-amount)>.00001)return;const previous=structuredClone(state);state.autoInvest[id]={amount};state.dividendReinvest=$('batchDrip').checked;try{if(save()===false)throw Error('save failed')}catch(error){state=previous;openInvestSettings(id,after);$('eventDesc').textContent='设置未保存，请重试。';return}after()},true],['返回详情',after,false]]);
 $('eventData').innerHTML='<label>每月购买金额（0 为停止）<input id="batchAutoAmount" type="number" inputmode="decimal" min="0" step="0.01" value="'+(state.autoInvest[id]?.amount||0)+'"></label><label class="wl-check"><input id="batchDrip" type="checkbox" '+(state.dividendReinvest?'checked':'')+'>所有 ETF 分红自动再投资（取消则留在现金）</label>';$('eventData').style.display='block';
}
const instrumentBeforeBatch=openInstrument;openInstrument=function(id,back){instrumentBeforeBatch(id,back);const cfg=V26_INSTRUMENTS.find(x=>x.id===id);if(cfg?.kind==='ETF'&&!window.ETFPages){const b=document.createElement('button');b.textContent='每月自动购买 / 分红设置';b.onclick=()=>openInvestSettings(id);$('actions').append(b);const note=document.createElement('p');const dividends=(state.financeLedger||[]).filter(x=>x.kind==='dividend'&&x.instrument===id).reduce((n,x)=>n+x.amount,0),reinvested=(state.financeLedger||[]).filter(x=>x.kind==='dividendReinvest'&&x.instrument===id).reduce((n,x)=>n+x.amount,0);note.textContent='年分配率 '+(ETF_YIELDS[id]*100).toFixed(1)+'%，按月分红；价格已含除息变化。累计分红 '+priceText(dividends)+'，其中再投资 '+priceText(reinvested)+'。分红与浮动盈亏分开展示，不重复合计。';$('eventData').append(note)}};
const BOND_TERMS=[6,12,36,60];
function bondPrice(bond,months,annualYield){
 if(months<=0)return bond.face;
 const rate=annualYield/12,coupon=bond.face*bond.coupon/12;
 if(!rate)return roundCash(bond.face+coupon*months);
 const discount=Math.pow(1+rate,-months);
 return roundCash(coupon*(1-discount)/rate+bond.face*discount);
}
function quoteBond(months){
 const face=1000;
 const coupon=ECONOMIES[0].rate+Math.max(0,months/12-1)*.002;
 return {face,coupon,price:bondPrice({face,coupon},months,bondYield(months))};
}
function showBondPage(type,title,description,rows,actions,back){
 showEvent(type,title,description,rows,actions);
 if($('eventTitle').textContent!==title)return;
 const art=document.createElement('div');
 art.className='bond-art';
 if(type==='债券买入成功')art.classList.add('bond-art-purchased');
 art.setAttribute('aria-hidden','true');
 $('eventData').prepend(art);
 $('eventData').style.display='';
 window.modalReturn=back;
}
function bondCouponCash(bond){
 return roundCash(bond.face*bond.coupon/12);
}
function bondMaturityText(bond){
 const month=bond.maturesAt-1;
 return '第 '+(Math.floor(month/12)+1)+' 年第 '+(month%12+1)+' 月末';
}
function openBonds(back=finish){
 const quotes=BOND_TERMS.map(months=>({months,...quoteBond(months)}));
 const actions=quotes.map(({months,price,coupon})=>[
  months+' 个月 · '+priceText(price)+' · 年票息 '+(coupon*100).toFixed(2)+'%',
  ()=>previewBond(months,back),false
 ]);
 actions.push(['我的债券',()=>showMyBonds(back),true],['返回储蓄与投资',back,false]);
 const title='政府债券';
 const description='买入锁定票息，到期还本。提前出售按市值。以下为本月报价。';
 showBondPage('债券市场',title,description,[],actions,back);
 if($('eventTitle').textContent!==title)return;
 const actionBox=$('actions');
 const buttons=[...actionBox.querySelectorAll('button')];
 if(buttons.length!==actions.length)return;
 const picture=document.createElement('img');
 picture.width=1024;
 picture.height=1536;
 picture.alt=title+'。'+description;
 picture.onload=()=>{
  if(buttons.some(button=>button.parentElement!==actionBox))return;
  const market=document.createElement('div');
  market.className='bond-market-art';
  market.append(picture);
  buttons.forEach((button,index)=>{
   const quote=quotes[index];
   if(quote){
    const term=document.createElement('strong');
    term.textContent=quote.months+' 个月';
    const values=document.createElement('span');
    const price=document.createElement('b');
    price.textContent='买入价 '+priceText(quote.price);
    const coupon=document.createElement('small');
    coupon.textContent='年票息 '+(quote.coupon*100).toFixed(2)+'%';
    values.append(price,coupon);
    button.replaceChildren(term,values);
   }else button.textContent=actions[index][0];
   button.setAttribute('aria-label',actions[index][0]);
   button.className=quote?'bond-market-quote':'bond-market-nav';
   market.append(button);
  });
  $('eventData').replaceChildren(market);
  $('eventData').style.display='block';
 };
 picture.src='assets/finance/bond-market-scene.webp';
}
function showMyBonds(back){
 const market=()=>openBonds(back);
 const holdings=state.assets.filter(asset=>asset.kind==='bond').sort((a,b)=>a.maturesAt-b.maturesAt);
 const principal=holdings.reduce((total,bond)=>total+bond.face,0);
 const coupon=holdings.reduce((total,bond)=>total+bondCouponCash(bond),0);
 const actions=holdings.map(bond=>[
  bond.name+' · '+priceText(bond.face),
  ()=>showBondHolding(bond,back),false,false
 ]);
 actions.push(['返回债券市场',market,true]);
 showBondPage('债券持仓','我的债券',holdings.length?'按到期时间排列。':'暂无政府债券持仓。',[
  ['持有本金',priceText(principal)],['预计每月票息',priceText(coupon)]
 ],actions,market);
 if($('eventTitle').textContent!=='我的债券')return;
 globalThis.showRedrawnEventArt?.('我的债券','bond');
 const buttons=[...$('actions').children];
 holdings.forEach((bond,index)=>{
  const note=document.createElement('small');
  note.textContent='年票息 '+(bond.coupon*100).toFixed(2)+'% · '+bondMaturityText(bond)+'到期';
  buttons[index].append(note);
 });
}
function previewBond(months,back=finish){
 const {coupon,face,price}=quoteBond(months),owner=state,quoteMonth=state.month;
 const reopen=()=>previewBond(months,back),market=()=>openBonds(back);
 let purchased=false;
 showBondPage('债券预览',months+'个月政府债券','固定年票息，按月支付；以下为本月价格与利率。',[
  ['买入价格',priceText(price)],['债券面值',priceText(face)],['年票息率',(coupon*100).toFixed(2)+'%'],
  ['每月票息',priceText(face*coupon/12)],['到期期数',months+' 次月末']
 ],[['确认买入债券 '+priceText(price),()=>{
  if(purchased||state!==owner)return;
  if(state.month!==quoteMonth||quoteBond(months).price!==price){reopen();return;}
  const cash=state.cash,ledger=state.financeLedger,ledgerLength=ledger?.length,nextAssetId=state.nextAssetId;
  if(!spendConfirmed('bondBuy',price,{months,coupon}))return;
  const bond={id:assetId(),name:months+'个月政府债券',kind:'bond',face,cost:price,
   value:price,coupon,cf:0,maturesAt:state.month+months,entryMonth:state.month};
  state.assets.push(bond);
  try{
   if(save()===false)throw Error('save failed');
  }catch{
   state.assets.pop();
   state.cash=cash;
   if(nextAssetId===undefined)delete state.nextAssetId;
   else state.nextAssetId=nextAssetId;
   if(ledger)ledger.length=ledgerLength;
   else delete state.financeLedger;
   reopen();
   $('eventDesc').textContent='买入未保存，请重试。';
   return;
  }
  purchased=true;
  showBondHolding(bond,back,true);
 },true,state.cash<price],['返回债券市场',market,false]],market);
}
function showBondHolding(bond,back,purchased=false){
 const market=()=>openBonds(back),holdings=()=>showMyBonds(back);
 const monthly=bondCouponCash(bond);
 const rows=[
  ['买入金额',priceText(bond.cost)],['债券面值',priceText(bond.face)],
  ['锁定年票息',(bond.coupon*100).toFixed(2)+'%'],['每月票息',priceText(monthly)]
 ];
 const actions=[];
 if(purchased){
  rows.push(['剩余期限',Math.max(0,bond.maturesAt-state.month)+' 个月'],['买入后现金',priceText(state.cash)]);
  actions.push(['查看我的债券',holdings,true],['返回债券市场',market,false]);
 }else{
  const term=bond.maturesAt-bond.entryMonth;
  rows.push(['到期时间',bondMaturityText(bond)],
   ['到期当月到账',priceText(bond.face+monthly)+'<small>本金＋最后一期票息</small>']);
  if(Number.isFinite(term)&&term>0)rows.push(['持有到期合计',
   priceText(roundCash(bond.face+monthly*term))+'<small>本金＋全期票息</small>']);
  actions.push(['返回我的债券',holdings,true]);
 }
 showBondPage(purchased?'债券买入成功':'债券持仓',bond.name+' · 持有中',
  purchased?'买入成功。每月月末付息，到期返还本金。':'每月月末付息，到期返还本金。',rows,actions,purchased?market:holdings);
}
function etfDistributionPerShare(id,price=quoteFor(id).price){
 return roundCash(price*ETF_YIELDS[id]/12);
}
function expectedETFDistributions(){
 return Object.keys(ETF_YIELDS).map(id=>{
  const shares=(state.assets||[]).filter(a=>a.instrument===id).reduce((sum,a)=>sum+a.shares,0);
  return [id,roundCash(shares*etfDistributionPerShare(id))];
 }).filter(([,amount])=>amount>0);
}
function expectedInvestmentIncome(){
 let total=expectedETFDistributions().reduce((sum,[,amount])=>sum+amount,0);
 for(const a of state.assets||[])if(a.kind==='bond')total+=bondCouponCash(a);
 return roundCash(total);
}
function activeAutoInvestPlans(){
 return Object.entries(state.autoInvest||{}).filter(([id,plan])=>
  Object.hasOwn(ETF_YIELDS,id)&&Number.isFinite(plan?.amount)&&roundCash(plan.amount)>0);
}
function settleInvestingBatch(settlement,month,inflation=state.annualInflation??.025){ensureInvestSettings();
 const budget=settlement.investmentIncomeBudget||0;
 if(budget){state.cash=roundCash(state.cash-budget);settlement.netCF=roundCash(settlement.netCF-budget);settlement.passive=roundCash(settlement.passive-budget)}
settlement.dividends=0;settlement.dividendReinvested=0;settlement.autoPurchases=[];settlement.bondInterest=0;settlement.bondPrincipal=0;
 for(const id of Object.keys(ETF_YIELDS)){
  const quote=quoteFor(id);
  const perShare=etfDistributionPerShare(id,quote.price);
  quote.price=Math.max(.01,roundCash(quote.price-perShare));
  if(quote.history.at(-1)?.month===month)quote.history.at(-1).price=quote.price;

  const held=state.assets.filter(a=>a.instrument===id);
  const shares=held.reduce((sum,asset)=>sum+asset.shares,0);
  if(!shares)continue;
  const total=roundCash(shares*perShare);
  for(const asset of held)asset.value=roundCash(asset.shares*quote.price);
  state.cash=roundCash(state.cash+total);
  settlement.dividends=roundCash(settlement.dividends+total);
  state.financeLedger.push({kind:'dividend',month:month-1,amount:total,instrument:id});
  if(state.dividendReinvest&&total>0&&buyUnits(id,total,'dividendReinvest')){
   settlement.dividendReinvested=roundCash(settlement.dividendReinvested+total);
  }
 }
 state.assets=state.assets.filter(a=>{if(a.kind!=='bond')return true;const interest=bondCouponCash(a);state.cash=roundCash(state.cash+interest);settlement.bondInterest=roundCash(settlement.bondInterest+interest);state.financeLedger.push({kind:'bondInterest',month:month-1,amount:interest,assetId:a.id});if(month>=a.maturesAt){state.cash=roundCash(state.cash+a.face);settlement.bondPrincipal=roundCash(settlement.bondPrincipal+a.face);state.financeLedger.push({kind:'bondMaturity',month:month-1,amount:a.face,assetId:a.id});return false}const n=a.maturesAt-month;a.value=bondPrice(a,n,bondYield(n,inflation));return true});
 for(const [id,plan] of activeAutoInvestPlans()){const ok=buyUnits(id,plan.amount,'autoInvest');settlement.autoPurchases.push({instrument:id,amount:plan.amount,status:ok?'purchased':'skippedInsufficientCash'});}
}
function completeCashAudit(s){
 const ledger=(state.financeLedger||[]).filter(x=>x.month===s.month-1);s.ledger=ledger.map(x=>({...x}));
 s.monthOpeningCash=state.turn?.month===s.month-1?state.turn.startCash:s.startCash;
 s.monthCashChange=roundCash(state.cash-s.monthOpeningCash);
 s.beforeSettlementChange=roundCash(s.startCash-s.monthOpeningCash);
 s.settlementCashChange=roundCash(state.cash-s.startCash);
 s.totalMonthlyCF=roundCash(s.totalMonthlyCF-(s.investmentIncomeBudget||0)+s.dividends+s.bondInterest);
}
const cashAuditOut=['dreamSavingsDeposit','sharedInterestExpense','apartmentExpense','studioExpense','sharedExpense','familyExpense','ownerHomeDownpayment','housingDeposit','housingPayment','livingPayment','premiumsPayment','loanInstallment','hobbyPractice','specialistPractice','lifestyle','opportunity','tuitionPayment','investmentBuy','bondBuy','autoInvest','dividendReinvest','movingCost','emergencyTransfer','lifeIncident','socialMeal','socialCoffee','extraPrincipal','cdPurchase','vehicleDownpayment','propertyDownpayment','propertyCashPurchase','iraTransfer','cafeEquityDeposit'];
const cashAuditIn=['dreamSavingsWithdrawal','sharedInterestIncome','apartmentIncome','studioIncome','sharedIncome','familyIncome','housingDepositRefund','emergencyWithdrawal','retirementWithdrawal','incomeProtectionClaim','loanDisbursement','opportunityIncome','tuitionReversal','dividend','bondInterest','bondMaturity','cdEarlyPrincipal','cdEarlyInterest','socialIncome','assetSale','ownerHomeSale','cafeDividend','cafeEquitySale','cafeEquityRefund'];
function auditRows(s){const list=s.ledger||[],sum=k=>roundCash(list.filter(x=>x.kind===k).reduce((n,x)=>n+(x.amount||0),0));
 const mapRows=list.filter(x=>x.offer&&x.title&&(x.kind==='opportunity'||x.kind==='opportunityIncome'));
 const mapIn=mapRows.filter(x=>x.kind==='opportunityIncome').reduce((total,x)=>total+x.amount,0);
 const mapOut=mapRows.filter(x=>x.kind==='opportunity').reduce((total,x)=>total+x.amount,0);
 const loanPaid=(s.loanPayments||[]).filter(x=>x.status==='paid').reduce((n,x)=>n+x.due,0);
 const out=roundCash(cashAuditOut.reduce((n,k)=>n+sum(k),0)),inc=roundCash(cashAuditIn.reduce((n,k)=>n+sum(k),0));
 // Purchases retained from older modules may have no ledger; show an explicit reconciliation item.
 const settlementBase=roundCash(s.grossSalary-s.tax-s.kContrib+s.passive-(s.expenses-s.prepaidExpenses)+(s.loanPayments||[]).filter(x=>x.status==='overdue').reduce((n,x)=>n+x.due,0)+(s.cdPayout||0));
 const tracked=roundCash(inc-out+settlementBase),unclassified=roundCash(s.monthCashChange-tracked);
 return [['月初现金',s.monthOpeningCash],['现金转入住房押金 −',sum('housingDeposit')],['自住房首付 −',sum('ownerHomeDownpayment')],['自住房出售净额 +',sum('ownerHomeSale')],['退回住房押金 +',sum('housingDepositRefund')],['税前工资 +',s.grossSalary-(s.schoolAnnualBonus||0)],...(s.schoolAnnualBonus?[['年度绩效奖 +',s.schoolAnnualBonus]]:[]),['工资税 −',s.tax],['401(k)个人缴费 −',s.kContrib],['资产净收入 +',s.passive],['梦想专款存入 −',sum('dreamSavingsDeposit')],['梦想专款转回 +',sum('dreamSavingsWithdrawal')],['应急金转回现金 +',sum('emergencyWithdrawal')],['退休账户提款 +',sum('retirementWithdrawal')],['收入保障赔款 +',sum('incomeProtectionClaim')],['贷款到账 +',sum('loanDisbursement')],['本月已付住房/基本生活/保险 −',sum('housingPayment')+sum('livingPayment')+sum('premiumsPayment')],['共同兴趣事件收入 +',sum('sharedInterestIncome')],['共同兴趣事件支出 −',sum('sharedInterestExpense')],['兴趣练习 −',sum('hobbyPractice')],['专项技能练习 −',sum('specialistPractice')],['生活安排 −',sum('lifestyle')],['关系互动 −',sum('socialMeal')+sum('socialCoffee')],['机会投入 −',roundCash(sum('opportunity')-mapOut)],['机会一次性收入 +',roundCash(sum('opportunityIncome')-mapIn)],...mapRows.map(x=>[x.title+(x.kind==='opportunity'?' · 地图支出 −':' · 地图到账 +'),x.amount]),['家庭事件收入 +',sum('familyIncome')],['家庭事件支出 −',sum('familyExpense')],['合租事件收入 +',sum('sharedIncome')],['合租事件支出 −',sum('sharedExpense')],['独居事件收入 +',sum('studioIncome')],['独居事件支出 −',sum('studioExpense')],['小公寓事件收入 +',sum('apartmentIncome')],['小公寓事件支出 −',sum('apartmentExpense')],['学费支出 −',sum('tuitionPayment')],['学费退回 +',sum('tuitionReversal')],['月供已支付 −',loanPaid],['额外偿还本金 −',sum('extraPrincipal')],['本次月末支付（不含已付月供） −',roundCash(s.expenses-s.prepaidExpenses-(s.loanPayments||[]).filter(x=>x.status==='overdue').reduce((n,x)=>n+x.due,0))],['股票/ETF/债券买入 −',sum('investmentBuy')+sum('bondBuy')],['CD存入本金 −',sum('cdPurchase')],['CD提前支取本金 +',sum('cdEarlyPrincipal')],['CD提前支取实收利息 +',sum('cdEarlyInterest')],['车辆首付 −',sum('vehicleDownpayment')],['投资房首付 −',sum('propertyDownpayment')],['投资房全款 −',sum('propertyCashPurchase')],['IRA账户转入 −',sum('iraTransfer')],['出售资产到账 +',sum('assetSale')],['ETF分红到账 +',s.dividends||0],['分红再投资 −',s.dividendReinvested||0],['ETF自动购买 −',sum('autoInvest')],['债券票息 +',s.bondInterest||0],['债券到期本金返还 +',s.bondPrincipal||0],['CD到期本金及利息返还 +',s.cdPayout||0],['其他已记录支出 −',sum('movingCost')+sum('emergencyTransfer')+sum('lifeIncident')],['关系事件额外收入 +',sum('socialIncome')],['门店股份暂存款 −',sum('cafeEquityDeposit')],['门店股份出售到账 +',sum('cafeEquitySale')],['门店股份退款 +',sum('cafeEquityRefund')],['门店分红到账 +',sum('cafeDividend')],['其他现金变化（含旧模块未分类项）',unclassified],['整月现金实际变化',s.monthCashChange],['月末现金',s.endCash??state.cash]];
}
function showMonthlyAudit(s){
 showEvent('MONTH END','第 '+s.month+' 月结算完成','这是刚结束的第 '+s.month+' 月账单。住房、生活、兴趣与机会按实际付款汇总，已付款项不会重复扣除。',[],[['继续',()=>{clearModals();monthlyEvent()},true]]);
 const cafeResults=Object.values(state.cafeEquity?.stores||{})
  .map(store=>store.months?.[s.month-1])
  .filter(result=>result?.shares);
 const cafeSummary=cafeResults.map((result,index)=>
  '<div class="wl-panel"><h3>门店月结'+(cafeResults.length>1?' · 门店 '+(index+1):'')+'</h3><p>门店净利润 <b>'+priceText(result.profit)+
  '</b><br>门店可分红金额 <b>'+priceText(result.pool)+'</b><br>我的分红到账 <b>'+priceText(result.dividend)+'</b></p></div>'
 ).join('');
 const skillPaySummary=s.schoolSkillAllowance?'<div class="wl-panel"><h3>教师工资</h3><p>岗位工资 <b>'+priceText(s.grossSalary-s.schoolSkillAllowance-(s.schoolAnnualBonus||0))+'</b><br>技能津贴 <b>'+priceText(s.schoolSkillAllowance)+'</b><br>本月常规税前工资 <b>'+priceText(s.grossSalary-(s.schoolAnnualBonus||0))+'</b></p></div>':'';
 const annualBonusSummary=s.schoolAnnualBonus?'<div class="wl-panel"><p>年度绩效奖（税前） <b>'+priceText(s.schoolAnnualBonus)+'</b></p></div>':'';
 $('eventData').innerHTML=cafeSummary+skillPaySummary+annualBonusSummary+'<div class="wl-panel"><p>整月现金实际变化 <b>'+priceText(s.monthCashChange)+'</b><br>月末这一次收付 <b>'+priceText(s.settlementCashChange)+'</b><br>持续月度收支结余 <b>'+priceText(s.totalMonthlyCF)+'</b></p><details><summary>持续收支结余怎么计算？</summary><small>持续月度收支结余 = 税后工资 − 401(k)缴费 + 持续资产收入/本期分红票息 − 必要月支出及应付月供。它不含学费、兴趣、机会投入、买卖资产、借款本金或到期返本；自动再投资另外减少现金。</small></details></div><details><summary>展开完整现金明细</summary><table class="wl-review">'+auditRows(s).map(([k,v])=>'<tr><th>'+batchEscape(k)+'</th><td>'+priceText(v)+'</td></tr>').join('')+'</table></details><h3>贷款本月明细</h3>'+((s.loanPayments||[]).map(x=>'<p>'+batchEscape(x.name)+'：'+(x.status==='paid'?'已付 '+priceText(x.due)+'（本金 '+priceText(x.principal)+' / 利息 '+priceText(x.interest)+'）':'未付；当月利息 '+priceText(x.interest)+' + 逾期费用 '+priceText(x.penalty||0)+' 已入本金')+'</p>').join('')||'<p>无个人月供。</p>')+'<h3>自动购买执行情况</h3>'+((s.autoPurchases||[]).map(x=>'<p>'+batchEscape(V26_INSTRUMENTS.find(i=>i.id===x.instrument)?.name||x.instrument)+'：'+(x.status==='purchased'?'已购买 '+priceText(x.amount):'现金不足，已跳过 '+priceText(x.amount))+'</p>').join('')||'<p>未设置自动购买。</p>');$('eventData').style.display='block';
}
function openMedicalEvent(){const insured=!!state.insurance.health?.active,gross=600+Math.floor(Math.random()*5)*200,due=insured?0:gross;
 showEvent('医疗事件','突发疾病需要就医','需要门诊检查和治疗。'+(insured?'本游戏健康保险全额承担本次涵盖的医疗费用，保费仍按月支付。':'未购买健康保险，本次医疗费用由自己承担。'),[['医疗费用',priceText(gross)],['保险承担',priceText(gross-due)],['实际自付',priceText(due)]],[['确认就医 · '+priceText(due),()=>{if(!spendConfirmed('lifeIncident',due,{incident:'疾病就医',insurancePaid:gross-due}))return;state.health=Math.min(100,state.health+3);state.medicalEvents??=[];state.medicalEvents.push({month:state.month,gross,insured,due});save();finish()},true,state.cash<due],['暂缓就医',()=>{state.health=Math.max(0,state.health-4);state.stress=Math.min(100,state.stress+4);save();finish()},false]])}
const monthlyEventBeforeBatch=monthlyEvent;monthlyEvent=function(){const risk=.025+Math.max(0,80-(state.health||80))*.0015+Math.max(0,(state.stress||0)-50)*.001;if(Math.random()<risk){openMedicalEvent();return}monthlyEventBeforeBatch()};
// Selected social activities can reveal shared interests and actual paid work.
function maybeSocialFollowUp(person){if(Math.random()>=.35){finish();return}
 const hobby=Object.keys(state.hobbyXP||{}).find(k=>state.hobbyXP[k]>0)||'摄影',key=state.month+':'+(person?.id||'life');state.socialEvents??={};
 if(state.socialEvents[key]){finish();return}
 const job=Math.random()<.5;showEvent('关系事件',job?'朋友介绍小订单':'发现共同爱好',job?(person?.name||'朋友')+'介绍了一份'+hobby+'小订单。需要投入时间，完成质量存在不确定性。':'你和'+(person?.name||'朋友')+'聊到了'+hobby+'，可以约一次免费交流，增进关系。',[['成本','$0.00'],['可能收入',job?'$160.00（成功时）':'$0.00'],['成功率',job?Math.round(Math.min(.95,.65+hobbyLevel(hobby)*.03)*100)+'%':'100%']],[['确认参加',()=>{if(state.socialEvents[key])return;const success=!job||Math.random()<Math.min(.95,.65+hobbyLevel(hobby)*.03);const reward=job&&success?160:0;state.socialEvents[key]={job,success,reward};if(person)person.relation=Math.min(100,person.relation+8);state.social=Math.min(100,state.social+4);state.happiness=Math.min(100,state.happiness+3);state.energy=Math.max(0,state.energy-4);if(reward){state.cash=roundCash(state.cash+reward);state.financeLedger??=[];state.financeLedger.push({kind:'socialIncome',month:state.month,amount:reward})}save();showEvent('关系结果',success?'交流完成':'订单未通过验收',reward?'订单已完成，报酬已进入现金。':job?'本次没有获得报酬；关系仍有所进展。':'一起交流了共同爱好，关系与幸福度有所增加。',[['实际收入',priceText(reward)],['亲密度',person?Math.round(person.relation)+'/100':'社交 +4']],[['继续',finish,true]])},true],['这次不参加',()=>{state.socialEvents[key]={skipped:true};save();finish()},false]])}
const lifeBeforeBatch=chooseLife;chooseLife=function(i){const already=monthSelection('life');lifeBeforeBatch(i);if(!already&&monthSelection('life')&&['朋友聚餐','兴趣爱好'].includes(V26_LIFE[i]?.name))maybeSocialFollowUp((state.people||[])[0])};
$('networkBtn').onclick=()=>{const people=state.people||[];showEvent('关系网','联系认识的人','',[],people.map((p,i)=>['联系 '+p.name,()=>openSocialPerson(i),false]).concat([['返回',finish,true]]))};
function openSocialPerson(i){const p=state.people[i];if(!p)return;showEvent('关系互动',p.name+' · '+relationStage(p),'选择与这位熟人相处的方式。',[['身份',p.status||p.job],['亲密度',Math.round(p.relation)+'/100']],[['确认一起吃饭 · $45.00',()=>doSocial(p,45,8,'socialMeal'),true,state.cash<45],['确认聊天 · $15.00',()=>doSocial(p,15,5,'socialCoffee'),false,state.cash<15],['返回，不互动',finish,false]])}
function doSocial(p,cost,points,kind){if(!spendConfirmed(kind,cost,{person:p.id||p.name}))return;p.relation=Math.min(100,p.relation+points);state.social=Math.min(100,state.social+3);state.happiness=Math.min(100,state.happiness+3);save();maybeSocialFollowUp(p)}
const choicesBeforeBatch=window.v26Choices;window.v26Choices=function(key,api){
 if(key==='work'&&state.job&&!state.retired&&!state.unemployedMonths)return api.option('继续当前工作','保持现有工作与工资。',()=>completeMonthlyStep(2),true)+api.option('查看工作调整','预览职位或明确确认辞职。查看不改变工作。',openWorkAdjustment);
 if(key==='money')return '<div class="wl-panel"><h3>本月贷款还款</h3><p>应付 '+priceText(loanBudgetTotal())+' · 已付 '+priceText(paidLoanTotal())+'。忘记确认将产生逾期费用。</p><button data-batch="loanPayments">查看并确认还款</button></div>'+api.option('ETF','查看价格、买入及每月自动购买设置。',()=>openMarket('ETF'),true)+api.option('股票','查看公司与价格。',()=>openMarket('股票'))+api.option('基金','混合资产基金。',()=>openMarket('基金'))+api.option('政府债券','固定票息，提前卖出价格有波动。',openBonds)+api.option('CD 定期存款','到期还本付息。',openCD)+api.option('房产投资','比较首付、租金与成本。',()=>window.v242RealEstate())+api.option('完成本月资产安排','保留当前配置并继续。',()=>completeMonthlyStep(7));
 if(key==='review'){const m=calcMetrics(),loan=currentLoanCycle().items;return '<div class="wl-panel"><h3>本月现金核对</h3><p>月初现金 '+priceText(state.turn.startCash)+'<br>当前现金 '+priceText(state.cash)+'<br>月内实际变化 '+priceText(state.cash-state.turn.startCash)+'</p><p>月末税后工资 '+priceText(m.grossSalary-m.tax-m.kContrib)+'<br>持续资产收入预算（含分红票息） '+priceText(state.passive)+'<br>尚未支付的必要成本 '+priceText(m.remainingExpenses)+'（含待付月供预算）</p><p>ETF分红、票息、到期返本和自动购买将在结算时逐项记录。</p></div><div class="wl-panel"><h3>机会结果</h3><p>'+batchEscape(state.monthlyOpportunities?.resolved||'未选择')+'</p><p>投入 '+priceText(state.monthlyOpportunities?.cost||0)+' · 一次性收入 '+priceText(state.monthlyOpportunities?.income||0)+' · 新增净收入 '+priceText(state.monthlyOpportunities?.newMonthlyIncome||0)+'/月</p></div><div class="wl-panel"><h3>还款提醒</h3><p>'+loan.map(x=>batchEscape(x.name)+'：'+(x.status==='paid'?'已付':'未付 '+priceText(x.due))).join('<br>')+'</p><button data-batch="loanPayments">查看还款卡</button></div><button data-v26="settle" class="wl-secondary">确认结算，进入下个月 →</button>'}
 return choicesBeforeBatch(key,api);
};
const batchRenderBase=render;render=function(){batchRenderBase();if(!state)return;for(const a of state.assets){const cfg=V26_INSTRUMENTS.find(i=>i.id===a.instrument);if(cfg)a.name=cfg.name}const box=$('assets');if(!document.getElementById('batchBondsEntry')){const b=document.createElement('button');b.id='batchBondsEntry';b.textContent='政府债券 · 查看市场';b.onclick=openBonds;box.append(b)}const debts=$('debts');const pay=document.createElement('button');pay.textContent='本月贷款还款卡';pay.onclick=openLoanPayments;debts.append(pay)};
document.addEventListener('click',e=>{const b=e.target.closest('[data-batch]');if(!b||b.disabled)return;const k=b.dataset.batch;if(k==='loanPayments')openLoanPayments();if(k==='applyCareer'){b.disabled=true;applyCareer(+b.dataset.i)}});
// Keep older extra-principal controls auditable, with their existing confirmation preview.
const extraPrincipalBeforeBatch=payDebt;
payDebt=function(name){
 extraPrincipalBeforeBatch(name);
 const button=$('actions').firstElementChild;
 if(!button||button.textContent!=='确认还款')return;
 const apply=button.onclick;
 button.onclick=event=>{
  const previous=structuredClone(state);
  apply(event);
  const amount=roundCash(previous.cash-state.cash);
  if(amount<=0)return;
  (state.financeLedger??=[]).push({kind:'extraPrincipal',month:state.month,loan:name,amount});
  try{if(save()===false)throw Error('save failed')}catch(error){
   state=previous;
   payDebt(name);
   $('eventDesc').textContent='还款未能存档，请重试。';
  }
 };
};



