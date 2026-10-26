const a=require('node:assert/strict'),R=require('../social-records.js');
const p={id:'a',name:'同名'},q={id:'b',name:'同名'};let s={month:0,people:[p,q]};
a.equal(R.add(s,p,{month:0,person:'a',hours:2}),true);a.equal(R.find(s,q),null);a.equal(R.add(s,p,{month:0,person:'a',hours:1}),false);a.equal(R.add(s,q,{month:0,person:'b',hours:1}),true);a.equal(R.all(s).length,2);a.equal(R.all(s).reduce((n,r)=>n+r.hours,0),3);
s=JSON.parse(JSON.stringify(s));a.equal(R.all(s).length,2);a.equal(R.find(s,p).hours,2);s.month=1;a.equal(R.all(s).length,0);a.equal(R.find(s,p),null);
s={month:0,people:[p,q],socialMonth:{month:0,person:'a',hours:1}};a.ok(R.find(s,p));a.equal(R.find(s,q),null);R.add(s,q,{month:0,person:'b',hours:2});a.equal(R.all(s).length,2);a.equal(R.all(s).reduce((n,r)=>n+r.hours,0),3);
s={month:0,people:[p,q],socialMonth:{month:0,person:'同名'}};a.ok(R.find(s,p));a.equal(R.find(s,q),null);a.equal(R.all(s)[0].hours,undefined);
s={month:0,people:[p],socialMonth:{month:0,person:'a'}};let before=JSON.stringify(s);R.all(s);R.find(s,p);a.equal(JSON.stringify(s),before);
console.log('PASS: per-contact quota, duplicate rejection, stable IDs for same names, accumulated hours, legacy receipts, pure lookup, reload and month reset.');
