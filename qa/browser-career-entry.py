"""Verify career selection → preview → explicit start and preserve existing saves."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

checks=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(service_workers='block',viewport={'width':390,'height':844});page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8765',wait_until='networkidle')
 assert page.get_by_role('heading',name='选择职业',exact=True).is_visible()
 assert page.locator('#careerSelection img').is_visible()
 assert not page.locator('#newGame').is_visible()
 assert not page.locator('#slots').is_visible()
 assert page.evaluate('state===null')
 original=page.evaluate('JSON.stringify(localStorage)')
 page.get_by_role('button',name='查看职业预览',exact=True).click()
 assert page.locator('#coffeeIntro').is_visible()
 assert page.locator('#coffeeIntro .coffee-intro-text').is_visible()
 assert page.evaluate('JSON.stringify(localStorage)')==original
 assert page.evaluate('state===null')
 page.get_by_role('button',name='← 返回职业选择',exact=True).click()
 assert page.locator('#careerSelection').is_visible()
 assert page.evaluate('JSON.stringify(localStorage)')==original
 checks.append('首次打开显示咖啡师职业选择；点击才显示预览；预览和返回均不创建存档')
 page.get_by_role('button',name='查看职业预览',exact=True).click()
 page.locator('#start').click()
 assert page.evaluate('state.cash')==10000
 assert page.evaluate('state.month')==0
 assert page.evaluate('slot')==1
 old_save=page.evaluate('localStorage.getItem(key(1))')
 assert old_save
 checks.append('确认开始调用原初始化：首月咖啡师、10000、不提前发工资')
 page.reload(wait_until='networkidle')
 assert page.locator('#careerSelection').is_visible()
 page.get_by_role('button',name='读取已有存档',exact=True).click()
 assert page.locator('#slots').is_visible()
 page.locator('#slots .saveRow').first.locator('button').first.click()
 assert page.evaluate('state.cash')==10000
 assert page.evaluate('slot')==1
 page.evaluate('clearModals();home()')
 old_save=page.evaluate('localStorage.getItem(key(1))')
 page.get_by_role('button',name='查看职业预览',exact=True).click()
 page.locator('#start').click()
 assert page.evaluate('slot')==2
 assert page.evaluate('localStorage.getItem(key(1))')==old_save
 assert page.evaluate('!!localStorage.getItem(key(2))')
 checks.append('刷新仍先显示选择职业；读档入口可用；再开人生使用空存档位，不覆盖原档')
 page.evaluate('clearModals();home()')
 page.screenshot(path='/tmp/wealth-life-career-selection.png',full_page=True)
 page.get_by_role('button',name='查看职业预览',exact=True).click()
 page.screenshot(path='/tmp/wealth-life-career-preview.png',full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.set_viewport_size({'width':1280,'height':900})
 assert page.locator('#coffeeIntro .coffee-intro-text').is_visible()
 checks.append('390px无横向溢出；桌面和窄屏预览资料可见；非真机验收')
 assert not errors,errors
 ctx.close();b.close()
Path('qa/career-entry-evidence.json').write_text(json.dumps({'passed':True,'checks':checks,'pageErrors':errors},ensure_ascii=False,indent=2))
print(json.dumps({'passed':True,'checks':checks},ensure_ascii=False,indent=2))
