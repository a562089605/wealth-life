"""Original seven-pet sheet; actual selection buttons and existing fee preview."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8765',wait_until='networkidle')
 page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click()
 page.locator('#roomView [data-room="pets"]').click()
 page.wait_for_function('document.querySelector(".pet-adoption-sheet img")?.naturalWidth>0')
 assert page.locator('.pet-sheet-cash').inner_text()=='$10,000'
 box=page.locator('.event-active').bounding_box()
 assert abs(box['y']+box['height']/2-844/2)<1
 assert abs(box['x']+box['width']/2-390/2)<1
 page.screenshot(path='qa/browser-evidence/pet-selection-sheet.png',full_page=True)
 before=page.evaluate('({cash:state.cash,month:state.month,pets:state.pets.length,free:currentCareerTime().free})')
 for name in ['柯基','银渐层','鳄鱼','豹纹守宫','捕鸟蛛','陆龟','变色龙']:
  button=page.get_by_role('button',name='查看'+name,exact=True);button.click();assert button.get_attribute('aria-pressed')=='true'
  assert page.locator('.pet-sheet-option[aria-pressed="true"]').count()==1
  assert page.evaluate('({cash:state.cash,month:state.month,pets:state.pets.length,free:currentCareerTime().free})')==before
 page.get_by_role('button',name='下一步：取名与费用',exact=True).click()
 assert page.locator('#eventTitle').inner_text()=='领养变色龙' and page.locator('#petAdoptionName').is_visible()
 assert page.evaluate('state.cash')==10000 and page.evaluate('state.pets.length')==0
 page.get_by_role('button',name='返回品种选择',exact=True).click()
 assert page.locator('.pet-selection-painted').count()==1
 for width,height in [(320,568),(390,844),(1280,900)]:
  page.set_viewport_size({'width':width,'height':height});assert page.locator('.event-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  box=page.locator('.event-active').bounding_box()
  assert abs(box['y']+box['height']/2-height/2)<1
  assert abs(box['x']+box['width']/2-width/2)<1
  assert box['y']>=19 and box['y']+box['height']<=height-19
  assert page.locator('.pet-adoption-sheet img').evaluate('(i)=>Math.abs(i.clientWidth/i.clientHeight-i.naturalWidth/i.naturalHeight)<.01')
 page.set_viewport_size({'width':390,'height':844})
 page.get_by_role('button',name='返回我的宠物',exact=True).click();assert page.locator('#eventTitle').inner_text()=='我的宠物'
 page.evaluate('clearModals();townHome()');page.locator('#roomView [data-room="pets"]').click()
 page.get_by_role('button',name='确认本月宠物安排，返回房屋',exact=True).click();assert page.locator('[data-room="pets"] .room-check').inner_text()=='✓'
 assert page.evaluate('state.pets.length')==0 and page.evaluate('state.cash')==10000
 assert not errors,errors
 result={'passed':True,'checks':['房屋宠物按钮直达七宠图，卡片上下左右居中，现金真实覆盖','七种画像按钮分别选中，唯一勾选，不收费/耗时/领养','下一步打开所选变色龙原取名费用表单，返回仍回原图','320矮屏/390px/桌面居中且保留边距，图片无拉伸，返回及确认正常，无页面异常'],'pageErrors':errors,'limitations':['隔离Chromium，非真机','未重新验证全部最终领养交易']}
 Path('qa/browser-evidence/pet-selection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));ctx.close();b.close()
