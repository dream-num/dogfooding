# Dogfooding

dogfooding 是团队内部用于孵化和验证 `univer-cli` 早期使用场景的仓库。这里记录真实工作流中的项目想法、使用路径、反馈和沉淀，帮助我们更快理解 `univer-cli` 与 `univer-cli skill` 在团队协作中的价值。

## 当前重点

第一个项目已从 `daily report` 收敛并命名为 `univer-team-standup`。它用于让团队成员通过自己的 agent 把晨会进展写入同一个 Univer workbook，并由主持人从 workbook 生成当天晨会 HTML 报告。

第一版采用 workbook-led MVP：共享 workbook 是协作入口，skill 是 agent 操作协议，日报 HTML 是晨会投屏输出。默认流程只写本地并预览，不自动 commit 或 sync 远端。

## 工作原则

- 真实使用优先：项目来自团队内部实际协作场景。
- 轻量开始：先跑通每天晨会闭环，再扩展周报、月报或运营分析。
- 持续演进：早期项目可以快速调整，稳定经验再沉淀为规范。
- 聚焦 univer-cli：所有 workbook 读写、验证和预览都通过 `univer` / `unv` 公共命令完成。

## 仓库结构

- [docs/project-incubation.md](docs/project-incubation.md)：新增早期项目时使用的轻量孵化流程。
- [docs/superpowers/specs/2026-05-18-univer-team-standup-design.md](docs/superpowers/specs/2026-05-18-univer-team-standup-design.md)：`univer-team-standup` MVP 设计。
- [docs/superpowers/plans/](docs/superpowers/plans/)：已确认设计对应的实现计划。

## 下一步

实现 `univer-team-standup` MVP，包括 skill 文档、`ops/team-ops.univer` 模板 workbook 和日报输出目录。
