(() => {
 const art = key => '<img class="etf-art" alt="" src="./assets/etf/' + key + '.webp">';
 const etfs = () => V26_INSTRUMENTS.filter(item => item.kind === 'ETF');
 const defaultList = () => openMarket('ETF');
 const illustratedCards = [
  ['us500','跟踪约500家本国大型公司',151,462,336,305,731],
  ['ustotal','覆盖本国大、中、小型公司',505,462,335,305,731],
  ['international','仅海外，覆盖发达与新兴市场',151,779,336,298,1044],
  ['world','本国＋海外，一只覆盖全球股市',505,779,335,298,1044],
  ['smallcap','聚焦本国小型公司，波动较大',151,1089,336,294,1345],
  ['emerging','聚焦新兴市场，波动较大',505,1089,335,294,1345]
 ];

 function showList(footer = state.roomLocation === 'home' && window.openRoom ? window.openRoom : finish, illustrated=false) {
  if(illustrated)return showIllustratedList(footer);
  showEvent('ETF投资', 'ETF 品种', '', [], [['返回', footer, false]]);
  if(footer!==finish)window.modalReturn=footer;
  $('eventData').innerHTML = art('market') + '<div class="wl-mini-grid etf-paper">' + etfs().map(item => {
   const q = quoteFor(item.id);
   return '<button class="wl-choice-card etf-card" data-v26="market" data-key="' + item.id +
    '"><strong>' + item.name + '</strong><b>' + priceText(q.price) + '</b><small>' +
    (q.history.length > 1 ? '本月 ' + signedPercent(q.price / q.previous - 1) : '开局报价') +
    '</small>' + quoteChart(q) + '</button>';
  }).join('') + '</div>';
 }

 function showIllustratedList(footer) {
  const reopen=()=>showList(footer,true);
  const products=illustratedCards.map(([id,intro,x,y,width,height,baseline])=>
   ({item:etfs().find(product=>product.id===id),intro,x,y,width,height,baseline}));
  showEvent('ETF投资','ETF 品种','',[],[
   ...products.map(({item})=>[item.name,()=>showDetail(item,reopen),false]),
   ['返回储蓄与投资',footer,false]
  ]);
  if($('eventTitle').textContent!=='ETF 品种')return;
  window.modalReturn=footer;
  $('eventTitle').closest('.event').classList.add('finance-etf');
  const buttons=[...$('actions').children];
  for(const [index,product] of products.entries()){
   const button=buttons[index];
   const price=priceText(quoteFor(product.item.id).price);
   button.classList.add('etf-product-hotspot');
   button.style.left=product.x/1024*100+'%';
   button.style.top=product.y/1536*100+'%';
   button.style.width=product.width/1024*100+'%';
   button.style.height=product.height/1536*100+'%';
   button.style.setProperty('--etf-price-top',(product.baseline-product.y)/product.height*100+'%');
   button.setAttribute('aria-description',product.intro+'。当前价格 '+price);
   const value=document.createElement('span');
   value.className='etf-product-price';
   value.setAttribute('aria-hidden','true');
   value.textContent=price;
   button.append(value);
  }
  buttons.at(-1).classList.add('etf-product-back');
 }

 function position(id) {
  const lots = state.assets.filter(asset => asset.instrument === id);
  return {
   lots,
   shares: lots.reduce((sum, asset) => sum + asset.shares, 0),
   cost: lots.reduce((sum, asset) => sum + asset.cost, 0),
   value: lots.reduce((sum, asset) => sum + asset.value, 0)
  };
 }
 function sp500Chart(history,price,month) {
  const records=(history||[]).filter(row=>Number.isFinite(row.price)&&row.price>0&&Number.isInteger(row.month)).slice(-13);
  const points=records.length?records:[{price,month}];
  const low=Math.min(...points.map(point=>point.price));
  const high=Math.max(...points.map(point=>point.price));
  const range=Math.max(high-low,high*.025,.02);
  const interval=range/2;
  const unit=10**Math.floor(Math.log10(interval));
  const step=([1,2,2.5,5,10].find(tick=>tick*unit>=interval)||10)*unit;
  const floor=Math.max(0,Math.floor((low-range*.08)/step)*step);
  const ceiling=Math.max(floor+step,Math.ceil((high+range*.05)/step)*step);
  const x=point=>points.length===1?374:74+point*575/(points.length-1);
  const y=value=>228-(value-floor)/(ceiling-floor)*206;
  const divisions=Math.round((ceiling-floor)/step);
  const grid=Array.from({length:divisions+1},(_,index)=>{
   const value=floor+index*step, height=y(value);
   const label=value>=1?'$'+Number(value.toFixed(2)).toLocaleString('en-US'):priceText(value);
   return '<path d="M74 '+height+'H649" class="sp500-grid-line"/>'+
    '<text x="66" y="'+(height+7)+'" text-anchor="end">'+label+'</text>';
  }).join('');
  const ticks=points.map((point,index)=>'<path class="sp500-grid-line" d="M'+x(index)+' 22V228"/>').join('');
  const axisIndices=[...new Set([0,Math.floor((points.length-1)/3),Math.floor((points.length-1)*2/3),points.length-1])];
  const monthLabel=point=>point.simulatedOpening?'前'+Math.abs(point.month)+'月':(point.month%12+1)+'月';
  const labels=axisIndices.map(index=>'<text x="'+x(index)+'" y="263" text-anchor="middle">'+monthLabel(points[index])+'</text>').join('');
  const circles=points.map((point,index)=>{
   const label=point.simulatedOpening?'开局前 '+Math.abs(point.month)+' 个月'+
    (point.referenceDate?'（基准 '+point.referenceDate+'）':''):
    '第 '+(Math.floor(point.month/12)+1)+' 年第 '+(point.month%12+1)+' 月';
   return '<circle cx="'+x(index)+'" cy="'+y(point.price)+'" r="'+(index===points.length-1?6.5:4.4)+
    '"><title>'+label+' '+priceText(point.price)+'</title></circle>';
  }).join('');
  const trend=points.length>1?'<polyline points="'+points.map((point,index)=>x(index)+','+y(point.price)).join(' ')+'"/>':'';
  const annotation=points.length===1?'<text class="sp500-single-point" x="374" y="61" text-anchor="middle">开局仅有 1 个价格点</text>':'';
  const caption=points.some(point=>point.simulatedOpening)?
   '<text x="649" y="299" text-anchor="end">含开局前记录</text>':'';
  return '<svg class="sp500-chart" viewBox="0 0 675 '+(caption?310:282)+'" role="img" aria-label="价格走势，'+points.length+' 个价格点">'+
   grid+ticks+'<path class="sp500-axis" d="M74 22V228H649"/>'+labels+trend+circles+annotation+caption+'</svg>';
 }

 function renderIllustratedDetail(id,q,held,cumulative,dividend,openingNote){
  const event=$('eventTitle').closest('.event');
  event.classList.add('finance-sp500');
  event.dataset.etfDetail = id;
  const data=$('eventData');
  const change=q.history.length>1?'较上月 '+signedPercent(q.price/q.previous-1):'开局报价';
  const metrics=[
   ['price','当前价格',priceText(q.price)],['change','价格变化',change],['value','持仓市值',priceText(held.value)],
   ['shares','持有份额',held.shares.toFixed(6)],['cumulative','累计分红',priceText(cumulative)],
   ['dividend','预估下期分红',priceText(dividend)]
  ];
  data.innerHTML='<dl class="sp500-values">'+metrics.map(([key,label,value])=>
   '<div class="sp500-'+key+'"><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl>'+
   sp500Chart(q.history,q.price,state.month)+
   '<p class="sp500-reader-label">'+batchEscape(openingNote)+'。买入成本 '+priceText(held.cost)+
   '，浮动盈亏 '+priceText(held.value-held.cost)+'。分红预估会随价格和持仓变化。</p>';
  data.style.display='block';
 }

 function showDetail(item,backToList=defaultList) {
  const id = item.id, q = quoteFor(id), held = position(id);
  const cumulative = (state.financeLedger || []).filter(row => row.kind === 'dividend' && row.instrument === id)
   .reduce((sum, row) => sum + row.amount, 0);
  const perShare = roundCash(q.price * ETF_YIELDS[id] / 12);
  const opening = q.benchmark;
  const initialNote = opening && opening.closeDate.slice(0, 7) !== opening.target
   ? '开局参考 ' + opening.symbol + ' · ' + opening.closeDate + ' 收盘（本版本最新已收录月份）'
   : opening ? '开局参考 ' + opening.symbol + ' · ' + opening.closeDate + ' 收盘' : '当前报价';
  showEvent('ETF投资', item.name, item.desc, [], [
   ['买入', () => showBuy(item,backToList), true, state.cash <= 0],
   ['卖出', () => showHoldings(item,backToList), false, !held.lots.length],
   ['定投与分红', () => openInvestSettings(id,()=>showDetail(item,backToList)), false],
   ['返回品种列表', backToList, false]
  ]);
  if($('eventTitle').textContent!==item.name)return;
  window.modalReturn=backToList;
  renderIllustratedDetail(id,q,held,cumulative,roundCash(held.shares*perShare),initialNote);
 }

 function renderTradeScene(data,item,mode) {
  data.closest('.event').classList.add('finance-sp500','finance-etf-'+mode);
  if(item.id==='us500')return;
  const name=document.createElement('p');
  name.className='etf-trade-name';
  if(item.id==='international')name.classList.add('etf-trade-name-long');
  name.textContent=item.name;
  data.append(name);
 }

 function showBuy(item,backToList) {
  const id = item.id;
  const price = quoteFor(id).price;
  const back = () => showDetail(item,backToList);
  showEvent('ETF买入', item.name, '', [], [
   ['确认买入', () => {
    const amount = Number($('etfBuyAmount').value);
    if (!validAmount(amount)||quoteFor(id).price!==price) return showBuy(item,backToList);
    const previous = JSON.parse(JSON.stringify(state));
    if (!buyUnits(id, amount)) return showBuy(item,backToList);
    try { if(save()===false)throw Error('save failed'); } catch (error) {
     state = previous;
     console.error('ETF order save failed', error);
     showBuy(item,backToList);
     $('etfBuyEstimate').classList.remove('sp500-reader-label');
     $('etfBuyEstimate').textContent = '订单尚未存档，请重试。';
     return;
    }
    showBuyReceipt(item,amount,price,back);
   }, true],
   ['返回详情', back, false]
  ]);
  if($('eventTitle').textContent!==item.name)return;
  window.modalReturn=back;
  const inputMarkup='<label for="etfBuyAmount">金额（美元）</label><input id="etfBuyAmount" type="number" inputmode="decimal" min="0.01" step="0.01" value="' +
   Math.min(200, Math.max(0, state.cash)).toFixed(2) + '">';
  const data=$('eventData');
  data.innerHTML='<dl class="etf-buy-values">'+
   '<div class="etf-buy-quote"><dt>当前价格</dt><dd>'+priceText(price)+' / 份</dd></div>'+
   '<div class="etf-buy-cash"><dt>可用现金</dt><dd>'+priceText(state.cash)+'</dd></div>'+
   '<div class="etf-buy-shares"><dt>预计买入份额</dt><dd id="etfBuyShares"></dd></div>'+
   '<div class="etf-buy-remaining"><dt>买入后现金</dt><dd id="etfBuyRemaining"></dd></div>'+
   '</dl><div class="etf-buy-input"><span aria-hidden="true">$</span>'+inputMarkup+
   '</div><p id="etfBuyEstimate" aria-live="polite"></p>';
  data.style.display='block';
  renderTradeScene(data,item,'buy');
  function validAmount(amount) {
   return Number.isFinite(amount) && amount > 0 && amount <= state.cash && Math.abs(Math.round(amount * 100) - amount * 100) < 0.00001;
  }
  function update() {
   const amount = Number($('etfBuyAmount').value), valid = validAmount(amount);
   $('actions').firstElementChild.disabled = !valid;
   const estimate=$('etfBuyEstimate');
   const shares=valid?(amount/price).toFixed(6)+' 份':'—';
   const remaining=valid?priceText(roundCash(state.cash-amount)):'—';
   estimate.textContent=valid?'预计买入 '+shares+' · 剩余现金 '+remaining:'请输入可承担的金额，最多两位小数。';
   $('etfBuyShares').textContent=shares;
   $('etfBuyRemaining').textContent=remaining;
   estimate.classList.toggle('sp500-reader-label',valid);
  }
  $('etfBuyAmount').oninput = update;
  update();
 }

 function showBuyReceipt(item,amount,price,back){
  showEvent('ETF买入','买入成功',item.name+'。已记入持仓和收支账单。',[],[
   ['查看持仓',window.openFinanceAssets||back,true],
   ['返回详情',back,false]
  ]);
  if($('eventTitle').textContent!=='买入成功')return;
  window.modalReturn=back;
  const data=$('eventData');
  const rows=[
   ['成交金额',priceText(amount)],['成交价格',priceText(price)+' / 份'],
   ['买入份额',(amount/price).toFixed(6)+' 份'],['剩余现金',priceText(state.cash)]
  ];
  data.innerHTML='<dl class="etf-buy-values etf-receipt-values">'+rows.map(([label,value])=>
   '<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl>';
  data.style.display='block';
  renderTradeScene(data,item,'receipt');
 }

 function showHoldings(item,backToList) {
  const back = () => showDetail(item,backToList);
  const { lots } = position(item.id);
  showEvent('ETF卖出', item.name, '', [], [['返回详情', back, false]]);
  $('eventData').innerHTML = art('detail') + '<div class="etf-paper" id="etfSellLots"></div>';
  for (const lot of lots) {
   const choice = document.createElement('button');
   choice.className = 'wl-choice-card etf-card';
   choice.textContent = lot.shares.toFixed(6) + ' 份 · 当前市值 ' + priceText(lot.value);
   choice.disabled=lot.value<.01;
   choice.onclick=()=>showSellAmount(item,lot.id,backToList);
   $('etfSellLots').appendChild(choice);
  }
 }

 function showSellAmount(item,assetId,backToList){
  const back=()=>showHoldings(item,backToList);
  const lot=state.assets.find(asset=>asset.id===assetId&&asset.instrument===item.id);
  if(!lot)return back();
  const price=quoteFor(item.id).price;
  const maximum=roundCash(lot.value);
  const title='卖出 ETF';
  showEvent('ETF卖出',title,'',[
   ['ETF 品种',item.name],['当前价格',priceText(price)+' / 份'],['本笔可卖金额',priceText(maximum)]
  ],[
   ['确认卖出',()=>{
    const amount=input.valueAsNumber;
    const index=state.assets.indexOf(lot);
    if(index<0||!input.checkValidity()||quoteFor(item.id).price!==price||
     roundCash(lot.value)!==maximum)return showSellAmount(item,assetId,backToList);
    const soldShares=sharesFor(amount);
    const cost=roundCash(lot.cost*soldShares/lot.shares);
    const previous=structuredClone(state);
    state.cash=roundCash(state.cash+amount);
    if(amount===maximum)state.assets.splice(index,1);
    else{
     lot.shares-=soldShares;
     lot.cost=roundCash(lot.cost-cost);
     lot.value=roundCash(maximum-amount);
    }
    (state.financeLedger??=[]).push({kind:'assetSale',month:state.month,amount,
     assetId,instrument:item.id,shares:soldShares,price,cost});
    try{if(save()===false)throw Error('save failed')}catch(error){
     state=previous;
     showSellAmount(item,assetId,backToList);
     $('etfSellEstimate').classList.remove('sp500-reader-label');
    $('etfSellEstimate').textContent='卖出未保存，请重试。';
     return;
    }
    const detail=()=>showDetail(item,backToList);
    showEvent('ETF卖出','卖出成功','已记入持仓和收支账单。',[
     ['卖出份额',soldShares.toFixed(6)+' 份'],['实际到账',priceText(amount)],
     ['该笔剩余市值',priceText(maximum-amount)]
    ],[['返回详情',detail,true]]);
    if($('eventTitle').textContent==='卖出成功')window.modalReturn=detail;
   },true,true],
   ['返回持仓',back,false]
  ]);
  if($('eventTitle').textContent!==title)return;
  window.modalReturn=back;
  const data=$('eventData');
  const inputMarkup='<label for="etfSellAmount">卖出金额（美元）</label>'+
   '<input id="etfSellAmount" type="number" inputmode="decimal" min="0.01" step="0.01" required>';
  const maxMarkup='<button type="button" id="etfSellMax">卖出整笔</button>';
  const estimateMarkup='<p id="etfSellEstimate" aria-live="polite"></p>';
  const values=[
   ['etf-sell-quote','当前价格',priceText(price)+' / 份'],
   ['etf-sell-max','本笔可卖金额',priceText(maximum)],
   ['etfSellShares','预计卖出份额','—'],
   ['etfSellCash','预计到账','—'],
   ['etfSellRemaining','该笔剩余市值','—']
  ];
  data.innerHTML='<dl class="etf-buy-values etf-sell-values">'+values.map(([key,label,value])=>
   '<div class="'+key+'"><dt>'+label+'</dt><dd id="'+key+'">'+value+'</dd></div>').join('')+
   '</dl><div class="etf-buy-input"><span aria-hidden="true">$</span>'+inputMarkup+'</div>'+maxMarkup+estimateMarkup;
  renderTradeScene(data,item,'sell');
  data.style.display='block';
  const input=$('etfSellAmount');
  input.max=maximum.toFixed(2);
  const sharesFor=amount=>amount===maximum?lot.shares:amount/price;
  const update=()=>{
   const amount=input.valueAsNumber,valid=input.checkValidity();
   $('actions').firstElementChild.disabled=!valid;
   const shares=valid?sharesFor(amount).toFixed(6)+' 份':'—';
   const proceeds=valid?priceText(amount):'—';
   const remaining=valid?priceText(maximum-amount):'—';
   const estimate=$('etfSellEstimate');
   estimate.textContent=valid?'预计卖出 '+shares+' · 到账 '+proceeds+' · 该笔剩余市值 '+remaining:
    '请输入 '+priceText(.01)+' 至 '+priceText(maximum)+'，最多两位小数。';
   $('etfSellShares').textContent=shares;
   $('etfSellCash').textContent=proceeds;
   $('etfSellRemaining').textContent=remaining;
   estimate.classList.toggle('sp500-reader-label',valid||!input.value);
  };
  input.oninput=update;
  const maxButton=$('etfSellMax');
  maxButton.disabled=maximum<.01;
  maxButton.onclick=()=>{input.value=input.max;update()};
  update();
 }

 const settings = openInvestSettings;
 openInvestSettings = function (id,back) {
  const item = etfs().find(item => item.id === id);
  if (!item) return;
  const returnToDetail = back || (() => showDetail(item));
  settings(id, returnToDetail);
  const amount = $('batchAutoAmount');
  const reinvest = $('batchDrip');
  if (!amount || !reinvest) return;
  const data = $('eventData');
  window.modalReturn = returnToDetail;
  $('eventTitle').textContent = item.name + ' · 定投与分红';
  amount.setAttribute('aria-label', '每月买入金额（美元，填 0 停止）');
  amount.required = true;
  reinvest.hidden = true;
  data.replaceChildren(amount, reinvest);
  data.insertAdjacentHTML('beforeend',
   '<span class="etf-settings-dollar" aria-hidden="true">$</span>'+
   ''+
   '<div role="radiogroup" aria-label="分红去向，适用于所有 ETF">'+
   '<label class="etf-settings-choice"><input type="radio" name="etfDividend" value="reinvest"><span class="sp500-reader-label">自动再投资</span></label>'+
   '<label class="etf-settings-choice"><input type="radio" name="etfDividend" value="cash"><span class="sp500-reader-label">留在现金</span></label></div>');
  renderTradeScene(data,item,'settings');
  const choices = data.querySelectorAll('input[name="etfDividend"]');
  choices[reinvest.checked ? 0 : 1].checked = true;
  for (const choice of choices) {
   choice.addEventListener('change', () => { reinvest.checked = choices[0].checked; });
  }
  const saveButton = $('actions').firstElementChild;
  saveButton.textContent = '保存设置';
  saveButton.addEventListener('click', event => {
   if (amount.reportValidity()) return;
   event.stopImmediatePropagation();
  }, true);
 };
 window.ETFPages = { showList, showDetail };
})();
