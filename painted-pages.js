// Approved five-page batch, 2026-11-01. Existing finance and recovery engines remain authoritative.
(function(){
 const el=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let page=null,restQuote=null;
 const homesBefore=housingOptions;
 housingOptions=function(){return homesBefore().map(h=>h[3]==='family'?[h[0],500,0,h[3]]:h);};
 const quoteBefore=housingQuote;
 housingQuote=function(h){const q=quoteBefore(h);if(h[3]!=='family')return q;
  const rent=roundCash(Math.max(0,500-(paymentReceipt().housing||0)));
  return {...q,monthly:500,rent,deposit:0,total:q.scheduled?0:rent};
 };
 function close(){page=null;document.body.classList.remove('painted-screen');const box=el('paintedView');if(box)box.hidden=true;}
 function button(action,label,style,disabled=false){return '<button type="button" class="painted-hotspot" data-painted="'+action+'" aria-label="'+esc(label)+'" style="'+style+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';}
 function patch(text,style,kind=''){return '<div class="painted-value '+kind+'" style="'+style+'">'+esc(text)+'</div>';}
 const image=name=>'<img class="painted-image" src="assets/pages/'+name+'-20261101.webp" width="853" height="1844" alt="'+({rest:'休息安排：人物在绿色沙发上休息，柯基睡在旁边',life:'生活总览',housing:'四种住房选择',family:'与家人同住：阳光照进绿色格纹床铺的卧室'}[name])+'">';
 function stats(name){
  const free=currentCareerTime().free;
  if(name==='rest')return [[free+'h',5.7],[Math.round(state.energy),24.3],[Math.round(state.stress),43.4],[Math.round(state.health),62.3],[Math.round(state.happiness),81.1]].map(([v,x])=>patch(v,'left:'+x+'%;top:60%;width:13.6%;height:3.1%','rest-stat')).join('');
  return patch(Math.round(state.health),'left:26%;top:27.2%;width:15%;height:4.5%')+patch(Math.round(state.energy),'left:75%;top:27.2%;width:15%;height:4.5%')+patch(Math.round(state.happiness),'left:26%;top:39.1%;width:15%;height:4.5%')+patch(Math.round(state.stress),'left:75%;top:39.1%;width:15%;height:4.5%')+patch(free+'h','left:35%;top:52.7%;width:40%;height:5.5%');
 }
 function housingName(){return ({family:'与家人同住',shared:'合租',studio:'Studio',rent1:'一居室',own:'自住房'})[state.housing]||'尚未选择';}
 function draw(){
  const active=!!page&&!!state&&!el('game').classList.contains('hidden');
  document.body.classList.toggle('painted-screen',active);
  let box=el('paintedView');if(!active){if(box)box.hidden=true;return;}
  if(!box){box=document.createElement('section');box.id='paintedView';el('game').append(box);}
  const labels={rest:'休息安排',life:'生活安排',housing:'住房选择',family:'与家人同住详情'};
  box.hidden=false;box.setAttribute('aria-label',labels[page]);
  let html=image(page);
  if(page==='rest'){
   const missing=restMissing();restQuote={cycle:state.month,count:monthlyRest().entries.length};
   html+=stats(page)+button('room','返回房屋','left:3%;top:2.2%;width:25%;height:4%')+button('rest-confirm','确认休息4小时','left:11%;top:84.7%;width:78%;height:5%',!!missing.length)+button('room','返回房屋','left:11%;top:90.5%;width:78%;height:5%');
   html+='<div class="painted-preview-cover" style="left:30%;top:96%;width:40%;height:2.5%"></div>';
   if(missing.length)html+='<div class="painted-alert" role="status">'+esc(missing.join('；'))+'</div>';
  }else if(page==='life'){
   html+=patch(townCalendar(),'left:12%;top:12.5%;width:29%;height:2.4%','painted-date')+stats(page);
   const cost=state.housing&&state.housing!=='unselected'?housingName()+' · '+money(state.housingCost||0)+' / 月':'尚未选择';
   html+=patch(cost,'left:31%;top:70.2%;width:50%;height:2.4%','painted-caption')+patch(money(livingBaseAmount(state))+' / 月','left:31%;top:79.1%;width:40%;height:2.4%','painted-caption');
   html+=button('health','健康：治疗与康复','left:4%;top:23.5%;width:45%;height:11.5%')+button('rest','能量：安排休息','left:51%;top:23.5%;width:45%;height:11.5%')+button('activities','幸福度：生活活动','left:4%;top:35.5%;width:45%;height:12%')+button('rest','压力：放松减压','left:51%;top:35.5%;width:45%;height:12%');
   html+=button('housing','住房','left:4%;top:65.7%;width:92%;height:8%')+button('living','基本生活费','left:4%;top:74.5%;width:92%;height:8%')+button('life-confirm','确认生活安排','left:16%;top:84.2%;width:68%;height:6%')+button('room','返回房屋','left:35%;top:91.2%;width:30%;height:3.4%');
   html+='<div class="painted-preview-cover" style="left:30%;top:96%;width:40%;height:2.5%"></div>';
  }else if(page==='housing'){
   html+=patch('当前住房：'+housingName(),'left:34%;top:21%;width:51%;height:2.7%','painted-caption');
   html+=button('life','返回生活','left:3%;top:2%;width:25%;height:3.6%');
   for(const [key,y]of [['family',26],['shared',41.6],['studio',57.4],['rent1',73.1]])html+=button('housing-'+key,'查看'+({family:'与家人同住',shared:'合租',studio:'Studio',rent1:'一居室'})[key]+'详情','left:4%;top:'+y+'%;width:92%;height:14.1%');
   html+='<div class="painted-preview-cover housing-rule-cover" aria-hidden="true"></div>';
   if(state.pendingHousingMove)html+=button('cancel-move','已预约次月入住'+state.pendingHousingMove.name+' · 取消预约','left:19%;top:88.8%;width:62%;height:3.4%');
   html+=button('life','返回生活','left:28%;top:92.2%;width:45%;height:5%');
  }else if(page==='family'){
   const h=housingChoices().find(x=>x[3]==='family'),q=housingQuote(h);
   const label=q.current?'确认本月住房':q.scheduled?'预约次月入住':'确认入住';
   html+=button('housing','返回住房选择','left:3%;top:2%;width:31%;height:3.6%')+button('family-confirm',label,'left:18%;top:84.2%;width:64%;height:6.1%',state.cash<q.total)+button('housing','返回住房选择','left:18%;top:91%;width:64%;height:5.5%');
   if(q.current||q.scheduled)html+=patch(label,'left:22%;top:85%;width:56%;height:4%','painted-button-caption');
   if(state.cash<q.total)html+='<div class="painted-alert" role="status">可用现金不足，尚需 '+esc(money(q.total-state.cash))+'</div>'+button('funding','筹措住房资金','left:18%;top:79%;width:64%;height:4%');
  }
  box.innerHTML='<div class="painted-canvas '+page+'">'+html+'</div>';
 }
 function open(name){if(!state)return;window.hideRoom?.();clearModals();page=name;townVisible=false;el('game').classList.remove('v24-running');document.body.classList.remove('town-map');draw();}
 window.openLifeOverview=()=>open('life');
 window.openHousingSelection=()=>open('housing');
 const roomBefore=window.openRoom;window.openRoom=function(){close();return roomBefore();};townHome=window.openRoom;
 openExtraRest=function(){if(state.health<30||isRecoveryMonth(state))return openHealthTreatment();open('rest');};
 openHousing=function(){if(housingHandoverDue())return openHousingHandover();open('housing');};el('housingBtn').onclick=openHousing;
 function otherHousing(key){const h=housingChoices().find(x=>x[3]===key);if(!h)return;const q=housingQuote(h);
  showEvent('住房',h[0],'',[[ '每月住房费用',priceText(q.monthly)],['押金',priceText(q.deposit)],['本次应付',priceText(q.total)]],[[q.scheduled?'预约次月入住':'确认入住',()=>{if(confirmHousing(key)!==false)openLifeOverview();},true,state.cash<q.total],['返回住房选择',openHousingSelection,false]]);
 }
 function confirmLife(){
  if(!state.housing||state.housing==='unselected'||housingHandoverDue())return openHousing();
  const h=housingChoices().find(x=>x[3]===state.housing);if(h&&housingQuote(h).rent>.005)return otherHousing(state.housing);
  if(livingTotal()-(paymentReceipt().living||0)>.005)return openTownLiving();
  setMonthSelection('lifeArrangement',true);save();openRoom();
 }
 const actions={room:()=>openRoom(),life:()=>openLifeOverview(),rest:()=>openExtraRest(),housing:()=>openHousing(),living:()=>openTownLiving(),health:()=>openHealthTreatment(),activities:()=>el('lifestyleBtn').click(),
  'cancel-move':()=>{cancelHousingMove();draw();},'life-confirm':confirmLife,'family-confirm':()=>{if(confirmHousing('family')!==false)openLifeOverview();},
  'rest-confirm':()=>{const quote=restQuote;return confirmExtraRest(quote.cycle,quote.count);},
  funding:()=>{const h=housingChoices().find(x=>x[3]==='family');showFundingOptions(housingQuote(h).total,()=>open('family'));}
 };
 document.addEventListener('click',e=>{const b=e.target.closest('[data-painted]');if(!b||b.disabled||!page||document.querySelector('.event-active')||!el('wlDrawer').hidden)return;
  const action=b.dataset.painted;if(action.startsWith('housing-')){const key=action.slice(8);if(key==='family')open('family');else otherHousing(key);return;}
  if(action==='rest-confirm'||action==='family-confirm')b.disabled=true;
  actions[action]?.();
 });
 const finishBefore=finish;finish=function(){const r=finishBefore();draw();return r;};
 const renderBefore=render;render=function(){const r=renderBefore();draw();return r;};
 const homeBefore=home;home=function(){close();return homeBefore();};
 const gameBefore=openGame;openGame=function(){close();return gameBefore();};
 for(const id of ['qOverview','qCareer','qLife','qAssets'])el(id).addEventListener('click',close,true);
})();
