仓库归档更新：交接包中的459个候选文件现已原样归档到 assets/candidates/，包含12个0字节文件（其清单声明大小与实际字节不符，缺陷已记录）。45张生产插画保持不变。候选归档不等于已接入游戏；候选目录仍不加入运行缓存和正式部署。私有参考文档不公开发布。

财富人生 Codex 合并交接包

直接解压本ZIP，再用Codex打开其中的wealth-life文件夹。

包含：当前代码快照、已接入18张图片、459个候选插画的WebP版本、图片清单、规则和进度、测试。候选图位于assets/candidates/，读取CANDIDATE_ART_MANIFEST.json按原名称/Library ID对应。

压缩说明：候选图转换为WebP quality90，是有损压缩，保留原尺寸和画面，不裁切。它们不是原始PNG字节；原始459个文件仍保留在之前的三个原图ZIP中。本包用于开发接入，若需要最高保真原稿可再用原图包替换。

先读CODEX_HANDOFF.md，再读progress/、docs/reference/和CANDIDATE_ART_MANIFEST.json。本包已解决候选图片原文件不可读的问题，旧交接说明中关于图片仅有索引的描述对本合并包不再适用。当前依旧只有18张新增接入，459个候选不代表全部规则/图片已落地；线上尚未更新。

继续分支 fix/illustrated-home-scene，仓库 https://github.com/a562089605/wealth-life 。不重做、不重置存档，按已确认规则对应接图；旧数字不覆盖规则；不要随机使用旧稿；连续推进统一交付。
