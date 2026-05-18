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
