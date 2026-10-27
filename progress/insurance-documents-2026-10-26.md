# 其他保险页面嵌画统一（2026-10-26，美东）

用户明确确认医疗页，并要求“其他保险页面也按照这个插画方式，嵌入插画，根据保险内容轻微修改插画”。在6c04520上增量完成现有收入保障、汽车保险、宠物保险名单与逐宠详情、共享保费核对，以及旧人寿/未知/合并宠物合同的文档外观。不新增租客险/新的人寿赔付或其他未确认条款。

四张1024×1536主题WebP：insurance-income-document（工作挎包/信封/盾牌）、insurance-auto-document（小绿车/钥匙）、insurance-pets-document（保单/提篮/食盆/生态瓶，不固定玩家物种）、insurance-premiums-document（文件/信封/硬币）。内置image_gen以用户已确认医疗图为参考；完整提示在progress/image-prompts/insurance-*-document.txt，四份原PNG原字节留assets/archive/generated-originals。旧图/截图/候选/归档全部保留。

新insurance-details-art.js/css把原section、宠物画像、名单按钮、真实状态/金额/条款和原主要button移动到画中纸张与黄色木牌。全部onclick、disabled和实际节点保留，不重写交易。较长条款/多宠名单可在纸内滚动，底部确认独立可点击；返回、筹款和原月度确认仍保留，其他页面清理专用类。逐宠仍展示真实物种画像和原名字，不用新背景代替实际宠物。保费核对四行全部可见。无投保资格时木牌只作阅读提示，不添加新投保动作。旧人寿及未知合同沿收入文档主题，旧合并宠物合同沿宠物主题。

本地IAB独立新档从真实入口验证收入65投保，现金10000→9935、有效保障、下月停保/撤销；无车仍不可投保、无宠物无新增合同。另有明确QA fixture（qa/insurance-documents-fixture.html，qa目录不部署/不缓存）：次月收入保费待付65，画中核对确认后现金10000→9935/已付65/待付0/禁用；有车165投保现金10000→9835；逐宠30投保现金10000→9970；12只fixture名单在320宽度能滚动并点开第12只；390宽度旧人寿35原价保留、0现金投保禁用且银行建议缺额295（含其他有效合同），进入银行无专用样式串页。fixtures不是自然游玩/用户存档。320/390为iframe CSS视口，非真机或完整设备仿真；本轮无真实SW断网重跑。

45项Node测试通过，资源哈希/精确预缓存/26原PNG校验通过，JS语法/diff检查通过。83生产资源含保留旧图，不等于83张完整规则卡；459候选原样。缓存wealth-life-v28.3-insurance-documents1。实际截图见evidence/insurance-income-document-2026-10-26.png、insurance-auto-document-2026-10-26.png、insurance-pet-policy-document-2026-10-26.png、insurance-premiums-document-2026-10-26.png。单宠及保费截图为明确fixture。

医疗嵌画已获用户明确确认，其他新绘页面尚未逐张获确认。本次本地保存，未上传/合并/部署，未改规则数值或用户实际存档。
