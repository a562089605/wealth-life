import pathlib,json,subprocess,hashlib,concurrent.futures,datetime
p=pathlib.Path(__file__).resolve().parent.parent
files={x['file'] for x in json.loads((p/'qa/relationship-production-20261110.json').read_text())['files']}
files.update(['relationship-card-data.js','relationship-life-ui.js']);files.update(str(f.relative_to(p)) for f in (p/'assets/relationships/cards').glob('*.webp'))
def check(f):
 url='https://wealth-life.a562089605.workers.dev/'+('' if f=='index.html' else f)
 if f.endswith(('.js','.css')):url+='?v=20261112-confirmed1'
 r=subprocess.run(['curl','-fsSL','--max-time','30',url],capture_output=True)
 return dict(file=f,url=url,exit=r.returncode,bytes=len(r.stdout),sha256=hashlib.sha256(r.stdout).hexdigest(),matchesLocal=r.returncode==0 and r.stdout==(p/f).read_bytes())
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:rows=list(ex.map(check,sorted(files)))
out=dict(checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),functionalCommit=subprocess.check_output(['git','rev-parse','fb7c219'],cwd=p,text=True).strip(),files=rows,allMatch=all(r['matchesLocal'] for r in rows))
(p/'qa/relationship-confirmed-production-20261112.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(files=len(rows),allMatch=out['allMatch'],mismatches=[r['file'] for r in rows if not r['matchesLocal']])))
