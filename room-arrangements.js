// Monthly acknowledgements are additive save data; optional activities remain optional.
const ROOM_SECTIONS={work:'工作',learn:'学习',rest:'休息',life:'生活',social:'关系',finance:'财务',pets:'宠物'};
let roomReview=null;
function roomChecks(){return state.roomArrangements?.[state.month]||{}}
function roomArrangementsReady(){return Object.keys(ROOM_SECTIONS).every(k=>roomChecks()[k]?.confirmed)}
function renderRoomChecks(){
 for(const [key,label] of Object.entries(ROOM_SECTIONS)){
  const b=document.querySelector('#roomView [data-room="'+key+'"]');if(!b)continue;
  const done=!!roomChecks()[key]?.confirmed;
  b.setAttribute('aria-label',label+(done?'，本月已确认':''));
  if(done){const mark=document.createElement('span');mark.className='room-check';mark.textContent='✓';b.append(mark)}
 }
 const leave=document.querySelector('#roomView [data-room="leave"]');if(leave){leave.disabled=!roomArrangementsReady();leave.setAttribute('aria-label',roomArrangementsReady()?'确认完成，现在出门':'确认完成，现在出门（请先确认全部七项安排）')}
}
function openRoomChecklist(){
 showEvent('房屋安排','请先确认本月安排','打开各项查看内容，再确认本月安排。可选活动可以不参加，不会为了打勾自动消费、休息或购买。',Object.entries(ROOM_SECTIONS).map(([k,v])=>[v,roomChecks()[k]?.confirmed?'✓ 已确认':'待确认']),[['返回房屋',townHome,true]]);
}
function roomConfirmArrangement(review){
 if(state!==review.owner||state.month!==review.month||roomReview!==review)return;
 if(review.key==='life'&&necessaryBills().length)return openNecessaryBills();
 if(review.key==='pets'&&petCareTasks().length)return openPetCare();
 state.roomArrangements??={};state.roomArrangements[state.month]??={};
 state.roomArrangements[state.month][review.key]={confirmed:true,month:state.month};
 roomReview=null;save();townHome();
}
function openRoomLife(){
 showEvent('生活','本月生活安排','住房、基本生活费、保险及必要事项统一在这里处理。已付费用不重复收取。',necessaryBills().map(r=>[r.name,r.due?priceText(r.due):'待处理']),[
  ['住房',openHousing,true],['基本生活费',openTownLiving,false],['保险',()=>openInsurance(),false],['本月必要安排',openNecessaryBills,false],['可选生活活动',()=>$('lifestyleBtn').click(),false],['返回房屋',townHome,false]
 ]);
}
function roomOpenArrangement(key){
 if(!ROOM_SECTIONS[key])return;
 roomReview={owner:state,month:state.month,key};
 const open={work:()=>openWorkAdjustment(),learn:()=>openLearning(),rest:()=>openExtraRest(),life:openRoomLife,social:()=>$('networkBtn').click(),pets:()=>((state.pets||[]).length?openPetHub():openPetAdoptions()),finance:()=>{
  showEvent('财务','本月财务安排','查看资产与贷款；本月可以不新增投资或借款。',[
   ['可用现金',priceText(state.cash)],['月度被动收入',priceText(state.passive||0)],['必要月支出',priceText(state.expenses||0)]
  ],[['查看资产与投资',()=>{townState().screen='panel';renderRoom();$('qAssets').click()},false],['贷款与还款',openLoanPayments,false],['银行',()=>openBankLoan(),false],['返回房屋',townHome,false]]);
 }};
 return open[key]();
}
// Keep the acknowledgement available through subpages, with the current save/month frozen.
const roomArrangementShowBefore=showEvent;
showEvent=function(type,title,desc,data=[],actions=[]){
 const review=roomReview;
 const eligible=review&&state===review.owner&&state.month===review.month&&!townPending()&&townState().screen==='home'&&!['房屋安排','资金处理','宠物照护缺款','宠物照护缺时','破产确认','宠物托付','人生结束'].includes(type);
 if(eligible){
  actions=[...actions,['确认本月'+ROOM_SECTIONS[review.key]+'安排，返回房屋',()=>roomConfirmArrangement(review),true]];
 }
 const result=roomArrangementShowBefore(type,title,desc,data,actions);
 // Illustrated menus replace the actions after showEvent; restore only this explicit acknowledgement.
 if(eligible)queueMicrotask(()=>{
  if(roomReview!==review||state!==review.owner||state.month!==review.month||!document.querySelector('.event-active'))return;
  const label='确认本月'+ROOM_SECTIONS[review.key]+'安排，返回房屋';
  if([...document.querySelector('.event-active').querySelectorAll('button')].some(b=>b.textContent===label))return;
  const b=document.createElement('button');b.textContent=label;b.className='primary';b.onclick=()=>roomConfirmArrangement(review);$('actions').append(b);
 });
 return result;
};
const roomArrangementHomeBefore=townHome;townHome=function(){roomReview=null;return roomArrangementHomeBefore()};
function roomMustConfirm(){return townEnabled()&&!townPending()&&!explorationStarted()&&!roomArrangementsReady()}
const roomArrangementTownBefore=showTown;showTown=function(){if(roomMustConfirm())return openRoomChecklist();return roomArrangementTownBefore()};
const roomArrangementRollBefore=rollTown;rollTown=function(){if(roomMustConfirm())return openRoomChecklist();return roomArrangementRollBefore()};
