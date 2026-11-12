from pathlib import Path
import json,subprocess,hashlib,concurrent.futures,datetime
p=Path(__file__).resolve().parent.parent
files=['index.html','sw.js','save-slots.js','save-slots.css','flow.js','time-flow.js','assets/career/town.webp']
def check(f):
 url='https://wealth-life.a562089605.workers.dev/'+('' if f=='index.html' else f)
 r=subprocess.run(['curl','-fsSL','--max-time','30',url],capture_output=True)
 return {'file':f,'exit':r.returncode,'sha256':hashlib.sha256(r.stdout).hexdigest(),'matchesLocal':r.returncode==0 and r.stdout==(p/f).read_bytes()}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:rows=list(ex.map(check,files))
out={'functionalCommit':'11c44ff','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':rows,'allMatch':all(r['matchesLocal'] for r in rows)}
(p/'qa/save-slots-20261112/production-resources.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'allMatch':out['allMatch'],'files':len(rows),'mismatches':[r['file'] for r in rows if not r['matchesLocal']]}))
