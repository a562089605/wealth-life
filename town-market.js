const TOWN_MARKET_DEALS={
 'valley-stock':{name:'山谷食品公司',type:'股票',unit:'股',price:6,limit:50},
 'steady-fund':{name:'小镇稳健基金',type:'基金',unit:'份',price:25,limit:20,defaultQuantity:8},
 'school-flat':{name:'学校旁小公寓',type:'出租房',price:22000,down:4400,rent:360,net:160,bids:[20000,21500,24000,26000],lease:{term:12,vacancy:200}},
 'station-shop':{name:'车站便利店铺面',type:'商铺',price:55000,down:11000,rent:850,net:330,bids:[49000,53000,59000,64000],lease:{initial:2,term:12,rent:800,net:280,subsidy:300,vacancy:520,renovation:{cost:600,net:360}}},
 'river-stock':{name:'河畔运输公司',type:'股票',unit:'股',price:10,limit:50},
 'river-fund':{name:'河畔综合基金',type:'基金',unit:'份',price:20,limit:25},
 'river-home':{name:'河畔一居室',type:'出租房',price:30000,down:6000,rent:450,net:180,bids:[27000,29000,34000,37000]},
 'corner-shop':{name:'街角花店铺面',type:'商铺',price:45000,down:9000,rent:680,net:260,bids:[41000,44000,51000,55000]},
 'flower-equity':{name:'街角花店',type:'花店份额',price:2000,share:10,maximum:120,bids:[1500,1800,2300,2600]}
};
const TOWN_MARKET_CARDS=Object.entries(TOWN_MARKET_DEALS).map(([id,deal])=>({id,cost:deal.down??(deal.unit?deal.price*deal.limit:deal.price)}));
function townMarketHoldings(s=state){return s.townHoldings??=[];}
function townBusinessAssets(s=state){return s.townBusinessAssets??=[];}
function migrateTownBusinessAssets(s){
 if(s.townBusinessMigrationDone||typeof V26_OFFERS==='undefined'||!s.town)return;
 s.townBusinessMigrationDone=true;
 const history=[...(s.town.history||[])];
 const current=s.town.movement;
 if(current&&!current.resolved&&current.offers?.pool==='regular'&&current.offers.success){
  history.push({offerId:current.offers.ids[0],outcome:current.offers.resolved});
 }
 const migrated=new Set();
 for(const project of V26_OFFERS.filter(item=>item.cf)){
  const count=history.filter(move=>move.offerId===project.id&&move.outcome===project.name).length;
  const matches=s.assets.filter(asset=>asset.kind==='business'&&asset.name===project.name&&asset.cost===project.cost&&asset.cf===project.cf);
  if(count&&matches.length===count)for(const asset of matches){
   townBusinessAssets(s).push({...asset,offerId:project.id});
   migrated.add(asset);
  }
 }
 if(migrated.size)s.assets=s.assets.filter(asset=>!migrated.has(asset));
}
function townMarketMonthlyFlows(s=state,{forecast=false}={}){
 return [
  ...townMarketHoldings(s).flatMap(holding=>{
   const deal=TOWN_MARKET_DEALS[holding.deal];
   if(!deal)return [];
   let amount=deal.lease?townLeaseNet(holding,deal,s.month):deal.net||0;
   if(deal.maximum){
    const roll=Math.imul((s.offerSeed||1)+s.month*7919+holding.id,1664525)>>>0;
    amount=forecast?deal.maximum/2:roll%(deal.maximum+1);
   }
   return amount?[{id:holding.deal,amount,title:deal.name}]:[];
  }),
  ...townBusinessAssets(s).map(asset=>({id:asset.offerId,amount:asset.cf,title:asset.name}))
 ];
}
function townMarketMonthlyIncome(s=state,options){
 return roundCash(townMarketMonthlyFlows(s,options).reduce((total,flow)=>total+flow.amount,0));
}
function townMarketRoll(move){
 let seed=((state.offerSeed||1)+move.id*104729+state.month*7919)>>>0;
 seed=Math.imul(seed^(seed>>>16),0x45d9f3b);
 seed=Math.imul(seed^(seed>>>16),0x45d9f3b);
 return (seed^(seed>>>16))>>>0;
}
function townSecurityPrice(dealId,move,side){
 const deal=TOWN_MARKET_DEALS[dealId],stock=deal.type==='股票';
 const market=Math.max(.01,(state.marketIndex||100)/100);
 const inflation=Math.max(.01,(state.cpiIndex||100)/100);
 const base=deal.price*Math.pow(market,{'valley-stock':.95,'river-stock':1.2,'steady-fund':.35,'river-fund':.7}[dealId])*inflation;
 const roll=townMarketRoll(move);
 // Individual share offers vary more than diversified fund quotes.
 const spread=stock?.08:.015;
 const local=(Math.floor(roll/17)%2001)/1000-1;
 const lastSale=townState().history.findLast(entry=>entry.offerId===dealId&&entry.outcome==='卖'&&entry.unitPrice>0);
 const saleSignal=lastSale?Math.max(-.03,Math.min(.03,(lastSale.unitPrice/base-1)*.15)):0;
 const sellerDiscount=side==='sell'?(stock?.02:.005):0;
 let price=Math.max(.01,roundCash(base*(1+local*spread+saleSignal-sellerDiscount)));
 if(side==='buy'){
  const lastOffer=townState().history.findLast(entry=>entry.offerId===dealId&&(entry.outcome==='买'||entry.outcome==='不买'));
  if(price===(lastOffer?.unitPrice??(lastOffer?deal.price:null)))price=roundCash(price+(local<0&&price>.01?-.01:.01));
 }
 return price;
}
function townMarketQuote(move){
 if(move.marketQuote!==undefined)return move.marketQuote;
 const eligible=townMarketHoldings().filter(h=>h.moveId!==move.id);
 const roll=townMarketRoll(move);
 const holding=roll%3===0?eligible[Math.floor(roll/3)%eligible.length]:null;
 if(!holding)return null;
 const index=Math.floor(roll/13)%4;
 const multiplier=[.75,.9,1.12,1.3][index];
 const deal=TOWN_MARKET_DEALS[holding.deal];
 if(deal.unit)return null;
 const price=deal.bids?.[index]??roundCash(holding.unitCost*multiplier);
 const offer={holdingId:holding.id,price};
 const result=CareerLearningRules.atomic(state,()=>{move.marketQuote=offer;return {};},save);
 return result.ok?offer:null;
}
function openTownMarketTrade(move,dealId,quote=null){
 if(townOpportunityMove()!==move)return;
 const deal=TOWN_MARKET_DEALS[dealId];
 const selling=!!quote;
 const holding=selling?townMarketHoldings().find(h=>h.id===quote.holdingId):null;
 const owner=state,chosenSlot=slot,offer=move.offers;
 if(!deal||(selling&&(!holding||holding.deal!==dealId)))return;
 const valid=()=>state===owner&&slot===chosenSlot&&townOpportunityMove()===move&&
  (offer?move.offers===offer&&!offer.resolved&&(!selling||offer.buyerQuote===quote):
   selling&&move.marketQuote===quote&&!move.offers);
 if(!valid())return;
 const alreadyOwned=!selling&&!deal.unit&&townMarketHoldings().some(item=>item.deal===dealId);
 const cashPrice=selling?quote.price:(offer?.unitPrice??deal.down??deal.price);
 const limit=deal.unit?(selling?holding.quantity:deal.limit):1;
 let quantity=deal.unit?Math.min(limit,selling?limit:Math.max(1,Math.floor(state.cash/cashPrice)),deal.defaultQuantity??(deal.unit==='股'?20:10)):1;
 const amount=()=>roundCash(cashPrice*quantity-(holding?.debt??0));
 const profit=()=>roundCash(selling?(quote.price-holding.unitCost)*quantity:0);
 const buyLabel=deal.share?'入股':'买',accept=selling?'卖':buyLabel,decline=selling?'不卖':'不'+buyLabel;
 const title=selling?(deal.share?'花店份额收购报价':deal.type+'买家报价'):deal.share?'街角花店入股':'地图'+deal.type+'买入';
 function settle(acceptTrade){
  if(!valid()||(acceptTrade&&(selling?amount()<0&&state.cash< -amount():alreadyOwned||state.cash<amount())))return;
  const result=CareerLearningRules.atomic(state,()=>{
   if(acceptTrade){
    if(selling){
     state.cash=roundCash(state.cash+amount());
     holding.quantity-=quantity;
     if(!holding.quantity)state.townHoldings=townMarketHoldings().filter(item=>item!==holding);
    }else{
     if(!spendConfirmed('opportunity',amount(),{offer:dealId}))return false;
     townMarketHoldings().push({id:move.id,moveId:move.id,deal:dealId,unitCost:deal.unit?cashPrice:deal.price,quantity,debt:deal.price-(deal.down??deal.price),...(deal.lease?{leaseEnd:state.month+(deal.lease.initial||0)}:{})});
    }
    if(selling)(state.financeLedger??=[]).push({kind:amount()<0?'opportunity':'opportunityIncome',month:state.month,amount:Math.abs(amount()),offer:dealId});
   }
   move.offers={month:state.month,pool:'map-market',deck:offer?.deck,ids:[dealId],resolved:acceptTrade?accept:decline};
   move.resolved=true;
   move.completedMonth=state.month;
   townState().history.push({id:move.id,die:move.die,to:move.to,month:state.month,type:townMoveType(move),offerId:dealId,outcome:move.offers.resolved,
    ...(deal.unit&&(!selling||acceptTrade)?{unitPrice:cashPrice}:{})});
   return {};
  },save);
  if(!result.ok){
   openTownOpportunity(result.reason);
   $('eventDesc').textContent=result.reason;
   return;
  }
  finish();
 }
 showEvent('地图专用',title,selling&&deal.unit?'有买家想按当前报价收购你持有的'+deal.name+'。':'',[],[[accept,()=>settle(true),true],[decline,()=>settle(false),false]]);
 const data=$('eventData');
 const valleyBuyer=selling&&dealId==='valley-stock';
 const art=valleyBuyer?'assets/confirmed-20261128/valley-buyer.webp':
  !selling&&dealId==='school-flat'?'assets/confirmed-20261128/school-flat-purchase.webp':
  'assets/finance/map-'+dealId+(selling&&!deal.lease?'-sell':'-buy')+'.webp';
 data.innerHTML='<div class="town-opportunity town-market-card'+(valleyBuyer?' town-valley-buyer':'')+'"><img class="town-opportunity-art" src="'+art+'" alt=""><h3>'+deal.name+'</h3><dl></dl></div>';
 data.style.display='block';
 const list=data.querySelector('dl');
 const action=$('actions');
 function row(label,value,kind){
  const block=document.createElement('div'),term=document.createElement('dt'),detail=document.createElement('dd');
  if(kind)block.className=kind;
  term.textContent=label;
  if(value instanceof Node)detail.append(value);else detail.textContent=value;
  block.append(term,detail);list.append(block);
 }
 function update(){
  list.replaceChildren();
  if(deal.unit){
   if(selling)row('买入成本',priceText(holding.unitCost)+'／'+deal.unit);
   row(selling?'买家出价':'买入价',priceText(cashPrice)+'／'+deal.unit);
   const control=document.createElement('span');
   control.className='town-market-quantity';
   for(const [delta,label] of [[-1,'−'],[0,quantity+' '+deal.unit],[1,'+']]){
    if(!delta){control.append(document.createTextNode(label));continue;}
    const button=Object.assign(document.createElement('button'),{type:'button',textContent:label,disabled:quantity+delta<1||quantity+delta>limit});
    button.setAttribute('aria-label',delta<0?'减少数量':'增加数量');
    button.onclick=()=>{quantity+=delta;update();controlFocus(delta)};
    control.append(button);
   }
   row((selling?'卖出':'买入')+(deal.unit==='股'?'股数':'份数'),control,'town-trade-quantity-row');
  }else if(selling){
   if(deal.share){row('出售份额',deal.share+'%');row('原入股金额',priceText(holding.unitCost));}
   row('买家出价',priceText(quote.price));
   if(holding.debt)row(deal.type==='出租房'?'剩余房贷':'剩余贷款',priceText(holding.debt));
  }else if(deal.share){
   row('入股金额',priceText(deal.price));row('持有份额',deal.share+'%');row('预计月分成','$0–$'+deal.maximum);
  }else{
   row(deal.type==='出租房'?'房屋总价':'商铺总价',priceText(deal.price));row('本次首付',priceText(deal.down));
   if(deal.lease&&!deal.lease.initial){
    row('当前状态','空置');row('空置每月支出',priceText(deal.lease.vacancy));row('出租后月净租金',priceText(deal.net));
   }else{
    row('每月租金',priceText(deal.rent));row('每月净租金',priceText(deal.net));
    if(deal.lease)row('剩余租期',deal.lease.initial+'个月');
   }
  }
  if(selling){
   if(!deal.share)row(amount()<0?'需补差额':'一共到账',priceText(Math.abs(amount())),'town-trade-total-row');
   row(profit()<0?'本次净亏':profit()>0?'本次净赚':'本次盈亏',priceText(Math.abs(profit())),'town-trade-total-row');
  }else if(deal.unit)row('一共',priceText(amount()));
  action.querySelector('button').disabled=selling?amount()<0&&state.cash< -amount():alreadyOwned||state.cash<amount();
 }
 function controlFocus(delta){list.querySelector(delta<0?'.town-market-quantity button:first-child':'.town-market-quantity button:last-child')?.focus();}
 update();
 if(selling&&!deal.unit){
  const reminder=document.createElement('p');
  reminder.textContent=deal.share?'卖出后，不再领取这家花店的分成。':'确认卖出后，本'+(deal.type==='商铺'?'商铺':'房屋')+'不再产生被动收入。';
  data.querySelector('.town-market-card').append(reminder);
 }
}
function openTownMarketHoldings(back){
 const rows=townMarketHoldings().map(holding=>{
  const deal=TOWN_MARKET_DEALS[holding.deal];
  const detail=deal.unit?holding.quantity+' '+deal.unit+' · 成本 '+priceText(holding.unitCost)+'／'+deal.unit:
   deal.share?deal.share+'% · 预计月分成 $0–$'+deal.maximum:
   deal.lease?townLeaseHoldingText(holding,deal):'每月净租金 '+priceText(deal.net);
  return [deal.name,detail];
 });
 for(const asset of townBusinessAssets())rows.push([asset.name,'每月净收入 '+priceText(asset.cf)+' · 投入 '+priceText(asset.cost)]);
 const actions=[];
 for(const item of townProjects().filter(project=>project.status!=='closed')){
  const project=TOWN_PROJECTS[item.id];
  const detail=item.status==='waiting'?'剩余 '+Math.max(0,item.due-state.month)+' 个月':
   item.status==='ready'?'等待选择':
   item.id==='charging'?'月底按用量结算':
   item.id==='vending'?'本月预计 '+priceText(item.restockMonth===state.month?project.selfMonthly:project.monthly):
   '每月 '+priceText(townProjectContractMonthly(item,project))+(item.due?' · 剩余 '+(item.due-state.month)+' 个月':'');
  rows.push([project.name,detail]);
  if(item.status==='ready'||item.id==='vending')actions.push([project.name,()=>openTownProjectDecision(item),false]);
 }
 actions.push(['返回',back,true]);
 showEvent('地图专用','地图资产','',rows.length?rows:[['目前没有地图资产','—']],actions);
}

function townLeaseNet(holding,deal,month){
 if(month>=holding.leaseEnd)return -deal.lease.vacancy;
 if(holding.renewalStart===undefined)return deal.net;
 return month>=holding.renewalStart?(holding.renewalNet??deal.lease.net):holding.previousLeaseNet;
}
function townLeaseHoldingText(holding,deal){
 const net=townLeaseNet(holding,deal,state.month);
 if(net<0)return '空置 · 每月支出 '+priceText(-net);
 return '剩余 '+(holding.leaseEnd-state.month)+' 个月 · 月净租金 '+priceText(net);
}
function townLeaseCandidate(move){
 return townMarketHoldings().find(holding=>{
  const lease=TOWN_MARKET_DEALS[holding.deal].lease;
  if(!lease||holding.moveId===move.id||holding.lastLeaseOffer===state.month)return false;
  const remaining=holding.leaseEnd-state.month;
  return townLeaseEarlyExit(holding)||remaining<=0||(lease.initial&&remaining===1&&(!holding.renewalStart||state.month>=holding.renewalStart));
 });
}
function townLeaseEarlyExit(holding){
 return holding.deal==='school-flat'&&holding.leaseEnd-state.month===3&&holding.earlyExitOfferedFor!==holding.leaseEnd;
}
function openTownLeaseOffer(move,holding){
 const deal=TOWN_MARKET_DEALS[holding.deal],lease=deal.lease;
 const earlyExit=townLeaseEarlyExit(holding);
 const station=!!lease.initial,renewing=station&&holding.leaseEnd>state.month;
 const start=Math.max(state.month,holding.leaseEnd),cost=lease.subsidy||0;
 const approve=earlyExit?'同意退租':renewing?'续租':'签约',decline=earlyExit?'按原约':renewing?'不续租':'再等等';
 const owner=state,chosenSlot=slot;
 const renovation=renewing?lease.renovation:null;
 function choose(accepted,renovate=false){
  const charge=renovate?renovation.cost:cost;
  if(state!==owner||slot!==chosenSlot||townOpportunityMove()!==move||
   move.offers||townLeaseCandidate(move)!==holding||(accepted&&state.cash<charge))return;
  const result=CareerLearningRules.atomic(state,()=>{
   if(earlyExit){
    holding.earlyExitOfferedFor=holding.leaseEnd;
    if(accepted){
     holding.leaseEnd=state.month+1;
     state.cash=roundCash(state.cash+deal.rent);
     (state.financeLedger??=[]).push({kind:'opportunityIncome',month:state.month,amount:deal.rent,offer:'school-flat-early-exit'});
    }
   }else if(accepted){
    if(charge&&!spendConfirmed('opportunity',charge,{offer:holding.deal}))return false;
    if(station){
     holding.previousLeaseNet=townLeaseNet(holding,deal,state.month);
     holding.renewalStart=start;
     holding.renewalNet=renovate?renovation.net:lease.net;
    }
    holding.leaseEnd=start+lease.term;
   }
   holding.lastLeaseOffer=state.month;
   move.offers={month:state.month,pool:'map-market',ids:[holding.deal],resolved:renovate?'翻新续租':accepted?approve:decline};
   move.resolved=true;
   move.completedMonth=state.month;
   townState().history.push({id:move.id,die:move.die,to:move.to,month:state.month,type:townMoveType(move),offerId:holding.deal,outcome:move.offers.resolved});
   return {};
  },save);
  if(result.ok)finish();
  else{
   openTownOpportunity(result.reason);
   $('eventDesc').textContent=result.reason;
  }
 }
 const title=earlyExit?'租客提前退租':renewing?'商铺续租报价':station?'商铺租客申请':'租客申请';
 const rows=earlyExit?[
  ['原租约剩余',(holding.leaseEnd-state.month)+'个月'],
  ['提前解约补偿',priceText(deal.rent)+'（一个月租金）'],
  ['下月起空置支出',priceText(lease.vacancy)+'／月'],
  ['按原约月净租金',priceText(deal.net)]
 ]:station?[
  [renewing?'续租期限':'租期',lease.term+'个月'],
  [renewing?'续租月租金':'每月租金',priceText(lease.rent)],
  [renewing?'续租后月净租金':'每月净租金',priceText(lease.net)],
  ['一次性装修补贴',priceText(cost)],['空置每月支出',priceText(lease.vacancy)]
 ]:[['申请人','小学老师'],['租期',lease.term+'个月'],['每月租金',priceText(deal.rent)],['每月净租金',priceText(deal.net)]];
 function renderLeaseCard(title,rows,actions,art,note,description=''){
  showEvent('地图专用',title,'',[],actions);
  $('eventData').innerHTML='<div class="town-opportunity town-market-card"><img class="town-opportunity-art" src="'+art+'" alt=""><h3>'+deal.name+'</h3>'+
   (description?'<p>'+description+'</p>':'')+'<dl>'+
   rows.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+
   '</dl><p>'+note+'</p></div>';
  $('eventData').style.display='block';
 }
 const actions=[[approve,()=>choose(true),true,state.cash<cost],[decline,()=>choose(false),false]];
 const renewalNote='新租约从现有租约到期后开始。';
 if(renovation)actions.push(['查看翻新方案',()=>renderLeaseCard('商铺翻新换提租',[
  ['一次性翻新费',priceText(renovation.cost)],['新租约',lease.term+'个月'],
  ['不翻新月净租金',priceText(lease.net)],['翻新后月净租金',priceText(renovation.net)],
  ['原价续租装修补贴',priceText(cost)]
 ],[['翻新续租',()=>choose(true,true),true,state.cash<renovation.cost],
    ['原价续租',()=>choose(true),false,state.cash<cost]],
 'assets/finance/scene-station-renovation.webp',renewalNote,
 '租客拿来一张门面草图。他想换掉褪色的遮阳棚，也愿意在新租约里多付一些租金。'),false]);
 const scene=earlyExit?['map-school-flat-early-exit.webp','租客因工作调动，希望月底搬走。']:
  renewing?['scene-station-renewal.webp','便利店的租客想继续做车站的生意。他愿意再签一年，希望你补贴一笔店面整理费。']:
  station?['scene-station-application.webp','一位曾在站前摆摊的店主看中了空出来的铺面。他想把生意搬进室内，开一家便利店。']:
  ['scene-school-application.webp','附近小学的一位老师来看房。她想找个步行就能上班的住处，愿意先签一年。'];
 renderLeaseCard(title,rows,actions,station||earlyExit?'assets/finance/'+scene[0]:'assets/confirmed-20261128/school-flat-lease-application.webp',
  earlyExit?'本月租金照常结算。':renewing?renewalNote:'签约后，从本月月底开始收租。',scene[1]);
}
function townFlowerOrderCandidate(move){
 if(state.month%12!==11||state.flowerOrderMonth===state.month||move.marketQuote)return null;
 return townMarketHoldings().find(holding=>holding.deal==='flower-equity'&&holding.moveId!==move.id);
}
function openTownFlowerOrder(move,holding){
 const cost=60,reward=150,chance=.8;
 const id='flower-holiday-order',title='花店节日预订单',owner=state,chosenSlot=slot;
 function resolve(participating){
  if(state!==owner||slot!==chosenSlot||townOpportunityMove()!==move||move.offers||
   townFlowerOrderCandidate(move)!==holding||(participating&&state.cash<cost))return;
  const result=CareerLearningRules.atomic(state,()=>{
   if(participating&&!spendConfirmed('opportunity',cost,{offer:id}))return false;
   const delivered=participating&&townMarketRoll(move)%100<chance*100;
   if(delivered){
    state.cash=roundCash(state.cash+reward);
    (state.financeLedger??=[]).push({kind:'opportunityIncome',month:state.month,amount:reward,offer:id});
   }
   const outcome=participating?(delivered?'交付成功':'交付失败'):'不参与';
   state.flowerOrderMonth=state.month;
   move.offers={month:state.month,pool:'map-market',ids:[id],resolved:outcome};
   move.resolved=true;
   move.completedMonth=state.month;
   townState().history.push({id:move.id,die:move.die,to:move.to,month:state.month,type:townMoveType(move),offerId:id,outcome});
   return {delivered,outcome};
  },save);
  if(!result.ok){
   openTownOpportunity(result.reason);
   $('eventDesc').textContent=result.reason;
   return;
  }
  if(!participating)return finish();
  showEvent('地图专用',result.outcome,
   result.delivered?'花束已按时验收，市集已结款。':'花束未能按时通过验收，花材费已经支出。',
   [['到账',priceText(result.delivered?reward:0)],[result.delivered?'本次净赚':'本次净亏',priceText(result.delivered?reward-cost:cost)]],
   [['继续',finish,true]]);
 }
 showEvent('地图专用',title,'',[],[['参与订单',()=>resolve(true),true,state.cash<cost],['不参与',()=>resolve(false),false]]);
 const rows=[['你分摊的花材费',priceText(cost)],['基础交付成功率',Math.round(chance*100)+'%'],
  ['成功额外到账',priceText(reward)],['未成功额外到账',priceText(0)]];
 $('eventData').innerHTML='<div class="town-opportunity town-market-card"><img class="town-opportunity-art" src="assets/finance/map-flower-holiday-order.webp" alt=""><h3>街角花店</h3>'+
  '<p>镇上的节日市集订了一批花束。店主想请你分摊花材费，花束按时验收后才结款。</p><dl>'+
  rows.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+
  '</dl><p>月度分成照常。</p></div>';
 $('eventData').style.display='block';
}
