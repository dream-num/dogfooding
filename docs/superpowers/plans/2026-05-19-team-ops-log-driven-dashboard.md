# Team Ops Log Driven Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Dashboard` a formula-driven presentation layer over `People` and `log__<member_id>` data while improving the analysis panel and professional formatting.

**Architecture:** `tools/univer-team-standup/create-template-workbook.js` remains the only source of truth for the generated template. `Dashboard` rows derive from `People` plus member log sheets through formulas and helper columns; append flows write only `log__<owner_id>` and `Audit`, leaving Dashboard rebuildable.

**Tech Stack:** JavaScript `univer run` script, `univer` CLI, workbook formulas, conditional formatting, number formats, Markdown docs, Git.

---

## Source Spec

- [docs/superpowers/specs/2026-05-19-team-ops-log-driven-dashboard-design.md](../specs/2026-05-19-team-ops-log-driven-dashboard-design.md)

## Files And Responsibilities

- Modify `tools/univer-team-standup/create-template-workbook.js`: add formula-driven Dashboard rows, hidden helper columns, enhanced analysis source, chart source, conditional formatting, number formats.
- Replace `ops/team-ops.univer`: regenerate from the script only through public `univer` commands.
- Modify `skills/univer-team-standup/SKILL.md`: make Dashboard explicitly presentation-only and remove append-time Dashboard refresh as a data write.
- Modify `docs/univer-team-standup-first-run.md`: clarify that Dashboard is derived from `People` and `log__<owner_id>`.
- Use `/tmp/team-ops-log-driven-review.univer` for sample data verification only.

Do not commit `ops-1.jpg` or `standup.md`.

## Task 1: Write Failing Layout/Data Contract Assertions

**Files:**
- Verify only: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Assert generator does not yet use the log-driven contract**

Run:

```bash
node - <<'JS'
const fs = require('fs');
const source = fs.readFileSync('tools/univer-team-standup/create-template-workbook.js', 'utf8');
const checks = [
  ['Dashboard member ids derive from People', /People!\$A\$2:\$A\$80/.test(source)],
  ['latest log uses created-time helper', /log__"&\$A11&"!X2:X200/.test(source) || /\$S11&"!X2:X200/.test(source)],
  ['append does not own Dashboard refresh copy', /Dashboard is presentation-only/.test(source)],
  ['chart source includes data quality', /缺日志表/.test(source) && /无日志/.test(source)],
  ['percentage format for update rate', /0\.0%/.test(source)]
];
const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length === 0) {
  console.error('Expected current generator to miss at least one new contract check.');
  process.exit(1);
}
console.log('Current generator misses new contract checks:');
for (const name of failed) console.log(`- ${name}`);
process.exit(0);
JS
```

Expected: command exits `0` and prints at least one missing contract check. This proves the assertions detect the current pre-change state.

## Task 2: Implement Dashboard Formula Helpers And Derived Rows

**Files:**
- Modify: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Add helper formula builders**

Add generator-local helpers near the existing formatting helpers:

```javascript
  const quoteSheetFormula = (sheetFormula) => sheetFormula.replace(/"/g, '""');

  const logRange = (row, columnLetter) => `INDIRECT($S${row}&"!${columnLetter}2:${columnLetter}200")`;

  const logCell = (row, cellA1) => `INDIRECT($S${row}&"!${cellA1}")`;

  const logTimeNumberExpression = (row) =>
    `IFERROR(VALUE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(LEFT(${logRange(row, "X")},19),"-",""),"T",""),":","")),0)`;

  const latestLogValueFormula = (row, columnLetter) =>
    `=IF($V${row}<>"有日志","",IF($U${row}="","",IFERROR(INDEX(${logRange(row, columnLetter)},$U${row})&"","")))`;
```

Expected: helpers centralize the repeated `INDIRECT` formulas so field formulas stay consistent.

- [ ] **Step 2: Replace Dashboard member formulas**

Replace the static empty Dashboard row setup so row `11:89` uses formulas:

```javascript
  dashboard.getRange("A11:K89").setValues(
    Array.from({ length: 79 }, (_, index) => {
      const row = index + 11;
      const peopleRow = index + 2;
      return [
        `=IF(People!$I${peopleRow}="是",People!$A${peopleRow},"")`,
        `=IF($A${row}="","",IFERROR(INDEX(People!$B$2:$B$80,MATCH($A${row},People!$A$2:$A$80,0)),""))`,
        `=IF($A${row}="","",IF($V${row}="缺日志表","缺日志表",IF($V${row}="无日志","无日志",IF($J${row}="","待更新",IF(LEFT($J${row},10)=TEXT(TODAY(),"yyyy-mm-dd"),"已更新","待更新")))))`,
        latestLogValueFormula(row, "P"),
        latestLogValueFormula(row, "Q"),
        latestLogValueFormula(row, "G"),
        latestLogValueFormula(row, "H"),
        latestLogValueFormula(row, "I"),
        latestLogValueFormula(row, "A"),
        latestLogValueFormula(row, "X"),
        `=IF($A${row}="","",IF($V${row}="缺日志表","缺日志表",IF($V${row}="无日志","无日志",IF($J${row}="","缺创建时间",IF(LEFT($J${row},10)=TEXT(TODAY(),"yyyy-mm-dd"),"今日已同步","需要更新")))))`,
      ];
    })
  );
```

Expected: Dashboard visible rows are formulas. Users do not type progress into Dashboard.

- [ ] **Step 3: Add helper columns S:W**

Write helper formulas:

```javascript
  dashboard.getRange("S11:W89").setValues(
    Array.from({ length: 79 }, (_, index) => {
      const row = index + 11;
      const timeNumbers = logTimeNumberExpression(row);
      return [
        `=IF($A${row}="","","log__"&$A${row})`,
        `=IF($A${row}="","",IF($V${row}<>"有日志","",IFERROR(MAX(${timeNumbers}),"")))`,
        `=IF($T${row}="","",IFERROR(MATCH($T${row},${timeNumbers},0),""))`,
        `=IF($A${row}="","",IF(IFERROR(${logCell(row, "A1")},"")<>"日志ID","缺日志表",IF(COUNTA(${logRange(row, "A")})=0,"无日志","有日志")))`,
        `=IF($A${row}="","",IF($V${row}<>"有日志",$V${row},IF($J${row}="","缺创建时间","数据正常")))`,
      ];
    })
  );
```

Expected: helper columns hold sheet name, latest timestamp number, latest row index, log availability, and data quality status.

- [ ] **Step 4: Narrow helper columns**

Extend Dashboard widths so columns `S:W` exist and are narrow:

```javascript
  setWidths(dashboard, [
    130, 150, 130, 300, 320, 240, 240, 300, 210, 220, 160, 24,
    110, 120, 90, 260, 140, 130, 24, 24, 24, 24, 24,
  ]);
```

Expected: helpers are available for formulas but visually minimized.

## Task 3: Enhance Metrics, Chart Source, And Formatting

**Files:**
- Modify: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Update top metrics**

Update formulas so top metrics count derived member rows:

```javascript
  dashboard.getRange("A6").setFormula('=COUNTIFS($A$11:$A$89,"<>",$C$11:$C$89,"已更新")');
  dashboard.getRange("D6").setFormula('=COUNTIFS($A$11:$A$89,"<>",$C$11:$C$89,"<>已更新",$C$11:$C$89,"<>")');
  dashboard.getRange("G6").setFormula('=COUNTIFS($F$11:$F$89,"<>",$A$11:$A$89,"<>")');
  dashboard.getRange("J6").setFormula('=COUNTIFS($G$11:$G$89,"<>",$A$11:$A$89,"<>")');
  dashboard.getRange("M6").setFormula('=IF(COUNT($T$11:$T$89)=0,"-",INDEX($J$11:$J$89,MATCH(MAX($T$11:$T$89),$T$11:$T$89,0)))');
```

Expected: metrics rely on formulas and helper timestamp values.

- [ ] **Step 2: Replace right-side analysis source**

Use `M30:R39` as a richer analysis source:

```javascript
  dashboard.getRange("M30:R39").setValues([
    ["指标", "数值", "颜色", "说明", "状态", ""],
    ["启用成员", '=COUNTIF($A$11:$A$89,"<>")', colors.blue, "People 中启用的成员", "规模", ""],
    ["今日已更新", '=COUNTIFS($A$11:$A$89,"<>",$C$11:$C$89,"已更新")', colors.green, "今天已经提交日志", "健康", ""],
    ["待更新", '=COUNTIFS($A$11:$A$89,"<>",$C$11:$C$89,"待更新")', colors.amber, "需要补充晨会更新", "关注", ""],
    ["阻塞", '=COUNTIFS($A$11:$A$89,"<>",$F$11:$F$89,"<>")', colors.red, "最近日志包含阻塞", "处理", ""],
    ["风险", '=COUNTIFS($A$11:$A$89,"<>",$G$11:$G$89,"<>")', colors.amber, "最近日志包含风险", "观察", ""],
    ["缺日志表", '=COUNTIFS($A$11:$A$89,"<>",$V$11:$V$89,"缺日志表")', colors.red, "成员缺少 log__member 表", "修复", ""],
    ["无日志", '=COUNTIFS($A$11:$A$89,"<>",$V$11:$V$89,"无日志")', colors.muted, "日志表存在但没有数据", "冷启动", ""],
    ["今日更新率", '=IF(N31=0,0,N32/N31)', colors.teal, "今日已更新 / 启用成员", "比率", ""],
    ["数据异常", '=N36+N37', colors.red, "缺日志表 + 无日志", "质量", ""],
  ]);
```

Expected: the chart and side table communicate coverage, follow-up, and data quality.

- [ ] **Step 3: Update chart range and title**

Set chart source to `M31:N38`, keep the chart on the right:

```javascript
      .addRange("M31:N38")
      .setPosition(10, 12, 0, 0)
      .setWidth(640)
      .setHeight(250)
      .setOptions("title.content", "团队更新态势")
```

Expected: one right-side chart shows more than basic update distribution.

- [ ] **Step 4: Apply number formats**

Add number formats:

```javascript
  dashboard.getRange("A6:J6").setNumberFormats([["0", "", "", "0", "", "", "0", "", "", "0"]]);
  dashboard.getRange("N31:N38").setNumberFormats(Array.from({ length: 8 }, () => ["0"]));
  dashboard.getRange("N39").setNumberFormats([["0.0%"]]);
```

Expected: counts and percentage read cleanly.

- [ ] **Step 5: Add more conditional formatting**

Add rules for Dashboard status and data quality:

```javascript
  addTextRule(dashboard, "C11:C89", "缺日志表", colors.redSoft, colors.red, true);
  addTextRule(dashboard, "C11:C89", "无日志", colors.graySoft, colors.muted, false);
  addTextRule(dashboard, "K11:K89", "今日已同步", colors.greenSoft, colors.green, true);
  addTextRule(dashboard, "K11:K89", "需要更新", colors.amberSoft, colors.amber, true);
  addTextRule(dashboard, "K11:K89", "缺日志表", colors.redSoft, colors.red, true);
  addTextRule(dashboard, "K11:K89", "无日志", colors.graySoft, colors.muted, false);
```

Expected: bad states are visually obvious without reading long text.

## Task 4: Update Skill Docs For Presentation/Data Separation

**Files:**
- Modify: `skills/univer-team-standup/SKILL.md`
- Modify: `docs/univer-team-standup-first-run.md`

- [ ] **Step 1: Update append flow**

In `skills/univer-team-standup/SKILL.md`, replace append instructions that say to update Dashboard rows with wording that append writes only the current member log and Audit. Add:

```markdown
Dashboard is presentation-only. Do not write member progress into Dashboard cells during append. Dashboard formulas derive visible member state from `People` and `log__<owner_id>`.
```

Expected: agents do not create a second source of truth in Dashboard.

- [ ] **Step 2: Update workbook contract**

Add to workbook contract:

```markdown
Dashboard visible rows are derived. Treat `People` and `log__<owner_id>` as data sources; treat Dashboard as rebuildable presentation.
```

Expected: the skill contract matches the generated workbook.

- [ ] **Step 3: Update first-run guide**

In `docs/univer-team-standup-first-run.md`, add that after onboarding the Dashboard row appears from the `People` row and becomes populated after the first append to `log__<owner_id>`.

Expected: first-run users understand why Dashboard is initially sparse.

## Task 5: Regenerate Workbook And Verify With Realistic Logs

**Files:**
- Replace: `ops/team-ops.univer`
- Use: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Regenerate template**

Run:

```bash
rm -rf /tmp/team-ops-log-driven.univer /tmp/team-ops-log-driven.previous
univer new /tmp/team-ops-log-driven.univer --json
univer run /tmp/team-ops-log-driven.univer --file tools/univer-team-standup/create-template-workbook.js
mv ops/team-ops.univer /tmp/team-ops-log-driven.previous
cp -a /tmp/team-ops-log-driven.univer ops/team-ops.univer
univer commit ops/team-ops.univer --message "regenerate log driven dashboard"
```

Expected: generated workbook has `Dashboard`, `People`, `Audit`, and `log__sample_member`, with `localMutationCount:0` after commit.

- [ ] **Step 2: Create temporary sample review copy**

Run a `/tmp` review copy with at least three enabled members and two real `log__<member_id>` sheets. Include one missing log sheet, one no-log sheet, one out-of-order timestamp case, one blocker, and one risk.

Expected: formulas show `已更新`, `待更新`, `缺日志表`, and `无日志` across sample members.

- [ ] **Step 3: Verify latest log selection**

In the review copy, verify a member with out-of-order rows shows the fields from the maximum `创建时间`, not the bottom row.

Expected: `Dashboard!J11` and visible fields match the newest timestamp.

- [ ] **Step 4: Verify chart and metric source**

Run:

```bash
univer pipe out /tmp/team-ops-log-driven-review.univer --range 'Dashboard!M30:R39' --format tsv
```

Expected: output includes non-zero counts for enabled members, today updates, blockers, risks, missing log table, no logs, and update rate.

- [ ] **Step 5: Verify formal template stays sample-free**

Run:

```bash
univer search ops/team-ops.univer 洛神 --json
univer search ops/team-ops.univer 米拉 --json
univer status ops/team-ops.univer --json
```

Expected: searches return `matchCount:0`; status returns `localMutationCount:0`.

## Task 6: Commit

**Files:**
- Commit: `docs/superpowers/specs/2026-05-19-team-ops-log-driven-dashboard-design.md`
- Commit: `docs/superpowers/plans/2026-05-19-team-ops-log-driven-dashboard.md`
- Commit: `tools/univer-team-standup/create-template-workbook.js`
- Commit: `ops/team-ops.univer`
- Commit: `skills/univer-team-standup/SKILL.md`
- Commit: `docs/univer-team-standup-first-run.md`

- [ ] **Step 1: Final verification**

Run:

```bash
node --check tools/univer-team-standup/create-template-workbook.js
univer inspect workbook ops/team-ops.univer | sed -n '1,18p'
univer status ops/team-ops.univer --json
git status --short
```

Expected: syntax passes, Dashboard is active and first, `localMutationCount:0`, and only intended tracked files plus the existing untracked `ops-1.jpg` and `standup.md` appear.

- [ ] **Step 2: Commit**

Run:

```bash
git add docs/superpowers/specs/2026-05-19-team-ops-log-driven-dashboard-design.md \
  docs/superpowers/plans/2026-05-19-team-ops-log-driven-dashboard.md \
  tools/univer-team-standup/create-template-workbook.js \
  ops/team-ops.univer \
  skills/univer-team-standup/SKILL.md \
  docs/univer-team-standup-first-run.md
git commit -m "feat: derive dashboard from member logs"
```

Expected: commit contains only intended files.
