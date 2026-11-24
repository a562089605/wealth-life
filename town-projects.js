const TOWN_PROJECTS={
 orchard:{name:'果园采收分成',cost:4800,description:'果园缺一笔采收周转金。你出资，果农负责采摘和销售，采收季结束后结算。',hours:2,duration:3,chance:.7,payout:6100,fallback:3600},
 advertising:{name:'集市广告位经营权',cost:3600,description:'集市开放一年的广告位经营权。商家已签约，集市方负责更换和维护。',duration:12,monthly:330},
 postoffice:{name:'旧邮局改造',cost:21000,description:'旧邮局搬走了。你可以买下旧址，改成适合出租的小工作室。',duration:2,sale:24000,monthly:260},
 chamber:{name:'商会建设债券',cost:6000,description:'镇商会要给集市修一条遮雨走廊，邀请镇民认购建设债券。',duration:12,monthly:20},
 charging:{name:'社区充电站联营',cost:10500,description:'运营商想在镇口加装充电桩。你出资，运营商负责收费和维护。',monthly:310,fallback:-90,chance:.7},
 truck:{name:'旧货车整修转售',cost:5200,description:'镇上的送货车退役了。买下并检车后，你可以直接转卖、先修再卖，或租给本地配送队。',sale:5500,repair:1200,chance:.8,payout:7600,monthly:180},
 vending:{name:'社区自助售货机',cost:7800,description:'体育馆开放售货机点位。你可以买下设备，自行补货或委托运营。',monthly:220,selfMonthly:340,hours:3,energy:4},
 auction:{name:'图书馆旧家具竞拍',cost:3200,description:'图书馆换了新书架。二手商愿整批收购，扣完运费后到账 $4,900。只有中标才扣款。',payout:4900,bids:[[3200,.4],[3800,.7],[4400,.95]]}
};
const TOWN_PROJECT_CARDS=Object.entries(TOWN_PROJECTS).map(([id,project])=>({id,cost:project.cost}));
function townProjects(s=state){return s.townProjects??=[];}
function townProjectCredit(s,id,amount,month=s.month,title){
 if(!amount)return;
 s.cash=roundCash(s.cash+amount);
 (s.financeLedger??=[]).push({kind:amount<0?'opportunity':'opportunityIncome',month,amount:Math.abs(amount),offer:id,...(title?{title}:{})});
}
function townProjectTime(hours,energy=0){
 const used=state.opportunityTime;
 state.opportunityTime={month:state.month,hours:(used?.month===state.month?used.hours:0)+hours};
 state.energy-=energy;
}
function townProjectPassiveIncome(s=state){
 return (s.townProjects||[]).reduce((total,item)=>{
  const project=TOWN_PROJECTS[item.id];
  if(!project||item.status!=='active'||item.lastPaidMonth>=s.month||(item.due&&item.due<=s.month))return total;
  if(item.id==='charging')return total+project.monthly*project.chance+project.fallback*(1-project.chance);
  return total+townProjectContractMonthly(item,project);
 },0);
}
function townProjectContractMonthly(item,project){
 return item.monthly??(item.id==='chamber'?40:item.id==='advertising'?370:project.monthly||0);
}
function townProjectMonth(item,s,month,forecast=false){
 const project=TOWN_PROJECTS[item.id],closedMonth=month-1;
 if(!project||item.lastPaidMonth>=closedMonth||item.status==='closed')return null;
 let status=item.status,amount=0;
 if(status==='waiting'&&month>=item.due){
  if(item.id==='postoffice')status='ready';
  if(item.id==='orchard'){amount=item.payout;status='closed';}
 }else if(status==='active'){
  amount=townProjectContractMonthly(item,project);
  if(item.id==='charging'){
   const roll=(Math.imul((s.offerSeed||1)+closedMonth*7919+item.moveId,2654435761)>>>0)%100;
   amount=forecast?project.monthly*project.chance+project.fallback*(1-project.chance):
    roll<project.chance*100?project.monthly:project.fallback;
  }
  if(item.id==='vending'&&item.restockMonth===closedMonth)amount=project.selfMonthly;
  if(item.due&&month>=item.due){
   if(item.id==='chamber')amount+=project.cost;
   status='closed';
  }
 }
 return {status,amount,title:project.name+(item.id==='chamber'&&status==='closed'?' · 本金及末期利息':'')};
}
function townMonthForecast(s=state){
 const market=townMarketMonthlyIncome(s,{forecast:true});
 const projects=townProjects(s).reduce((total,item)=>total+(townProjectMonth(item,s,s.month+1,true)?.amount||0),0);
 return roundCash(market+projects);
}
function settleTownProjects(s,settlement){
 for(const item of townProjects(s)){
  const flow=townProjectMonth(item,s,settlement.month);
  if(!flow)continue;
  item.status=flow.status;
  item.lastPaidMonth=settlement.month-1;
  townProjectCredit(s,item.id,flow.amount,item.lastPaidMonth,flow.title);
  settlement.netCF=roundCash(settlement.netCF+flow.amount);
 }
}
function showTownProject(id,title,description,rows,actions){
 showEvent('大机会',title,description,[],actions);
 const art='assets/finance/big-'+id+'.webp';
 $('eventData').innerHTML='<div class="town-opportunity town-market-card"><img class="town-opportunity-art" src="'+art+'" alt=""><dl>'+
  rows.map(([label,value])=>'<div><dt>'+batchEscape(label)+'</dt><dd>'+batchEscape(value)+'</dd></div>').join('')+'</dl></div>';
 $('eventData').style.display='block';
}
function openTownProjectOffer(move,id){
 const p=TOWN_PROJECTS[id],offer=move.offers,owner=state,chosenSlot=slot;
 const active=()=>state===owner&&slot===chosenSlot&&townOpportunityMove()===move&&move.offers===offer&&!offer.resolved;
 const ready=(cost)=>active()&&state.cash>=cost&&(id!=='orchard'||currentCareerTime().free>=p.hours);
 function choose(cost,chance){
  const accepted=cost!==null;
  if(!active()||(accepted&&!ready(cost)))return;
  let note='已放弃';
  const result=CareerLearningRules.atomic(state,()=>{
   const win=id!=='auction'||townMarketRoll(move)%100<chance*100;
   if(accepted&&win){
    if(!spendConfirmed('opportunity',cost,{offer:id}))return false;
    if(id==='auction')townProjectCredit(state,id,p.payout);
    else{
     const status=['orchard','postoffice'].includes(id)?'waiting':['truck','vending'].includes(id)?'ready':'active';
     const item={id,moveId:move.id,status,started:state.month};
     if(p.duration)item.due=state.month+p.duration;
     if(id==='chamber'||id==='advertising')item.monthly=p.monthly;
     if(id==='orchard'){
      townProjectTime(p.hours);
      item.payout=townMarketRoll(move)%100<p.chance*100?p.payout:p.fallback;
     }
     townProjects().push(item);
    }
   }
   note=!accepted?'已放弃':!win?'未中标':id==='auction'?'竞拍成交':'投资已记录';
   offer.resolved=note;
   move.resolved=true;
   move.completedMonth=state.month;
   townState().history.push({id:move.id,die:move.die,to:move.to,month:state.month,type:townMoveType(move),offerId:id,outcome:note});
   return {};
  },save);
  if(!result.ok){openTownOpportunity(result.reason);$('eventDesc').textContent=result.reason;return;}
  if(!accepted)return finish();
  const project=townProjects().find(item=>item.moveId===move.id&&item.id===id);
  if(project?.status==='ready')return openTownProjectDecision(project);
  const text=id==='auction'?(note==='未中标'?'没有扣款。':'转卖净赚 '+priceText(p.payout-cost)+'。'):
   project?.status==='waiting'?'可在小镇「地图资产」查看进度。':'月末结算，可在小镇「地图资产」查看。';
  showEvent('大机会',note,text,[],[['继续',finish,true]]);
 }
 function fund(cost){
  if(!active())return;
  const shortfall=roundCash(cost-state.cash);
  if(shortfall>0)openBankLoan(shortfall,{returnDirect:true,after:()=>{if(active())openTownOpportunity();}});
 }
 const rows=[['本次投入',priceText(p.cost)]];
 const money=(label,value)=>rows.push([label,priceText(value)]);
 const actions=[];
 switch(id){
  case 'orchard':
   rows.push(['自由时间','−2 小时'],['基础丰收率','70%'],['结算时间','3 个月后']);
   money('丰收到账',p.payout);money('歉收到账',p.fallback);break;
  case 'advertising':
   rows.push(['合同期限','12 个月']);money('每月净收入',p.monthly);money('到期累计净赚',p.monthly*p.duration-p.cost);break;
  case 'postoffice':
   rows.push(['预计完工','2 个月后']);money('转卖到账',p.sale);money('出租月净租金',p.monthly);break;
  case 'chamber':
   rows.push(['持有期限','12 个月，不能提前赎回']);money('每月利息',p.monthly);money('返还本金',p.cost);break;
  case 'charging':
   rows.push(['高用量月份概率','70%']);money('高用量月净收入',p.monthly);money('低用量月净支出',-p.fallback);break;
  case 'truck':
   money('直接卖到账',p.sale);money('整修追加费',p.repair);rows.push(['整修验收通过率','80%']);
   money('通过后到账',p.payout);money('未通过到账',p.sale);money('出租月净租金',p.monthly);break;
  case 'vending':
   money('委托运营月净收入',p.monthly);money('自行补货月净收入',p.selfMonthly);
   rows.push(['自行补货每月消耗','3 小时 · 4 点能量']);break;
  case 'auction':
   rows.length=0;
   for(const [bid,probability] of p.bids){
    rows.push([priceText(bid),Math.round(probability*100)+'% 中标 · 净赚 '+priceText(p.payout-bid)]);
    actions.push(ready(bid)
     ?['出价 '+priceText(bid),()=>choose(bid,probability),false]
     :['申请贷款 · 出价 '+priceText(bid),()=>fund(bid),false]);
   }
   break;
 }
 if(id!=='auction'){
  actions.push([({truck:'买下检车',chamber:'认购',vending:'买'})[id]||'确认参与',()=>choose(p.cost,1),true,!ready(p.cost)]);
  if(state.cash<p.cost)actions.push(['申请贷款',()=>fund(p.cost),false]);
 }
 actions.push([({chamber:'不认购',vending:'不买'})[id]||'放弃',()=>choose(null),false]);
 showTownProject(id,p.name,p.description,rows,actions);
}
function openTownProjectDecision(item){
 const p=TOWN_PROJECTS[item.id],owner=state,chosenSlot=slot,status=item.status,month=state.month;
 function choose(option){
  if(state!==owner||slot!==chosenSlot||state.month!==month||!townProjects().includes(item)||item.status!==status)return;
  if(option==='repair'&&state.cash<p.repair)return;
  if(option==='restock'&&(item.restockMonth===month||state.energy<p.energy||currentCareerTime().free<p.hours))return;
  let description='';
  const result=CareerLearningRules.atomic(state,()=>{
   if(option==='repair'||option==='sell'){
    if(option==='repair'&&!spendConfirmed('opportunity',p.repair,{offer:item.id}))return false;
    const repaired=option==='repair'&&townMarketRoll({id:item.moveId})%100<p.chance*100;
    const price=repaired?p.payout:p.sale;
    const net=price-p.cost-(option==='repair'?p.repair:0);
    townProjectCredit(state,item.id,price);
    item.status='closed';
    description='到账 '+priceText(price)+'，'+(net<0?'净亏 ':'净赚 ')+priceText(Math.abs(net))+'。';
   }else{
    item.status='active';
    delete item.due;
    if(option==='restock'){
     townProjectTime(p.hours,p.energy);
     item.restockMonth=month;
     description='已补货，本月净收入 '+priceText(p.selfMonthly)+'。';
    }else description='从本月底开始结算，月净收入 '+priceText(p.monthly)+'。';
   }
   return {};
  },save);
  showEvent('大机会',p.name,result.ok?description:result.reason,[],[['继续',finish,true]]);
 }
 const restocked=item.restockMonth===month;
 const canRestock=!restocked&&currentCareerTime().free>=p.hours&&state.energy>=p.energy;
 const actions=item.id==='vending'?
  [['委托运营',()=>choose('rent'),true,restocked],['本月自行补货',()=>choose('restock'),false,!canRestock]]:
  [['直接卖',()=>choose('sell'),true],['租出去',()=>choose('rent'),false]];
 if(item.id==='truck')actions.splice(1,0,['整修后卖',()=>choose('repair'),false,state.cash<p.repair]);
 const rows=item.id==='vending'?[['委托运营月净收入',priceText(p.monthly)],['自行补货月净收入',priceText(p.selfMonthly)],['补货消耗','3 小时 · 4 点能量']]:
  [['直接转卖到账',priceText(p.sale)],['出租月净租金',priceText(p.monthly)]];
 if(item.id==='truck')rows.splice(1,0,['整修追加费',priceText(p.repair)],['验收通过率','80%'],['通过／未通过到账',priceText(p.payout)+'／'+priceText(p.sale)]);
 showTownProject(item.id,item.id==='truck'?'旧货车怎么处置':p.name,
  item.id==='vending'?(restocked?'本月已经补货。':'当月有空可以自行补货，其余月份由运营商代管。'):'',rows,actions);
}
