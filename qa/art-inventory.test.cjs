const fs=require('fs'),crypto=require('crypto'),vm=require('vm'),a=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('art-integration-manifest.json'));
const baseline=JSON.parse(fs.readFileSync('qa/remote-resource-baseline.json'));
const sw={self:{addEventListener(){}}};vm.createContext(sw);vm.runInContext(fs.readFileSync('sw.js','utf8'),sw);
const cached=new Set(vm.runInContext('ASSETS',sw).map(p=>p.replace(/^\.\//,'').split('?')[0]));
const paths=new Set();
for(const row of manifest.entries){
 a.ok(!paths.has(row.resourcePath),'duplicate inventory path');paths.add(row.resourcePath);
 a.ok(row.pageOrEvent);a.ok(row.verification);a.ok(cached.has(row.resourcePath),'illustration missing from precache: '+row.resourcePath);
 const bytes=fs.readFileSync(row.resourcePath);const sha=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 a.equal(sha,row.gitBlobSha,'original bytes changed: '+row.resourcePath);
}
a.equal(manifest.entries.length,100);a.equal(manifest.entries.filter(x=>x.addedInExistingPR).length,82);
a.deepEqual(manifest.entries.filter(x=>x.integrationStatus==='existing-integration').map(x=>x.resourcePath).sort(),baseline.tree.filter(x=>x.path.endsWith('.webp')).map(x=>x.path).sort());
const html=fs.readFileSync('index.html','utf8');for(const match of html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)){
 if(match[1].startsWith('http'))continue;
 const asset=match[1].replace(/^\.\//,'');a.ok(fs.existsSync(asset.split('?')[0]));
 a.ok(vm.runInContext('ASSETS',sw).some(p=>p.replace(/^\.\//,'')===asset),'script/style URL absent from precache: '+asset);
}
console.log('PASS: 100 production illustration hashes, 82 tagged PR additions, unique paths, complete precache and exact HTML script/style URLs.');

a.equal(manifest.candidateEntries.length,459);a.equal(manifest.candidateEntries.filter(x=>x.validationError).length,12);a.equal(manifest.entries.filter(x=>x.integrationStatus==='new-integration').length,64);
