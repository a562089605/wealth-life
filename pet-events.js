// Confirmed map pet events only; home care and other map categories remain canonical.
(function(root){'use strict';
 const companions={
  dog:{title:'一起晒太阳',energy:3,happiness:3,stress:-2,button:'陪它待一会儿'},
  cat:{title:'撸猫日常',energy:3,happiness:3,stress:-2,button:'陪它待一会儿'},
  tortoise:{title:'慢慢陪着你',energy:3,happiness:3,stress:-2,button:'陪它待一会儿'},
  chameleon:{title:'枝头的小伙伴',energy:1,happiness:2,stress:-4,button:'静静陪它一会儿'},
  gecko:{title:'傍晚的小探险',energy:1,happiness:3,stress:-3,button:'看看它的小探险'},
  spider:{title:'蛛网小世界',energy:1,happiness:1,stress:-5,button:'静静观察一会儿'},
  crocodile:{title:'安静的观察时光',energy:1,happiness:4,stress:-2,button:'静静观察一会儿'}
 };
 const weights={unwell:20,injury:10,companion:35,social:20,mishap:15};
 const illness={dog:200,cat:200,crocodile:600,gecko:120,spider:80,tortoise:180,chameleon:200};
 const aliases={狗:'dog',柯基:'dog',猫:'cat',银渐层:'cat',鳄鱼:'crocodile',蜥蜴:'gecko',豹纹守宫:'gecko',蜘蛛:'spider',捕鸟蛛:'spider',乌龟:'tortoise',陆龟:'tortoise',变色龙:'chameleon'};
 const clone=x=>JSON.parse(JSON.stringify(x)),money=x=>Math.round(x*100)/100;
 const species=p=>companions[p.species]?p.species:aliases[p.type];
 const data=s=>s.petMapEvents??={version:1,records:{},seen:{},hours:{}};
 const key=(s,move)=>s.month+':'+move.id;
 const seen=(s,id)=>!!s.petMapEvents?.seen[s.month+':'+id];
 function weighted(w,random){const entries=Object.entries(w).filter(([,v])=>v>0);let n=random()*entries.reduce((t,[,v])=>t+v,0);for(const [id,v]of entries){n-=v;if(n<0)return id;}return entries.at(-1)?.[0];}
 function choices(s,id,free){return (s.pets||[]).map((p,index)=>({p,index,sp:species(p)})).filter(x=>x.sp&&(id!=='injury'||['dog','cat'].includes(x.sp))&&(id==='companion'||!seen(s,id))&&(!['companion','social'].includes(id)||free>=(id==='social'?3:1)));}
 function policy(s,p){const individual=p.insuranceKey&&s.insurance?.[p.insuranceKey],combined=s.insurance?.pet;
  return [individual,combined].find(x=>x?.active&&Number.isFinite(x.coverage)&&x.coverage>=0&&x.coverage<=1&&(!Number.isInteger(x.startMonth)||x.startMonth<=s.month));}
 function quote(s,id,x){const {p,index,sp}=x,medical=['unwell','injury'].includes(id),insurance=medical?policy(s,p):null;
  const common={companion:{...companions[sp],hours:1,cost:0},unwell:{title:'毛孩子有点不舒服',hours:3,cost:illness[sp],energy:-2,stress:2,button:'带它去看医生'},injury:{title:'玩耍时意外受伤',hours:4,cost:500,energy:-3,stress:3,button:'带它去处理伤口'},social:{title:'宠物交友日',hours:3,cost:0,energy:-2,happiness:4,stress:-2,button:'一起参加活动'},mishap:{title:'淘气的小意外',hours:1,cost:50,energy:-1,stress:1,button:'收拾一下，换个新的'}}[id];
  return {...common,petIndex:index,petIdentity:JSON.stringify([p.id,p.careId,p.species,p.type,p.adoptMonth,p.name]),species:sp,petName:p.name||p.type,gross:common.cost,cost:money(common.cost*(insurance?1-insurance.coverage:1)),coverage:insurance?.coverage??null};}
 function contact(s,{names,jobs},random){if(!names?.length||!jobs?.length)return null;
  const id='map-pet-friend-'+s.month+'-'+(s.petMapEvents.nextContact=(s.petMapEvents.nextContact||0)+1),pick=a=>a[Math.min(a.length-1,Math.floor(random()*a.length))];
  const unused=names.filter(n=>!(s.people||[]).some(p=>p.name===n));
  return {id,name:pick(unused.length?unused:names),gender:random()<.5?'female':'male',age:Math.max(18,(s.age||22)+pick([-2,-1,0,2])),job:pick(jobs),status:'养宠物的朋友',origin:'pet-social',city:s.city,relation:10,lastInteractionMonth:s.month};}
 function draw(s,move,{free,random=Math.random,names=[],jobs=[]}={}){const d=data(s),k=key(s,move);if(d.records[k])return d.records[k];
  const pools=Object.fromEntries(Object.keys(weights).map(id=>[id,choices(s,id,free)]));if(!names.length||!jobs.length)pools.social=[];
  const eligible=Object.fromEntries(Object.entries(weights).filter(([id])=>pools[id].length));
  let r={key:k,month:s.month,moveId:move.id,status:'legacy'};
  // Historical life subtype share: pets 20/100; unavailable share returns to daily life.
  if(Object.keys(eligible).length&&random()<.2){const id=weighted(eligible,random),pool=pools[id],x=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];r={...r,id,status:'pending',forced:!['companion','social'].includes(id),quote:quote(s,id,x)};
   if(id==='social')r.quote.contact=contact(s,{names,jobs},random);
   if(id!=='companion')d.seen[s.month+':'+id]=true;
  }d.records[k]=r;return r;}
 function execute(s,k,{free,forcedTime}={}){const r=s.petMapEvents?.records[k],q=r?.quote,p=q&&(s.pets||[])[q.petIndex];
  if(!r||r.status!=='pending'||r.month!==s.month||!q||!p||JSON.stringify([p.id,p.careId,p.species,p.type,p.adoptMonth,p.name])!==q.petIdentity||s.cash<q.cost||!Number.isFinite(free)||free<0||!r.forced&&free<q.hours)return false;
  const short=q.hours>free;if(short&&!forcedTime)return false;
  const time=short?forcedTime({id:'pet-'+k,month:s.month,hours:q.hours,available:free}):null;
  s.cash=money(s.cash-q.cost);for(const stat of ['energy','happiness','stress'])if(q[stat])s[stat]=Math.max(0,Math.min(100,(s[stat]??0)+q[stat]));
  const d=data(s);d.hours[s.month]=(d.hours[s.month]||0)+(time?time.used:q.hours);
  if(q.contact){s.people??=[];if(!s.people.some(p=>p.id===q.contact.id))s.people.push(clone(q.contact));}
  r.status='resolved';r.receipt={cost:q.cost,hours:q.hours,time};
  if(q.cost)(s.financeLedger??=[]).push({kind:'lifeIncident',month:s.month,amount:q.cost,eventId:'pet-'+k,source:'petMapEvent'});
  if(short||q.hours===free)s.forcedTimeReturn={month:s.month,id:'pet-'+k,debt:time?.debt||0};
  const move=s.town?.movement;if(move&&move.id===r.moveId&&!move.resolved){move.resolved=true;move.completedMonth=s.month;(s.town.history??=[]).push({id:move.id,die:move.die,to:move.to,month:s.month,type:'life',petEvent:r.id});}
  return true;}
 function atomic(s,change,save){const before=clone(s);try{if(change()===false)throw Error('invalid pet event');if(save()===false)throw Error('save failed');return true;}catch(e){for(const k of Object.keys(s))delete s[k];Object.assign(s,before);return false;}}
 const api={companions,weights,illness,species,data,key,choices,quote,draw,execute,atomic};root.PetMapEvents=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
