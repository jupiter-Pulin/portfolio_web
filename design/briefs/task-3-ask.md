# portfolio_web · Any question? 导览抽屉（DRAFT，task-2 合并后再开单）

> 路线指令：不需要 spec，brief 即契约，直接派 maker，只过 review → precommit → merge 闸。

## 背景
- mock `design/mock/index.html` 的 `#ask` 抽屉：全局入口（header 按钮）与项目级入口（详情页 README 面板按钮，限定 scope）。脚本化、不接模型：chips（全局五个 / 项目级四个 + 返回）、`answers` 表生成「报告」卡片（`report()`）、自由输入 `route()` 关键词路由、动作按钮（打开 `/work/<id>`、mailto、copy email）。
- 所有回答文案与链接来自 `src/content/*`（本单可新增 `src/content/guide.ts` 承载 answers / chips 文案，逐字从 mock 移植）。

## 问题 / 目标
1. 抽屉组件（client）：右侧滑入 450px、scrim、Esc / 关闭按钮 / scrim 点击关闭；打开时焦点进输入框，关闭后焦点回触发按钮；`prefers-reduced-motion` 无动画。
2. 首次打开问候语 + 「mock · scripted」pill；scope 切换时追加「Scoped to <name>」。
3. chips 与 answers 逐字移植；报告卡片含 Open <project> ↗（`router.push('/work/<id>')` 并关闭抽屉）、Email Pulin（MAILTO）、Copy email（toast）。
4. 自由输入：`route()` 同 mock（项目名 → overview 并切 scope；payments / agents / code / contact / looking / decision / stack / status；否则 fallback 文案）。
5. 两个入口接线：header 按钮（task-1 的 aria-disabled 去掉）、详情页 README 面板按钮（带 scope）。

## 非目标
真实 LLM、后端、持久化、发送任何消息；改既有页面布局。

## 约束 / 验收线索 / 开放问题
（开单前补齐；AC 目标 ≤ 10。）
