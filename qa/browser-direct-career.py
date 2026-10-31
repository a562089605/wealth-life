"""Direct career start uses the existing initialization and never replaces an occupied slot."""
import json
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Quiet);Thread(target=server.serve_forever,daemon=True).start()
out=Path('qa/browser-evidence/direct-career');out.mkdir(exist_ok=True)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
  assert page.evaluate('state===null')
  original=page.evaluate('JSON.stringify(localStorage)')
  for w,h in [(320,568),(390,844),(1280,900)]:
   page.set_viewport_size({'width':w,'height':h})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert page.get_by_role('button',name='选择该职业进入游戏',exact=True).is_visible()
   assert page.get_by_role('button',name='查看职业预览',exact=True).is_visible()
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(out/'opening-first-page.png'),full_page=True)
  page.get_by_role('button',name='查看职业预览',exact=True).click()
  assert page.evaluate('state===null');assert page.evaluate('JSON.stringify(localStorage)')==original
  page.get_by_role('button',name='看看其他职业',exact=True).click()
  page.get_by_role('button',name='选择该职业进入游戏',exact=True).click()
  assert page.evaluate('state.cash===10000&&state.month===0&&state.townMode&&slot===1')
  assert page.locator('#roomView').is_visible()
  assert page.evaluate('load(1).cash===10000')
  # Repeating the saved direct-start callback while playing must not create another life.
  snapshot=page.evaluate('JSON.stringify(localStorage)')
  page.evaluate('document.getElementById("careerChoose").onclick()')
  assert page.evaluate('JSON.stringify(localStorage)')==snapshot
  page.evaluate('clearModals();home()');saved=page.evaluate('localStorage.getItem(key(1))')
  page.get_by_role('button',name='选择该职业进入游戏',exact=True).click()
  assert page.evaluate('slot===2&&state.cash===10000')
  assert page.evaluate('localStorage.getItem(key(1))')==saved
  page.evaluate('clearModals();home()');page.get_by_role('button',name='查看职业预览',exact=True).click();page.get_by_role('button',name='选择这个人生',exact=True).click()
  assert page.evaluate('slot===3&&state.cash===10000&&state.month===0')
  assert page.evaluate('localStorage.getItem(key(1))')==saved
  assert not errors,errors
  (out/'results.json').write_text(json.dumps({'passed':True,'checks':['selection direct-start','preview and return do not create saves','direct start original 10000 month0 home','repeat callback ignored','occupied slots preserved','preview start retained','320/390/1280 no horizontal overflow'],'pageErrors':errors,'realDevice':False},ensure_ascii=False,indent=2))
  browser.close();print('PASS: direct entry, existing preview start, 10000/month0/home, no duplicate start, occupied saves preserved, three widths')
finally:server.shutdown();server.server_close()
