# 其余八项可选活动确认页嵌画（2026-10-26，美东）

用户确认运动/户外嵌画后要求：“其他可选生活活动的页面也按照这个方式嵌入插画，根据活动内容调整插画，保持原来的规则和数值。”基于b22e9ad增量完成剩余八项确认预览；运动原图及已确认构图保留。

## 插画与接入

新增八张1024×1536主题图：activity-home-rest-embedded、activity-friends-meal-embedded、activity-hobby-embedded、activity-weekend-trip-embedded、activity-concert-embedded、activity-phone-embedded、activity-fine-dining-embedded、activity-simple-life-embedded。全部由内置image_gen生成，明确使用已确认outdoor-preview-embedded作为布局参考、原life-activities图集对应格作为主题/人物参考；圆脸棕发丸子头、黑衣米裤、暖黄墨绿颗粒绘本笔触。对应沙发喝茶、聚餐、水彩画、背包旅行、户外演出、手机包装、餐厅晚餐和厨房做饭。每张图的空白纸板和木牌承载原DOM文字/按钮，不写死费用或效果；聚餐装饰同伴不生成或绑定新NPC。

八份原PNG按原字节归档assets/archive/generated-originals/activity-*-embedded.png；精确提示词在progress/image-prompts/activity-*-embedded.txt。原九格图、原户外图、旧页面截图和全部候选/旧稿/归档不改。

原outdoor-preview-art.js推广为按活动索引选择图片，仍移动原panel动态数据行、原费用/效果/余额说明和原确认button。life-pages-art.js仅将i===0调用扩大至九项，不改preview签名检查、chooseLife、V26_LIFE、回执或随机后续。DOM引用、onclick、disabled、owner/月/报价/康复/现金检查、原月限继续有效。九项菜单和结果页仍走既有实现，不新增耗时，也未采用旧活动1/2/4/8h草案。新增八项尚未逐张获视觉确认。

## 原数值回归

独立测试fixture把现有flow.js原九项数值作为固定基线比对：运动25、宅家45、朋友85、兴趣120、旅行380、演出210、手机950、餐厅150、简单生活0；各原属性效果完整对照。不是本轮新增规则确认。

qa/optional-embedded-fixture.html在本地IAB载入完整原游戏，明确新建独立档，再通过原列表button进入每个确认页、真实画中确认button执行。九项均验证预览无状态变化、原成本/限幅效果、月份和自由时间不变、当月选择、旧确认回调不重复执行、重开不重复收付；另验证10现金手机禁用、0现金简单生活可确认、旧存档owner防护、现金变化先更新报价再确认、低健康康复限制，及强制Math.random=0的原“朋友介绍小订单”后续仍优先显示、现金9915，不被结果页覆盖。结果qa/browser-evidence/optional-embedded.json全部passed。该fixture显式重置基线/随机数，非自然长线验收或用户实际存档。

逐项实际截图：progress/evidence/activity-{home-rest,friends-meal,hobby,weekend-trip,concert,phone,fine-dining,simple-life}-embedded-2026-10-26.png。320宽度演出页检查长标题/纸内滚动/独立确认木牌，390宽度手机页检查950/9050金额；证据progress/evidence/optional-embedded-320-2026-10-26.png和optional-embedded-390-2026-10-26.png。为iframe CSS视口，非真机或完整设备仿真；本轮没有真实SW断网、长期旧档和多年自然随机浏览器重跑。

45项Node测试通过，93生产资源唯一哈希/精确预缓存URL及36原PNG字节、SHA256和尺寸校验通过；JS语法/diff检查通过。旧Python浏览器脚本的确认回调查询范围同步改为当前event（因原按钮已移出actions），缓存期望同步更新；本轮未执行该Python脚本，不混用其旧测试结果。

93生产资源含保留旧图，不代表93张完整规则卡；原459候选不变。生成原PNG36份全部归档且不进入部署/运行缓存；缓存wealth-life-v28.3-optional-embedded1，新八图和精确模块查询URL已登记。本地保存，未上传/合并/部署。后续继续逐页视觉核对，不能把本轮制作完成当全部游戏完成。
