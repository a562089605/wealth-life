import hashlib,json,re,urllib.request,concurrent.futures
from pathlib import Path
root=Path(__file__).resolve().parents[2];sha='c5048d6f6c347191aa3573ef5fb36cae4414cf94';base='https://wealth-life.a562089605.workers.dev/'
def get(url,auth=False):
 headers={'User-Agent':'wealth-life-release-verification'}
 if auth:
  match=re.search(r'oauth_token:\s*(\S+)',Path.home().joinpath('.config/gh/hosts.yml').read_text());headers['Authorization']='Bearer '+match.group(1);headers['Accept']='application/vnd.github+json'
 return urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=40).read()
checks=json.loads(get('https://api.github.com/repos/a562089605/wealth-life/commits/'+sha+'/check-runs',True));out=[{k:r.get(k) for k in ['name','status','conclusion','html_url','details_url']} for r in checks.get('check_runs',[])];(root/'qa/relationship-review-20261113/production-deployment.json').write_text(json.dumps(out,indent=2));print('Deployment checks:',json.dumps(out))
index=(root/'index.html').read_text();paths=['index.html','sw.js']+re.findall(r'(?:src|href)="([^"#]+\.(?:js|css)(?:\?v=[^" ]+)?)"',index)
paths+= [x['runtime'] for x in json.loads((root/'design/relationship-review-20261113/manifest.json').read_text())['selected']]
paths=sorted(set(p for p in paths if not p.startswith(('http','//'))))
def verify(p):
 try:
  data=get(base+p);local=(root/p.split('?')[0]).read_bytes();return {'path':p,'equal':data==local,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
 except Exception as e:return {'path':p,'equal':False,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:rows=list(pool.map(verify,paths))
(root/'qa/relationship-review-20261113/production-resources.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Resources:',len(rows),'matched:',sum(r['equal'] for r in rows));print('Unmatched:',[r['path'] for r in rows if not r['equal']])
