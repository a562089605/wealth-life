// Add confirmed life protection without replacing legacy policy prices or other ledgers.
(function(){
 const L=LifeInsuranceRules,oldSync=syncFinance;
 syncFinance=function(){if(!state)return oldSync();L.sync(state);const prior=state._lifeExpenseDelta||0;state.expenses-=prior;if(state._computedExpenses!=null)state._computedExpenses-=prior;
  const result=oldSync(),delta=roundCash(L.budget(state)-L.raw(state));state.expenses=roundCash(state.expenses+delta);state._computedExpenses=state.expenses;state._lifeExpenseDelta=delta;return result;
 };
 const oldPremiums=premiumsTotal;premiumsTotal=function(){return roundCash(oldPremiums()-L.raw(state)+L.budget(state));};
 const oldReceipt=paymentReceipt;paymentReceipt=function(){const r=oldReceipt();return {...r,premiums:roundCash((r.premiums||0)-L.credit(state)+L.paid(state))};};
 const oldQuote=InsuranceRules.quote;InsuranceRules.quote=function(s,addition){const q=oldQuote(s,addition),other=Object.entries(s.insurance||{}).reduce((n,[k,p])=>n+(k!=='life'&&p?.active?(Number(p.monthly)||0):0),0),extra=addition&&addition.key!=='life'&&!s.insurance?.[addition.key]?.active?(Number(addition.monthly)||0):0;
  const shared=s.monthlyPayments?.month===s.month?(Number(s.monthlyPayments.premiums)||0):0;
  return {...q,monthly:roundCash(q.monthly-L.raw(s)+L.budget(s)),paid:roundCash(q.paid-L.credit(s)+L.paid(s)),due:roundCash(Math.max(0,other+extra-Math.max(0,shared-L.credit(s)))+RentersRules.due(s)+L.due(s))};
 };
 const oldPay=payMonthly;payMonthly=function(category,amount){if(state?.lifeEnding)return false;if(category!=='premiums'||L.due(state)===0)return oldPay(category,amount);
  const due=L.due(state);amount=roundCash(amount);if(!Number.isFinite(amount)||amount<due||state.cash<amount)return false;
  if(!oldPay(category,roundCash(amount-due)))return false;return L.pay(state);
 };
 const oldSpend=spendConfirmed;spendConfirmed=function(...args){return state?.lifeEnding?false:oldSpend(...args);};
 const oldAudit=auditRows;auditRows=function(s){const rows=oldAudit(s),premium=roundCash((s.ledger||[]).filter(x=>x.kind==='lifePremium').reduce((n,x)=>n+x.amount,0)),monthly=roundCash((s.ledger||[]).filter(x=>x.kind==='lifePremiumMonthEnd').reduce((n,x)=>n+x.amount,0));
  if(premium){const r=rows.find(x=>x[0]==='其他现金变化（含旧模块未分类项）');if(r)r[1]=roundCash(r[1]+premium);rows.splice(rows.length-3,0,['人寿险已付保费 −',premium]);}
  if(monthly)rows.splice(rows.length-3,0,['人寿险保费（已含本次月末支付，不重复扣）',monthly]);return rows;
 };
 lifeInsuranceMonthSnapshot=s=>L.snapshot(s);
 recordLifeInsuranceMonthPayment=(s,x)=>L.recordMonthlyPayment(s,x);
 finalizeNaturalLifeMonth=(s,x,settlement)=>L.finalize(s,x,settlement);
 const beforeSave=save;save=function(){if(!state)return beforeSave();try{const k=key(slot),backup=k+'_before_life_insurance_v1',raw=localStorage.getItem(k);if(raw&&!localStorage.getItem(backup))localStorage.setItem(backup,raw);}catch(error){console.warn('Life upgrade backup not written');showEvent('人生结束','暂未覆盖原存档','无法保存本次升级前备份，请先导出存档或释放存储空间。当前页面保留进度。',[],[['返回',()=>clearModals(),true]]);return false;}return beforeSave();};
 const beforeInsurance=openInsurance;openInsurance=function(type){if(state?.lifeEnding)return showNaturalLifeEnding();if(type==='life')return openLifeInsurance();const result=beforeInsurance(type);
  if(!type&&$('eventTitle').textContent==='保险与保障'){
   const b=$('eventData').querySelector('.insurance-board');if(b){for(const button of [...b.querySelectorAll('.insurance-option')])if(button.querySelector('strong')?.textContent==='原有人寿保单')button.remove();
    const figure=document.createElement('figure');figure.className='life-hub-entry';const img=document.createElement('img');img.src='assets/career/insurance-life-document.webp';img.alt='家庭相册、保障信封与人寿保单';
    const label=document.createElement('div');label.className='life-entry-label';label.textContent='人寿保险\n'+(state.insurance.life?.active?priceText(L.fee(state.insurance.life))+'/月':priceText(35)+'/月')+' · 家庭保障\n'+(L.covered(state)?'本月已付，保障有效':state.insurance.life?.active?'本月待付，暂无保障':'查看保额与投保条件');
    const button=document.createElement('button');button.className='life-entry-action';button.textContent='查看与管理人寿保险';button.onclick=openLifeInsurance;figure.append(img,label,button);b.append(figure);
   }
  }return result;
 };buyInsurance=type=>openInsurance(type);
 function note(b,title,text){const row=document.createElement('section');row.className='insurance-note';const h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=text;row.append(h,p);b.append(row);return row;}
 function view(type,title,desc,actions){showEvent(type,title,desc,[],actions);if($('eventTitle').textContent!==title)return null;const b=document.createElement('div');b.className='insurance-board';$('eventData').replaceChildren(b);$('eventData').style.display='block';return b;}
 function signature(){return JSON.stringify({month:state.month,age:state.age,cash:state.cash,policy:state.insurance?.life,meta:state.lifeInsurance,pending:state.pendingInsuranceChanges?.life,ending:state.lifeEnding});}
 function afterMutation(){syncFinance();save();openLifeInsurance();}
 openLifeInsurance=function(){if(state?.lifeEnding)return showNaturalLifeEnding();syncFinance();const owner=state,month=state.month,title='人寿保险与家庭保障',snap=signature(),p=state.insurance.life,x=state.pendingInsuranceChanges?.life,renew=!!p?.active&&!L.paidPolicy(state),eligible=L.canBuy(state);let primary;
  const live=node=>state===owner&&state.month===month&&!state.lifeEnding&&eventActionCurrent(node,title)&&signature()===snap;
  const text=p?.active?(renew?'确认支付本月保费 · '+priceText(L.due(state)):'预约下月停保'):'查看投保确认 · '+priceText(35);
  const b=view('人寿保险',title,'纯保障：身故后一次性记录受益人的家庭保障，不增加当前角色现金，不复活。',[
   [text,()=>{if(!live(primary))return;if(p?.active){if(renew?L.pay(state):L.cancel(state))afterMutation();}else previewLifePurchase();},true,p?.active?renew&&state.cash<L.due(state):!eligible],['返回保险管理',()=>openInsurance(),false]
  ]);if(!b)return;primary=$('actions').querySelector('button.primary');
  note(b,'当前保障',p?.active?(L.covered(state)?'本月已付，保障有效':'本月未付款，暂无保障'):'未投保');note(b,'保费与保额',priceText(p?.active?L.fee(p):35)+'/月 · 身故保额 '+priceText(p?L.benefit(p):100000));
  if(p&&!p.active)note(b,'原保单记录','旧合同记录保留；重新投保为新合同，原保费不抵扣。');
  note(b,'投保与续保','18至65岁（含65岁）可自愿新投保，仅一份；已有保单可续至90岁，不因超过65岁停保。确认付款即生效，无等待期。未付期间不赔，补费不追赔，不自动借款。');
  if(x)note(b,'下月安排','已预约下月停保。本月已付款保障保留到月底，保费不退。');
  const options=L.beneficiaryOptions(state),current=state.lifeInsurance?.beneficiary||options[0],section=note(b,'受益人',current.name+' · 可免费更改，不改变联系人原财富或关系');
  const select=document.createElement('select');select.setAttribute('aria-label','选择人寿险受益人');for(const o of options){const option=document.createElement('option');option.value=o.key;option.textContent=o.name;select.append(option);}if(options.some(o=>o.key===current.key))select.value=current.key;else if(current.type==='person'){const option=document.createElement('option');option.value='retained';option.textContent=current.name+'（保留已指定记录）';select.append(option);select.value='retained';}section.append(select);
  const change=document.createElement('button');change.textContent='确认免费更改受益人';change.onclick=()=>{if(live(change)&&L.setBeneficiary(state,select.value))afterMutation();};section.append(change);
  if(p?.active&&renew){const stop=document.createElement('button');stop.textContent='预约下月停保';stop.onclick=()=>{if(live(stop)&&L.cancel(state))afterMutation();};b.append(stop);}
  if(x){const revoke=document.createElement('button');revoke.textContent='撤销下月停保预约';revoke.onclick=()=>{if(live(revoke)&&L.revoke(state))afterMutation();};b.append(revoke);}
  if(p?.active&&renew&&state.cash<L.due(state)){const bank=document.createElement('button');bank.textContent='前往银行筹款';bank.onclick=()=>{if(live(bank))openBankLoan(Math.max(1,Math.ceil(L.due(state)-state.cash)),{after:openLifeInsurance});};b.append(bank);}
  note(b,'身故与停保','90岁自然寿命结束，不新增随机死亡；先完成当月账务再结算家庭保障。破产、失业、住院、低健康不直接触发。停保次月生效、生效前可免费撤销；已付保费不退，重投仍须符合年龄。');
  note(b,'纯保障与旧合同','无分红、投资收益、现金价值或退费；新合同35/月、保额100,000固定。旧合同原价及明确保额保留，无保额记录补100,000；不补发历史赔款。');paintInsuranceDocument('life',{board:b,primary});
 };
 function previewLifePurchase(){syncFinance();const owner=state,month=state.month,snap=signature(),title='人寿保险投保确认';let confirm;
  const b=view('人寿保险',title,'确认并成功支付当月保费后立即生效；不抵扣旧保费，不赔付投保前已发生的身故。',[
   ['确认投保并支付 · '+priceText(35),()=>{if(state!==owner||state.month!==month||!eventActionCurrent(confirm,title)||signature()!==snap)return;if(L.pay(state))afterMutation();},true,!L.canBuy(state)||state.cash<35],
   ...(state.cash<35?[['前往银行筹款',()=>openBankLoan(Math.max(1,Math.ceil(35-state.cash)),{after:previewLifePurchase}),false]]:[]),['返回人寿保险',openLifeInsurance,false]
  ]);if(!b)return;confirm=$('actions').querySelector('button.primary');note(b,'本次保费',priceText(35));note(b,'身故保额',priceText(100000)+'，一次性记入受益人的结局保障');note(b,'受益人',state.lifeInsurance?.beneficiary?.name||'家庭保障账户');note(b,'确认后现金',priceText(state.cash-35));paintInsuranceDocument('life',{board:b,primary:confirm});
 }
 let showingEnding=false;
 showNaturalLifeEnding=function(){const ending=state?.lifeEnding;if(!ending||showingEnding)return;showingEnding=true;try{
  pauseAnnual();clearModals();const owner=state,title='人生记录与家庭保障';
  const b=view('人生结束',title,'当月账务已结清，自然寿命结束。存档保留查看，月份不再推进；保障金额不进入角色现金。',[
   ['保存并返回存档',()=>{if(state!==owner||state.lifeEnding!==ending)return;save();home();},true]
  ]);if(!b)return;const primary=$('actions').querySelector('button.primary');primary.dataset.lifeEndingAction='home';
  note(b,'人生记录',ending.age+'岁 · 已完成 '+ending.month+' 个月');note(b,'受益人',ending.beneficiary.name);note(b,'一次性家庭保障',priceText(ending.amount));note(b,'赔付状态',ending.reason+'；同一次身故不重复结算。');
  note(b,'身故时保单',ending.policy?'原月保费 '+priceText(L.fee(ending.policy))+' · 保额 '+priceText(L.benefit(ending.policy)):'无寿险保单');note(b,'结清后的角色现金',priceText(ending.cashAfterSettlement)+'，未加上寿险保障金额');
  note(b,'资产和债务','按原账本保留，不清债、不分配遗产，不改变联系人财富或关系。');
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='查看保留的资产、债务和人生记录';details.append(summary);
  for(const a of ending.assets)note(details,a.name||'原有资产',priceText(a.value??a.cost??0));for(const [name,value] of Object.entries(ending.debt))note(details,name,priceText(value));
  for(const line of state.timeline||[])note(details,'人生记录',String(line));b.append(details);paintInsuranceDocument('life-ending',{board:b,primary});const date=b.querySelector('.insurance-toolbar>span');if(date)date.textContent='第'+(Math.floor(ending.insuredMonth/12)+1)+'年 · 第'+(ending.insuredMonth%12+1)+'月已结算';$('eventClose').hidden=true;
 }finally{showingEnding=false;}};
 const oldGameOver=showGameOver;showGameOver=function(...args){return state?.lifeEnding?showNaturalLifeEnding():oldGameOver(...args);};
 const oldOpen=openGame;openGame=function(...args){if(state?.age>=90&&!state.lifeEnding)pauseAnnual();const result=oldOpen(...args);if(state?.lifeEnding)showNaturalLifeEnding();return result;};
 const oldFinish=finish;finish=function(...args){return state?.lifeEnding?showNaturalLifeEnding():oldFinish(...args);};
 const beforeSettle=settleMonth;let manualOldAge=null;settleMonth=function(){
  if(state?.lifeEnding)return showNaturalLifeEnding();
  if(state?.age>=90&&annualBusy&&manualOldAge!==state){pauseAnnual();const owner=state,month=state.month;let confirm;showEvent('人生结束','确认已满90岁的人生月结','旧档读取不会立即结束。只有主动确认后，才先完成当月账务，再进入身故结局。',[],[['确认本月账务并进入结局',()=>{if(state!==owner||state.month!==month||!eventActionCurrent(confirm,'确认已满90岁的人生月结'))return;manualOldAge=state;clearModals();settleMonth();},true],['返回查看存档',()=>{clearModals();townHome();},false]]);confirm=$('actions').querySelector('button.primary');return;}
  return beforeSettle();
 };
 // A terminal save is view-only. Block retained gameplay controls, keep its own save/home action.
 document.addEventListener('click',e=>{if(!state?.lifeEnding||!e.target.closest('#game')||e.target.closest('[data-life-ending-action]'))return;if(e.target.closest('button,a,input,select')){e.preventDefault();e.stopImmediatePropagation();}},true);
})();
