(function(){
 const items=()=>V26_INSTRUMENTS.filter(item=>item.kind==='基金');
 const positions={blend:'50.6%',treasuryfund:'64%',income:'77.8%'};
 const isFund=asset=>items().some(item=>item.id===asset.instrument);

 function icon(item){
  const img=document.createElement('span');
  img.className='fund-icon';
  img.setAttribute('aria-hidden','true');
  img.style.setProperty('--fund-icon-y',positions[item.id]);
  return img;
 }

 function market(reopen){
  const data=$('eventData'),list=data.querySelector('.wl-mini-grid');
  const art=document.createElement('div');
  art.className='fund-art fund-approved-art fund-approved-market';
  art.setAttribute('aria-hidden','true');
  data.prepend(art);
  if(list){
   list.classList.add('fund-list');
   items().forEach((item,index)=>{
    const row=list.children[index];
    row.prepend(icon(item));
    row.onclick=event=>{
     event.stopPropagation();
     openInstrument(item.id,reopen);
    };
    row.querySelector('span:not(.fund-icon)').textContent='›';
   });
  }
  $('eventDesc').textContent='游戏模拟行情';
  const back=$('actions').lastElementChild;
  if(back&&window.modalReturn)back.textContent='返回储蓄与投资';
  if(back){
   const manage=document.createElement('button');
   manage.type='button';
   manage.textContent='管理基金持仓';
   manage.onclick=()=>StockPages.showFundHoldings(reopen);
   back.before(manage);
  }
 }

 function decorateManagement(item,stage){
  const data=$('eventData');
  if(item)decorate('manage',item,undefined,stage==='position');
  else data.prepend(document.createElement('div'));

  const header=data.firstElementChild;
  header.classList.add('fund-header','fund-management-header','fund-stage-'+stage);
  const art=document.createElement('span');
  art.className='fund-approved-art fund-approved-'+stage;
  art.setAttribute('aria-hidden','true');
  if(!item)header.append(art);
  else if(stage!=='position'||item.id==='blend')header.querySelector('.fund-icon')?.replaceWith(art);
 }

 function decorate(stage,item,asset,showChart=true){
  if(!item)return;
  const header=document.createElement('div');
  header.className='fund-header';
  header.append(icon(item));
  const label=document.createElement('strong');
  label.textContent=stage==='buy'?'买入预览':stage==='sell'?'出售预览':item.name;
  header.append(label);
  if(asset){
   const shares=document.createElement('span');
   shares.textContent=(asset.shares||0).toLocaleString('en-US',{maximumFractionDigits:6})+' 份';
   header.append(shares);
  }
  const data=$('eventData');
  data.prepend(header);
  if(!showChart)return;
  const quotes=quoteFor(item.id);
  const history=quotes.history.slice(-13);
  const chart=document.createElement('div');
  chart.className='fund-chart';
  if(stage!=='buy'){
   chart.innerHTML=quoteChart({...quotes,history});
  }
  if(stage!=='buy')header.after(chart);
  const caption=document.createElement('small');
  caption.className='fund-chart-caption';
  caption.textContent=history.some(point=>point.simulatedOpening)?'近 12 个月 · 含开局前模拟净值':
   history.length<2?'游戏模拟 · 暂无足够月度记录':'游戏模拟 · 月度净值';
  if(stage==='buy'){
   data.querySelector('.wl-chart')?.remove();
   const price=data.querySelector('.wl-quote > p');
   price?.insertAdjacentHTML('afterend',quoteChart({...quotes,history}));
  }
  const graph=data.querySelector('.wl-chart');
  graph?.after(caption);
 }

 const before=render;
 render=function(){
  before.apply(this,arguments);
  if(!state)return;
  $('assets')?.querySelectorAll('[data-sell]').forEach(button=>{
   const asset=state.assets[Number(button.dataset.sell)];
   if(!asset||!isFund(asset))return;
   const row=button.parentElement.parentElement;
   row.classList.add('fund-asset-row');
   const item=items().find(item=>item.id===asset.instrument);
   const title=row.firstElementChild;
   title.prepend(icon(item));
   const detail=title.querySelector('small');
   if(detail)detail.textContent='持有 '+(asset.shares||0).toLocaleString('en-US',{maximumFractionDigits:6})+
    ' 份 · 成本 '+priceText(asset.cost);
   const value=button.previousElementSibling;
   if(value)value.textContent=priceText(holdingValue(asset));
  });
 };
 window.FundPages={market,decorate,decorateManagement,isFund};
})();
