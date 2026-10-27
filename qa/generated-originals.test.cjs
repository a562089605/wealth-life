const fs=require('fs'),crypto=require('crypto'),a=require('node:assert/strict');
const root='assets/archive/generated-originals',m=JSON.parse(fs.readFileSync(root+'/manifest.json')),art=JSON.parse(fs.readFileSync('art-integration-manifest.json'));
a.equal(m.count,28);a.equal(m.files.length,m.count);let total=0;const seen=new Set();
for(const r of m.files){a.ok(r.repositoryPath.startsWith(root+'/'));a.ok(!seen.has(r.repositoryPath));seen.add(r.repositoryPath);const bytes=fs.readFileSync(r.repositoryPath);a.equal(bytes.length,r.bytes);a.equal(crypto.createHash('sha256').update(bytes).digest('hex'),r.sha256);a.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');a.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],r.dimensions);total+=bytes.length;}
a.equal(total,m.totalBytes);a.equal(art.generatedOriginalArchive.count,m.count);a.equal(art.generatedOriginalArchive.totalBytes,total);a.equal(art.generatedOriginalArchive.manifest,root+'/manifest.json');
a.equal(fs.readdirSync(root).filter(p=>p.endsWith('.png')).length,m.count);
a.ok(fs.readFileSync('.assetsignore','utf8').split('\n').includes('assets/archive/'));a.ok(!fs.readFileSync('sw.js','utf8').includes('./assets/archive/'));
for(const e of art.entries)for(const p of e.source?.archivedGeneratedOriginals||[])a.ok(seen.has(p));
console.log('PASS: all28 original PNG hashes, bytes, dimensions, source links and deployment/cache exclusions.');
