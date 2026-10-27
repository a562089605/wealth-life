const fs=require('fs'),vm=require('vm'),a=require('node:assert/strict');
let title='确认页',active=true;const c={state:{month:0},$:()=>({textContent:title})};vm.createContext(c);const source=fs.readFileSync('flow.js','utf8');vm.runInContext(source.slice(0,source.indexOf('function completeMonthlyStep')),c);
const node={isConnected:true,closest:selector=>selector==='.event-active'&&active?{}:null};
a.equal(c.eventActionCurrent(node,'确认页'),true);active=false;a.equal(c.eventActionCurrent(node,'确认页'),false);active=true;node.isConnected=false;a.equal(c.eventActionCurrent(node,'确认页'),false);node.isConnected=true;title='其他页面';a.equal(c.eventActionCurrent(node,'确认页'),false);a.equal(c.eventActionCurrent(null,'确认页'),false);
console.log('PASS: active event/title and connected original node required, including hidden-but-connected confirmations.');
