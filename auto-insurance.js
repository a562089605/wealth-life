// Extend the existing vehicle policy and illustrated paper, retaining old prices and saves.
(function(){
 const A=AutoInsuranceRules,oldSync=syncFinance;
 syncFinance=function(){if(!state)return oldSync();A.sync(state);const prior=state._autoExpenseDelta||0;state.expenses-=prior;if(state._computedExpenses!=null)state._computedExpenses-=prior;const result=oldSync(),delta=roundCash(A.budget(state)-A.raw(state));state.expenses=roundCash(state.expenses+delta);state._computedExpenses=state.expenses;state._autoExpenseDelta=delta;return result;};
 const oldPremiums=premiumsTotal;premiumsTotal=function(){return roundCash(oldPremiums()-A.raw(state)+A.budget(state));};
 const oldReceipt=paymentReceipt;paymentReceipt=function(){const r=oldReceipt();return {...r,premiums:roundCash((r.premiums||0)-A.credit(state)+A.paid(state))};};
 const oldQuote=InsuranceRules.quote;InsuranceRules.quote=function(s,addition){const q=oldQuote(s,addition),other=Object.entries(s.insurance||{}).reduce((n,[k,p])=>n+(!['auto','life'].includes(k)&&p?.active?(Number(p.monthly)||0):0),0),extra=addition&&!['auto','life'].includes(addition.key)&&!s.insurance?.[addition.key]?.active?(Number(addition.monthly)||0):0,shared=s.monthlyPayments?.month===s.month?(Number(s.monthlyPayments.premiums)||0):0;
  return {...q,monthly:roundCash(q.monthly-A.raw(s)+A.budget(s)),paid:roundCash(q.paid-A.credit(s)+A.paid(s)),due:roundCash(Math.max(0,other+extra-Math.max(0,shared-LifeInsuranceRules.credit(s)-A.credit(s)))+RentersRules.due(s)+LifeInsuranceRules.due(s)+A.due(s))};};
 const oldPay=payMonthly;payMonthly=function(category,amount){if(category!=='premiums'||!A.due(state))return oldPay(category,amount);const due=A.due(state);amount=roundCash(amount);if(state.lifeEnding||!Number.isFinite(amount)||amount<due||state.cash<amount||!state.carOwned)return false;if(!oldPay(category,roundCash(amount-due)))return false;return A.pay(state);};
 const oldAudit=auditRows;auditRows=function(s){const rows=oldAudit(s),sum=k=>roundCash((s.ledger||[]).filter(x=>x.kind===k).reduce((n,x)=>n+x.amount,0)),premium=sum('autoPremium'),incident=sum('autoIncidentPayment');if(premium||incident){const row=rows.find(x=>x[0]==='其他现金变化（含旧模块未分类项）');if(row)row[1]=roundCash(row[1]+premium+incident);rows.splice(Math.max(0,rows.length-3),0,['汽车保险实际已付保费 −',premium],['车辆事故自担支出 −',incident]);}return rows;};
 const beforeSave=save;save=function(){if(!state)return beforeSave();try{const k=key(slot),backup=k+'_before_auto_insurance_v1',raw=localStorage.getItem(k);if(raw&&!localStorage.getItem(backup))localStorage.setItem(backup,raw);}catch(e){console.warn('Vehicle upgrade backup not written');showEvent('汽车保险','暂未覆盖原存档','无法保存升级前备份，请先导出存档或释放存储空间。当前进度保留。',[],[['返回',()=>clearModals(),true]]);return false;}return beforeSave();};
 const beforeInsurance=openInsurance;openInsurance=function(type){if(type==='auto'&&!state?.lifeEnding)return openAutoInsurance();const result=beforeInsurance(type);if(!type&&$('eventTitle').textContent==='保险与保障')for(const b of $('eventData').querySelectorAll('.insurance-option'))if(b.querySelector('strong')?.textContent==='汽车保险'){b.onclick=()=>openAutoInsurance();const p=state.insurance?.auto,small=b.querySelector('small');if(small)small.textContent=A.covered(state)?'本月已付款，保障有效':p?.active?'本月待付款，暂无保障':state.carOwned?'基础100/月 · 全赔165/月':'拥有车辆后可投保';}return result;};buyInsurance=type=>openInsurance(type);
 function note(b,title,text){const row=document.createElement('section');row.className='insurance-note';const h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=text;row.append(h,p);b.append(row);return row;}
 function view(title,desc,actions){showEvent('汽车保险',title,desc,[],actions);if($('eventTitle').textContent!==title)return null;const b=document.createElement('div');b.className='insurance-board';$('eventData').replaceChildren(b);$('eventData').style.display='block';return b;}
 function signature(){return JSON.stringify({month:state.month,cash:state.cash,car:state.carOwned,policy:state.insurance?.auto,meta:state.autoInsurance,pending:state.pendingInsuranceChanges?.auto});}
 function refresh(){syncFinance();save();openAutoInsurance();}
 openAutoInsurance=function(){if(state?.lifeEnding)return showNaturalLifeEnding();syncFinance();const owner=state,month=state.month,title='汽车保险保障选择',snap=signature(),p=state.insurance?.auto,active=!!p?.active,due=A.due(state),x=state.autoInsurance?.pending||state.pendingInsuranceChanges?.auto;let primary;
  const live=node=>state===owner&&state.month===month&&!state.gameOver&&eventActionCurrent(node,title)&&signature()===snap;
  const b=view(title,'保障本人车辆交通事故维修损失。普通故障、燃油、保养、车贷、人身医疗及第三方损失不纳入。查看不扣款。',[
   ['返回保险管理',()=>openInsurance(),false]
  ]);if(!b)return;
  note(b,'当前保障',A.covered(state)?A.PLANS[p.autoPlan].name+' · 本月已付，保障有效':active?'本月保费待付，暂无保障':state.carOwned?'未投保':'尚无车辆，不能投保');
  if(active)note(b,'当前合同',A.PLANS[p.autoPlan].name+' · '+priceText(A.fee(p))+'/月（保留原合同实际价格）');
  if(x)note(b,'下月预约',x.plan?A.PLANS[x.plan].name+' · 下月按新档收费':'下月停保');
  for(const [plan,cfg] of Object.entries(A.PLANS)){const row=note(b,cfg.name+' · '+priceText(cfg.monthly)+'/月','赔付'+cfg.coverage*100+'% · 免赔额0 · 无单次及年度累计赔付上限'),button=document.createElement('button');button.className='insurance-option';button.textContent=active?(p.autoPlan===plan?'保留本档续保安排':'预约下月切换至'+cfg.name):'选择'+cfg.name;button.disabled=!state.carOwned;button.onclick=()=>{if(!live(button))return;if(active){if(A.schedule(state,plan))refresh();}else previewAutoPurchase(plan);};row.append(button);}
  if(active){primary=document.createElement('button');primary.className='primary';primary.textContent=due?'确认支付本月车险 · '+priceText(due):'预约下月停保';primary.disabled=due>0&&(state.cash<due||!state.carOwned);primary.onclick=()=>{if(live(primary)&&(due?A.pay(state):A.schedule(state,null)))refresh();};$('actions').prepend(primary);
   if(due){const stop=document.createElement('button');stop.textContent='预约下月停保';stop.onclick=()=>{if(live(stop)&&A.schedule(state,null))refresh();};b.append(stop);}
  }else primary=$('actions').querySelector('button');
  if(x){const revoke=document.createElement('button');revoke.textContent='撤销下月预约';revoke.onclick=()=>{if(live(revoke)&&A.revoke(state))refresh();};b.append(revoke);}
  if(due&&state.cash<due){const bank=document.createElement('button');bank.textContent='前往银行筹款';bank.onclick=()=>{if(live(bank))openBankLoan(Math.ceil(due-state.cash),{after:openAutoInsurance});};b.append(bank);}
  note(b,'生效与续保','拥有车辆才能投保，同一时间仅一档；确认付清当月保费立即生效。未付期间不赔，补费不追赔，不自动借款。升降档或停保次月生效，预约不扣费/补差/退款，生效前可免费撤销。');
  note(b,'事故与原费用','有车时每月独立2%，最多一次，维修费5,000；无险自付5,000，基础档1,000，全赔档0。原420普通故障维修及购车费用保持，不额外扣时间、属性或车辆价值。');
  paintInsuranceDocument('auto',{board:b,primary});
 };
 function previewAutoPurchase(plan){syncFinance();const cfg=A.PLANS[plan],owner=state,month=state.month,snap=signature(),title='确认投保'+cfg.name;let confirm;const live=()=>state===owner&&state.month===month&&!state.gameOver&&eventActionCurrent(confirm,title)&&signature()===snap;
  const b=view(title,'确认支付本档完整当月保费后生效，投保前事故不追赔；已付保费不退，同月重投旧费不抵扣。',[
   ['确认投保并支付 '+priceText(cfg.monthly),()=>{if(live()&&A.pay(state,plan))refresh();},true,state.cash<cfg.monthly||!state.carOwned],
   ...(state.cash<cfg.monthly?[['前往银行筹款',()=>{if(live())openBankLoan(Math.ceil(cfg.monthly-state.cash),{after:()=>previewAutoPurchase(plan)});},false]]:[]),['返回汽车保险',openAutoInsurance,false]
  ]);if(!b)return;confirm=$('actions').querySelector('button.primary');note(b,'本次支付',priceText(cfg.monthly));note(b,'保障内容','本人车辆交通事故维修损失赔付'+cfg.coverage*100+'%，免赔额0，无金额上限。');note(b,'支付后现金',priceText(state.cash-cfg.monthly));paintInsuranceDocument('auto',{board:b,primary:confirm});
 }
 openHouseholdIncidents=function(continueMonth=true){const q=A.combined(state);if(!q.items.length)return;const owner=state,month=state.month,title=q.paid?'生活事故结算回执':'生活事故合并结算',snap=JSON.stringify(q.batches);let confirm;const live=node=>state===owner&&state.month===month&&!state.gameOver&&eventActionCurrent(node,title)&&JSON.stringify(A.combined(state).batches)===snap;
  const b=view(title,'车辆与租住事故分别计算保险抵扣，自担合计后整批一次支付。事故快照已锁定，之后补费、换档、搬家不改变金额。',[
   [q.paid?(continueMonth?'继续月末结算':'返回汽车保险'):'确认支付自担合计 · '+priceText(q.total),()=>{if(!live(confirm))return;if(!q.paid){if(A.settleCombined(state)){syncFinance();save();openHouseholdIncidents(continueMonth);}return;}if(continueMonth){clearModals();pending=false;settleMonth();}else openAutoInsurance();},true,!q.paid&&state.cash<q.total],
   ...(!q.paid&&state.cash<q.total?[['前往银行筹款',()=>{if(live(confirm))openBankLoan(Math.max(1,Math.ceil(q.total-state.cash)),{after:()=>openHouseholdIncidents(continueMonth)});},false]]:[]),['返回房屋',townHome,false]
  ]);if(!b)return;confirm=$('actions').querySelector('button.primary');for(const e of q.items)note(b,e.name,'损失 '+priceText(e.loss)+' · 保险抵扣 '+priceText(e.payout)+' · 自担 '+priceText(e.due));note(b,q.paid?'本批已全部结清':'本次待付合计',priceText(q.total));note(b,'结算保护','不自动借款、不新增罚金、不扣负数；余额不足整批待付。返回、读档和重复点击不重抽、不重复扣款或赔付。全赔自担0无需余额。');paintInsuranceDocument('auto',{board:b,primary:confirm});
 };
 // Keep old entry points and old pending renter batches, now routed to one combined receipt.
 const beforeRentersIncidents=openRentersIncidents;
 openRentersIncidents=(continueMonth=true)=>state.autoIncidents?.[state.month]?.items.length?openHouseholdIncidents(continueMonth):beforeRentersIncidents(continueMonth);
 const beforeOpen=openGame;openGame=function(...args){const result=beforeOpen(...args);if(!state?.gameOver){const q=A.combined(state);if(state.autoIncidents?.[state.month]?.items.length&&!q.paid){clearModals();openHouseholdIncidents(true);}}return result;};
 const beforeSettle=settleMonth;settleMonth=function(){
  if(!state||state.gameOver||state.turn?.index!==9||!state.housing||state.housing==='unselected'||document.querySelector('.event-active')||$('v242RE').classList.contains('open')||state.requiredIncident?.status==='unpaid')return beforeSettle();
  if(townEnabled()){const move=state.town?.movement;if(!move||move.resolved||!move.payExpected||state.month>=move.payExpected)return beforeSettle();}
  syncFinance();RentersRules.assess(state);A.assess(state);save();const q=A.combined(state);if(q.items.length&&!q.paid){if(typeof pauseAnnual==='function')pauseAnnual();return state.autoIncidents?.[state.month]?.items.length?openHouseholdIncidents(true):openRentersIncidents(true);}return beforeSettle();
 };
})();
