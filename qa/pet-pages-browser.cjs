// Real Chromium; isolated context and test slots only. No production player saves.
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8878');const html=fs.readFileSync('index.html','utf8'),initial=html.slice(html.indexOf("$('start').onclick=")+19,html.indexOf(";$('cancel').onclick"));
 await page.evaluate(initial=>{document.getElementById('job').value='barista';eval('('+initial+')()');clearModals();slot=901;state.cash=100000;state.onboardDone=true;state.pets=[];townVisible=false;save();window.basePetAudit=JSON.parse(JSON.stringify(state));},initial);
 const expected={dog:[550,50],cat:[450,80],crocodile:[2300,300],gecko:[395,35],spider:[208,18],tortoise:[435,35],chameleon:[545,45]},results=[];
 for(const [id,[total,monthly]]of Object.entries(expected)){
  const before=await page.evaluate(()=>JSON.stringify(state));await page.evaluate(()=>document.getElementById('petBtn').click());
  if(id!=='dog')await page.getByRole('button',{name:'领养新伙伴',exact:true}).click();
  const cn=await page.evaluate(id=>PetAdoptionEntry.pets[id].name,id);
  await page.getByRole('button',{name:'选择'+cn,exact:true}).click();await page.getByRole('button',{name:'下一步：取名与费用',exact:true}).click();
  assert.equal(await page.evaluate(()=>JSON.stringify(state)),before,'preview mutated '+id);
  await page.getByRole('button',{name:'暂不领养，返回选择',exact:true}).click();assert.equal(await page.getByRole('button',{name:'选择'+cn,exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'下一步：取名与费用',exact:true}).click();await page.locator('#petNameInput').fill('测试-'+id);
  if(id==='dog'){
   await page.evaluate(()=>{window.prePetState=JSON.stringify(state);window.prePetRaw=localStorage.getItem(key(slot));window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key(slot))throw new DOMException('test quota','QuotaExceededError');return originalSetItem.call(this,k,v);};});
   await page.getByRole('button',{name:'确认领养'+cn,exact:true}).click();assert.match(await page.locator('.pet-message').innerText(),/暂未保存/);
   assert.equal(await page.evaluate(()=>JSON.stringify(state)===prePetState&&localStorage.getItem(key(slot))===prePetRaw),true);
   await page.evaluate(()=>Storage.prototype.setItem=originalSetItem);
  }
  const cash=await page.evaluate(()=>state.cash);await page.getByRole('button',{name:'确认领养'+cn,exact:true}).click();
  const result=await page.evaluate(({id,total,cash})=>{const p=state.pets.at(-1),raw=JSON.parse(localStorage.getItem(key(slot)));if(state.cash!==cash-total||raw.cash!==state.cash||p.name!=='测试-'+id||raw.pets.at(-1).name!==p.name)throw Error('adoption result '+id);return {id,cash:state.cash,petCount:state.pets.length};},{id,total,cash});
  await page.getByRole('button',{name:'查看我的宠物',exact:true}).click();assert.equal(await page.locator('.pet-tile').count(),Object.keys(expected).indexOf(id)+1);results.push(result);
 }
 // Multiple pets shrink into a two-column grid, with a single add tile.
 assert.equal(await page.locator('.pet-add-tile').count(),1);await page.screenshot({path:'qa/pet-pages-overview.png',fullPage:true});
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:844});await page.evaluate(()=>PetPages.openOverview());
  assert.equal(await page.evaluate(()=>document.querySelector('.pet-pages-overlay').scrollWidth<=innerWidth),true,'overflow '+width);
  for(const mode of ['detail','clean','adoption','success']){
   await page.evaluate(mode=>{if(mode==='detail')PetPages.openDetail(0);if(mode==='clean')PetPages.openClean(0);if(mode==='adoption')PetPages.openAdoption('dog');if(mode==='success'){PetPages.openOverview();}},mode);
   const bad=await page.evaluate(()=>[...document.querySelectorAll('.pet-pages-overlay button')].filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth+1||r.height<43);}).map(b=>b.textContent));assert.deepEqual(bad,[],mode+' touch targets '+width);
  }
 }
 await page.setViewportSize({width:390,height:844});
 // Exercise every species' due-cleaning payment against canonical quote/care code.
 for(const id of Object.keys(expected)){
  const i=Object.keys(expected).indexOf(id);
  await page.evaluate(i=>{PetPages.close();state.month=3;state.cash=10000;state.job=null;state.retired=true;state.petCareTime={month:3,hours:0};ensurePetCare();state.pets[i].care.nextClean=3;state.pets[i].care.nextAnnual=15;save();PetPages.openClean(i);},i);
  await page.getByRole('button',{name:'确认选择',exact:true}).click();
  if(id==='dog'){
   await page.evaluate(()=>{window.preCareState=JSON.stringify(state);window.preCareRaw=localStorage.getItem(key(slot));window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key(slot))throw new DOMException('test quota','QuotaExceededError');return originalSetItem.call(this,k,v);};});
   await page.getByRole('button',{name:'确认支付',exact:true}).click();assert.match(await page.locator('.pet-message').innerText(),/暂未完成/);assert.equal(await page.evaluate(()=>JSON.stringify(state)===preCareState&&localStorage.getItem(key(slot))===preCareRaw),true);
   await page.evaluate(()=>Storage.prototype.setItem=originalSetItem);
  }
  await page.getByRole('button',{name:'确认支付',exact:true}).click();
  const r=await page.evaluate(({i,id})=>{const p=state.pets[i],rule=PET_CARE_RULES[id];if(state.cash!==10000-rule.self||p.care.nextClean!==3+rule.selfMonths||state.petCareTime.hours!==rule.selfHours)throw Error('care result '+id);return {id,careSaved:JSON.stringify(state)===localStorage.getItem(key(slot)),cash:state.cash,next:p.care.nextClean};},{i,id});assert.equal(r.careSaved,true);results.push(r);
 }
 // Old callback cannot affect another slot/month, and opening details is read-only.
 await page.evaluate(()=>{PetPages.openClean(0);window.stalePetButton=document.querySelector('.pet-hit');window.stalePetHandler=stalePetButton.onclick;window.beforeOtherState=JSON.stringify(state);slot=902;state.month++;window.otherState=JSON.stringify(state);stalePetHandler();if(JSON.stringify(state)!==otherState)throw Error('stale callback');});
 await page.evaluate(()=>{slot=901;state=JSON.parse(localStorage.getItem(key(slot)));PetPages.close();window.auditBefore=JSON.stringify(state);PetPages.openOverview();PetPages.openDetail(0);PetPages.openClean(0);if(JSON.stringify(state)!==auditBefore)throw Error('read-only view mutated state');});
 await page.screenshot({path:'qa/pet-pages-clean.png',fullPage:true});
 await page.reload();await page.evaluate(()=>{slot=901;state=JSON.parse(localStorage.getItem(key(slot)));openGame();document.getElementById('petBtn').click();});assert.equal(await page.locator('.pet-tile').count(),7);
 const allImages=await page.evaluate(async()=>{const imgs=[...document.querySelectorAll('.pet-pages-overlay img')];await Promise.all(imgs.map(im=>im.decode()));return imgs.every(im=>im.naturalWidth>0);});assert.equal(allImages,true);assert.deepEqual(errors,[]);
 fs.writeFileSync('qa/pet-pages-results.json',JSON.stringify({browser:'Chromium isolated test slots 901/902',realDevice:false,results,pageErrors:errors},null,2)+'\n');console.log('PASS pet pages Chromium: all seven adoption and care flows, rollback/retry, cancel selection, multi-pet layout, 320/390/1280, stale actions, read-only preview, reload and image decode.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
