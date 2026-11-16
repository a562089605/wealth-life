import pathlib,json,hashlib
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[2];base=root/'design/career-events-20261115';cards={};art=[]
for manifest in sorted(base.glob('*/manifest.json')):
 d=json.loads(manifest.read_text());i=d['id'];source=root/d['artwork'];assert hashlib.sha256(source.read_bytes()).hexdigest()==d['sha256']
 target=root/'assets/career-events-20261116'/f'{i}.webp';im=Image.open(source).convert('RGB');im.save(target,'WEBP',quality=91,method=6)
 def effects(o):
  out={}
  for a,b in [('energy','energy'),('stress','stress'),('happiness','happiness'),('managerTrust','trust'),('managementXP','management'),('serviceXP','service'),('latteXP','latte'),('pourOverXP','pourOver'),('bonus','bonus'),('tips','tips'),('workHours','hours'),('storeSalesRate','sales')]:
   if o.get(a):out[b]=o[a]
  return out
 opts=[]
 for o in d.get('options',[]):
  e=effects(o)
  if o.get('serviceExperience'):e['service']=o.get('workHours',0)/4
  if i=='barista-staff' or i=='barista-busy' or i=='barista-departure':
   if o['id']=='A':e['paidHours']=o['workHours'];e['tipFormula']=i
  if i=='barista-cut':e['paidHours']=o['workHours'];e['tipFormula']='cut'
  if i=='manager-departure' and o['id']=='A':e['paidHours']=4
  if i=='shift-schedule' and o['id']=='C' or i=='shift-acting' and o['id']=='A':e['paidHours']=8;e['tipFormula']='shift'
  if i=='shift-complaint' and o['id']=='C':e['storeRefund']=True
  if i=='manager-equipment':e['storeCost']=500
  if i=='manager-research':e['storeCost']=100
  follow=('schedule' if i=='shift-schedule' and o['id']=='B' else 'complaint' if i=='shift-complaint' and o['id']=='B' else 'acting' if i=='shift-acting' and o['id']=='A' else 'decline-'+o['id'].lower() if i=='manager-decline' and o['id'] in ['A','B'] else 'research-'+o['id'].lower() if i=='manager-research' else None)
  opts.append({'label':o['label'],'description':o.get('description',''),'effects':e,**({'follow':follow} if follow else {})})
 if not opts and 'effects' in d:fx=effects(d['effects'])
 else:fx=None
 if i=='shift-praise':
  opts=[{'label':'开心接受','description':'','effects':fx}];fx=None
 # Keep original stories where early art manifests did not repeat them.
 stories={'barista-staff':'今天早上，经理发来消息：“有同事突然生病了，你今天能来顶一个完整班吗？”','barista-busy':'这个周末，店里订单接连不断，吧台忙得停不下来。经理问你愿不愿意加班帮忙。','shift-schedule':'两位员工同一天无法上班，门店出现一个完整8小时班次缺口。你需要协调处理。','shift-complaint':'顾客的饮品连续做错两次，非常生气，要求负责人立即处理。你会怎么做？','shift-schedule-success':'两位员工成功找到替班人，门店排班问题解决。','shift-complaint-success':'员工成功安抚顾客，并重新制作了正确的饮品。'}
 cards[i]={'id':i,'title':d['title'],'story':d.get('story',stories.get(i,'')),'art':str(target.relative_to(root)),'options':opts,'effects':fx}
 art.append({'id':i,'source':d['artwork'],'sourceSha256':d['sha256'],'runtime':str(target.relative_to(root)),'runtimeSha256':hashlib.sha256(target.read_bytes()).hexdigest()})
# Follow-up forced overtime is quoted from the same frozen contract.
cards['shift-schedule-failure']['effects'].update(paidHours=8,tipFormula='shift')
(root/'career-event-data.js').write_text('// User-confirmed 29 career artworks and final effects. Internal rules are kept out of card copy.\n(function(r){const cards='+json.dumps(cards,ensure_ascii=False,separators=(',',':'))+';r.CareerEventData={cards,managerNaturalDrawEnabled:false,managerTriggerProbability:null};if(typeof module!=="undefined")module.exports=r.CareerEventData;})(typeof window==="undefined"?globalThis:window);\n')
(base/'runtime-manifest.json').write_text(json.dumps({'status':'integration-in-progress','artifacts':art},ensure_ascii=False,indent=2)+'\n')
print(len(cards),'cards converted')
