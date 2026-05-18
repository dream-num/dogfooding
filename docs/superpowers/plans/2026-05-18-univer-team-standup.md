# univer-team-standup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `univer-team-standup` MVP with a usable team standup skill, a Univer workbook template, and daily report output scaffolding.

**Architecture:** The workbook is the product surface. `skills/univer-team-standup/SKILL.md` defines the agent protocol, `ops/team-ops.univer` is generated through `univer-cli`, and `tools/univer-team-standup/create-template-workbook.js` makes the workbook template reproducible without editing `.univer` internals.

**Tech Stack:** Markdown, Univer CLI (`univer`/`unv`), Univer `run` scripts, static HTML output directory, Git, ripgrep (`rg`).

---

## Scope Check

The approved spec covers one MVP: daily team standup workflow around a shared workbook. This plan implements `append` and `generateDay` as skill protocol documentation, creates the workbook template, and prepares the daily report output location.

Out of scope for this plan:

- Weekly and monthly report generation.
- A real permission system beyond skill/profile conventions.
- Automatic default commit/sync.
- Direct `.univer` package editing.

## File Structure

- Modify: `README.md`
  - Responsibility: Rename the current focus from `daily report` to `univer-team-standup` and point readers to the approved spec.
- Create: `.gitignore`
  - Responsibility: Keep visual brainstorming companion files out of commits.
- Create: `skills/univer-team-standup/SKILL.md`
  - Responsibility: Document the skill triggers, role model, schemas, workflows, preview behavior, and hard rules for other agents.
- Create: `tools/univer-team-standup/create-template-workbook.js`
  - Responsibility: Build the workbook-visible template through Univer public APIs.
- Create: `ops/team-ops.univer`
  - Responsibility: Template workbook for team standup dogfooding.
- Create: `ops/reports/daily/.gitkeep`
  - Responsibility: Keep the daily report output directory in Git.
- Existing: `docs/superpowers/specs/2026-05-18-univer-team-standup-design.md`
  - Responsibility: Approved design source for this implementation.

Do not add `standup.md` unless the user explicitly asks; it is an untracked draft source.

## Implementation Tasks

### Task 1: Update Repository Entry Point And Hygiene

**Files:**
- Modify: `README.md`
- Create: `.gitignore`
- Verify: `docs/superpowers/specs/2026-05-18-univer-team-standup-design.md`

- [ ] **Step 1: Check the current worktree**

Run:

```bash
git status --short --branch
```

Expected output includes the current branch. It may also show untracked `standup.md`. Do not add `standup.md` in this task.

- [ ] **Step 2: Create `.gitignore`**

Use `apply_patch` to create `.gitignore` with this exact content:

```gitignore
.superpowers/
```

- [ ] **Step 3: Replace `README.md` with the updated project description**

Use `apply_patch` to replace `README.md` with this exact content:

```markdown
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
```

- [ ] **Step 4: Verify the README and ignore rule**

Run:

```bash
rg -n "univer-team-standup|workbook-led MVP|team-ops.univer|不自动 commit" README.md
rg -n "^\\.superpowers/$" .gitignore
```

Expected output:

```text
7:第一个项目已从 `daily report` 收敛并命名为 `univer-team-standup`。它用于让团队成员通过自己的 agent 把晨会进展写入同一个 Univer workbook，并由主持人从 workbook 生成当天晨会 HTML 报告。
9:第一版采用 workbook-led MVP：共享 workbook 是协作入口，skill 是 agent 操作协议，日报 HTML 是晨会投屏输出。默认流程只写本地并预览，不自动 commit 或 sync 远端。
20:- [docs/superpowers/specs/2026-05-18-univer-team-standup-design.md](docs/superpowers/specs/2026-05-18-univer-team-standup-design.md)：`univer-team-standup` MVP 设计。
26:实现 `univer-team-standup` MVP，包括 skill 文档、`ops/team-ops.univer` 模板 workbook 和日报输出目录。
1:.superpowers/
```

- [ ] **Step 5: Commit repository entry changes**

Run:

```bash
git add README.md .gitignore
git commit -m "docs: introduce univer team standup"
```

Expected result: command exits with code `0` and commits only `README.md` and `.gitignore`.

### Task 2: Add `univer-team-standup` Skill

**Files:**
- Create: `skills/univer-team-standup/SKILL.md`
- Verify: `docs/superpowers/specs/2026-05-18-univer-team-standup-design.md`

- [ ] **Step 1: Create the skill directory**

Run:

```bash
mkdir -p skills/univer-team-standup
```

Expected result: command exits with code `0`.

- [ ] **Step 2: Add `skills/univer-team-standup/SKILL.md`**

Use `apply_patch` to create `skills/univer-team-standup/SKILL.md` with this exact content:

```markdown
---
name: univer-team-standup
description: Use for Univer team standup dogfooding workflows: append personal standup logs to a shared Univer workbook, update the team dashboard, generate daily standup HTML reports, and commit/sync only when explicitly requested.
---

# univer-team-standup

Use this skill when a teammate wants to record standup progress, update the team standup workbook, generate the daily standup report, or explicitly publish local workbook/report changes.

This skill depends on `univer-cli`. All workbook reads, writes, previews, commits, pulls, and syncs must go through public `univer` or `unv` commands. Do not inspect, unzip, patch, or directly edit `.univer` or `.unv` internals.

## Default Paths

```text
workbook: ops/team-ops.univer
profile: .univer-agent/profile.json
dependency_check: .univer-agent/dependency-check.json
daily_reports: ops/reports/daily/
```

The workbook may start as a local template. When the team starts shared usage, the workbook must be bound to the shared remote. If `univer pull ops/team-ops.univer` reports that no remote is bound, say that the current run is local template preview only and continue only with local writes and preview.

## Trigger Intents

Use member mode for:

- `append`
- `记录进展`
- `同步今天进展`
- `写日报`
- `更新晨会表`
- requests to summarize visible work into the standup workbook

Use host mode for:

- `generateDay()`
- `generateDay(YYYY-MM-DD)`
- `genarateDay()` and `genarateDay(YYYY-MM-DD)` spelling aliases
- `生成晨会日报`
- `生成当天日报`

Use explicit publish mode only when the user says:

- `commit`
- `sync`
- `提交`
- `同步远端`
- `发布`

## Roles

This is one skill with two execution roles.

`member` can:

- append rows to the current profile's `personal_sheet`
- update only the current profile's row in `_Dashboard`
- write `_Audit` entries for its own actions
- preview the workbook

`member` must not:

- write another person's `log__*` sheet
- update another person's `_Dashboard` row
- update `_Dashboard` global summary cells
- write `_Reports`
- commit or sync unless the user explicitly asks

`host` can:

- read `_People` and all active members' `log__*` sheets
- generate daily HTML reports
- append `_Reports` rows
- refresh `_Dashboard` global summary cells and report links
- write `_Audit` entries for report generation
- preview the workbook and HTML report

Before host actions, read `.univer-agent/profile.json`. If `standup_roles` does not include `host`, ask the user to confirm host authorization or update the profile first.

## Profile

If `.univer-agent/profile.json` is missing, initialize it before writing workbook data. Required fields:

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
  "standup_roles": ["member"]
}
```

Do not guess missing `owner_id`, `display_name`, `agent_id`, or `personal_sheet`. Ask the user for missing required identity fields.

## Workbook Schema

Expected sheets:

```text
_Dashboard
_People
_Reports
_Audit
log__<owner_id>
```

`_Dashboard` header:

```csv
owner_id,display_name,update_status,yesterday,today,blocker,risk,next_action,last_log_id,last_updated_at,preview_status,report_path
```

`_People` header:

```csv
owner_id,display_name,github_handle,agent_id,personal_sheet,default_repo,default_project,timezone,standup_roles,active,updated_at
```

`_Reports` header:

```csv
report_id,report_type,date_range,generated_at,generated_by,output_format,output_path,source_sheets,source_rows,commit_ref,sync_status,preview_status,review_url,raw_note
```

`_Audit` header:

```csv
audit_id,created_at,owner_id,agent_id,role,action,sheet,range,log_id,before_summary,after_summary,commit_ref,review_url,status,raw_note
```

Personal log header:

```csv
log_id,date,owner_id,work_item_title,status,priority,blocker,risk,next_action,repo,branch,work_item_ref,category,area,size,yesterday,today,impact,evidence,source,agent_id,confidence,raw_note,created_at,verified_at,checksum
```

## Member `append` Workflow

1. Check `univer` or `unv` availability.
2. Check whether dependency verification is needed. Avoid weekly network checks unless the state file is missing, older than 7 days, the user requests an update, or a CLI/skill failure suggests a version problem.
3. Read `.univer-agent/profile.json`; initialize missing profile only after collecting required identity fields.
4. Run `univer pull ops/team-ops.univer` before writing. If the workbook is an unbound local template, state that clearly and continue only as local preview.
5. Inspect workbook-visible state with `univer inspect workbook` and bounded `univer pipe out` or `univer inspect range`.
6. Generate candidate log rows only from visible evidence:
   - user-provided text
   - current conversation work
   - current repo branch, commits, diffs, and test output
   - pasted or accessible GitHub issue/PR content
   - existing workbook records
7. Show the candidate rows to the user before writing. Wait for confirmation.
8. Generate `log_id` as `YYYYMMDD-<owner_id>-<seq>` by reading existing same-day rows.
9. Write only to `profile.personal_sheet`.
10. Read back the written range and verify key fields.
11. Update only the current owner's row in `_Dashboard`.
12. Append an `_Audit` row.
13. Preview with `univer view ops/team-ops.univer --no-open --json` or `univer view ops/team-ops.univer --open --json` depending on the environment.
14. Stop. Do not commit or sync by default.

## Host `generateDay` Workflow

1. Read profile and confirm `standup_roles` includes `host`, or get explicit host authorization from the user.
2. Determine target date. Default to today in the profile timezone.
3. Run `univer pull ops/team-ops.univer`. If the workbook is an unbound local template, state that the report is based on local template data.
4. Read `_People` and all active members' `log__*` sheets.
5. If current conversation work has not been appended to the workbook, ask whether to append first. Do not mix unpersisted conversation data into the report.
6. Generate `ops/reports/daily/YYYY-MM-DD-daily.html`.
7. Append a `_Reports` row.
8. Refresh `_Dashboard` global summary and report link cells.
9. Read back `_Reports` and `_Dashboard`.
10. Preview the workbook and report.
11. Stop. Do not commit or sync by default.

## Daily HTML Requirements

The daily HTML is a static report for standup projection with evidence preserved.

- First page: team overview, date, updated count, missing count, blocker count, risk count, generated time, source workbook.
- One page per active member, ordered by `_People`.
- Member pages show yesterday, today, blocker, risk, and next action.
- Evidence links stay visible.
- Long raw notes go inside collapsed `<details>`.
- Missing updates are shown as `No update / Needs follow-up`.
- AI-inferred content must be marked `AI inferred, needs human review` with confidence and evidence.

## Explicit Commit And Sync

Only commit or sync when the user explicitly asks.

Before commit/sync:

1. Run `univer status ops/team-ops.univer`.
2. Summarize workbook and report file changes.
3. Confirm there is no conflict.

If there is a conflict or the status needs human review, stop and explain the review scope. If there is no conflict, run `univer commit` and `univer sync` with a concise message.

## User-Facing Success Output

After append:

```text
已写入本地晨会表并完成预览，尚未提交或同步远端。

- owner: <owner_id>
- sheet: <personal_sheet>
- log_id: <log_id>
- dashboard: updated current owner row
- preview: <view_url_or_status>
- next: 如需发布，请明确要求 commit/sync
```

After generateDay:

```text
已生成本地晨会日报并完成预览，尚未提交或同步远端。

- report: daily
- range: <date>
- output: ops/reports/daily/<date>-daily.html
- dashboard: refreshed report summary
- preview: <view_url_or_status>
- next: 如需发布，请明确要求 commit/sync
```

## Hard Rules

- Do not edit `.univer` or `.unv` internals.
- Do not write another member's personal sheet from member mode.
- Do not update another member's dashboard row from member mode.
- Do not generate facts from memory.
- Do not mark work as `done` without evidence.
- Do not silently skip read-back verification.
- Do not claim the workbook was shared or pulled when it was only local template preview.
- Do not automatically commit or sync.
```

- [ ] **Step 3: Verify skill metadata and hard rules**

Run:

```bash
rg -n "name: univer-team-standup|append|generateDay|member|host|Do not automatically commit or sync|Personal log header" skills/univer-team-standup/SKILL.md
```

Expected result: output contains matches for the skill name, both roles, `append`, `generateDay`, `Personal log header`, and `Do not automatically commit or sync`.

- [ ] **Step 4: Commit the skill**

Run:

```bash
git add skills/univer-team-standup/SKILL.md
git commit -m "docs: add univer team standup skill"
```

Expected result: command exits with code `0` and commits only the skill file.

### Task 3: Add Reproducible Workbook Template Script

**Files:**
- Create: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Create the tool directory**

Run:

```bash
mkdir -p tools/univer-team-standup
```

Expected result: command exits with code `0`.

- [ ] **Step 2: Add the workbook creation script**

Use `apply_patch` to create `tools/univer-team-standup/create-template-workbook.js` with this exact content:

```javascript
() => {
  const workbook = univerAPI.getActiveWorkbook();

  const desiredSheets = [
    { name: "_Dashboard", rows: 60, cols: 12 },
    { name: "_People", rows: 80, cols: 11 },
    { name: "_Reports", rows: 120, cols: 14 },
    { name: "_Audit", rows: 200, cols: 15 },
    { name: "log__yangluoshen", rows: 200, cols: 26 },
    { name: "log__host", rows: 200, cols: 26 },
    { name: "log__example-member", rows: 200, cols: 26 },
  ];

  const ensureSheet = ({ name, rows, cols }) => {
    const existing = workbook.getSheetByName(name);
    return existing || workbook.create(name, rows, cols);
  };

  const sheets = {};
  desiredSheets.forEach((definition) => {
    sheets[definition.name] = ensureSheet(definition);
  });

  workbook.getSheets().forEach((sheet) => {
    const name = sheet.getSheetName();
    if (!desiredSheets.some((definition) => definition.name === name)) {
      workbook.deleteSheet(sheet.getSheetId());
    }
  });

  const styleHeader = (range, background, color = "#17202A") => {
    range
      .setBackgroundColor(background)
      .setFontWeight("bold")
      .setFontColor(color)
      .setVerticalAlignment("middle");
  };

  const setWidths = (sheet, widths) => {
    widths.forEach((width, index) => sheet.setColumnWidth(index, width));
  };

  const dashboard = sheets["_Dashboard"];
  dashboard.getRange("A1:L60").clear();
  dashboard.setHiddenGridlines(true);
  dashboard.setGridLinesColor("#D7DEE8");
  dashboard.setFrozenRows(7);
  dashboard.setFrozenColumns(2);
  dashboard.getRange("A1:L1").merge({ isForceMerge: true });
  dashboard.getRange("A1").setValue("Univer Team Standup");
  dashboard
    .getRange("A1:L1")
    .setBackgroundColor("#18212D")
    .setFontColor("#F5F8FB")
    .setFontWeight("bold")
    .setFontSize(16)
    .setVerticalAlignment("middle");
  dashboard.setRowHeight(0, 34);
  dashboard.getRange("A3:H4").setValues([
    ["date", "2026-05-18", "updated", "2/3", "blockers", "1", "daily_report", "Not generated"],
    ["mode", "local template preview", "sync_status", "not_synced", "risks", "1", "preview", "use univer view"],
  ]);
  dashboard.getRange("A3:H4").setBackgroundColor("#F7F9FC").setVerticalAlignment("middle");
  dashboard.getRange("A7:L7").setValues([[
    "owner_id",
    "display_name",
    "update_status",
    "yesterday",
    "today",
    "blocker",
    "risk",
    "next_action",
    "last_log_id",
    "last_updated_at",
    "preview_status",
    "report_path",
  ]]);
  dashboard.getRange("A8:L10").setValues([
    [
      "yangluoshen",
      "yangluoshen",
      "updated",
      "Confirmed workbook-led MVP scope",
      "Create skill and workbook template",
      "",
      "Remote workbook is not bound yet",
      "Bind shared workbook before team usage",
      "20260518-yangluoshen-001",
      "2026-05-18T09:00:00+08:00",
      "local preview",
      "",
    ],
    [
      "host",
      "Standup Host",
      "updated",
      "Prepared daily report flow",
      "Generate daily standup HTML",
      "",
      "",
      "Run generateDay after members append",
      "",
      "2026-05-18T09:05:00+08:00",
      "local preview",
      "",
    ],
    [
      "example-member",
      "Example Member",
      "No update / Needs follow-up",
      "",
      "",
      "",
      "",
      "Ask member to append before standup",
      "",
      "",
      "pending",
      "",
    ],
  ]);
  styleHeader(dashboard.getRange("A7:L7"), "#EEF3F8");
  dashboard.getRange("A8:L10").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  setWidths(dashboard, [140, 150, 170, 260, 280, 220, 220, 260, 210, 230, 160, 260]);

  const people = sheets["_People"];
  people.getRange("A1:K80").clear();
  people.setHiddenGridlines(true);
  people.setFrozenRows(1);
  people.setFrozenColumns(2);
  people.getRange("A1:K1").setValues([[
    "owner_id",
    "display_name",
    "github_handle",
    "agent_id",
    "personal_sheet",
    "default_repo",
    "default_project",
    "timezone",
    "standup_roles",
    "active",
    "updated_at",
  ]]);
  people.getRange("A2:K4").setValues([
    [
      "yangluoshen",
      "yangluoshen",
      "yangluoshen",
      "codex-yangluoshen-local",
      "log__yangluoshen",
      "dream-num/univer-cli",
      "Univer CLI",
      "Asia/Shanghai",
      "member,host",
      "TRUE",
      "2026-05-18T09:00:00+08:00",
    ],
    [
      "host",
      "Standup Host",
      "",
      "codex-standup-host-local",
      "log__host",
      "dream-num/univer-cli",
      "Univer CLI",
      "Asia/Shanghai",
      "host",
      "TRUE",
      "2026-05-18T09:05:00+08:00",
    ],
    [
      "example-member",
      "Example Member",
      "",
      "codex-example-member-local",
      "log__example-member",
      "dream-num/univer-cli",
      "Univer CLI",
      "Asia/Shanghai",
      "member",
      "TRUE",
      "2026-05-18T09:10:00+08:00",
    ],
  ]);
  styleHeader(people.getRange("A1:K1"), "#EEF3F8");
  people.getRange("A1:K4").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  setWidths(people, [150, 160, 160, 230, 190, 220, 180, 150, 160, 100, 230]);

  const reports = sheets["_Reports"];
  reports.getRange("A1:N120").clear();
  reports.setHiddenGridlines(true);
  reports.setFrozenRows(1);
  reports.getRange("A1:N1").setValues([[
    "report_id",
    "report_type",
    "date_range",
    "generated_at",
    "generated_by",
    "output_format",
    "output_path",
    "source_sheets",
    "source_rows",
    "commit_ref",
    "sync_status",
    "preview_status",
    "review_url",
    "raw_note",
  ]]);
  styleHeader(reports.getRange("A1:N1"), "#EEF3F8");
  reports.getRange("A1:N1").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  setWidths(reports, [180, 130, 160, 230, 170, 130, 300, 220, 140, 160, 140, 160, 220, 300]);

  const audit = sheets["_Audit"];
  audit.getRange("A1:O200").clear();
  audit.setHiddenGridlines(true);
  audit.setFrozenRows(1);
  audit.getRange("A1:O1").setValues([[
    "audit_id",
    "created_at",
    "owner_id",
    "agent_id",
    "role",
    "action",
    "sheet",
    "range",
    "log_id",
    "before_summary",
    "after_summary",
    "commit_ref",
    "review_url",
    "status",
    "raw_note",
  ]]);
  styleHeader(audit.getRange("A1:O1"), "#EEF3F8");
  audit.getRange("A1:O1").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  setWidths(audit, [190, 230, 150, 230, 110, 170, 170, 120, 210, 260, 260, 160, 220, 120, 320]);

  const log = sheets["log__yangluoshen"];
  const logHeaders = [
    "log_id",
    "date",
    "owner_id",
    "work_item_title",
    "status",
    "priority",
    "blocker",
    "risk",
    "next_action",
    "repo",
    "branch",
    "work_item_ref",
    "category",
    "area",
    "size",
    "yesterday",
    "today",
    "impact",
    "evidence",
    "source",
    "agent_id",
    "confidence",
    "raw_note",
    "created_at",
    "verified_at",
    "checksum",
  ];
  const logWidths = [
    230,
    120,
    150,
    280,
    120,
    100,
    240,
    260,
    260,
    220,
    220,
    170,
    130,
    150,
    90,
    320,
    320,
    260,
    320,
    140,
    230,
    120,
    340,
    230,
    230,
    280,
  ];
  const styleLogSheet = (sheet) => {
    sheet.setHiddenGridlines(true);
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(5);
    styleHeader(sheet.getRange("A1:I1"), "#DDEBFF");
    styleHeader(sheet.getRange("J1:O1"), "#EEF3F8");
    styleHeader(sheet.getRange("P1:S1"), "#EAF7EF");
    styleHeader(sheet.getRange("T1:Z1"), "#F7F2E8");
    setWidths(sheet, logWidths);
  };
  log.getRange("A1:Z200").clear();
  log.getRange("A1:Z1").setValues([logHeaders]);
  log.getRange("A2:Z2").setValues([[
    "20260518-yangluoshen-001",
    "2026-05-18",
    "yangluoshen",
    "Design univer-team-standup MVP",
    "done",
    "P1",
    "",
    "Remote workbook is not bound yet",
    "Create skill and template workbook",
    "dream-num/univer-cli",
    "feat-univer-morning-standup",
    "SPEC#2026-05-18",
    "feature",
    "Dogfooding",
    "M",
    "Confirmed MVP scope and workbook-led approach",
    "Write implementation plan and create template",
    "Team can dogfood standup workflow",
    "docs/superpowers/specs/2026-05-18-univer-team-standup-design.md",
    "manual",
    "codex-yangluoshen-local",
    0.95,
    "Seed example row for local template preview.",
    "2026-05-18T09:00:00+08:00",
    "2026-05-18T09:00:00+08:00",
    "seed-20260518-yangluoshen-001",
  ]]);
  styleLogSheet(log);
  log.getRange("A1:Z2").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");

  ["log__host", "log__example-member"].forEach((sheetName) => {
    const personalSheet = sheets[sheetName];
    personalSheet.getRange("A1:Z200").clear();
    personalSheet.getRange("A1:Z1").setValues([logHeaders]);
    styleLogSheet(personalSheet);
    personalSheet.getRange("A1:Z1").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  });

  return {
    success: true,
    sheets: workbook.getSheets().map((sheet) => sheet.getSheetName()),
    dashboardRange: "_Dashboard!A1:L10",
    personalLogRange: "log__yangluoshen!A1:Z2",
  };
};
```

- [ ] **Step 3: Verify the generator script uses public workbook APIs**

Run:

```bash
rg -n "getActiveWorkbook|getSheetByName|create\\(|deleteSheet|getRange|setValues|setFrozenRows|setFrozenColumns|setColumnWidth|return \\{" tools/univer-team-standup/create-template-workbook.js
```

Expected output includes matches for the public APIs listed in the command. There should be no references to `manifest`, `snapshot`, `fs`, `zip`, `.univer/`, or `.unv/`.

- [ ] **Step 4: Commit the workbook generator script**

Run:

```bash
git add tools/univer-team-standup/create-template-workbook.js
git commit -m "chore: add team standup workbook generator"
```

Expected result: command exits with code `0` and commits only the generator script.

### Task 4: Generate And Verify The Workbook Template

**Files:**
- Create: `ops/team-ops.univer`
- Create: `ops/reports/daily/.gitkeep`
- Use: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Verify Univer CLI is available**

Run:

```bash
command -v univer || command -v unv
univer --version || unv --version
```

Expected result: first command prints a path to `univer` or `unv`; second command prints a version string.

- [ ] **Step 2: Create output directories and daily report marker**

Run:

```bash
mkdir -p ops/reports/daily
```

Use `apply_patch` to create `ops/reports/daily/.gitkeep` with this exact content:

```text
Generated daily HTML reports are written here.
```

- [ ] **Step 3: Create a new workbook package**

Run:

```bash
test ! -e ops/team-ops.univer
univer new ops/team-ops.univer --json
```

Expected result: the first command exits with code `0`; the second command prints JSON containing `"success":true` and creates `ops/team-ops.univer`.

- [ ] **Step 4: Apply the template workbook script**

Run:

```bash
univer run ops/team-ops.univer --file tools/univer-team-standup/create-template-workbook.js
```

Expected output contains:

```json
"success": true
```

It should also include the sheet names `_Dashboard`, `_People`, `_Reports`, `_Audit`, `log__yangluoshen`, `log__host`, and `log__example-member`.

- [ ] **Step 5: Verify workbook-level visible state**

Run:

```bash
univer inspect workbook ops/team-ops.univer > /tmp/team-ops.inspect.md
rg -n "_Dashboard|_People|_Reports|_Audit|log__yangluoshen|log__host|log__example-member" /tmp/team-ops.inspect.md
```

Expected output includes all seven sheet names.

- [ ] **Step 6: Verify dashboard visible anchors**

Run:

```bash
univer pipe out ops/team-ops.univer --range '_Dashboard!A1:L10' --format tsv > /tmp/team-ops-dashboard.tsv
rg -n "Univer Team Standup|owner_id|yangluoshen|No update / Needs follow-up|local preview" /tmp/team-ops-dashboard.tsv
```

Expected output includes those five visible anchors.

- [ ] **Step 7: Verify personal log header ordering**

Run:

```bash
univer pipe out ops/team-ops.univer --range 'log__yangluoshen!A1:Z2' --format tsv > /tmp/team-ops-log.tsv
head -n 1 /tmp/team-ops-log.tsv
rg -n "log_id	date	owner_id	work_item_title	status	priority	blocker	risk	next_action	repo	branch	work_item_ref	category	area	size	yesterday	today	impact	evidence	source	agent_id	confidence	raw_note	created_at	verified_at	checksum" /tmp/team-ops-log.tsv
```

Expected result: the header starts with the key standup fields and contains all 26 fields in the approved order.

- [ ] **Step 8: Verify preview URL can be created without opening a browser**

Run:

```bash
univer view ops/team-ops.univer --no-open --json
```

Expected output contains JSON with `"ok":true`, a `url`, and `"workbook":"ops/team-ops.univer"` or an absolute path ending in `ops/team-ops.univer`.

- [ ] **Step 9: Commit workbook template and report directory**

Run:

```bash
git add ops/team-ops.univer ops/reports/daily/.gitkeep
git commit -m "feat: add team standup workbook template"
```

Expected result: command exits with code `0` and commits the workbook template plus daily report marker.

### Task 5: Final Acceptance Verification

**Files:**
- Verify: `README.md`
- Verify: `.gitignore`
- Verify: `skills/univer-team-standup/SKILL.md`
- Verify: `tools/univer-team-standup/create-template-workbook.js`
- Verify: `ops/team-ops.univer`
- Verify: `ops/reports/daily/.gitkeep`
- Verify: `docs/superpowers/specs/2026-05-18-univer-team-standup-design.md`

- [ ] **Step 1: Verify no unfinished markers in committed text files**

Run:

```bash
rg -n 'TB''D|TO''DO|FIX''ME|待''定|未''定|xx''xx|xx''x' README.md .gitignore skills/univer-team-standup/SKILL.md tools/univer-team-standup/create-template-workbook.js docs/superpowers/specs/2026-05-18-univer-team-standup-design.md
```

Expected result: no output and exit code `1`.

- [ ] **Step 2: Verify workbook can still be inspected after commits**

Run:

```bash
univer inspect workbook ops/team-ops.univer > /tmp/team-ops.final.inspect.md
rg -n "_Dashboard|_People|_Reports|_Audit|log__yangluoshen|log__host|log__example-member" /tmp/team-ops.final.inspect.md
```

Expected output includes all seven sheet names.

- [ ] **Step 3: Verify the skill and workbook agree on schemas**

Run:

```bash
univer pipe out ops/team-ops.univer --range '_People!A1:K1' --format tsv > /tmp/team-ops-people-header.tsv
univer pipe out ops/team-ops.univer --range '_Reports!A1:N1' --format tsv > /tmp/team-ops-reports-header.tsv
univer pipe out ops/team-ops.univer --range '_Audit!A1:O1' --format tsv > /tmp/team-ops-audit-header.tsv
univer pipe out ops/team-ops.univer --range 'log__yangluoshen!A1:Z1' --format tsv > /tmp/team-ops-log-header.tsv
rg -n "owner_id	display_name	github_handle	agent_id	personal_sheet	default_repo	default_project	timezone	standup_roles	active	updated_at" /tmp/team-ops-people-header.tsv
rg -n "report_id	report_type	date_range	generated_at	generated_by	output_format	output_path	source_sheets	source_rows	commit_ref	sync_status	preview_status	review_url	raw_note" /tmp/team-ops-reports-header.tsv
rg -n "audit_id	created_at	owner_id	agent_id	role	action	sheet	range	log_id	before_summary	after_summary	commit_ref	review_url	status	raw_note" /tmp/team-ops-audit-header.tsv
rg -n "log_id	date	owner_id	work_item_title	status	priority	blocker	risk	next_action	repo	branch	work_item_ref	category	area	size	yesterday	today	impact	evidence	source	agent_id	confidence	raw_note	created_at	verified_at	checksum" /tmp/team-ops-log-header.tsv
```

Expected result: each `rg` command prints one matching header line.

- [ ] **Step 4: Verify default flow is preview-first and publish-gated**

Run:

```bash
rg -n "Do not automatically commit or sync|Stop\\. Do not commit or sync by default|Only commit or sync when the user explicitly asks|univer status ops/team-ops.univer" skills/univer-team-standup/SKILL.md
```

Expected output includes all four publish-gate phrases.

- [ ] **Step 5: Verify committed scope**

Run:

```bash
git status --short --branch
git log --oneline -5
```

Expected status after all task commits:

```text
## feat-univer-morning-standup
?? standup.md
```

If `.superpowers/` does not appear because `.gitignore` is working, that is expected. Leave `standup.md` untracked unless the user asks to preserve, move, or delete the draft.

- [ ] **Step 6: Summarize implementation evidence**

Report these facts to the user:

```text
Implemented univer-team-standup MVP scaffolding.

- Skill: skills/univer-team-standup/SKILL.md
- Workbook template: ops/team-ops.univer
- Workbook sheets verified: _Dashboard, _People, _Reports, _Audit, log__yangluoshen, log__host, log__example-member
- Daily report output directory: ops/reports/daily/
- Default publish behavior: preview only; commit/sync requires explicit user request
- Untracked draft preserved: standup.md
```
