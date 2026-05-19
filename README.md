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
| `univer-team-standup` | 团队晨会协作：成员通过自己的 agent 追加进展，主持人从共享 Univer workbook 读取当天状态并组织晨会。 | [`skills/univer-team-standup/SKILL.md`](skills/univer-team-standup/SKILL.md), [`ops/team-ops.univer`](ops/team-ops.univer), [`docs/univer-team-standup-first-run.md`](docs/univer-team-standup-first-run.md) | MVP 脚手架 |

## 快速开始

1. 确认本地可使用 `univer` 或 `unv`。
2. 确认 agent 可使用 `univer-cli` skill；`univer-team-standup` 是建立在它之上的业务工作流。
3. 阅读首次使用指南：[`docs/univer-team-standup-first-run.md`](docs/univer-team-standup-first-run.md)。
4. 要求 agent 使用 `univer-team-standup`，并执行 `onboard`。
5. 在确认候选行内容后，再追加当天晨会进展。
6. 发布前先预览 workbook。

默认流程只写本地并预览。其他成员不会看到你的 onboarding 或晨会更新，除非你明确要求 `commit`、`sync`，或团队已有其他发布流程。

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
| [`skills/univer-team-standup/`](skills/univer-team-standup/) | onboarding、追加晨会进展、发布 workbook 变更的 agent 协议。 |
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
