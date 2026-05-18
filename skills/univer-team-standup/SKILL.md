---
name: univer-team-standup
description: Use when recording Univer team standup updates, onboarding teammate profiles, publishing standup workbook changes, or working with ops/team-ops.univer.
---

# univer-team-standup

Operate the team standup workbook through `univer`/`unv` only. Treat workbook-visible state as the source of truth; never inspect, unzip, patch, or directly edit `.univer`/`.unv` internals.

## Paths

| Purpose | Path |
| --- | --- |
| workbook | `ops/team-ops.univer` |
| profile | `.univer-agent/profile.json` |
| dependency check | `.univer-agent/dependency-check.json` |

Never commit `.univer-agent/` files.

## Route Intent

| Intent | Triggers |
| --- | --- |
| onboarding | `onboard`, `init profile`, `初始化晨会身份`, `注册成员`, first `append` when profile is missing |
| member append | `append`, `记录进展`, `写日报`, `更新晨会表`, `同步今天进展` |
| publish | `commit`, `sync`, `提交`, `同步远端`, `发布` |

`同步今天进展` means local append, not remote sync. Publish only when the user explicitly asks for commit/sync/publish.

## Member Boundaries

`member` may:

- create its local profile during onboarding
- create or repair only its own `log__<owner_id>` sheet
- add or update only its own `People` row
- append rows only to `profile.personal_sheet`
- update only its own `Dashboard` row
- write `Audit` entries for its own actions

`member` must not write another member's row, another member's sheet, report indexes, non-member workflow data, or global publish state.

## Profile Contract

Required JSON shape:

```json
{
  "schema_version": "univer-team-standup/v0.2",
  "owner_id": "yangluoshen",
  "display_name": "yangluoshen",
  "github_handle": "yangluoshen",
  "agent_id": "codex-yangluoshen-local",
  "personal_sheet": "log__yangluoshen",
  "timezone": "Asia/Shanghai",
  "default_repo": "dream-num/univer-cli",
  "default_project": "Univer CLI"
}
```

Do not guess `owner_id`, `display_name`, `agent_id`, or `personal_sheet`.

- `owner_id`: stable, lowercase, sheet-safe, `^[a-z0-9][a-z0-9_-]{1,39}$`
- `personal_sheet`: default `log__<owner_id>` unless the user confirms another value
- `timezone`: controls `date` and `log_id`

## Workflow: Onboard

Use when the user asks to register/init/onboard or append without a profile.

1. Check `univer` or `unv`.
2. Collect required profile fields and confirm `personal_sheet`.
3. Write `.univer-agent/profile.json`; read it back.
4. Run `univer pull ops/team-ops.univer`. If unbound, say this is local template preview only.
5. Inspect workbook, `People`, and `Dashboard` through public CLI reads.
6. Stop if `People` already has the same `owner_id` with a different `personal_sheet`.
7. If the personal sheet is missing, create it with the Personal Log header below.
8. Add/update only this owner's `People` row with `是否启用=是`.
9. Add/update only this owner's `Dashboard` row with `更新状态=待更新`.
10. Append `Audit` with `操作=onboard`.
11. Read back changed ranges.
12. Preview with `univer view`.
13. Stop. Do not commit or sync.

Tell the user other members will not see local onboarding until commit/sync or another team publishing flow happens.

## Workflow: Append

1. Check `univer`/`unv`; avoid network dependency checks unless missing, older than 7 days, requested, or failure suggests version drift.
2. Read profile. If missing, run Onboard, then ask whether to continue.
3. `univer pull ops/team-ops.univer`; if unbound, say this is local preview only.
4. Inspect workbook-visible state and repair only this owner's missing profile sheet, `People` row, or `Dashboard` row.
5. Build candidate rows only from visible evidence: user text, current conversation work, git/branch/commit/diff/test output, accessible GitHub content, or existing workbook records.
6. Show candidate rows and wait for confirmation.
7. Generate `log_id` as `YYYYMMDD-<owner_id>-<seq>` from existing same-day rows in profile timezone.
8. Write only to `profile.personal_sheet`.
9. Read back the written range and verify key fields.
10. Update only this owner's `Dashboard` row.
11. Append `Audit`.
12. Preview with `univer view`.
13. Stop. Do not commit or sync.

Do not mark work `done` without evidence. Mark AI-inferred content as `AI inferred, needs human review` with confidence and evidence.

## Workflow: Publish

Only run when the user explicitly asks to commit/sync/publish.

1. Run `univer status ops/team-ops.univer`.
2. Summarize workbook changes and conflict state.
3. If conflict or status needs review, stop and explain review scope.
4. If clean, run `univer commit` and `univer sync` with a concise message.

## Workbook Contract

Expected sheets: `Dashboard`, `People`, `Audit`, `log__<owner_id>`.

Headers:

```csv
Dashboard: 成员ID,成员,更新状态,昨天完成,今天计划,阻塞,风险,下一步,最近日志,最近更新时间,预览状态
People: 成员ID,显示名称,GitHub账号,AgentID,个人日志表,默认仓库,默认项目,时区,是否启用,更新时间
Audit: 审计ID,创建时间,成员ID,AgentID,操作,工作表,范围,日志ID,操作摘要,状态
Personal Log: 日志ID,日期,成员ID,工作项,状态,优先级,阻塞,风险,下一步,仓库,分支,关联项,分类,模块,规模,昨天完成,今天计划,影响,证据,来源,AgentID,置信度,原始备注,创建时间,校验时间,校验码
```

## Success Messages

After append:

```text
已写入本地晨会表并完成预览，尚未提交或同步远端。

- owner: <owner_id>
- sheet: <personal_sheet>
- log_id: <log_id>
- dashboard: 已刷新当前成员行
- preview: <view_url_or_status>
- visibility: 其他人不会看到这次本地更新，除非你明确要求 commit/sync 或团队已有其他发布流程
- next: 如需发布，请明确要求 commit/sync
```

## Hard Stops

- Missing required identity fields.
- Attempt to write another member's data from member mode.
- Workbook conflict or unclear `univer status`.
- CLI write without read-back verification.
- Request to edit `.univer`/`.unv` internals.
- Any default commit/sync behavior.
