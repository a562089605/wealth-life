"""Isolated Chromium smoke test. Creates test-only browser storage, never opens user profiles."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(__file__).parent / 'browser-evidence'
out.mkdir(exist_ok=True)
checks, errors = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1280, 'height': 900}, service_workers='block')
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:8765', wait_until='networkidle')
    page.get_by_role('button', name='存档 1 · 新游戏', exact=True).click()
    page.locator('#job').select_option('barista')
    assert page.locator('#newGame .candidate-barista-portrait').is_visible()
    assert page.evaluate('state===null')
    page.locator('#start').click()
    page.evaluate('clearModals();townStart()')
    assert page.evaluate('state.cash') == 10000
    page.locator('[data-room="work"]').click()
    assert page.locator('#eventData .candidate-barista-portrait').is_visible()
    checks.append('新建咖啡师预览不建档；开始10000；房屋工作入口显示确认人物')
    page.evaluate('openBankLoan(2000)')
    assert page.locator('#eventData img[src$="bank-application.webp"]').count() == 1
    assert page.locator('#wlLoanYears option').evaluate_all('(xs)=>xs.map(x=>x.value)') == ['1','3','5','10','20','30']
    assert page.evaluate('state.cash') == 10000
    page.locator('#actions button').filter(has_text='取消').click()
    assert page.evaluate('state.loans.length') == 0
    page.evaluate('openBankLoan(2000)')
    page.locator('#wlLoanYears').select_option('10')
    page.evaluate('() => {window.testOldConfirm=document.querySelector("#actions button").onclick}')
    page.get_by_role('button', name='确认贷款', exact=True).click()
    page.evaluate('window.testOldConfirm({preventDefault(){},stopPropagation(){}})')
    assert page.evaluate('state.cash') == 12000
    assert page.evaluate('state.loans.length') == 1
    assert page.evaluate('loanBudgetTotal()') == 0
    assert page.evaluate('state.loans[0].firstPaymentMonth') == 1
    checks.append('银行六期限、预览/取消不借款、十年放款2000、旧按钮重复确认不再放款、首月无月供')
    page.reload(wait_until='networkidle')
    page.get_by_role('button', name='存档 1', exact=False).first.click()
    page.evaluate('clearModals();openLoanPayments()')
    assert page.evaluate('state.cash') == 12000
    assert page.evaluate('state.loans[0].monthsLeft') == 120
    assert page.locator('#eventData img[src$="bank-payment.webp"]').count() == 1
    # Advance only the isolated fixture clock to exercise the actual payment UI.
    page.evaluate('state.month=1;state.turn.month=1;openLoanPayments()')
    due = page.evaluate('currentLoanCycle().items[0].due')
    page.locator('[data-batch="payLoan"]').click()
    assert round(page.evaluate('state.cash'), 2) == round(12000-due, 2)
    assert page.locator('[data-batch="payLoan"]').is_disabled()
    assert page.evaluate('state.loans[0].monthsLeft') == 119
    checks.append('刷新读档保留合同；次月原还款按钮只扣一次；本金/期限更新')
    page.evaluate('openPetHub()')
    page.get_by_role('button', name='领养新伙伴', exact=True).click()
    page.get_by_role('button', name='查看鳄鱼', exact=True).click()
    adoption_cash = page.evaluate('state.cash')
    page.locator('#petAdoptionName').fill('测试小绿')
    page.locator('#petAdoptionInsurance').check()
    assert page.evaluate('state.cash') == adoption_cash
    page.get_by_role('button', name='确认领养', exact=True).click()
    assert round(page.evaluate('state.cash'),2) == round(adoption_cash-2380,2)
    assert page.evaluate('state.pets[0].care.nextAnnual') == 13
    assert page.evaluate('state.insurance[state.pets[0].insuranceKey].coverage') == .8
    checks.append('原房屋宠物入口→七物种→命名鳄鱼→可选独立保险；预览不扣、确认2380、首次护理包含、日期独立')
    page.get_by_role('button',name='查看我的宠物',exact=True).click()
    page.get_by_role('button',name='测试小绿 · 保险',exact=True).click()
    policy_cash=page.evaluate('state.cash')
    page.get_by_role('button',name='预约下月取消',exact=True).click()
    assert page.evaluate('state.pets[0].policyChange.effectiveMonth')==2
    assert page.evaluate('state.insurance[state.pets[0].insuranceKey].active')
    page.get_by_role('button',name='测试小绿 · 保险',exact=True).click()
    page.get_by_role('button',name='撤销取消，保留原保单',exact=True).click()
    assert page.evaluate('state.pets[0].policyChange===undefined')
    assert page.evaluate('state.cash')==policy_cash
    checks.append('逐只保单预约次月停、当月保留；出门前撤销取消不重收保费')
    page.evaluate("state.month=3;state.petCareDraft=null;openPetCare()")
    assert page.locator('#eventData img[src$="pet-crocodile-care.webp"]').count() == 1
    page.get_by_role('button', name='测试小绿 · 在家清洁', exact=True).click()
    before = page.evaluate('({cash:state.cash,free:currentCareerTime().free,month:state.month})')
    page.get_by_role('button', name='确认支付已选护理', exact=True).click()
    assert round(page.evaluate('state.cash'),2) == round(before['cash']-30,2)
    assert page.evaluate('currentCareerTime().free') == before['free']-4
    assert page.get_by_role('button', name='确认支付已选护理', exact=True).is_disabled()
    checks.append('鳄鱼真实物种路由；选择护理不付款，确认原动作扣30及4h，到期回执防重')
    page.evaluate("state.pets[0].care.nextClean=state.month;state.cash=0;state.petCareDraft={month:state.month,selections:{}};openPetCare()")
    page.get_by_role('button', name='测试小绿 · 在家清洁', exact=True).click()
    assert page.locator('#eventData img[src$="pet-funds-shortage.webp"]').count() == 1
    assert page.get_by_role('button', name='确认支付已选护理', exact=True).is_disabled()
    page.evaluate("state.cash=1000;state.petCareTime={month:state.month,hours:99};openPetCare()")
    assert page.locator('#eventData img[src$="pet-time-shortage.webp"]').count() == 1
    assert page.get_by_role('button', name='确认支付已选护理', exact=True).is_disabled()
    checks.append('护理缺钱/缺时按真实报价选图，确认禁用，不自动借款')
    page.screenshot(path=str(out/'pet-shortage-desktop.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    page.evaluate('openBankLoan(2000)')
    page.screenshot(path=str(out/'bank-mobile.png'), full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
    assert page.locator('#wlLoanAmount').is_visible()
    assert page.locator('#eventData img').evaluate_all('(xs)=>xs.every(x=>x.complete&&x.naturalWidth>0)')
    page.evaluate('clearModals();townHome()')
    page.screenshot(path=str(out/'home-mobile.png'), full_page=True)
    assert page.locator('[data-room="leave"]').is_visible()
    checks.append('390px Chromium视口银行/房屋无横向溢出，图片解码及入口可见；非真机')
    page.evaluate('state.petCareTime={month:state.month,hours:0};state.cash=1000;previewCoffeeCourse("coffee")')
    assert page.locator('#eventData img[src$="coffee-course.webp"]').count()==1
    assert '20 XP' in page.locator('#eventData').inner_text()
    course_before=page.evaluate('({cash:state.cash,free:currentCareerTime().free,xp:state.coffee.skills.coffee.xp})')
    page.get_by_role('button',name='确认学习',exact=True).click()
    assert page.evaluate('state.cash')==course_before['cash']-80
    assert page.evaluate('currentCareerTime().free')==course_before['free']-8
    assert page.evaluate('state.coffee.skills.coffee.xp')==course_before['xp']+20
    checks.append('咖啡基础课新图预览；确认沿用80/8h/20XP，图片旧25XP不可见')
    page.evaluate('state.coffee.skills.coffee.xp=200;state.coffee.skills.service.xp=200;state.coffee.progression.baristaMonths=6;state.coffee.managerTrust=4;previewCoffeePromotion()')
    assert page.locator('#eventData img[src$="shift-promotion-preview.webp"]').count()==1
    job=page.evaluate('state.job');salary=page.evaluate('state.salary');cash=page.evaluate('state.cash')
    page.get_by_role('button',name='确认晋升，下个月生效',exact=True).click()
    assert page.locator('#eventData img[src$="shift-promotion-pending.webp"]').count()==1
    assert page.evaluate('state.job')==job and page.evaluate('state.salary')==salary and page.evaluate('state.cash')==cash
    assert page.get_by_role('button',name='确认晋升，下个月生效',exact=True).is_disabled()
    checks.append('隔离资格测试状态：晋升预览/接受图切换，职位和工资本月不变，重复确认禁用')
    for name in ['测试柯基甲','测试柯基乙']:
        page.evaluate('openPetAdoptions()')
        page.get_by_role('button',name='查看柯基',exact=True).click()
        page.locator('#petAdoptionName').fill(name)
        page.get_by_role('button',name='确认领养',exact=True).click()
    assert page.evaluate('state.pets.filter(p=>p.species==="dog").length')==2
    assert page.evaluate('new Set(state.pets.map(p=>p.careId)).size')==3
    checks.append('同种两只柯基分别领养、命名与独立ID，不受旧同种限一只限制')
    assert not errors, errors
    context.close()
    browser.close()
(out/'results.json').write_text(json.dumps({'passed':True,'checks':checks,'pageErrors':errors,'limits':['银行次月/照护使用隔离测试状态，不是完整自然月连续试玩','未做真实手机或完整经营线']},ensure_ascii=False,indent=2))
print(json.dumps({'passed':True,'checks':checks},ensure_ascii=False,indent=2))
