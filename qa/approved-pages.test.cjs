const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const nodes=new Map(),listeners={};
function node(id){if(!nodes.has(id))nodes.set(id,{id,hidden:id==='wlDrawer',innerHTML:'',classList:{contains:()=>false,add(){},remove(){},toggle(){}},setAttribute(){},append(n){nodes.set(n.id,n)},addEventListener(){},click(){}});return nodes.get(id)}
const c={console,document:{getElementById:node,createElement:()=>node('new'),body:{classList:{add(){},remove(){},toggle(){}}},querySelector:()=>null,addEventListener:(k,fn)=>(listeners[k]??=[]).push(fn)},state:{month:0,cash:10000,health:80,energy:60,stress:40,happiness:68,housing:'unselected'},roundCash:n=>Math.round(n*100)/100,
 currentCareerTime:()=>({free:100}),necessaryPetCareHours:()=>0,isRecoveryMonth:()=>false,save(){},showEvent(){},openHealthTreatment(){},finish(){},$:node,
 housingOptions:()=>[['与家人同住',500,0,'family'],['合租',1050,1050,'shared']],paymentReceipt(){return c.state.monthlyPayments??={month:c.state.month,housing:0,living:0}},syncFinance(){},spendConfirmed(kind,n){if(c.state.cash<n)return false;c.state.cash-=n;return true},payMonthly(kind,n){if(c.state.cash<n)return false;c.state.cash-=n;c.paymentReceipt()[kind]+=n;return true},completeMonthlyStep(){},calcMetrics:()=>({assetValue:0,nw:0}),necessaryBills:()=>[],openHousing(){},clearModals(){},townVisible:false,render(){},home(){},openGame(){},townHome(){},openRoom(){},hideRoom(){},townCalendar:()=> '第1年 · 第1月',money:n=>'$'+n,priceText:n=>'$'+n,livingBaseAmount:()=>800,livingTotal:()=>800,setMonthSelection(){},openTownLiving(){},showFundingOptions(){}};
c.window=c;c.housingChoices=()=>c.housingOptions();vm.createContext(c);
for(const f of ['rest-state.js','housing-lease.js','painted-pages.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c,{filename:f});
// Browsing never pays or advances the month; family quotes have no deposit.
c.openHousing();assert.equal(c.state.cash,10000);assert.equal(c.state.month,0);
let q=c.housingQuote(c.housingOptions()[0]);assert.equal(q.monthly,500);assert.equal(q.deposit,0);assert.equal(q.total,500);
assert.equal(c.confirmHousing('family'),true);assert.equal(c.state.cash,9500);assert.equal(c.state.housingCost,500);assert.equal(c.state.housingLease.depositHeld,0);
c.confirmHousing('family');assert.equal(c.state.cash,9500,'repeat confirmation cannot charge twice');
// Four-hour rest changes only confirmed stats/time, and stale confirmations are rejected.
assert.equal(c.confirmExtraRest(0,0),true);assert.equal(c.state.energy,64);assert.equal(c.state.stress,38);assert.equal(c.state.health,81);assert.equal(c.state.happiness,69);assert.equal(c.currentCareerTime().free,96);assert.equal(c.state.cash,9500);assert.equal(c.state.month,0);assert.equal(c.confirmExtraRest(0,0),false);
Object.assign(c.state,{energy:99,stress:1,health:100,happiness:100});c.confirmExtraRest(0,1);assert.equal(c.state.energy,100);assert.equal(c.state.stress,0);assert.equal(c.state.health,100);assert.equal(c.state.happiness,100);
c.state.health=29;assert.equal(c.confirmExtraRest(0,2),false);c.state.health=80;c.necessaryPetCareHours=()=>90;assert.equal(c.confirmExtraRest(0,2),false);c.necessaryPetCareHours=()=>0;
c.state.extraRest.entries=Array.from({length:25},()=>({hours:4}));assert.equal(c.confirmExtraRest(0,25),false);
// Switching an existing rental schedules next month without charging now.
Object.assign(c.state,{housing:'shared',housingCost:1050,cash:10000});q=c.housingQuote(c.housingOptions()[0]);assert.equal(q.total,0);assert.equal(q.scheduled,true);c.confirmHousing('family');assert.equal(c.state.cash,10000);assert.equal(c.state.pendingHousingMove.monthly,500);assert.equal(c.state.pendingHousingMove.deposit,0);
// Insufficient cash cannot partially pay or select a first home.
Object.assign(c.state,{housing:'unselected',cash:499,monthlyPayments:{month:0,housing:0,living:0}});delete c.state.pendingHousingMove;assert.equal(c.confirmHousing('family'),false);assert.equal(c.state.cash,499);assert.equal(c.state.housing,'unselected');
// Every local script/style/cache entry resolves in the release.
const root=path.join(__dirname,'..'),remote=new Set(process.env.REMOTE_PATHS?JSON.parse(process.env.REMOTE_PATHS):[]),exists=p=>fs.existsSync(path.join(root,p))||remote.has(p.replace(/^\.\//,'')),html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const m of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g)){if(!m[1].includes('://')&&!m[1].startsWith('#'))assert.ok(exists(m[1]),m[1]);}
const cache={self:{addEventListener(){}}};vm.createContext(cache);vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8')+';globalThis.assets=ASSETS',cache);for(const a of cache.assets)assert.ok(exists(a.split('?')[0]),a);
console.log('Approved pages: rest effects, caps, time/recovery gates, housing billing/idempotency, and release assets passed.');
