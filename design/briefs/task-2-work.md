# portfolio_web · /work：项目总览网格 + 项目详情 + 可替换的内容槽位

> **路线指令（发起人 Pulin 明确要求）：本单不需要 spec。** 视觉与交互契约是 `design/mock/index.html` 里 `#work` 弹窗的两级视图（`galleryHTML()` = 总览、`caseHTML()` = 详情），发起人已逐屏验收；本 brief 即契约。请 router 直接派 maker，只走 review → precommit → merge 闸。

## 背景
- task-20260913-001 已合并：首屏（Header / Hero / HowIBuildCard / SelectedWorkStrip / Footer）、`src/lib/tilt.ts` 等、`/work` 与 `/work/[id]` 是**占位页**（`src/components/WorkPlaceholder.tsx`），发起人点进去看到一个纯列表并明确不接受——本单把它换成真正的两级视图。
- 数据唯一来源仍是 `src/content/projects.ts`（`PROJECTS` 数组：id / name / hue / short / role / stack / tagline / thesis / wrong / mechanism / stats / statsNote / private / scope / readmeUrl / readmeNote / repos / readme / qa）与 `src/content/copy.ts`（`SITE.workTitle` / `workSubtitle` / `imageSlot`）。数组顺序 = 展示顺序，第一条 = featured。
- mock 里五张示意图是内联 SVG（`const art = {...}`，`design/mock/index.html` 约第 590–690 行），本单移植成 `src/components/ProjectArt.tsx` 作为**没有真图时的占位**。
- 发起人的要求（2026-09-14 原话大意）：「这个前端是一个可持续更新的地方，未来我会不断 shipping，要留好替换符，让整个系统优雅替换，要有工程化的处理。」所以本单除了页面，还要把「加项目 / 换图」做成**改数据、放文件，不改组件**。
- 测试基线：`npm test` = `node --test tests/*.test.mjs`（content / landing / interaction / responsive 共 28 条，全绿）；`npm run lint`、`npm run build` 绿。既有测试读 `.next/server/app/*.html` 做字符串断言的写法可以沿用。

## 问题 / 目标
1. **图片槽位（工程化核心）**：约定 `public/projects/<id>/cover.webp | cover.png | cover.jpg`（按此优先级取第一个存在的）。新增 `src/lib/projectMedia.ts`：`resolveCover(id, { root })` 在构建期用 `fs` 检测文件，返回 `{ src: '/projects/<id>/cover.<ext>' }` 或 `null`；只在 Server Component 里调用。有图 → 用 `next/image`（`unoptimized`，4:3，`alt` = 项目名）渲染；无图 → 渲染 `ProjectArt` 占位 + figcaption `SITE.imageSlot`。换图 = 覆盖文件，加图 = 放文件，零代码改动。
2. **注册表扩展（只加不改）**：`Project` 类型新增可选字段 `status?: 'shipped' | 'building' | 'archived'`（缺省视为 shipped）与 `updated?: string`（ISO 日期）。总览卡片仅在 `status === 'building'` 时显示「building」徽章；详情 eyebrow 在有 `updated` 时追加。**现有五条记录的任何字符串值不得改动**。
3. **`/work` 总览**：全屏深色层观感同 mock overlay——顶部 `SITE.workTitle` + `SITE.workSubtitle` + 右上关闭（`<Link href="/">`）；网格：第一条 `featured` 占整行（左图 46% / 右文含 tagline），其余四条两列（左图 42% / 右文）。每张卡：eyebrow = role、名字、`short`、动作区「Learn more →」+ 公开仓「README ↗」外链（`readmeUrl`，`_blank` + `noopener`）或私有项目的「Private repository」静态 chip。整卡可点：用 stretched-link（「Learn more」的 `<Link>` 以 `::after` 铺满卡片，README 外链 `position:relative; z-index` 在其上），**不得嵌套 `<a>`**。
4. **`/work/[id]` 详情**：`generateStaticParams` 出五页，未知 id `notFound()`，`generateMetadata` 标题 `${name} · ${SITE.title}`。头部「← All work」（→ `/work`）、`SITE.workTitle`、副标 `${name} · ${n} of ${total}`、关闭 ×（→ `/`）。正文两栏同 mock：左 figure（槽位图或占位 + caption，≥900 时 sticky）；右 eyebrow / h1 name / tagline / thesis（左侧 cyan 竖线）/ 「What goes wrong unattended · The mechanism I built」两格 / Stack 行 / stats 四格 + `statsNote`（无 stats 不渲染）/ README 面板。
5. **README 面板**：`private` → 锁图标「Private repository」+ `scope` 正文；公开 → 头部「README.md」+ 按钮区【Any question about this project?】（本单只渲染：`aria-disabled="true"`、`title="Coming in a later task"`、`data-scope="<id>"`，task-3 接线）+【Open README on GitHub ↗】；有 `readme` 且有 `readmeNote` → 黄色提示条；有 `readme` → `<pre>` 预览（底部渐隐、最高 290px）；`readme` 为 null → 用 `readmeNote` 做一段说明；底部每个 `repos` 一个按钮（`_blank` + `noopener`）。
6. **详情导航**：底部「← Previous」/ 计数 `n / 5` / 「Next →」循环（bibo 的上一个是 amm，amm 的下一个是 bibo），都是 `<Link>`；一个小的 client 组件监听键盘：← → 翻页、Esc 回 `/`，输入框聚焦时忽略。翻页逻辑抽成纯函数 `nextIndex(cur, dir, total)` 放 `src/lib/workNav.ts`。
7. **响应式**：<1000 总览单列（featured 退化为普通卡）；<900 详情单列、figure 不 sticky；<560 卡片图上文下；375px 两页都无横向滚动。
8. **文档与 schema**：根目录新增 `CONTENT.md`（怎么加项目、放封面、写 README 预览、数字出处、改链接、status 含义，每项指明动哪个文件）；`public/projects/README.md` 一段话说明文件约定（顺便让目录进 git）。新增 `tests/schema.test.mjs`：id 为 `^[a-z0-9-]+$`、hue 在枚举内、status 在枚举内（若存在）、private ⇒ repos 为空且 scope 非空、公开 ⇒ readmeUrl 与 repos 均为 github.com 链接。
9. **占位页清理**：删除 `WorkPlaceholder.tsx` 及其样式，首屏的 tile / 「View My Work」/ 「open all」链接目标不变。

## 非目标
- Any question 抽屉与脚本化回答（task-3）；博客 / `content/posts`（后续单）；从 GitHub 自动同步 README 的脚本（后续单）。
- 不做 intercepting / parallel routes 的真弹窗，全屏页面即可；不改首屏组件与 `HowIBuildCard`。
- 不装 sharp、不装任何运行时依赖；不改 `src/content/copy.ts` / `links.ts` 的值；不删改既有四个测试文件。

## 约束
- Next 16 App Router + TypeScript strict；样式 `globals.css` 令牌 + CSS Modules，沿用 mock 的类名（`gallery / gcard / featured / gimg / gtext / case / fig / detail / pair / stats / readme / rm-*`）便于对照。
- 只有键盘导航与需要状态的组件标 `'use client'`；`resolveCover` 只在服务端跑，不把 `fs` 带进客户端包。
- `npm run lint` 零错误、`npm run build` 绿、`npm test` 绿；新增测试只用 `node --test`。
- 可访问性：figure 有 figcaption 或 `alt`；卡片的 stretched-link 有可读文本；键盘焦点可见；外链带 `rel="noopener"`。

## 验收线索
- 给定 `npm run build`，当读取 `/work` 的产物 HTML，则五个项目名按 `PROJECTS` 顺序出现，第一张卡带 `featured` 且含 `tagline`，BIBO 卡含「Private repository」且不含任何 github.com 链接，其余四张卡各含一个 `href` 等于其 `readmeUrl` 的 `_blank` 链接；每张卡含 `href="/work/<id>"` 的链接且页面内没有 `<a>` 嵌套 `<a>`。
- 给定 `/work/loop` 产物，则含 role、name、tagline、thesis、wrong、mechanism、stack、四个 stats 值与 `statsNote`、`<pre>` 首行 `# Loop Conductor`、`href` 为 `readmeUrl` 的按钮、每个 `repos` 的按钮；`/work/bibo` 含「Private repository」与 `scope` 且无 github.com 链接；`/work/amm` 含两个 repo 按钮与 `readmeNote` 文案；`/work/live` 与 `/work/chain` 含黄色 `readmeNote` 条。
- 给定 `/work/bibo` 产物，则「← Previous」指向 `/work/amm`、「Next →」指向 `/work/loop`、计数 `1 / 5`、副标 `BIBO · 1 of 5`、「← All work」指向 `/work`、关闭指向 `/`；`nextIndex` 单测覆盖两端循环。
- 给定详情页，当按 →，则导航到下一个 id；按 Esc 导航到 `/`；焦点在 `<input>` 时按键无效（组件里可测的分支抽成纯函数并单测）。
- 给定 `public/projects/loop/cover.png` 存在时构建，则 `/work/loop` 与总览 loop 卡渲染 `<img … src="/projects/loop/cover.png"` 且不出现 `SITE.imageSlot` 文案；文件不存在时渲染 `ProjectArt` 的 `<svg>` 与 `SITE.imageSlot` 文案。`resolveCover` 单测用临时目录覆盖「webp 优先 / png 兜底 / 缺失返回 null」三种情况。
- 给定某条记录 `status: 'building'`（单测用内存对象，不改真实数据），则总览卡渲染含「building」徽章的标记；无 status 不渲染徽章。
- 给定仓库，则 `CONTENT.md` 与 `public/projects/README.md` 存在且各含「cover」「status」「statsNote」三个关键词；`tests/schema.test.mjs` 对当前五条记录全绿，并对一条构造的非法记录（private 且带 repos）断言失败。
- 给定 `/work/loop` 产物，则 README 面板含 `aria-disabled="true"` 且 `data-scope="loop"` 的「Any question about this project?」按钮。
- 给定 `/work/nope`，则 404；构建输出列出 `/work/[id]` 的五个静态页。
- 给定 375px 视口，当打开 `/work` 与 `/work/loop`，则 `document.documentElement.scrollWidth <= innerWidth`（不可自动断言的部分改为样式表规则断言：<1000 单列、<900 详情单列、<560 图上文下，沿用 `responsive.test.mjs` 的写法）。
- 保护性：`WorkPlaceholder` 已删除且无引用；首屏组件文件 diff 为空；既有 28 条测试原样全绿；`npm run lint` / `npm run build` 退出码 0；`package.json` 的 `dependencies` 与基线相同；`src/content/projects.ts` 的 diff 只包含类型与可选字段定义，五条记录的字符串值逐字不变。

## 开放问题
- 封面用 `next/image` 还是 `<img>`？safe default：`next/image` + `unoptimized`（不引入 sharp，且不触发 `@next/next/no-img-element`）。
- 整卡可点如何避免嵌套链接？safe default：stretched-link（见目标 3）；若实现上有困难，退化为「图片 + 标题 + Learn more」三个链接，README 独立，仍不许嵌套。
- 图片尺寸与格式约定要不要写死？safe default：只约定 4:3 与文件名，尺寸不限；在 `CONTENT.md` 建议 1600×1200 webp。
- `updated` 显示格式？safe default：原样 ISO 日期字符串，不做本地化。
