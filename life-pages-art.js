// Illustrated life pages; original payments, effects, follow-ups and monthly limits remain authoritative.
(function(){
 const names=['运动 / 户外','宅家休息','朋友聚餐','兴趣爱好','周末短途旅行','演唱会 / 主题乐园','升级手机','品质餐厅','本月简单生活'];
 const alts=['公园树荫下舒展身体','窗边沙发上喝茶休息','和朋友在小餐馆聚餐','在家画水彩、享受爱好','背着小包眺望湖畔乡野','灯串下欣赏户外音乐演出','木桌上的新手机与包装盒','烛光餐厅里的精致晚餐','在厨房准备简单的家常饭'];
 const labels={health:'健康',energy:'能量',happiness:'幸福度',stress:'压力',social:'社交'};
 function scene(i){return '<div class="life-activity-scene" role="img" aria-label="'+alts[i]+'" style="--scene-x:'+(i%3*50)+'%;--scene-y:'+(Math.floor(i/3)*50)+'%"></div>';}
 function note(text){const p=document.createElement('p');p.className='life-paper-note';p.textContent=text;return p;}
 function row(label,value){const d=document.createElement('div');d.className='life-paper-row';const l=document.createElement('span'),v=document.createElement('strong');l.textContent=label;v.textContent=value;d.append(l,v);return d;}
 function paper(title){
  if($('eventTitle').textContent!==title)return null;
  $('eventTitle').closest('.event').classList.add('life-pages-painted');
  const b=document.createElement('div');b.className='life-paper';
  b.append(row('第'+(Math.floor(state.month/12)+1)+'年 · 第'+(state.month%12+1)+'月','现金 '+priceText(state.cash)));
  $('eventData').replaceChildren(b);$('eventData').style.display='block';return b;
 }
 function actions(){for(const b of $('actions').querySelectorAll('button'))b.dataset.lifePaperAction=b.textContent.startsWith('确认本月')?'review':b.classList.contains('primary')?'confirm':'back';}
 function illustration(b){const f=document.createElement('figure');f.className='life-paper-table';f.innerHTML='<img src="assets/career/life-arrangements.webp" alt="生活小桌上的房屋钥匙、食材和安排手账">';b.append(f);}
 const billsBefore=openNecessaryBills;
 openNecessaryBills=function(){
  const result=billsBefore(),title='出门前完成本月必要事项',buttons=[...$('actions').querySelectorAll('button')],rows=necessaryBills(),b=paper(title);if(!b)return result;
  illustration(b);b.append(note(rows.length?'出门前，逐项完成本月必要安排。已付的费用不会重复收取。':'✓ 本月必要事项已完成，可以返回房屋继续安排。'));
  const total=roundCash(rows.reduce((n,r)=>n+(r.due||0),0));b.append(row('已列出待付',priceText(total)));
  if(rows.some(r=>!r.due))b.append(note('另有待确认事项；住房、宠物照护等以各自确认页的实际金额为准。'));
  const list=document.createElement('div');list.className='life-bill-list';
  for(const r of rows){const button=buttons.find(x=>x.getAttribute('aria-label')===r.name||x.textContent===r.name);if(!button)continue;button.className='life-bill-item';button.setAttribute('aria-label',r.name);const title=document.createElement('strong'),value=document.createElement('span');title.textContent=r.name;value.textContent=(r.due?priceText(r.due):'待确认')+' ›';button.replaceChildren(title,value);list.append(button);}
  b.append(list);b.append(note('此页只查看待办；打开各项不会自动付款，也不会推进月份。'));actions();return result;
 };
 const fundingBefore=showFundingOptions;
 showFundingOptions=function(...args){
  const result=fundingBefore(...args),b=paper('处理当前资金缺口');if(!b)return result;
  const f=document.createElement('div');f.className='life-funding-scene';f.innerHTML='<img src="assets/career/life-funding.webp" alt="空钱包、少量零钱与家庭账单">';b.append(f);
  b.append(row('当前现金',priceText(state.cash)),row('本次待付所需',priceText(state.financialCrisis.needed)),row('还差',priceText(fundingShortage(state.financialCrisis.needed))),row('净资产',priceText(calcMetrics().nw)));
  b.append(note('借款会增加同额债务，不提高净资产。筹款后返回付款，仍需确认；暂不处理不会自动推进月份。'));actions();return result;
 };
 function receipt(i){
  const o=V26_LIFE[i],r=state.lifeArtReceipt?.month===state.month&&state.lifeArtReceipt.name===o.name?state.lifeArtReceipt:null;
  showEvent('生活','本月生活已安排','',[],[['返回生活安排',openRoomLife,true],['返回房屋',townHome,false]]);
  const b=paper('本月生活已安排');if(!b)return;b.insertAdjacentHTML('beforeend',scene(i));b.append(row('✓ 本月选择',o.name));
  if(r){b.append(row('本次已支付',priceText(r.cost)));for(const[k,v]of Object.entries(r.deltas))b.append(row(labels[k]||k,(v>0?'+':'')+v));b.append(note('以上为确认当时的实际变化，已按状态上下限计算；后续事件另计。'));}
  else b.append(note('本月已经确认此项，原记录保留；不会再次扣费或执行效果。'));
  b.append(row('当前现金',priceText(state.cash)),note('每月选择一次。查看结果、返回或读档不会重复执行。'));actions();
 }
 function signature(){return JSON.stringify([state.cash,...Object.keys(V26_STATS).map(k=>state[k]),monthSelection('life')]);}
 function preview(i){
  if(ordinaryRecoveryActivityBlocked())return showRecoveryActivityRestriction();
  if(monthSelection('life'))return menu();const o=V26_LIFE[i];if(!o||o.name!==names[i])return;
  const owner=state,month=state.month,frozen=signature();let panel,used=false;
  showEvent('生活','确认生活安排','',[],[
   ['确认安排 · '+priceText(o.cost),()=>{
    if(used||state!==owner||state.month!==month||!panel?.isConnected)return;
    if(ordinaryRecoveryActivityBlocked())return showRecoveryActivityRestriction();
    if(signature()!==frozen)return preview(i);
    if(monthSelection('life')||state.cash<o.cost)return menu();
    const before=Object.fromEntries(Object.keys(o.effects).map(k=>[k,state[k]||0]));
    chooseLife(i);if(monthSelection('life')!==o.name)return;
    used=true;state.lifeArtReceipt={month,name:o.name,cost:o.cost,deltas:Object.fromEntries(Object.keys(o.effects).map(k=>[k,(state[k]||0)-before[k]]))};save();
    // The existing friends/hobby event gets first priority; never dismiss or reroll it.
    if(!document.querySelector('.event-active'))receipt(i);
   },true,state.cash<o.cost],
   ...(state.cash<o.cost?[['查看筹款方式',()=>showFundingOptions(o.cost,()=>preview(i)),false]]:[]),
   ['返回重选',menu,false]
  ]);
  panel=paper('确认生活安排');if(!panel)return;panel.insertAdjacentHTML('beforeend',scene(i));panel.append(row('本月选择',o.name),note(o.desc),row('本次费用',priceText(o.cost)));
  for(const[k,v]of Object.entries(o.effects))panel.append(row(labels[k]||k,(v>0?'+':'')+v));
  panel.append(row(state.cash<o.cost?'还差':'确认后现金',priceText(state.cash<o.cost?o.cost-state.cash:state.cash-o.cost)),note('效果按状态的0～100范围结算。只有确认后才执行，本月九项中选择一次。'));actions();
 }
 function menu(){
  if(ordinaryRecoveryActivityBlocked())return showRecoveryActivityRestriction();
  const chosen=monthSelection('life'),i=V26_LIFE.findIndex(o=>o.name===chosen);if(i>=0)return receipt(i);
  showEvent('生活','安排本月生活','',[],[['返回，不安排',openRoomLife,false]]);
  const b=paper('安排本月生活');if(!b)return;b.append(note('给这个月留一点自己的生活。向下滑动查看全部九项，点击插画预览；确认前不扣款，每月选择一次。'));
  const grid=document.createElement('div');grid.className='life-activity-grid';
  V26_LIFE.forEach((o,i)=>{if(o.name!==names[i])return;const button=document.createElement('button');button.className='life-activity-card';button.setAttribute('aria-label','查看 '+o.name);button.innerHTML=scene(i);const name=document.createElement('strong'),cost=document.createElement('span');name.textContent=o.name;cost.textContent=priceText(o.cost)+' · 查看安排 ›';button.append(name,cost);button.onclick=()=>preview(i);grid.append(button);});b.append(grid);actions();
 }
 $('lifestyleBtn').onclick=$('wellnessBtn').onclick=menu;
 const before=showEvent;showEvent=function(...args){document.querySelector('.life-pages-painted')?.classList.remove('life-pages-painted');return before(...args)};
})();
