# Project Initialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the dogfooding repository with a minimal Chinese documentation skeleton for team-internal `univer-cli` early projects.

**Architecture:** This is a documentation-only initialization. `README.md` is the repository entry point, and `docs/project-incubation.md` describes the lightweight process for introducing future early projects.

**Tech Stack:** Markdown, Git, ripgrep (`rg`).

---

## Scope Check

The approved spec covers one small subsystem: repository documentation initialization. It does not include application code, package tooling, project directories, or the `daily report` implementation.

## File Structure

- Create: `README.md`
  - Responsibility: Explain the repository purpose, current focus, principles, document entry points, and next step.
- Create: `docs/project-incubation.md`
  - Responsibility: Explain how future early projects should enter this repository with minimal process.
- Existing: `docs/superpowers/specs/2026-05-18-project-initialization-design.md`
  - Responsibility: Approved design source for this implementation.

## Implementation Tasks

### Task 1: Create Repository README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Confirm the worktree starts clean**

Run:

```bash
git status --short --branch
```

Expected output:

```text
## feat-init-repo
```

- [ ] **Step 2: Add `README.md`**

Use `apply_patch` to create `README.md` with this exact content:

```markdown
# Dogfooding

dogfooding 是团队内部用于孵化和验证 `univer-cli` 早期使用场景的仓库。这里记录真实工作流中的项目想法、使用路径、反馈和沉淀，帮助我们更快理解 `univer-cli` 与 `univer-cli skill` 在团队协作中的价值。

## 当前重点

第一个即将开始的项目是 `daily report`。它用于快速、结构化地记录团队成员每天的工作进展，并在晨会中展示和同步。

本次初始化只建立仓库文档骨架。`daily report` 的数据结构、表格字段和具体流程会在后续单独设计。

## 工作原则

- 真实使用优先：项目来自团队内部实际协作场景。
- 轻量开始：先记录场景和工作方式，再决定是否需要工具链或自动化。
- 持续演进：早期项目可以快速调整，稳定经验再沉淀为规范。
- 聚焦 univer-cli：优先观察和验证 `univer-cli` 与 `univer-cli skill` 的实际能力边界。

## 仓库结构

- [docs/project-incubation.md](docs/project-incubation.md)：新增早期项目时使用的轻量孵化流程。
- [docs/superpowers/specs/](docs/superpowers/specs/)：已确认的设计 spec。

## 下一步

下一阶段会单独设计 `daily report`，包括记录方式、晨会展示方式以及如何用 `univer-cli` 快速维护日常进展。
```

- [ ] **Step 3: Verify the README contains the required anchors**

Run:

```bash
test -f README.md && rg -n "Dogfooding|docs/project-incubation.md|daily report|univer-cli" README.md
```

Expected output:

```text
1:# Dogfooding
3:dogfooding 是团队内部用于孵化和验证 `univer-cli` 早期使用场景的仓库。这里记录真实工作流中的项目想法、使用路径、反馈和沉淀，帮助我们更快理解 `univer-cli` 与 `univer-cli skill` 在团队协作中的价值。
7:第一个即将开始的项目是 `daily report`。它用于快速、结构化地记录团队成员每天的工作进展，并在晨会中展示和同步。
16:- 聚焦 univer-cli：优先观察和验证 `univer-cli` 与 `univer-cli skill` 的实际能力边界。
20:- [docs/project-incubation.md](docs/project-incubation.md)：新增早期项目时使用的轻量孵化流程。
25:下一阶段会单独设计 `daily report`，包括记录方式、晨会展示方式以及如何用 `univer-cli` 快速维护日常进展。
```

### Task 2: Create Project Incubation Guide

**Files:**
- Create: `docs/project-incubation.md`

- [ ] **Step 1: Add `docs/project-incubation.md`**

Use `apply_patch` to create `docs/project-incubation.md` with this exact content:

```markdown
# 项目孵化流程

本仓库用于承接团队内部对 `univer-cli` 和 `univer-cli skill` 的早期项目验证。项目进入这里时，不需要一开始就完整产品化，但需要讲清楚真实场景、要验证的能力和预期产出。

## 适合的项目

适合进入本仓库的项目通常满足以下条件：

- 来自团队内部真实工作流。
- 能帮助验证 `univer-cli` 或 `univer-cli skill` 的能力、边界或体验。
- 可以在较短周期内产生可观察的使用结果。
- 产出能被复用、展示或沉淀为后续改进依据。

不适合进入本仓库的项目包括：

- 和 `univer-cli` 使用场景无关的长期产品建设。
- 只有想法、没有明确内部使用者的项目。
- 一开始就需要完整平台、复杂权限或长期运维的项目。

## 开始前需要回答的问题

新增项目之前，先用一页以内的说明回答这些问题：

1. 谁会使用它？
2. 它要验证哪条团队工作流？
3. 它会用到或验证哪些 `univer-cli` 能力？
4. 它预期产出什么记录、文件或工作成果？
5. 团队如何判断继续推进、调整方向或沉淀经验？

这些问题的答案可以写在项目自己的文档中。当前阶段不要求统一模板。

## 推荐推进方式

1. 先描述真实使用场景和成员如何参与。
2. 再说明最小可用流程，避免提前设计过重的目录、脚本或自动化。
3. 当流程被实际使用后，记录遇到的问题、缺口和可复用经验。
4. 如果项目稳定下来，再考虑抽取模板、脚本、技能说明或更正式的文档。

## 与 daily report 的关系

`daily report` 是本仓库的第一个早期项目。它会作为我们观察 `univer-cli` 在团队日常同步中是否好用的第一个样例。

`daily report` 不是所有项目必须照搬的模板。后续项目可以根据自己的场景选择不同结构，只要保持轻量、真实、可验证。
```

- [ ] **Step 2: Verify the incubation guide contains the required sections**

Run:

```bash
test -f docs/project-incubation.md && rg -n "项目孵化流程|适合的项目|开始前需要回答的问题|daily report|univer-cli" docs/project-incubation.md
```

Expected output:

```text
1:# 项目孵化流程
3:本仓库用于承接团队内部对 `univer-cli` 和 `univer-cli skill` 的早期项目验证。项目进入这里时，不需要一开始就完整产品化，但需要讲清楚真实场景、要验证的能力和预期产出。
5:## 适合的项目
10:- 能帮助验证 `univer-cli` 或 `univer-cli skill` 的能力、边界或体验。
16:- 和 `univer-cli` 使用场景无关的长期产品建设。
20:## 开始前需要回答的问题
26:3. 它会用到或验证哪些 `univer-cli` 能力？
39:## 与 daily report 的关系
41:`daily report` 是本仓库的第一个早期项目。它会作为我们观察 `univer-cli` 在团队日常同步中是否好用的第一个样例。
43:`daily report` 不是所有项目必须照搬的模板。后续项目可以根据自己的场景选择不同结构，只要保持轻量、真实、可验证。
```

### Task 3: Verify Scope and Commit

**Files:**
- Verify: `README.md`
- Verify: `docs/project-incubation.md`
- Verify: `docs/superpowers/specs/2026-05-18-project-initialization-design.md`

- [ ] **Step 1: Verify the README link target exists**

Run:

```bash
test -f docs/project-incubation.md && rg -n "\\[docs/project-incubation.md\\]\\(docs/project-incubation.md\\)" README.md
```

Expected output:

```text
20:- [docs/project-incubation.md](docs/project-incubation.md)：新增早期项目时使用的轻量孵化流程。
```

- [ ] **Step 2: Verify no package tooling or project directory was added**

Run:

```bash
test ! -f package.json && test ! -f tsconfig.json && test ! -d projects
```

Expected output: no output and exit code `0`.

- [ ] **Step 3: Verify the implementation documents do not contain unfinished markers**

Run:

```bash
rg -n 'TB''D|TO''DO|FIX''ME|待''定|未''定' README.md docs/project-incubation.md
```

Expected output: no output and exit code `1`.

- [ ] **Step 4: Verify the implementation diff only includes the intended files**

Run:

```bash
git status --short
```

Expected output:

```text
?? README.md
?? docs/project-incubation.md
```

- [ ] **Step 5: Commit the documentation initialization**

Run:

```bash
git add README.md docs/project-incubation.md
git commit -m "docs: initialize dogfooding repository"
```

Expected result: command exits with code `0` and reports a commit containing `README.md` and `docs/project-incubation.md`.

- [ ] **Step 6: Verify the branch is clean after the commit**

Run:

```bash
git status --short --branch
```

Expected output:

```text
## feat-init-repo
```
