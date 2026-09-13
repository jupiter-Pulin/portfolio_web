# portfolio_web · /work：总览网格 + 项目详情（DRAFT，task-1 合并后再开单）

> 路线指令：不需要 spec，brief 即契约，直接派 maker，只过 review → precommit → merge 闸。

## 背景
- task-1 已交付首屏与 `/work`、`/work/[id]` 占位页。本单把占位页换成 mock（`design/mock/index.html`）里 `#work` 弹窗的两级视图：`galleryHTML()` 对应 `/work`，`caseHTML()` 对应 `/work/[id]`。
- 数据来自 `src/content/projects.ts`（含 `readme` 预览文本、`readmeUrl`、`repos`、`stats`、`statsNote`、`private`/`scope`、`hue`）。五张示意图沿用 mock 的 `art` SVG（作为占位，figcaption 写 `SITE.imageSlot`）。

## 问题 / 目标
1. `/work` 总览：全屏深色层（视觉同 mock overlay：`.ov-head` 标题 + `SITE.workSubtitle` + 右上关闭 → `/`），网格：第一个项目占整行 `featured`（左图右文 + tagline），其余四个两列（左图右文）；每卡整卡可点进 `/work/<id>`，卡内「Learn more →」按钮 + 公开仓「README ↗」外链（BIBO 显示「Private repository」静态 chip）。
2. `/work/[id]` 详情：左 figure（示意图 + figcaption），右 eyebrow / h3 / tagline / thesis / 「What goes wrong unattended · The mechanism I built」两格 / Stack / stats（有 statsNote 就显示）/ README 面板（README.md 标题、`readme` 预览 pre + 底部渐隐、`readmeNote` 黄条、「Open README on GitHub ↗」、底部各 repo 按钮；BIBO 显示 Private repository + scope）。面板头部保留「Any question about this project?」按钮但 `aria-disabled`（task-3 接）。
3. 导航：头部「← All work」回 `/work`；底部 Previous / Next 循环 + 计数 `n / 5`；键盘 ← → 翻页、Esc 回 `/`；子标题显示 `<name> · n of 5`。
4. 响应式：<900 单列（figure 不 sticky）；<1000 总览单列；<560 卡片图上文下。
5. `/work/nope` 404；`generateStaticParams` 预生成五个 id。

## 非目标
Any question 抽屉与脚本；intercepting/parallel routes 做真正的弹窗（safe default：全屏页面即可）；改内容模块；新增依赖。

## 约束 / 验收线索 / 开放问题
（开单前按 task-1 的口径补齐；AC 目标 ≤ 10。）
