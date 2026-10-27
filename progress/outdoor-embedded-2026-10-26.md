# 运动户外预览嵌画（2026-10-26，美东）

用户点开可选生活活动第一项“运动 / 户外”后，要求“把这里的页面也做成嵌入插画的”。在a012e46上只改这一项确认预览，不把授权扩大到九项菜单/其余八项或结果页。

新增assets/career/outdoor-preview-embedded.webp（1024×1536），内置image_gen明确参考life-activities图集左上原场景：同圆脸/丸子头/黑上衣/米裤女孩、湖边树荫伸展；前景大纸板放原费用/效果/确认后余额，木牌放原确认button。原PNG保存assets/archive/generated-originals/outdoor-preview-embedded.png，提示词progress/image-prompts/outdoor-preview-embedded.txt；原图集/截图及所有旧归档保留。

outdoor-preview-art.js/css仅由preview(i)在i===0时调用；移动原DOM金额行/说明、效果行和原确认节点，健康/能量/幸福/压力两列排版、其他信息整行。panel引用仍连接，原owner/月/状态快照/现金/康复检查/交易锁继续生效，不重写chooseLife或结果。底部返回重选和原月度生活确认保留，结果页沿原布局，子页清除专用类。

实际本地IAB新档：查看现金10000未变，确认画中按钮后现金9975，结果25及健康+4/能量-3/幸福+2/压力-6；返回菜单重开可选活动仍同一原回执，未重复扣款或再给效果。截图evidence/outdoor-embedded-2026-10-26.png为确认前独立测试档，非用户存档。

45项Node测试通过，资源哈希/精确SW URL和28原PNG校验通过；JS语法/diff检查通过。本轮未小屏/真机/离线/低现金/跨档浏览器重跑，不把旧测试冒充新构图验收。85生产资源含旧图，不等于85张完整规则卡；459候选不变；缓存wealth-life-v28.3-outdoor-embedded1。新视觉待用户核对，本地保存，未上传/合并/部署。
