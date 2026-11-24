// V28 candidate: town navigation shares the existing state, ledger and settlement.
const TOWN_LEGACY_TYPES=['payday','opportunity','life','community','market','career','payday','growth','opportunity','life','career','opportunity','payday','community','market','growth','opportunity','life','payday','career','community','opportunity','market','growth'];
const TOWN_TYPES=['payday','opportunity','life','life','opportunity','career','payday','opportunity','opportunity','life','career','opportunity','payday','life','opportunity','life','opportunity','opportunity','payday','career','life','opportunity','opportunity','life'];
function townMoveType(move){return move.type || TOWN_LEGACY_TYPES[move.to];}
const TOWN_ART='assets/career/town-stepping-stones/';
let townAnimating=false;
const TOWN_LABELS={payday:'发薪日',opportunity:'投资机会',market:'市场',life:'生活',growth:'学习成长',career:'职业',risk:'风险事件',community:'关系／社区'};
const TOWN_ICONS={payday:'＄',opportunity:'✦',market:'↗',life:'♥',growth:'书',career:'职',risk:'!',community:'友'};
let townVisible=false;
function townState(){return state.town??={version:1,position:0,rolls:0,movement:null,history:[]}}
function townPending(){return !!state?.town?.movement&&!state.town.movement.resolved}
function townEnabled(){return !!state?.townMode}
function townStart(){if(townAnimating)return;if(window.leaveTownRoom)return window.leaveTownRoom();}
function showTown(){if(state.requiredIncident)return openRequiredIncident();if(state.roomLocation==='home'&&window.leaveTownRoom)return window.leaveTownRoom();townVisible=true;$('game').classList.remove('v24-running');clearModals();render();if(townPending())resumeTownMove()}
function originalMonthlyPlay(){if(townPending())return;state.townMode=false;townVisible=false;save();document.body.classList.remove('town-map');clearModals();render();startV24Turn(false)}
// 24 equally spaced paving positions on the illustrated winding street; indices keep old saves valid.
const TOWN_ROAD_POINTS=[{"x":28.164,"y":57.489},{"x":30.927,"y":51.355},{"x":30.927,"y":45.506},{"x":26.56,"y":40.514},{"x":25.134,"y":35.021},{"x":30.838,"y":31.669},{"x":38.414,"y":29.957},{"x":46.346,"y":28.887},{"x":54.991,"y":30.1},{"x":62.478,"y":31.954},{"x":70.856,"y":33.381},{"x":77.273,"y":36.662},{"x":77.986,"y":41.013},{"x":74.153,"y":45.649},{"x":78.164,"y":50.785},{"x":77.807,"y":56.348},{"x":75.045,"y":61.484},{"x":68.984,"y":64.194},{"x":63.904,"y":67.047},{"x":57.843,"y":67.903},{"x":49.822,"y":67.832},{"x":43.316,"y":67.332},{"x":37.166,"y":65.977},{"x":31.194,"y":61.698}];
function townPoint(i){return TOWN_ROAD_POINTS[((i%24)+24)%24]}
function townPaydayDistance(){for(let d=1;d<=24;d++)if(TOWN_TYPES[(townState().position+d)%24]==='payday')return d}
function townCalendar(){return '第'+(Math.floor(state.month/12)+1)+'年 · 第'+(state.month%12+1)+'月'}
function openTownLiving(){showEvent('基本生活费','本月必要生活成本','',[],[['返回家中',townHome,false]]);$('eventData').innerHTML=livingMarkup().replace('data-v26="livingFund"','data-town="livingFund"').replace('保险在保险步骤确认；贷款月供请在财富步骤的还款卡确认。','保险可回家安排；月供在储蓄投资与贷款中确认。');$('eventData').style.display='block'}
function townCareerNotice(move){
 if(!move.careerNotice&&state.pendingCareerNotice){move.careerNotice=structuredClone(state.pendingCareerNotice);state.pendingCareerNotice=null;save()}
 const n=move.careerNotice;if(!n||n.acknowledged)return false;
 showEvent('职业成长','经验与技能带来晋升',n.job+' 晋升到成长等级 '+n.rank+'。这次加薪已由原有职业系统计入，不会在确认时再加一次。',[['当前税前月薪',priceText(n.salary)],['生效时间','下次发薪按当前工资结算']],[['确认，继续行程',()=>{n.acknowledged=true;save();clearModals();resumeTownMove()},true]]);$('eventClose').hidden=true;return true;
}
function renderTown(){
 const game=$('game');document.body.classList.toggle('town-map',townEnabled()&&townVisible&&!game.classList.contains('hidden'));
 if(!townEnabled()||!townVisible)return;game.classList.remove('v24-running');const t=townState();let box=$('townView');if(!box){box=document.createElement('section');box.id='townView';game.append(box)}
 const pos=townPoint(t.position),last=t.movement;
 $('wlFreeTimeValue').textContent=currentCareerTime().free+'h';
 const locked=townPending()||townAnimating||state.gameOver?.final;
 const die=last?.die||1;
 const pawnArt=globalThis.SchoolCareer?.role(state.job) ? 'teacher.webp'
  : coffeeSalaryRole(state.job)==='barista' ? 'barista.webp' : null;
 box.innerHTML=`<div class="town-toolbar"><b>起步小镇</b><p class="town-return-rules"><strong>触发回家</strong> 自由时间用完、幸福或能量低于 20、压力达到 80 或以上。<span>现金不足时，部分付费选项不可用。</span></p></div>
 <div class="town-map-scene town-stepping-board"><img src="${TOWN_ART}board.webp" alt="沿碎石路环绕喷泉的二十四块手绘汀步石">
 <span class="town-pawn" data-town-pawn style="left:${pos.x}%;top:${pos.y}%" aria-label="玩家当前位置第${t.position+1}格">${pawnArt?`<img src="${TOWN_ART}${pawnArt}" alt="">`:'●'}</span>
 <img class="town-flight-die" data-town-flight alt="" hidden></div>
 <div class="town-roll-controls"><button type="button" class="town-crystal-button" data-town="roll" aria-label="掷骰子" ${locked?'disabled':''}><img src="${TOWN_ART}die-${die}.webp" alt="">掷骰子</button><button type="button" class="town-return-button" data-town="home" aria-label="回家并结算本月" ${locked?'disabled':''}><img src="assets/finance/bill-house.webp" alt="">回家</button></div>
 <div class="town-asset-controls"><button type="button" data-town="holdings" ${locked?'disabled':''}>地图资产</button></div>
 ${townPending()&&!townAnimating?'<button type="button" data-town="resume">继续处理当前事件</button>':''}`;

}
function rollTown(){
 if(!townEnabled()||townAnimating||townPending()||document.querySelector('.event-active')||state.gameOver?.final)return;
 if(!state.housing||state.housing==='unselected')return openHousing();
 if(state.requiredIncident)return openRequiredIncident();
 if(state.crisis&&state.crisis.ackMonth!==state.month)return showRecovery();
 const t=townState(),die=townDie(),from=t.position,path=Array.from({length:die},(_,i)=>(from+i+1)%24);
 const prior=t.movement,to=path.at(-1),type=TOWN_TYPES[to];
 const move={id:++t.rolls,die,from,to,path,type,month:state.month,payExpected:type==='payday'?state.month+1:null,payDone:false,resolved:false};
 t.position=to;t.movement=move;
 if(save()===false){t.rolls--;t.position=from;t.movement=prior;return;}
 townAnimating=true;
 document.querySelectorAll('#townView button').forEach(button=>{button.disabled=true;});
 animateTownMove(move).catch(()=>{}).finally(()=>{
  townAnimating=false;
  if(state?.town?.movement!==move||!townVisible)return;
  render();resumeTownMove();
 });
}
function townDie(){
 const value=new Uint8Array(1);
 do{crypto.getRandomValues(value);}while(value[0]>=252);
 return value[0]%6+1;
}
async function animateTownMove(move){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const pawn=document.querySelector('[data-town-pawn]'),die=document.querySelector('[data-town-flight]');
 if(!pawn||!die)return;
 const faces=Array.from({length:6},(_,index)=>TOWN_ART+'die-'+(index+1)+'.webp');
 const result=faces[move.die-1];
 await Promise.all(faces.map(src=>{
  const preview=new Image();
  preview.src=src;
  return preview.decode().catch(()=>{});
 }));
 const position=(left,top,turns,scale=1)=>({
  left:left+'%',top:top+'%',transform:'translate(-50%,-50%) rotate('+turns+'turn) scale('+scale+')'
 });
 let faceIndex=0;
 die.src=faces[faceIndex];
 die.hidden=false;
 const cycling=setInterval(()=>{
  faceIndex=(faceIndex+1)%faces.length;
  die.src=faces[faceIndex];
 },90);
 try{
  await die.animate([
   position(-5,56,0,.84),
   {...position(24,35,.86,.96),offset:.42},
   position(45.4,55,1.76)
  ],{duration:1020,easing:'ease-out',fill:'forwards'}).finished;
 }catch(error){
  die.hidden=true;
  throw error;
 }finally{
  clearInterval(cycling);
  die.src=result;
 }
 try{
  await die.animate([
   position(45.4,55,1.76),
   {...position(48,52.1,1.9),offset:.42},
   position(50,55,2)
  ],{duration:460,easing:'ease-in-out',fill:'forwards'}).finished;
  await die.animate([{opacity:1},{opacity:1,offset:.78},{opacity:0}],{duration:760,fill:'forwards'}).finished;
 }finally{
  die.hidden=true;
 }
 for(const tile of move.path){
  const pos=townPoint(tile);
  const left=(parseFloat(pawn.style.left)+pos.x)/2+'%',top=(parseFloat(pawn.style.top)+pos.y)/2+'%';
  await pawn.animate([{left:pawn.style.left,top:pawn.style.top,translate:'0 0'},
   {left,top,translate:'0 -7px'},
   {left:pos.x+'%',top:pos.y+'%',translate:'0 0'}],{duration:230,easing:'ease-in-out'}).finished;
  pawn.style.left=pos.x+'%';pawn.style.top=pos.y+'%';
 }
}
function resumeTownMove(){
 const t=townState(),move=t.movement;if(townAnimating||!move||move.resolved)return;
 if(state.requiredIncident)return openRequiredIncident();
 if(state.gameOver?.final)return showGameOver();
 if(state.crisis&&state.crisis.ackMonth!==state.month)return showRecovery();
 if(move.payExpected&&state.month<move.payExpected)return previewTownPayday();
 if(move.payExpected){move.payDone=true;if(townCareerNotice(move))return;}
 if(townMoveType(move)==='payday'){resolveTownMove();return}
 openTownLanding();
}
function previewTownPayday(){
 const move=townState().movement,m=calcMetrics(),mapForecast=townMonthForecast(),remaining=roundCash(m.remainingCF+mapForecast);showEvent(move.returnReason==='home'?'回家结算':'发薪日','核对本月收支','地图浮动收益按平均值估算，以月底实际到账为准。',[['本月税前工资',priceText(m.grossSalary)],...(m.schoolSkillAllowance?[['其中：技能津贴',priceText(m.schoolSkillAllowance)]]:[]),['基础持续收支结余',priceText(m.monthlyCF)],['地图资产预计本月净收付',priceText(mapForecast)],['尚待月末收付',priceText(remaining)],['预计结算后现金',priceText(state.cash+remaining)]],[['确认结算本月',()=>{if(state.month>=move.payExpected)return resumeTownMove();clearModals();pending=false;state.turn={month:state.month,index:9,startCash:state.turn?.month===state.month?state.turn.startCash:state.cash};save();settleMonth()},true],['查看/支付贷款月供',openLoanPayments,false]]);
 $('eventClose').hidden=true;
 if(move.returnReason!=='home')$('eventTitle').closest('.event').dataset.townPayday='';
}
function resolveTownMove(){const t=townState(),m=t.movement;if(!m||m.resolved)return;m.resolved=true;m.completedMonth=state.month;t.history.push({id:m.id,die:m.die,to:m.to,month:state.month,type:townMoveType(m),offerId:m.offers?.ids?.[0]||null,outcome:m.offers?.resolved||null});save();render()}
const offersBeforeTown=monthlyOffers;
const TOWN_SMALL_DEAL_LIMIT=3000;
function townOpportunityMove(){
 const move=state?.town?.movement;
 return townEnabled()&&move&&!move.resolved&&move.month===state.month&&townMoveType(move)==='opportunity'?move:null;
}
monthlyOffers=function(){
 const move=townOpportunityMove();
 return move?move.offers||{month:state.month,ids:[],resolved:null}:offersBeforeTown();
};
function drawTownOpportunity(move,deck){
 if(townOpportunityMove()!==move||move.offers)return;
 const fast=journeyState().phase==='fast';
 const marketCards=TOWN_MARKET_CARDS.filter(card=>TOWN_MARKET_DEALS[card.id].unit||!townMarketHoldings().some(holding=>holding.deal===card.id));
 const pool=fast?FAST_PROJECTS:[...V26_OFFERS,...marketCards,...TOWN_PROJECT_CARDS].filter(project=>
  !['volunteer','stall','microcompany'].includes(project.id)&&(deck==='small'?project.cost<=TOWN_SMALL_DEAL_LIMIT:project.cost>TOWN_SMALL_DEAL_LIMIT));
 const recent=new Set(townState().history.filter(x=>x.offerId).slice(-3).map(x=>x.offerId));
 const fresh=pool.filter(project=>!recent.has(project.id)),available=fresh.length?fresh:pool;
 const seed=townMarketRoll(move);
 const project=available[(seed>>>0)%available.length];
 move.offers={month:state.month,deck,pool:fast?'fast':Object.hasOwn(TOWN_MARKET_DEALS,project.id)?'map-market':Object.hasOwn(TOWN_PROJECTS,project.id)?'map-project':'regular',ids:[project.id],resolved:null};
 if(move.offers.pool==='map-market'&&TOWN_MARKET_DEALS[project.id].unit){
  const holding=townMarketHoldings().find(item=>item.deal===project.id&&item.quantity>0);
  if(holding)move.offers.buyerQuote={holdingId:holding.id,price:townSecurityPrice(project.id,move,'sell')};
  else move.offers.unitPrice=townSecurityPrice(project.id,move,'buy');
 }
 if(save()===false){
  const pending=townOpportunityMove();
  if(pending?.id===move.id)delete pending.offers;
  if(fast)showEvent('快车道','机会尚未保存','请重试。',[],[['重试',()=>openTownOpportunity(),true]]);
  else openTownOpportunity('保存未成功，请重试。');
  return;
 }
 openTownOpportunity();
}
function openTownOpportunity(message=''){
 const move=townOpportunityMove();
 if(!move)return;
 if(!move.offers){
  if(journeyState().phase==='fast')return drawTownOpportunity(move,'fast');
  const leaseHolding=townLeaseCandidate(move);
  if(leaseHolding&&!move.marketQuote)return openTownLeaseOffer(move,leaseHolding);
  const flowerHolding=townFlowerOrderCandidate(move);
  if(flowerHolding)return openTownFlowerOrder(move,flowerHolding);
  const quote=townMarketQuote(move);
  const holding=quote&&townMarketHoldings().find(item=>item.id===quote.holdingId);
  if(holding&&!TOWN_MARKET_DEALS[holding.deal].unit)return openTownMarketTrade(move,holding.deal,quote);
  const actions=[
   ['小机会',()=>drawTownOpportunity(move,'small'),false],
   ['大机会',()=>drawTownOpportunity(move,'big'),false]
  ];
  if((townMarketHoldings().length||townBusinessAssets().length||townProjects().some(item=>item.status!=='closed')))actions.push(['地图资产',()=>openTownMarketHoldings(()=>openTownOpportunity()),false]);
  actions.push(['放弃这次机会',finish,false]);
  showEvent('投资机会','选择投资机会','',[],actions);
  if($('eventTitle').textContent!=='选择投资机会')return;
  const data=$('eventData');
  data.innerHTML='<div class="town-opportunity town-opportunity-picker">'+
   '<img class="town-opportunity-art" src="./assets/finance/bill-desk.webp" alt="">'+
   '<p>选一叠抽一张，再决定是否参与。</p>'+
   (message?'<p class="town-opportunity-notice" role="status">'+batchEscape(message)+'</p>':'')+'</div>';
  data.style.display='block';
  const deckCards=[
   ['小机会','savings',priceText(0)+'–'+priceText(TOWN_SMALL_DEAL_LIMIT)],
   ['大机会','bank','超过 '+priceText(TOWN_SMALL_DEAL_LIMIT)]
  ];
  deckCards.forEach(([label,image,amount],index)=>{
   const button=$('actions').children[index];
   const icon=document.createElement('img'),title=document.createElement('strong'),cost=document.createElement('small');
   icon.src='./assets/finance/'+image+'.webp';icon.alt='';
   title.textContent=label;cost.textContent=amount;
   button.classList.add('town-deck-choice');
   button.setAttribute('aria-label',label);
   cost.id='town-deck-amount-'+index;
   button.setAttribute('aria-describedby',cost.id);
   button.replaceChildren(icon,title,cost);
  });
  return;
 }
 if(move.offers.pool==='map-project'&&!move.offers.resolved)return openTownProjectOffer(move,move.offers.ids[0]);
 if(move.offers.pool==='map-market'&&!move.offers.resolved)return openTownMarketTrade(move,move.offers.ids[0],move.offers.buyerQuote);
 const offer=move.offers,fast=offer.pool==='fast';
 const project=(fast?FAST_PROJECTS:V26_OFFERS).find(option=>option.id===offer.ids[0]);
 if(offer.resolved||!project)return finish();
 const owner=state,chosenSlot=slot,valid=()=>state===owner&&slot===chosenSlot&&townOpportunityMove()===move&&move.offers===offer&&!offer.resolved;
 const shortfall=roundCash(project.cost-state.cash);
 const blocked=fast?'':opportunityBlock(project);
 const deckTitle=fast?'快车道':offer.deck==='small'?'小机会':offer.deck==='big'?'大机会':'投资机会';
 const actions=[['确认参与',()=>{if(valid())takeOpportunity(project.id);},true,shortfall>0||!!blocked]];
 if(shortfall>0)actions.push(['申请贷款',()=>{
  if(!valid())return;
  openBankLoan(shortfall,{returnDirect:true,after:()=>{if(valid())openTownOpportunity();}});
 },false]);
 actions.push(['不参与，保留现金',()=>{
  if(!valid())return;
  offer.resolved='未选择';save();finish();
 },false]);
 showEvent(deckTitle,'投资机会',message,[],actions);
 if($('eventTitle').textContent!=='投资机会')return;
 const rows=[
  ['成功率',Math.round((fast?project.chance:opportunityChance(project))*100)+'%'],
  project.cf?['成功后净收入',priceText(project.cf)+'/月']:['成功后收入',priceText(project.reward)],
  ['失败可能损失',priceText(project.chance<1?(fast?project.cost*(1-project.salvage):project.cost-(project.recovery||0)):0)]
 ];
 if(project.recovery)rows.push([project.fallbackLabel||'未成功时转卖回收',priceText(project.recovery)]);
 if(project.successEffects)rows.push(['成功后状态变化',effectText(project.successEffects)]);
 if(project.hours)rows.push(['自由时间','−'+project.hours+' 小时']);
 if(project.effects)rows.push(['状态变化',effectText(project.effects)]);
 const data=$('eventData');
 data.innerHTML='<div class="town-opportunity">'+
  '<img class="town-opportunity-art" src="'+(project.art||'./assets/finance/bill-desk.webp')+'" alt="">'+
  '<h3>'+batchEscape(project.name)+'</h3><p>'+batchEscape(project.desc)+'</p>'+
  '<div class="town-opportunity-cost">投入 <strong>'+priceText(project.cost)+'</strong></div>'+
  '<dl>'+rows.map(([label,value])=>'<div><dt>'+batchEscape(label)+'</dt><dd>'+batchEscape(value)+'</dd></div>').join('')+'</dl>'+
  (project.hours&&project.reward?'<p>成功净赚 '+priceText(project.reward-project.cost)+(project.recovery?(project.fallbackNote?'。'+project.fallbackNote:'。滞销时清仓回收。'):'。未成功无报酬，已用成本照扣。')+'</p>':'')+
  (blocked?'<p>'+batchEscape(blocked)+'</p>':'')+
  (shortfall>0?'<p>还差 '+priceText(shortfall)+'，可申请银行贷款。</p>':'')+'</div>';
 data.style.display='block';
 data.scrollTop=0;
}
function openTownLanding(){
 const move=townState().movement,type=townMoveType(move);
 const petEvent=state.petMapEvents?.records?.[state.month+':'+move.id];
 const relationshipLanding=type==='community'&&!move.opened||
    type==='life'&&!move.mapLife&&(!move.opened||petEvent?.status==='legacy')&&!window.mapLifeAppointmentDue?.(move);
 if(relationshipLanding&&window.RelationshipLifePages?.canOpen()&&
    window.RelationshipLifeCards?.drawRegular(state,move.id,{save})&&window.RelationshipLifePages.open())return;
 move.opened=true;save();
 if(type==='opportunity')return openTownOpportunity();
 if(type==='market'&&!move.type){if(openBuyerOffer())return;resolveTownMove();return}
 if(type==='growth'){showEvent('学习成长','投资自己','',[],[['查看学历计划',openEducation,true],['练习兴趣技能',()=>$('hobbyBtn').click(),false],['本次不安排',finish,false]]);$('eventData').innerHTML=learningCareerCard();$('eventData').style.display='block';return}
 if(type==='career'){if(window.SchoolMapCards?.open(move)||workplaceEvent())return;openWorkAdjustment();return}
 if(type==='life'){if(typeof openMapLife==='function')return openMapLife(move);$('lifestyleBtn').click();return}
 if(type==='community'){$('networkBtn').click();return}
 if(type==='risk'){requireIncident(state.carOwned?'车辆必要维修':'家用电器损坏',state.carOwned?420:180);return}
 resolveTownMove();
}
function townHome(){
 showEvent('在家','安排自己的生活','',[],[['住房',openHousing,true],['本月基本生活费',openTownLiving,false],['工作',openWorkAdjustment,false],['学习与技能',()=>{showEvent('学习与技能','职业与学习','先预览，再确认。',[],[['学历学习',openEducation,true],['兴趣练习',()=>$('hobbyBtn').click(),false],['返回',finish,false]]);$('eventData').innerHTML=learningCareerCard();$('eventData').style.display='block'},false],['生活',()=>$('lifestyleBtn').click(),false],['休息',()=>openExtraRest(),false],['关系',()=>$('networkBtn').click(),false],['保险',()=>openInsurance(),false],['储蓄投资与贷款',()=>{townVisible=false;clearModals();$('qAssets').click()},false],['返回小镇',()=>{clearModals();render()},false]]);
}
function openTownInsurance(){showEvent('保险','本月保障安排','',[],[['返回',finish,true]]);$('eventData').innerHTML=insuranceMarkup();$('eventData').style.display='block'}
const townRenderBefore=render;render=function(){townRenderBefore();renderTown()};
const townHeaderBefore=refreshCardHeader;refreshCardHeader=function(){townHeaderBefore();if(townEnabled())$('qNext').innerHTML='<span>⌂</span><small>小镇</small>'};
const townFinishBefore=finish;finish=function(){townFinishBefore();if(!townEnabled()||!townVisible||document.querySelector('.event-active'))return;const move=state.town?.movement;if(!move||move.resolved)return;if(move.payExpected&&state.month<move.payExpected)return previewTownPayday();if(!move.opened)resumeTownMove();else resolveTownMove()};
const townMonthlyEventBefore=monthlyEvent;monthlyEvent=function(){if(townEnabled()){finish();return}townMonthlyEventBefore()};
const townSettlementBefore=settleMonth;settleMonth=function(){if(townEnabled()){const move=state.town?.movement;if(!move||move.resolved||!move.payExpected||state.month>=move.payExpected)return}townSettlementBefore()};
const townOpenBefore=openGame;openGame=function(){townVisible=!!state.townMode;townOpenBefore();if(townEnabled()&&townPending()){if(state.roomLocation==='home'&&window.leaveTownRoom){townVisible=false;return window.leaveTownRoom();}clearModals();resumeTownMove()}};
const townShowBefore=showEvent;showEvent=function(type,title,desc,data=[],actions=[]){if(type==='读档成功'&&townEnabled()&&townPending())return;if(type==='START'){type='小镇起点';desc=state.job?'初始现金 $10,000.00，已入职咖啡师。先确认住房，再安排本月生活、工作与学习；工资月末到账，不提前发放。':'初始现金 $10,000.00。先确认住房，再安排本月工作与学习。';actions=[['进入起步小镇',townStart,true],['开始本月安排',()=>{state.townMode=false;townVisible=false;clearModals();startV24Turn(false)},false]]}townShowBefore(type,title,desc,data,actions)};
for(const id of ['qOverview','qCareer','qLife','qAssets']){const previous=$(id).onclick;$(id).onclick=()=>{townVisible=false;document.body.classList.remove('town-map');previous?.()}}
$('qNext').onclick=$('hubNext').onclick=()=>townEnabled()?showTown():continueLife();
$('wlResume').onclick=()=>{$('wlCloseMenu').click();if(townEnabled())showTown();else continueLife()};
const townMenu=document.createElement('button');townMenu.textContent='进入起步小镇';townMenu.onclick=()=>{$('wlCloseMenu').click();townStart()};document.querySelector('.wl-menu-items').append(townMenu);
document.addEventListener('click',e=>{const button=e.target.closest('[data-town]');if(!button)return;const action=button.dataset.town;if(action==='roll')rollTown();if(action==='resume')resumeTownMove();if(action==='home')townHome();if(action==='livingFund')fundShortfall(roundCash(Math.max(0,livingTotal()-(paymentReceipt().living||0))),openTownLiving);if(action==='monthly')originalMonthlyPlay();if(action==='holdings')openTownMarketHoldings(()=>{clearModals();render()});if(action==='stage')$('wlJourney').click()});

function openTownSecurities(){showEvent('证券市场','查看证券产品','',[],V26_INSTRUMENTS.map(i=>[i.name,()=>i.id==='gold'&&window.FinancePages?FinancePages.gold(openTownSecurities):openInstrument(i.id),false]).concat([['离开市场',finish,true]]))}



const townPaydayStyles=document.createElement('style');
townPaydayStyles.textContent=`
#townView .town-asset-controls {display:flex;justify-content:center;padding:6px 0 12px;}
#townView .town-asset-controls button {min-height:44px;padding:5px 16px;border:1px solid #b8ae85;border-radius:999px;background:#fbf2d8;color:#284836;font-size:.86rem;}

#game > .event.event-active[data-town-payday] {
 width:min(460px,calc(100vw - 24px))!important;
 max-height:calc(100dvh - 24px);
 overflow:auto;
 box-sizing:border-box;
 padding:14px;
 background:#fff3d6 url("assets/finance/paper.webp") repeat!important;
 border:2px solid #566d3d!important;
 border-radius:26px 23px 27px 24px!important;
 box-shadow:inset 0 0 0 4px #fff6dd,inset 0 0 0 5px #c6a052,0 8px 22px #33352145!important;
 color:#284531;
}
[data-town-payday] #eventType {
 background:#e1e8ba;color:#315538;border-radius:999px;font:18px WealthHand,sans-serif;
}
[data-town-payday] #eventTitle {
 margin:8px 0;text-align:center;color:#25492c;font:clamp(25px,7vw,38px)/1.2 WealthHand,serif;
}
#game > .event.event-active[data-town-payday] #eventDesc {
 display:block!important;margin:0 0 9px;font-size:13px;line-height:1.45;
}
[data-town-payday] #eventDesc::before {
 content:"";display:block;width:100%;aspect-ratio:2;margin-bottom:7px;border-radius:15px;
 background:url("assets/finance/town-payday.webp") center/cover no-repeat;
}
[data-town-payday] #eventData {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
[data-town-payday] #eventData .stat {
 min-width:0;margin:0;padding:8px;background:#f9e9b8;border:1px solid #b19a57;border-radius:13px;
}
[data-town-payday] #eventData .stat:is(:first-child,:last-child) {background:#e8edc7;border-color:#8b9f67}
[data-town-payday] #eventData .label {font-size:clamp(11px,3.1vw,14px);color:#415435}
[data-town-payday] #eventData .value {font-size:clamp(16px,4.4vw,22px);color:#25492c;overflow-wrap:anywhere}
#game > .event.event-active[data-town-payday] #actions {margin-top:10px;gap:6px}
#game > .event.event-active[data-town-payday] #actions button {
 border:1.5px solid #66794a;border-radius:999px;min-height:41px;
 background:#fff6df;color:#264a2e;font:clamp(16px,4.6vw,22px)/1.2 WealthHand,sans-serif;
}
#game > .event.event-active[data-town-payday] #actions button.primary {
 background:#ffcf56 url("assets/finance/paper.webp") repeat;background-blend-mode:multiply;
 border-color:#997025;font-weight:bold;
}
`;
document.head.append(townPaydayStyles);
