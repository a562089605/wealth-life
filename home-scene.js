// Existing room artwork; all hotspots reuse the original actions and ledgers.
function roomVisible(){return townEnabled()&&!townPending()&&state.town?.screen==='home'}
function renderRoom(){
 let room=$('roomView');if(!room){room=document.createElement('section');room.id='roomView';$('game').append(room)}
 const visible=roomVisible()&&!$('game').classList.contains('hidden');
 room.hidden=!visible;document.body.classList.toggle('room-screen',visible);
 if(!visible)return;
 $('game').classList.remove('v24-running');
 const buttons=[['工作',4,25,16,7,'work'],['学习',26,16,16,6,'learn'],['休息',60,20,15,6,'rest'],['生活',81,16,15,7,'life'],['关系',67,50,16,6,'social'],['财务',13,70,16,6,'finance'],['确认完成，现在出门',26,91,49,8,'leave']];
 room.innerHTML='<h2>我的家 · '+townCalendar()+'</h2><p>先安排本月生活，再出门探索。</p><div class="room-art"><img src="assets/career/home.webp" alt="温暖的家：书桌工作、书架学习、床上休息、厨房生活、沙发关系、茶几财务"><div class="room-hotspots">'+buttons.map(([label,x,y,w,h,action])=>'<button aria-label="'+label+'" title="'+label+'" data-room="'+action+'" style="left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%"></button>').join('')+'</div></div><div class="room-tools"><button data-room="housing">住房</button><button data-room="bills">本月必要安排</button><button data-room="insurance">保险</button><button data-room="pets">宠物</button></div>';
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
finish=function(){const result=roomFinishBefore();if(roomVisible())render();return result};
document.addEventListener('click',e=>{
 const action=e.target.closest('[data-room]')?.dataset.room;if(!action)return;
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
  if(necessaryBills().length)return openNecessaryBills();
  if(explorationReturnReasons().length)return showEvent('暂时不能出门','先在房屋调整状态',explorationReturnReasons().join('；'),[],[['返回房屋',townHome,true]]);
  clearModals();showTown();save();
 }
});

for(const id of ['qOverview','qCareer','qLife','qAssets'])$(id).addEventListener('click',()=>{if(state?.townMode){townState().screen='panel';renderRoom()}},true);
$('qNext').onclick=$('hubNext').onclick=()=>townEnabled()?(townPending()||explorationStarted()?showTown():townHome()):continueLife();
