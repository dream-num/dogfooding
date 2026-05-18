# Univer Team Standup First-Use Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix first-day adoption gaps in `univer-team-standup` so a new teammate can initialize identity, register in the workbook, append safely, and understand when their updates become visible to the host.

**Architecture:** Keep the workbook as the collaboration surface and the skill as the agent protocol. Add a self-onboarding path before `append`, harden the template so sample data cannot pollute real standups, and make local-only versus shared visibility explicit in docs and success output.

**Tech Stack:** Markdown, Univer CLI (`univer`/`unv`), Univer `run` scripts, Git, ripgrep (`rg`), shell commands.

---

## Scope Check

This plan fixes first-use and adoption risks found during review:

- Missing `.univer-agent/profile.json` on the first member run.
- Missing personal `log__<owner_id>` sheet for new members.
- Missing `_People` and `_Dashboard` registration flow.
- Sample active members and static dashboard counts polluting real reports.
- Local write behavior being mistaken for team-visible publishing.
- Personal agent configuration and editor swap files appearing in `git status`.
- Ambiguous wording around `同步今天进展` versus `同步远端`.

Out of scope for this plan:

- A full permission system beyond profile and skill protocol boundaries.
- A complete reusable `append` CLI implementation.
- Weekly and monthly reports.
- Automatic default commit or sync.

## File Structure

- Modify: `.gitignore`
  - Responsibility: Ignore local agent identity files and editor swap artifacts.
- Modify: `README.md`
  - Responsibility: Reflect that the MVP scaffold exists and document the first-use adoption path.
- Modify: `skills/univer-team-standup/SKILL.md`
  - Responsibility: Add first-run onboarding, self-registration boundaries, local visibility warnings, date/timezone rules, and trigger disambiguation.
- Modify: `tools/univer-team-standup/create-template-workbook.js`
  - Responsibility: Regenerate a neutral template workbook with inactive sample rows and no live-looking dashboard metrics.
- Replace via Univer CLI: `ops/team-ops.univer`
  - Responsibility: Workbook-visible template generated through public `univer` commands.
- Create: `docs/univer-team-standup-first-run.md`
  - Responsibility: Human-readable first-day runbook for members and hosts.

Do not add `standup.md`; it is an untracked draft source. Do not directly edit files inside `ops/team-ops.univer`; replace the package only with output produced by `univer` commands.

## Implementation Tasks

### Task 1: Add Repo Hygiene For Local Agent State

**Files:**
- Modify: `.gitignore`
- Verify: `skills/univer-team-standup/.SKILL.md.swp`

- [ ] **Step 1: Check current worktree**

Run:

```bash
git status --short --branch
```

Expected: branch is `feat-univer-morning-standup`. Untracked `standup.md` may be present. Untracked `skills/univer-team-standup/.SKILL.md.swp` may be present. Do not add either file.

- [ ] **Step 2: Replace `.gitignore` with hardened ignore rules**

Use `apply_patch` to make `.gitignore` exactly:

```gitignore
.superpowers/
.univer-agent/
*.swp
.*.swp
```

- [ ] **Step 3: Verify ignore behavior**

Run:

```bash
git check-ignore -v .superpowers/session.json .univer-agent/profile.json skills/univer-team-standup/.SKILL.md.swp
git status --short --branch
```

Expected: `git check-ignore` prints one matching rule for each path. `git status` still shows untracked `standup.md`, but no longer shows `skills/univer-team-standup/.SKILL.md.swp`.

- [ ] **Step 4: Commit hygiene update**

Run:

```bash
git add .gitignore
git commit -m "chore: ignore standup local agent state"
```

Expected: commit succeeds and includes only `.gitignore`.

### Task 2: Add First-Run Onboarding To The Skill

**Files:**
- Modify: `skills/univer-team-standup/SKILL.md`

- [ ] **Step 1: Add onboarding triggers**

In `skills/univer-team-standup/SKILL.md`, insert this block immediately before `Use member mode for:` under `## Trigger Intents`:

```markdown
Use onboarding mode for:

- `onboard`
- `init profile`
- `初始化晨会身份`
- `注册成员`
- first `append` request when `.univer-agent/profile.json` is missing
```

Then change the existing member trigger bullet:

```markdown
- `同步今天进展`
```

to:

```markdown
- `同步今天进展` (local append only; this does not mean remote sync)
```

- [ ] **Step 2: Add self-registration permissions**

In the `member can:` list, add these bullets after `preview the workbook`:

```markdown
- create `.univer-agent/profile.json` for the current user during onboarding
- create the current user's own `log__<owner_id>` sheet during onboarding if it is missing
- add or update the current user's own `_People` row during onboarding
```

In the `member must not:` list, add these bullets after `write another person's log__* sheet`:

```markdown
- create or update another person's `_People` row
- mark another person active or inactive
```

- [ ] **Step 3: Replace the profile section**

Replace the current `## Profile` section with this exact content:

```markdown
## Profile

If `.univer-agent/profile.json` is missing, run the First-Run Onboarding Workflow before writing workbook data.

Required fields:

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

`owner_id` must be stable, lowercase, and safe for sheet names. Use `^[a-z0-9][a-z0-9_-]{1,39}$`.

`personal_sheet` must be `log__<owner_id>` unless the user explicitly confirms a different sheet name.

`timezone` controls `date`, `log_id`, and default `generateDay()` date. Do not use the runtime machine timezone when a profile timezone is present.

Never commit `.univer-agent/profile.json` or `.univer-agent/dependency-check.json`.
```

- [ ] **Step 4: Add first-run onboarding workflow**

Insert this section immediately after `## Profile`:

```markdown
## First-Run Onboarding Workflow

Run this workflow when the user asks to onboard/register/init, or when `append` is requested and `.univer-agent/profile.json` is missing.

1. Check `univer` or `unv` availability.
2. Collect required identity fields: `owner_id`, `display_name`, `github_handle`, `agent_id`, `timezone`, `default_repo`, and `default_project`.
3. Propose `personal_sheet` as `log__<owner_id>` and wait for user confirmation.
4. Write `.univer-agent/profile.json` locally and read it back.
5. Run `univer pull ops/team-ops.univer` before workbook writes. If the workbook is an unbound local template, state that onboarding is local preview only.
6. Inspect `_People`, `_Dashboard`, and workbook sheet names through `univer inspect workbook` and bounded `univer pipe out`.
7. If `_People` already has `owner_id` with a different `personal_sheet`, stop and show the conflicting row.
8. If `profile.personal_sheet` is missing, create it through `univer run` with the Personal log header from this skill.
9. Add or update only the current user's `_People` row with `active=TRUE` and `standup_roles=member` unless the user explicitly confirms `host`.
10. Add or update only the current user's `_Dashboard` row with `update_status=No update / Needs append`.
11. Append an `_Audit` row with `action=onboard`.
12. Read back the created or updated `_People`, `_Dashboard`, and personal sheet header ranges.
13. Preview with `univer view ops/team-ops.univer --no-open --json` or `univer view ops/team-ops.univer --open --json` depending on the environment.
14. Stop. Do not commit or sync by default.

After local onboarding, tell the user that the host will not see this registration until the user explicitly asks to commit/sync or the workbook is otherwise published through the team workflow.
```

- [ ] **Step 5: Update append workflow for missing profile and missing sheet**

In `## Member append Workflow`, replace steps 3 and 4:

```markdown
3. Read `.univer-agent/profile.json`; initialize missing profile only after collecting required identity fields.
4. Run `univer pull ops/team-ops.univer` before writing. If the workbook is an unbound local template, state that clearly and continue only as local preview.
```

with:

```markdown
3. Read `.univer-agent/profile.json`. If it is missing, run the First-Run Onboarding Workflow, then ask the user whether to continue with append.
4. Run `univer pull ops/team-ops.univer` before writing. If the workbook is an unbound local template, state that clearly and continue only as local preview.
5. Inspect workbook-visible state with `univer inspect workbook` and bounded `univer pipe out` or `univer inspect range`.
6. If `profile.personal_sheet`, the current owner `_People` row, or the current owner `_Dashboard` row is missing, run the onboarding repair subset for only the current owner and read back the repaired ranges before generating candidate rows.
```

Then renumber the remaining steps in that section so they stay sequential.

- [ ] **Step 6: Update user-facing append success output**

In `After append:` replace the output block with:

```text
已写入本地晨会表并完成预览，尚未提交或同步远端。

- owner: <owner_id>
- sheet: <personal_sheet>
- log_id: <log_id>
- dashboard: updated current owner row
- preview: <view_url_or_status>
- visibility: 主持人不会看到这次本地更新，除非你明确要求 commit/sync 或团队已有其他发布流程
- next: 如需发布，请明确要求 commit/sync
```

- [ ] **Step 7: Verify skill text**

Run:

```bash
rg -n "First-Run Onboarding|onboard|注册成员|local append only|host will not see|\\.univer-agent" skills/univer-team-standup/SKILL.md
```

Expected: output includes onboarding triggers, the first-run workflow title, local visibility warning, and `.univer-agent` commit warning.

- [ ] **Step 8: Commit skill onboarding update**

Run:

```bash
git add skills/univer-team-standup/SKILL.md
git commit -m "docs: add standup first-run onboarding"
```

Expected: commit succeeds and includes only `skills/univer-team-standup/SKILL.md`.

### Task 3: Neutralize Template Sample Data

**Files:**
- Modify: `tools/univer-team-standup/create-template-workbook.js`
- Replace via Univer CLI: `ops/team-ops.univer`

- [ ] **Step 1: Check workbook has no uncommitted tracked edits before replacement**

Run:

```bash
git diff -- ops/team-ops.univer
git status --short -- ops/team-ops.univer
```

Expected: no output. If output appears, stop and inspect before replacing the workbook package.

- [ ] **Step 2: Replace desired sample sheet names**

In `tools/univer-team-standup/create-template-workbook.js`, replace the `desiredSheets` block with:

```javascript
  const desiredSheets = [
    { name: "_People", rows: 80, cols: 11 },
    { name: "_Reports", rows: 120, cols: 14 },
    { name: "_Audit", rows: 200, cols: 15 },
    { name: "log__sample_member", rows: 200, cols: 26 },
    { name: "log__sample_host", rows: 200, cols: 26 },
    { name: "_Dashboard", rows: 60, cols: 12 },
  ];
```

- [ ] **Step 3: Replace dashboard summary and rows**

Replace the dashboard summary `setValues` block with:

```javascript
  dashboard.getRange("A3:H4").setValues([
    ["date", "Use generateDay date", "updated", "0/0", "blockers", "0", "daily_report", "Not generated"],
    ["mode", "local template preview", "sync_status", "not_synced", "risks", "0", "preview", "use univer view"],
  ]);
```

Replace the dashboard sample row block with:

```javascript
  dashboard.getRange("A8:L9").setValues([
    [
      "sample-member",
      "Sample Member",
      "sample / inactive",
      "Example yesterday text",
      "Example today text",
      "",
      "",
      "Run onboarding to create a real member row",
      "",
      "",
      "sample only",
      "",
    ],
    [
      "sample-host",
      "Sample Host",
      "sample / inactive",
      "",
      "Generate daily standup HTML after members append",
      "",
      "",
      "Run generateDay after real members append",
      "",
      "",
      "sample only",
      "",
    ],
  ]);
```

Then change the dashboard border range from:

```javascript
  dashboard.getRange("A8:L10").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
```

to:

```javascript
  dashboard.getRange("A8:L9").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
```

- [ ] **Step 4: Replace `_People` sample rows**

Replace the `_People` sample `setValues` block with:

```javascript
  people.getRange("A2:K3").setValues([
    [
      "sample-member",
      "Sample Member",
      "",
      "codex-sample-member-local",
      "log__sample_member",
      "dream-num/univer-cli",
      "Univer CLI",
      "Asia/Shanghai",
      "member",
      "FALSE",
      "2026-05-18T09:10:00+08:00",
    ],
    [
      "sample-host",
      "Sample Host",
      "",
      "codex-sample-host-local",
      "log__sample_host",
      "dream-num/univer-cli",
      "Univer CLI",
      "Asia/Shanghai",
      "host",
      "FALSE",
      "2026-05-18T09:15:00+08:00",
    ],
  ]);
```

Then change the `_People` border range from:

```javascript
  people.getRange("A1:K4").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
```

to:

```javascript
  people.getRange("A1:K3").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
```

- [ ] **Step 5: Replace personal log sheet initialization**

Replace:

```javascript
  const log = sheets["log__yangluoshen"];
```

with:

```javascript
  const log = sheets["log__sample_member"];
```

Replace the sample personal log row with:

```javascript
  log.getRange("A2:Z2").setValues([[
    "20260518-sample-member-001",
    "2026-05-18",
    "sample-member",
    "Example standup item",
    "needs_review",
    "P2",
    "",
    "",
    "Run onboarding before using the workbook for a real member",
    "dream-num/univer-cli",
    "feat-univer-morning-standup",
    "SAMPLE#2026-05-18",
    "example",
    "Dogfooding",
    "S",
    "Example yesterday text",
    "Example today text",
    "Demonstrates column layout only",
    "docs/univer-team-standup-first-run.md",
    "sample",
    "codex-sample-member-local",
    0.5,
    "Inactive sample row. Host reports must ignore this row because _People.active is FALSE.",
    "2026-05-18T09:10:00+08:00",
    "",
    "sample-20260518-sample-member-001",
  ]]);
```

Replace:

```javascript
  clearTemplateRange(log, "log__yangluoshen", "A1:Z200");
```

with:

```javascript
  clearTemplateRange(log, "log__sample_member", "A1:Z200");
```

Replace:

```javascript
  ["log__host", "log__example-member"].forEach((sheetName) => {
```

with:

```javascript
  ["log__sample_host"].forEach((sheetName) => {
```

Update the return object:

```javascript
    dashboardRange: "_Dashboard!A1:L9",
    personalLogRange: "log__sample_member!A1:Z2",
```

- [ ] **Step 6: Regenerate workbook through public Univer commands**

Run:

```bash
rm -rf /tmp/univer-team-standup-template.univer
univer new /tmp/univer-team-standup-template.univer --name "Univer Team Standup"
univer run /tmp/univer-team-standup-template.univer --file tools/univer-team-standup/create-template-workbook.js
univer commit /tmp/univer-team-standup-template.univer --message "initialize team standup workbook template"
rm -rf ops/team-ops.univer
cp -a /tmp/univer-team-standup-template.univer ops/team-ops.univer
```

Expected: each command exits with code `0`. Do not edit files inside either `.univer` package directly.

- [ ] **Step 7: Verify workbook-visible state**

Run:

```bash
univer inspect workbook ops/team-ops.univer | sed -n '1,20p'
univer pipe out ops/team-ops.univer --range '_People!A1:K5' --format tsv
univer pipe out ops/team-ops.univer --range '_Dashboard!A1:L10' --format tsv
univer pipe out ops/team-ops.univer --range 'log__sample_member!A1:Z2' --format tsv
univer status ops/team-ops.univer
```

Expected:

```text
Active Sheet: _Dashboard
```

Expected `_People` output includes `sample-member` and `sample-host` with `active` equal to `FALSE`. Expected `_Dashboard` output includes `updated	0/0`, `blockers	0`, `risks	0`, and only `sample / inactive` rows. Expected `univer status` includes `pending mutations: 0`.

- [ ] **Step 8: Commit template hardening**

Run:

```bash
git add tools/univer-team-standup/create-template-workbook.js ops/team-ops.univer
git commit -m "fix: neutralize standup template sample data"
```

Expected: commit succeeds and includes only the generator and workbook package.

### Task 4: Document First-Day Member And Host Flow

**Files:**
- Create: `docs/univer-team-standup-first-run.md`
- Modify: `README.md`

- [ ] **Step 1: Create the first-run guide**

Use `apply_patch` to create `docs/univer-team-standup-first-run.md` with this exact content:

```markdown
# univer-team-standup First Run

This guide explains how the team starts using `univer-team-standup` without losing the boundary between local preview and shared visibility.

## Member: First Day

1. Ask your agent to use `univer-team-standup` and run `onboard`.
2. Provide `owner_id`, `display_name`, `github_handle`, `agent_id`, `timezone`, `default_repo`, and `default_project`.
3. Confirm the proposed `personal_sheet`, normally `log__<owner_id>`.
4. Let the agent create `.univer-agent/profile.json`, register your own `_People` row, create your own personal log sheet if missing, and create your own `_Dashboard` row.
5. Preview the workbook.
6. Ask the agent to `append` your standup update.
7. Review the candidate row before the agent writes.
8. Preview again after write.

Local onboarding and local append are not visible to the host until you explicitly ask for commit/sync or the team uses another agreed publishing flow.

## Member: Normal Morning

1. Ask your agent to `append` or `记录进展`.
2. Confirm the generated candidate row.
3. Review the workbook preview.
4. Explicitly ask for `commit/sync` only when you want to publish your local workbook changes.

## Host

1. Use a profile whose `standup_roles` includes `host`, or explicitly confirm host authorization when prompted.
2. Run `generateDay()` after members have published the updates that should be included.
3. Review missing members, blockers, risks, and evidence links.
4. Preview the workbook and daily HTML report.
5. Explicitly ask for `commit/sync` only when the report should be published.

## Shared Workbook Rule

`ops/team-ops.univer` is the team source of truth after it is bound to the shared remote. If `univer pull ops/team-ops.univer` reports that no remote is bound, the run is local template preview only.

## Local Files

Do not commit `.univer-agent/profile.json` or `.univer-agent/dependency-check.json`.
```

- [ ] **Step 2: Update README current state and first-run link**

Replace the `## 下一步` section in `README.md` with:

```markdown
## 当前可试用路径

`univer-team-standup` MVP scaffold 已包含 skill 文档、`ops/team-ops.univer` 模板 workbook 和日报输出目录。团队首日使用时先阅读 [docs/univer-team-standup-first-run.md](docs/univer-team-standup-first-run.md)，每个成员先完成本地身份 onboarding，再 append 晨会进展。

默认流程只写本地并预览。主持人只有在成员明确发布或团队完成共享同步后，才能从自己的 workbook 里读到成员更新。
```

- [ ] **Step 3: Verify docs**

Run:

```bash
rg -n "onboard|append|generateDay|not visible|不自动 commit|主持人只有" README.md docs/univer-team-standup-first-run.md
```

Expected: output includes the onboarding path, member append path, host `generateDay()` path, and local visibility warning.

- [ ] **Step 4: Commit first-run docs**

Run:

```bash
git add README.md docs/univer-team-standup-first-run.md
git commit -m "docs: add standup first-run guide"
```

Expected: commit succeeds and includes only README and first-run guide.

### Task 5: Final Acceptance Verification

**Files:**
- Verify: `.gitignore`
- Verify: `README.md`
- Verify: `skills/univer-team-standup/SKILL.md`
- Verify: `tools/univer-team-standup/create-template-workbook.js`
- Verify: `ops/team-ops.univer`
- Verify: `docs/univer-team-standup-first-run.md`

- [ ] **Step 1: Verify no placeholder language was introduced**

Run:

```bash
rg -n "T[B]D|TO[D]O|implement la[t]er|fill in deta[i]ls|appropriate error handl[i]ng" README.md docs/univer-team-standup-first-run.md skills/univer-team-standup/SKILL.md tools/univer-team-standup/create-template-workbook.js
```

Expected: no output and exit code `1`.

- [ ] **Step 2: Verify first-use safety text**

Run:

```bash
rg -n "First-Run Onboarding|\\.univer-agent/profile.json|host will not see|主持人不会看到|local append only|not visible to the host" skills/univer-team-standup/SKILL.md README.md docs/univer-team-standup-first-run.md
```

Expected: output includes the onboarding workflow, ignored profile file, and local-only visibility warnings.

- [ ] **Step 3: Verify workbook-visible template state**

Run:

```bash
univer inspect workbook ops/team-ops.univer | sed -n '1,20p'
univer pipe out ops/team-ops.univer --range '_People!A1:K5' --format tsv
univer pipe out ops/team-ops.univer --range '_Dashboard!A1:L10' --format tsv
univer status ops/team-ops.univer
```

Expected:

```text
Active Sheet: _Dashboard
```

Expected `_People` has no active real-looking sample users. Expected `_Dashboard` has neutral counts and inactive sample rows. Expected `univer status` includes `pending mutations: 0`.

- [ ] **Step 4: Verify ignored local files do not pollute status**

Run:

```bash
git check-ignore -v .univer-agent/profile.json skills/univer-team-standup/.SKILL.md.swp
git status --short --branch
```

Expected: ignored local paths print matching rules. `git status` may still show `?? standup.md`; it must not show `.univer-agent/` or `skills/univer-team-standup/.SKILL.md.swp`.

- [ ] **Step 5: Review commits**

Run:

```bash
git log --oneline -5
git diff main...HEAD --stat
```

Expected: recent commits include hygiene, onboarding, template hardening, and first-run docs. Diff stat includes only the planned files plus prior feature files already on the branch.

## Execution Handoff

After saving this plan, choose one execution mode:

1. **Subagent-Driven** - dispatch a fresh subagent per task, review after each task, and keep commits small.
2. **Inline Execution** - execute tasks in this session using `superpowers:executing-plans` with checkpoints.
