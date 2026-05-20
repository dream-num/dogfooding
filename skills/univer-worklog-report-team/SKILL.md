---
name: univer-worklog-report-team
description: Use when the user wants an AI-written interactive HTML team daily, weekly, or monthly report from all active members' Univer worklogs. Supports day, week, month, and --period day|week|month. Triggers include worklog-report-team, dogfooding-report-all, 生成团队日报, 生成团队周报, 生成团队月报.
---

# univer-worklog-report-team

Use the core protocol in `../univer-team-standup/SKILL.md`, route intent `team report`.

Default period is `day`. Generate `.html` by default. The report must be concise enough for a 10-15 person morning standup: team-level summary first, standup focus next, compact member cards by default, and detailed rows collapsed for after-meeting follow-up. Include blockers/risks, evidence links, filters, copy summary, print mode, and the HTML interactions defined in the core protocol. Use Markdown only if the user explicitly requests it.
