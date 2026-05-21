---
name: univer-worklog-report-team
description: Use when the user wants an AI-written interactive HTML team daily, weekly, or monthly report from all active members' Univer worklogs. Supports day, week, month, and --period day|week|month. Triggers include worklog-report-team, dogfooding-report-all, 生成团队日报, 生成团队周报, 生成团队月报.
---

# univer-worklog-report-team

Use the core protocol in `../univer-team-standup/SKILL.md`, route intent `team report`.

Default period is `day`. Generate `.html` by default. The report must read both active `People` rows and actual `log__*` / legacy `log_*` sheets so log-only contributors are not missed when a `People` row is absent or stale. For periods overlapping 2026-05-21 through 2026-06-18, include compact business-goal tracking for O1-O4 and the top cross-team risks/warnings from the core protocol. Surface roster/data issues such as unregistered contributors, missing personal sheets, duplicate member ids, or stale `People` rows as compact warnings. Keep it concise enough for a 10-15 person morning standup: team-level summary first, business goal tracking next, `重大进展同步` next, `每人晨会要点` next, standup focus next, compact member cards by default, and detailed rows collapsed for after-meeting follow-up. Include blockers/risks, evidence links, filters, copy summary, print mode, and the HTML interactions defined in the core protocol. Use Markdown only if the user explicitly requests it.
