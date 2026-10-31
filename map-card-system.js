function mapContactLabel(p){return [p.name,p.gender==='female'?'女':p.gender==='male'?'男':null,Number.isFinite(p.age)?p.age+'岁':null,p.job].filter(Boolean).join(' · ')}
// Additive adapters for six map categories. Payday continues through town.js/core.js.
function mapMove(){return townEnabled()&&townPending()?townState().movement:null}
function mapRecord(){const move=mapMove();return move&&state.mapCards?.events[state.month+':'+move.id]}
function mapEffectsRows(e){const names={cash:'现金',hours:'自由时间消耗',health:'健康',energy:'能量',happiness:'幸福',stress:'压力',contact:'新联系人初始亲密度',studyMonths:'学历剩余月数'};return Object.entries(e||{}).filter(([k,v])=>names[k]&&v).map(([k,v])=>[names[k],k==='cash'?(v>0?'+':'')+priceText(v):(v>0?'+':'')+v+(k==='hours'?'h':'')])}
function mapHero(r){const c=MapCards.card(r.cardId),a=c?.art;if(!a?.runtimePath)return;const sp=r.quote?.species;if(sp&&(['pet-companion','pet-mishap','pet-unwell'].includes(r.cardId)&&sp!=='dog'||r.cardId==='pet-injury'&&sp!=='cat'||r.cardId==='pet-social'&&!['dog','cat'].includes(sp)))return;
 const frame=document.createElement('div');frame.className='map-card-art'+(r.category==='opportunity'?' map-investment-art':'');const img=document.createElement('img');img.src=a.runtimePath;img.alt=c.name+'插画';frame.append(img);$('eventData').prepend(frame);$('eventData').style.display='block';}
function mapContinue(){clearModals();pending=false;finish()}
function showMapRecord(r=mapRecord()){if(!r)return false;if(r.status==='empty'){showEvent(TOWN_LABELS[r.category]||'地图事件','这次没有合适的事件','本次没有收支或时间变化，可以继续探索。',[],[['继续探索',mapContinue,true]]);return true;}
 if(['resolved','declined'].includes(r.status)){showEvent('地图事件结果',r.status==='declined'?'已放弃本次机会':'本次事件已完成','结果已保存。同一笔收支与时间不会再次结算。',[...mapEffectsRows(r.receipt?.effects),...(r.status==='resolved'&&r.cardId==='pet-social'&&r.quote?.contact?[['新增好友',mapContactLabel(r.quote.contact)]]:[])],[['继续探索',mapContinue,true]]);return true;}
 const c=MapCards.card(r.cardId),owner=state;
 $('eventClose').hidden=true;
 function active(){return state===owner&&mapRecord()===r&&state.month===r.month&&r.status==='pending'}
 if(r.category==='life'||r.category==='community'){
  const q=r.quote,e=q.effects,free=currentCareerTime().free,debt=Math.max(0,(e.hours||0)-free),rows=[...(q.petName?[['涉及宠物',q.petName]]:[]),...(q.contact?[['将认识的新朋友',mapContactLabel(q.contact)]]:[]),...mapEffectsRows({...e,cash:(e.cash||0)-(e.cost||0)}),...(debt?[['本次可能欠时',debt+'h；完成本组后返回房屋结算']]:[])];
  showEvent('地图'+(r.category==='life'?'生活':'关系')+'事件',c?.name||r.cardId,'确认后才执行。本次费用按发生时的有效保单锁定。',rows,[[c?.options?.[0]?.label||'确认处理',()=>{if(!active())return;const before=currentCareerTime().free;if(MapCards.execute(state,r,{free:before,forcedTime:x=>recordForcedEventTime(state,x)})){if(r.receipt.timeEntry?.returnRequired)state.forcedTimeReturn={month:state.month,id:r.id,debt:r.receipt.timeEntry.debt};save();render();showMapRecord(r)}},true,state.cash<(e.cost||0)||!r.forced&&free<(e.hours||0)],...state.cash<(e.cost||0)?[['查看资金处理',()=>showFundingOptions(e.cost,()=>showMapRecord(r)),false]]:[]]);mapHero(r);$('eventClose').hidden=true;return true;
 }
 if(r.category==='opportunity'){
  const q=r.quote;showEvent('地图投资机会',c.name,'先核对报价和付款。本次可全款购买；查看或放弃不扣钱、不扣时间。实体项目从下个月起产生已列示收入，基金只按行情变动，不提供固定收益。',[
   ['本次报价',priceText(q.cost)],...(q.quantity?[['本次固定数量',q.quantity+'份'],['每份价格',priceText(q.price)]]:[['月净收入参考',priceText(q.monthlyIncome)],['付款方式','全款；抵押贷款的完整交易衔接待核对']]),['付款后现金',priceText(state.cash-q.cost)]],
  [['确认全款购买',()=>{if(active()&&MapCards.buy(state,r)){syncFinance();save();render();showMapRecord(r)}},true,state.cash<q.cost],['放弃本次机会',()=>{if(active()&&MapCards.decline(state,r)){save();showMapRecord(r)}},false]]);mapHero(r);$('eventClose').hidden=true;return true;
 }
 if(r.category==='market'){
  const q=MapCards.saleQuote(state,r);showEvent('市场动态',q?r.quote.assetName+' · 收购报价':c.name,q?'本月同一标的报价保持一致。确认出售会清偿关联债务并停止该资产收入；继续持有不产生收支。':'这是一则市场信息；当前没有对应的地图持仓，不产生个人出售收入。',q?[
   ['历史买入成本',priceText(q.a.cost)],['本次收购总价',priceText(q.gross)],['需清偿关联债务',priceText(q.debt)],['实际到账现金',priceText(q.net)],['出售后减少的月净收入',priceText(q.a.mapMonthlyIncome||0)]]:[],[
   ...q&&r.subtype==='fund'?[['按现价加购50份',()=>{if(active()&&MapCards.addFundUnits(state,r)){syncFinance();save();render();showMapRecord(r)}},false,state.cash<roundCash(r.quote.unitPrice*50)]]:[],...q?[['确认出售',()=>{if(active()&&MapCards.sell(state,r)){syncFinance();save();render();showMapRecord(r)}},true,state.cash+q.net<0]]:[],[q?'继续持有':'继续探索',()=>{if(active()){MapCards.decline(state,r);save();mapContinue()}},!q]]);$('eventClose').hidden=true;return true;
 }
 return false;
}
const mapLandingBefore=openTownLanding;openTownLanding=function(){const move=mapMove();if(!move)return mapLandingBefore();const type=TOWN_TYPES[move.to];if(type==='career')return mapLandingBefore();if(!MapCardData.categories.includes(type))return mapLandingBefore();move.opened=true;let r;
 if(type==='life')r=MapCards.drawLife(state,move,currentCareerTime().free);
 else if(type==='opportunity')r=MapCards.opportunity(state,move);
 else if(type==='market')r=MapCards.market(state,move);
 else{const key=state.month+':'+move.id,d=MapCards.data(state);r=d.events[key]??={id:'map-'+key,month:state.month,category:type,status:'empty',reason:type==='growth'?'成长卡完整原文缺失，不使用房屋课程冒充':'关系原卡已恢复部分；完整抽卡权重与人物资格待核对，不用房屋活动替代随机事件'};}
 save();return showMapRecord(r);
};
const mapTimeBefore=currentCareerTime;currentCareerTime=function(){const t=mapTimeBefore();if(!state||t.recoveryPending||isRecoveryMonth(state))return t;const used=state.mapCards?.hours[state.month]||0;return {...t,free:Math.max(0,t.free-used),mapEventHours:used}};
const mapAdvanceBefore=advanceQuotes;advanceQuotes=function(change,month){const out=mapAdvanceBefore(change,month);MapCards.advanceSecurityQuotes(state,change,month);return out};
const mapSyncBefore=syncFinance;syncFinance=function(){if(state)MapCards.refreshIncome(state);return mapSyncBefore()};
// Map assets can be sold only through matching market cards. Home investments retain their own actions.
const mapSellBefore=sellAsset;sellAsset=function(i){if(state.assets[i]?.mapOrigin){showEvent('地图投资','等待合适的收购机会','此资产通过地图市场报价出售；可继续持有，月度收入按原记录处理。',[],[['返回',finish,true]]);return false;}return mapSellBefore(i)};
const mapRenderBefore=render;render=function(){const out=mapRenderBefore();for(const b of document.querySelectorAll('[data-sell]'))if(state.assets[Number(b.dataset.sell)]?.mapOrigin)b.hidden=true;return out};
const mapLoadShowBefore=showEvent;showEvent=function(type,...args){const r=state&&mapRecord();if(type==='读档成功'&&r&&r.status==='pending'&&!state.requiredIncident&&!unfinishedTreatment()&&!healthTreatmentKind(state.health))return showMapRecord(r);return mapLoadShowBefore(type,...args)};
// Career monthly fields remain the canonical income/time totals; archive each distinct main group.
function mapCareerEligible(role,id){const d=MapCards.data(state),key=state.month+':'+role+':'+id;if(d.career[key])return false;const free=currentCareerTime().free;if(role==='barista')return COFFEE_EVENTS[id].choices.some((c,i)=>(coffeeQuote(id,i,coffeeQuoteContext()).hours||0)<=free);if(id==='praise')return true;return SHIFT_EVENTS[id].choices.some(c=>(c.effects?.hours||0)<=free)}
function mapCareerStart(role,before){const move=mapMove();if(!move||TOWN_TYPES[move.to]!=='career'||isRecoveryMonth(state)){if(!townEnabled())return before();const cached=role==='barista'?coffeeRecord():shiftRecord();if(cached)return cached;const date=coffeeCalendar(),r={cycle:state.month,year:date.year,calendarMonth:date.month,eventId:null,status:'none',extraWages:0,extraTips:0,bonus:0,workHoursDelta:0,mainApplied:false,applied:[],receipts:[]};if(role==='barista')coffeeData().monthly=r;else shiftData().monthly=r;return r;}const old=role==='barista'?coffeeRecord():shiftRecord();if(old?.cycle===state.month&&old.mapMoveId===move.id)return old;
 if(old?.cycle===state.month&&['pending','followup'].includes(old.status)){old.mapMoveId=move.id;if(old.eventId)MapCards.data(state).career[state.month+':'+role+':'+old.eventId]=true;save();return old;}
 const d=MapCards.data(state);if(old?.cycle===state.month&&old.eventId)d.career[state.month+':'+role+':'+old.eventId]=true;const weights=role==='barista'?coffeeEventDistribution(coffeeCalendar().month):shiftWeights();const eligible=Object.fromEntries(Object.entries(weights).filter(([id])=>id==='none'||mapCareerEligible(role,id)));const picked=MapCards.weighted(eligible),id=picked==='none'?null:picked,date=coffeeCalendar();
 const carry=old?.cycle===state.month?{wages:old.extraWages||0,tips:old.extraTips||0,bonus:old.bonus||0,hours:old.workHoursDelta||0,normalHours:old.normalHoursDelta??Math.min(0,old.workHoursDelta||0)}:{wages:0,tips:0,bonus:0,hours:0,normalHours:0};
 if(old?.cycle===state.month)(d.careerArchives??=[]).push(structuredClone(old));
 const r={version:1,cycle:state.month,year:date.year,calendarMonth:date.month,eventId:id,status:id?'pending':'none',quoteContext:coffeeQuoteContext(date.month),choice:null,choiceIndex:null,mapMoveId:move.id,mapCarry:carry,extraWages:carry.wages,extraTips:carry.tips,bonus:carry.bonus,workHoursDelta:carry.hours,normalHoursDelta:carry.normalHours};
 if(role==='barista'){r.quotes=id?COFFEE_EVENTS[id].choices.map((c,i)=>coffeeQuote(id,i,r.quoteContext)):null;coffeeData().monthly=r;}
 else{Object.assign(r,{presented:false,mainApplied:false,followGenerated:false,follow:null,applied:[],receipts:[]});if(id&&id!=='praise')r.quotes=SHIFT_EVENTS[id].choices.map(c=>shiftEffects(c.effects,date.month,r.quoteContext));shiftData().monthly=r;}
 if(id)d.career[state.month+':'+role+':'+id]=true;save();return r;
}
const mapCoffeeEnsureBefore=ensureCoffeeMonth;ensureCoffeeMonth=function(){return coffeeWorking()?mapCareerStart('barista',mapCoffeeEnsureBefore):mapCoffeeEnsureBefore()};
const mapShiftEnsureBefore=ensureShiftMonth;ensureShiftMonth=function(){return shiftWorking()?mapCareerStart('shift',mapShiftEnsureBefore):mapShiftEnsureBefore()};
const mapCoffeeResolveBefore=resolveCoffeeEvent;resolveCoffeeEvent=function(...args){const r=coffeeRecord(),out=mapCoffeeResolveBefore(...args);if(out&&r?.mapCarry&&!r.mapCarryApplied){r.extraWages=roundCash(r.extraWages+r.mapCarry.wages);r.extraTips=roundCash(r.extraTips+r.mapCarry.tips);r.workHoursDelta+=r.mapCarry.hours;r.normalHoursDelta=r.mapCarry.normalHours+Math.min(0,r.quotes[args[2]].hours||0);r.mapCarryApplied=true;save();render()}return out};
const mapShiftOpenBefore=openShiftEvent;openShiftEvent=function(){const r=shiftWorking()?ensureShiftMonth():shiftRecord();if(r?.eventId==='praise'&&r.mapMoveId&&r.status==='pending'){showEvent('值班主管职业事件',SHIFT_EVENTS.praise.name,SHIFT_EVENTS.praise.desc,shiftChangeRows(SHIFT_EVENTS.praise.reward),[['确认接受奖励',()=>{if(shiftRecord()!==r||r.status!=='pending')return;shiftApply(r,'main',SHIFT_EVENTS.praise.reward);r.mainApplied=true;r.status='resolved';r.choice='团队奖励';save();openShiftEvent()},true]]);return true;}return mapShiftOpenBefore()};
const mapCareerWorkingBefore=workplaceEvent;workplaceEvent=function(){if(mapMove()&&TOWN_TYPES[mapMove().to]==='career'){if(coffeeWorking()){ensureCoffeeMonth();return openCoffeeCareerEvent()}if(shiftWorking()){ensureShiftMonth();return openShiftEvent()}}return mapCareerWorkingBefore()};
const mapGroupsBefore=unfinishedCareerGroup;unfinishedCareerGroup=function(){const c=coffeeRecord(),s=shiftRecord();return !!(c?.mapMoveId&&c.status==='pending'||s?.mapMoveId&&['pending','followup'].includes(s.status))||mapGroupsBefore()};
const mapRollBefore=rollTown;rollTown=function(){if(unfinishedCareerGroup()&&(coffeeRecord()?.mapMoveId||shiftRecord()?.mapMoveId))return openCoffeeCareerEvent();return mapRollBefore()};

// These names were already in the original NPC pool. Stable IDs prevent repeated introductions.
function mapPrepareContacts(){return MapPetContacts.prepare(state,{names:NPC_NAMES,jobs:NPC_JOBS})}
const mapContactsBefore=openTownLanding;openTownLanding=function(){mapPrepareContacts();return mapContactsBefore()};

const mapPendingGroupBefore=unfinishedCareerGroup;unfinishedCareerGroup=function(){return mapRecord()?.status==='pending'||mapPendingGroupBefore()};
const mapResumeCareerBefore=openCoffeeCareerEvent;openCoffeeCareerEvent=function(){return mapRecord()?.status==='pending'?showMapRecord(mapRecord()):mapResumeCareerBefore()};
const mapSettleBefore=settleMonth;settleMonth=function(){return mapRecord()?.status==='pending'?showMapRecord(mapRecord()):mapSettleBefore()};
// A stage label is presentation only; eligibility uses the stored intimacy number.
relationStage=function(){return ''};

const mapIncomeBefore=coffeeMonthlyIncome;coffeeMonthlyIncome=function(){const x=mapIncomeBefore();if(!x||!['barista','shiftLead'].includes(x.role||'barista'))return x;const r=x.role==='shiftLead'?shiftRecord():coffeeRecord();return r?.normalHoursDelta!=null?{...x,normalHoursDelta:r.normalHoursDelta}:x};
