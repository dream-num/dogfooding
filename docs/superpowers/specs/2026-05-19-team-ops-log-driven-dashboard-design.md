# Team Ops Log Driven Dashboard 设计

## 背景

当前 `ops/team-ops.univer` 已完成 member-only、中文叙事、左右布局和轻量 `Audit`。下一步需要解决数据一致性和可靠性：`Dashboard` 不应成为第二份事实数据，否则展示层改版时容易误删或覆盖成员进展。

本轮设计采用公式驱动的展示层：`Dashboard` 只负责呈现，成员进展事实保存在 `log__<member_id>`。只要 `People` 和 `log__<member_id>` 还在，就可以任意重建或改版 `Dashboard`。

## 目标

- 保持 `Dashboard` 展示层和 `log__<member_id>` 数据层分离。
- 让 `Dashboard` 成员行从 `People` 和真实 `log__<member_id>` 自动读取，而不是由 append 手写刷新。
- 使用最新 `创建时间` 选择成员最近日志，不依赖日志追加顺序。
- 增强右侧分析区，提供比单一更新分布更有价值的状态、风险、阻塞和数据质量信息。
- 使用条件格式、数字格式和 helper 列，让表格更直观、专业、易扫视。
- 正式模板保持无实例数据；review 样例只写入临时副本。

## 非目标

- 不改变 `log__<member_id>` 的字段顺序。
- 不把实例成员或实例日志写入生成脚本。
- 不恢复 `Reports`、host 或 `generateDay`。
- 不引入额外前端应用。
- 不直接读取或修改 `.univer` 包内部文件。

## 数据层与展示层边界

### 数据层

`People` 是成员注册表，提供启用成员列表、展示名、账号、个人日志表名和元数据。

`log__<member_id>` 是成员进展事实来源。append 流程只追加当前成员自己的日志，不再手写刷新 `Dashboard` 成员字段。

`Audit` 仍记录 onboarding、append、拒绝写入和关键异常，用于排查 agent 操作。

### 展示层

`Dashboard` 可以被重建。它从 `People` 生成成员行，从对应 `log__<member_id>` 读取最近日志字段，并根据公式得出状态、指标和图表源。

展示层允许 helper 列，但 helper 列应隐藏或压窄，不成为用户主要阅读区域。

## Dashboard 成员行

成员看板保留左侧布局：

```text
成员ID, 成员, 更新状态, 昨天完成, 今天计划, 阻塞, 风险, 下一步, 最近日志, 最近更新时间, 预览状态
```

字段来源：

- `成员ID`: 来自 `People!A2:A80`，仅展示 `是否启用=是` 的成员。
- `成员`: 来自 `People!B2:B80`。
- `更新状态`: 根据最近更新时间是否为今天计算，值为 `已更新`、`待更新`、`缺日志表` 或 `无日志`。
- `昨天完成`: 最近日志行的 `昨天完成`。
- `今天计划`: 最近日志行的 `今天计划`。
- `阻塞`: 最近日志行的 `阻塞`。
- `风险`: 最近日志行的 `风险`。
- `下一步`: 最近日志行的 `下一步`。
- `最近日志`: 最近日志行的 `日志ID`。
- `最近更新时间`: 最近日志行的 `创建时间`。
- `预览状态`: 面向用户的可读状态，例如 `今日已同步`、`需要更新`、`缺日志表`、`无日志`。

最近日志选择规则：对 `log__<member_id>!X2:X200` 的 `创建时间` 转换为可比较数字，使用最大值定位最近日志行，再从同一行读取其他字段。

## 右侧分析区

右侧分析区从成员行和 helper 列计算，不手写数据。

建议包含：

- 今日更新率：已更新成员 / 启用成员。
- 待更新成员：启用但今日未更新。
- 阻塞成员：最近日志中 `阻塞` 非空。
- 风险成员：最近日志中 `风险` 非空。
- 数据质量：缺日志表、无日志、缺创建时间。
- 最近更新时间：所有成员最近更新时间最大值。

图表不再只展示单一更新分布。右侧至少提供一个综合 chart source，覆盖更新、阻塞、风险和数据质量；必要时配一个小型数据质量表。

## 视觉与格式

- `已更新` 使用绿色语义。
- `待更新` 使用琥珀语义。
- `缺日志表`、`缺创建时间` 使用红色语义。
- `无日志` 使用灰色语义。
- 阻塞列红色高亮，风险列琥珀高亮。
- 今日更新率使用百分比数字格式。
- 计数字段使用整数格式。
- 日期或时间字段保持 ISO 字符串可 pipe out，不强制转成不可逆日期序列。
- helper 列压窄或隐藏，避免干扰主视图。

## Skill 行为变更

`skills/univer-team-standup/SKILL.md` 需要同步说明：

- Onboard 负责写 `People`、创建 `log__<owner_id>`、写 `Audit`。
- Append 只追加 `log__<owner_id>`，并写 `Audit`。
- Append 后可以预览 `Dashboard`，但不手写刷新 Dashboard 行。
- Dashboard 是展示层，可以重建；成员事实数据以 `log__<owner_id>` 为准。

## 验证

正式模板验证：

```bash
node --check tools/univer-team-standup/create-template-workbook.js
univer inspect workbook ops/team-ops.univer
univer status ops/team-ops.univer --json
univer pipe out ops/team-ops.univer --range 'Dashboard!A10:R40' --format tsv
univer pipe out ops/team-ops.univer --range 'People!A1:J3' --format tsv
univer pipe out ops/team-ops.univer --range 'log__sample_member!A1:Z3' --format tsv
```

临时样例验证：

- 在 `/tmp` 副本中写入 `People` 样例成员和真实 `log__<member_id>` 表。
- 故意让日志行顺序和 `创建时间` 顺序不一致。
- 验证 `Dashboard` 选择最大 `创建时间` 的日志行。
- 验证指标、图表源、阻塞/风险/数据质量统计随日志变化自动更新。
- 验证正式 `ops/team-ops.univer` 不包含样例成员数据。
