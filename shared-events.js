// Twelve approved shared-housing cards. No family-card or lease migrations.
(function(root){
 const choice=(label,hours=0,effects={})=>({label,hours,...effects});
 const cards=[
  {id:'cook',title:'今晚一起做饭',desc:'你刚回到家，就闻到厨房里飘来的香味。舍友正在洗菜，探出头问：“今晚一起吃吗？搭把手，很快就能开饭。”',choices:[choice('一起下厨，边做边聊',2,{cash:-10,happiness:6,stress:-4}),choice('我叫了外卖，今晚自己吃',1,{cash:-25,happiness:3,stress:-2})]},
  {id:'movie',title:'舍友电影夜',desc:'舍友把客厅灯调暗，抱来一桶爆米花：“今晚看部电影？零食一起分，沙发给你留了位置。”',choices:[choice('一起看，今晚就放松一下',3,{happiness:6,stress:-5}),choice('今晚想自己放松一下')]},
  {id:'ride',art:'assets/shared/ride-b4-20261102.webp',title:'顺路捎一程',desc:'你正准备出门，舍友拿起车钥匙：“我也往那边走，要不要一起？正好顺路。”',choices:[choice('那就搭个顺风车，谢谢啦',1,{happiness:3}),choice('今天想自己走走',2,{happiness:4})]},
  {id:'quilt',title:'阳台晒被子',desc:'难得碰上好天气，舍友抱着被子走向阳台：“要不要把你的也拿来晒晒？我们一起搭把手，晚上睡着舒服。”',choices:[choice('一起晒，今晚睡个舒服觉',2,{happiness:4,energy:-1}),choice('我只想瘫着')]},
  {id:'games',title:'客厅游戏局',desc:'舍友把桌游铺在茶几上，朝你晃了晃手里的卡牌：“就差你了！来一局？输赢不重要，开心最重要。”',choices:[choice('来了，今晚一起玩',2,{happiness:5,stress:-3}),choice('你们玩，我先歇会儿')]},
  {id:'meal',title:'多做了一份',desc:'你忙了一天回到家，舍友指了指餐桌上的饭盒：“今天多做了一份，给你留着呢，热一下就能吃。”',choices:[choice('太贴心了，这顿我来洗碗',0,{cash:20,happiness:5,stress:-3}),choice('谢谢你，我已经吃过了')]},
  {id:'toolbox',title:'工具箱事件',desc:'你正准备下单买工具，舍友看了一眼：“这个我有呀！偶尔用一次，不用专门买，拿去用吧。”',choices:[choice('太好了，用完好好收拾再还你',0,{happiness:3,energy:-1}),choice('谢谢，我还是想买一套自己的',0,{cash:-30,happiness:2,energy:-1})]},
  {id:'chat',title:'深夜聊聊',desc:'你倒水时，发现舍友还坐在客厅。她拍了拍旁边的靠垫：“还不困？坐会儿吧，我想和你聊聊。”',choices:[choice('坐一会儿，聊聊最近的事',2,{happiness:5,stress:-5,energy:-1}),choice('今天困了，先去睡啦')]},
  {id:'clean',title:'公共区域大扫除',desc:'你和舍友早已约好，今天一起打扫公共区域。清洁工具都准备好了，大家正等着分工。',choices:[choice('一起动手，把家收拾清爽',3,{happiness:2,energy:-3}),choice('临时有事，请人替我打扫',1,{cash:-100,happiness:2,energy:-1})]},
  {id:'noise',title:'扰人清梦',desc:'已经很晚了，客厅里的游戏声和说笑声还没停。你明天需要早起，想了想，还是走出了房门。',choices:[choice('好好商量，约定晚上的安静时间',1,{happiness:2}),choice('今晚先戴耳塞，明天再聊',0,{stress:1})]},
  {id:'leak',title:'漏水的小插曲',desc:'厨房水槽下突然积了一摊水。你和舍友关好阀门，检查后发现接头老化，需要更换：“一起修一下，还是请师傅来？”',choices:[choice('一起动手，买配件慢慢修',4,{cash:-10,happiness:2,energy:-4}),choice('请师傅来，分摊维修费',1,{cash:-60,happiness:2,energy:-1})]},
  {id:'guest',title:'被打乱的生活',desc:'舍友没提前商量，就让朋友来借住。对方深夜打电话、随手拿你的东西，还把行李堆进你的私人空间。原本熟悉的家，突然让你很不自在。',choices:[choice('找舍友认真谈，明确借住期限和边界',2,{happiness:-2,energy:-1,stress:1}),choice('暂时忍着，尽量避开对方',0,{happiness:-5,energy:-1,stress:4})]}
 ];
 // Confirmed artwork has different button heights; normalized hit regions follow each image.
 const boxes={cook:[[1438,1578],[1605,1747]],movie:[[1438,1578],[1606,1740]],ride:[[1438,1578],[1606,1740]],quilt:[[1440,1600],[1633,1739]],games:[[1440,1600],[1633,1739]],meal:[[1440,1600],[1634,1740]],toolbox:[[1408,1578],[1605,1793]],chat:[[1408,1600],[1634,1767]],clean:[[1408,1578],[1606,1788]],noise:[[1408,1600],[1630,1788]],leak:[[1408,1578],[1606,1789]],guest:[[1408,1600],[1630,1787]]};
 for(const c of cards){const height=['quilt','games'].includes(c.id)?1843:1844;c.hotspots=boxes[c.id].map(([top,bottom])=>[top/height*100,(bottom-top)/height*100]);}
 function data(s){return s.sharedEvents??={version:1,seen:{},records:{}};}
 function eligible(s){const seen=s.sharedEvents?.seen||{},pool=cards.filter(c=>seen[c.id]==null||s.month-seen[c.id]>6),unseen=pool.filter(c=>seen[c.id]==null);return unseen.length?unseen:pool;}
 function draw(s,random=Math.random){const d=data(s);if(d.records[s.month])return d.records[s.month];const r=d.records[s.month]={pool:'shared',month:s.month,status:'none',cardId:null};if(s.housing!=='shared')return r;const pool=eligible(s);if(random()>=.5||!pool.length)return r;const c=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];r.cardId=c.id;r.status='pending';r.presented=false;d.seen[c.id]=s.month;return r;}
 function missing(s,r,index,free,reserve=0){const o=cards.find(c=>c.id===r?.cardId)?.choices[index];if(!o||r.status!=='pending'||r.month!==s.month)return ['此选项已失效'];const a=[];if(s.cash+(o.cash||0)<0)a.push('现金不足');if(free<o.hours)a.push('自由时间不足');else if(o.hours&&free-o.hours<reserve)a.push('需保留必要宠物照护时间');return a;}
 function resolve(s,month,id,index,free,reserve=0){const r=s.sharedEvents?.records[month];if(!r||r.cardId!==id||missing(s,r,index,free,reserve).length)return false;const o=cards.find(c=>c.id===id).choices[index];r.status='resolved';r.choice=index;r.hours=o.hours;r.effects={};for(const k of ['cash','energy','stress','happiness']){if(!o[k])continue;const before=s[k]||0;s[k]=k==='cash'?Math.round((before+o[k])*100)/100:Math.max(0,Math.min(100,before+o[k]));r.effects[k]=s[k]-before;}if(o.cash)(s.financeLedger??=[]).push({kind:o.cash>0?'sharedIncome':'sharedExpense',month,id,amount:Math.abs(o.cash)});return true;}
 function used(s){return Object.values(s.sharedEvents?.records||{}).filter(r=>r.month===s.month&&r.status==='resolved').reduce((n,r)=>n+(r.hours||0),0);}
 function plan(s,r,index,free,reserve=0,rates={}){const o=cards.find(c=>c.id===r?.cardId)?.choices[index];if(!o||r.status!=='pending'||r.month!==s.month||!Number.isFinite(free)||free<0||!Number.isFinite(reserve)||reserve<0)return null;const hours=o.hours?Math.max(0,o.hours+reserve-free):0;if(hours&&(!rates.working||hours>(rates.availableWorkHours||0)))return null;const round=n=>Math.round(n*100)/100;return {hours,wages:round(hours*(rates.wageRate||0)),tips:round(hours*(rates.tipRate||0)),cost:Math.max(0,-(o.cash||0))};}
 function resolveWithLeave(s,month,index,free,reserve,rates){const r=s.sharedEvents?.records[month],p=plan(s,r,index,free,reserve,rates);if(!p||!resolve(s,month,r.cardId,index,free+p.hours,reserve))return false;if(p.hours)r.leave={hours:p.hours,wages:p.wages,tips:p.tips,job:s.job};return true;}
 function leave(s){return Object.values(s.sharedEvents?.records||{}).filter(r=>r.month===s.month&&r.status==='resolved'&&r.leave).reduce((a,r)=>({hours:a.hours+r.leave.hours,wages:a.wages+r.leave.wages,tips:a.tips+r.leave.tips}),{hours:0,wages:0,tips:0});}
 const api={cards,data,eligible,draw,missing,resolve,used,plan,resolveWithLeave,leave};root.SharedEvents=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
