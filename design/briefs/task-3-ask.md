# portfolio_web · Any question? 导览抽屉（脚本化 mock，可导航、可出报告）

## 背景
- task-20260913-001（首屏）与 task-20260914-001（`/work` 总览 + 详情 + 图片槽位）已合并。Header 的「Any question?」按钮与详情页 README 面板的「Any question about this project?」按钮目前都是 `aria-disabled="true"` 的占位（`src/components/Header.tsx`、`src/components/WorkCase.tsx`，后者带 `data-scope="<id>"`）。本单把它们接上真正的抽屉。
- 抽屉是**脚本化 mock**：不接模型、不接后端、不发送任何东西。它能做的只有四种动作：跳到 `/work/<id>`、打开 mailto、复制邮箱、在页内给出文字 / 报告卡片。发起人的定位：「导游，不是代言人」。
- 文案与链接来源：`src/content/links.ts`（EMAIL / MAILTO / GITHUB / LINKEDIN / X）、`src/content/projects.ts`（PROJECTS、`qa.decision / stack / status`、`LOOKING`）。本单新增 `src/content/guide.ts` 承载问候语、chips、回答模板、关键词路由表，**逐字从 mock 移植**。
- `qa.*` 字符串里只允许 `<em>` 与 `<code>` 两种标签（见 `src/content/projects.ts` 头注释）。React 里不得用 `dangerouslySetInnerHTML` 直灌，要写一个只认这两种标签、其余全部转义的小渲染器。
- 详情页已有 `src/components/WorkKeys.tsx` 监听 ← → Esc；抽屉打开时它必须让路。
- 测试基线：`npm test`（node --test，串行，55 条，全绿）；`npm run lint`、`npm run build` 绿。

## 问题 / 目标
1. **抽屉组件与全局状态**：`src/components/AskDrawer.tsx`（client）+ `AskProvider`（放在 `layout.tsx`，与 `ToastProvider` 并列），暴露 `openAsk(scopeId?: string)` / `closeAsk()` / `isOpen`。抽屉只渲染一次；右侧滑入 450px（≤100vw）、scrim、`role="dialog" aria-modal="true" aria-labelledby`；打开时焦点进输入框，关闭后焦点回到触发按钮；Esc / × / 点 scrim 都关闭；`prefers-reduced-motion` 无滑入、无打字延迟。
2. **两个入口接线**：Header 按钮去掉 `aria-disabled` 与占位 title，点击 `openAsk()`；`WorkCase` 的按钮去掉 `aria-disabled`，点击 `openAsk(id)`（私有项目页同样可用）。
3. **问候与 chips**：首次打开显示问候（两段，第二段 `.fine` 说明这是脚本 mock、真模型版沿用同一站点地图且不会代发任何东西）+ 标题旁「mock · scripted」pill；带 scope 打开且 scope 变化时追加「Scoped to <name>. Pick a question below or type your own.」。chips：无 scope 五个（payments / agents / code / looking / contact），有 scope 四个（decision / stack / status / code）+「← All questions」。
4. **回答（全部脚本，逐字移植 mock 的 `answers`）**：
   - `payments`：一句引言 + 报告卡片「Fit · payments / fintech backend」三条（BIBO / AMM DEX / Loop Conductor，各带 Open ↗ 按钮）+ 动作 [Email Pulin] [Copy email] + scope note。
   - `agents`：引言 + 报告卡片「AI agent work」三条（Loop Conductor / Live Interpreter / This guide）+ [Email Pulin]。
   - `code`：有 scope 只列该项目；无 scope 列全部——私有项目一行「private · team-built」，公开项目每个 repo 一个外链；末尾 GitHub 主页链接。
   - `looking`：`LOOKING` 原文 + [Email Pulin] [Copy email]。
   - `contact`：邮箱（MAILTO 链接）、LinkedIn、GitHub、X（links.ts 原值）、所在地一行、[Copy email]。
   - `decision` / `stack` / `status`：有 scope 渲染该项目 `qa.*`（decision 末尾加「Read the full case」→ `/work/<id>`）；无 scope 回「Which project? Pick one…」+ 五个项目 chips，点选后设 scope 并直接回答。
   - `overview`：`<name> — tagline` + wrong / mechanism 两行 + Open ↗。
   - `all`：清 scope、回到全局 chips。
   - `fallback`：说明 mock 只会脚本问题，并列出五个项目名提示。
5. **报告卡片**：`Report` 小标签 + 标题、有序列表、可选 note、动作行；「Open <name> ↗」= `router.push('/work/<id>')` 并关闭抽屉；「Email Pulin」= `<a href={MAILTO}>`；「Copy email」= 剪贴板 + 现有 Toast（失败回退显示邮箱）。
6. **自由输入**：`src/lib/guideRoute.ts` 的纯函数 `route(text, scopeId)` 复刻 mock：先匹配项目名（bibo / loop|conductor / interpret|meeting|zoom|translat / chain|pulse|ethereum|rpc / amm|dex|swap|uniswap|solidity → 切 scope + `overview`），再按 payments / agents / code / contact / looking / decision / stack / status 的关键词表，否则 `fallback`。用户输入以纯文本渲染（不解析任何标签）。
7. **安全渲染**：`src/lib/inlineMarkup.ts` 把 `qa.*` 这类字符串转成 React 节点：只识别 `<em>…</em>` 与 `<code>…</code>`，其他 `<`、`&` 一律当文本转义。
8. **键盘协调**：抽屉打开时 `WorkKeys` 不处理 ← → Esc（读 `isOpen`）；焦点在输入框时任何按键都不触发页面导航；Esc 先关抽屉。
9. **文案集中**：所有新增字符串放 `src/content/guide.ts`；组件不硬编码（新增一条 grep 式测试断言组件目录不含「Any question」「mock · scripted」「Which project」等字面量）。

## 非目标
- 真模型、后端、持久化、日志、埋点、发消息；不改首屏与 `/work` 的版式；不改 `links.ts` / `projects.ts` / `copy.ts` 的现有值（`copy.ts` 可加 key，不改值）；不新增运行时依赖。

## 约束
- Next 16 App Router + TS strict；抽屉与 provider 是 client 组件，layout 仍是 server 组件包一层 provider。
- 样式沿用 mock 的类名（`drawer / scrim / ask-head / msgs / msg guide|you / chips / chip / report / rp-* / linklist`）与 `globals.css` 令牌；CSS Modules。
- `npm run lint` 零错误；`npm run build` 绿；`npm test` 绿（保持 `--test-concurrency=1`）；新增测试只用 `node --test`。
- 可访问性：dialog 语义、焦点回位、chips 是 `<button>`、外链 `rel="noopener"`、`aria-live="polite"` 的消息区。

## 验收线索
- 给定 `npm run build`，当读取 `/` 产物，则 Header 按钮不含 `aria-disabled`，且页面含抽屉根节点（`role="dialog"`）与「mock · scripted」文案；`/work/loop` 产物中 README 面板按钮不含 `aria-disabled` 且仍带 `data-scope="loop"`。
- 给定首页，当点击「Any question?」，则抽屉打开、焦点在输入框、消息区含问候两段、chips 恰为五个全局问题；按 Esc 关闭且焦点回到该按钮。
- 给定 `/work/bibo`，当点击「Any question about this project?」，则抽屉打开且消息区含「Scoped to BIBO」，chips 为四个项目问题 +「← All questions」；点「Hardest decision in BIBO?」后渲染 `qa.decision` 且其中 `<em>` 以 `<em>` 元素出现而不是字面文本。
- 给定抽屉打开，当点「I'm hiring for a payments / fintech backend role」，则出现 `Report` 卡片，含三个「Open … ↗」按钮、`href` 等于 MAILTO 的「Email Pulin」与「Copy email」；点「Open BIBO ↗」后 `location.pathname === '/work/bibo'` 且抽屉已关闭。
- 给定抽屉打开，当输入「tell me about chain-pulse」并发送，则回复为 chain-pulse 的 overview 且 chips 切换为 scoped 集合；输入「asdf」则回复 fallback 文案。`route()` 单测覆盖：五个项目名、八类关键词、fallback、已 scope 时重复项目名不重复切换。
- 给定 `inlineMarkup`，当输入含 `<em>a</em> <code>b</code> <script>x</script> & <b>c</b>`，则输出只有 em 与 code 两个元素，其余字符原样转义显示。
- 给定 `/work/loop` 抽屉打开，当按 →，则路径不变；关闭后按 → 则到 `/work/live`。
- 给定 `prefers-reduced-motion: reduce`，当打开抽屉，则无过渡动画且回复不出现「guide is typing…」中间态（可测的分支抽成纯函数并单测）。
- 给定仓库，则 `src/components` 目录下 grep 不到「Any question」「mock · scripted」「Which project」「Email Pulin」字面量（全部来自 `src/content/guide.ts`）。
- 保护性：既有 55 条测试原样全绿；`npm run lint` / `npm run build` 退出码 0；`package.json` 的 `dependencies` 与基线相同；`links.ts` / `projects.ts` diff 为空。

## 开放问题
- 抽屉的消息历史是否在关闭后保留？safe default：保留（与 mock 一致，`greeted` 只问候一次），刷新页面即清空。
- 「Open … ↗」在 `/work` 之外的页面点击时，是否先关闭再跳转？safe default：先关闭抽屉再 `router.push`，两者都在同一 tick 触发即可。
- 用户输入含项目名但当前已是该 scope？safe default：不重复追加「Scoped to」，直接回 overview。
