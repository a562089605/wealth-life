(() => {
 const art = key => '<img class="etf-art" alt="" src="./assets/etf/' + key + '.webp">';
 const etfs = () => V26_INSTRUMENTS.filter(item => item.kind === 'ETF');
 const backToList = () => openMarket('ETF');

 function showList() {
  const footer = state.roomLocation === 'home' && window.openRoom ? window.openRoom : finish;
  showEvent('ETF投资', 'ETF 品种', '选择一个品种查看报价、持仓和交易。', [], [['返回', footer, false]]);
  $('eventData').innerHTML = art('market') + '<div class="wl-mini-grid etf-paper">' + etfs().map(item => {
   const q = quoteFor(item.id);
   return '<button class="wl-choice-card etf-card" data-v26="market" data-key="' + item.id +
    '"><strong>' + item.name + '</strong><b>' + priceText(q.price) + '</b><small>' +
    (q.history.length > 1 ? '本月 ' + signedPercent(q.price / q.previous - 1) : '开局报价') +
    '</small>' + quoteChart(q) + '</button>';
  }).join('') + '</div>';
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
 function panel(title, content) {
  return '<section class="wl-panel etf-paper"><h3>' + title + '</h3>' + content + '</section>';
 }
 function showDetail(item) {
  const id = item.id, q = quoteFor(id), held = position(id);
  const cumulative = (state.financeLedger || []).filter(row => row.kind === 'dividend' && row.instrument === id)
   .reduce((sum, row) => sum + row.amount, 0);
  const perShare = roundCash(q.price * ETF_YIELDS[id] / 12);
  const opening = q.benchmark;
  const initialNote = opening && opening.closeDate.slice(0, 7) !== opening.target
   ? '开局参考 ' + opening.symbol + ' · ' + opening.closeDate + ' 收盘（本版本最新已收录月份）'
   : opening ? '开局参考 ' + opening.symbol + ' · ' + opening.closeDate + ' 收盘' : '游戏模拟报价';
  showEvent('ETF投资', item.name, item.desc, [], [
   ['买入', () => showBuy(item), true, state.cash <= 0],
   ['卖出', () => showHoldings(item), false, !held.lots.length],
   ['定投与分红', () => openInvestSettings(id), false],
   ['返回品种列表', backToList, false]
  ]);
  $('eventData').innerHTML = art('detail') + panel('月末价格',
   '<p class="etf-price">' + priceText(q.price) + ' <small>' +
   (q.history.length > 1 ? '较上月 ' + signedPercent(q.price / q.previous - 1) : '开局报价') +
   '</small></p>' + quoteChart(q) + '<small>' + initialNote + '</small>') +
   panel('持仓', '<p>份额 ' + held.shares.toFixed(6) + ' · 市值 ' + priceText(held.value) +
    '<br>买入成本 ' + priceText(held.cost) + ' · 浮动盈亏 ' + priceText(held.value - held.cost) + '</p>') +
   panel('分红', '<p>按当前价格和持仓预估下期 ' + priceText(roundCash(held.shares * perShare)) +
    '<br>累计分红 ' + priceText(cumulative) + '</p><small>预估会随价格和持仓变化。</small>');
 }

 function showBuy(item) {
  const id = item.id;
  const price = quoteFor(id).price;
  const back = () => showDetail(item);
  showEvent('ETF买入', item.name, '输入买入金额，确认前可查看预计份额和剩余现金。', [], [
   ['确认买入', () => {
    const amount = Number($('etfBuyAmount').value);
    if (!validAmount(amount)) return showBuy(item);
    const previous = JSON.parse(JSON.stringify(state));
    if (!buyUnits(id, amount)) return showBuy(item);
    try { save(); } catch (error) {
     state = previous;
     console.error('ETF order save failed', error);
     showBuy(item);
     $('etfBuyEstimate').textContent = '订单尚未存档，请重试。';
     return;
    }
    back();
   }, true],
   ['返回详情', back, false]
  ]);
  $('eventData').innerHTML = art('detail') + panel('买入金额',
   '<label for="etfBuyAmount">金额（美元）</label><input id="etfBuyAmount" type="number" inputmode="decimal" min="0.01" step="0.01" value="' +
   Math.min(200, Math.max(0, state.cash)) + '"><p id="etfBuyEstimate" aria-live="polite"></p>');
  function validAmount(amount) {
   return Number.isFinite(amount) && amount > 0 && amount <= state.cash && Math.abs(Math.round(amount * 100) - amount * 100) < 0.00001;
  }
  function update() {
   const amount = Number($('etfBuyAmount').value), valid = validAmount(amount);
   $('actions').firstElementChild.disabled = !valid;
   $('etfBuyEstimate').textContent = valid
    ? '预计买入 ' + (amount / price).toFixed(6) + ' 份 · 剩余现金 ' + priceText(roundCash(state.cash - amount))
    : '请输入现金可承担的金额，最多两位小数。';
  }
  $('etfBuyAmount').oninput = update;
  update();
 }

 function showHoldings(item) {
  const back = () => showDetail(item);
  const { lots } = position(item.id);
  showEvent('ETF卖出', item.name, '选择一笔持仓，查看卖出报价。', [], [['返回详情', back, false]]);
  $('eventData').innerHTML = art('detail') + '<div class="etf-paper" id="etfSellLots"></div>';
  for (const lot of lots) {
   const choice = document.createElement('button');
   choice.className = 'wl-choice-card etf-card';
   choice.textContent = lot.shares.toFixed(6) + ' 份 · 当前市值 ' + priceText(lot.value);
   choice.onclick = () => {
    const index = state.assets.indexOf(lot);
    if (index >= 0) sellAsset(index);
   };
   $('etfSellLots').appendChild(choice);
  }
 }

 const settings = openInvestSettings;
 openInvestSettings = function (id) {
  const item = etfs().find(item => item.id === id);
  if (!item) return;
  settings(id, () => showDetail(item));
  $('eventData').insertAdjacentHTML('afterbegin', art('settings'));
 };
 window.ETFPages = { showList, showDetail };
})();
