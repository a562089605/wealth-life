import concurrent.futures,datetime,hashlib,json,pathlib,subprocess,urllib.request
root=pathlib.Path(__file__).resolve().parents[2]
previous=json.loads((root/'qa/career-learning-20261115/production-resources.json').read_text())
files={r['file'] for r in previous['files']}
files.update(['career-event-data.js','career-event-rules.js','career-event-integration.js','career-event-pages.js','career-event-pages.css','index.html','sw.js'])
files.update(str(p.relative_to(root)) for p in (root/'assets/career-events-20261116').glob('*.webp'))
def check(file):
 expected=hashlib.sha256((root/file).read_bytes()).hexdigest()
 try:
  actual=hashlib.sha256(subprocess.check_output(['curl','--location','--fail','--silent','--show-error','--retry','2','--max-time','60','https://wealth-life.a562089605.workers.dev/'+file+'?career_release=20261116'])).hexdigest()
  return dict(file=file,expectedSHA256=expected,sha256=actual,matchesLocal=expected==actual,error='')
 except Exception as e:return dict(file=file,expectedSHA256=expected,matchesLocal=False,error=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(check,sorted(files)))
out=dict(commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),files=results,ok=all(x['matchesLocal'] for x in results))
(root/'qa/career-events-20261116/production-resources.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(ok=out['ok'],count=len(results),failures=[x for x in results if not x['matchesLocal']][:5])))
raise SystemExit(0 if out['ok'] else 1)
