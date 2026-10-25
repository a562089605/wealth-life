// Existing room artwork; all hotspots reuse the original actions and ledgers.
function roomVisible(){return townEnabled()&&!townPending()&&state.town?.screen==='home'}
function roomStatusMarkup(){
 const value=(id,fallback)=>$(id)?.textContent||fallback;
 return '<div class="room-hud"><div class="room-hud-top"><button data-room="menu" aria-label="打开菜单">☰</button><span>'+townCalendar()+'</span></div><div class="room-hud-stats"><button data-room="assets" aria-label="查看投资资产"><span>资产</span><strong>'+value('wlInvestValue','$0')+'</strong></button><button data-room="cash" aria-label="查看现金与收支"><span>现金</span><strong>'+value('wlCashValue','$'+Number(state.cash||0).toLocaleString())+'</strong></button><button data-room="happiness" aria-label="查看身体状态"><span>幸福度</span><strong>'+value('wlHappyValue',Math.round(state.happiness||0))+'</strong></button></div></div>';
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
const roomResumeBefore=resumeTownMove;
resumeTownMove=function(){if(homeMonthEndCompleted()){resolveTownMove();return townHome()}return roomResumeBefore()};
function renderRoom(){
 let room=$('roomView');if(!room){room=document.createElement('section');room.id='roomView';$('game').append(room)}
 const visible=roomVisible()&&!$('game').classList.contains('hidden');
 room.hidden=!visible;document.body.classList.toggle('room-screen',visible);
 if(!visible)return;
 $('game').classList.remove('v24-running');
 const buttons=[['工作',4,25,16,7,'work'],['学习',26,16,16,6,'learn'],['休息',60,20,15,6,'rest'],['生活',81,16,15,7,'life'],['关系',67,50,16,6,'social'],['财务',13,70,16,6,'finance'],['宠物',47,78,19,6,'pets'],['确认完成，现在出门',26,91,49,8,'leave']];
 room.innerHTML='<h2>我的家 · '+townCalendar()+'</h2><p>逐项打开并确认本月安排，完成后再出门。</p><div class="room-art"><img src="assets/career/home.webp" alt="温暖的家：书桌工作、书架学习、床上休息、厨房生活、沙发关系、茶几财务"><div class="room-hotspots">'+buttons.map(([label,x,y,w,h,action])=>'<button aria-label="'+label+'" title="'+label+'" data-room="'+action+'" style="left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%">'+(action==='pets'?'<span class="room-pet-label">宠物</span>':'')+'</button>').join('')+'</div></div>';
 if(typeof renderRoomChecks==='function')renderRoomChecks();
 const art=room.querySelector?.('.room-art');if(art)art.insertAdjacentHTML('beforeend',roomStatusMarkup());
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
 const statusActions={menu:'wlMenu',assets:'wlInvest',cash:'wlCash',happiness:'wlHappy'};
 if(statusActions[action])return $(statusActions[action]).click();
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
