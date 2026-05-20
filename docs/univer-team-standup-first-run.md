# univer-worklog First Run

This guide explains how a member starts using the Univer workbook-backed worklog while keeping local preview separate from shared visibility.

`univer-worklog` depends only on the Univer CLI toolchain for workbook operations:

1. the `univer` or `unv` executable from `univer-cli`
2. the `univer-cli` Codex skill from `dream-num/skills`

It does not require or allow another workbook engine for normal worklog operations.

## Commands

These are Codex skill entries, not shell commands:

```text
$univer-worklog-append
$univer-worklog-auto [--dry-run] [--confirm] [--no-submit] [--period day|week|month]
$univer-worklog-report [day|week|month]
$univer-worklog-report-team [day|week|month]
$univer-worklog-help
```

Natural-language aliases should also work, such as `生成我的日报`, `生成团队周报`, and `自动总结今天工作`.

If `univer`/`unv` or the `univer-cli` skill is missing, the skill may bootstrap them. Treat `univer-cil` as a typo for `univer-cli`.

```bash
npm install -g univer-cli@latest
npx skills add dream-num/skills
```

The Univer skills source is [`dream-num/skills`](https://github.com/dream-num/skills). Verify after install:

```bash
univer --version || unv --version
test -f ~/.codex/skills/univer-cli/SKILL.md
```

## Team Workbook

The default shared worklog workbook is built into the skill:

```text
unitID: fYmh0HRyTUO6YECQGFScnA0
link: https://univer.ai/space/sheets/fYmh0HRyTUO6YECQGFScnA0
host: https://univer.ai/
```

Use `https://univer.ai/` as the `univer-cli` host:

```bash
univer config set univerHost https://univer.ai/
```

Use `https://univer.ai/space/sheets/fYmh0HRyTUO6YECQGFScnA0` as the browser access link. If an agent receives the full access link, it should extract the unit id for `univer clone --unit-id` and keep the full link for user-facing output.

## Member: First Day

1. Ask your agent to use `univer-worklog` and run `onboard`.
2. Provide or confirm `display_name`, `github_handle`, `agent_id`, `timezone`, and `default_repo`.
3. Let the agent generate `owner_id` from GitHub handle, email prefix, display name slug, or `user-xxxx`.
4. Confirm the generated `owner_id` and `personal_sheet` once. `personal_sheet` must be `log__<owner_id>`.
5. Let the agent create `.univer-agent/profile.json`, register your own `People` row, and create your personal log sheet if missing.
6. Preview the workbook. Your Dashboard row is derived from `People`; progress fields stay sparse until the first append or auto run writes to `log__<owner_id>`.

Local onboarding is not visible to other members until you explicitly ask for commit/sync or the team uses a team-agreed publishing flow.

## Manual Append

Use this when you want to write a specific worklog row yourself:

```text
$univer-worklog-append
```

The agent should show candidate rows, resolve priority from `WorkItems` when possible, ask for confirmation, write your personal sheet, add `Audit`, and preview the workbook.

## Auto Collection

Use dry-run first:

```text
$univer-worklog-auto --dry-run
```

Auto collection reads evidence from Codex sessions, workbuddy history, git, and GitHub. It summarizes work into candidate rows, dedupes them with `去重键`, inherits priority from `WorkItems`, and shows what would be written.

When the output looks right:

```text
$univer-worklog-auto
```

Default auto writes rows and, when workbook status is clean, commits/syncs them to the team remote. Use `--confirm` if you want to approve rows one by one. Use `--no-submit` if you want to write locally and preview without syncing.

## Personal Reports

Generate personal reports from your own `log__<owner_id>`:

```text
$univer-worklog-report day
$univer-worklog-report week
$univer-worklog-report month
```

The report should be an interactive HTML page by default, with an AI-written summary, metric cards, project cards, filters, expandable evidence, plans, blockers/risks, and print-friendly styling. It should be useful when you reread it later, not just a table dump.

## Team Reports

Generate team reports from all active members:

```text
$univer-worklog-report-team day
$univer-worklog-report-team week
$univer-worklog-report-team month
```

The team report should be an interactive HTML page by default. It must include:

- a team-level summary
- standup focus items
- a summary card for each person
- expandable detail rows for each person
- blockers and risks
- evidence links
- filters by member, status, priority, or repo
- a copyable standup summary and print-friendly styling

This shape lets the host scan the summary in morning standup, then drill into member details when needed.

## Workbook Rule

`ops/team-ops.univer` is the team source of truth after it is bound to the shared remote. The skill has a default team remote built in and may use it for clone/pull/sync when the CLI supports that flow. Local profile, `UNIVER_WORKLOG_REMOTE`, or `UNIVER_WORKLOG_HOST` can override the default. If clone or pull is unavailable, the run is local template preview only.

`Dashboard` is rebuildable presentation. `People`, `WorkItems`, and `log__<owner_id>` are the data sources that should survive layout and formula changes.

## Local Files

Do not commit `.univer-agent/profile.json` or `.univer-agent/dependency-check.json`.
