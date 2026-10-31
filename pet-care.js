const PET_CARE_RULES={
 dog:{name:'柯基',annual:150,annualHours:2,self:10,selfHours:2,selfMonths:2,pro:60,proHours:1,proMonths:3},
 cat:{name:'银渐层',annual:150,annualHours:2,self:10,selfHours:2,selfMonths:2,pro:60,proHours:1,proMonths:3},
 crocodile:{name:'鳄鱼',annual:300,annualHours:3,self:30,selfHours:4,selfMonths:2,pro:150,proHours:1,proMonths:3},
 gecko:{name:'豹纹守宫',annual:80,annualHours:2,self:5,selfHours:1,selfMonths:2,pro:30,proHours:1,proMonths:3},
 spider:{name:'捕鸟蛛',annual:50,annualHours:1,self:5,selfHours:1,selfMonths:3,pro:25,proHours:1,proMonths:4},
 tortoise:{name:'陆龟',annual:100,annualHours:2,self:10,selfHours:2,selfMonths:2,pro:50,proHours:1,proMonths:3},
 chameleon:{name:'变色龙',annual:120,annualHours:2,self:10,selfHours:2,selfMonths:2,pro:50,proHours:1,proMonths:3}
};
const PET_CARE_ALIASES={狗:'dog',柯基:'dog',猫:'cat',银渐层:'cat',鳄鱼:'crocodile',蜥蜴:'gecko',豹纹守宫:'gecko',蜘蛛:'spider',捕鸟蛛:'spider',乌龟:'tortoise',陆龟:'tortoise',变色龙:'chameleon'};
function petCareSpecies(p){return PET_CARE_RULES[p.species]?p.species:PET_CARE_ALIASES[p.type]}
function ensurePetCare(s=state){for(const p of s.pets||[]){const rule=PET_CARE_RULES[petCareSpecies(p)];if(!rule)continue;if(!p.careId)p.careId='pet-care-'+(s.nextPetCareId=(s.nextPetCareId||0)+1);
 const adopted=Number.isInteger(p.adoptMonth)?p.adoptMonth:s.month;p.care??={nextAnnual:adopted+12,nextClean:adopted+rule.selfMonths,history:[]};}return s.pets||[];}
function petCareTasks(s=state){return ensurePetCare(s).flatMap(p=>{const rule=PET_CARE_RULES[petCareSpecies(p)];if(!rule)return [{key:p.careId||'unknown',pet:p,unsupported:true}];return ['Annual','Clean'].filter(k=>p.care['next'+k]<=s.month).map(k=>({key:p.careId+':'+k+':'+p.care['next'+k],pet:p,rule,kind:k}));});}
function petCareQuote(s,selections){const recovery=isRecoveryMonth(s),factor=(s.cpiIndex||100)/100;let cost=0,hours=0;const rows=[];
 for(const task of petCareTasks(s)){if(task.unsupported)return {blocked:'未知旧宠物种类，需迁移核对'};const method=selections[task.key];if(!method)continue;
 if(task.kind==='Annual'&&method!=='annual'||task.kind==='Clean'&&!['self','pro'].includes(method)||recovery&&method==='self')return {blocked:'护理方式不适用'};
 const c=roundCash((task.kind==='Annual'?task.rule.annual:task.rule[method])*factor),h=recovery?0:task.kind==='Annual'?task.rule.annualHours:task.rule[method+'Hours'];cost+=c;hours+=h;rows.push({...task,method,cost:c,hours:h});}
 return {cost:roundCash(cost),hours,rows,recovery};}
function payPetCare(selections){const quote=petCareQuote(state,selections);if(quote.blocked||!quote.rows.length)return false;
 if(state.cash<quote.cost){if(typeof openPetFundsShortage==='function')openPetFundsShortage(selections);return false;}
 if(currentCareerTime().free<quote.hours){if(typeof openPetTimeShortage==='function')openPetTimeShortage(selections);return false;}
 if(!spendConfirmed('petCare',quote.cost,{projects:quote.rows.map(r=>r.key)}))return false;
 if(state.petCareTime?.month!==state.month)state.petCareTime={month:state.month,hours:0};state.petCareTime.hours+=quote.hours;
 for(const r of quote.rows){r.pet.care['next'+r.kind]=state.month+(r.kind==='Annual'?12:r.rule[r.method+'Months']);r.pet.care.history.push({month:state.month,key:r.key,kind:r.kind,method:r.method,cost:r.cost,hours:r.hours,delegated:quote.recovery});}
 state.petCareDraft={month:state.month,selections:{}};save();openPetCare();return true;}
function openPetCare(){if(state.petCareDraft?.month!==state.month)state.petCareDraft={month:state.month,selections:{}};const tasks=petCareTasks(),draft=state.petCareDraft.selections,q=petCareQuote(state,draft),recovery=isRecoveryMonth(state);save();
 const actions=[];for(const t of tasks){if(t.unsupported)continue;const name=t.pet.name||t.pet.type||t.rule.name;
 const options=t.kind==='Annual'?['annual']:recovery?['pro']:['self','pro'];for(const method of options)actions.push([name+' · '+(method==='annual'?'年度体检':method==='self'?'在家清洁':'专业清洁')+(recovery?'（委托）':''),()=>{draft[t.key]=method;save();openPetCare();},false]);}
 showEvent('宠物照护',recovery?'康复月委托专业照护':'本月到期宠物照护',recovery?'主动选择委托后确认付款；沿用既定费用，不占本人护理时间，日常养护费仍照付。':'先选择护理方式，再统一确认费用与耗时；预览不扣款。',[
 ['到期项目',tasks.length+'项'],['已选项目',q.rows?.length||0],['本次费用',priceText(q.cost||0)],['本人护理时间',(q.hours||0)+'h'],...(q.blocked?[['待处理',q.blocked]]:[])],
 [...actions,['确认支付已选护理',()=>payPetCare(draft),true,!!q.blocked||!q.rows?.length],['查看资金补救',()=>showFundingOptions(q.cost||0,openPetCare),false],['资金不足，前往银行',()=>openBankLoan(Math.max(1,Math.ceil((q.cost||0)-state.cash)),{after:openPetCare}),false],['返回',finish,false]]);}
const careTimeBefore=currentCareerTime;currentCareerTime=function(){const t=careTimeBefore(),used=state.petCareTime?.month===state.month?state.petCareTime.hours:0;return {...t,free:Math.max(0,t.free-used),petCareHours:used};};
const petsBeforeCare=$('petBtn').onclick;$('petBtn').onclick=()=>{if((state.pets||[]).length)return openPetCare();return petsBeforeCare();};

function necessaryPetCareHours(){if(isRecoveryMonth(state))return 0;const selected=state.petCareDraft?.month===state.month?state.petCareDraft.selections:{},choices={};for(const t of petCareTasks()){if(t.unsupported)return Infinity;choices[t.key]=selected[t.key]||(t.kind==='Annual'?'annual':'pro');}return petCareQuote(state,choices).hours||0;}
