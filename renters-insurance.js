// Renters-only receipts: preserve shared legacy premiums and all old save fields.
(function(){
 const R=RentersRules,oldSync=syncFinance;
 syncFinance=function(){if(!state)return oldSync();R.sync(state);const prior=state._rentersExpenseAddon||0;state.expenses-=prior;if(state._computedExpenses!=null)state._computedExpenses-=prior;
  const result=oldSync();const extra=R.budget(state);state.expenses=roundCash(state.expenses+extra);state._computedExpenses=state.expenses;state._rentersExpenseAddon=extra;return result;
 };
 const oldPremiums=premiumsTotal;premiumsTotal=function(){return roundCash(oldPremiums()+R.budget(state));};
 const oldReceipt=paymentReceipt;paymentReceipt=function(){const r=oldReceipt();return {...r,premiums:roundCash((r.premiums||0)+R.paid(state))};};
 const oldQuote=InsuranceRules.quote;InsuranceRules.quote=function(s,addition){const q=oldQuote(s,addition);return {...q,monthly:roundCash(q.monthly+R.budget(s)),paid:roundCash(q.paid+R.paid(s)),due:roundCash(q.due+R.due(s))};};
 const oldPay=payMonthly;payMonthly=function(category,amount){
  if(category!=='premiums')return oldPay(category,amount);
  const renterDue=R.due(state);if(!renterDue)return oldPay(category,amount);
  amount=roundCash(amount);if(!Number.isFinite(amount)||amount<renterDue||state.cash<amount)return false;
  // Full batch preflight precedes either payment; rent-specific paid receipts never offset other contracts.
  if(!oldPay(category,roundCash(amount-renterDue)))return false;return R.pay(state);
 };
 const oldAuditRows=auditRows;auditRows=function(settlement){const rows=oldAuditRows(settlement),ledger=settlement.ledger||[];
  const sum=kind=>roundCash(ledger.filter(x=>x.kind===kind).reduce((n,x)=>n+x.amount,0)),premium=sum('rentersPremium'),incident=sum('rentersIncidentPayment');
  if(!premium&&!incident)return rows;
  const reconciliation=rows.find(row=>row[0]==='其他现金变化（含旧模块未分类项）');if(reconciliation)reconciliation[1]=roundCash(reconciliation[1]+premium+incident);
  rows.splice(Math.max(0,rows.length-3),0,['租客险实际已付保费 −',premium],['租住事故自担支出 −',incident]);return rows;
 };
 const oldOpen=openGame;openGame=function(...args){const result=oldOpen(...args),batch=state?.rentersIncidents?.[state?.month];if(!state?.gameOver&&batch?.items.length&&!batch.paid){clearModals();openRentersIncidents(true);}return result;};
 // Annual preflight and necessary bills already use premiumsTotal/paymentReceipt.
 const oldAnnual=annualCost;annualCost=function(){const q=oldAnnual();q.premiums=InsuranceRules.quote(state).due;return q;};
 const beforeInsurance=openInsurance;openInsurance=function(type){if(type==='renters')return openRentersInsurance();const result=beforeInsurance(type);
  if(!type&&$('eventTitle').textContent==='保险与保障'){
   const b=$('eventData').querySelector('.insurance-board');if(b){const scene=document.createElement('figure');scene.className='renters-hub-entry';
    const img=document.createElement('img');img.src='assets/career/insurance-renters-document.webp';img.alt='租住房屋、个人物品箱与租客险文件';
    const text=document.createElement('div');text.className='renters-entry-label';text.textContent='租客险\n基础20/月 · 全赔30/月\n'+(R.covered(state)?'本月保障有效':R.due(state)?'本月保费待付':R.renting(state)?'自愿投保，查看保障':'当前不适用');
    const button=document.createElement('button');button.className='renters-entry-action';button.textContent='查看与管理租客险';button.onclick=openRentersInsurance;scene.append(img,text,button);b.append(scene);
   }
  }return result;
 };
 buyInsurance=type=>openInsurance(type);
 function note(board,title,text){const row=document.createElement('section');row.className='insurance-note';const h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=text;row.append(h,p);board.append(row);return row;}
 function view(title,desc,actions){showEvent('租客险',title,desc,[],actions);const b=document.createElement('div');b.className='insurance-board';$('eventData').replaceChildren(b);$('eventData').style.display='block';return b;}
 function signature(){return JSON.stringify({month:state.month,housing:state.housing,renters:state.rentersInsurance,cash:state.cash});}
 openRentersInsurance=function(){syncFinance();const owner=state,month=state.month,title='租客险保障选择',snapshot=signature(),p=state.rentersInsurance?.policy,x=state.rentersInsurance?.pending;
  let primary;const live=()=>state===owner&&state.month===month&&eventActionCurrent(primary,title)&&signature()===snapshot;
  const act=fn=>()=>{if(!live())return;if(fn()){syncFinance();save();openRentersInsurance();}};
  const isActive=p?.active,eligible=R.renting(state),due=R.due(state);
  const b=view(title,'只保障租住房屋内火灾、漏水或入室盗窃造成的个人物品损失。查看不扣款。',[
   ['返回保险管理',()=>openInsurance(),false]
  ]);
  note(b,'当前保障',!eligible?'当前住所不适用租客险':R.covered(state)?R.PLANS[p.plan].name+' · 本月已付款，保障有效':isActive?R.PLANS[p.plan].name+' · 本月待付款，暂无保障':'未投保');
  if(x)note(b,'下月预约',x.plan?R.PLANS[x.plan].name+' · 下月按新档收费':'下月停保，不再产生保费');
  for(const [plan,cfg] of Object.entries(R.PLANS)){
   const section=note(b,cfg.name+' · '+priceText(cfg.monthly)+'/月',plan==='basic'?'赔付80% · 单次最高2,000 · 免赔额0':'赔付100% · 无赔付金额上限 · 免赔额0');
   const button=document.createElement('button');button.className='insurance-option';button.textContent=isActive?(p.plan===plan?'保留本档续保安排':'预约下月切换至'+cfg.name):'选择'+cfg.name;button.disabled=!eligible;
   button.onclick=()=>{if(state!==owner||state.month!==month||!eventActionCurrent(button,title)||signature()!==snapshot)return;
    if(isActive){if(R.schedule(state,plan)){save();openRentersInsurance();}}else previewRentersPurchase(plan);
   };section.append(button);
  }
  if(isActive){
   primary=document.createElement('button');primary.className='primary';primary.textContent=due?'确认支付当月租客险保费 · '+priceText(due):'预约下月停保';primary.disabled=due>0&&state.cash<due;primary.onclick=act(()=>due?R.pay(state):R.schedule(state,null));$('actions').prepend(primary);
   if(due){const stop=document.createElement('button');stop.textContent='预约下月停保';stop.onclick=()=>{if(state===owner&&state.month===month&&eventActionCurrent(stop,title)&&signature()===snapshot&&R.schedule(state,null)){save();openRentersInsurance();}};b.append(stop);}
  }else{primary=$('actions').querySelector('button');}
  if(x){const revoke=document.createElement('button');revoke.textContent='撤销下月预约';revoke.onclick=()=>{if(state===owner&&state.month===month&&eventActionCurrent(revoke,title)&&signature()===snapshot&&R.revoke(state)){save();openRentersInsurance();}};b.append(revoke);}
  if(due&&state.cash<due){const bank=document.createElement('button');bank.textContent='前往银行筹款';bank.onclick=()=>{if(state===owner&&state.month===month&&eventActionCurrent(bank,title))openBankLoan(Math.max(1,Math.ceil(due-state.cash)),{after:openRentersInsurance});};b.append(bank);}
  note(b,'保障与付款','投保和每月续保均在付款成功后生效；未付期间不赔，补交不追赔。切换及主动停保从下月生效，预约可在生效前免费撤销；当月保费不退。');
  note(b,'搬家与重新投保','租住之间正式搬家自动转移。搬入自有住房自动终止；重新租房需重新选档付款，同月重投亦全额收费，旧保费不抵扣。');
  note(b,'事故与结算','火灾损失3,000/月概率0.2%；漏水800/1%；盗窃1,500/0.5%。三类每月独立判定，投保不改变概率。赔款自动抵扣，不额外发现金；不损失时间或属性，不额外扣物品。');
  const batch=state.rentersIncidents?.[state.month];if(batch?.items.length){const receipt=document.createElement('button');receipt.textContent=batch.paid?'查看本月事故回执':'继续处理本月事故';receipt.onclick=()=>openRentersIncidents(false);b.append(receipt);}
  paintInsuranceDocument('renters',{board:b,primary});
 };
 function previewRentersPurchase(plan){syncFinance();const cfg=R.PLANS[plan],owner=state,month=state.month,snapshot=signature(),title='租客险投保确认';let confirm;
  const b=view(title,'确认并成功支付后立即生效；投保前损失不追赔。原已终止保单的保费不抵扣、不退款。',[
   ['确认投保并支付 · '+priceText(cfg.monthly),()=>{if(state!==owner||state.month!==month||!eventActionCurrent(confirm,title)||signature()!==snapshot)return;if(R.pay(state,plan)){syncFinance();save();openRentersInsurance();}},true,!R.renting(state)||state.cash<cfg.monthly],
   ...(state.cash<cfg.monthly?[['前往银行筹款',()=>openBankLoan(Math.max(1,Math.ceil(cfg.monthly-state.cash)),{after:()=>previewRentersPurchase(plan)}),false]]:[]),['返回租客险',openRentersInsurance,false]
  ]);confirm=$('actions').querySelector('button.primary');note(b,'选择档位',cfg.name);note(b,'本次支付',priceText(cfg.monthly));note(b,'赔付规则',plan==='full'?'实际合格损失100%赔付，无金额上限':'实际合格损失80%，单次最高2,000');note(b,'支付后现金',priceText(state.cash-cfg.monthly));paintInsuranceDocument('renters',{board:b,primary:confirm});
 }
 openRentersIncidents=function(continueMonth=true){const batch=state.rentersIncidents?.[state.month];if(!batch?.items.length)return;const owner=state,month=state.month,title=batch.paid?'租住事故结算回执':'租住事故结算';let confirm;
  const valid=()=>state===owner&&state.month===month&&state.rentersIncidents?.[month]===batch&&eventActionCurrent(confirm,title);
  const resume=()=>{clearModals();pending=false;settleMonth();};
  const b=view(title,'按事故判定时的住所及有效保单结算。赔款已抵扣，只支付自担部分；不额外扣时间、属性或物品。',[
   [batch.paid?(continueMonth?'继续月末结算':'返回租客险'):'确认结算 · '+priceText(batch.total),()=>{if(!valid())return;if(!batch.paid){if(!R.settle(state))return;save();return openRentersIncidents(continueMonth);}if(continueMonth)resume();else openRentersInsurance();},true,!batch.paid&&batch.total>0&&state.cash<batch.total],
   ...(!batch.paid&&state.cash<batch.total?[['前往银行筹款',()=>{if(state===owner&&state.month===month)openBankLoan(Math.max(1,Math.ceil(batch.total-state.cash)),{after:()=>openRentersIncidents(continueMonth)});},false]]:[]),['返回房屋',townHome,false]
  ]);confirm=$('actions').querySelector('button.primary');
  note(b,'事故时的住所与保单',({shared:'合租住房',studio:'Studio',rent1:'一室一厅',rent:'租住房屋',rented:'租住房屋'})[batch.housing]+' · '+(batch.policy?R.PLANS[batch.policy.plan].name:'无有效租客险'));
  for(const e of batch.items)note(b,e.name,'个人物品损失 '+priceText(e.loss)+' · 保险抵扣 '+priceText(e.payout)+' · 自担 '+priceText(e.due));
  note(b,batch.paid?'本批已结清':'本批自担合计',priceText(batch.total));note(b,'结算状态',batch.paid?'已记录，不重复扣款或赔付':'整批一次支付；余额不足不先扣部分，暂缓月份推进。保单或住所变化不改本次金额。');paintInsuranceDocument('renters-receipt',{board:b,primary:confirm});
 };
 const beforeSettle=settleMonth;settleMonth=function(){
  if(!state||state.gameOver||state.turn?.index!==9||!state.housing||state.housing==='unselected'||document.querySelector('.event-active')||$('v242RE').classList.contains('open')||state.requiredIncident?.status==='unpaid')return beforeSettle();
  if(townEnabled()){const move=state.town?.movement;if(!move||move.resolved||!move.payExpected||state.month>=move.payExpected)return beforeSettle();}
  syncFinance();const batch=R.assess(state);save();if(batch.items.length&&!batch.paid){if(typeof pauseAnnual==='function')pauseAnnual();return openRentersIncidents(true);}return beforeSettle();
 };
})();
