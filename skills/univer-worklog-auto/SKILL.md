---
name: univer-worklog-auto
description: Use when the user wants to automatically collect Codex/workbuddy/git/GitHub evidence, summarize work, dedupe it, and write or dry-run Univer worklog rows. Supports --dry-run, --confirm, --no-submit, and --period day|week|month.
---

# univer-worklog-auto

Use the core protocol in `../univer-team-standup/SKILL.md`, route intent `auto`.

Support:

- `univer-worklog-auto`
- `univer-worklog-auto --dry-run`
- `univer-worklog-auto --confirm`
- `univer-worklog-auto --no-submit`
- `univer-worklog-auto --period day|week|month`

Follow the core Auto workflow exactly: bootstrap Univer dependencies if missing, resolve the team remote, collect evidence, summarize, resolve priority through `WorkItems`, dedupe with `去重键`, write allowed rows, verify by reading back, audit, preview, and auto-submit when the Team Auto Submit policy allows it. Always follow the core Personal Log Date Field Policy: write `日期` as the local work date, apply `yyyy-mm-dd` display formatting, and verify the date display is not a naked spreadsheet serial number. Always follow the core Progress And Risk Prompting Policy: infer progress, risk, blocker, plan, and next-action fields from evidence when possible, and surface missing items as `需补充` or `待确认` before writing.

During 2026-05-21 through 2026-06-18, apply the core Business Goal Tracking rules when summarizing candidates. If evidence clearly maps to an O1-O4 KR, use goal-aware `关联项` or `WorkItems` hints; if uncertain, leave the candidate unmapped and let reports surface the possible focus drift.
