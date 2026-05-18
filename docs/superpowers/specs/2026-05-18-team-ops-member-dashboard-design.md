# Team Ops Member Dashboard 设计

## 背景

`ops/team-ops.univer` 是 `univer-team-standup` 的团队晨会 workbook。现有模板已经具备基础结构，但存在三个问题：

- 视觉仍偏普通表格，缺少 SaaS App 式的驾驶舱质感。
- 包含 host、`generateDay`、`Reports` 等当前阶段不需要的流程和信息。
- 表名带 `_` 前缀，且大量可见叙事使用英文，不符合团队日常阅读习惯。

本设计将模板收敛为 member-only 使用场景：每个成员自助 onboarding、append 自己的晨会更新，并在 `Dashboard` 中看到团队更新态势。主持人角色、日报生成和报告索引从本轮范围中移除。

## 目标

- 将 `ops/team-ops.univer` 打磨为数据驾驶舱式 SaaS 工作台。
- 最终结果仍由 `tools/univer-team-standup/create-template-workbook.js` 生成，便于未来复现。
- 取消表名中的 `_` 前缀，并保证 `Dashboard` 是第一个表。
- 以中文叙事为主，让模板打开后更适合团队晨会阅读。
- 移除 `Reports` 表、host 角色和 `generateDay` 流程。
- 保留轻量 `Audit`，用于排查 agent 写入和 dashboard 刷新问题。
- 正式模板保持干净空数据；review 时可生成临时副本并注入中文实例数据。

## 非目标

- 不实现主持人日报、HTML 报告生成或报告索引。
- 不保留 host 授权、host profile 或 host 专属字段。
- 不引入新的前端应用。
- 不直接编辑 `.univer` 内部文件。
- 不把 review 示例数据写入生成脚本或正式模板。
- 不默认 commit、sync 或发布远端 workbook。

## 方案选择

采用“Dashboard 驱动的 member-only 工作台”方案。

Workbook 只保留：

```text
Dashboard
People
Audit
log__sample_member
```

后续真实成员 onboarding 时，可以按既有个人日志命名策略创建 `log__<owner_id>`。`log__*` 命名不属于本轮“取消 `_` 前缀”的对象，因为它是个人日志 sheet 的稳定命名协议，而不是系统表前缀。

选择理由：

- `Dashboard` 可以承担 SaaS 驾驶舱的视觉主入口。
- `People`、`Audit`、个人日志表各自职责清晰，冗余最少。
- 移除 `Reports` 后，member-only 用户故事更直接。
- 保留 `Audit` 能减少 agent 写入失败时的排查成本。

## 信息架构

### `Dashboard`

`Dashboard` 是 workbook 第一个表，也是默认打开页。它采用数据驾驶舱布局：

1. 顶部深色标题区：展示“团队晨会驾驶舱”、今日日期、模板状态和同步策略。
2. 指标区：展示已更新成员、待更新、阻塞、风险、最后写入。
3. 更新分布区：全宽放在成员看板上方，使用图表或图表源数据展示更新态势。
4. 成员更新看板：全宽放在下方，承载中文长文本和成员级状态。
5. 弱化数据源区：放置图表公式源，不作为主要阅读内容。

成员看板中文表头：

```text
成员ID, 成员, 更新状态, 昨天完成, 今天计划, 阻塞, 风险, 下一步, 最近日志, 最近更新时间, 预览状态
```

视觉要求：

- `更新分布` 和 `成员更新看板` 使用上下布局，成员看板在下。
- 指标和图表更强，符合“数据驾驶舱式”方向。
- 成员看板仍保持可编辑、可换行、可扫视。
- 阻塞使用红色语义，风险使用琥珀色语义，已更新使用绿色语义，待更新使用中性或琥珀色语义。

### `People`

`People` 是成员注册表，只服务 member 用户故事。中文表头：

```text
成员ID, 显示名称, GitHub账号, AgentID, 个人日志表, 默认仓库, 默认项目, 时区, 是否启用, 更新时间
```

移除 `standup_roles`、host 角色和其他主持人相关叙事。`是否启用` 控制成员是否进入 `Dashboard` 指标和成员看板统计。

### `Audit`

`Audit` 是轻量操作日志，不是主阅读界面。中文表头：

```text
审计ID, 创建时间, 成员ID, AgentID, 操作, 工作表, 范围, 日志ID, 操作摘要, 状态
```

记录范围：

- onboarding 创建或修复 profile、`People` 行、个人日志表、`Dashboard` 行。
- append 写入个人日志。
- append 后刷新当前成员的 `Dashboard` 行。
- 关键错误或拒绝写入原因。

不记录日报生成、host 操作或发布报告，因为这些流程已移除。

### `log__<owner_id>`

个人日志表是 append 的事实来源。正式模板可包含 `log__sample_member` 作为结构样板，但不写示例数据。

中文表头：

```text
日志ID, 日期, 成员ID, 工作项, 状态, 优先级, 阻塞, 风险, 下一步, 仓库, 分支, 关联项, 分类, 模块, 规模, 昨天完成, 今天计划, 影响, 证据, 来源, AgentID, 置信度, 原始备注, 创建时间, 校验时间, 校验码
```

字段顺序保持稳定，关键字段靠左。生成脚本和 skill 可以依赖固定列位，而用户看到的是中文叙事。

## 数据流

### Onboard

1. 读取或创建 `.univer-agent/profile.json`。
2. 通过 `univer` 公开命令读取 workbook。
3. 在 `People` 中添加或更新当前成员行。
4. 创建或修复当前成员自己的 `log__<owner_id>`。
5. 在 `Dashboard` 中添加或更新当前成员行，初始状态为待更新。
6. 写入一条 `Audit`。
7. 读回验证，并打开 workbook 预览。
8. 停止，不自动 commit 或 sync。

### Append

1. 读取 profile 和 workbook 可见状态。
2. 只从可见证据生成候选日志：用户输入、当前会话、git/branch/commit/diff/test 输出、可访问 GitHub 内容、已有 workbook 记录。
3. 展示候选日志并等待用户确认。
4. 只写入当前 profile 的个人日志表。
5. 读回验证关键字段。
6. 只刷新当前成员自己的 `Dashboard` 行。
7. 写入一条 `Audit`。
8. 预览 workbook。
9. 停止，不自动 commit 或 sync。

## 错误处理

- 生成脚本发现非空旧模板表或未知非空表时，拒绝覆盖。
- 旧 `_Reports`、`_Dashboard`、`_People`、`_Audit` 只有在可安全重建时才删除或替换。
- member 模式不能写其他成员的 `Dashboard` 行或 `log__*` 表。
- member 模式不能执行 host、`generateDay` 或报告索引相关操作。
- `univer` daemon build mismatch 时，按 CLI 诊断执行 `univer daemon stop` 后重试。
- 所有 workbook 读写只通过 `univer` / `unv` 公共命令完成，不读取或修改 `.univer` 内部文件。

## Review 示例数据策略

正式生成脚本只生成干净模板：

- `Dashboard` 指标默认来自空成员数据，显示 0 或空状态。
- `People` 只保留表头和格式。
- `Audit` 只保留表头和格式。
- `log__sample_member` 只保留表头和格式。

为了 review 视觉完整度，可以临时生成一个副本并注入中文实例数据。该副本只用于检查 Dashboard 观感、长文本换行、图表、条件格式和示例流程，不写回 `tools/univer-team-standup/create-template-workbook.js`，也不替换正式 `ops/team-ops.univer`。

## 需要更新的文件

实施阶段预计更新：

- `tools/univer-team-standup/create-template-workbook.js`
- `ops/team-ops.univer`
- `skills/univer-team-standup/SKILL.md`
- `docs/univer-team-standup-first-run.md`

现有历史 spec 和 plan 可以作为历史记录保留，不作为当前实现契约。

## 验证

实施完成后至少验证：

```bash
node --check tools/univer-team-standup/create-template-workbook.js
univer inspect workbook ops/team-ops.univer
univer pipe out ops/team-ops.univer --range 'Dashboard!A1:K20' --format tsv
univer pipe out ops/team-ops.univer --range 'People!A1:J3' --format tsv
univer pipe out ops/team-ops.univer --range 'Audit!A1:J3' --format tsv
univer pipe out ops/team-ops.univer --range 'log__sample_member!A1:Z3' --format tsv
```

验收标准：

- `Dashboard` 是第一个表和活动表。
- 系统表没有 `_` 前缀。
- 不存在 `Reports` 表。
- workbook 不包含 host 或 `generateDay` 可见叙事。
- Dashboard、People、Audit、个人日志表头以中文为主。
- Dashboard 使用上下布局：更新分布在上，成员更新看板在下。
- 正式模板没有实例成员或实例日志数据。
- review 副本可以注入中文实例数据，但不改变正式生成脚本。
