const TOWN_MARKET_DEALS={
 'river-stock':{name:'河畔运输公司',type:'股票',unit:'股',price:10,limit:50},
 'river-fund':{name:'河畔综合基金',type:'基金',unit:'份',price:20,limit:25},
 'river-home':{name:'河畔一居室',type:'出租房',price:30000,down:6000,rent:450,net:180,bids:[27000,29000,34000,37000]},
 'corner-shop':{name:'街角花店铺面',type:'商铺',price:45000,down:9000,rent:680,net:260,bids:[41000,44000,51000,55000]},
 'flower-equity':{name:'街角花店',type:'花店份额',price:2000,share:10,maximum:120,bids:[1500,1800,2300,2600]}
};
const TOWN_MARKET_CARDS=Object.entries(TOWN_MARKET_DEALS).map(([id,deal])=>({id,cost:deal.down??(deal.unit?deal.price*deal.limit:deal.price)}));
function townMarketHoldings(s=state){return s.townHoldings??=[];}
function townMarketMonthlyIncome(s=state){
 return townMarketHoldings(s).reduce((total,holding)=>{
  const deal=TOWN_MARKET_DEALS[holding.deal];
  if(deal?.net)return total+deal.net;
  if(!deal?.maximum)return total;
  const monthlyRoll=Math.imul((s.offerSeed||1)+s.month*7919+holding.id,1664525)>>>0;
  return total+monthlyRoll%(deal.maximum+1);
 },0);
}
function townMarketRoll(move){
 let seed=((state.offerSeed||1)+move.id*104729+state.month*7919)>>>0;
 seed=Math.imul(seed^(seed>>>16),0x45d9f3b);
 seed=Math.imul(seed^(seed>>>16),0x45d9f3b);
 return (seed^(seed>>>16))>>>0;
}
function townMarketQuote(move){
 if(move.marketQuote!==undefined)return move.marketQuote;
 const eligible=townMarketHoldings().filter(h=>h.moveId!==move.id);
 const roll=townMarketRoll(move);
 const holding=roll%3===0?eligible[Math.floor(roll/3)%eligible.length]:null;
 if(!holding)return null;
 const index=Math.floor(roll/13)%4;
 const multiplier=[.75,.9,1.12,1.3][index];
 const price=TOWN_MARKET_DEALS[holding.deal].bids?.[index]??roundCash(holding.unitCost*multiplier);
 const offer={holdingId:holding.id,price};
 const result=CareerLearningRules.atomic(state,()=>{move.marketQuote=offer;return {};},save);
 return result.ok?offer:null;
}
function openTownMarketTrade(move,dealId,quote=null){
 if(townOpportunityMove()!==move)return;
 const deal=TOWN_MARKET_DEALS[dealId];
 const selling=!!quote;
 const holding=selling?townMarketHoldings().find(h=>h.id===quote.holdingId):null;
 if(!deal||(selling&&(!holding||move.marketQuote!==quote)))return;
 const owner=state,chosenSlot=slot,offer=move.offers;
 const valid=()=>state===owner&&slot===chosenSlot&&townOpportunityMove()===move&&
  (selling?move.marketQuote===quote&&!move.offers:move.offers===offer&&!offer.resolved);
 const alreadyOwned=!selling&&!deal.unit&&townMarketHoldings().some(item=>item.deal===dealId);
 const cashPrice=selling?quote.price:(deal.down??deal.price);
 const limit=deal.unit?(selling?holding.quantity:deal.limit):1;
 let quantity=deal.unit?Math.min(limit,selling?limit:Math.max(1,Math.floor(state.cash/cashPrice)),deal.unit==='股'?20:10):1;
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
     townMarketHoldings().push({id:move.id,moveId:move.id,deal:dealId,unitCost:deal.price,quantity,debt:deal.price-(deal.down??deal.price)});
    }
    if(selling)(state.financeLedger??=[]).push({kind:amount()<0?'opportunity':'opportunityIncome',month:state.month,amount:Math.abs(amount()),offer:dealId});
   }
   move.offers={month:state.month,pool:'map-market',deck:offer?.deck,ids:[dealId],resolved:acceptTrade?accept:decline};
   move.resolved=true;
   move.completedMonth=state.month;
   townState().history.push({id:move.id,die:move.die,to:move.to,month:state.month,type:townMoveType(move),offerId:dealId,outcome:move.offers.resolved});
   return {};
  },save);
  if(!result.ok){
   openTownOpportunity(result.reason);
   $('eventDesc').textContent=result.reason;
   return;
  }
  finish();
 }
 showEvent('地图专用',title,'',[],[[accept,()=>settle(true),true],[decline,()=>settle(false),false]]);
 const data=$('eventData');
 const art='assets/finance/map-'+dealId+(selling?'-sell':'-buy')+'.webp';
 data.innerHTML='<div class="town-opportunity town-market-card"><img class="town-opportunity-art" src="'+art+'" alt=""><h3>'+deal.name+'</h3><dl></dl></div>';
 data.style.display='block';
 const list=data.querySelector('dl');
 const action=$('actions');
 function row(label,value){
  const block=document.createElement('div'),term=document.createElement('dt'),detail=document.createElement('dd');
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
   row((selling?'卖出':'买入')+(deal.unit==='股'?'股数':'份数'),control);
  }else if(selling){
   if(deal.share){row('出售份额',deal.share+'%');row('原入股金额',priceText(holding.unitCost));}
   row('买家出价',priceText(quote.price));
   if(holding.debt)row(deal.type==='出租房'?'剩余房贷':'剩余贷款',priceText(holding.debt));
  }else if(deal.share){
   row('入股金额',priceText(deal.price));row('持有份额',deal.share+'%');row('预计月分成','$0–$'+deal.maximum);
  }else{
   row(deal.type==='出租房'?'房屋总价':'商铺总价',priceText(deal.price));row('本次首付',priceText(deal.down));
   row('每月租金',priceText(deal.rent));row('每月净租金',priceText(deal.net));
  }
  if(selling){
   if(!deal.share)row(amount()<0?'需补差额':'一共到账',priceText(Math.abs(amount())));
   row(profit()<0?'本次净亏':profit()>0?'本次净赚':'本次盈亏',priceText(Math.abs(profit())));
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
   deal.share?deal.share+'% · 预计月分成 $0–$'+deal.maximum:'每月净租金 '+priceText(deal.net);
  return [deal.name,detail];
 });
 showEvent('地图专用','地图持仓','',rows.length?rows:[['目前没有地图持仓','—']],[['返回',back,true]]);
}
