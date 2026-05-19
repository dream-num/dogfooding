# univer-team-standup First Run

This guide explains how a member starts using `univer-team-standup` while keeping local preview separate from shared visibility.

`univer-team-standup` depends on the `univer-cli` skill for workbook operations. Make sure `univer` or `unv` is available before starting.

## Member: First Day

1. Ask your agent to use `univer-team-standup` and run `onboard`.
2. Provide `owner_id`, `display_name`, `github_handle`, `agent_id`, `timezone`, `default_repo`, and `default_project`.
3. Confirm the generated `personal_sheet` is exactly `log__<owner_id>`.
4. Let the agent create `.univer-agent/profile.json`, register your own `People` row, and create your own personal log sheet if missing.
5. Preview the workbook. Your Dashboard row is derived from `People`; progress fields stay sparse until your first append writes to `log__<owner_id>`.
6. Ask the agent to `append` or `记录进展`.
7. Review the candidate row before the agent writes.
8. Preview again after write. Dashboard should update from formulas that read `log__<owner_id>`.

Local onboarding and local append are not visible to other members until you explicitly ask for commit/sync or the team uses a team-agreed publishing flow.

## Member: Normal Morning

1. Ask your agent to `append` or `记录进展`.
2. Confirm the generated candidate row.
3. Review the workbook preview.
4. Explicitly ask for `commit/sync` only when you want to publish your local workbook changes.

## Workbook Rule

`ops/team-ops.univer` is the team source of truth after it is bound to the shared remote. If `univer pull ops/team-ops.univer` reports that no remote is bound, the run is local template preview only.

`Dashboard` is rebuildable presentation. `People` and `log__<owner_id>` are the data sources that should survive layout and formula changes.

## Local Files

Do not commit `.univer-agent/profile.json` or `.univer-agent/dependency-check.json`.
