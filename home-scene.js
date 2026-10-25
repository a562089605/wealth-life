// Existing room artwork; all hotspots reuse the original actions and ledgers.
function roomVisible(){return townEnabled()&&!townPending()&&state.town?.screen==='home'}
function roomStatusMarkup(){
 const value=(id,fallback)=>$(id)?.textContent||fallback;
 const time=currentCareerTime();
 const moneyButton=(action,label,amount)=>'<button data-room="'+action+'"><span>'+label+'</span><strong>'+amount+'</strong></button>';
 const feelings=[['happiness','幸福度','#b87e49'],['health','健康','#658351'],['energy','能量','#b28d35'],['stress','压力','#a36e62']].map(([key,label,color])=>{
  const n=Math.round(state[key]||0);return '<button data-room="'+key+'" aria-label="'+(key==='happiness'?'查看身体状态':'查看'+label)+'"><span>'+label+'</span><strong>'+n+'<small> / 100</small></strong><i style="--room-state-color:'+color+'"><b style="width:'+Math.max(0,Math.min(100,n))+'%"></b></i></button>';
 }).join('');
 return '<div class="room-hud room-hud-integrated"><div class="room-hud-top"><button data-room="menu" aria-label="打开菜单">☰</button><div class="room-hud-profile"><span>职业：'+String(state.job||'暂无工作').replace(/ Barista$/,'')+'</span><span>'+state.age+'岁</span></div><span class="room-hud-date">'+townCalendar()+'</span></div><div class="room-hud-stats">'+moneyButton('cash','现金',value('wlCashValue','$'+Number(state.cash||0).toLocaleString()))+moneyButton('assets','资产',value('wlInvestValue','$0'))+moneyButton('time','剩余时间',time.free+'<small> h</small>')+'</div><div class="room-hud-feelings">'+feelings+'</div></div>';
}
// Stay home when the month's time is exhausted; use the existing settlement ledger.
function openHomeMonthEnd(){
 if(!state||!townEnabled())return;
 if(unfinishedTreatment()||healthTreatmentKind(state.health))return openHealthTreatment();
 if(townPending())return resumeTownMove();
 if(necessaryBills().length)return openNecessaryBills();
 if(currentCareerTime().free>0)return townHome();
 const owner=state,month=state.month;
 const m=calcMetrics();
 showEvent('本月安排完成','留在房屋，核对本月收支','本月自由时间已用完。确认后沿用原月末账本结算，已付费用不会重复收取；查看或返回不推进月份。',[
  ['尚待月末收付',priceText(m.remainingCF)],['预计结算后现金',priceText(state.cash+m.remainingCF)]
 ],[['确认不出门，结算本月',()=>{
  if(state!==owner||state.month!==month)return;
  if(unfinishedTreatment()||healthTreatmentKind(state.health))return openHealthTreatment();
  if(townPending())return resumeTownMove();
  if(necessaryBills().length)return openNecessaryBills();
  if(currentCareerTime().free>0)return townHome();
  const t=townState();
  t.movement={id:++t.rolls,to:t.position,die:0,month,resolved:false,payExpected:month+1,returnReason:'home-time'};
  clearModals();pending=false;townVisible=false;
  state.turn={month,index:9,startCash:state.turn?.month===month?state.turn.startCash:state.cash};
  save();settleMonth();
 },true],['返回房屋',townHome,false]]);
}
function homeMonthEndCompleted(){const move=state?.town?.movement;return move&&!move.resolved&&move.returnReason==='home-time'&&state.month>=move.payExpected}
const ROOM_PORTRAIT_BUTTONS=[['工作',3.1,20.6,18,5.5,'work'],['学习',25.7,13.8,18,5.5,'learn'],['休息',58.3,14.5,18,5.5,'rest'],['生活',78.8,15.3,18.2,5.5,'life'],['关系',73.9,46.4,20.5,5.5,'social'],['财务',8.7,64.5,20,5.5,'finance'],['宠物',73.8,74.3,19.3,5.5,'pets'],['确认完成，现在出门',16.5,91.1,67,6,'leave']];
const roomResumeBefore=resumeTownMove;
resumeTownMove=function(){if(homeMonthEndCompleted()){resolveTownMove();return townHome()}return roomResumeBefore()};
function renderRoom(){
 let room=$('roomView');if(!room){room=document.createElement('section');room.id='roomView';$('game').append(room)}
 const visible=roomVisible()&&!$('game').classList.contains('hidden');
 room.hidden=!visible;document.body.classList.toggle('room-screen',visible);document.body.classList.toggle('room-interior',visible);
 if(!visible)return;
 $('game').classList.remove('v24-running');
 room.innerHTML='<div class="room-art room-portrait"><img src="assets/career/home-mobile.webp" alt="手机竖版手绘房屋：工作书桌、学习书架、休息床铺、生活厨房、关系沙发、财务茶几和宠物柯基"><div class="room-hotspots">'+ROOM_PORTRAIT_BUTTONS.map(([label,x,y,w,h,action])=>'<button aria-label="'+label+'" title="'+label+'" data-room="'+action+'" style="left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%"></button>').join('')+'</div></div>';
 const art=room.querySelector?.('.room-portrait');if(art)art.insertAdjacentHTML('beforeend',roomStatusMarkup());
 if(typeof renderRoomChecks==='function')renderRoomChecks();
}
townHome=function(){townVisible=false;townState().screen='home';$('game').classList.remove('v24-running');clearModals();save();render()};
townStart=function(){state.townMode=true;townState();townHome()};
const roomShowTownBefore=showTown;
showTown=function(){townState().screen='map';return roomShowTownBefore()};
const roomRenderBefore=render;
render=function(){roomRenderBefore();renderRoom()};
const roomOpenBefore=openGame;
openGame=function(){if(state?.townMode&&!townPending())townState().screen='home';const result=roomOpenBefore();if(roomVisible()){townVisible=false;render()}return result};
const roomFinishBefore=finish;
finish=function(){const result=roomFinishBefore();if(homeMonthEndCompleted()&&!document.querySelector('.event-active')){resolveTownMove();townHome()}if(roomVisible())render();return result};
document.addEventListener('click',e=>{
 const action=e.target.closest('[data-room]')?.dataset.room;if(!action)return;
 const statusActions={menu:'wlMenu',assets:'wlInvest',cash:'wlCash',happiness:'wlHappy',health:'wlHappy',energy:'wlHappy',stress:'wlHappy'};
 if(statusActions[action])return $(statusActions[action]).click();
 if(action==='time'){const t=currentCareerTime();return showEvent('时间安排','本月自由时间','查看时间预算不会消耗时间。',[['本月剩余自由时间',t.free+'h']],[['返回房屋',townHome,true]])}
 if(typeof roomOpenArrangement==='function'&&['work','learn','rest','life','social','finance','pets'].includes(action))return roomOpenArrangement(action);
 if(action==='work')return openWorkAdjustment();
 if(action==='learn')return openLearning();
 if(action==='rest')return openExtraRest();
 if(action==='life')return $('lifestyleBtn').click();
 if(action==='social')return $('networkBtn').click();
 if(action==='finance'){townState().screen='panel';renderRoom();return $('qAssets').click();}
 if(action==='housing')return openHousing();
 if(action==='bills')return openNecessaryBills();
 if(action==='insurance')return openInsurance();
 if(action==='pets')return $('petBtn').click();
 if(action==='leave'){
  if(typeof roomArrangementsReady==='function'&&!roomArrangementsReady())return openRoomChecklist();
  if(currentCareerTime().free<=0)return openHomeMonthEnd();
  if(necessaryBills().length)return openNecessaryBills();
  if(explorationReturnReasons().length)return showEvent('暂时不能出门','先在房屋调整状态',explorationReturnReasons().join('；'),[],[['返回房屋',townHome,true]]);
  clearModals();showTown();save();
 }
});

for(const id of ['qOverview','qCareer','qLife','qAssets'])$(id).addEventListener('click',()=>{if(state?.townMode){townState().screen='panel';renderRoom()}},true);
$('qNext').onclick=$('hubNext').onclick=()=>townEnabled()?(townPending()||explorationStarted()?showTown():townHome()):continueLife();
