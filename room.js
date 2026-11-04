// Approved phone room (2026-11-01). UI adapter; existing actions own all costs and saves.
(function(){
 let visible=false;
 const el=id=>document.getElementById(id);
 function activeGame(){return !!state&&!el('game').classList.contains('hidden');}
 function syncRoom(){
  const active=visible&&activeGame();
  document.body.classList.toggle('room-screen',active);
  let box=el('roomView');
  if(!active){if(box)box.hidden=true;return;}
  if(!box){
   box=document.createElement('section');box.id='roomView';box.setAttribute('aria-label','房屋：本月安排');
   box.innerHTML='<div class="room-canvas"><img src="assets/home/room-phone-20261101.webp" width="853" height="1844" alt="温暖的手绘房间：人物坐在绿沙发阅读，柯基在地毯上休息。桌子、书架、床、厨房、沙发和茶几对应六个功能入口。"><div class="room-date"><strong id="roomCalendar"></strong><span id="roomHousingTitle">房屋 · 本月安排</span></div><button type="button" class="room-menu" data-room="menu" aria-label="打开游戏菜单">☰</button><button type="button" class="room-hotspot room-work" data-room="work" aria-label="工作">工作</button><button type="button" class="room-hotspot room-study" data-room="study" aria-label="学习">学习</button><button type="button" class="room-hotspot room-rest" data-room="rest" aria-label="休息">休息</button><button type="button" class="room-hotspot room-life" data-room="life" aria-label="生活">生活</button><button type="button" class="room-hotspot room-relations" data-room="relations" aria-label="关系">关系</button><button type="button" class="room-hotspot room-finance" data-room="finance" aria-label="财务">财务</button><button type="button" class="room-hotspot room-pets" data-room="pets" aria-label="宠物" hidden>宠物</button><button type="button" class="room-hotspot room-leave" data-room="leave" aria-label="确认完成，现在出门">确认完成，现在出门</button></div>';
   el('game').append(box);
  }
  const apartment=state.housing==='rent1',studio=state.housing==='studio',shared=state.housing==='shared',family=state.housing==='family';
  box.classList.toggle('room-apartment',apartment);
  box.classList.toggle('room-studio',studio);
  box.classList.toggle('room-shared',shared);
  box.classList.toggle('room-family',family);
  const img=box.querySelector('.room-canvas>img');
  // Unselected housing keeps the originally approved room; reservations do not choose art.
  const src=family?'assets/home/family-corgi-20261104.webp':shared?'assets/home/shared-corgi-20261104.webp':studio?'assets/home/studio-corgi-20261104.webp':apartment?'assets/home/apartment-corgi-20261104.webp':'assets/home/room-phone-20261101.webp';
  if(img.getAttribute('src')!==src)img.setAttribute('src',src);
  img.width=family?935:853;img.height=family?1683:1844;
  box.querySelector('[data-room="pets"]').hidden=!(apartment||studio||shared||family);
  el('roomHousingTitle').textContent=(family?'与家人同住':shared?'合租':studio?'Studio':apartment?'小公寓':'房屋')+' · 本月安排';
  box.hidden=false;el('roomCalendar').textContent=townCalendar();
 }
 window.openRoom=function(){
  if(!state)return;
  if(state.gameOver?.final)return showGameOver();
  visible=true;townVisible=false;state.roomLocation='home';save();
  clearModals();el('game').classList.remove('v24-running');
  document.body.classList.remove('town-map');
  render();syncRoom();
 };
 window.hideRoom=function(){visible=false;syncRoom();};
 function leaveRoom(){
  if(state.gameOver?.final)return showGameOver();
  if(state.requiredIncident)return openRequiredIncident();
  if(healthTreatmentKind(state.health)||unfinishedTreatment()||isRecoveryMonth(state))return openHealthTreatment();
  // A paused map event retains its identity and resumes instead of being re-rolled.
  if(townPending()){state.roomLocation='town';save();visible=false;syncRoom();return showTown();}
  if(necessaryBills().length)return openNecessaryBills();
  const reasons=explorationReturnReasons();
  if(reasons.length)return showEvent('暂时不能出门','先在房屋调整状态',reasons.join('；'),[],[['返回房屋',openRoom,true]]);
  state.townMode=true;state.roomLocation='town';townState();save();visible=false;syncRoom();showTown();
 }
 function learning(){
  showEvent('学习','学习与技能','先查看费用、时间与收益，再确认学习。',[],[
   ['学历学习',openEducation,true],['职业技能课程',openCoffeeCourses,false],
   ['兴趣与技能',()=>el('hobbyBtn').click(),false],['返回房屋',openRoom,false]
  ]);
 }
 function living(){
  if(window.openLifeOverview)return window.openLifeOverview();
  showEvent('生活','本月生活安排','住房、必要账单、保险与照护沿用现有规则。查看本身不扣款。',[],[
   ['住房',openHousing,true],['基本生活费',openTownLiving,false],
   ['保险与保障',()=>openInsurance(),false],['宠物生活',()=>el('petBtn').click(),false],['到期宠物照护',openPetCare,false],
   ['生活活动',()=>el('lifestyleBtn').click(),false],['返回房屋',openRoom,false]
  ]);
 }
 function finances(){
  showEvent('财务','资产、投资与贷款','查看现有账户，确认交易后才按原账本执行。',[],[
   ['ETF投资',()=>buyInvestment('ETF'),true],['股票投资',()=>buyInvestment('股票'),false],
   ['基金投资',()=>buyInvestment('基金'),false],['定期存款',()=>openCD(),false],
   ['保险与保障',()=>openInsurance(),false],['银行贷款',()=>openBankLoan(),false],['本月贷款还款',openLoanPayments,false],
   ['资产总览',()=>{state.roomLocation='overview';save();visible=false;syncRoom();clearModals();el('qAssets').click();},false],
   ['返回房屋',openRoom,false]
  ]);
 }
 const actions={work:()=>openWorkAdjustment(),study:learning,rest:()=>openExtraRest(),life:living,
  relations:()=>el('networkBtn').click(),finance:finances,pets:()=>el('petBtn').click(),leave:leaveRoom,menu:()=>el('wlMenu').click()};
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-room]');if(!b||b.disabled||!visible||!activeGame())return;
  if(document.querySelector('.event-active')||!el('wlDrawer').hidden)return;
  actions[b.dataset.room]?.();
 });
 const renderBefore=render;render=function(){const result=renderBefore();syncRoom();return result;};
 const homeBefore=home;home=function(){visible=false;syncRoom();return homeBefore();};
 // All existing "return home" actions now lead to the illustrated room.
 townHome=window.openRoom;
 const startBefore=el('start').onclick;
 el('start').onclick=function(...args){startBefore.apply(this,args);if(activeGame())openRoom();};
 // Preserve a pending map event/recovery dialog on load; new games enter here above.
 const openBefore=openGame;openGame=function(){visible=false;syncRoom();const result=openBefore();
  if(state?.roomLocation==='home'&&!townPending()&&!state.requiredIncident&&!state.gameOver?.final&&!timeReturnPending()&&!healthTreatmentKind(state.health)&&!unfinishedTreatment()&&!isRecoveryMonth(state)){
   // Loading a saved room is navigation, not a new return from the map.
   townVisible=false;openRoom();
  }
  return result;};
 for(const id of ['qOverview','qCareer','qLife','qAssets'])el(id).addEventListener('click',()=>{visible=false;syncRoom();},true);
 const nextBefore=el('qNext').onclick;
 el('qNext').onclick=function(...args){if(townPending())return nextBefore?.apply(this,args);return openRoom();};
 el('hubNext').onclick=el('qNext').onclick;
 el('wlResume').onclick=()=>{el('wlCloseMenu').click();if(townPending())showTown();else openRoom();};
})();
