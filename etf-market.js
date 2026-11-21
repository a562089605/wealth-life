(() => {
 const data = window.ETF_MARKET_DATA;
 function previousMonth(date) {
  const month = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return month.getFullYear() + '-' + String(month.getMonth() + 1).padStart(2, '0');
 }
 function openingQuote(id, month, date = new Date()) {
  const benchmark = data[id];
  if (!benchmark) return null;
  const target = previousMonth(date);
  const available = benchmark.closes.filter(([day]) => day.slice(0, 7) <= target);
  const latest = available.at(-1);
  if (!latest) return null;
  const recent = available.slice(-37);
  const changes = recent.slice(1).map(([, price], i) => Math.log(price / recent[i][1]));
  const mean = changes.reduce((sum, value) => sum + value, 0) / Math.max(1, changes.length);
  const variance = changes.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, changes.length);
  const [closeDate, price] = latest;
  return addOpeningHistory(id,{
   price, previous: price, history: [{ month, price }],
   benchmark: { symbol: benchmark.symbol, closeDate, target, volatility: Math.sqrt(variance) }
  });
 }
 function hasBenchmark(id) {
  return Object.hasOwn(data,id);
 }
 function addOpeningHistory(id,quote) {
  const opening=quote.history[0];
  if(!hasBenchmark(id)||opening?.month!==0)return quote;
  const closes=data[id].closes;
  const closeDate=quote.benchmark?.closeDate;
  const reference=closeDate?closes.filter(([day])=>day<=closeDate).slice(-13):closes.slice(0,13);
  if(reference.length<2)return quote;
  const anchor=reference.at(-1)[1];
  const history=reference.slice(0,-1).map(([day,price],index)=>({
   month:index-reference.length+1,
   price:Math.max(.01,Math.round(opening.price*price/anchor*100)/100),
   simulatedOpening:true,
   ...(closeDate?{referenceDate:day}:{})
  }));
  if(quote.history.length===1)quote.previous=history.at(-1).price;
  quote.history.unshift(...history);
  return quote;
 }
 function simulatedChange(quote, marketChange, inflation, beta, regional, cycle) {
  const monthlyInflation = Math.pow(1 + Math.max(-0.99, inflation), 1 / 12) - 1;
  const volatility = Math.max(0.65, Math.min(1.45, (quote.benchmark?.volatility || 0.05) / 0.05));
  // The economy supplies the common real-market move; inflation converts it to nominal dollars.
  return (1 + ((marketChange + regional) * beta + cycle) * volatility) * (1 + monthlyInflation) - 1;
 }
 window.ETFMarket = { openingQuote, addOpeningHistory, hasBenchmark, simulatedChange };
})();
