const fs=require('fs'),vm=require('vm'),a=require('node:assert/strict');
const handlers={};let online=true,writeFails=false,writes=0,read;
const c={URL,Response,self:{location:{origin:'https://game.test'},addEventListener:(k,f)=>handlers[k]=f},fetch:async()=>{if(!online)throw Error('offline');return new Response('network')},caches:{open:async()=>({put:async()=>{writes++;if(writeFails)throw Error('quota')}}),match:async key=>read?.(key)}};
vm.createContext(c);vm.runInContext(fs.readFileSync('sw.js','utf8'),c);
async function request(mode='navigate'){
 let active=true,response,lifetime;
 handlers.fetch({request:{method:'GET',url:'https://game.test/',mode},waitUntil(p){a.ok(active,'waitUntil must be registered synchronously');lifetime=p},respondWith(p){response=p}});active=false;
 const r=await response;await lifetime;return r;
}
(async()=>{
 a.equal(await (await request()).text(),'network');a.equal(writes,1);
 writeFails=true;a.equal(await (await request()).text(),'network');
 online=false;read=key=>typeof key==='object'?new Response('cached asset'):undefined;
 a.equal(await (await request('cors')).text(),'cached asset');
 read=key=>key==='./index.html'?new Response('offline shell'):undefined;
 a.equal(await (await request()).text(),'offline shell');
 read=()=>undefined;a.equal((await request()).type,'error');
 console.log('PASS: synchronous cache lifetime, quota isolation, offline resource and navigation fallback, missing-shell Response.error.');
})().catch(e=>{console.error(e);process.exitCode=1});
