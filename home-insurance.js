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
   save();
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
  const image = document.createElement('img');
  image.className = 'home-insurance-art';
  image.src = './assets/home-insurance/' + art + '.webp';
  image.alt = '';
  $('eventTitle').after(image);
 }

 const beforeEvent = showEvent;
 showEvent = function (...args) {
  document.querySelector('.home-insurance-art')?.remove();
  return beforeEvent.apply(this, args);
 };

 function openMenu() {
  if (state.requiredIncident) return openRequiredIncident();
  illustratedEvent('保险与保障', '保险与保障', '查看保障方案与本月保费。', [], [
   ['医疗险', openMedicalInsurance, false],
   ['宠物险', () => openInsurance('pet'), false],
   ['车险', () => openInsurance('auto'), false],
   ['房险', openPolicy, true],
   ['返回房屋', window.openRoom, false]
  ], 'menu');
 }

 function openPolicy() {
  if (state.requiredIncident) return openRequiredIncident();
  const policy = syncPolicy();
  const back = ['返回保险与保障', openMenu, false];
  if (state.housing !== 'own') {
   return illustratedEvent('房险', '暂不可投保', '房险仅保障玩家当前自有住房。', [], [back], 'renter');
  }
  if (!policy) {
   return illustratedEvent('房险', '选择房险', coverage, [
    ['基础房险', '$85/月 · 赔付80%'],
    ['全额房险', '$100/月 · 赔付100% · 免赔额$0']
   ], [
    ['选择基础房险', () => openPurchase('basic'), false],
    ['选择全额房险', () => openPurchase('full'), true], back
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
   ...(!paid ? [['确认续费 ' + priceText(plan.monthly), () => payPremium(policy.tier), true, state.cash < plan.monthly]] : []),
   ...(!paid && state.cash < plan.monthly ? [['筹措保费', () => showFundingOptions(plan.monthly, openPolicy), false]] : []),
   ['下月改为' + plans[policy.tier === 'basic' ? 'full' : 'basic'].name,
    () => changePolicy(policy.tier === 'basic' ? 'full' : 'basic'), false],
   ['下月停止续保', () => changePolicy(null), false],
   ...(pending ? [['撤回下月变更', () => changePolicy(policy.tier), false]] : []),
   back
  ], 'policy');
 }

 function openPurchase(tier) {
  const plan = plans[tier];
  illustratedEvent('房险', '确认投保', '首期保费支付成功后，本月保障立即生效。', [
   ['保障方案', plan.name], ['本次保费', priceText(plan.monthly)],
   ['赔付比例', Math.round(plan.rate * 100) + '%'], ['免赔额', '$0']
  ], [
   ['确认投保 ' + priceText(plan.monthly), () => payPremium(tier), true, state.cash < plan.monthly],
   ...(state.cash < plan.monthly ? [['筹措保费', () => showFundingOptions(plan.monthly, () => openPurchase(tier)), false]] : []),
   ['返回房险', openPolicy, false]
  ], 'confirm');
 }

 function payPremium(tier) {
  const policy = syncPolicy();
  if (state.housing !== 'own' || state.requiredIncident ||
      policy && (policy.paidMonth === state.month || policy.tier !== tier)) return;
  const plan = plans[tier];
  if (transaction(() => {
   if (!spendConfirmed('homeInsurancePremium', plan.monthly, { tier })) return false;
   state.homeInsurance = { ...policy, tier, paidMonth: state.month };
   state.homeInsuranceReceipt = { month: state.month, amount: plan.monthly };
   return true;
  }, openPolicy)) openPolicy();
 }

 function changePolicy(tier) {
  const policy = syncPolicy();
  if (!policy || state.requiredIncident) return;
  if (transaction(() => {
   if (tier === policy.tier) delete policy.change;
   else policy.change = { month: state.month + 1, tier };
   return true;
  }, openPolicy)) openPolicy();
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
 window.HomeInsurance = { openMenu, openPolicy, checkOnLeave };
})();
