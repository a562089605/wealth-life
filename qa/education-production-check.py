from pathlib import Path
import subprocess,json,hashlib,datetime,concurrent.futures
root=Path(__file__).resolve().parent.parent
files={'index.html','sw.js','core.js','flow.js','relationship-life-cards.js','education-plans.js','education-pages.js','education-pages.css'}
files.update(str(f.relative_to(root)) for f in (root/'assets/education').glob('*.webp'))
files.update(r['file'] for r in json.loads((root/'qa/confirmed-release-20261112.json').read_text())['files'])
def check(f):
 r=subprocess.run(['curl','-fsSL','--max-time','30','https://wealth-life.a562089605.workers.dev/'+(''if f=='index.html'else f)],capture_output=True)
 return {'file':f,'sha256':hashlib.sha256(r.stdout).hexdigest(),'matchesLocal':r.returncode==0 and r.stdout==(root/f).read_bytes()}
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:rows=list(pool.map(check,sorted(files)))
report={'functionalCommit':'ba32f57','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':rows,'allMatch':all(r['matchesLocal']for r in rows)}
(root/'qa/education-20261113/production-resources.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'files':len(rows),'allMatch':report['allMatch'],'mismatches':[r['file']for r in rows if not r['matchesLocal']]}))
