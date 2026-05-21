---
name: univer-worklog-report
description: Use when the user wants an AI-written interactive HTML personal work report from their own Univer worklog. Supports day, week, month, --period day|week|month, --date anchors, and natural-language dates such as 今天, 昨天, 本周, 上周, 本月, 上月. Triggers include worklog-report, dogfooding-report, 生成我的日报, 生成我的周报, 生成我的月报.
---

# univer-worklog-report

Use the core protocol in `../univer-team-standup/SKILL.md`, route intent `personal report`.

Default period is `day`. Resolve `--period`, `--date`, and natural-language date aliases through the core Report Date Resolution rules before reading logs. Generate the report from the current user's personal log plus `People` and `WorkItems`, filtering by the Personal Log `日期` field. For periods overlapping 2026-05-21 through 2026-06-18, include the business-goal contribution and risk/warning tracking from the core protocol. Produce `.html` by default; use Markdown only if the user explicitly requests it.
