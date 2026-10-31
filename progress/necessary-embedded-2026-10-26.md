# 必要安排嵌画（2026-10-26，美东）

用户看过本月必要安排页面，要求“这个页面也做成嵌入插画的样子”。在a392baf上增量接入，不改费用/账本/资格/时间/存档。

新增assets/career/necessary-arrangements-embedded.webp（1024×1536），内置image_gen参考现有保费核对绘本图，主题改为房屋钥匙、食材和保障文件。原PNG保存在assets/archive/generated-originals/necessary-arrangements-embedded.png，完整提示在progress/image-prompts/necessary-arrangements-embedded.txt。旧插画、截图和全部归档保留。

新增necessary-arrangements-art.js/css，在既有life-pages-art包装之后仅装饰实际必要事项页：移动原动态金额行、未知报价说明、原账单按钮、原提示到画中可滚动账单纸；原补救/银行按钮嵌入两张纸牌；原月度确认节点放黄色木牌；返回房屋保留。所有onclick与禁用状态继续使用原节点，不新建付款或确认交易。初始800只代表已知金额，住房尚未报价仍明确提示待确认。

实际发现room-arrangements的queueMicrotask只查看actions，会在原月度确认按钮被移入插画后再补一份。把存在性检查范围改为整个当前event，原owner/月/房屋/必要账单门禁不动；确认仅保留画中一份。

本地IAB独立新档：查看现金10000/第1月/100h；未付款按画中确认仍回必要事项页，确认只有一份；银行打开后取消回原页，未借款未扣款；从账单住房入口选择家人并确认450，现金9550、待办移除；再由生活费待办确认800，现金8750；重开待付0/空名单，画中确认后生活本月已确认，现金8750/月份时间不变。截图evidence/necessary-embedded-2026-10-26.png、necessary-embedded-done-2026-10-26.png，均独立测试档，非用户存档。

45项Node测试通过；资源哈希/精确缓存URL及27原PNG校验通过，JS语法及diff检查通过。本轮未做320/390、真机、离线或全旧档重跑，不引用旧证据冒充新布局验收。84生产资源含旧图，不等于84张完整规则卡；459候选不变；缓存wealth-life-v28.3-necessary-embedded1。新视觉待用户核对。本地保存，未上传/合并/部署。

## 用户视觉确认

用户看过嵌画实际页面后明确回复“确认”。当前必要安排构图已获确认；原数值与操作规则不变。本条只更新确认记录，不改运行代码；仍为本地保存，未上传/合并/部署。
