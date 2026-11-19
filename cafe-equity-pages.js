// Live controls and balances use the same paper dialog as career progression.
(function(){
 'use strict';
 const E=CafeEquity,Rules=CareerEventRules;
 const titles={invitation:'合伙邀请',purchase:'首次入股确认',holdings:'我的股份',
  increase:'增持股份',sell:'卖出全部股份',manage:'切换管理身份'};
 const pct=n=>n+'%';
 function page(kind,back){
  const p=CareerPages.panel(titles[kind],'partner-'+kind,back);
  p.section.classList.add('cafe-equity-page');
  return p;
 }
 function show(p){CareerPages.compactCareer(p);}
 function status(p,text){p.message.textContent=text;p.content.append(p.message);}
 const career=()=>CareerPages.career();
 function invitation(){
  const id=Rules.storeKey(state),p=page('invitation',career),terms=p.box('邀请条件');
  const requirements=E.requirements(state);
  for(const r of requirements){
   const value=r.level?'Lv.'+r.value+' / Lv.'+r.target:r.value+' / '+r.target+(r.unit||'');
   p.row(terms,r.label,value,r.value>=r.target);
  }
  const ready=E.eligible(state),missing=requirements.filter(r=>r.value<r.target);
  if(ready)status(p,'已满足合伙邀请条件。');
  else if(missing.length===1&&missing[0].label==='上司认可度')status(p,'还差 '+(18-missing[0].value)+' 点上司认可度。');
  p.button(ready?'查看入股方案':'条件尚未满足',()=>trade(id,'purchase'),{primary:true,disabled:!ready});
  show(p);
 }
 function select(p,box,choices,value,change){
  const group=document.createElement('div');group.className='cafe-equity-options';box.append(group);
  for(const [key,label] of choices){
   const b=p.button(label,()=>change(key),{parent:group});
   b.setAttribute('aria-pressed',String(key===value));
  }
 }
 function trade(id,kind,target,mode){
  const a=E.position(state).find(x=>x.id===id),shares=a?.shares||0,first=kind==='purchase',selling=kind==='sell';
  const back=first?invitation:()=>holdings(id),p=page(kind,back);
  const targets=selling?[0]:E.tiers.filter(tier=>tier>shares);
  target??=targets[0];
  if(first&&(target<E.controlShare||!mode))mode='manage';
  const q=E.quote(state,id,target,mode);
  if(!selling){
   const options=p.box('目标持股');
   select(p,options,targets.map(tier=>[tier,pct(tier)]),target,tier=>trade(id,kind,tier,mode));
  }
  if(first&&target===E.controlShare||selling&&a?.managing){
   const roles=p.box('管理身份');
   const choices=first?[['manage','自己管理门店 · 基础年薪 $70,000.00'],['shareholder','请店长管理 · 可另找工作']]
    :[['manager','转回受雇店长'],['leave','离开门店']];
   select(p,roles,choices,mode,x=>trade(id,kind,target,x));
  }
  if(first&&target<E.controlShare)p.row(p.box('管理方式'),'交割后','自己管理门店 · 基础年薪 $70,000.00');
  const moneyBox=p.box('交易明细');
  p.row(moneyBox,'当前持股',pct(shares));
  p.row(moneyBox,'交割后持股',pct(target));
  if(q.ok){
   p.row(moneyBox,selling?'本次卖出':first?'本次买入':'本次增持',pct(Math.abs(q.target-q.from)));
   p.row(moneyBox,'当期整店估值',money(q.value));
   p.row(moneyBox,selling?'次月收款':'本次扣款',money(q.amount));
   if(q.buy)p.row(moneyBox,'扣款后现金',state.cash>=q.amount?money(state.cash-q.amount):'现金不足');
   p.row(moneyBox,'交割时间','次月');
  }
  const insufficient=q.ok&&q.buy&&state.cash<q.amount;
  status(p,insufficient?'还差 '+money(q.amount-state.cash)+'。':q.ok?'':q.reason);
  p.button(selling?'确认全部卖出':first?'确认入股':'确认增持',()=>{
   const result=E.confirm(state,q,save);
   if(!result.ok){p.message.textContent=result.reason;return;}
   render();holdings(id);
  },{primary:true,disabled:!q.ok||insufficient});
  show(p);
 }
 function holdings(id){
  const accounts=E.position(state),a=accounts.find(x=>x.id===id)||accounts[0];
  if(!a)return career();
  const p=page('holdings',career),hold=p.box('我的持股'),t=a.trade;
  if(accounts.length>1)select(p,hold,accounts.map((item,i)=>[item.id,'门店 '+(i+1)]),a.id,holdings);
  p.row(hold,'当前持股',pct(a.shares));
  if(a.shares===E.controlShare)p.row(hold,'股东身份','门店老板');
  p.row(hold,'管理身份',a.shares?(a.managing?'自己管理':a.shares===E.controlShare?'店长管理':'只当股东'):'等待首次入股');
  p.row(hold,'我的股份估值',money(E.valuation(a)*a.shares/100));
  const last=a.months[state.month-1];
  const monthly=p.box('最近门店月结');
  if(last){
   p.row(monthly,'门店净利润',money(last.profit));
   p.row(monthly,'门店可分红金额',money(last.pool));
   p.row(monthly,'我的分红到账',money(last.dividend));
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
  if(a.shares>0&&a.shares<E.controlShare)p.button('增持',()=>trade(a.id,'increase'),{disabled:!!t});
  p.button('卖出全部股份',()=>trade(a.id,'sell'),{disabled:!!t||!a.shares});
  if(a.shares===E.controlShare)p.button('切换管理身份',()=>manage(a),{disabled:!a.shares||!!a.handover||t?.target===0});
  show(p);
 }
 function manage(a){
  const p=page('manage',()=>holdings(a.id)),summary=p.box('次月安排');
  p.row(summary,'当前身份',a.managing?'自己管理':a.shares===E.controlShare?'店长管理':'只当股东');
  p.row(summary,'新身份',a.managing?'请店长管理':'自己管理');
  p.row(summary,'交接时间','本月');
  p.row(summary,'生效时间','次月');
  p.row(summary,'持股比例',pct(a.shares));
  if(!a.managing)p.row(summary,'基础年薪',money(70000));
  status(p,'本月按原合同结薪，按股比分红照旧。');
  p.button('确认切换',()=>{
   const result=E.handover(state,a.id,save);
   if(!result.ok){p.message.textContent=result.reason;return;}
   render();holdings(a.id);
  },{primary:true});
  show(p);
 }
 window.CafeEquityPages={invitation,holdings};
})();
