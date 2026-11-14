"""Read-only byte verification of the monthly education release and preserved baseline."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parent.parent
files={row['file'] for row in json.loads((root/'qa/shared-interest-20261114/production-resources.json').read_text())['files']}
files.update(row['file'] for row in json.loads((root/'qa/education-monthly-20261113/assets.json').read_text()))
files.update(['education-monthly.js','teacher-relationships.js','teacher-card-data.js'])
def check(file):
 r=subprocess.run(['curl','-fLsS','--retry','2','--max-time','30','https://wealth-life.a562089605.workers.dev/'+file],capture_output=True)
 sha=hashlib.sha256(r.stdout).hexdigest();expected=hashlib.sha256((root/file).read_bytes()).hexdigest()
 return {'file':file,'sha256':sha,'expectedSHA256':expected,'matchesLocal':r.returncode==0 and sha==expected,'error':r.stderr.decode()[:200]}
with ThreadPoolExecutor(max_workers=12) as pool:rows=list(pool.map(check,sorted(files)))
report={'commit':'b0c08f4df77668ca2f049cf27433205dc1aae0dc','checkedAt':datetime.now(timezone.utc).isoformat(),'files':rows,'allMatch':all(r['matchesLocal'] for r in rows)}
(root/'qa/education-monthly-20261113/production-resources.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'files':len(rows),'allMatch':report['allMatch'],'failures':[r for r in rows if not r['matchesLocal']]}))
raise SystemExit(0 if report['allMatch'] else 1)
