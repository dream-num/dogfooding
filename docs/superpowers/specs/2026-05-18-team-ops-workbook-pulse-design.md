# Team Ops Workbook Pulse Design

## Background

`ops/team-ops.univer` is the first `univer-team-standup` dogfooding workbook. The current template is functional but plain: it has the right sheets and neutral sample data, but it does not yet give the team a strong reason to open it every morning.

This design upgrades the workbook into a "Team Pulse" experience. The user selected the "团队脉搏感" direction, then confirmed an A+B focus:

- A: team rhythm should be prominent: update rate, missing count, blocker/risk pulse.
- B: personal action should be prominent: each member's status, today's work, and next action should be easy to scan.

## Goals

- Make `_Dashboard` feel polished, modern, and motivating without sacrificing spreadsheet editability.
- Use Univer-supported workbook features: formulas, conditional formatting, charts, row/column sizing, freezing, colors, and borders.
- Keep the workbook operational, not decorative. Every visual element must support standup decisions.
- Keep sample data inactive so first-use reports are not polluted.
- Update the generator so the polished workbook is reproducible through `univer run`.

## Non-Goals

- Do not add a separate frontend app.
- Do not implement real append or report-generation automation in this change.
- Do not bind or sync the workbook to a remote by default.
- Do not directly edit `.univer` internals.
- Do not make the workbook visually heavy enough to reduce daily editing comfort.

## Confirmed Visual Direction

The workbook should feel like a lightweight team pulse board:

- Light operational surface, not a dark full-screen dashboard.
- Restrained blue/teal accents for active/productive signals.
- Amber/red only for risk and blocker attention.
- Card-like metric zones built from cells, not floating decorative objects.
- Personnel board remains the primary work area.
- Charts are secondary feedback, not the main interaction.

## Dashboard Layout

`_Dashboard` remains the default active sheet.

### Header Zone

Use `A1:L2` for the compact identity band:

- Title: `Univer Team Pulse`
- Subtitle/status: `Morning Standup · Local preview · no auto sync`
- Date/report cells remain visible and formula-friendly.

Use a dark navy cell band only for this top header. The rest of the sheet stays light.

### Pulse Metric Zone

Use rows 3-6 for summary metrics:

- `update_rate`: updated active members / active members
- `missing`: active members not updated
- `blockers`: active members or rows with blocker content
- `risks`: active members or rows with risk content
- `daily_report`: latest report status/path

Metrics are seeded as formulas against the `_Dashboard` personnel rows so the template updates as members are added.

Formula intent:

- active member count should ignore sample/inactive rows.
- updated count should count active rows whose `update_status` is `updated`.
- missing count should count active rows that are not updated.
- blocker and risk counts should count non-empty blocker/risk cells among active rows.

### Personnel Action Board

The personnel table remains the center of the dashboard. Keep these columns:

```csv
owner_id,display_name,update_status,yesterday,today,blocker,risk,next_action,last_log_id,last_updated_at,preview_status,report_path
```

Improve it with:

- frozen header and left identity columns
- larger row heights for scan-friendly daily notes
- wrapped text for yesterday/today/risk/next_action
- status chips through conditional formatting
- distinct but restrained colors:
  - `updated`: green
  - `No update / Needs follow-up`: amber
  - `sample / inactive`: gray
  - blockers: red
  - risks: amber
  - local preview/not synced: blue-gray

### Pulse Data And Charts

Add a visually de-emphasized chart source range on `_Dashboard` at `N2:Q6`. Do not merge or place header content over this range.

Source data should support:

- update/missing/bar chart
- blockers/risks attention chart

Add one chart to `_Dashboard`:

- Recommended chart: column chart or compact bar chart titled `Team Pulse`
- Source: `_Dashboard!N2:Q6`
- Position: right of the personnel board, anchored so it does not cover editable cells
- Size: modest enough not to dominate the sheet

If chart insertion fails because of runtime/chart support, the implementation should keep formulas and conditional formatting and report the chart failure clearly. Do not fake chart success.

## Other Sheets

Apply a smaller polish pass to supporting sheets:

- `_People`, `_Reports`, `_Audit`: consistent header style, frozen first row, hidden gridlines, readable widths.
- Personal log sheets: keep the 26-column schema, preserve grouped header colors, improve row height and wrapping for narrative columns.

No supporting sheet should become more visually important than `_Dashboard`.

## Implementation Approach

Modify `tools/univer-team-standup/create-template-workbook.js` as the source of truth. Regenerate `ops/team-ops.univer` through public `univer` commands.

Use:

- Documented formula writes for metric formulas, checked with `univer help run formulas` before implementation.
- `setBackgroundColor`, `setFontColor`, `setFontWeight`, `setFontSize`, alignment, borders, row heights, and column widths for layout.
- `newConditionalFormattingRule()` for status, blocker, risk, and preview state colors.
- `newChart()` with a source range for the pulse chart.
- public readback APIs such as `getConditionalFormattingRules()` and `getCharts()` in the run script return value.

Do not bypass the CLI or inspect package internals. If replacing a same-path `.univer` package, stop/restart the `univer` daemon if workbook-visible reads show stale state.

## Verification

After implementation:

- `univer inspect workbook ops/team-ops.univer` shows `_Dashboard` as active.
- `univer pipe out ops/team-ops.univer --range '_Dashboard!A1:L12' --format tsv` shows the new title, metric zone, and personnel table.
- `univer pipe out ops/team-ops.univer --range '_Dashboard!N2:Q8' --format tsv` or the final chosen chart source range shows chart data.
- `univer run` readback reports conditional formatting rule count greater than zero for `_Dashboard`.
- `univer run` readback reports at least one chart on `_Dashboard`, unless chart insertion fails with a real CLI/runtime diagnostic.
- `_People` sample rows remain inactive.
- `univer status ops/team-ops.univer` reports `pending mutations: 0` after committing the regenerated workbook.
- No default commit/sync to remote is performed.

## Risks And Constraints

- Charts may render only in `univer view`, not in terminal output. Verification should use chart readback plus workbook preview.
- Formula calculation may require documented formula wait APIs before readback.
- Conditional formatting APIs should use documented builders, not internal rule model shapes.
- Visual polish must stay compatible with future append/onboard flows that update existing dashboard rows.
