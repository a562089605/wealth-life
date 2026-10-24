// V28 candidate: town navigation shares the existing state, ledger and settlement.
const TOWN_TYPES=['payday','opportunity','life','community','market','career','payday','growth','opportunity','life','career','opportunity','payday','community','market','growth','opportunity','life','payday','career','community','opportunity','market','growth'];
const TOWN_LABELS={payday:'发薪日',opportunity:'投资机会',market:'市场',life:'生活',growth:'学习成长',career:'职业',risk:'风险事件',community:'关系／社区'};
const TOWN_ICONS={payday:'＄',opportunity:'✦',market:'↗',life:'♥',growth:'书',career:'职',risk:'!',community:'友'};
let townVisible=false;
function townState(){return state.town??={version:1,position:0,rolls:0,movement:null,history:[]}}
function townPending(){return !!state?.town?.movement&&!state.town.movement.resolved}
function townEnabled(){return !!state?.townMode}
function townStart(){state.townMode=true;townVisible=true;townState();save();if(!state.housing||state.housing==='unselected'){openHousing();return}showTown()}
function showTown(){if(state.requiredIncident)return openRequiredIncident();townVisible=true;$('game').classList.remove('v24-running');clearModals();render();if(townPending())resumeTownMove()}
function originalMonthlyPlay(){if(townPending())return;state.townMode=false;townVisible=false;save();document.body.classList.remove('town-map');clearModals();render();startV24Turn(false)}
// 24 equally spaced paving positions on the illustrated winding street; indices keep old saves valid.
const TOWN_ROAD_POINTS=[{"x":28.52,"y":55.278,"angle":-93.74},{"x":31.389,"y":49.761,"angle":-62.21},{"x":31.4,"y":44.092,"angle":-124.41},{"x":26.403,"y":39.561,"angle":-126.44},{"x":25.32,"y":33.896,"angle":-61.53},{"x":31.369,"y":30.483,"angle":-19.91},{"x":38.634,"y":28.819,"angle":-13.39},{"x":46.121,"y":28.181,"angle":3.95},{"x":53.511,"y":29.388,"angle":16.67},{"x":60.776,"y":31.053,"angle":12.16},{"x":68.256,"y":31.909,"angle":7.48},{"x":75.254,"y":33.899,"angle":45.52},{"x":74.793,"y":39.337,"angle":125.73},{"x":72.398,"y":44.675,"angle":60.87},{"x":78.089,"y":48.6,"angle":44.5},{"x":76.79,"y":53.576,"angle":143.81},{"x":70.721,"y":57.14,"angle":127.3},{"x":71.372,"y":62.875,"angle":75.48},{"x":67.759,"y":67.521,"angle":152.96},{"x":60.426,"y":68.68,"angle":-177.63},{"x":52.989,"y":67.648,"angle":-168.4},{"x":45.647,"y":66.226,"angle":-161.64},{"x":38.913,"y":63.518,"angle":-149.39},{"x":32.624,"y":60.172,"angle":-140.73}];
function townPoint(i){return TOWN_ROAD_POINTS[((i%24)+24)%24]}
function townPaydayDistance(){for(let d=1;d<=24;d++)if(TOWN_TYPES[(townState().position+d)%24]==='payday')return d}
function townCalendar(){return '第'+(Math.floor(state.month/12)+1)+'年 · 第'+(state.month%12+1)+'月'}
function openTownLiving(){showEvent('基本生活费','本月必要生活成本','先核对，再确认支付。已付费用保留到月末，发薪结算时不会重复扣除。',[],[['返回家中',townHome,false]]);$('eventData').innerHTML=livingMarkup().replace('data-v26="livingFund"','data-town="livingFund"').replace('保险在保险步骤确认；贷款月供请在财富步骤的还款卡确认。','保险可回家安排；月供在储蓄投资与贷款中确认。');$('eventData').style.display='block'}
function townCareerNotice(move){
 if(!move.careerNotice&&state.pendingCareerNotice){move.careerNotice=structuredClone(state.pendingCareerNotice);state.pendingCareerNotice=null;save()}
 const n=move.careerNotice;if(!n||n.acknowledged)return false;
 showEvent('职业成长','经验与技能带来晋升',n.job+' 晋升到成长等级 '+n.rank+'。这次加薪已由原有职业系统计入，不会在确认时再加一次。',[['当前税前月薪',priceText(n.salary)],['生效时间','下次发薪按当前工资结算']],[['确认，继续行程',()=>{n.acknowledged=true;save();clearModals();resumeTownMove()},true]]);$('eventClose').hidden=true;return true;
}
function renderTown(){
 const game=$('game');document.body.classList.toggle('town-map',townEnabled()&&townVisible&&!game.classList.contains('hidden'));
 if(!townEnabled()||!townVisible){$('townView')?.style.setProperty('display','none','important');return}game.classList.remove('v24-running');const t=townState();let box=$('townView');if(!box){box=document.createElement('section');box.id='townView';game.append(box)}
 box.style.setProperty('display','block','important');const m=calcMetrics(),pos=townPoint(t.position),last=t.movement;
 box.innerHTML='<div class="town-toolbar"><b>起步小镇 · '+townCalendar()+'</b><button data-town="home">回家安排</button><button data-town="monthly" '+(townPending()?'disabled':'')+'>原按月模式</button></div><p class="town-hint">24格 · 单骰顺时针 · 仅停在发薪日结算一个月</p><div class="town-map-scene"><img src="assets/career/town.webp" alt="起步小镇手绘地图"><span class="town-place" style="left:10%;top:27%">创作室</span><span class="town-place" style="left:33%;top:24%">公司</span><span class="town-place" style="left:61%;top:24%">学校</span><span class="town-place" style="left:86%;top:32%">医院</span><span class="town-place" style="left:10%;top:43%">咖啡店</span><span class="town-place" style="left:15%;top:64%">家</span><span class="town-place" style="left:93%;top:43%">公园</span><span class="town-place" style="left:88%;top:65%">投资中心</span><span class="town-place" style="left:46%;top:81%">市场</span><span class="town-place" style="left:76%;top:79%">机会中心</span><div class="town-route" aria-label="24格移动路线">'+TOWN_TYPES.map((type,i)=>{const p=townPoint(i);return '<span class="town-node '+type+(i===t.position?' current':'')+'" style="left:'+p.x+'%;top:'+p.y+'%;--road-angle:'+p.angle+'deg" title="'+(i+1)+' '+TOWN_LABELS[type]+'"><span class="town-paving-label"><small>'+(i+1)+'</small>'+TOWN_ICONS[type]+'</span></span>'}).join('')+'<span class="town-player" style="left:'+pos.x+'%;top:'+pos.y+'%" aria-label="玩家当前位置第'+(t.position+1)+'格">●</span></div></div><div class="town-status"><b>'+(last?'掷出 '+last.die+' · 第'+(t.position+1)+'格 '+TOWN_LABELS[TOWN_TYPES[t.position]]:'从家附近出发')+'</b><p>现金 '+priceText(state.cash)+' · 持续月结余 '+priceText(m.monthlyCF)+'</p><p>距离下次发薪 <b>'+townPaydayDistance()+' 格</b> · 发薪日共4格，经过不结算</p><div class="town-vitals">'+[['健康',state.health],['精力',state.energy],['心情',state.mood],['幸福',state.happiness]].map(([name,value])=>'<span>'+name+' <b>'+Math.round(value??0)+'</b></span>').join('')+'</div>'+(!state.job&&!state.retired?'<p class="town-work-hint">尚未就业：可回家选择工作。生活费用仍会持续发生。</p>':'')+'<details class="town-legend"><summary>查看格子规则</summary><p>＄ 发薪：仅停下，确认后结算一个月。<br>✦ 机会 · ↗ 市场 · ♥ 生活 · 书 成长<br>职 职业 · ! 风险 · 友 社区<br>其余格子仅停下触发；在家安排不推进时间。</p></details><button class="primary" data-town="roll" '+(townPending()||state.gameOver?.final?'disabled':'')+'>掷骰子</button>'+(townPending()?'<button data-town="resume">继续处理当前事件</button>':'')+'<button data-town="stage">查看财务自由进度</button></div>';
}
function rollTown(){
 if(!townEnabled()||townPending()||document.querySelector('.event-active')||state.gameOver?.final)return;
 if(!state.housing||state.housing==='unselected')return openHousing();
 if(state.requiredIncident)return openRequiredIncident();
 if(state.crisis&&state.crisis.ackMonth!==state.month)return showRecovery();
 const t=townState(),die=1+Math.floor(Math.random()*6),from=t.position,path=Array.from({length:die},(_,i)=>(from+i+1)%24);
 t.rolls++;t.position=path.at(-1);t.movement={id:t.rolls,die,from,to:t.position,path,month:state.month,payExpected:TOWN_TYPES[t.position]==='payday'?state.month+1:null,payDone:false,resolved:false};save();render();resumeTownMove();
}
function resumeTownMove(){
 const t=townState(),move=t.movement;if(!move||move.resolved)return;
 if(state.requiredIncident)return openRequiredIncident();
 if(state.gameOver?.final)return showGameOver();
 if(state.crisis&&state.crisis.ackMonth!==state.month)return showRecovery();
 if(move.payExpected&&state.month<move.payExpected)return previewTownPayday();
 if(move.payExpected){move.payDone=true;if(townCareerNotice(move))return}
 if(TOWN_TYPES[move.to]==='payday'){resolveTownMove();return}
 openTownLanding();
}
function previewTownPayday(){
 const move=townState().movement,m=calcMetrics();showEvent('发薪日','核对本月收支','确认后使用原有月末账本结算一次。已付费用抵扣；贷款请先查看本月还款卡，未付按原合同处理。',[['本月税前工资',priceText(m.grossSalary)],['本月持续收支结余',priceText(m.monthlyCF)],['尚待月末收付',priceText(m.remainingCF)],['预计结算后现金',priceText(state.cash+m.remainingCF)]],[['确认结算本月',()=>{if(state.month>=move.payExpected)return resumeTownMove();clearModals();pending=false;state.turn={month:state.month,index:9,startCash:state.turn?.month===state.month?state.turn.startCash:state.cash};save();settleMonth()},true],['查看/支付贷款月供',openLoanPayments,false],['稍后处理，返回地图',()=>{clearModals();render()},false]]);$('eventClose').hidden=true;
}
function resolveTownMove(){const t=townState(),m=t.movement;if(!m||m.resolved)return;m.resolved=true;m.completedMonth=state.month;t.history.push({id:m.id,die:m.die,to:m.to,month:state.month,type:TOWN_TYPES[m.to],offerId:m.offers?.ids?.[0]||null,outcome:m.offers?.resolved||null});save();render()}
const offersBeforeTown=monthlyOffers;
monthlyOffers=function(){
 if(!townEnabled()||!townPending()||TOWN_TYPES[townState().movement.to]!=='opportunity')return offersBeforeTown();
 const move=townState().movement;if(move.offers)return move.offers;
 const previous=state.monthlyOpportunities,seed=state.offerSeed;state.monthlyOpportunities=null;state.offerSeed=(seed||1)+move.id*104729;
 try{move.offers=structuredClone(offersBeforeTown());const recent=new Set(townState().history.filter(x=>x.offerId).slice(-3).map(x=>x.offerId));const candidates=[...move.offers.ids,...V26_OFFERS.map(x=>x.id)];move.offers.ids=[candidates.find(id=>!recent.has(id))||candidates[0]]}finally{state.monthlyOpportunities=previous;state.offerSeed=seed}
 save();return move.offers;
};
function openTownLanding(){
 const move=townState().movement,type=TOWN_TYPES[move.to];move.opened=true;save();
 if(type==='opportunity'){showEvent('投资机会','路过一家新项目','这次只处理一个机会。先看投入、风险与现金流，不合适可以放弃。',[],[['放弃本次机会',()=>{const o=monthlyOffers();if(!o.resolved)o.resolved='未选择';save();finish()},false]]);$('eventData').innerHTML=opportunityMarkup().replace('四个都不选，保留现金','不参与，保留现金');$('eventData').style.display='block';return}
 if(type==='market'){if(openBuyerOffer())return;showEvent('市场','看看当前市场','价格与报价来自现有模拟经济。查看产品不等于购买，确认后才交易。',[['模拟基准利率',(ECONOMIES[state.economy||0].rate*100).toFixed(1)+'%']],[['查看证券与资产',openTownSecurities,true],['查看固定收益产品',openBonds,false],['继续持有，离开',finish,false]]);return}
 if(type==='growth'){showEvent('学习成长','投资自己','学历、兴趣与工资仍沿用原规则；每月兴趣练习不重复收费或刷经验。',[],[['查看学历计划',openEducation,true],['练习兴趣技能',()=>$('hobbyBtn').click(),false],['本次不安排',finish,false]]);$('eventData').innerHTML=learningCareerCard();$('eventData').style.display='block';return}
 if(type==='career'){if(workplaceEvent())return;openWorkAdjustment();return}
 if(type==='life'){$('lifestyleBtn').click();return}
 if(type==='community'){$('networkBtn').click();return}
 if(type==='risk'){requireIncident(state.carOwned?'车辆必要维修':'家用电器损坏',state.carOwned?420:180);return}
 resolveTownMove();
}
function townHome(){
 showEvent('在家','安排自己的生活','原有住房、工作、保险、学习和资产继续保留。这里只查看或主动调整，不推进月份。',[],[['住房',openHousing,true],['本月基本生活费',openTownLiving,false],['工作',openWorkAdjustment,false],['学习与技能',()=>{showEvent('学习与技能','职业与学习','先预览，再确认。',[],[['学历学习',openEducation,true],['兴趣练习',()=>$('hobbyBtn').click(),false],['返回',finish,false]]);$('eventData').innerHTML=learningCareerCard();$('eventData').style.display='block'},false],['生活',()=>$('lifestyleBtn').click(),false],['关系',()=>$('networkBtn').click(),false],['保险',()=>openInsurance(),false],['储蓄投资与贷款',()=>{townVisible=false;clearModals();$('qAssets').click()},false],['返回小镇',()=>{clearModals();render()},false]]);
}
function openTownInsurance(){showEvent('保险','本月保障安排','沿用原保险选择与保费。',[],[['返回',finish,true]]);$('eventData').innerHTML=insuranceMarkup();$('eventData').style.display='block'}
const townRenderBefore=render;render=function(){townRenderBefore();renderTown()};
const townHeaderBefore=refreshCardHeader;refreshCardHeader=function(){townHeaderBefore();if(townEnabled())$('qNext').innerHTML='<span>⌂</span><small>小镇</small>'};
const townFinishBefore=finish;finish=function(){townFinishBefore();if(!townEnabled()||!townVisible||document.querySelector('.event-active'))return;const move=state.town?.movement;if(!move||move.resolved)return;if(move.payExpected&&state.month<move.payExpected)return previewTownPayday();if(!move.opened)resumeTownMove();else resolveTownMove()};
const townMonthlyEventBefore=monthlyEvent;monthlyEvent=function(){if(townEnabled()){finish();return}townMonthlyEventBefore()};
const townSettlementBefore=settleMonth;settleMonth=function(){if(townEnabled()){const move=state.town?.movement;if(!move||move.resolved||!move.payExpected||state.month>=move.payExpected)return}townSettlementBefore()};
const townOpenBefore=openGame;openGame=function(){townVisible=!!state.townMode;townOpenBefore();if(townEnabled()&&townPending()){clearModals();resumeTownMove()}};
const townShowBefore=showEvent;showEvent=function(type,title,desc,data=[],actions=[]){if(type==='读档成功'&&townEnabled()&&townPending())return;if(type==='START'){type='小镇起点';desc=state.job?'初始现金 $10,000，已入职咖啡师。先确认住房，再安排本月生活、工作与学习；工资月末到账，不提前发放。':'初始现金 $10,000。先确认住房，再安排本月工作与学习。';actions=[['进入起步小镇',townStart,true],['开始本月安排',()=>{state.townMode=false;townVisible=false;clearModals();startV24Turn(false)},false]]}townShowBefore(type,title,desc,data,actions)};
for(const id of ['qOverview','qCareer','qLife','qAssets']){const previous=$(id).onclick;$(id).onclick=()=>{townVisible=false;document.body.classList.remove('town-map');previous?.()}}
$('qNext').onclick=$('hubNext').onclick=()=>townEnabled()?showTown():continueLife();
$('wlResume').onclick=()=>{$('wlCloseMenu').click();if(townEnabled())showTown();else continueLife()};
const townMenu=document.createElement('button');townMenu.textContent='进入起步小镇';townMenu.onclick=()=>{$('wlCloseMenu').click();townStart()};document.querySelector('.wl-menu-items').append(townMenu);
document.addEventListener('click',e=>{const button=e.target.closest('[data-town]');if(!button)return;const action=button.dataset.town;if(action==='roll')rollTown();if(action==='resume')resumeTownMove();if(action==='home')townHome();if(action==='livingFund')fundShortfall(roundCash(Math.max(0,livingTotal()-(paymentReceipt().living||0))),openTownLiving);if(action==='monthly')originalMonthlyPlay();if(action==='stage')$('wlJourney').click()});

function openTownSecurities(){showEvent('证券市场','查看证券产品','查看当前价格与持仓，确认后才购买。',[],V26_INSTRUMENTS.map(i=>[i.name,()=>openInstrument(i.id),false]).concat([['离开市场',finish,true]]))}

