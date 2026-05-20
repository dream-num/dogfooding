---
name: univer-worklog-report
description: Use when the user wants an AI-written interactive HTML personal work report from their own Univer worklog. Supports day, week, month, and --period day|week|month. Triggers include worklog-report, dogfooding-report, 生成我的日报, 生成我的周报, 生成我的月报.
---

# univer-worklog-report

Use the core protocol in `../univer-team-standup/SKILL.md`, route intent `personal report`.

Default period is `day`. Generate the report from the current user's personal log plus `People` and `WorkItems`, using the HTML-first personal report format defined in the core protocol. Produce `.html` by default; use Markdown only if the user explicitly requests it.
