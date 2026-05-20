# Dogfooding

`dogfooding` 是团队验证 `univer-cli` 真实使用场景的工作区。这里不做概念展示，优先沉淀能被团队每天使用、能被 agent 执行、能被 workbook 验证的最小闭环。

## 目标

- 用真实协作场景验证 `univer` / `unv` 的读写、预览、同步和自动化体验。
- 将可复用的 agent 操作协议沉淀为本地 skill。
- 让 workbook 状态可检查、可预览、可追溯，并且只在明确指令下发布。
- 把使用反馈转化为文档、模板、脚本或后续产品改进。

## 当前项目

| 项目 | 用途 | 关键资产 | 状态 |
| --- | --- | --- | --- |
| `univer-worklog` | 团队工作日志：成员通过 agent 手动或自动汇总 Codex/workbuddy/git/GitHub 证据，写入共享 Univer workbook，并生成个人或团队日报/周报/月报。 | [`skills/univer-worklog-auto/SKILL.md`](skills/univer-worklog-auto/SKILL.md), [`skills/univer-worklog-report-team/SKILL.md`](skills/univer-worklog-report-team/SKILL.md), [`skills/univer-team-standup/SKILL.md`](skills/univer-team-standup/SKILL.md), [`ops/team-ops.univer`](ops/team-ops.univer), [`docs/univer-team-standup-first-run.md`](docs/univer-team-standup-first-run.md) | Worklog MVP |

## 当前状态

- 面向用户的 Codex skill 入口已经拆成 5 个：`univer-worklog-append`、`univer-worklog-auto`、`univer-worklog-report`、`univer-worklog-report-team`、`univer-worklog-help`。
- `univer-team-standup` 是内部 core skill，只保存 workbook 协议、表结构、同步策略和报告规则，不应该作为 `$` 菜单入口直接使用。
- 唯一依赖是 `univer-cli` 工具链：`univer` / `unv` 命令和来自 [`dream-num/skills`](https://github.com/dream-num/skills) 的 `univer-cli` skill。
- 默认共享 workbook 已内置为 [`fYmh0HRyTUO6YECQGFScnA0`](https://univer.ai/space/sheets/fYmh0HRyTUO6YECQGFScnA0)，CLI host 使用 `https://univer.ai/`。
- 个人报告和团队报告默认生成交互式 HTML；团队报告按 10-15 人晨会设计，首屏优先展示团队摘要、同步/决策/求助和成员 compact cards，明细默认折叠。
- `$univer-worklog-auto` 的目标是自动采集、去重、写入并在状态干净时提交/同步；`append` 和 `report` 默认不发布远端，除非用户明确要求。

## 快速开始

1. 安装唯一需要的 Univer 命令行工具：`npm install -g univer-cli@latest`，安装后应能使用 `univer` 或 `unv`。
2. 安装唯一需要的 Univer skills 来源：`npx skills add dream-num/skills`，其中必须包含 `univer-cli` skill。
3. 阅读首次使用指南：[`docs/univer-team-standup-first-run.md`](docs/univer-team-standup-first-run.md)。
4. 在 Codex 里输入 `$univer-worklog-help` 查看可用入口。
5. 首次使用先执行 `onboard`，确认自动生成的 `成员ID` 和个人日志表。
6. 用 `$univer-worklog-append` 手动追加，或用 `$univer-worklog-auto --dry-run` 先预览自动采集结果。
7. 发布前先预览 workbook。

默认流程只写本地并预览。其他成员不会看到你的 onboarding 或工作日志更新，除非你明确要求 `commit`、`sync`，或团队已有其他发布流程。

`univer-worklog` 只依赖 `univer-cli` 工具链：不使用其他表格引擎，不直接编辑 `.univer` 包内部文件。

## Worklog 命令

这些是 Codex skill 入口，不是终端命令。输入 `$` 时应能看到独立 skill：

```text
$univer-worklog-append
$univer-worklog-auto [--dry-run] [--confirm] [--no-submit] [--period day|week|month]
$univer-worklog-report [day|week|month]
$univer-worklog-report-team [day|week|month]
$univer-worklog-help
```

| 命令 | 用途 | 默认写入/同步行为 |
| --- | --- | --- |
| `$univer-worklog-append` | 手动追加自己的工作日志 | 写本地，明确要求时再发布 |
| `$univer-worklog-auto` | 从 Codex/workbuddy/git/GitHub 证据生成候选，去重后写入 | 默认可自动提交/同步；`--dry-run` 不写，`--no-submit` 不同步 |
| `$univer-worklog-report` | 生成个人日报/周报/月报 | 只生成本地 HTML 报告 |
| `$univer-worklog-report-team` | 生成团队日报/周报/月报 | 只生成本地 HTML 报告 |
| `$univer-worklog-help` | 查看命令和常用自然语言别名 | 只读 |

`$univer-worklog-auto --dry-run` 只采集和生成候选，不写表格。默认 `$univer-worklog-auto` 写入后会在状态干净时自动提交/同步到团队远端；如需只本地预览，用 `--no-submit`。`$univer-worklog-report day` 和 `$univer-worklog-report-team day` 默认生成交互式 HTML 报告，包含总结、筛选、成员/项目卡片、展开明细、证据链接和打印友好的样式。

默认团队远端由 skill 内置：

```text
unitID: fYmh0HRyTUO6YECQGFScnA0
link: https://univer.ai/space/sheets/fYmh0HRyTUO6YECQGFScnA0
host: https://univer.ai/
```

本地可用 `UNIVER_WORKLOG_REMOTE` / `UNIVER_WORKLOG_HOST` 或 `.univer-agent/profile.json` 覆盖。CLI 配置使用 base host，例如 `univer config set univerHost https://univer.ai/`；给用户看的访问链接使用 `/space/sheets/<unitID>` 格式。

## 协作约定

`ops/team-ops.univer` 是协作入口。所有检查、写入、验证和预览都应通过 `univer` / `unv` 公共命令完成。

- 不解压、不 patch、不直接编辑 `.univer` 内部文件。
- `People` 和 `log__<owner_id>` 是持久数据源。
- `Dashboard` 是可重建的展示层，内容应由 workbook 数据推导。
- 成员 agent 只能维护自己的 profile、`People` 行、个人日志表和审计记录。
- 不提交 `.univer-agent/` 本地身份文件。

## 仓库结构

| 路径 | 说明 |
| --- | --- |
| [`skills/univer-team-standup/`](skills/univer-team-standup/) | 内部 core skill：workbook 协议、onboarding、append、auto、report、publish 规则；不直接作为 `$` 入口。 |
| [`skills/univer-worklog-append/`](skills/univer-worklog-append/) | 手动追加自己的 worklog。 |
| [`skills/univer-worklog-auto/`](skills/univer-worklog-auto/) | 自动采集证据、生成候选、去重、写入并可自动提交。 |
| [`skills/univer-worklog-report/`](skills/univer-worklog-report/) | 生成个人 HTML 日报/周报/月报。 |
| [`skills/univer-worklog-report-team/`](skills/univer-worklog-report-team/) | 生成适合晨会扫描的团队 HTML 日报/周报/月报。 |
| [`skills/univer-worklog-help/`](skills/univer-worklog-help/) | 输出命令列表、别名和默认 workbook 信息。 |
| [`ops/team-ops.univer`](ops/team-ops.univer) | 晨会 workbook 模板和本地状态。 |
| [`tools/univer-team-standup/`](tools/univer-team-standup/) | 创建和维护 workbook 模板的工具。 |
| [`docs/univer-team-standup-first-run.md`](docs/univer-team-standup-first-run.md) | 成员首次使用指南。 |
| [`docs/project-incubation.md`](docs/project-incubation.md) | 新增 dogfooding 项目的轻量准入流程。 |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | 已确认工作的设计记录。 |
| [`docs/superpowers/plans/`](docs/superpowers/plans/) | 由设计拆出的实现计划。 |

## 新增项目

新增 dogfooding 项目前，用一页以内说明回答：

1. 谁会使用？
2. 它验证哪条真实工作流？
3. 它会用到哪些 `univer-cli` 能力？
4. 它会产出什么可检查的记录、文件或工作成果？
5. 团队如何判断继续推进、调整方向或沉淀经验？

完整流程见 [`docs/project-incubation.md`](docs/project-incubation.md)。

## 原则

- 从真实团队使用出发，不为概念演示堆功能。
- 优先选择小流程、可见产出和短反馈周期。
- 自动化必须显式；默认流程先本地预览，再按指令发布。
- 经验要沉淀为文档、skill、模板或后续计划。
- 保持入口清晰、范围克制、状态可追踪。
