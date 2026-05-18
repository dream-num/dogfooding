# Team Ops Workbook Pulse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `ops/team-ops.univer` into the confirmed Team Pulse workbook experience with formulas, conditional formatting, chart source data, one dashboard chart, and polished workbook layout.

**Architecture:** `tools/univer-team-standup/create-template-workbook.js` remains the source of truth and generates the workbook only through public Univer CLI APIs. The dashboard owns the Team Pulse experience; supporting sheets receive only consistency polish. `ops/team-ops.univer` is regenerated from the script, verified through workbook-visible reads, then committed locally with no remote sync.

**Tech Stack:** Univer CLI (`univer`), Univer `run` scripts, JavaScript facade APIs, formulas, conditional formatting builders, chart builders, Git, ripgrep.

---

## Scope Check

This plan implements the approved spec:

- [docs/superpowers/specs/2026-05-18-team-ops-workbook-pulse-design.md](../specs/2026-05-18-team-ops-workbook-pulse-design.md)

It is one subsystem: workbook template visual and functional polish. It does not implement append automation, report generation automation, remote binding, or remote sync.

## File Structure

- Modify: `tools/univer-team-standup/create-template-workbook.js`
  - Responsibility: generate the polished Team Pulse template through public Univer facade APIs.
- Replace via Univer CLI: `ops/team-ops.univer`
  - Responsibility: generated workbook package committed after workbook-visible verification.
- No changes: `skills/univer-team-standup/SKILL.md`
  - Reason: this task changes workbook template presentation, not the skill protocol.

Do not edit files inside `ops/team-ops.univer` manually. Regenerate the package with `univer new`, `univer run`, and `univer commit`, then replace the directory.

## Implementation Tasks

### Task 1: Add Reusable Styling Helpers And Formula Support

**Files:**
- Modify: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Confirm workbook and daemon baseline**

Run:

```bash
git status --short --branch
univer daemon stop || true
univer inspect workbook ops/team-ops.univer | sed -n '1,20p'
```

Expected: branch is `feat-univer-morning-standup`; untracked `standup.md` may appear; inspect shows `Active Sheet: _Dashboard`.

- [ ] **Step 2: Check formula, conditional formatting, and chart manuals**

Run:

```bash
univer help run formulas | sed -n '1,120p'
univer help run conditional-formatting | sed -n '1,180p'
univer help run charts | sed -n '1,180p'
```

Expected: help output documents `setFormula`, `onCalculationResultApplied`, `newConditionalFormattingRule`, `setRanges`, `newChart`, and `insertChart`.

- [ ] **Step 3: Add constants near the top of the generator**

In `tools/univer-team-standup/create-template-workbook.js`, immediately after `const workbook = univerAPI.getActiveWorkbook();`, add:

```javascript
  const colors = {
    navy: "#0F172A",
    navy2: "#142033",
    panel: "#FFFFFF",
    canvas: "#F6F8FB",
    grid: "#D8E0EA",
    header: "#EEF4FB",
    text: "#142033",
    muted: "#64748B",
    blue: "#2563EB",
    blueSoft: "#DBEAFE",
    teal: "#0D9488",
    tealSoft: "#CCFBF1",
    green: "#16A34A",
    greenSoft: "#DCFCE7",
    amber: "#D97706",
    amberSoft: "#FEF3C7",
    red: "#DC2626",
    redSoft: "#FEE2E2",
    graySoft: "#F1F5F9",
  };

```

- [ ] **Step 4: Add helper functions after `setWidths`**

Insert these helpers after the existing `setWidths` function:

```javascript
  const setHeights = (sheet, heights) => {
    heights.forEach(([rowIndex, height]) => sheet.setRowHeight(rowIndex, height));
  };

  const addTextRule = (sheet, rangeA1, text, background, fontColor, bold = false) => {
    const range = sheet.getRange(rangeA1);
    const rule = sheet
      .newConditionalFormattingRule()
      .whenTextContains(text)
      .setBackground(background)
      .setFontColor(fontColor)
      .setBold(bold)
      .setRanges([range.getRange()])
      .build();
    sheet.addConditionalFormattingRule(rule);
  };

  const addFormulaRule = (sheet, rangeA1, formula, background, fontColor, bold = false) => {
    const range = sheet.getRange(rangeA1);
    const rule = sheet
      .newConditionalFormattingRule()
      .whenFormulaSatisfied(formula)
      .setBackground(background)
      .setFontColor(fontColor)
      .setBold(bold)
      .setRanges([range.getRange()])
      .build();
    sheet.addConditionalFormattingRule(rule);
  };
```

- [ ] **Step 5: Syntax-check generator**

Run:

```bash
node --check tools/univer-team-standup/create-template-workbook.js
```

Expected: no output and exit code `0`.

- [ ] **Step 6: Commit helper changes**

Run:

```bash
git add tools/univer-team-standup/create-template-workbook.js
git commit -m "chore: add standup workbook styling helpers"
```

Expected: commit succeeds and includes only the generator.

### Task 2: Build Team Pulse Dashboard Layout

**Files:**
- Modify: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Expand the dashboard sheet shape**

In the `desiredSheets` array, replace:

```javascript
    { name: "_Dashboard", rows: 60, cols: 12 },
```

with:

```javascript
    { name: "_Dashboard", rows: 80, cols: 17 },
```

- [ ] **Step 2: Replace dashboard clear range and sheet presentation**

In the dashboard section, replace:

```javascript
  clearTemplateRange(dashboard, "_Dashboard", "A1:L60");
  dashboard.setHiddenGridlines(true);
  dashboard.setGridLinesColor("#D7DEE8");
  dashboard.setFrozenRows(7);
  dashboard.setFrozenColumns(2);
```

with:

```javascript
  clearTemplateRange(dashboard, "_Dashboard", "A1:Q80");
  dashboard.setHiddenGridlines(true);
  dashboard.setGridLinesColor(colors.grid);
  dashboard.setFrozenRows(8);
  dashboard.setFrozenColumns(2);
```

- [ ] **Step 3: Replace dashboard title and header zone**

Replace the current dashboard title/header block from `dashboard.getRange("A1:L1").merge...` through `dashboard.setRowHeight(0, 34);` with:

```javascript
  dashboard.getRange("A1:L2").merge({ isForceMerge: true });
  dashboard.getRange("A1").setValue("Univer Team Pulse");
  dashboard
    .getRange("A1:L2")
    .setBackgroundColor(colors.navy)
    .setFontColor("#F8FAFC")
    .setFontWeight("bold")
    .setFontSize(20)
    .setVerticalAlignment("middle");
  dashboard.getRange("N1:Q1").merge({ isForceMerge: true });
  dashboard.getRange("N1").setValue("Morning Standup · Local preview · no auto sync");
  dashboard
    .getRange("N1:Q1")
    .setBackgroundColor(colors.navy2)
    .setFontColor("#BFDBFE")
    .setFontWeight("bold")
    .setFontSize(11)
    .setVerticalAlignment("middle");
  setHeights(dashboard, [
    [0, 30],
    [1, 30],
    [2, 28],
    [3, 34],
    [4, 28],
    [5, 34],
    [7, 28],
  ]);
```

- [ ] **Step 4: Replace metric zone values with formulas**

Replace the current `dashboard.getRange("A3:H4").setValues(...)` and formatting call with:

```javascript
  dashboard.getRange("A3:L6").setBackgroundColor(colors.canvas);

  dashboard.getRange("A3").setValue("UPDATE RATE");
  dashboard.getRange("A4").setFormula('=IFERROR(COUNTIFS($A$9:$A$60,"<>",$C$9:$C$60,"updated")&"/"&COUNTIFS($A$9:$A$60,"<>",$C$9:$C$60,"<>sample / inactive"),"0/0")');
  dashboard.getRange("C3").setValue("MISSING");
  dashboard.getRange("C4").setFormula('=COUNTIFS($C$9:$C$60,"<>updated",$C$9:$C$60,"<>sample / inactive",$A$9:$A$60,"<>")');
  dashboard.getRange("E3").setValue("BLOCKERS");
  dashboard.getRange("E4").setFormula('=COUNTIFS($F$9:$F$60,"<>",$C$9:$C$60,"<>sample / inactive",$A$9:$A$60,"<>")');
  dashboard.getRange("G3").setValue("RISKS");
  dashboard.getRange("G4").setFormula('=COUNTIFS($G$9:$G$60,"<>",$C$9:$C$60,"<>sample / inactive",$A$9:$A$60,"<>")');
  dashboard.getRange("I3").setValue("DAILY REPORT");
  dashboard.getRange("I4").setValue("Not generated");

  dashboard.getRange("A5").setValue("MODE");
  dashboard.getRange("A6").setValue("local template preview");
  dashboard.getRange("C5").setValue("SYNC");
  dashboard.getRange("C6").setValue("not_synced");
  dashboard.getRange("E5").setValue("PREVIEW");
  dashboard.getRange("E6").setValue("use univer view");
  dashboard.getRange("G5").setValue("FOCUS");
  dashboard.getRange("G6").setValue("team rhythm + personal action");
  dashboard.getRange("I5").setValue("NEXT");
  dashboard.getRange("I6").setValue("onboard members, then append");

  ["A3:B4", "C3:D4", "E3:F4", "G3:H4", "I3:L4", "A5:B6", "C5:D6", "E5:F6", "G5:H6", "I5:L6"].forEach((a1) => {
    dashboard.getRange(a1)
      .setBackgroundColor(colors.panel)
      .setBorder(univerAPI.Enum.BorderType.OUTSIDE, univerAPI.Enum.BorderStyleTypes.THIN, colors.grid)
      .setVerticalAlignment("middle");
  });
  dashboard.getRange("A3:I5").setFontColor(colors.muted).setFontSize(9).setFontWeight("bold");
  dashboard.getRange("A4").setFontColor(colors.blue).setFontSize(18).setFontWeight("bold");
  dashboard.getRange("C4").setFontColor(colors.amber).setFontSize(18).setFontWeight("bold");
  dashboard.getRange("E4").setFontColor(colors.red).setFontSize(18).setFontWeight("bold");
  dashboard.getRange("G4").setFontColor(colors.amber).setFontSize(18).setFontWeight("bold");
  dashboard.getRange("I4").setFontColor(colors.text).setFontSize(14).setFontWeight("bold");
  dashboard.getRange("A6:I6").setFontColor(colors.text).setFontSize(11);
```

- [ ] **Step 5: Move personnel table header from row 7 to row 8**

Replace `dashboard.getRange("A7:L7").setValues` with `dashboard.getRange("A8:L8").setValues`.

Replace `styleHeader(dashboard.getRange("A7:L7"), "#EEF3F8");` with:

```javascript
  styleHeader(dashboard.getRange("A8:L8"), colors.header);
  dashboard.getRange("A8:L8").setFontColor(colors.text).setHorizontalAlignment("center");
```

- [ ] **Step 6: Move sample rows from rows 8-9 to rows 9-10**

Replace `dashboard.getRange("A8:L9").setValues` with `dashboard.getRange("A9:L10").setValues`.

Replace `dashboard.getRange("A8:L9").setBorder(...)` with:

```javascript
  dashboard.getRange("A9:L10").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, colors.grid);
  dashboard.getRange("A9:L60").setVerticalAlignment("top");
  dashboard.getRange("D9:H60").setVerticalAlignment("top");
```

- [ ] **Step 7: Add chart source data in `N2:Q6`**

After the sample rows and before `setWidths(dashboard, ...)`, insert:

```javascript
  dashboard.getRange("N2:Q6").setValues([
    ["metric", "value", "color", "note"],
    ["updated", 0, colors.blue, "active updated members"],
    ["missing", 0, colors.amber, "active missing members"],
    ["blockers", 0, colors.red, "active blocker count"],
    ["risks", 0, colors.amber, "active risk count"],
  ]);
  dashboard.getRange("O3").setFormula('=COUNTIFS($A$9:$A$60,"<>",$C$9:$C$60,"updated")');
  dashboard.getRange("O4").setFormula('=COUNTIFS($C$9:$C$60,"<>updated",$C$9:$C$60,"<>sample / inactive",$A$9:$A$60,"<>")');
  dashboard.getRange("O5").setFormula('=COUNTIFS($F$9:$F$60,"<>",$C$9:$C$60,"<>sample / inactive",$A$9:$A$60,"<>")');
  dashboard.getRange("O6").setFormula('=COUNTIFS($G$9:$G$60,"<>",$C$9:$C$60,"<>sample / inactive",$A$9:$A$60,"<>")');
  dashboard.getRange("N2:Q6")
    .setBackgroundColor("#F8FAFC")
    .setFontColor(colors.muted)
    .setFontSize(10)
    .setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, colors.grid);
  styleHeader(dashboard.getRange("N2:Q2"), colors.header);
```

- [ ] **Step 8: Update dashboard widths and row heights**

Replace dashboard widths:

```javascript
  setWidths(dashboard, [140, 150, 170, 260, 280, 220, 220, 260, 210, 230, 160, 260]);
```

with:

```javascript
  setWidths(dashboard, [140, 150, 160, 280, 300, 220, 220, 270, 210, 220, 160, 260, 24, 120, 100, 110, 180]);
  dashboard.setRowHeights(8, 52, 54);
```

- [ ] **Step 9: Syntax-check generator**

Run:

```bash
node --check tools/univer-team-standup/create-template-workbook.js
```

Expected: no output and exit code `0`.

- [ ] **Step 10: Commit dashboard layout changes**

Run:

```bash
git add tools/univer-team-standup/create-template-workbook.js
git commit -m "feat: add team pulse dashboard layout"
```

Expected: commit succeeds and includes only the generator.

### Task 3: Add Conditional Formatting And Chart Creation

**Files:**
- Modify: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Add dashboard conditional formatting rules**

After dashboard widths and row heights, insert:

```javascript
  addTextRule(dashboard, "C9:C60", "updated", colors.greenSoft, "#166534", true);
  addTextRule(dashboard, "C9:C60", "No update", colors.amberSoft, "#92400E", true);
  addTextRule(dashboard, "C9:C60", "sample / inactive", colors.graySoft, colors.muted, false);
  addFormulaRule(dashboard, "F9:F60", "=LEN($F9)>0", colors.redSoft, "#991B1B", true);
  addFormulaRule(dashboard, "G9:G60", "=LEN($G9)>0", colors.amberSoft, "#92400E", true);
  addTextRule(dashboard, "K9:K60", "local preview", colors.blueSoft, "#1D4ED8", false);
```

- [ ] **Step 2: Add supporting sheet conditional formatting**

After `_People` widths are set, insert:

```javascript
  addTextRule(people, "J2:J80", "TRUE", colors.greenSoft, "#166534", true);
  addTextRule(people, "J2:J80", "FALSE", colors.graySoft, colors.muted, false);
```

After `styleLogSheet(log);` for `log__sample_member`, insert:

```javascript
  addTextRule(log, "E2:E200", "done", colors.greenSoft, "#166534", true);
  addTextRule(log, "E2:E200", "needs_review", colors.amberSoft, "#92400E", true);
  addFormulaRule(log, "G2:G200", "=LEN($G2)>0", colors.amberSoft, "#92400E", true);
  addFormulaRule(log, "H2:H200", "=LEN($H2)>0", colors.amberSoft, "#92400E", true);
```

Inside the `["log__sample_host"].forEach` loop, after `styleLogSheet(personalSheet);`, insert:

```javascript
    addTextRule(personalSheet, "E2:E200", "done", colors.greenSoft, "#166534", true);
    addTextRule(personalSheet, "E2:E200", "needs_review", colors.amberSoft, "#92400E", true);
    addFormulaRule(personalSheet, "G2:G200", "=LEN($G2)>0", colors.amberSoft, "#92400E", true);
    addFormulaRule(personalSheet, "H2:H200", "=LEN($H2)>0", colors.amberSoft, "#92400E", true);
```

- [ ] **Step 3: Add async chart insertion**

Change the top-level wrapper from:

```javascript
() => {
```

to:

```javascript
async () => {
```

Before the final `return { success: true, ... }`, insert:

```javascript
  await univerAPI.getFormula().onCalculationResultApplied();

  let chartResult = { inserted: false, chartCount: 0, error: null };
  try {
    const chartInfo = dashboard
      .newChart()
      .setChartType(univerAPI.Enum.ChartType.Column)
      .addRange("N2:O6")
      .setPosition(2, 13, 0, 0)
      .setWidth(360)
      .setHeight(240)
      .setOptions("title.content", "Team Pulse")
      .build();
    await dashboard.insertChart(chartInfo);
    chartResult = {
      inserted: true,
      chartCount: dashboard.getCharts().length,
      error: null,
    };
  } catch (error) {
    chartResult = {
      inserted: false,
      chartCount: dashboard.getCharts ? dashboard.getCharts().length : 0,
      error: String(error && error.message ? error.message : error),
    };
  }
```

- [ ] **Step 4: Extend return object**

In the final return object, replace:

```javascript
    dashboardRange: "_Dashboard!A1:L9",
    personalLogRange: "log__sample_member!A1:Z2",
```

with:

```javascript
    dashboardRange: "_Dashboard!A1:Q12",
    chartSourceRange: "_Dashboard!N2:Q6",
    personalLogRange: "log__sample_member!A1:Z2",
    dashboardConditionalFormatRules: dashboard.getConditionalFormattingRules().length,
    peopleConditionalFormatRules: people.getConditionalFormattingRules().length,
    sampleLogConditionalFormatRules: log.getConditionalFormattingRules().length,
    dashboardCharts: chartResult,
```

- [ ] **Step 5: Syntax-check generator**

Run:

```bash
node --check tools/univer-team-standup/create-template-workbook.js
```

Expected: no output and exit code `0`.

- [ ] **Step 6: Commit formatting and chart changes**

Run:

```bash
git add tools/univer-team-standup/create-template-workbook.js
git commit -m "feat: add team pulse formatting and chart"
```

Expected: commit succeeds and includes only the generator.

### Task 4: Regenerate And Verify Workbook Template

**Files:**
- Replace via Univer CLI: `ops/team-ops.univer`

- [ ] **Step 1: Ensure workbook has no tracked edits before replacement**

Run:

```bash
git diff -- ops/team-ops.univer
git status --short -- ops/team-ops.univer
```

Expected: no output. If output appears, stop and inspect.

- [ ] **Step 2: Regenerate workbook through public Univer commands**

Run:

```bash
univer daemon stop || true
rm -rf /tmp/univer-team-standup-pulse.univer /tmp/team-ops.univer.previous
univer new /tmp/univer-team-standup-pulse.univer --name "Univer Team Standup"
univer run /tmp/univer-team-standup-pulse.univer --file tools/univer-team-standup/create-template-workbook.js
univer commit /tmp/univer-team-standup-pulse.univer --message "initialize team pulse standup workbook template"
mv ops/team-ops.univer /tmp/team-ops.univer.previous
cp -a /tmp/univer-team-standup-pulse.univer ops/team-ops.univer
univer daemon stop || true
```

Expected: each command exits with code `0`. The `univer run` JSON includes `dashboardConditionalFormatRules` greater than `0`. `dashboardCharts.inserted` should be `true`; if it is `false`, keep the workbook only if `dashboardCharts.error` contains a real chart runtime diagnostic and record it in the final verification notes.

- [ ] **Step 3: Verify workbook-visible dashboard**

Run:

```bash
univer inspect workbook ops/team-ops.univer | sed -n '1,24p'
univer pipe out ops/team-ops.univer --range '_Dashboard!A1:L12' --format tsv
univer pipe out ops/team-ops.univer --range '_Dashboard!N2:Q8' --format tsv
univer pipe out ops/team-ops.univer --range '_People!A1:K5' --format tsv
```

Expected:

- inspect output contains `Active Sheet: _Dashboard`
- dashboard output contains `Univer Team Pulse`, `UPDATE RATE`, `MISSING`, `BLOCKERS`, `RISKS`, `DAILY REPORT`
- chart source output contains headers `metric`, `value`, `color`, `note`
- `_People` sample rows remain `FALSE` / displayed as `0`

- [ ] **Step 4: Verify formula, conditional formatting, and chart readback**

Run:

```bash
univer run ops/team-ops.univer --code 'async () => {
  const workbook = univerAPI.getActiveWorkbook();
  const dashboard = workbook.getSheetByName("_Dashboard");
  const people = workbook.getSheetByName("_People");
  const log = workbook.getSheetByName("log__sample_member");
  if (!dashboard || !people || !log) return { success: false, error: "required sheet missing" };
  await univerAPI.getFormula().onCalculationResultApplied();
  return {
    success: true,
    dashboardRules: dashboard.getConditionalFormattingRules().length,
    peopleRules: people.getConditionalFormattingRules().length,
    logRules: log.getConditionalFormattingRules().length,
    dashboardCharts: dashboard.getCharts().length,
    updateRateFormula: dashboard.getRange("A4").getFormulas(),
    chartSource: dashboard.getRange("N2:Q6").getValues()
  };
}'
```

Expected JSON includes:

- `"success":true`
- `dashboardRules` greater than `0`
- `peopleRules` greater than `0`
- `logRules` greater than `0`
- `dashboardCharts` at least `1`, unless Task 4 Step 2 already recorded a real chart runtime diagnostic
- `updateRateFormula` includes `COUNTIFS`

- [ ] **Step 5: Commit generated workbook**

Run:

```bash
univer status ops/team-ops.univer
git add ops/team-ops.univer
git commit -m "feat: polish team standup workbook"
```

Expected before commit: `univer status` includes `pending mutations: 0`. Commit includes only `ops/team-ops.univer`.

### Task 5: Preview And Final Acceptance Verification

**Files:**
- Verify: `tools/univer-team-standup/create-template-workbook.js`
- Verify: `ops/team-ops.univer`

- [ ] **Step 1: Run final workbook-visible verification**

Run:

```bash
univer daemon stop || true
univer inspect workbook ops/team-ops.univer | sed -n '1,24p'
univer pipe out ops/team-ops.univer --range '_Dashboard!A1:L12' --format tsv
univer pipe out ops/team-ops.univer --range '_Dashboard!N2:Q8' --format tsv
univer status ops/team-ops.univer
```

Expected:

- active sheet is `_Dashboard`
- dashboard output shows Team Pulse metric zone
- chart source is visible in `N2:Q6`
- `pending mutations: 0`

- [ ] **Step 2: Preview workbook**

Run:

```bash
univer view ops/team-ops.univer --no-open --json
```

Expected: JSON contains a local preview URL or preview status. Keep the server running until the user no longer needs it.

- [ ] **Step 3: Verify no placeholder language in touched source**

Run:

```bash
rg -n "T[B]D|TO[D]O|implement la[t]er|fill in deta[i]ls|appropriate error handl[i]ng" tools/univer-team-standup/create-template-workbook.js docs/superpowers/specs/2026-05-18-team-ops-workbook-pulse-design.md docs/superpowers/plans/2026-05-18-team-ops-workbook-pulse.md
```

Expected: no output and exit code `1`.

- [ ] **Step 4: Review git state and commits**

Run:

```bash
git status --short --branch
git log --oneline -8
git diff main...HEAD --stat
```

Expected: `git status` may show only untracked `standup.md`. Recent commits include helper, dashboard layout, formatting/chart, generated workbook, and this plan. Diff stat contains planned files only plus prior branch work.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-18-team-ops-workbook-pulse.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
