---
name: univer-team-standup
description: Internal core protocol for Univer worklog skills. Do not invoke directly from the skill menu; use univer-worklog-append, univer-worklog-auto, univer-worklog-report, univer-worklog-report-team, or univer-worklog-help instead.
---

# univer-worklog core

Internal core skill. Do not call this skill directly from `$`; it is shared protocol loaded by the visible entry skills:

- `univer-worklog-append`
- `univer-worklog-auto`
- `univer-worklog-report`
- `univer-worklog-report-team`
- `univer-worklog-help`

Operate the worklog workbook through `univer`/`unv` only. Treat workbook-visible state as the source of truth; never inspect, unzip, patch, or directly edit `.univer`/`.unv` internals.

## Required Skills

This workflow depends only on the Univer CLI toolchain:

1. the `univer` or `unv` executable from the npm package `univer-cli`
2. the `univer-cli` Codex skill installed from `dream-num/skills`

For workbook reads, writes, previews, synchronization, and verification, follow the `univer-cli` skill rules. Do not use ad hoc spreadsheet libraries, direct `.univer` package edits, or alternate workbook APIs for worklog state.

If `univer-cli` skill instructions are unavailable, use `univer help` and `univer help <topic>` before unfamiliar commands. Do not guess CLI syntax or bypass the CLI.

## Dependency Bootstrap

The skill may bootstrap its own Univer dependencies when they are missing. Treat `univer-cil` as a typo for `univer-cli`.

Source for Univer skills:

```text
https://github.com/dream-num/skills
```

Required local dependencies:

- `univer` or `unv` from `univer-cli`
- `univer-cli` skill from `dream-num/skills`
- no other workbook engine is required or allowed for normal worklog operation

Check dependencies only when:

1. first use
2. `.univer-agent/dependency-check.json` is missing
3. last dependency check is older than 7 days
4. the user asks to update
5. a `univer`/`unv` or `univer-cli` skill call fails in a way that suggests a missing or stale dependency

Install or repair flow:

```bash
command -v univer || command -v unv || npm install -g univer-cli@latest
npx skills add dream-num/skills
```

Verify after install:

```bash
univer --version || unv --version
test -f ~/.codex/skills/univer-cli/SKILL.md
```

After a successful check, write `.univer-agent/dependency-check.json` locally with checked time, CLI command, CLI version if available, skill source, and status. Never commit this file.

If install fails, show the exact failing command and continue only with operations that do not need the missing dependency.

## Paths

| Purpose | Path |
| --- | --- |
| workbook | `ops/team-ops.univer` |
| profile | `.univer-agent/profile.json` |
| dependency check | `.univer-agent/dependency-check.json` |
| daily reports | `ops/reports/daily/` |
| weekly reports | `ops/reports/weekly/` |
| monthly reports | `ops/reports/monthly/` |

Never commit `.univer-agent/` files.

## Team Remote

Default team workbook unit id:

```text
fYmh0HRyTUO6YECQGFScnA0
```

Default team workbook URL:

```text
https://univer.ai/space/sheets/fYmh0HRyTUO6YECQGFScnA0
```

Default Univer CLI host:

```text
https://univer.ai/
```

Use this remote as the default shared destination for `ops/team-ops.univer` when the workbook is not bound yet. A local profile or environment variable may override it:

```text
UNIVER_WORKLOG_REMOTE=<remote-id-or-url>
profile.remote_workbook=<remote-id-or-url>
UNIVER_WORKLOG_HOST=<univer-host-base-url>
profile.univer_host=<univer-host-base-url>
```

When a workflow needs the team-visible workbook, resolve the remote in this order:

1. `profile.remote_workbook`
2. `UNIVER_WORKLOG_REMOTE`
3. default team remote above

Resolve the Univer host in this order:

1. `profile.univer_host`
2. `UNIVER_WORKLOG_HOST`
3. default Univer CLI host above

Normalize remote values before running CLI commands:

- If the remote is a full URL like `https://univer.ai/space/sheets/<unitID>`, use `<unitID>` for `univer clone --unit-id` and keep the full URL as the user-facing access link.
- If the remote is only a unit id, build the access link as `https://univer.ai/space/sheets/<unitID>` unless the host override clearly points to another Univer deployment.
- Configure the CLI with the base host, not the workbook URL path: `univer config set univerHost https://univer.ai/`.

Do not use guessed query URLs such as `?unit=<id>&type=2` for success links. Use the `/space/sheets/<unitID>` URL format above.

Do not print access-sensitive remote values in long logs. It is OK to show a short masked form such as `fYmh...cnA0`.

## Route Intent

| Intent | Triggers |
| --- | --- |
| onboarding | `onboard`, `init profile`, `初始化身份`, `注册成员`, first append/auto when profile is missing |
| append | `univer-worklog-append`, `worklog-append`, `dogfooding-append`, `append`, `记录进展`, `手动写日报` |
| auto | `univer-worklog-auto`, `worklog-auto`, `dogfooding-auto`, `自动总结今天工作`, `自动写日报` |
| personal report | `univer-worklog-report`, `worklog-report`, `dogfooding-report`, `生成我的日报`, `生成我的周报`, `生成我的月报` |
| team report | `univer-worklog-report-team`, `worklog-report-team`, `dogfooding-report-team`, `dogfooding-report-all`, `生成团队日报`, `生成团队周报`, `生成团队月报` |
| help | `univer-worklog-help`, `worklog-help`, `dogfooding-help`, `查看 worklog 命令` |
| publish | `commit`, `sync`, `提交`, `同步远端`, `发布` |

`同步今天进展` means local append or auto worklog update, not remote sync. Manual append and report flows publish only when the user explicitly asks for commit/sync/publish. Auto flow may auto-submit when the Team Auto Submit policy allows it.

## Team Auto Submit

`univer-worklog-auto` is allowed to commit/sync automatically to the team remote after it writes rows, because its purpose is automatic daily worklog submission.

Rules:

- `--dry-run`: never write and never submit.
- `--confirm`: ask before row writes; after confirmed writes, auto-submit if clean.
- `--no-submit`: write locally and preview, but do not commit/sync.
- default `univer-worklog-auto`: write allowed rows, verify by readback, append `Audit`, preview, then auto-submit if `univer status` is clean.
- manual append and report generation still do not auto-submit unless the user asks for commit/sync/publish.

Auto-submit steps:

1. Resolve the team unit id, access URL, and Univer host.
2. Ensure `univer config get univerHost` matches the resolved base host; set it if needed.
3. Ensure the workbook is bound to the resolved team unit id. If the local workbook is not bound, clone the team workbook into a local working package with `univer clone <path> --unit-id <unitID>` instead of syncing an unbound workbook and accidentally creating a new remote.
4. Run `univer pull <bound-workbook>`.
5. Write and verify rows.
6. Run `univer status <bound-workbook>`.
7. If clean and no conflict, run `univer commit` with a concise worklog message, then `univer sync`.
8. If status is unclear or conflict exists, stop before sync, show review scope, and keep local changes.

## Profile Contract

Required local profile:

```json
{
  "schema_version": "univer-worklog/v0.1",
  "owner_id": "yangluoshen",
  "display_name": "洛神",
  "github_handle": "yangluoshen",
  "agent_id": "codex-yangluoshen-local",
  "personal_sheet": "log__yangluoshen",
  "timezone": "Asia/Shanghai",
  "default_repo": "dream-num/univer-cli"
}
```

Generate `owner_id` automatically, then ask the user to confirm once:

1. Prefer GitHub handle.
2. Else use email prefix if available.
3. Else slugify display name.
4. Else generate `user-xxxx`.

After confirmation, keep `owner_id` stable. `personal_sheet` must be exactly `log__<owner_id>`.

## Workbook Contract

Template sheets: `Dashboard`, `People`, `Audit`, `WorkItems`, `log__sample_member`.

Runtime member sheets: onboarding creates `log__<owner_id>` for real members. Append and auto write only to the current profile's exact personal sheet.

Headers:

```csv
Dashboard: 成员ID,成员,更新状态,昨天完成,今天计划,阻塞,风险,下一步,最近日志,最近更新时间,预览状态
People: 成员ID,显示名称,GitHub账号,AgentID,个人日志表,默认仓库,默认项目,时区,是否启用,更新时间
Audit: 审计ID,创建时间,成员ID,AgentID,操作,工作表,范围,日志ID,操作摘要,状态
WorkItems: 关联项,工作项,默认优先级,默认仓库,负责人,状态,更新时间,备注
Personal Log: 日志ID,日期,成员ID,工作项,状态,优先级,昨天完成,今天计划,阻塞,风险,下一步,仓库,关联项,证据,来源,置信度,去重键,创建时间
```

`People` stores identity and display names. Personal logs use `成员ID`; reports join to `People` to display names.

`WorkItems` is the shared memory for project priority and ownership. Before writing auto rows, read `WorkItems` and inherit priority for matching `关联项`, `去重键`, title, PR, issue, or repo signal. If the user corrects priority, update `WorkItems` before future auto runs.

`Dashboard` is presentation-only. It derives visible state from `People` and `log__<owner_id>`.

## Member Boundaries

Member flows may:

- create the current user's local profile during onboarding
- create or repair only the current user's `log__<owner_id>` sheet
- add or update only the current user's `People` row
- append rows only to `profile.personal_sheet`
- read `WorkItems` and write only priority/rule rows related to the current user's worklog evidence
- write `Audit` entries for their own actions

Member flows must not write another member's row, another member's sheet, team-level publish state, or Dashboard progress cells.

## Priority Policy

Determine `优先级` in this order:

1. User explicitly provided priority in the current request.
2. Existing `WorkItems` row for the same `关联项`, PR, issue, repo/title pattern, or `去重键`.
3. GitHub issue/PR labels, milestone, title markers, or branch naming.
4. Skill rules and evidence strength.
5. Default to `P2` and mark the row as review-needed in `证据` when uncertain.

Do not ask users to fill priority every time. Ask only when the priority changes the report meaning and no evidence can decide it.

## Workflow: Onboard

1. Check `univer` or `unv`.
2. Collect or infer `display_name`, `github_handle`, `agent_id`, `timezone`, and `default_repo`.
3. Generate `owner_id` and `personal_sheet`; ask the user to confirm once.
4. Write `.univer-agent/profile.json`; read it back.
5. Resolve the team unit id, access URL, and Univer host. If the local workbook is unbound, clone the team workbook by unit id into a local working package rather than syncing the template as a new remote. Otherwise say this is local template preview only.
6. Inspect `People`, `WorkItems`, `Dashboard`, and sheet names through public CLI reads.
7. Stop if `People` already has the same `owner_id` with a different personal sheet.
8. If the personal sheet is missing, create it with the Personal Log header.
9. Add/update only this owner's `People` row with `是否启用=是`.
10. Append `Audit` with `操作=onboard`.
11. Read back changed ranges and preview with `univer view`.
12. Stop. Do not commit or sync.

## Workflow: Append

Use for manual rows.

1. Check `univer`/`unv`; avoid network dependency checks unless needed.
2. Read profile. If missing, run Onboard, then ask whether to continue.
3. Pull workbook if bound or resolvable through the team remote.
4. Inspect personal sheet, `People`, `WorkItems`, and `Audit`.
5. Build one or more candidate rows from the user's text.
6. Resolve priority through Priority Policy.
7. Show candidate rows and wait for confirmation.
8. Generate `日志ID` as `YYYYMMDD-<owner_id>-<seq>` in profile timezone.
9. Generate `去重键` from owner/date/repo/关联项/title/source when absent.
10. Write only to `profile.personal_sheet`.
11. Read back and verify key fields.
12. Append `Audit`, preview workbook, and stop without commit/sync.

## Workflow: Auto

Use for `univer-worklog-auto`. Auto means: collect evidence, summarize, dedupe, then write according to policy. It is allowed to write rows without asking per row unless `--dry-run`, `--confirm`, or uncertainty requires review.

Supported flags:

- `--dry-run`: collect, summarize, dedupe, and print candidate rows; do not write workbook.
- `--confirm`: show candidates and ask before writing each row.
- `--no-submit`: write locally but skip auto commit/sync.
- `--period day|week|month`: collection window; default `day`.

Evidence sources, in priority order:

1. Git and GitHub: commits, branches, PRs, issues, review comments, CI results.
2. Codex local sessions: `~/.codex/session_index.jsonl` and `~/.codex/sessions/**/*.jsonl`.
3. workbuddy local history: local `history.json` or equivalent path when available.
4. Current conversation and explicit user notes.

Collection rules:

- Use the user's timezone from profile.
- For `day`, read today's local window. Include active sessions whose events fall in the window, even if the JSONL file path is under the previous UTC date.
- For Codex, summarize by session: thread name, workspace, user requests, final outcomes, files changed, commands/tests run, and evidence path.
- For workbuddy, normalize to the same evidence shape: source, title, workspace, requests, outcomes, evidence path.
- For git/GitHub, prefer concrete evidence: commit SHA, PR number, issue number, changed files, CI status.
- Never infer another person's work as the current user's row unless the evidence is clearly authored by the current owner.

Deduping rules:

- Merge Codex/workbuddy/git/GitHub evidence into one row when repo, PR/issue, branch, title, or file cluster match.
- Prefer GitHub PR/issue as `关联项`; else commit SHA or branch; else session id.
- Use `去重键 = <owner_id>:<date>:<repo>:<关联项-or-topic>`.
- If a row with the same `去重键` already exists for the period, update only when the new evidence is materially better; otherwise skip and write an `Audit` row with `操作=auto-skip-duplicate`.

Auto row writing:

1. Read profile, resolve the team remote, pull workbook, and inspect `People`, `WorkItems`, personal log, and `Audit`.
2. Collect evidence from enabled sources.
3. Summarize evidence into candidate rows using the Personal Log schema.
4. Resolve priority from `WorkItems`, GitHub labels, explicit user data, then fallback rules.
5. Set `状态` to `已完成`, `进行中`, `阻塞`, or `待确认`; use `待确认` if evidence is unclear.
6. Keep `昨天完成` and `今天计划` human-readable enough for report generation. Do not dump raw logs.
7. Keep `证据` compact: include session id/path, commit/PR/issue links, and test command summaries.
8. Respect `--dry-run` and `--confirm`.
9. Write candidate rows, read back, append `Audit`, and preview workbook.
10. Unless `--no-submit` is present, follow Team Auto Submit.

## Workflow: Personal Report

Use for `univer-worklog-report [day|week|month]` or `--period day|week|month`. Default period is `day`.

Read only the current user's `log__<owner_id>` plus `People` and `WorkItems`. Generate a self-contained AI-written HTML report under the matching report directory. Use Markdown only when the user explicitly asks for Markdown.

Personal report output:

- file: `ops/reports/<daily|weekly|monthly>/<period>-<owner_id>.html`
- format: standalone HTML with inline CSS and minimal inline JS; no external network assets
- opening view: executive header with member name, period, generated time, team workbook link, and 3-5 sentence AI-written summary
- top metrics: total rows, completed, in progress, blocked, risk count, P0/P1 count
- main body: visual project cards grouped by repo/work item, with status and priority chips, progress narrative, next action, blockers/risks, and compact evidence links
- interactions: filter chips for status/priority/repo, collapsible evidence/details sections, copy-summary button, and print-friendly styling
- visual style: calm operational dashboard, dense but readable, 8px-or-less card radius, not a marketing landing page, no decorative gradient/orb background
- accessibility: semantic headings, keyboard-friendly buttons, readable contrast, responsive layout

Weekly and monthly HTML reports must add a trend section: repeated themes, shipped work, lingering risks, and suggested next focus.

## Workflow: Team Report

Use for `univer-worklog-report-team [day|week|month]` or `--period day|week|month`. Default period is `day`.

Read all active members from `People`, then read each member's `log__<owner_id>` for the period. Generate a self-contained AI-written HTML report under the matching report directory. Use Markdown only when the user explicitly asks for Markdown.

Team report output:

- file: `ops/reports/<daily|weekly|monthly>/<period>-team.html`
- format: standalone HTML with inline CSS and minimal inline JS; no external network assets
- opening view: team-level summary with date/period, generated time, workbook link, update coverage, and key delivery/risk narrative
- default density: optimized for a 10-15 person team; the first viewport must be readable in a morning meeting without scrolling through every detail
- opening summary: 3-5 short sentences or bullets, no raw row-by-row narration
- standup focus: three columns for sync, decision, and help-needed items; show at most 5 items per column, sorted by P0/P1, blocked/risk, then recency
- member sections: each active member gets a compact summary card with one-line status, top 1-2 highlights, next action, and risk/help signal; detailed rows are collapsed by default
- member detail rows: include status/priority chips, next actions, blockers/risks, and evidence links; show at most 3 most important rows per member before an expandable "more" detail area
- team views: filter by member/status/priority/repo, show/hide details, copy standup summary, and print-friendly mode
- visual style: morning-standup dashboard, scannable on projector, restrained operational UI, no decorative gradient/orb background
- accessibility: semantic headings, keyboard-friendly controls, readable contrast, responsive layout

Team reports must include both the team-level summary and each person's section. The default reading path is: team summary -> standup focus -> compact member cards. The detailed list is for after-meeting follow-up and must not dominate the main view.

## Workflow: Help

Return this concise command list:

```text
$univer-worklog-append
$univer-worklog-auto [--dry-run] [--confirm] [--no-submit] [--period day|week|month]
$univer-worklog-report [day|week|month]
$univer-worklog-report-team [day|week|month]
$univer-worklog-help
```

Also mention natural-language aliases such as `生成我的日报`, `生成团队周报`, and `自动总结今天工作`.

Also mention the only required Univer dependencies:

```bash
npm install -g univer-cli@latest
npx skills add dream-num/skills
```

Also mention the default team workbook:

```text
https://univer.ai/space/sheets/fYmh0HRyTUO6YECQGFScnA0
```

## Workflow: Publish

Run for explicit commit/sync/publish requests, or when Team Auto Submit is reached by `univer-worklog-auto`.

1. Run `univer status ops/team-ops.univer`.
2. Summarize workbook changes and conflict state.
3. If conflict or status needs review, stop and explain review scope.
4. If clean, run `univer commit` and `univer sync` with a concise message.

## Success Messages

After append or auto write:

```text
已写入本地 worklog 并完成预览，尚未提交或同步远端。

- owner: <owner_id>
- sheet: <personal_sheet>
- rows: <count>
- dedupe: <written/skipped>
- preview: <view_url_or_status>
- submit: <auto-submitted|local-only|skipped-by-dry-run|blocked-by-conflict>
- remote: <unitID_or_local_only>
- link: <https://univer.ai/space/sheets/unitID_or_preview_url>
- visibility: auto-submitted 后团队可见；local-only 时其他人不会看到，除非你明确要求 commit/sync 或团队已有其他发布流程
- next: 如需发布本地变更，请明确要求 commit/sync
```

## Hard Stops

- Missing required identity fields.
- Attempt to write another member's data from member mode.
- Workbook conflict or unclear `univer status`.
- CLI write without read-back verification.
- Request to edit `.univer`/`.unv` internals.
- Default commit/sync outside the Team Auto Submit policy.
