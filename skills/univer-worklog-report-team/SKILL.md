---
name: univer-worklog-report-team
description: Use when the user wants an AI-written interactive HTML team daily, weekly, or monthly report from all active members' Univer worklogs. Supports day, week, month, --period day|week|month, --date anchors, and natural-language dates such as 今天, 昨天, 本周, 上周, 本月, 上月. Triggers include worklog-report-team, dogfooding-report-all, 生成团队日报, 生成团队周报, 生成团队月报.
---

# univer-worklog-report-team

Use the core protocol in `../univer-team-standup/SKILL.md`, route intent `team report`.

Default period is `day`. Resolve `--period`, `--date`, and natural-language date aliases through the core Report Date Resolution rules before reading logs. Generate `.html` by default. The report must read both active `People` rows and actual `log__*` / legacy `log_*` sheets so log-only contributors are not missed when a `People` row is absent or stale, filtering by normalized Personal Log `日期` values and warning on repairable numeric date displays. For periods overlapping 2026-05-21 through 2026-06-18, include business-goal tracking for O1-O4. Use the PMO morning-meeting format from the core protocol: team summary first, `晨会聚焦` with goal progress/risk, `重大进展同步`, `重要风险点`, `需沟通事项`, then `每人晨会要点`, compact member cards with delay-risk tags, and detailed rows collapsed for after-meeting follow-up. Include blockers/risks, evidence links, filters, copy summary, print mode, and the HTML interactions defined in the core protocol. Use Markdown only if the user explicitly requests it.
