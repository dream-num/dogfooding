# univer-team-standup MVP 设计

## 背景

`dogfooding` 仓库的第一个项目原名为 `daily report`。本设计将它收敛为 `univer-team-standup`：一个面向 Univer 团队内部晨会协作的 `univer-cli` dogfooding 项目。

项目的核心不是单纯生成日报，而是让团队每天围绕同一个 Univer workbook 记录、预览和同步进展。第一版必须能被团队高频使用，并真实暴露 `univer-cli` 在工作簿读写、预览、验证和协作流程中的体验边界。

现有 `standup.md` 已经包含 skill 触发词、profile、个人子表、共享表、审计、日报 HTML 和同步策略的草案。本设计吸收其中适合 MVP 的部分，并把范围明确收敛到每天晨会闭环。

## 目标

- 交付一个 workbook-led MVP，让团队可以从模板 workbook 开始真实试用。
- 设计一个 `univer-team-standup` skill，让同事的 Codex/agent 能快速理解并执行晨会流程。
- 使用同一个共享 workbook 管理团队晨会数据。
- 让个人成员可以用自己的 agent 记录进展，并在 workbook 中即时看到自己的更新。
- 让主持人可以从 workbook 生成当天晨会 HTML 报告。
- 默认写本地并预览，不自动 commit 或 sync，降低早期共享协作风险。

## 非目标

- 第一版不实现周报、月报或长期运营分析。
- 第一版不建设完整权限系统，只通过 skill 协议和 profile 角色约束写入边界。
- 第一版不把日报 HTML 做成复杂前端应用。
- 第一版不允许 agent 直接编辑 `.univer` 或 `.unv` 内部文件。
- 第一版不在默认流程中自动 commit 或 sync 远端。

## 交付物

第一版实现时应包含：

- `skills/univer-team-standup/SKILL.md`：可安装或复制使用的团队晨会 skill。
- `ops/team-ops.univer`：模板 workbook，包含晨会协作所需 sheet 和示例数据。
- `ops/reports/daily/`：日报 HTML 输出目录。
- 本设计 spec 和后续实现计划。

## 产品边界

第一版采用 Workbook-led MVP。workbook 是团队协作入口，skill 是 agent 操作 workbook 的协议层，日报 HTML 是晨会投屏输出。

标准日流程：

1. 每个成员用自己的 agent 执行 `append`。
2. agent 默认先 `pull` `ops/team-ops.univer`，读取共享 workbook 最新状态。
3. agent 根据用户输入、当前会话、repo/git/GitHub 证据生成候选日志。
4. 用户确认候选后，agent 写入自己的 `log__<owner_id>`。
5. agent 更新 `_Dashboard` 中自己的行。
6. agent 读回验证写入结果，并打开 `univer view` 预览 workbook。
7. 默认停住，不 commit，不 sync。
8. 晨会主持人执行 `generateDay`，读取全员日志并生成当天 HTML 报告。
9. `generateDay` 写 `_Reports`，刷新 `_Dashboard` 全局区域，读回验证并预览 workbook 和 HTML。
10. 只有用户明确要求提交、同步、发布或类似动作时，才执行 commit + sync。

## 角色模型

`univer-team-standup` 是一个 skill，不拆成主持人 skill 和成员 skill。它内部包含两个执行角色：

- `member`：个人成员模式，用于 `append`、`记录进展`、`同步今天进展` 等操作。
- `host`：主持人模式，用于 `generateDay`、`生成晨会日报` 等操作。

角色来自本地 profile：

```json
{
  "schema_version": "univer-team-standup/v0.1",
  "owner_id": "yangluoshen",
  "display_name": "yangluoshen",
  "github_handle": "yangluoshen",
  "agent_id": "codex-yangluoshen-local",
  "personal_sheet": "log__yangluoshen",
  "timezone": "Asia/Shanghai",
  "default_repo": "dream-num/univer-cli",
  "default_project": "Univer CLI",
  "standup_roles": ["member", "host"]
}
```

默认每个 profile 至少拥有 `member`。执行 `generateDay` 时，如果 `standup_roles` 不包含 `host`，skill 必须要求用户显式确认主持人授权，或者提示先更新 profile。

## Workbook 信息架构

模板 workbook 路径为 `ops/team-ops.univer`。所有 workbook 读写必须通过 `univer` 或 `unv` 公共命令完成，例如 `inspect`、`pipe out`、`pipe in`、`run`、`status`、`pull`、`view`、`commit`、`sync`。不得直接读取、解包或修改 workbook 内部文件。

第一版包含以下 sheet：

### `_Dashboard`

`_Dashboard` 是默认打开页，采用人员看板式晨会入口。

顶部使用深色标题区，显示日期、团队更新人数、未更新人数、blocker/risk 数量、报告链接和本地预览状态。主体使用浅色表格，每个 active 成员一行，适合晨会按人过。

建议字段：

```csv
owner_id,display_name,update_status,yesterday,today,blocker,risk,next_action,last_log_id,last_updated_at,preview_status,report_path
```

权限约定：

- member 只能更新自己 `owner_id` 对应的 dashboard 行。
- member 不能更新他人 dashboard 行，不能改全局汇总区。
- host 可以刷新全局汇总区、报告链接和所有 active 成员的派生状态。

### `_People`

`_People` 是人员和 profile 注册表。

```csv
owner_id,display_name,github_handle,agent_id,personal_sheet,default_repo,default_project,timezone,standup_roles,active,updated_at
```

`standup_roles` 使用逗号分隔字符串，例如 `member` 或 `member,host`。

### `_Reports`

`_Reports` 是报告索引。

```csv
report_id,report_type,date_range,generated_at,generated_by,output_format,output_path,source_sheets,source_rows,commit_ref,sync_status,preview_status,review_url,raw_note
```

第一版只写 `daily` 类型。周报、月报字段保留但不实现生成流程。

### `_Audit`

`_Audit` 记录重要 workbook 操作。

```csv
audit_id,created_at,owner_id,agent_id,role,action,sheet,range,log_id,before_summary,after_summary,commit_ref,review_url,status,raw_note
```

`append`、dashboard 更新、报告生成、commit、sync 都应写审计摘要。审计用于人工回看，不替代真实权限控制。

### `log__<owner_id>`

每个成员拥有一个个人日志 sheet，例如 `log__yangluoshen`。

个人日志保留完整 26 列 schema，但重新排序，让关键列靠左，相关列紧邻。

```csv
log_id,date,owner_id,work_item_title,status,priority,blocker,risk,next_action,repo,branch,work_item_ref,category,area,size,yesterday,today,impact,evidence,source,agent_id,confidence,raw_note,created_at,verified_at,checksum
```

分组意图：

- 识别和晨会核心：`log_id,date,owner_id,work_item_title,status,priority,blocker,risk,next_action`
- 工作上下文：`repo,branch,work_item_ref,category,area,size`
- 日报内容：`yesterday,today,impact,evidence`
- agent 和质量：`source,agent_id,confidence,raw_note,created_at,verified_at,checksum`

模板应冻结表头和关键左列，并使用克制的状态色。保留完整字段是为了后续周报、月报、审计、去重和证据追踪，不要求成员手工填写所有字段。

## 视觉原则

workbook 和日报 HTML 使用“深色标题 + 浅色主体”的视觉方向。

- `_Dashboard` 顶部可以有深色标题区和状态摘要，形成科技感和投屏识别度。
- 表格主体保持浅色、克制、可长期编辑。
- 状态色用于 `blocked`、`risk`、`done`、`needs_review`、`No update` 等有限语义。
- 不使用只为装饰存在的复杂视觉元素。
- 信息密度服务晨会，不做营销页式布局。

## Skill 触发和流程

### 依赖

必须具备：

- `univer` 或 `unv` CLI。
- `univer-cli` skill。
- 可访问或可绑定 `ops/team-ops.univer` 对应的共享 workbook。

模板 workbook 可以先作为本地样板存在。团队正式共享使用时，它必须绑定到远端 workbook；如果尚未绑定远端，`pull` 不应被假装成功，skill 要明确提示“当前仅为本地模板预览”，并继续允许本地试用和预览。绑定远端后，写入前默认 `pull` 是必经步骤。

依赖检查不应每次联网执行。只在首次使用、检查状态缺失、检查超过 7 天、用户要求更新、或 CLI/skill 调用失败且可能与版本有关时执行。

### `append`

触发词包括：

- `append`
- `记录进展`
- `同步今天进展`
- `写日报`
- `更新晨会表`

流程：

1. 检查依赖和 `.univer-agent/profile.json`。
2. profile 缺失时初始化关键字段。
3. 默认执行 `univer pull ops/team-ops.univer`。
4. 读取 workbook 结构、个人 sheet 表头和 `_Dashboard`。
5. 从用户输入、当前会话、git/GitHub 证据和现有 workbook 记录生成候选日志。
6. 写入前展示候选摘要，必须等待用户确认。
7. 生成 `log_id`，推荐格式为 `YYYYMMDD-<owner_id>-<seq>`。
8. 写入当前 profile 的 `personal_sheet`，不得写其他 `log__*`。
9. 读回刚写入的 range，验证关键字段。
10. 更新 `_Dashboard` 中当前 owner 的行。
11. 写 `_Audit`。
12. 打开 `univer view ops/team-ops.univer` 预览。
13. 停止，不自动 commit，不自动 sync。

可见证据范围：

- 用户明确提供的文字。
- 当前 Codex/agent 会话中真实完成的工作。
- 当前 git repo、branch、commit、diff、test 输出。
- 用户粘贴或 agent 可访问的 GitHub issue/PR 内容。
- workbook 中已有记录。

禁止编造他人进展，禁止把无证据内容写成已完成状态。

### `generateDay`

触发词包括：

- `generateDay()`
- `generateDay(YYYY-MM-DD)`
- `genarateDay()` 拼写别名
- `生成晨会日报`
- `生成当天日报`

流程：

1. 检查当前 profile 是否包含 `host`，否则要求显式授权。
2. 默认执行 `univer pull ops/team-ops.univer`。
3. 读取 `_People` 中 active 成员和对应 `log__*` 今日记录。
4. 如果当前会话存在未入表进展，提示先 append，不直接混入报告。
5. 生成 `ops/reports/daily/YYYY-MM-DD-daily.html`。
6. 在 `_Reports` 追加报告索引行。
7. 刷新 `_Dashboard` 全局汇总和报告链接。
8. 读回验证 `_Reports` 和 `_Dashboard`。
9. 预览 workbook 和 HTML。
10. 停止，不自动 commit，不自动 sync。

### 显式 commit + sync

只有用户明确说提交、同步远端、发布、commit、sync 等动作时才执行。

执行前必须：

1. 运行 `univer status`。
2. 展示将提交的 workbook 和 report 变化摘要。
3. 确认无冲突。

有冲突时停止 sync，给出 review 摘要。无冲突时才 commit + sync。

## 日报 HTML

第一版只实现 daily report，输出路径：

```text
ops/reports/daily/YYYY-MM-DD-daily.html
```

HTML 定位是偏投屏、可追溯：

- 首页是团队概览：日期、更新人数、未更新人数、blocker/risk 数量、报告生成时间、source workbook。
- 后续每个 active 成员一页，按 `_People` 顺序排列。
- 每人页展示昨日完成、今日计划或进展、blocker、risk、next action。
- 每个 work item 保留 evidence 链接。
- 长 raw note 放入折叠 details，不占投屏主体。
- 无更新成员标记 `No update / Needs follow-up`。
- AI 推断内容必须标记 `AI inferred, needs human review`，并展示 confidence 和 evidence。

日报 HTML 是静态文件，不需要引入复杂前端框架。

## 错误处理

- 依赖缺失：提示安装 `univer-cli` 或相关 skill，不直接编辑 workbook 内部文件。
- profile 缺失：缺关键字段时必须询问或初始化，不猜测写入。
- 权限越界：member 不得写其他人的个人 sheet，不得更新他人 dashboard 行。
- host 缺失：执行 `generateDay` 前要求 profile role 或显式授权。
- 重复写入：使用 `checksum` 和同日 `log_id` 序号降低重复 append 风险；写前必须让用户确认候选。
- pull 冲突：停止后续写入或同步，展示需要人工处理的范围。
- workbook 未绑定远端：允许本地模板试用和预览，但必须明确提示不会读取共享最新状态。
- 写入失败：不得继续生成成功消息，必须报告失败命令和可见诊断。
- 报告数据不足：无更新人员标记为未更新，不从记忆补内容。
- 预览失败：仍需用 `inspect` 或 `pipe out` 证明 workbook 可见状态，不声称用户已看到预览。

## 验证

实现时应验证：

- `univer inspect workbook ops/team-ops.univer` 能看到 `_Dashboard`、`_People`、`_Reports`、`_Audit` 和示例 `log__<owner_id>`。
- 示例个人日志使用完整 26 列 schema，关键列在左侧，相关列相邻。
- `_Dashboard` 展示人员看板式晨会入口，并有报告链接或报告状态区域。
- `append` 能完成 pull、候选确认、个人日志写入、自己 dashboard 行更新、audit、读回验证和 workbook preview。
- `generateDay` 能完成 host 检查、全员日志读取、HTML 生成、`_Reports` 写入、dashboard 刷新、读回验证和 preview。
- 未绑定远端的模板 workbook 会明确提示本地预览状态；绑定远端后，写入前默认执行 pull。
- 默认流程不会自动 commit 或 sync。
- 显式同步路径会先展示 `univer status`，并在无冲突后提交同步。
- `SKILL.md` 清楚说明触发词、角色、权限、流程和禁止事项。

## 完成标准

第一版完成时应满足：

- `standup.md` 中的初步设想已经被正式设计吸收。
- 仓库包含可使用的 `skills/univer-team-standup/SKILL.md`。
- 仓库包含 `ops/team-ops.univer` 模板 workbook。
- 仓库包含日报输出目录约定 `ops/reports/daily/`。
- 团队成员可以通过自己的 agent 记录个人进展，并预览 workbook。
- 主持人可以生成当天 HTML 晨会报告，并预览结果。
- 默认不会自动 commit 或 sync 远端。
- 周报、月报和更复杂的运营分析留到后续版本。
