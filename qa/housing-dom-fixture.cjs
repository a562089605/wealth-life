// Shared fixture for production housing-event DOM/VM integration.
module.exports=function createFixture(options={}){
// DOM/VM integration, not a browser or device layout test.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class Node{
 constructor(tag='div',attrs={}){this.tagName=tag;this.attrs=attrs;this.children=[];this.parentNode=null;this.dataset={};this.style={};this.hidden='hidden' in attrs;this.disabled='disabled' in attrs;this.value=attrs.value||'';for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=v;const set=new Set((attrs.class||'').split(' '));this.classList={add:(...x)=>x.forEach(y=>set.add(y)),remove:(...x)=>x.forEach(y=>set.delete(y)),contains:x=>set.has(x)};}
 set id(v){this.attrs.id=v;}get id(){return this.attrs.id;}set className(v){this.attrs.class=v;for(const s of v.split(' '))this.classList.add(s);}get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null;}get firstElementChild(){return this.children[0];}
 append(...nodes){for(const n of nodes){n.remove();n.parentNode=this;this.children.push(n);}}appendChild(n){this.append(n);return n;}insertBefore(n,next){n.remove();n.parentNode=this;const i=this.children.indexOf(next);if(i<0)this.children.push(n);else this.children.splice(i,0,n);}remove(){if(this.parentNode){const a=this.parentNode.children;a.splice(a.indexOf(this),1);this.parentNode=null;}}
 setAttribute(k,v){this.attrs[k]=v;}focus(){doc.activeElement=this;}getClientRects(){for(let n=this;n;n=n.parentNode)if(n.hidden)return[];return [{}];}
 matches(sel){if(sel[0]==='#')return this.id===sel.slice(1);if(sel[0]==='.')return this.classList.contains(sel.slice(1));if(sel[0]==='['){const m=sel.match(/^\[([^=\]]+)(?:="?([^"\]]+)"?)?\]$/);return m&&m[1]in this.attrs&&(m[2]==null||this.attrs[m[1]]===m[2]);}return this.tagName===sel;}
 closest(sel){for(let n=this;n;n=n.parentNode)if(n.matches(sel))return n;return null;}querySelectorAll(sel){const out=[];for(const n of this.children){if(sel.split(',').some(x=>n.matches(x)))out.push(n);out.push(...n.querySelectorAll(sel));}return out;}querySelector(sel){return this.querySelectorAll(sel)[0]||null;}
 set innerHTML(html){this.children.forEach(n=>n.parentNode=null);this.children=[];const stack=[this];for(const m of html.matchAll(/<\/?[a-z][^>]*>/gi)){const t=m[0];if(t.startsWith('</')){if(stack.length>1)stack.pop();continue;}const tag=t.match(/^<([\w-]+)/)[1],attrs={};for(const a of t.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g))attrs[a[1]]=a[2]??a[3]??a[4]??'';const n=new Node(tag,attrs);stack.at(-1).append(n);if(!['img','input','br','hr','meta','link'].includes(tag))stack.push(n);}}
}
const doc={body:new Node('body'),createElement:t=>new Node(t),addEventListener(){},getElementById(id){return this.body.querySelector('#'+id);}};
const game=new Node('main'),modal=new Node('div',{class:'card event'});doc.body.append(game);game.append(modal);modal.innerHTML='<h2 id="eventTitle"></h2><p id="eventDesc"></p><div id="eventData"></div><div id="actions"></div><button id="eventClose"></button>';const $=id=>doc.getElementById(id);
const storage=new Map();let fail=false;
const F=require('../family-events.js'),noop=()=>{};
const c={StudioEvents:{...require('../studio-events.js'),draw(s){c.studioDraws=(c.studioDraws||0)+1;return require('../studio-events.js').draw(s,()=>0);}},console:{...console,error:noop},setTimeout,clearTimeout,FamilyEvents:F,SharedEvents:{...require('../shared-events.js'),draw(s){c.sharedDraws=(c.sharedDraws||0)+1;return require('../shared-events.js').draw(s,()=>0);}},document:doc,slot:'a',key:x=>'slot'+x,localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(fail)throw Error('quota');storage.set(k,v);}},
 save(){if(fail)return false;storage.set('slot'+c.slot,JSON.stringify(c.state));},openRoom(){c.townVisible=false;if(c.state)c.state.roomLocation='home';},currentCareerTime:()=>({free:c.baseFree??0,weeklyHours:40,monthlyWork:160,workHoursDelta:0}),settleMonth(){c.state.month++;c.showMonthlyAudit();},showMonthlyAudit(){c.audits=(c.audits||0)+1;},monthlyEvent:noop,finish:noop,openGame:noop,home:noop,showTown:noop,rollTown:noop,eventEligible:()=>true,requireIncident:noop,
 townEnabled:()=>true,townState:()=>c.state.town??={position:7,rolls:0,movement:null},townPending:()=>!!c.state.town?.movement&&!c.state.town.movement.resolved,resolveTownMove(){if(c.state.town?.movement)c.state.town.movement.resolved=true;},townVisible:false,pending:false,healthTreatmentKind:()=>c.state.health<30,openHealthTreatment(){c.medical=(c.medical||0)+1;},unfinishedTreatment:()=>false,isRecoveryMonth:()=>false,housingHandoverDue:()=>!!c.state.moveDue,openHousingHandover(){c.handovers=(c.handovers||0)+1;},necessaryPetCareHours:()=>0,
 roundCash:n=>Math.round(n*100)/100,priceText:n=>'$'+n,money:n=>'$'+n,calcMetrics:()=>({monthlyCF:100}),currentBankAPR:()=>.055,paymentFor:(a,r,n)=>a*r/12/(1-(1+r/12)**-n),render(){c.save();},
 coffeeWorking:()=>true,shiftWorking:()=>false,coffeeCalendar:()=>({month:2}),coffeeSeason:()=>({tips:300}),coffeeQuoteContext:()=>({annualSalary:32000,weeklyHours:40}),
 clearModals(){modal.classList.remove('event-active');},showEvent(type,title,desc,data,actions){$('eventTitle').textContent=title;modal.classList.add('event-active');$('eventData').innerHTML='';$('actions').innerHTML='';for(const a of actions){const b=new Node('button');b.textContent=a[0];b.disabled=!!a[3];b.onclick=a[1];$('actions').append(b);}},
};c.$=$;c.window=c;c.matchMedia=()=>({matches:true});vm.createContext(c);
const source=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');const core=source('core.js');vm.runInContext(core.slice(core.indexOf('function openBankLoan('),core.indexOf("$('carBtn').onclick")),c);
// Use the shipped bank form and shipped loan disbursement, including loan ledger.
c.loanBase=c.openBankLoan;const presentation=source('presentation.js');vm.runInContext(presentation.slice(presentation.indexOf(' function loanForm('),presentation.indexOf('\n showEvent=function(type,title',presentation.indexOf(' function loanForm('))),c);
// Exercise the actual production monthly income and metrics together with leave.
c.coffeeCareerData=()=>{};c.coffeeRecord=()=>null;c.coffeeIncomeMarkup=()=>'';
c.syncFinance=()=>{};c.remainingExpenses=()=>0;c.paidThisMonth=()=>0;
const coffee=source('coffee.js');vm.runInContext(coffee.slice(coffee.indexOf('function coffeeMonthlyIncome(){'),coffee.indexOf('function finalizeCoffeeMonth(')),c);
vm.runInContext(core.slice(core.indexOf('calcMetrics=function(){'),core.indexOf('const savedRender=render;')),c);
if(options.withDebt)c.HousingTimeDebt=require('../housing-time-debt.js');
vm.runInContext(source('family-home.js'),c);

return {c,doc,storage,modal,game,$,setSaveFailure(value){fail=value;}};
};
