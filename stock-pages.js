(function(){
 const stocks=()=>V26_INSTRUMENTS.filter(item=>item.kind==='股票');
 const unit=item=>item.kind==='基金'?'份':'股';
 const formatShares=(item,shares)=>shares.toLocaleString('en-US',{maximumFractionDigits:6})+' '+unit(item);
 const iconPositions=['42.8%','51.5%','59.9%','68.7%','77.4%'];
 const buyArtwork={
  nova:'窗边书桌上，复古电脑的屏幕亮着芯片图案',
  harbor:'社区杂货铺的果篮、牛奶和购物袋',
  blue:'山坡上的风力涡轮和太阳能板',
  orbit:'小镇配送车、包裹和路线图',
  care:'诊所窗边的急救箱和听诊器'
 };
 const openingSamples={
  nova:[91,94,92,97,103,96,93,98,104,102,98],
  harbor:[94,95,93,94,97,98,96,99,101,100,99],
  blue:[105,108,101,96,93,97,103,107,105,104,102],
  orbit:[94,90,92,96,100,96,92,94,98,99,97],
  care:[92,93,95,94,96,98,98,99,100,102,101]
 };

 function position(item){
  const lots=state.assets.filter(asset=>asset.instrument===item.id && asset.shares>0);
  const shares=lots.reduce((sum,lot)=>sum+lot.shares,0);
  const cost=roundCash(lots.reduce((sum,lot)=>sum+lot.cost,0));
  const value=roundCash(lots.reduce((sum,lot)=>sum+holdingValue(lot),0));
  return {lots,shares,cost,value,profit:roundCash(value-cost)};
 }

 function stockChart(item){
  const history=quoteFor(item.id).history.slice(-12);
  // Extend short histories with illustrative pre-game prices, never used for trading.
  const first=history[0];
  const missing=12-history.length;
  const opening=(openingSamples[item.id]||openingSamples.nova).slice(11-missing).map((price,i)=>({
   month:first.month-missing+i,price:roundCash(first.price*price/100)
  }));
  return '<div class="stock-chart">'+quoteChart({history:[...opening,...history]})+
   '<small>近 12 个月'+(missing?' · 含开局前记录':'')+'</small></div>';
 }

 function page(title,description,rows,actions,back,item,chart=false,kind=item?.kind??'股票',stage=item?'position':'holdings'){
  showEvent(kind+'投资',title,description,rows,actions);
  if($('eventTitle').textContent!==title)return null;
  window.modalReturn=back;
  const data=$('eventData');
  if(kind==='基金'){
   window.FundPages.decorateManagement(item,stage);
   data.style.display='grid';
   return data;
  }
  const header=document.createElement('div');
  header.className='stock-header';
  header.innerHTML=item?'<span class="stock-icon" style="--stock-icon-y:'+iconPositions[stocks().indexOf(item)]+'"></span>':
   '<span class="stock-art"></span>';
  if(chart)header.insertAdjacentHTML('beforeend',stockChart(item));
  data.prepend(header);
  data.style.display='grid';
  return data;
 }

 function open(back=finish,extraActions=[]){
  const market=()=>open(back,extraActions);
  const holdings=()=>showHoldings(market);
  const items=stocks();
  if(!page('股票品种','股票行情',[],[
   ...items.map(item=>[item.name,()=>trade(item,market,holdings,'buy'),false]),
   ...extraActions,['管理投资持仓',holdings,false],['返回储蓄与投资',back,true]
  ],back))return;
  const buttons=[...$('actions').children];
  items.forEach((item,index)=>{
   const quote=quoteFor(item.id);
   const button=buttons[index];
   button.classList.add('stock-market-row');
   const icon=document.createElement('span');
   icon.className='stock-icon';
   icon.style.setProperty('--stock-icon-y',iconPositions[index]);
   icon.setAttribute('aria-hidden','true');
   const values=document.createElement('small');
   values.textContent=priceText(quote.price)+' · '+signedPercent(quote.price/quote.previous-1);
   button.prepend(icon);
   button.append(values);
  });
  if(items.length===5&&!extraActions.length)illustrateMarket(items,buttons);
 }

 function illustrateMarket(items,buttons){
  const actions=$('actions');
  if(buttons.length!==items.length+2)return;
  const picture=document.createElement('img');
  picture.width=1024;
  picture.height=1536;
  picture.alt='股票品种';
  picture.onload=()=>{
   if(buttons.some(button=>button.parentElement!==actions))return;
   const frame=document.createElement('div');
   frame.className='stock-market-art';
   frame.append(picture);
   buttons.forEach((button,index)=>{
    const item=items[index];
    const label=button.getAttribute('aria-label')||button.textContent;
    button.className=item?'stock-quote-hotspot':'stock-nav-hotspot';
    button.replaceChildren();
    if(item){
     const quote=quoteFor(item.id);
     const price=document.createElement('b');
     const change=document.createElement('small');
     price.textContent=priceText(quote.price);
     change.textContent=signedPercent(quote.price/quote.previous-1);
     button.setAttribute('aria-label',item.name+'，'+price.textContent+'，较上月 '+change.textContent);
     button.append(price,change);
    }else button.setAttribute('aria-label',label);
    frame.append(button);
   });
   $('eventData').replaceChildren(frame);
   $('eventData').style.display='block';
  };
  picture.src='assets/finance/stock-market-scene.webp';
 }

 function showHoldings(market,kind='股票'){
  const reopen=()=>showHoldings(market,kind);
  const held=V26_INSTRUMENTS.filter(item=>item.kind===kind).map(item=>({item,...position(item)})).filter(p=>p.shares>0);
  if(!page(kind==='基金'?'管理基金持仓':'管理投资持仓',held.length?kind+'持仓':'暂无'+kind+'持仓。',[
   ['持仓总市值',priceText(held.reduce((sum,p)=>sum+p.value,0))],
   ['浮动盈亏',priceText(held.reduce((sum,p)=>sum+p.profit,0))]
  ],[...held.map(p=>[
   p.item.name+' · 持有 '+formatShares(p.item,p.shares),()=>showPosition(p.item,market,reopen),false
  ]),['返回'+kind+'品种',market,true]],market,undefined,false,kind))return;
  const buttons=[...$('actions').children];
  held.forEach((p,index)=>{
   const note=document.createElement('small');
   note.textContent='当前价格 '+priceText(quoteFor(p.item.id).price)+' · 市值 '+priceText(p.value)+
    ' · 成本 '+priceText(p.cost)+' · 浮动盈亏 '+priceText(p.profit);
   buttons[index].append(note);
   if(kind==='股票')buttons[index].insertAdjacentHTML('beforeend',stockChart(p.item));
  });
 }

 function showPosition(item,market,holdings){
  const sharesText=shares=>formatShares(item,shares);
  const p=position(item);
  if(!p.shares)return holdings();
  page(item.name+' · '+item.kind+'持仓','',[
   ['当前价格',priceText(quoteFor(item.id).price)],['当前持有',sharesText(p.shares)],
   ['持仓市值',priceText(p.value)],['持仓成本',priceText(p.cost)],
   ['浮动盈亏',priceText(p.profit)],['平均买入价',priceText(p.cost/p.shares)]
  ],[['增仓',()=>trade(item,market,holdings,'add'),true],
   ['减仓',()=>trade(item,market,holdings,'sell'),false],
   ['全部卖出',()=>trade(item,market,holdings,'all'),false],['返回持仓',holdings,false]],holdings,item,true);
 }

 function saleParts(lots,shares){
  const parts=[];
  for(const lot of lots){
   if(shares<=0)break;
   const sold=Math.min(shares,lot.shares);
   const full=sold===lot.shares||lot.shares-sold<1e-10;
   const cost=full?lot.cost:roundCash(lot.cost*sold/lot.shares);
   parts.push({lot,sold,cost,full});
   shares-=sold;
  }
  return parts;
 }

 function trade(item,market,holdings,mode){
  const sharesText=shares=>formatShares(item,shares);
  const shareLabel=item.kind==='基金'?'份额':'股数';
  const all=mode==='all',selling=all||mode==='sell',adding=mode==='add';
  const back=mode==='buy'?market:()=>showPosition(item,market,holdings);
  const reopen=()=>trade(item,market,holdings,mode);
  const owner=state, month=state.month, quote=quoteFor(item.id), price=quote.price;
  const p=position(item);
  if(selling&&!p.shares)return back();
  const title=mode==='buy'?item.name:(all?'全部卖出':selling?'减仓':'增仓')+' · '+item.name;
  const rows=[['当前价格',priceText(price)],['当前持有',sharesText(p.shares)]];
  const proceeds=roundCash(p.shares*price);
  if(!selling)rows.push(['可用现金',priceText(state.cash)]);
  if(all)rows.push(['预计到账',priceText(proceeds)],['预计实现盈亏',priceText(roundCash(proceeds-p.cost))],
   ['卖出后持有',sharesText(0)],['卖出后现金',priceText(roundCash(state.cash+proceeds))]);
  if(mode==='buy')rows.push(['较上月',signedPercent(price/quote.previous-1)],
   ['持仓市值',priceText(p.value)],['持仓成本',priceText(p.cost)],['浮动盈亏',priceText(p.profit)]);
  const artwork=mode==='buy'?buyArtwork[item.id]:null;
  const confirm=all?'确认全部卖出':selling?'确认减仓':adding?'确认增仓':'确认买入';
  let input,estimate,done=false;
  const data=page(title,all?'成交后，这只'+item.kind+'的持仓将清空。':selling?'按买入顺序扣减持仓。':artwork?'':item.desc,rows,[[confirm,()=>{
   if(done||state!==owner)return;
   const current=position(item);
   if(state.month!==month||quoteFor(item.id).price!==price||current.shares!==p.shares||
    current.cost!==p.cost||current.lots.length!==p.lots.length||current.lots.some((lot,index)=>lot!==p.lots[index]))return reopen();
   const transaction=all?{amount:proceeds,shares:p.shares,parts:p.lots.map(lot=>({lot,full:true})),cost:p.cost}:read();
   if(!transaction)return;
   const {amount,shares,parts,cost}=transaction;
   const previous=structuredClone(state);
   if(selling){
    for(const part of parts){
     if(part.full)state.assets.splice(state.assets.indexOf(part.lot),1);
     else{
      part.lot.shares-=part.sold;
      part.lot.cost=roundCash(part.lot.cost-part.cost);
      part.lot.value=roundCash(part.lot.shares*price);
     }
    }
    state.cash=roundCash(state.cash+amount);
    (state.financeLedger??=[]).push({kind:'assetSale',month,amount,instrument:item.id,shares,price,cost});
   }else if(!buyUnits(item.id,amount))return;
   try{
    if(save()===false)throw Error('save failed');
   }catch{
    state=previous;
    reopen();
    $('eventDesc').textContent='交易未保存，请重试。';
    return;
   }
   done=true;
   showReceipt(item,market,holdings,mode,transaction,price);
  },true,!all],[mode==='buy'?'返回股票品种':'返回持仓',back,false],
   ...(mode==='buy'?[['取消',finish,false]]:[])],back,item,true,item.kind,mode==='sell'?'reduce':mode);
  if(!data||all)return;
  if(artwork){
   const header=data.querySelector('.stock-header');
   const art=document.createElement('img');
   art.className='stock-buy-art';
   art.src='assets/finance/'+item.id+'-buy-crayon.webp';
   art.alt=artwork;
   art.width=820;
   art.height=244;
   header.querySelector('.stock-icon').replaceWith(art);

   const [priceRow, , , changeRow]=data.querySelectorAll(':scope > .stat');
   const priceBand=document.createElement('div');
   priceBand.className='stock-buy-price';
   priceBand.append(priceRow,changeRow);
   header.querySelector('.stock-chart').before(priceBand);
   header.classList.add('stock-buy-header');
  }
  const form=document.createElement('div');
  form.className='stock-form';
  form.innerHTML='<label for="stockTradeAmount">'+(selling?'本次卖出'+shareLabel:'本次投入金额')+'</label>'+
   '<input id="stockTradeAmount" type="number" inputmode="decimal" min="'+(selling?'0.000001':'0.01')+
   '" step="'+(selling?'0.000001':'0.01')+'"><p role="status"></p>';
  data.append(form);
  input=form.querySelector('input');
  estimate=form.querySelector('p');
  input.value=selling?(p.shares>1?1:Math.floor(p.shares*500000)/1000000).toFixed(6):Math.max(0,Math.min(adding?100:200,state.cash)).toFixed(2);
  input.addEventListener('input',update);
  update();

  function read(){
   const value=input.valueAsNumber;
   if(!input.checkValidity()||!Number.isFinite(value)||value<=0)return null;
   if(!selling)return value<=state.cash?{amount:value,shares:value/price}:null;
   if(p.shares-value<=0.0000005)return null;
   const shares=value;
   const amount=roundCash(shares*price);
   if(amount<=0)return null;
   const parts=saleParts(p.lots,shares);
   const cost=roundCash(parts.reduce((sum,part)=>sum+part.cost,0));
   return {shares,amount,parts,cost};
  }
  function update(){
   const result=read();
   $('actions').firstElementChild.disabled=!result;
   if(!result){
    estimate.textContent=selling?'请输入小于当前持仓的'+shareLabel+'。清仓请使用「全部卖出」。':'请输入可负担且最多两位小数的正金额。';
    return;
   }
   const {amount,shares,cost}=result;
   if(artwork){
    estimate.replaceChildren(
     '预计买入 '+sharesText(shares)+' · 买入后持有 '+sharesText(p.shares+shares),
     document.createElement('br'),
     '买入后现金 '+priceText(roundCash(state.cash-amount))
    );
    return;
   }
   estimate.textContent=selling?
    '预计到账 '+priceText(amount)+' · 减仓后持有 '+sharesText(p.shares-shares)+' · 预计实现盈亏 '+priceText(roundCash(amount-cost)):
    '预计买入 '+sharesText(shares)+' · 买入后持有 '+sharesText(p.shares+shares)+' · 买入后现金 '+priceText(roundCash(state.cash-amount));
  }
 }

 function showReceipt(item,market,holdings,mode,transaction,price){
  const sharesText=shares=>formatShares(item,shares);
  const shareLabel=item.kind==='基金'?'份额':'股数';
  const {amount,shares,cost}=transaction;
  const selling=mode==='sell'||mode==='all';
  const p=position(item);
  const fundPurchase=item.kind==='基金'&&mode==='buy';
  const receiptTitle=fundPurchase?'买入成功':item.name;
  const next=fundPurchase?()=>showPosition(item,market,holdings):holdings;
  const result=page(receiptTitle,fundPurchase?item.name+' · 已记入收支账单':mode==='all'?'卖出成功 · 已记入收支账单':selling?'减仓成功':mode==='add'?'增仓成功':'买入成功',[
   ['成交价格',priceText(price)],[(selling?'卖出':'买入')+shareLabel,sharesText(shares)],
   [selling?'实际到账':'本次成交金额',priceText(amount)],['成交后现金',priceText(state.cash)],
   [selling?'剩余持有':'持仓市值',selling?sharesText(p.shares):priceText(p.value)],[selling?'实现盈亏':'浮动盈亏',priceText(selling?roundCash(amount-cost):p.profit)]
  ],[[fundPurchase?'查看持仓':item.kind==='基金'?'管理基金持仓':'管理投资持仓',next,true],['返回'+item.kind+'品种',market,false]],holdings,item,true);
  result?.querySelector('.stock-header')?.classList.add('stock-receipt');
 }

 function showFundBuyReceipt(item,market,amount,price){
  const holdings=()=>showHoldings(market,'基金');
  showReceipt(item,market,holdings,'buy',{amount,shares:amount/price},price);
 }

 window.StockPages={open,showFundBuyReceipt,showFundHoldings:market=>showHoldings(market,'基金')};
})();
