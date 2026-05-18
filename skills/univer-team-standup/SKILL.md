---
name: univer-team-standup
description: Use when recording Univer team standup updates, onboarding teammate profiles, generating daily standup reports, publishing standup workbook changes, or working with ops/team-ops.univer.
---

# univer-team-standup

Operate the team standup workbook through `univer`/`unv` only. Treat workbook-visible state as the source of truth; never inspect, unzip, patch, or directly edit `.univer`/`.unv` internals.

## Paths

| Purpose | Path |
| --- | --- |
| workbook | `ops/team-ops.univer` |
| profile | `.univer-agent/profile.json` |
| dependency check | `.univer-agent/dependency-check.json` |
| daily reports | `ops/reports/daily/` |

Never commit `.univer-agent/` files.

## Route Intent

| Intent | Triggers |
| --- | --- |
| onboarding | `onboard`, `init profile`, `初始化晨会身份`, `注册成员`, first `append` when profile is missing |
| member append | `append`, `记录进展`, `写日报`, `更新晨会表`, `同步今天进展` |
| host report | `generateDay()`, `generateDay(YYYY-MM-DD)`, `genarateDay()` aliases, `生成晨会日报`, `生成当天日报` |
| publish | `commit`, `sync`, `提交`, `同步远端`, `发布` |

`同步今天进展` means local append, not remote sync. Publish only when the user explicitly asks for commit/sync/publish.

## Role Boundaries

`member` may:

- create its local profile during onboarding
- create or repair only its own `log__<owner_id>` sheet
- add or update only its own `_People` row
- append rows only to `profile.personal_sheet`
- update only its own `_Dashboard` row
- write `_Audit` entries for its own actions

`member` must not write `_Reports`, global dashboard cells, another member's row, or another member's sheet.

`host` may read active members from `_People`, read their `log__*` sheets, generate daily HTML, append `_Reports`, refresh global dashboard/report cells, and audit report generation.

Before host actions, read the profile. If `standup_roles` lacks `host`, ask for explicit host authorization or tell the user to update the profile.

## Profile Contract

Required JSON shape:

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

Do not guess `owner_id`, `display_name`, `agent_id`, or `personal_sheet`.

- `owner_id`: stable, lowercase, sheet-safe, `^[a-z0-9][a-z0-9_-]{1,39}$`
- `personal_sheet`: default `log__<owner_id>` unless the user confirms another value
- `timezone`: controls `date`, `log_id`, and default `generateDay()` date

## Workflow: Onboard

Use when the user asks to register/init/onboard or append without a profile.

1. Check `univer` or `unv`.
2. Collect required profile fields and confirm `personal_sheet`.
3. Write `.univer-agent/profile.json`; read it back.
4. Run `univer pull ops/team-ops.univer`. If unbound, say this is local template preview only.
5. Inspect workbook, `_People`, and `_Dashboard` through public CLI reads.
6. Stop if `_People` already has the same `owner_id` with a different `personal_sheet`.
7. If the personal sheet is missing, create it with the Personal Log header below.
8. Add/update only this owner's `_People` row: `active=TRUE`, `standup_roles=member` unless host was explicitly confirmed.
9. Add/update only this owner's `_Dashboard` row with `update_status=No update / Needs append`.
10. Append `_Audit` with `action=onboard`.
11. Read back changed ranges.
12. Preview with `univer view`.
13. Stop. Do not commit or sync.

Tell the user the host will not see local onboarding until commit/sync or another team publishing flow happens.

## Workflow: Append

1. Check `univer`/`unv`; avoid network dependency checks unless missing, older than 7 days, requested, or failure suggests version drift.
2. Read profile. If missing, run Onboard, then ask whether to continue.
3. `univer pull ops/team-ops.univer`; if unbound, say this is local preview only.
4. Inspect workbook-visible state and repair only this owner's missing profile sheet, `_People` row, or `_Dashboard` row.
5. Build candidate rows only from visible evidence: user text, current conversation work, git/branch/commit/diff/test output, accessible GitHub content, or existing workbook records.
6. Show candidate rows and wait for confirmation.
7. Generate `log_id` as `YYYYMMDD-<owner_id>-<seq>` from existing same-day rows in profile timezone.
8. Write only to `profile.personal_sheet`.
9. Read back the written range and verify key fields.
10. Update only this owner's `_Dashboard` row.
11. Append `_Audit`.
12. Preview with `univer view`.
13. Stop. Do not commit or sync.

Do not mark work `done` without evidence. Mark AI-inferred content as `AI inferred, needs human review` with confidence and evidence.

## Workflow: Generate Daily Report

1. Confirm host role or explicit host authorization.
2. Determine date; default to today in profile timezone.
3. `univer pull ops/team-ops.univer`; if unbound, say the report uses local template data.
4. Read `_People` and active members' `log__*` sheets.
5. If current conversation work is not in the workbook, ask whether to append first; do not mix unpersisted conversation data into the report.
6. Generate `ops/reports/daily/YYYY-MM-DD-daily.html`.
7. Append `_Reports`.
8. Refresh global dashboard summary/report cells.
9. Read back `_Reports` and `_Dashboard`.
10. Preview workbook and HTML report.
11. Stop. Do not commit or sync.

Daily HTML requirements: overview first; one section/page per active member in `_People` order; show yesterday, today, blocker, risk, next action, evidence; collapse long raw notes; show missing updates as `No update / Needs follow-up`.

## Workflow: Publish

Only run when the user explicitly asks to commit/sync/publish.

1. Run `univer status ops/team-ops.univer`.
2. Summarize workbook/report changes and conflict state.
3. If conflict or status needs review, stop and explain review scope.
4. If clean, run `univer commit` and `univer sync` with a concise message.

## Workbook Contract

Expected sheets: `_Dashboard`, `_People`, `_Reports`, `_Audit`, `log__<owner_id>`.

Headers:

```csv
_Dashboard: owner_id,display_name,update_status,yesterday,today,blocker,risk,next_action,last_log_id,last_updated_at,preview_status,report_path
_People: owner_id,display_name,github_handle,agent_id,personal_sheet,default_repo,default_project,timezone,standup_roles,active,updated_at
_Reports: report_id,report_type,date_range,generated_at,generated_by,output_format,output_path,source_sheets,source_rows,commit_ref,sync_status,preview_status,review_url,raw_note
_Audit: audit_id,created_at,owner_id,agent_id,role,action,sheet,range,log_id,before_summary,after_summary,commit_ref,review_url,status,raw_note
Personal Log: log_id,date,owner_id,work_item_title,status,priority,blocker,risk,next_action,repo,branch,work_item_ref,category,area,size,yesterday,today,impact,evidence,source,agent_id,confidence,raw_note,created_at,verified_at,checksum
```

## Success Messages

After append:

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

## Hard Stops

- Missing required identity fields.
- Attempt to write another member's data from member mode.
- Workbook conflict or unclear `univer status`.
- CLI write without read-back verification.
- Request to edit `.univer`/`.unv` internals.
- Any default commit/sync behavior.
