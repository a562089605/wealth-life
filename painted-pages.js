// Approved five-page batch, 2026-11-01. Existing finance and recovery engines remain authoritative.
(function(){
 const el=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let page=null,restQuote=null;
 let detailKey='family',billQuote=null;
 const detailAssets={family:['family','family-occupied-500'],shared:['shared-reservation-900','shared-occupied-900'],studio:['studio-reservation-1400','studio-occupied-1400'],rent1:['one-bedroom-reservation-1600','one-bedroom-occupied-1600']};
 function close(){page=null;document.body.classList.remove('painted-screen');const box=el('paintedView');if(box)box.hidden=true;}
 function button(action,label,style,disabled=false){return '<button type="button" class="painted-hotspot" data-painted="'+action+'" aria-label="'+esc(label)+'" style="'+style+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';}
 function patch(text,style,kind=''){return '<div class="painted-value '+kind+'" style="'+style+'">'+esc(text)+'</div>';}
 const image=name=>'<img class="painted-image" src="assets/pages/'+name+'-20261101.webp" width="853" height="1844" alt="'+({rest:'休息安排：人物在绿色沙发上休息，柯基睡在旁边',housing:'四种住房选择',family:'与家人同住：阳光照进绿色格纹床铺的卧室'}[name]||'生活与住房详情')+'">';
 function stats(name){
  const free=currentCareerTime().free;
  if(name==='rest')return [[free+'h',5.7],[Math.round(state.energy),24.3],[Math.round(state.stress),43.4],[Math.round(state.health),62.3],[Math.round(state.happiness),81.1]].map(([v,x])=>patch(v,'left:'+x+'%;top:60%;width:13.6%;height:3.1%','rest-stat')).join('');
  return patch(Math.round(state.health),'left:26%;top:27.2%;width:15%;height:4.5%')+patch(Math.round(state.energy),'left:72%;top:27.2%;width:18%;height:4.5%')+patch(Math.round(state.happiness),'left:26%;top:39.1%;width:15%;height:4.5%')+patch(Math.round(state.stress),'left:72%;top:39.1%;width:18%;height:4.5%')+patch(free+'h','left:35%;top:52.7%;width:40%;height:5.5%');
 }
 function housingName(){return ({family:'与家人同住',shared:'合租',studio:'Studio',rent1:'一居室',own:'自住房'})[state.housing]||'尚未选择';}
 function draw(){
  const active=!!page&&!!state&&!el('game').classList.contains('hidden');
  document.body.classList.toggle('painted-screen',active);
  let box=el('paintedView');if(!active){if(box)box.hidden=true;return;}
  if(!box){box=document.createElement('section');box.id='paintedView';el('game').append(box);}
  const labels={rest:'休息安排',life:'生活安排',housing:'住房选择',detail:'住房详情'};
  box.hidden=false;box.setAttribute('aria-label',labels[page]);
  const current=state.housing===detailKey;
  let html=image(page==='life'?'life-monthly-bill':page==='detail'?detailAssets[detailKey][current?1:0]:page);
  if(page==='rest'){
   const missing=restMissing();restQuote={cycle:state.month,count:monthlyRest().entries.length};
   html+=stats(page)+button('room','返回房屋','left:3%;top:2.2%;width:25%;height:4%')+button('rest-confirm','确认休息4小时','left:11%;top:84.7%;width:78%;height:5%',!!missing.length)+button('room','返回房屋','left:11%;top:90.5%;width:78%;height:5%');
   html+='<div class="painted-preview-cover" style="left:30%;top:96%;width:40%;height:2.5%"></div>';
   if(missing.length)html+='<div class="painted-alert" role="status">'+esc(missing.join('；'))+'</div>';
  }else if(page==='life'){
   html+=patch(townCalendar(),'left:12%;top:12.5%;width:29%;height:2.4%','painted-date')+stats(page);
   billQuote=livingBillQuote();const q=billQuote,paid=paymentReceipt();
   html+=patch('当前住房：'+housingName(),'left:31%;top:65.9%;width:53%;height:3%','painted-caption life-current');
   const status=q.blocked?'待交接':!q.selected?'待选住房':q.total>0?'待支付':'已支付';
   html+='<div class="life-bill" aria-live="polite"><header><strong>本月生活账单</strong><span>'+status+'</span></header><div><span>'+(livingTotal()>livingBaseAmount(state)?'基本生活及日常养护':'基本生活费')+'</span><b>'+esc(money(livingTotal()))+(q.living<=0?' · 已支付':paid.living>0?' · 待付 '+esc(money(q.living)):'')+'</b></div><div><span>'+esc(housingName())+'租金</span><b>'+(!q.selected?'待选择':q.blocked?'待交接':esc(money(state.housingCost||0))+(q.housing<=0?' · 已支付':paid.housing>0?' · 待付 '+esc(money(q.housing)):''))+'</b></div><footer><strong>本月待付</strong><b>'+(!q.selected?'先选择住房':q.blocked?'先办理交接':esc(money(q.total)))+'</b></footer></div>';
   const label=q.blocked?'办理住房交接':!q.selected?'先选择住房':q.total<=0?'本月已支付':state.cash<q.total?'资金不足 · 查看补救':'确认支付本月生活账单';
   html+=patch(label,'left:19%;top:90%;width:62%;height:3.7%','painted-button-caption');
   html+=button('health','健康：治疗与康复','left:4%;top:23.5%;width:45%;height:11.5%')+button('rest','能量：安排休息','left:51%;top:23.5%;width:45%;height:11.5%')+button('activities','幸福度：生活活动','left:4%;top:35.5%;width:45%;height:12%')+button('rest','压力：放松减压','left:51%;top:35.5%;width:45%;height:12%');
   html+=button('housing','查看住房或更换住房','left:4%;top:64.3%;width:92%;height:7.6%')+button('life-confirm',label,'left:16%;top:89.2%;width:68%;height:5.3%',q.selected&&!q.blocked&&q.total<=0)+button('room','返回房屋','left:35%;top:95%;width:30%;height:3.5%');
  }else if(page==='housing'){
   html+=patch('当前住房：'+housingName(),'left:34%;top:21%;width:51%;height:2.7%','painted-caption');
   html+=button('life','返回生活','left:3%;top:2%;width:25%;height:3.6%');
   for(const [key,y]of [['family',26],['shared',41.6],['studio',57.4],['rent1',73.1]]){if(state.housing===key)html+=patch('✓ 当前住房 · 已入住','left:54%;top:'+(y+12)+'%;width:35%;height:2%','housing-current');html+=button('housing-'+key,'查看'+({family:'与家人同住',shared:'合租',studio:'Studio',rent1:'一居室'})[key]+'详情','left:4%;top:'+y+'%;width:92%;height:14.1%');}
   html+='<div class="painted-preview-cover housing-rule-cover" aria-hidden="true"></div>';
   if(state.pendingHousingMove)html+=button('cancel-move','已预约次月入住'+state.pendingHousingMove.name+' · 取消预约','left:19%;top:88.8%;width:62%;height:3.4%');
   html+=button('life','返回生活','left:28%;top:92.2%;width:45%;height:5%');
  }else if(page==='detail'){
   const h=housingChoices().find(x=>x[3]===detailKey),q=housingQuote(h),occupied=q.current;
   const family=detailKey==='family',studio=detailKey==='studio';
   const booked=state.pendingHousingMove?.key===detailKey;
   const label=occupied?'更换住房':booked?'已预约下月入住':q.scheduled?'预约下月入住':'确认入住';
   const monthlyTop=family?(occupied?76:75.1):studio?(occupied?75.8:74.5):76;
   html+=patch(money(q.monthly)+' / 月','left:26%;top:'+monthlyTop+'%;width:48%;height:5.2%','housing-rent');
   if(!family){
    html+=patch(money(occupied?heldHousingDeposit():q.deposit),'left:27%;top:'+(studio?82.4:83.2)+'%;width:19%;height:3.1%','housing-small');
    html+=patch(occupied?((paymentReceipt().housing||0)>=q.monthly?'已支付':'待支付'):money(q.first?q.total:q.monthly+q.deposit),'left:53%;top:'+(studio?82.4:83.2)+'%;width:23%;height:3.1%','housing-small');
   }else if(occupied)html+=patch((paymentReceipt().housing||0)>=q.monthly?'✓ 本月住房费已支付':'本月住房费待支付','left:30%;top:82.3%;width:40%;height:2.5%','painted-caption');
   const primaryTop=family&&!occupied?84.2:studio?88.5:occupied?88.5:90.2;
   const secondaryTop=family&&!occupied?91:studio?94:occupied?94:95;
   html+=patch(label,'left:23%;top:'+(primaryTop+.5)+'%;width:54%;height:3.7%','painted-button-caption');
   html+=button(occupied?'housing':'detail-confirm',label,'left:18%;top:'+primaryTop+'%;width:64%;height:5.3%',!occupied&&(booked||state.cash<q.total));
   html+=button(occupied?'life':'housing',occupied?'返回生活':'返回住房选择','left:18%;top:'+secondaryTop+'%;width:64%;height:4.5%');
   html+=button(occupied?'life':'housing',occupied?'返回生活':'返回住房选择','left:3%;top:2%;width:31%;height:3.8%');
   if(!occupied&&!family){const note=booked?'已预约下月入住 · 取消预约':q.scheduled?'下月搬入 · 预约不扣款':'确认后入住';
    html+=patch(note,'left:27%;top:'+(studio?86.1:87.3)+'%;width:46%;height:2.2%','painted-caption');
    if(booked)html+=button('cancel-move','取消预约','left:25%;top:'+(studio?85.3:86.5)+'%;width:50%;height:3%');
   }
   if(!occupied&&family&&booked)html+=button('cancel-move','取消预约','left:30%;top:81%;width:40%;height:3%');
   if(!occupied&&state.cash<q.total)html+='<div class="painted-alert" role="status">可用现金不足，尚需 '+esc(money(q.total-state.cash))+'</div>'+button('funding','筹措住房资金','left:18%;top:79%;width:64%;height:4%');
  }
  box.innerHTML='<div class="painted-canvas '+page+'">'+html+'</div>';
 }
 function open(name){if(!state)return;window.hideRoom?.();clearModals();page=name;townVisible=false;el('game').classList.remove('v24-running');document.body.classList.remove('town-map');draw();}
 window.openLifeOverview=()=>open('life');
 window.openHousingSelection=()=>open('housing');
 window.openHousingDetail=openDetail;
 el('qLife').onclick=()=>openLifeOverview();
 const roomBefore=window.openRoom;window.openRoom=function(){close();return roomBefore();};townHome=window.openRoom;
 openExtraRest=function(){if(state.health<30||isRecoveryMonth(state))return openHealthTreatment();open('rest');};
 openHousing=function(){if(housingHandoverDue())return openHousingHandover();open('housing');};el('housingBtn').onclick=openHousing;
 function openDetail(key){detailKey=key;if(!detailAssets[key])return openHousingSelection();open('detail');}
 function confirmLife(){
  const q=livingBillQuote();if(q.blocked)return openHousingHandover();if(!q.selected)return openHousing();
  if(state.cash<q.total)return showFundingOptions(q.total,openLifeOverview);
  if(billQuote)confirmLivingBill(billQuote.month,billQuote.token);draw();
 }
 // Native handover retains its atomic ledger and refund logic; return to the new life bill afterward.
 const handoverBefore=confirmHousingHandover;confirmHousingHandover=function(){const r=handoverBefore();if(r===true)openLifeOverview();return r;};
 const actions={room:()=>openRoom(),life:()=>openLifeOverview(),rest:()=>openExtraRest(),housing:()=>openHousing(),living:()=>openTownLiving(),health:()=>openHealthTreatment(),activities:()=>el('lifestyleBtn').click(),
  'cancel-move':()=>{cancelHousingMove();draw();},'life-confirm':confirmLife,'detail-confirm':()=>{const key=detailKey;if(confirmHousing(key)!==false){if(state.housing===key)openDetail(key);else openHousingSelection();}else draw();},
  'rest-confirm':()=>{const quote=restQuote;return confirmExtraRest(quote.cycle,quote.count);},
  funding:()=>{const h=housingChoices().find(x=>x[3]===detailKey);showFundingOptions(housingQuote(h).total,()=>openDetail(detailKey));}
 };
 document.addEventListener('click',e=>{const b=e.target.closest('[data-painted]');if(!b||b.disabled||!page||document.querySelector('.event-active')||!el('wlDrawer').hidden)return;
  const action=b.dataset.painted;if(action.startsWith('housing-')){const key=action.slice(8);openDetail(key);return;}
  if(action==='rest-confirm'||action==='detail-confirm')b.disabled=true;
  actions[action]?.();
 });
 const finishBefore=finish;finish=function(){const r=finishBefore();draw();return r;};
 const renderBefore=render;render=function(){const r=renderBefore();draw();return r;};
 const homeBefore=home;home=function(){close();return homeBefore();};
 const gameBefore=openGame;openGame=function(){close();return gameBefore();};
 for(const id of ['qOverview','qCareer','qLife','qAssets'])el(id).addEventListener('click',close,true);
})();
