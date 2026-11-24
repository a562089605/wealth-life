(() => {
 const plans = {
  basic: { name: '基础房险', monthly: 85, rate: 0.8 },
  full: { name: '全额房险', monthly: 100, rate: 1 }
 };
 const events = [
  { key: 'wind', title: '大风掀掉屋瓦', gross: 4000 },
  { key: 'hail', title: '冰雹打碎天窗', gross: 2500 },
  { key: 'branch', title: '风暴吹倒树枝', gross: 3500 },
  { key: 'kitchen', title: '厨房小火', gross: 5000 },
  { key: 'electrical', title: '电路起火', gross: 6000 }
 ];
 const coverage = '仅保障自有住房的建筑损坏，涵盖火灾、风暴和冰雹。家电故障及日常磨损由玩家自行承担。';

 function syncPolicy() {
  const policy = state.homeInsurance;
  if (!policy) return null;
  if (state.housing !== 'own' || !Object.hasOwn(plans, policy.tier)) {
   delete state.homeInsurance;
   return null;
  }
  if (policy.change && policy.change.month <= state.month) {
   if (!policy.change.tier) {
    delete state.homeInsurance;
    return null;
   }
   policy.tier = policy.change.tier;
   delete policy.change;
  }
  return policy;
 }

 function transaction(update, retry) {
  const previous = structuredClone(state);
  try {
   if (!update()) return false;
   if(save()===false)throw Error('save failed');
   return true;
  } catch (error) {
   state = previous;
   console.error('Home insurance save failed', error);
   showEvent(state.requiredIncident ? '必要生活事件' : '房险', '存档未完成',
    '账目已恢复。返回后可以重新操作。', [], [['返回', retry, true]]);
   if (state.requiredIncident) $('eventClose').hidden = true;
   return false;
  }
 }

 function illustratedEvent(type, title, description, rows, actions, art) {
  showEvent(type, title, description, rows, actions);
  if (type === '房险') return;
  const image = document.createElement('img');
  image.className = 'home-insurance-art';
  image.src = './assets/home-insurance/' + art + '.webp';
  image.alt = '';
  $('eventTitle').after(image);
 }

 const beforeEvent = showEvent;
 showEvent = function (...args) {
  document.querySelector('.home-insurance-art')?.remove();
  $('actions').classList.remove('home-insurance-menu');
  const panel = $('eventTitle').closest('.event');
  delete panel.dataset.insuranceArt;
  delete panel.dataset.insurancePicker;
  const result = beforeEvent.apply(this, args);
  const kind = {医疗保险:'medical',车险:'auto',房险:'home'}[args[0]];
  if (kind && $('eventTitle').textContent === args[1]) {
   panel.dataset.insuranceArt = kind;
   if (args[1] === '医疗保障选择') {
    panel.dataset.insurancePicker = state.insurance.health?.active ? 'active' : 'uninsured';
    Array.from($('actions').children).slice(0, 2).forEach(button => {
     const [name, ...summary] = button.textContent.split(' · ');
     const title = document.createElement('strong');
     title.textContent = name;
     const terms = document.createElement('span');
     terms.textContent = summary.join(' · ');
     button.replaceChildren(title, terms);
    });
   }
  }
  return result;
 };

 function openMenu(back=window.openRoom,backLabel='返回房屋') {
  if (state.requiredIncident) return openRequiredIncident();
  const menu = () => openMenu(back, backLabel);
  const bill = premiumBill();
  showEvent('保险与保障', '保险与保障', '', [['本月待付保费', priceText(bill.total)]], [
   ['医疗险', () => openMedicalInsurance(menu), false],
   ['宠物险', () => openInsurance('pet'), false],
   ['车险', () => openAutoInsurance(menu), false],
   ['房险', () => openPolicy(menu), false],
   ...(bill.total > 0 ? [['支付本月保费', () => openPremiumPayment(menu), true]] : []),
   [backLabel, back, false]
  ]);
  if ($('eventTitle').textContent === '保险与保障') {
   $('actions').classList.add('home-insurance-menu');
   $('eventTitle').closest('.event').dataset.insuranceArt = 'menu';
   ['medical','pet','auto','home'].forEach((kind,index) => {
    $('actions').children[index].dataset.insuranceIcon = kind;
   });
   window.modalReturn = back;
  }
 }

 function openAutoInsurance(back) {
  if (state.requiredIncident) return openRequiredIncident();
  const policy = state.insurance.auto;
  const [name, monthly] = INSURANCE.auto;
  const canBuy = state.carOwned && !policy?.active;
  const due = canBuy ? Math.max(0, roundCash(premiumsTotal() + monthly - (paymentReceipt().premiums || 0))) : 0;
  const reopen = () => openAutoInsurance(back);
  const owner = state;
  const month = state.month;
  const rows = [['当前保障', policy?.active ? '已投保' : '未投保'], ['月保费', priceText(policy?.active ? policy.monthly : monthly)]];
  if (canBuy) rows.push(['本次应付', priceText(due)]);
  showEvent('车险', canBuy ? name + '投保预览' : name,
   !state.carOwned ? '拥有车辆后可投保。' : policy?.active ? '保障已生效，保费按月结算。' : '确认支付本月应付保费后生效。', rows, [
   ...(canBuy ? [['确认投保 ' + priceText(due), () => {
    if (state !== owner || state.month !== month || !state.carOwned || state.insurance.auto?.active ||
        due !== Math.max(0, roundCash(premiumsTotal() + monthly - (paymentReceipt().premiums || 0)))) return reopen();
    if (transaction(() => {
     if (!payMonthly('premiums', due)) return false;
     state.insurance.auto = { name, monthly, active: true };
     syncFinance();
     return true;
    }, reopen)) reopen();
   }, true, state.cash < due]] : []),
   ['返回保险与保障', back, false]
  ]);
  window.modalReturn = back;
 }

 function openPolicy(returnToMenu = openMenu) {
  if (state.requiredIncident) return openRequiredIncident();
  const policy = syncPolicy();
  const back = ['返回保险与保障', returnToMenu, false];
  const reopen = () => openPolicy(returnToMenu);
  if (state.housing !== 'own') {
   return illustratedEvent('房险', '暂不可投保', '房险仅保障玩家当前自有住房。', [], [back], 'renter');
  }
  if (!policy) {
   return illustratedEvent('房险', '选择房险', coverage, [
    ['基础房险', '$85/月 · 赔付80%'],
    ['全额房险', '$100/月 · 赔付100% · 免赔额$0']
   ], [
    ['选择基础房险', () => openPurchase('basic', reopen), false],
    ['选择全额房险', () => openPurchase('full', reopen), true], back
   ], 'plans');
  }
  const plan = plans[policy.tier];
  const paid = policy.paidMonth === state.month;
  const pending = policy.change;
  const rows = [
   ['本月保费', priceText(plan.monthly)],
   ['赔付比例', Math.round(plan.rate * 100) + '%'],
   ['本月保障', paid ? '已生效' : '待续费，保障暂停']
  ];
  if (pending) rows.push(['下月安排', pending.tier ? '改为' + plans[pending.tier].name : '停止续保']);
  illustratedEvent('房险', plan.name, coverage, rows, [
   ...(!paid ? [['确认续费 ' + priceText(plan.monthly), () => payPremium(policy.tier, reopen), true, state.cash < plan.monthly]] : []),
   ...(!paid && state.cash < plan.monthly ? [['筹措保费', () => showFundingOptions(plan.monthly, reopen), false]] : []),
   ['下月改为' + plans[policy.tier === 'basic' ? 'full' : 'basic'].name,
    () => previewPolicyChange(policy.tier === 'basic' ? 'full' : 'basic', reopen), false],
   ['下月停止续保', () => previewPolicyChange(null, reopen), false],
   ...(pending ? [['撤回下月变更', () => changePolicy(policy.tier, reopen), false]] : []),
   back
  ], 'policy');
 }

 function openPurchase(tier, back) {
  const plan = plans[tier];
  illustratedEvent('房险', '确认投保', '首期保费支付成功后，本月保障立即生效。', [
   ['保障方案', plan.name], ['本次保费', priceText(plan.monthly)],
   ['赔付比例', Math.round(plan.rate * 100) + '%'], ['免赔额', '$0']
  ], [
   ['确认投保 ' + priceText(plan.monthly), () => payPremium(tier, back), true, state.cash < plan.monthly],
   ...(state.cash < plan.monthly ? [['筹措保费', () => showFundingOptions(plan.monthly, () => openPurchase(tier, back)), false]] : []),
   ['返回房险', back, false]
  ], 'confirm');
 }

 function premiumBill() {
  syncFinance();
  const policy = syncPolicy();
  const tier = policy && policy.paidMonth !== state.month ? policy.tier : null;
  const home = tier ? plans[tier].monthly : 0;
  const regular = Math.max(0, roundCash(premiumsTotal() - (paymentReceipt().premiums || 0)));
  return { month: state.month, regular, home, tier, total: roundCash(regular + home) };
 }

 function openPremiumPayment(back, after = back, skip) {
  if (state.requiredIncident) return openRequiredIncident();
  const bill = premiumBill();
  const reopen = () => openPremiumPayment(back, after, skip);
  const insufficient = state.cash < bill.total;
  showEvent('保险与保障', '支付本月保费', '', [
   ...(bill.regular ? [['有效保单保费', priceText(bill.regular)]] : []),
   ...(bill.home ? [['房险续费', priceText(bill.home)]] : []),
   ['本月待付', priceText(bill.total)]
  ], [
   ...(bill.total && !insufficient ? [['确认支付 ' + priceText(bill.total), () => {
    const current = premiumBill();
    if (current.month !== bill.month || current.regular !== bill.regular ||
        current.tier !== bill.tier || state.cash < current.total) return reopen();
    if (transaction(() => {
     if (!payMonthly('premiums', current.regular)) return false;
     if (current.home && !recordHomePremium(current.tier)) return false;
     return true;
    }, reopen)) after();
   }, true]] : []),
   ...(insufficient ? [['资金不足，查看补救', () => showFundingOptions(bill.total, reopen), true]] : []),
   ...(skip ? [['暂不续房险，继续出门', skip, false]] : []),
   ['返回', back, false]
  ]);
  window.modalReturn = back;
 }

 function recordHomePremium(tier) {
  const amount = plans[tier].monthly;
  if (!spendConfirmed('homeInsurancePremium', amount, { tier })) return false;
  state.homeInsurance = { ...state.homeInsurance, tier, paidMonth: state.month };
  state.homeInsuranceReceipt = { month: state.month, amount };
  return true;
 }

 function payPremium(tier, back) {
  const policy = syncPolicy();
  if (state.housing !== 'own' || state.requiredIncident ||
      policy && (policy.paidMonth === state.month || policy.tier !== tier)) return;
  if (transaction(() => {
   return recordHomePremium(tier);
  }, back)) back();
 }

 function previewPolicyChange(tier, back) {
  const title = tier ? '确认下月切换房险' : '确认下月停止续保';
  const rows = [['下月安排', tier ? plans[tier].name : '停止续保'], ['本次应付', priceText(0)]];
  if (tier) rows.push(['新方案月保费', priceText(plans[tier].monthly)]);
  showEvent('房险', title, '', rows, [
   [title, () => changePolicy(tier, back), true],
   ['返回房险', back, false]
  ]);
  window.modalReturn = back;
 }

 function changePolicy(tier, back = openPolicy) {
  const policy = syncPolicy();
  if (!policy || state.requiredIncident) return;
  if (transaction(() => {
   if (tier === policy.tier) delete policy.change;
   else policy.change = { month: state.month + 1, tier };
   return true;
  }, back)) back();
 }

 function checkOnLeave(random = Math.random) {
  if (state.requiredIncident) {
   openRequiredIncident();
   return true;
  }
  if (state.housing !== 'own' || state.homeDamageCheckedMonth === state.month) return false;
  const policy = syncPolicy();
  const roll = random();
  const didSave = transaction(() => {
   state.homeDamageCheckedMonth = state.month;
   if (roll < 0.02) {
    const event = events[Math.floor(roll / (0.02 / events.length))];
    const tier = policy?.paidMonth === state.month ? policy.tier : null;
    const reimbursement = roundCash(event.gross * (tier ? plans[tier].rate : 0));
    state.requiredIncident = {
     id: 'home-damage-' + state.month, kind: 'homeDamage', month: state.month,
     art: event.key, title: event.title, gross: event.gross, reimbursement,
     cost: roundCash(event.gross - reimbursement), tier, status: 'unpaid'
    };
   }
   return true;
  }, window.openRoom);
  if (state.requiredIncident) openRequiredIncident();
  return !didSave || !!state.requiredIncident;
 }

 function openDamage(bill = false) {
  const incident = state.requiredIncident;
  const { id, title, cost, gross, reimbursement, tier, art } = incident;
  if (!bill) {
   illustratedEvent('必要生活事件', title, '住房受损。出门前需要完成维修结算。', [],
    [['查看维修账单', () => openDamage(true), true]], art);
  } else {
   illustratedEvent('必要生活事件', '房屋维修结算 · ' + title, '按事故发生时的保单结算，赔款直接抵扣维修费。', [
    ['事故时保障', tier ? plans[tier].name : '无有效保障'],
    ['维修费用', priceText(gross)], ['保险承担', priceText(reimbursement)], ['本次自付', priceText(cost)]
   ], [
    [cost ? '确认支付 ' + priceText(cost) : '确认结算', () => settleDamage(id), true, cost > 0 && state.cash < cost],
    ...(cost > 0 && state.cash < cost ? [['筹措费用', () => {
     showFundingOptions(cost, () => openDamage(true));
     $('eventClose').hidden = true;
    }, false]] : []),
    ['返回事故', () => openDamage(), false]
   ], tier ? 'claim-' + tier : art);
  }
  $('eventClose').hidden = true;
 }

 function settleDamage(id) {
  const incident = state.requiredIncident;
  if (incident?.kind !== 'homeDamage' || incident.id !== id) return;
  if (transaction(() => {
   const { cost, gross, reimbursement, tier } = incident;
   const metadata = { incident: id, gross, reimbursement, tier };
   if (!spendConfirmed('homeDamage', cost, metadata)) return false;
   if (!cost) (state.financeLedger ??= []).push({ kind: 'homeDamage', month: state.month, amount: 0, ...metadata });
   state.requiredIncident = null;
   return true;
  }, openRequiredIncident)) window.openRoom();
 }

 const beforeRequired = openRequiredIncident;
 openRequiredIncident = function () {
  if (state.requiredIncident?.kind === 'homeDamage') return openDamage();
  return beforeRequired.apply(this, arguments);
 };
 const beforeSync = syncFinance;
 syncFinance = function () {
  if (state) syncPolicy();
  return beforeSync.apply(this, arguments);
 };
 const beforePaid = paidThisMonth;
 paidThisMonth = function () {
  const receipt = state?.homeInsuranceReceipt;
  return roundCash(beforePaid() + (receipt?.month === state.month ? receipt.amount : 0));
 };
 document.addEventListener('click', event => {
  if (event.target.closest('[data-home-insurance]')) openPolicy();
 });
 window.HomeInsurance = { openMenu, openPolicy, checkOnLeave, premiumBill, openPremiumPayment };
})();
