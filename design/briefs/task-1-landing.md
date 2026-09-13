# portfolio_web · 落地页：把 design/mock/index.html 的首屏移植成 Next.js

> **路线指令（发起人 Pulin 2026-09-13 明确要求）：本单不需要 spec。** 需求已经以可运行的 HTML mock 定稿（`design/mock/index.html`，发起人已逐屏验收），本 brief 即契约。请 router 直接派 maker，只走 review → precommit → merge 闸；不要产出 spec 交人审。

## 背景
- 目标仓 `/Users/uranus_pu/ai-experiment/portfolio_web`：create-next-app 16.3 脚手架（App Router、TypeScript strict、ESLint、`src/` 目录、无 Tailwind、npm、Turbopack）。`src/app/page.tsx`、`src/app/globals.css`、`src/app/page.module.css` 是脚手架默认页，`src/app/layout.tsx` 用 Geist 字体——本单全部替换。
- 视觉与交互契约：`design/mock/index.html`，单文件（CSS + HTML + JS），已在浏览器逐屏验收。本单只移植它的**首屏**：header、hero（左文案 + 右侧「How I Build」窗口卡）、Selected work 项目条、footer。mock 里的 `#work` 弹窗与 `#ask` 抽屉不在本单。
- 内容已抽成数据模块，文案逐字来源：`src/content/copy.ts`（SITE / HERO / HOW_I_BUILD）、`src/content/links.ts`（EMAIL / MAILTO / GITHUB / LINKEDIN / X / SOCIALS）、`src/content/projects.ts`（PROJECTS 五个项目、LOOKING）。UI 只能从这三处取文案与链接，不得在组件里硬编码另一份。
- 测试基线：`npm test` = `node --test tests/*.test.mjs`（内容红线，已绿）；`npm run lint`、`npm run build` 已绿。
- 来源：2026-09-13 Pulin 与 Claude 的三轮讨论 + mock v0.2（Artifact c5fc1e6c）。后续两单：`design/briefs/task-2-work.md`（/work 总览与详情）、`task-3-ask.md`（Any question 抽屉），本单不要提前做。

## 问题 / 目标（闭环必需的几件事）
1. **替换脚手架页**：`/` 渲染 mock 首屏；`layout.tsx` 改用 mock 的三套字体（Nunito 800/900 显示、IBM Plex Sans 400/500/600 正文、JetBrains Mono 400/500 等宽，走 `next/font/google`，各自声明回退栈）；`<title>` = `SITE.title`；`globals.css` 承载 mock 的 `:root` 令牌、`[hidden]{display:none!important}` 与全局样式（深色单主题，`body` 背景显式绘制，含 mock 的网格 + 两处径向光晕）。
2. **Header**：左 wordmark「Pulin.」（点号为 cyan）；右 `SOCIALS` 三个图标链接（内联 SVG，`target="_blank" rel="noopener"`，有 `aria-label` 与 `title`）+「Any question?」按钮。本单该按钮**只渲染不接功能**：`aria-disabled="true"`、`title="Coming in a later task"`，点击无副作用。X 链接按 `links.ts` 原值使用，不要改成猜的 handle。
3. **Hero 左**：徽章（绿点 + `HERO.badge`）、H1（`HERO.headline`，其中 `HERO.headlineAccent` 那段用蓝→青渐变）、`HERO.lede`、主按钮「View My Work →」（`<Link href="/work">`）、「Hire Me」（`<a href={MAILTO}>`）、「copy email」（写剪贴板并 toast「Copied Pulin7490@gmail.com」；剪贴板不可用时 toast 显示邮箱本身）。
4. **`/work` 最小占位页**：本单只需存在，标题 `SITE.workTitle` + 五个项目名列表（来自 PROJECTS，每项 `<Link href={`/work/${id}`}>`）+ 返回 `/` 的链接；`/work/[id]` 复用同一占位组件并显示该项目名（`projectById` 找不到就 `notFound()`）。视觉不评审，下一单重做。
5. **Hero 右「How I Build」窗口卡**：内容与 mock 逐字一致（标题栏三点 / `HOW_I_BUILD.flow` / 脉冲绿点 `Live`；五步来自 `HOW_I_BUILD.steps`，`activeStep` 高亮；终端 `prompt` + 五行 `lines` + `shipping` 转圈；Ship 面板 `title` / `text` / 三格 `stats`）。图标沿用 mock 的 symbol 路径做内联 SVG。
6. **倾斜交互**（client component）：指针在卡片容器上移动时按 mock 公式设置内联 `style.transform = rotateY(px*16deg) rotateX(-py*12deg)` 并把 `--gx/--gy` 反光位置写到卡片；离开复位为空；点击卡片空白处（非按钮/链接）切换 `pinned` 类（钉住姿态 `rotateY(-10deg) rotateX(6deg) scale(1.02)`）并把提示文案在 `HERO.tiltHint` / `HERO.tiltPinned` 间切换；`pointerType === 'touch'` 不做移动倾斜；`prefers-reduced-motion: reduce` 下不倾斜。
7. **终端清单动画**：挂载后五行依次由空圈变绿勾（首行约 600ms 起，之后每行 +420ms）；reduced-motion 直接全 `done`；`Shipping...` 行始终保留转圈（reduced-motion 下静止）。
8. **Selected work 条**：eyebrow `SITE.stripTitle` + `SITE.stripOpenAll`（`<Link href="/work">`）+ 五张 tile（`PROJECTS` 的 role / name / short），每张 tile 是 `<Link href={`/work/${id}`}>`。
9. **Footer**：`SITE.name`、`SITE.location`、邮箱（`MAILTO` + copy）、GitHub / LinkedIn / X 文本链接、说明行 `SITE.footNote`。
10. **响应式**：≥1024 两栏 hero；<1024 单栏、tile 横向滚动（scroll-snap）；<640 终端 / Ship 面板单列、步骤隐藏小字、header 按钮只留图标。

## 非目标
- `/work` 真正的总览与详情（task-2）、Any question 抽屉与脚本化回答（task-3）——不要提前实现。
- 不装 Tailwind / UI 库 / 状态库 / 图标库 / CSS-in-JS；不新增运行时依赖。
- 不改 `src/content/*.ts` 的任何文案与链接（发现问题只写进 log）；不删改既有测试。
- 不做浅色主题；不接真实 LLM；不部署、不 push。

## 约束
- Next 16 App Router + TypeScript strict；样式用 `globals.css` + CSS Modules（沿用 mock 的类名与令牌，便于对照）。
- 只有需要事件 / 状态的组件标 `'use client'`（倾斜卡、copy 按钮、toast）；渲染期不访问 `window`。
- `npm run lint` 零错误；`npm run build` 绿；`npm test` 绿。新增 UI 测试只用 `node --test`（可对 `next build` 后的 HTML 做字符串断言，或对纯函数抽测），不引入 vitest / jest / playwright。
- 可访问性：焦点可见（沿用 mock 的 `:focus-visible`）、按钮是 `<button>`、图标链接有 `aria-label`。

## 验收线索
- 给定 `npm run build && npm start`，当请求 `/`，则 HTML 含 `HERO.badge`、`HERO.headline` 全文、`How I Build`、五个步骤名、`Ship useful products.`、五个项目名，且这些字符串与 `src/content/*` 逐字相同。
- 给定首页 header，则 GitHub / LinkedIn / X 三个 `<a>` 的 `href` 与 `links.ts` 完全一致并带 `target="_blank" rel="noopener"`；「Any question?」按钮存在且 `aria-disabled="true"`。
- 给定首页，当查看「Hire Me」，则 `href` 等于 `MAILTO`（含预填 subject）；点击「copy email」后出现 toast「Copied Pulin7490@gmail.com」。
- 给定 ≥1024 视口且非 reduced-motion，当指针在卡片容器右上角移动，则卡片 `style.transform` 含 `rotateY(` 与 `rotateX(`，指针离开后为空；点击卡片空白处一次，则卡片带 `pinned` 类、提示文案为 `pinned · click to release`；再点一次复原。
- 给定 `prefers-reduced-motion: reduce`，当加载首页，则终端五行立即全部 `done`，且指针移动不改变 `style.transform`。
- 给定默认动效，当加载首页 3 秒后，则终端五行均 `done`，`Shipping...` 行仍在。
- 给定首页，当点击任一 Selected work tile，则导航到 `/work/<id>`（`<a href>` 精确匹配 PROJECTS 的 id）；「View My Work」与「open all →」导航到 `/work`，该页列出五个项目名；`/work/nope` 返回 404。
- 给定 375px 视口，当加载首页，则 `document.documentElement.scrollWidth <= window.innerWidth`，且 tile 容器可横向滚动。
- 保护性：`npm test` 既有三条内容红线原样全绿；`git diff --stat -- src/content tests/content.test.mjs` 为空。
- 保护性：`npm run lint`、`npm run build` 退出码 0；`package.json` 的 `dependencies` 与基线相同。

## 开放问题
- Nunito / IBM Plex Sans / JetBrains Mono 是否都能通过 `next/font/google` 加载？safe default：能用就用；某一款不可用则用 mock 的回退栈并在 log 注明，不换成别的字体。
- 倾斜用 CSS 变量还是内联 `style`？safe default：内联 `style.transform`（与 mock 一致，验收线索可读）。
- 首页是否加 `metadata.description`？safe default：加一句 `HERO.lede` 的前半句即可，不新增文案。
