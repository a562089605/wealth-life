// Live controls and balances use the same paper dialog as career progression.
(function(){
 'use strict';
 const E=CafeEquity,Rules=CareerEventRules;
 const titles={invitation:'门店股权购买',purchase:'首次入股确认',holdings:'我的股份',
  increase:'增持股份',sell:'卖出全部股份',manage:'切换管理身份'};
 const pct=n=>n+'%';
 function page(kind,back){
  const p=CareerPages.panel(titles[kind],'partner-'+kind,back);
  p.section.classList.add('cafe-equity-page','cafe-equity-'+kind);
  return p;
 }
 function show(p){CareerPages.compactCareer(p);}
 function status(p,text){p.message.textContent=text;p.content.append(p.message);}
 const career=()=>CareerPages.career();
 function invitation(){
  const id=Rules.storeKey(state),p=page('invitation',career),offer=p.box('当前报价');
  const ready=E.eligible(state);
  offer.classList.add('cafe-equity-valuation');
  p.row(offer,'当期整店估值',money(E.valuation(E.current(state))));
  status(p,ready?'确认时锁价，次月起按新股比参与分红。估值和分红随经营变化。':'店长任职第二个月起可购买门店股权。');
  p.button('查看买入档位',()=>trade(id,'purchase'),{primary:true,disabled:!ready});
  show(p);
 }
 function select(p,box,choices,value,change){
  const group=document.createElement('div');group.className='cafe-equity-options';box.append(group);
  for(const [key,label] of choices){
   const b=p.button(label,()=>change(key),{parent:group});
   b.setAttribute('aria-pressed',String(key===value));
  }
 }
 function trade(id,kind,target,mode,returnTo=career){
  const a=E.position(state).find(x=>x.id===id),shares=a?.shares||0,first=kind==='purchase',selling=kind==='sell';
  const back=first?invitation:()=>holdings(id,returnTo),p=page(kind,back);
  const targets=selling?[0]:(E.purchaseTargets?.(a)??E.tiers.filter(tier=>
   tier>shares&&(!shares||a.managing||tier===E.controlShare)));
  target??=targets[0];
  if(first&&(target<E.controlShare||!mode))mode='manage';
  const q=E.quote(state,id,target,mode);
  if(!selling){
   const options=p.box('目标持股');
   if(first)options.classList.add('cafe-equity-tiers');
   select(p,options,targets.map(tier=>[tier,pct(tier)]),target,tier=>trade(id,kind,tier,mode,returnTo));
  }
  if(first&&target===E.controlShare){
   const roles=p.box('管理身份');
   const choices=[['manage','自己管理门店 · 基础年薪 $70,000.00'],['shareholder','请店长管理 · 可另找工作']];
   select(p,roles,choices,mode,x=>trade(id,kind,target,x,returnTo));
  }
  const moneyBox=p.box(selling?'交易明细':'交割摘要');
  if(!first){
   p.row(moneyBox,'当前持股',pct(shares));
   p.row(moneyBox,'交割后持股',pct(target));
  }
  if(q.ok){
   if(!first)p.row(moneyBox,selling?'本次卖出':'本次增持',pct(Math.abs(q.target-q.from)));
   p.row(moneyBox,'当期整店估值',money(q.value));
   p.row(moneyBox,selling?'次月收款':'本次扣款',money(q.amount));
   if(q.buy)p.row(moneyBox,'扣款后现金',state.cash>=q.amount?money(state.cash-q.amount):'现金不足');
   p.row(moneyBox,'交割时间','次月');
   if(q.buy){
    const managing=first?q.mode==='manage':a?.handover?.managing??a?.managing;
    p.row(moneyBox,'交割后身份',managing?'在店管理合伙人':'股东（由店长管理）');
   }
   if(selling&&a?.managing)p.row(moneyBox,'交割后职位','受雇店长');
  }
  if(first){
   const agreement=p.box('这家店的合伙协议');
   const note=document.createElement('p');
   note.className='career-note';
   note.textContent='担任店长满 1 个月后可入股。持股低于 '+pct(E.controlShare)+' 时需在店管理，达到 '+pct(E.controlShare)+' 后可自己管理或请店长管理。在店管理有岗位工资，分红取决于门店利润和营运储备，有些月份可能没有分红。';
   agreement.append(note);
  }
  const insufficient=q.ok&&q.buy&&state.cash<q.amount;
  status(p,insufficient?'还差 '+money(q.amount-state.cash)+'。':q.ok?'':q.reason);
  p.button(selling?'确认全部卖出':first?'确认入股':'确认增持',()=>{
   const result=E.confirm(state,q,save);
   if(!result.ok){p.message.textContent=result.reason;return;}
   render();holdings(id,returnTo);
  },{primary:true,disabled:!q.ok||insufficient});
  show(p);
 }
 function holdings(id,returnTo=career){
  const accounts=E.position(state),a=accounts.find(x=>x.id===id)||accounts[0];
  if(!a)return returnTo();
  const p=page('holdings',returnTo),hold=p.box('我的持股'),t=a.trade;
  if(accounts.length>1)select(p,hold,accounts.map((item,i)=>[item.id,'门店 '+(i+1)]),a.id,selected=>holdings(selected,returnTo));
  p.row(hold,'当前持股',pct(a.shares));
  if(a.shares===E.controlShare)p.row(hold,'股东身份',a.managing?'门店老板':'门店老板（不在店管理）');
  p.row(hold,'管理身份',a.shares?(a.managing?'自己管理':a.shares===E.controlShare?'已请店长管理':'只当股东'):'等待首次入股');
  p.row(hold,'我的股份估值',money(E.valuation(a)*a.shares/100));
  const last=a.months[state.month-1];
  const monthly=p.box('最近门店月结');
  if(last){
   p.row(monthly,'门店净利润',money(last.profit));
   p.row(monthly,'门店可分红金额',money(last.pool));
   p.row(monthly,'我的分红到账',money(last.dividend));
   if(last.deferredDividend)p.row(monthly,'次月补发（含 10% 奖励）',money(roundCash(last.deferredDividend*1.10)));
   if(last.deferredPaid)p.row(monthly,'本月已补发（含奖励）',money(last.deferredPaid));
   if(last.payoutShortfall)p.row(monthly,'补发分红资金缺口',money(last.payoutShortfall));
   if(last.fundingRepaid)p.row(monthly,'本月已归还补发款',money(last.fundingRepaid));
   if(last.dividendFundingDue)p.row(monthly,'尚待归还补发款',money(last.dividendFundingDue));
  }else{
   p.row(monthly,'结算状态','尚无月结');
  }
  if(t||a.handover){
   const pending=p.box('待交割');
   if(t){
    p.row(pending,t.buy?'次月买入':'次月卖出',pct(Math.abs(t.target-t.from)));
    p.row(pending,t.buy?'已暂存股款':'锁定收款',money(t.amount));
    p.row(pending,'交割后持股',pct(t.target));
   }
   if(a.handover)p.row(pending,'待切换身份',a.handover.managing?'自己管理':'请店长管理');
  }
  if(a.shares>0&&a.shares<E.controlShare)p.button('增持',()=>trade(a.id,'increase',undefined,undefined,returnTo),{disabled:!!t});
  p.button('卖出全部股份',()=>trade(a.id,'sell',undefined,undefined,returnTo),{disabled:!!t||!a.shares});
  if(a.shares===E.controlShare)p.button('切换管理身份',()=>manage(a,returnTo),{disabled:!a.shares||!!a.handover||t?.target===0});
  show(p);
 }
 function manage(a,returnTo){
  const p=page('manage',()=>holdings(a.id,returnTo)),summary=p.box('次月安排');
  p.row(summary,'当前身份',a.managing?'自己管理':a.shares===E.controlShare?'已请店长管理':'只当股东');
  p.row(summary,'新身份',a.managing?'请店长管理':'自己管理');
  p.row(summary,'交接时间','本月');
  p.row(summary,'生效时间','次月');
  p.row(summary,'持股比例',pct(a.shares));
  if(!a.managing)p.row(summary,'基础年薪',money(70000));
  status(p,'本月按原合同结薪，按股比分红照旧。');
  p.button('确认切换',()=>{
   const result=E.handover(state,a.id,save);
   if(!result.ok){p.message.textContent=result.reason;return;}
   render();holdings(a.id,returnTo);
  },{primary:true});
  show(p);
 }
 function returnToAssets(){
  CareerPages.close();
  $('qAssets').click();
  $('cafeEquityAssets').scrollIntoView({block:'nearest'});
 }
 function renderAssetCards(){
  const list=$('cafeEquityAssets');
  const positions=E.position(state);
  list.hidden=positions.length===0;
  list.replaceChildren();
  for(const [index,account] of positions.entries()){
   const card=document.createElement('article');
   card.className='cafe-equity-asset';
   const art=document.createElement('img');
   art.src='assets/career-learning-20261115/cafe-storefront-equity.webp';
   art.alt='';
   art.loading='lazy';
   const info=document.createElement('div'),heading=document.createElement('h3'),details=document.createElement('dl');
   heading.textContent=positions.length===1?'门店股权':'门店股权 · 门店 '+(index+1);
   const last=account.months?.[state.month-1];
   const rows=[
    ['持股比例',pct(account.shares)],
    ['当前股份估值',money(E.valuation(account)*account.shares/100)],
    ['上月分红',last?money(last.dividend):'尚无月结']
   ];
   if(account.trade){
    const trade=account.trade;
    rows.push([trade.buy?'待交割买入':'待交割卖出',pct(trade.target)+' · '+money(trade.amount)]);
   }
   for(const [label,value] of rows){
    const name=document.createElement('dt'),amount=document.createElement('dd');
    name.textContent=label;
    amount.textContent=value;
    details.append(name,amount);
   }
   const button=document.createElement('button');
   button.type='button';
   button.className='cafe-equity-asset-link';
   button.textContent='查看我的股份 →';
   button.onclick=()=>holdings(account.id,returnToAssets);
   info.append(heading,details,button);
   card.append(art,info);
   list.append(card);
  }
 }
 const priorRender=render;
 render=function(){
  const result=priorRender.apply(this,arguments);
  if(state)renderAssetCards();
  return result;
 };
 window.CafeEquityPages={invitation,holdings};
})();
