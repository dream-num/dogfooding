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
