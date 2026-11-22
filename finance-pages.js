(function(){
 const art = './assets/finance/';
 const eventCard = $('eventTitle').closest('.event');
 const previousShow = showEvent;
 showEvent = function(...args){
  delete eventCard.dataset.etfDetail;
  eventCard.classList.remove('finance-home','finance-bill','finance-assets','finance-savings','finance-emergency','finance-cd','finance-etf','finance-sp500','finance-etf-buy','finance-etf-receipt','finance-etf-sell','finance-etf-settings','finance-parchment','retirement-transaction');
  $('eventData').removeAttribute('tabindex');
  $('eventData').removeAttribute('aria-label');
  return previousShow(...args);
 };

 function positionActions(tiles,frameWidth,frameHeight){
   const buttons=$('actions').children;
   tiles.forEach(([, ,x,y,width,height],index)=>{
    const style=buttons[index].style;
    style.left=x/frameWidth*100+'%';
    style.top=y/frameHeight*100+'%';
    style.width=width/frameWidth*100+'%';
    style.height=height/frameHeight*100+'%';
   });
  }

 function renderCD(holdings){
  eventCard.classList.add('finance-cd');
  const values=$('eventData');
  const cash='<span class="cd-cash"><span class="cd-reader-label">可用现金 </span>'+priceText(state.cash)+'</span>';
  const quotes=CD_TERMS.map((months,index)=>{
   const rate=cdRate(months);
   const total=roundCash(CD_PRINCIPAL+CD_PRINCIPAL*rate*months/12);
   return '<div class="cd-quote cd-quote-'+index+'"><span class="cd-rate">'+(rate*100).toFixed(2)+
    '%</span><span class="cd-total">'+priceText(total)+'</span></div>';
  });
  values.innerHTML=cash+quotes.join('')+
   (holdings.length?'':'<p class="cd-empty">暂无定期存款</p>');
  values.style.display='block';
  const actions=$('actions');
  const buttons=[...actions.children];
  const back=buttons.pop();
  const tiles=[
   [null,null,149,640,226,316],[null,null,385,640,224,316],[null,null,617,640,227,316]
  ];
  positionActions(tiles,1024,1536);
  buttons.slice(0,3).forEach((button,index)=>{
   const months=CD_TERMS[index];
   const rate=cdRate(months);
   button.classList.add('cd-hotspot');
   button.setAttribute('aria-description','固定年利率 '+(rate*100).toFixed(2)+'%，到期 '+priceText(roundCash(CD_PRINCIPAL+CD_PRINCIPAL*rate*months/12)));
  });
  back.classList.add('cd-hotspot','cd-back');
  const list=document.createElement('div');
  list.className='cd-holdings';
  list.setAttribute('role','region');
  list.setAttribute('aria-label','我的定期存款');
  for(const button of buttons.slice(3))list.append(button);
  if(list.childElementCount)actions.insertBefore(list,back);
 }

 function open(openWealth,showAssets=false,goldBack){
  function page(title, rows, actions, back=home){
   showEvent('财务',title,'',rows,[...actions,['返回财务',back,false]]);
   if($('eventTitle').textContent===title)window.modalReturn=back;
  }

  function home(){
   const tiles=[
    ['收支账单','ledger',bills],
    ['资产总览','assets',assets],
    ['储蓄与投资','savings',savings],
    ['银行贷款与债务','bank',debt],
    ['保险与保障','insurance',insurance]
   ];
   showEvent('财务','财务','',[],[
    ...tiles.map(([title,,action])=>[title,action,false]),
    ['返回房屋',openRoom,false]
   ]);
   if($('eventTitle').textContent!=='财务')return;
   window.modalReturn=openRoom;
   eventCard.classList.add('finance-home');
   const data=$('eventData');
   data.innerHTML='<img class="finance-desk" src="'+art+'desk.webp" width="780" height="242" alt="">';
   data.style.display='block';
   for(const [index,[,image]] of tiles.entries()){
    const button=$('actions').children[index];
    const icon=document.createElement('img');
    icon.src=art+image+'.webp';
    icon.alt='';
    button.prepend(icon);
    if(image==='bank'){
     button.setAttribute('aria-label',tiles[index][0]);
     const label=document.createElement('span');
     label.append('银行贷款',document.createElement('br'),'与债务');
     button.replaceChildren(icon,label);
    }
   }
  }

  function lines(rows){
   return '<dl class="finance-bill-lines">'+rows.map(([label,amount,context])=>
    '<div><dt>'+batchEscape(label)+(context?'<small>'+batchEscape(context)+'</small>':'')+
    '</dt><dd>'+batchEscape(typeof amount==='number'?priceText(amount):amount)+'</dd></div>').join('')+'</dl>';
  }

  function section(title,rows,empty='暂无明细',headingArt=''){
   const heading=headingArt?'<h3 class="finance-asset-heading"><img src="'+art+'asset-'+headingArt+'.webp" alt="'+title+'"></h3>':'<h3>'+title+'</h3>';
   return '<section class="finance-bill-section">'+heading+
    (rows.length?lines(rows):'<p>'+empty+'</p>')+'</section>';
  }

  function illustration(name){
   return '<img src="'+art+'bill-'+name+'.webp" alt="">';
  }

  function highlight(label,amount,image,extra=''){
   return '<div class="finance-bill-highlight '+extra+'">'+illustration(image)+
    '<div><span>'+label+'</span><strong>'+priceText(amount)+'</strong></div></div>';
  }

  function detailRows(entries){
   return entries.map(row=>[row.label,row.uncategorized&&!row.reconciliation?priceText(row.amount)+'（方向未标注）':
    (row.amount>0?'+':'')+priceText(row.amount),row.context]);
  }

  function drawBill(content,label='账单明细，可纵向滚动'){
   eventCard.classList.add('finance-bill');
   const data=$('eventData');
   data.innerHTML=content;
   data.style.display='block';
   data.tabIndex=0;
   data.setAttribute('aria-label',label);
   data.scrollTop=0;
  }

  function forecastInvestingCash(metrics){
   const closingMonth=state.month+1;
   const maturities=[];
   const reinvestments=[];
   const purchases=[];
   const skipped=[];
   let cash=roundCash(state.cash+metrics.remainingCF);
   const distributions=expectedETFDistributions();
   const dividendTotal=distributions.reduce((sum,[,amount])=>sum+amount,0);
   const bonds=state.assets.filter(asset=>asset.kind==='bond');
   const bondInterest=bonds.reduce((sum,asset)=>sum+roundCash(asset.face*asset.coupon/12),0);
   // The recurring forecast includes these amounts. Apply them in settlement order.
   cash=roundCash(cash-dividendTotal-bondInterest);
   for(const asset of state.assets){
    if(asset.kind!=='cd'||!(asset.maturesAt<=closingMonth))continue;
    const amount=roundCash(asset.cost+(asset.interestAccrued||0)+asset.cost*asset.rate/12);
    maturities.push(['定期存款到期本息',amount,asset.name]);
    cash=roundCash(cash+amount);
   }
   for(const [id,amount] of distributions){
    cash=roundCash(cash+amount);
    if((state.dividendReinvest??true)&&cash>=amount){
     const name=V26_INSTRUMENTS.find(item=>item.id===id)?.name||id;
     reinvestments.push(['预计分红再投资',amount,name]);
     cash=roundCash(cash-amount);
    }
   }
   cash=roundCash(cash+bondInterest);
   for(const asset of bonds){
    if(!(asset.maturesAt<=closingMonth))continue;
    maturities.push(['债券到期还本',asset.face,asset.name]);
    cash=roundCash(cash+asset.face);
   }
   for(const [id,plan] of activeAutoInvestPlans()){
    const name=V26_INSTRUMENTS.find(item=>item.id===id)?.name||id;
    if(plan.amount>cash){
     skipped.push(['预计跳过定投',priceText(plan.amount),name+' · 现金不足']);
     continue;
    }
    const amount=roundCash(plan.amount);
    purchases.push(['预计定投',amount,name]);
    cash=roundCash(cash-amount);
   }
   return {cash,maturities,expenses:[...reinvestments,...purchases],skipped};
  }

  function bills(){
   const metrics=calcMetrics();
   const current=state.month;
   const raw=(state.financeLedger||[]).filter(row=>row.month===current);
   const opening=state.history?.at(-1)?.endCash??(state.turn?.month===current?state.turn.startCash:undefined);
   const entries=FinanceLedger.reconcile(FinanceLedger.receipts(raw),
    Number.isFinite(opening)?state.cash-opening:undefined);
   const totalFor=sign=>entries.reduce((sum,row)=>sum+(!row.uncategorized&&Math.sign(row.amount)===sign?Math.abs(row.amount):0),0);
   const loanDue=unpaidLoanRows().reduce((sum,row)=>sum+row.due,0);
   const premiumsDue=Math.max(0,premiumsTotal()-(paymentReceipt().premiums||0));
   const actions=[];
   if(loanDue)actions.push(['处理本月月供',()=>openLoanPayments(bills,'返回收支账单'),true]);
   if(premiumsDue)actions.push(['查看保险与保障',()=>insurance(bills),false]);
   const previous=state.lastSettlement||state.history?.at(-1);
   if(previous)actions.push(['查看上月实收实付',()=>lastBill(previous),false]);
   if(state.history?.length>1)actions.push(['查看历史月份',history,false]);
   page('收支账单',[],actions);
   if($('eventTitle').textContent!=='收支账单')return;
   const investing=forecastInvestingCash(metrics);
   const sumAmounts=rows=>rows.reduce((sum,[,amount])=>sum+amount,0);
   const forecastIncome=metrics.grossSalary-metrics.tax-metrics.kContrib+state.passive+sumAmounts(investing.maturities);
   const forecastExpenses=metrics.remainingExpenses+sumAmounts(investing.expenses);
   const forecastRows=[
    ['预计工资（税前）',metrics.grossSalary],['预计工资税',-metrics.tax],
    ['预计 401(k) 个人缴费',-metrics.kContrib],['预计资产净现金流',state.passive],...investing.maturities
   ].filter(([,amount])=>amount!==0);
   drawBill('<div class="finance-bill-desk">'+illustration('desk')+'</div>'+
    highlight('当前现金',state.cash,'cash','finance-bill-cash')+
    section('本月已记账',[
     ['收入及转入',totalFor(1)],['支出及转出',totalFor(-1)],['其中：已付经常支出',metrics.prepaidExpenses]
    ])+
    section('本月预计收付',[['待收',forecastIncome],['待付',forecastExpenses]])+
    highlight('预计月末现金',investing.cash,'coins')+
    ((!state.housing||state.housing==='unselected')?
     '<p class="finance-bill-note">'+illustration('house')+'住房待选，暂未计入住房费用。</p>':'')+
    section('本月逐笔流水',detailRows(entries),'本月尚无已记账流水。')+
    section('预计收入及扣减明细',forecastRows)+
    section('待付明细',[...FinanceLedger.forecastExpenses(),...investing.expenses])+
    (investing.skipped.length?section('预计跳过的定投',investing.skipped):''));
  }

  function history(){
   const title='历史收支账单';
   page(title,[],[],bills);
   if($('eventTitle').textContent!==title)return;
   const data=$('eventData');
   drawBill('<div class="finance-bill-history"></div>');
   for(const settlement of [...state.history].reverse()){
    const button=document.createElement('button');
    button.type='button';
    button.textContent='第 '+settlement.month+' 月实际账单';
    button.onclick=()=>lastBill(settlement,history);
    data.firstElementChild.append(button);
   }
   $('actions').lastElementChild.textContent='返回收支账单';
  }

  function lastBill(settlement,back=bills){
   const title='第 '+settlement.month+' 月实际账单';
   page(title,[],[],back);
   if($('eventTitle').textContent!==title)return;
   const raw=Array.isArray(settlement.ledger)?settlement.ledger:
    (state.financeLedger||[]).filter(row=>row.month===settlement.month-1);
   const totals=[['月初现金',settlement.monthOpeningCash],['月末现金',settlement.endCash],
    ['整月现金变化',settlement.monthCashChange]].filter(([,value])=>Number.isFinite(value));
   drawBill((totals.length?section('月结汇总',totals):'')+
    section('逐笔收支明细',detailRows(FinanceLedger.month(settlement,raw))));
   $('actions').lastElementChild.textContent=back===history?'返回历史账单':'返回收支账单';
  }

  function assets(){
   const metrics=calcMetrics();
   const title='资产总览';
   page(title,[],[]);
   if($('eventTitle').textContent!==title)return;

   const cash=[['可用现金',state.cash],['应急金',state.emergencyFund||0]];
   const investments=[];
   const funds=[];
   const property=[];
   for(const asset of state.assets){
    const name=asset.name||'未命名资产';
    const value=holdingValue(asset);
    const label=asset.kind==='cd'?[name,value,'含已累计利息，提前支取可能扣息']:[name,value];
    if(asset.kind==='cd'||asset.kind==='savings')cash.push(label);
    else if(asset.kind==='rental')property.push(label);
    else if(window.FundPages?.isFund(asset))funds.push([name,value,'成本 '+priceText(asset.cost)]);
    else investments.push(label);
   }
   const equity=globalThis.CafeEquity;
   for(const account of equity?.position(state)||[]){
    if(account.shares)investments.push(['门店股权',equity.valuation(account)*account.shares/100,
     '门店 '+account.id+' · 持股 '+account.shares+'%']);
    if(account.trade?.buy)investments.push(['门店股份暂存款',account.trade.amount,'待交割 · 门店 '+account.id]);
   }
   const homeValue=(state.homeEquity||0)+(state.homeMortgage||0);
   if(homeValue||state.housing==='own')property.push(['自住房',homeValue]);
   if(state.carValue||state.carOwned)property.push(['车辆',state.carValue||0]);
   const retirement=state.retirement||{};
   const longTerm=[
    ['401(k)',retirement.k401Balance||0],['IRA',retirement.iraBalance||0]
   ];
   if(retirement.brokerageBalance)longTerm.push(['普通投资账户',retirement.brokerageBalance]);
   const deposit=heldHousingDeposit();
   const depositNote=deposit?section('其他款项',[['可退住房押金',deposit,'游戏现行净资产口径未计入押金']]):'';
   const summary='<dl class="finance-asset-summary">'+[
    ['净资产',metrics.nw,'net'],['总资产',metrics.assetValue,'gross'],['总负债',metrics.debtTotal,'debt']
   ].map(([label,value,key])=>'<div class="finance-asset-'+key+'"><dt>'+label+
    '</dt><dd>'+priceText(value)+'</dd></div>').join('')+'</dl>';
   drawBill(summary+
    '<div class="finance-asset-holdings" tabindex="0" role="region" aria-label="资产明细，可纵向滚动">'+
    section('现金与储蓄',cash,undefined,'cash')+
    (investments.length||!funds.length?section('投资持仓',investments,'暂无投资持仓。','investments'):'')+
    (funds.length?section('基金持仓',funds):'')+
    section('实物资产',property,'暂无实物资产。','property')+
    section('长期账户',longTerm,undefined,'accounts')+depositNote+'</div>');
   $('eventData').removeAttribute('tabindex');
   $('eventData').removeAttribute('aria-label');
   eventCard.classList.add('finance-assets');
  }

  function savings(){
   const tiles=[
    ['应急金',emergency,212,461,255,188],
    ['定期存款',()=>openCD(savings,true),534,461,256,188],
    ['ETF投资',()=>window.ETFPages.showList(savings,true),195,722,276,168],
    ['股票投资',stocks,533,722,275,168],
    ['基金投资',()=>openMarket('基金',savings),195,899,276,166],
    ['政府债券',()=>openBonds(savings),533,899,275,166],
    ['房产投资',()=>{clearModals();window.v242RealEstate();},195,1074,276,165],
    ['退休账户',retirement,533,1074,275,165],
    ['黄金',gold,347,1249,308,175],
    ['返回财务',home,300,1435,400,89]
   ];
   showEvent('财务','储蓄与投资','',[],tiles.map(([label,action])=>[label,action,false]));
   if($('eventTitle').textContent!=='储蓄与投资')return;
   eventCard.classList.add('finance-savings');
   window.modalReturn=home;
   positionActions(tiles,1003,1568);
  }

  function emergency(){
   syncFinance();
   const balance=state.emergencyFund||0;
   const monthly=emergencyMonthlyExpenses();
   const pending=necessaryBills().reduce((sum,row)=>sum+row.due,0);
   const housingPending=!state.housing||state.housing==='unselected';
   const tiles=[
    ['转入应急金',()=>emergencyTransfer(true),156,1227,328,135],
    ['转回现金',()=>emergencyTransfer(false),506,1227,332,135],
    ['返回储蓄与投资',savings,285,1397,413,82]
   ];
   showEvent('财务','应急金','',[],
    tiles.map(([label,action],index)=>[label,action,false,index===0?state.cash<=0:index===1?balance<=0:false]));
   if($('eventTitle').textContent!=='应急金')return;
   eventCard.classList.add('finance-emergency');
   window.modalReturn=savings;
   positionActions(tiles,1024,1536);
   const targets=monthly>0?priceText(monthly*3)+'–'+priceText(monthly*6):'—';
   $('eventData').innerHTML='<dl class="emergency-values">'+[
    ['应急金余额',priceText(balance),'balance'],['可用现金',priceText(state.cash),'cash'],
    ['本月必要待付款',priceText(pending),'pending'],['每月必要开支',priceText(monthly),'monthly'],
    ['目前可支撑',balance===0?'0 个月':monthly>0?'约 '+(balance/monthly).toFixed(1)+' 个月':'—','coverage'],
    ['3–6 个月参考金额',targets,'target']
   ].map(([label,value,key])=>'<div class="emergency-'+key+'"><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl>'+
    (housingPending?'<p class="emergency-housing-note">住房待选，参考金额暂未计入住房费。</p>':'');
   $('eventData').style.display='block';
  }

  function emergencyTransfer(deposit){
   const title=deposit?'转入应急金':'转回现金';
   const balance=state.emergencyFund||0;
   const limit=roundCash(Math.max(0,deposit?state.cash:balance));
   const pending=necessaryBills().reduce((sum,row)=>sum+row.due,0);
   showEvent('应急金',title,'',[],[
    ['确认'+(deposit?'转入':'转回'),()=>{
     const amount=input.valueAsNumber;
     if(!input.checkValidity()||amount>(deposit?state.cash:state.emergencyFund||0))return emergencyTransfer(deposit);
     const previous=structuredClone(state);
     if(deposit){
      if(!spendConfirmed('emergencyTransfer',amount))return emergencyTransfer(deposit);
      state.emergencyFund=roundCash((state.emergencyFund||0)+amount);
     }else{
      state.emergencyFund=roundCash(state.emergencyFund-amount);
      state.cash=roundCash(state.cash+amount);
      (state.financeLedger??=[]).push({kind:'emergencyWithdrawal',month:state.month,amount});
     }
     try{if(save()===false)throw Error('save failed')}catch(error){
      state=previous;
      emergencyTransfer(deposit);
      $('emergencyPreview').textContent='转账未保存，请重试。';
      return;
     }
     emergency();
    },true],
    ['返回应急金',emergency,false]
   ]);
   if($('eventTitle').textContent!==title)return;
   window.modalReturn=emergency;
   const data=$('eventData');
   data.innerHTML='<div class="wl-loan-form"><label for="emergencyAmount">转账金额（美元）</label>'+
    '<input id="emergencyAmount" type="number" inputmode="decimal" min="0.01" step="0.01" required>'+
    '<div id="emergencyPreview" aria-live="polite"></div></div>';
   data.style.display='block';
   const input=$('emergencyAmount');
   input.max=limit;
   const update=()=>{
    const valid=input.checkValidity();
    const delta=input.valueAsNumber*(deposit?1:-1);
    $('actions').firstElementChild.disabled=!valid;
    $('emergencyPreview').innerHTML=valid?lines([
     ['转账后可用现金',priceText(state.cash-delta)],
     ['转账后应急金',priceText(balance+delta)],
     ['预留已知必要待付款后',priceText(state.cash-delta-pending)]
    ]):'可转账上限 '+priceText(limit)+'。';
   };
   input.oninput=update;
   update();
  }

  function stocks(){
   openMarket('股票',savings);
  }

  function retirement(){
   const account=state.retirement;
   showEvent('退休账户','退休账户','',[],[
    ['设置 401(k)',()=>open401Account(retirement),false],
    ['查看 IRA',viewIRA,false],
    ...(state.retired?[
     ['提取 401(k)',()=>retirementWithdraw('k401Balance','401(k)'),true,!account.k401Balance],
     ['提取 IRA',()=>retirementWithdraw('iraBalance','IRA'),true,!account.iraBalance]
    ]:[]),
    ['退休规划',()=>openRetirementChoice(retirement),false],
    ['返回储蓄与投资',savings,false]
   ]);
   if($('eventTitle').textContent!=='退休账户')return;
   window.modalReturn=savings;
   eventCard.classList.add('finance-parchment');
   const data=$('eventData');
   data.innerHTML=`<img class="retirement-art" src="${art}retirement-desk.webp" width="720" height="320" alt="">
    <div class="retirement-accounts">
     <section>
      <h3>401(k) · 雇主退休账户</h3>
      <div class="retirement-balance"><span>余额</span><strong>${priceText(account.k401Balance||0)}</strong></div>
     </section>
     <section>
      <h3>IRA · 个人退休账户</h3>
      <div class="retirement-balance"><span>余额</span><strong>${priceText(account.iraBalance||0)}</strong></div>
     </section>
    </div>
    <details class="retirement-guide">
     <summary>账户怎么运作？什么时候能取？</summary>
     <p><strong>现实中的 401(k)</strong>　账户里的钱可用于投资，取款还要符合雇主计划规定。传统税前 401(k) 取款通常缴所得税，未满 59 岁半提前取款一般还可能有 10% 额外税，符合例外时可免。</p>
     <p><strong>现实中的 IRA</strong>　传统 IRA 可以申请提款，应税部分通常缴所得税。未满 59 岁半提前取款通常还有 10% 额外税，符合例外时可免。Roth IRA 的常规缴费本金通常可随时免税取回；收益要满足五年规则及年龄等资格条件才可免税提取。</p>
    </details>
    <p class="retirement-age"><span>计划退休年龄</span><strong>${state.retirementAge||67} 岁</strong></p>`;
   data.style.display='block';
  }

  function viewIRA(){
   openIRAAccount(retirement);
   if($('eventTitle').textContent!=='IRA 长期投资')return;
   eventCard.classList.add('finance-parchment','retirement-transaction');
   const data=$('eventData');
   const reference=data.querySelector('a');
   const explanation=$('eventDesc').textContent;
   data.innerHTML=`<img class="retirement-art" src="${art}retirement-ira.webp" width="900" height="300" alt="">
    <div class="retirement-transfer-panel">
     <div class="retirement-transfer-total"><span>IRA 余额</span><strong>${priceText(state.retirement.iraBalance||0)}</strong></div>
     <dl><div><dt>可用现金</dt><dd>${priceText(state.cash)}</dd></div>
      <div><dt>本次从现金转入</dt><dd>$500.00</dd></div></dl>
     ${state.cash<500?'<p class="retirement-note">可用现金不足 $500.00。</p>':''}
    </div>
    <details class="retirement-guide"><summary>了解 IRA 规则</summary></details>`;
   const guide=data.querySelector('details');
   const paragraph=document.createElement('p');
   paragraph.textContent=explanation;
   guide.append(paragraph);
   if(reference)guide.append(reference);
   data.style.display='block';
  }

  function retirementWithdraw(key,name){
   const account=state.retirement;
   const balance=roundCash(account[key]||0);
   if(!state.retired||balance<=0)return retirement();
   const title='提取 '+name;
   showEvent('退休账户',title,'',[],[
    ['确认提款',()=>{
     const amount=input.valueAsNumber;
     if(!input.isConnected||!state.retired||state.retirement!==account||
        !input.checkValidity()||amount>roundCash(account[key]))return;
     const previous=structuredClone(state);
     account[key]=roundCash(account[key]-amount);
     state.cash=roundCash(state.cash+amount);
     (state.financeLedger??=[]).push({kind:'retirementWithdrawal',month:state.month,account:name,amount});
     try{if(save()===false)throw Error('save failed')}catch(error){
      state=previous;
      retirementWithdraw(key,name);
      $('retirementWithdrawalPreview').textContent='提款未保存，请重试。';
      return;
     }
     const receipt=name+' 提款成功';
     showEvent('退休账户',receipt,'',[],[['返回退休账户',retirement,true]]);
     if($('eventTitle').textContent!==receipt)return;
     window.modalReturn=retirement;
     eventCard.classList.add('finance-parchment','retirement-transaction');
     const data=$('eventData');
     data.innerHTML=`<img class="retirement-art" src="${art}retirement-receipt.webp" width="900" height="300" alt="">
      <div class="retirement-transfer-panel">
       <div class="retirement-transfer-total"><span>本次到账</span><strong>${priceText(amount)}</strong></div>
       <dl><div><dt>账户剩余</dt><dd>${priceText(account[key])}</dd></div>
        <div><dt>可用现金</dt><dd>${priceText(state.cash)}</dd></div></dl>
      </div>`;
     data.style.display='block';
    },true,true],
    ['返回退休账户',retirement,false]
   ]);
   if($('eventTitle').textContent!==title)return;
   window.modalReturn=retirement;
   const data=$('eventData');
   eventCard.classList.add('finance-parchment','retirement-transaction');
   data.innerHTML=`<img class="retirement-art" src="${art}retirement-withdraw.webp" width="900" height="300" alt="">
    <div class="retirement-transfer-panel">
     <div class="retirement-transfer-total"><span>可提取余额</span><strong>${priceText(balance)}</strong></div>
     <label for="retirementWithdrawalAmount">提款金额（美元）</label>
     <div class="retirement-transfer-entry">
      <input id="retirementWithdrawalAmount" type="number" inputmode="decimal" min="0.01" max="${balance}" step="0.01" required>
      <button id="retirementWithdrawalAll" type="button">全部提取</button>
     </div>
     <p id="retirementWithdrawalPreview" aria-live="polite"></p>
    </div>`;
   data.style.display='block';
   const input=$('retirementWithdrawalAmount');
   const confirm=$('actions').firstElementChild;
   const update=()=>{
    confirm.disabled=!input.checkValidity();
    const amount=input.valueAsNumber;
    $('retirementWithdrawalPreview').textContent=confirm.disabled
     ?'请输入 $0.01 至 '+priceText(balance)+'。'
     :'本次到账 '+priceText(amount)+' · 账户剩余 '+priceText(roundCash(balance-amount));
   };
   input.oninput=update;
   $('retirementWithdrawalAll').onclick=()=>{input.value=balance;update()};
   update();
  }

  function goldChart(quote){
   const history=quote.goldSeries.slice(-60);
   const prices=history.map(point=>point.price);
   return `<figure class="gold-price-chart">
    <figcaption><strong>金价走势</strong><span>美元／份</span></figcaption>
    ${quoteChart({history},' 个报价点')}
    <div><span>区间低点 ${priceText(Math.min(...prices))}</span><span>区间高点 ${priceText(Math.max(...prices))}</span></div>
   </figure>`;
  }

  function gold(back=savings){
   initQuotes();
   const quote=quoteFor('gold');
   const lots=state.assets.filter(asset=>asset.instrument==='gold');
   const value=lots.reduce((sum,asset)=>sum+asset.value,0);
   const reopen=()=>gold(back);
   showEvent('投资','黄金','',[],[
    ['买入黄金',()=>goldBuy(reopen),true,state.cash<=0],
    ...lots.map((lot,index)=>['卖出第 '+(index+1)+' 笔 · '+priceText(lot.value),()=>sellAsset(state.assets.indexOf(lot),reopen),false]),
    [back===savings?'返回储蓄与投资':'返回证券市场',back,false]
   ]);
   if($('eventTitle').textContent!=='黄金')return;
   window.modalReturn=back;
   eventCard.classList.add('finance-parchment','retirement-transaction');
   const data=$('eventData');
   data.innerHTML=`<img class="retirement-art" src="${art}gold-overview.webp" width="900" height="300" alt="">
    <div class="retirement-transfer-panel">
     <div class="retirement-transfer-total"><span>当前价格</span><strong>${priceText(quote.price)} / 份</strong></div>
     <dl><div><dt>持仓市值</dt><dd>${priceText(value)}</dd></div>
      <div><dt>可用现金</dt><dd>${priceText(state.cash)}</dd></div></dl>
    </div> ${goldChart(quote)}`;
   data.style.display='block';
  }

  function goldBuy(back){
   showEvent('投资','买入黄金','',[],[
    ['确认买入',()=>{
     if(!input.isConnected||!input.checkValidity())return;
     const previous=structuredClone(state);
     if(!buyUnits('gold',input.valueAsNumber))return goldBuy(back);
     try{if(save()===false)throw Error('save')}catch(error){
      state=previous;
      goldBuy(back);
      $('goldPreview').textContent='买入未保存，请重试。';
      return;
     }
     back();
    },true],
    ['返回黄金',back,false]
   ]);
   if($('eventTitle').textContent!=='买入黄金')return;
   window.modalReturn=back;
   const data=$('eventData');
   const quote=quoteFor('gold');
   eventCard.classList.add('finance-parchment','retirement-transaction');
   data.innerHTML=`<img class="retirement-art" src="${art}gold-buy.webp" width="900" height="300" alt="">
    <div class="retirement-transfer-panel">
     <div class="retirement-transfer-total"><span>当前金价</span><strong>${priceText(quote.price)} / 份</strong></div>
     <p class="retirement-note">可用现金 ${priceText(state.cash)}。</p>
     <label for="goldAmount">买入金额（美元）</label>
     <div class="retirement-transfer-entry">
      <input id="goldAmount" type="number" inputmode="decimal" min="0.01" step="0.01" required>
     </div>
     <p id="goldPreview" class="retirement-note" aria-live="polite"></p>
    </div>
    ${goldChart(quote)}`;
   data.style.display='block';
   const input=$('goldAmount');
   input.max=state.cash;
   input.value=Math.min(200,state.cash);
   const update=()=>{
    const amount=input.valueAsNumber;
    const valid=input.checkValidity();
    $('actions').firstElementChild.disabled=!valid;
    $('goldPreview').textContent=valid?'预计买入 '+(amount/quoteFor('gold').price).toFixed(6)+
     ' 份 · 剩余现金 '+priceText(state.cash-amount):'请输入可负担且最多两位小数的金额。';
   };
   input.oninput=update;
   update();
  }

  function debt(){
   const metrics=calcMetrics();
   const rows=[['总负债',priceText(metrics.debtTotal)],
    ...Object.entries(state.debt).filter(([,amount])=>amount>0)
     .map(([name,amount])=>[batchEscape(name),priceText(amount)])];
   page('银行贷款与债务',rows,[
    ['申请银行贷款',()=>openBankLoan(10000,{after:debt,receipt:true}),false],
    ['本月贷款还款',()=>openLoanPayments(debt,'返回银行贷款与债务'),false]
   ]);
  }

  function insurance(back=home){
   window.HomeInsurance.openMenu(back,back===home?'返回财务':'返回收支账单');
  }

  if(goldBack)gold(goldBack);else if(showAssets)assets();else home();
 }

 V26_INSTRUMENTS.push({id:'gold',name:'黄金',kind:'黄金',beta:.45,
  desc:'价格按月波动，不产生利息或分红。'});
 window.FinancePages={open,renderCD,gold:back=>open(undefined,false,back)};
})();
