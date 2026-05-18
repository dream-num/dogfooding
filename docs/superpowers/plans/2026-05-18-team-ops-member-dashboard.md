# Team Ops Member Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `ops/team-ops.univer` into a polished member-only SaaS-style dashboard workbook generated from `tools/univer-team-standup/create-template-workbook.js`.

**Architecture:** `tools/univer-team-standup/create-template-workbook.js` remains the workbook source of truth and is the only committed generator for the template. The workbook contains `Dashboard`, `People`, `Audit`, and `log__sample_member`, with `Dashboard` first and active. The skill and first-run docs are updated to the same member-only contract; review sample data is injected only into a temporary workbook copy.

**Tech Stack:** JavaScript `univer run` script, `univer` CLI workbook commands, Markdown docs, Git.

---

## Source Spec

- [docs/superpowers/specs/2026-05-18-team-ops-member-dashboard-design.md](../specs/2026-05-18-team-ops-member-dashboard-design.md)

## Files And Responsibilities

- Modify `tools/univer-team-standup/create-template-workbook.js`: generated workbook structure, sheet names, Chinese headers, Dashboard visual layout, formulas, conditional formatting, chart insertion, active sheet selection, return readback metadata.
- Replace `ops/team-ops.univer`: regenerated workbook package produced by `univer new` + `univer run`; do not edit package internals.
- Modify `skills/univer-team-standup/SKILL.md`: remove host/report workflow, update sheet contracts and member-only boundaries.
- Modify `docs/univer-team-standup-first-run.md`: update first-run guide to member-only onboarding and append flow.
- Use only temporary `/tmp/team-ops-member-dashboard-review.univer` for review sample data; do not commit it.

Keep existing untracked `standup.md` untouched.

## Task 1: Establish Current Failure Against New Contract

**Files:**
- Verify only: `tools/univer-team-standup/create-template-workbook.js`
- Verify only: `ops/team-ops.univer`
- Verify only: `skills/univer-team-standup/SKILL.md`
- Verify only: `docs/univer-team-standup-first-run.md`

- [ ] **Step 1: Confirm worktree scope**

Run:

```bash
git status --short
```

Expected:

```text
?? standup.md
```

If other paths appear, inspect them before continuing. Do not revert user changes.

- [ ] **Step 2: Run current workbook inspection**

Run:

```bash
univer inspect workbook ops/team-ops.univer | sed -n '1,18p'
```

Expected before implementation: output contains `Active Sheet: _Dashboard` and includes `_People`, `_Reports`, `_Audit`, and `_Dashboard`. This proves the current workbook violates the new sheet naming and `Reports` removal requirements.

- [ ] **Step 3: Run current Dashboard readback**

Run:

```bash
univer pipe out ops/team-ops.univer --range '_Dashboard!A1:L12' --format tsv
```

Expected before implementation: output includes English text such as `Univer Team Pulse`, `UPDATE RATE`, `Sample Member`, or `sample / inactive`. This proves the visible workbook is not yet Chinese-first.

- [ ] **Step 4: Run current contract search**

Run:

```bash
rg -n "host|generateDay|Reports|_Dashboard|_People|_Reports|_Audit" \
  tools/univer-team-standup/create-template-workbook.js \
  skills/univer-team-standup/SKILL.md \
  docs/univer-team-standup-first-run.md
```

Expected before implementation: matches exist in all three files. These are the exact legacy concepts this plan removes or migrates.

## Task 2: Update Generator Sheet Contract And Safety Model

**Files:**
- Modify: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Replace workbook sheet definitions**

In `tools/univer-team-standup/create-template-workbook.js`, replace the current `desiredSheets` block with:

```javascript
  const desiredSheets = [
    { name: "Dashboard", rows: 90, cols: 18 },
    { name: "People", rows: 80, cols: 10 },
    { name: "Audit", rows: 200, cols: 10 },
    { name: "log__sample_member", rows: 200, cols: 26 },
  ];

  const legacyTemplateSheets = new Set(["_Dashboard", "_People", "_Reports", "_Audit", "log__sample_host"]);
```

Then keep:

```javascript
  const desiredSheetNames = desiredSheets.map((definition) => definition.name);
```

Expected result: the generator knows only the new member-only system sheets plus the personal log sample; old underscored system sheets and sample host sheet are recognized only as legacy cleanup candidates.

- [ ] **Step 2: Replace the existing sheet safety loop**

Replace the current loop that rejects non-desired sheets with this exact loop:

```javascript
  for (const sheet of workbook.getSheets()) {
    const name = sheet.getSheetName();
    const isDesiredSheet = desiredSheetNames.includes(name);
    const isLegacyTemplateSheet = legacyTemplateSheets.has(name);
    const isEmptySheet = sheetAppearsEmpty(sheet);

    if (isDesiredSheet && !isEmptySheet) {
      return {
        success: false,
        error: "Existing member dashboard template sheet contains data; refusing to regenerate template",
        sheetName: name,
      };
    }

    if (!isDesiredSheet && !isLegacyTemplateSheet && !isEmptySheet) {
      return {
        success: false,
        error: "Unexpected non-empty sheet found; refusing to regenerate member dashboard template",
        sheetName: name,
      };
    }
  }
```

Expected result: fresh blank `Sheet1` and empty legacy template sheets can be removed, but unknown non-empty user data blocks regeneration.

- [ ] **Step 3: Keep `ensureSheet` and deletion behavior but apply new names**

The existing `ensureSheet` function can stay. Keep this deletion loop shape:

```javascript
  workbook.getSheets().forEach((sheet) => {
    const name = sheet.getSheetName();
    if (!desiredSheetNames.includes(name)) {
      deletedSheets.push(name);
      workbook.deleteSheet(sheet.getSheetId());
    }
  });
```

Expected result: after desired sheets are created, blank `Sheet1` and legacy sheets are removed. If the temporary workbook starts from `Sheet1`, the final order is `Dashboard`, `People`, `Audit`, `log__sample_member`.

- [ ] **Step 4: Remove Reports and host counters**

Replace:

```javascript
  let dashboardConditionalFormatRules = 0;
  let peopleConditionalFormatRules = 0;
  let sampleLogConditionalFormatRules = 0;
```

with:

```javascript
  let dashboardConditionalFormatRules = 0;
  let peopleConditionalFormatRules = 0;
  let auditConditionalFormatRules = 0;
  let sampleLogConditionalFormatRules = 0;
```

Expected result: the generator has no Reports-specific state and can report Audit formatting separately.

- [ ] **Step 5: Run JavaScript syntax check**

Run:

```bash
node --check tools/univer-team-standup/create-template-workbook.js
```

Expected:

```text
```

The command exits `0` with no output.

- [ ] **Step 6: Commit generator sheet contract**

Run:

```bash
git add tools/univer-team-standup/create-template-workbook.js
git commit -m "refactor: simplify team ops workbook sheets"
```

Expected: commit includes only `tools/univer-team-standup/create-template-workbook.js`.

## Task 3: Rebuild Dashboard As Chinese Data Cockpit

**Files:**
- Modify: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Replace Dashboard sheet lookup and clear range**

Replace:

```javascript
  const dashboard = sheets["_Dashboard"];
  clearTemplateRange(dashboard, "_Dashboard", "A1:Q80");
```

with:

```javascript
  const dashboard = sheets["Dashboard"];
  clearTemplateRange(dashboard, "Dashboard", "A1:R90");
```

Expected result: the Dashboard block targets the new sheet name and larger layout area.

- [ ] **Step 2: Replace the Dashboard header and metric zone**

Replace the old Dashboard setup from `dashboard.setHiddenGridlines(true);` through the old metric cell assignments ending at `dashboard.getRange("A6:L6")...setFontSize(12);` with:

```javascript
  dashboard.setHiddenGridlines(true);
  dashboard.setGridLinesColor(colors.grid);
  dashboard.setFrozenRows(15);
  dashboard.setFrozenColumns(2);
  dashboard.getRange("A1:R90").setBackgroundColor(colors.canvas);

  dashboard.getRange("A1:L3").merge({ isForceMerge: true });
  dashboard.getRange("A1").setValue("团队晨会驾驶舱");
  dashboard
    .getRange("A1:L3")
    .setBackgroundColor(colors.navy)
    .setFontColor("#F8FAFC")
    .setFontWeight("bold")
    .setFontSize(22)
    .setVerticalAlignment("middle");

  dashboard.getRange("M1:R3").setBackgroundColor(colors.navy2).setVerticalAlignment("middle");
  dashboard.getRange("M1:N1").merge({ isForceMerge: true });
  dashboard.getRange("M1").setValue("今日日期");
  dashboard.getRange("O1:R1").merge({ isForceMerge: true });
  dashboard.getRange("O1").setFormula("=TODAY()");
  dashboard.getRange("M2:N2").merge({ isForceMerge: true });
  dashboard.getRange("M2").setValue("模板状态");
  dashboard.getRange("O2:R2").merge({ isForceMerge: true });
  dashboard.getRange("O2").setValue("干净模板");
  dashboard.getRange("M3:N3").merge({ isForceMerge: true });
  dashboard.getRange("M3").setValue("同步策略");
  dashboard.getRange("O3:R3").merge({ isForceMerge: true });
  dashboard.getRange("O3").setValue("显式发布，不自动同步");
  dashboard
    .getRange("M1:R3")
    .setFontColor("#DBEAFE")
    .setFontWeight("bold")
    .setFontSize(11);

  dashboard.getRange("A5:R8").setBackgroundColor(colors.panel).setVerticalAlignment("middle");
  ["A5:C8", "D5:F8", "G5:I8", "J5:L8", "M5:R8"].forEach((rangeA1) => {
    dashboard.getRange(rangeA1).setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, colors.grid);
  });
  dashboard.getRange("A5").setValue("已更新成员");
  dashboard.getRange("A6").setFormula('=COUNTIFS($A$16:$A$80,"<>",$C$16:$C$80,"已更新")');
  dashboard.getRange("D5").setValue("待更新");
  dashboard.getRange("D6").setFormula('=COUNTIFS($A$16:$A$80,"<>",$C$16:$C$80,"<>已更新")');
  dashboard.getRange("G5").setValue("阻塞");
  dashboard.getRange("G6").setFormula('=COUNTIFS($F$16:$F$80,"<>",$A$16:$A$80,"<>")');
  dashboard.getRange("J5").setValue("风险");
  dashboard.getRange("J6").setFormula('=COUNTIFS($G$16:$G$80,"<>",$A$16:$A$80,"<>")');
  dashboard.getRange("M5").setValue("最后写入");
  dashboard.getRange("M6").setFormula('=IFERROR(MAX($J$16:$J$80),"-")');
  dashboard.getRange("A7").setValue("来自成员看板");
  dashboard.getRange("D7").setValue("等待 member append");
  dashboard.getRange("G7").setValue("红色高亮");
  dashboard.getRange("J7").setValue("琥珀色高亮");
  dashboard.getRange("M7").setValue("最近更新时间");
  dashboard
    .getRange("A5:R5")
    .setFontColor(colors.muted)
    .setFontWeight("bold")
    .setFontSize(10);
  dashboard
    .getRange("A6:R6")
    .setFontColor(colors.text)
    .setFontWeight("bold")
    .setFontSize(20);
  dashboard
    .getRange("A7:R8")
    .setFontColor(colors.muted)
    .setFontSize(10);
```

Expected result: Dashboard has a Chinese title band and metric cards with formulas against rows 16-80.

- [ ] **Step 3: Add update distribution section above member board**

Insert this immediately after the metric zone:

```javascript
  dashboard.getRange("A10:R13").setBackgroundColor(colors.panel).setVerticalAlignment("middle");
  dashboard.getRange("A10:R10").merge({ isForceMerge: true });
  dashboard.getRange("A10").setValue("更新分布");
  dashboard
    .getRange("A10:R10")
    .setBackgroundColor("#EAF1FF")
    .setFontColor(colors.text)
    .setFontWeight("bold")
    .setFontSize(12);
  dashboard.getRange("A11:R13").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, colors.grid);

  dashboard.getRange("N11:R15").setBackgroundColor("#F8FAFC").setVerticalAlignment("middle");
  dashboard.getRange("N11:R11").setValues([["指标", "数值", "颜色", "说明", "状态"]]);
  dashboard.getRange("N12").setValue("已更新");
  dashboard.getRange("O12").setFormula('=COUNTIFS($A$16:$A$80,"<>",$C$16:$C$80,"已更新")');
  dashboard.getRange("P12").setValue(colors.green);
  dashboard.getRange("Q12").setValue("已完成当天更新的成员");
  dashboard.getRange("R12").setValue("正常");
  dashboard.getRange("N13").setValue("待更新");
  dashboard.getRange("O13").setFormula('=COUNTIFS($A$16:$A$80,"<>",$C$16:$C$80,"<>已更新")');
  dashboard.getRange("P13").setValue(colors.amber);
  dashboard.getRange("Q13").setValue("需要补充晨会内容");
  dashboard.getRange("R13").setValue("关注");
  dashboard.getRange("N14").setValue("阻塞");
  dashboard.getRange("O14").setFormula('=COUNTIFS($F$16:$F$80,"<>",$A$16:$A$80,"<>")');
  dashboard.getRange("P14").setValue(colors.red);
  dashboard.getRange("Q14").setValue("需要当天处理");
  dashboard.getRange("R14").setValue("高优先级");
  dashboard.getRange("N15").setValue("风险");
  dashboard.getRange("O15").setFormula('=COUNTIFS($G$16:$G$80,"<>",$A$16:$A$80,"<>")');
  dashboard.getRange("P15").setValue(colors.amber);
  dashboard.getRange("Q15").setValue("需要持续关注");
  dashboard.getRange("R15").setValue("观察");
  styleHeader(dashboard.getRange("N11:R11"), colors.header, colors.text);
  dashboard.getRange("N11:R15").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, colors.grid);
```

Expected result: chart source is above the member board but weakly styled; formulas remain readable via pipe output.

- [ ] **Step 4: Replace member board headers and remove sample rows**

Replace the old `dashboard.getRange("A8:L8").setValues(...)` and `dashboard.getRange("A9:L10").setValues(...)` block with:

```javascript
  dashboard.getRange("A15:K15").setValues([[
    "成员ID",
    "成员",
    "更新状态",
    "昨天完成",
    "今天计划",
    "阻塞",
    "风险",
    "下一步",
    "最近日志",
    "最近更新时间",
    "预览状态",
  ]]);
  styleHeader(dashboard.getRange("A15:K15"), colors.header, colors.text);
  dashboard.getRange("A15:K15").setFontSize(10);
  dashboard.getRange("A16:K80").setBackgroundColor(colors.panel);
  dashboard.getRange("A15:K80").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, colors.grid);
  dashboard.getRange("A16:K80").setVerticalAlignment("top");
  dashboard.getRange("D16:H80").setWrap(true).setVerticalAlignment("top");
```

Expected result: the formal template has no example member rows and the member board starts at row 15.

- [ ] **Step 5: Replace Dashboard conditional formatting ranges**

Replace the old Dashboard conditional formatting calls with:

```javascript
  addTextRule(dashboard, "C16:C80", "已更新", colors.greenSoft, colors.green, true);
  addTextRule(dashboard, "C16:C80", "待更新", colors.amberSoft, colors.amber, true);
  addFormulaRule(dashboard, "F16:F80", "=LEN($F16)>0", colors.redSoft, colors.red, true);
  addFormulaRule(dashboard, "G16:G80", "=LEN($G16)>0", colors.amberSoft, colors.amber, true);
  addTextRule(dashboard, "K16:K80", "本地预览", colors.blueSoft, colors.blue, false);
  dashboardConditionalFormatRules += 5;
```

Expected result: status, blocker, risk, and preview state chips use Chinese text.

- [ ] **Step 6: Replace Dashboard widths and heights**

Replace the old Dashboard width/height lines with:

```javascript
  setWidths(dashboard, [130, 150, 130, 300, 320, 240, 240, 300, 210, 220, 160, 24, 110, 120, 90, 260, 140, 130]);
  setHeights(dashboard, [
    [0, 34],
    [1, 34],
    [2, 34],
    [4, 26],
    [5, 38],
    [6, 24],
    [9, 30],
    [14, 30],
  ]);
  dashboard.setRowHeights(15, 65, 58);
```

Expected result: member rows have stable height for Chinese long text.

- [ ] **Step 7: Replace chart insertion source and title**

Replace the existing chart insertion block source and title values:

```javascript
      .addRange("N11:O15")
      .setPosition(10, 0, 0, 0)
      .setWidth(720)
      .setHeight(220)
      .setOptions("title.content", "更新分布")
```

Keep the surrounding `try/catch` and return object. Expected result: chart is wide and sits above the member board.

- [ ] **Step 8: Set Dashboard active**

After the chart `try/catch`, before the final `return`, add:

```javascript
  workbook.setActiveSheet(dashboard);
```

Expected result: `Dashboard` remains the first sheet and becomes the active sheet after all later sheets are created.

- [ ] **Step 9: Update returned range metadata**

In the final return object, replace the old ranges with:

```javascript
    dashboardRange: "Dashboard!A1:R20",
    chartSourceRange: "Dashboard!N11:R15",
    personalLogRange: "log__sample_member!A1:Z1",
```

Include the new Audit counter:

```javascript
    auditConditionalFormatRules,
```

Expected result: run output describes the new workbook-visible ranges.

- [ ] **Step 10: Run syntax check**

Run:

```bash
node --check tools/univer-team-standup/create-template-workbook.js
```

Expected: command exits `0` with no output.

- [ ] **Step 11: Commit Dashboard generator changes**

Run:

```bash
git add tools/univer-team-standup/create-template-workbook.js
git commit -m "feat: add member dashboard cockpit layout"
```

Expected: commit includes only `tools/univer-team-standup/create-template-workbook.js`.

## Task 4: Update People, Audit, And Personal Log Sheets

**Files:**
- Modify: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Replace People block**

Replace the current `_People` block with:

```javascript
  const people = sheets["People"];
  clearTemplateRange(people, "People", "A1:J80");
  people.setHiddenGridlines(true);
  people.setFrozenRows(1);
  people.setFrozenColumns(2);
  people.getRange("A1:J1").setValues([[
    "成员ID",
    "显示名称",
    "GitHub账号",
    "AgentID",
    "个人日志表",
    "默认仓库",
    "默认项目",
    "时区",
    "是否启用",
    "更新时间",
  ]]);
  styleHeader(people.getRange("A1:J1"), "#EEF3F8", colors.text);
  people.getRange("A1:J80").setBackgroundColor(colors.panel);
  people.getRange("A1:J1").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  setWidths(people, [150, 160, 160, 230, 190, 220, 180, 150, 110, 230]);
  addTextRule(people, "I2:I80", "是", colors.greenSoft, colors.green, true);
  addTextRule(people, "I2:I80", "否", colors.graySoft, colors.muted, false);
  peopleConditionalFormatRules += 2;
```

Expected result: People has only member registration fields and no sample rows.

- [ ] **Step 2: Delete the Reports block**

Remove the entire block beginning with:

```javascript
  const reports = sheets["_Reports"];
```

and ending after the old `setWidths(reports, ...)` call.

Expected result: the generator has no `reports` variable and no `Reports` sheet writes.

- [ ] **Step 3: Replace Audit block**

Replace the current `_Audit` block with:

```javascript
  const audit = sheets["Audit"];
  clearTemplateRange(audit, "Audit", "A1:J200");
  audit.setHiddenGridlines(true);
  audit.setFrozenRows(1);
  audit.getRange("A1:J1").setValues([[
    "审计ID",
    "创建时间",
    "成员ID",
    "AgentID",
    "操作",
    "工作表",
    "范围",
    "日志ID",
    "操作摘要",
    "状态",
  ]]);
  styleHeader(audit.getRange("A1:J1"), "#EEF3F8", colors.text);
  audit.getRange("A1:J200").setBackgroundColor(colors.panel);
  audit.getRange("A1:J1").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  setWidths(audit, [190, 230, 150, 230, 160, 150, 120, 210, 360, 120]);
  addTextRule(audit, "J2:J200", "成功", colors.greenSoft, colors.green, true);
  addTextRule(audit, "J2:J200", "失败", colors.redSoft, colors.red, true);
  auditConditionalFormatRules += 2;
```

Expected result: Audit is lightweight and member-only.

- [ ] **Step 4: Replace log headers with Chinese headers**

Replace the `logHeaders` array with:

```javascript
  const logHeaders = [
    "日志ID",
    "日期",
    "成员ID",
    "工作项",
    "状态",
    "优先级",
    "阻塞",
    "风险",
    "下一步",
    "仓库",
    "分支",
    "关联项",
    "分类",
    "模块",
    "规模",
    "昨天完成",
    "今天计划",
    "影响",
    "证据",
    "来源",
    "AgentID",
    "置信度",
    "原始备注",
    "创建时间",
    "校验时间",
    "校验码",
  ];
```

Expected result: `log__sample_member` has Chinese visible headers while retaining the same 26-column order.

- [ ] **Step 5: Replace log status conditional formatting text**

Replace `addSampleLogConditionalFormatting` with:

```javascript
  const addSampleLogConditionalFormatting = (sheet) => {
    addTextRule(sheet, "E2:E200", "已完成", colors.greenSoft, colors.green, true);
    addTextRule(sheet, "E2:E200", "待确认", colors.amberSoft, colors.amber, true);
    addFormulaRule(sheet, "G2:G200", "=LEN($G2)>0", colors.redSoft, colors.red, true);
    addFormulaRule(sheet, "H2:H200", "=LEN($H2)>0", colors.amberSoft, colors.amber, true);
    return 4;
  };
```

Expected result: personal log sheet status formatting uses Chinese status values.

- [ ] **Step 6: Remove sample data row and sample host sheet styling**

Replace the current sample member log setup with:

```javascript
  const log = sheets["log__sample_member"];
  clearTemplateRange(log, "log__sample_member", "A1:Z200");
  log.getRange("A1:Z1").setValues([logHeaders]);
  styleLogSheet(log);
  sampleLogConditionalFormatRules += addSampleLogConditionalFormatting(log);
  log.getRange("A1:Z1").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, "#D7DEE8");
```

Delete the `["log__sample_host"].forEach(...)` block entirely.

Expected result: formal template has no instance data and no host sample sheet.

- [ ] **Step 7: Verify old generator write paths are gone**

Run:

```bash
rg -n 'const reports|sheets\["_Reports"\]|clearTemplateRange\(reports|setWidths\(reports|sample-host|host|generateDay|Sample Member|Sample Host|Univer Team Pulse' tools/univer-team-standup/create-template-workbook.js
```

Expected: no output. It is acceptable for `legacyTemplateSheets` to contain old underscored sheet names for cleanup.

- [ ] **Step 8: Run syntax check**

Run:

```bash
node --check tools/univer-team-standup/create-template-workbook.js
```

Expected: command exits `0` with no output.

- [ ] **Step 9: Commit support sheet generator changes**

Run:

```bash
git add tools/univer-team-standup/create-template-workbook.js
git commit -m "feat: localize member workbook sheets"
```

Expected: commit includes only `tools/univer-team-standup/create-template-workbook.js`.

## Task 5: Regenerate And Verify `ops/team-ops.univer`

**Files:**
- Replace via Univer CLI: `ops/team-ops.univer`
- Use: `tools/univer-team-standup/create-template-workbook.js`

- [ ] **Step 1: Stop stale daemon if needed**

Run:

```bash
univer daemon status || true
```

If a later command reports `Daemon build mismatch`, run:

```bash
univer daemon stop
```

Expected: daemon mismatch is cleared before regeneration.

- [ ] **Step 2: Generate a fresh workbook in `/tmp`**

Run:

```bash
rm -rf /tmp/team-ops-member-dashboard.univer /tmp/team-ops.univer.previous
univer new /tmp/team-ops-member-dashboard.univer --json
univer run /tmp/team-ops-member-dashboard.univer --file tools/univer-team-standup/create-template-workbook.js
```

Expected: `univer run` JSON includes `"success":true`, sheets `["Dashboard","People","Audit","log__sample_member"]`, `dashboardRange:"Dashboard!A1:R20"`, and `chartSourceRange:"Dashboard!N11:R15"`.

- [ ] **Step 3: Replace repository workbook package**

Run:

```bash
mv ops/team-ops.univer /tmp/team-ops.univer.previous
cp -a /tmp/team-ops-member-dashboard.univer ops/team-ops.univer
```

Expected: `ops/team-ops.univer` is replaced by a package generated from the current script. Do not copy from or inspect package internals.

- [ ] **Step 4: Verify sheet order and active sheet**

Run:

```bash
univer inspect workbook ops/team-ops.univer | sed -n '1,22p'
```

Expected:

```text
Active Sheet: Dashboard
Sheet Count: 4
| 1 | Dashboard |
| 2 | People |
| 3 | Audit |
| 4 | log__sample_member |
```

The table may include used ranges and counts, but sheet names and order must match exactly.

- [ ] **Step 5: Verify Dashboard visible content**

Run:

```bash
univer pipe out ops/team-ops.univer --range 'Dashboard!A1:R20' --format tsv
```

Expected output includes:

```text
团队晨会驾驶舱
今日日期
模板状态
显式发布，不自动同步
已更新成员
待更新
阻塞
风险
更新分布
成员ID	成员	更新状态	昨天完成	今天计划	阻塞	风险	下一步	最近日志	最近更新时间	预览状态
```

Expected output does not include sample member rows.

- [ ] **Step 6: Verify support sheet headers**

Run:

```bash
univer pipe out ops/team-ops.univer --range 'People!A1:J3' --format tsv
univer pipe out ops/team-ops.univer --range 'Audit!A1:J3' --format tsv
univer pipe out ops/team-ops.univer --range 'log__sample_member!A1:Z3' --format tsv
```

Expected headers:

```text
成员ID	显示名称	GitHub账号	AgentID	个人日志表	默认仓库	默认项目	时区	是否启用	更新时间
审计ID	创建时间	成员ID	AgentID	操作	工作表	范围	日志ID	操作摘要	状态
日志ID	日期	成员ID	工作项	状态	优先级	阻塞	风险	下一步	仓库	分支	关联项	分类	模块	规模	昨天完成	今天计划	影响	证据	来源	AgentID	置信度	原始备注	创建时间	校验时间	校验码
```

Rows 2-3 should be empty.

- [ ] **Step 7: Verify forbidden workbook text**

Run:

```bash
univer inspect workbook ops/team-ops.univer > /tmp/team-ops-member-dashboard.inspect.md
rg -n "_Dashboard|_People|_Reports|_Audit|Reports|host|generateDay|Sample Member|Sample Host|Univer Team Pulse" /tmp/team-ops-member-dashboard.inspect.md
```

Expected: no output.

- [ ] **Step 8: Verify rule and chart readback**

Run:

```bash
univer run ops/team-ops.univer --code '() => {
  const workbook = univerAPI.getActiveWorkbook();
  const dashboard = workbook.getSheetByName("Dashboard");
  const people = workbook.getSheetByName("People");
  const audit = workbook.getSheetByName("Audit");
  const log = workbook.getSheetByName("log__sample_member");
  if (!dashboard || !people || !audit || !log) return { success: false, error: "missing expected sheet" };
  return {
    success: true,
    activeSheet: workbook.getActiveSheet().getSheetName(),
    sheets: workbook.getSheets().map((sheet) => sheet.getSheetName()),
    dashboardConditionalFormattingRules: dashboard.getConditionalFormattingRules().length,
    peopleConditionalFormattingRules: people.getConditionalFormattingRules().length,
    auditConditionalFormattingRules: audit.getConditionalFormattingRules().length,
    logConditionalFormattingRules: log.getConditionalFormattingRules().length,
    dashboardCharts: dashboard.getCharts ? dashboard.getCharts().length : 0
  };
}'
```

Expected JSON:

- `"success":true`
- `"activeSheet":"Dashboard"`
- `sheets` is `["Dashboard","People","Audit","log__sample_member"]`
- Dashboard conditional formatting rule count is at least `5`
- People conditional formatting rule count is at least `2`
- Audit conditional formatting rule count is at least `2`
- Log conditional formatting rule count is at least `4`
- Dashboard chart count is at least `1`, unless chart insertion failed in the generator output with a real CLI diagnostic.

- [ ] **Step 9: Check workbook status**

Run:

```bash
univer status ops/team-ops.univer
```

Expected: status is readable. If it reports pending local mutations, run:

```bash
univer commit ops/team-ops.univer --message "regenerate member dashboard workbook"
univer status ops/team-ops.univer
```

Expected after commit: pending mutation count is `0`.

- [ ] **Step 10: Commit regenerated workbook**

Run:

```bash
git add ops/team-ops.univer
git commit -m "chore: regenerate member dashboard workbook"
```

Expected: commit includes only `ops/team-ops.univer`.

## Task 6: Update `univer-team-standup` Skill To Member-Only Contract

**Files:**
- Modify: `skills/univer-team-standup/SKILL.md`

- [ ] **Step 1: Replace role and route sections**

Update the top sections so the intent table contains only onboarding, member append, and publish. Use this exact route table:

```markdown
## Route Intent

| Intent | Triggers |
| --- | --- |
| onboarding | `onboard`, `init profile`, `初始化晨会身份`, `注册成员`, first `append` when profile is missing |
| member append | `append`, `记录进展`, `写日报`, `更新晨会表`, `同步今天进展` |
| publish | `commit`, `sync`, `提交`, `同步远端`, `发布` |

`同步今天进展` means local append, not remote sync. Publish only when the user explicitly asks for commit/sync/publish.
```

Replace the role boundary section with:

```markdown
## Member Boundaries

`member` may:

- create its local profile during onboarding
- create or repair only its own `log__<owner_id>` sheet
- add or update only its own `People` row
- append rows only to `profile.personal_sheet`
- update only its own `Dashboard` row
- write `Audit` entries for its own actions

`member` must not write another member's row, another member's sheet, report indexes, non-member workflow data, or global publish state.
```

Expected result: no host workflow remains.

- [ ] **Step 2: Replace profile contract**

Remove `standup_roles` from the profile JSON and text. Use this profile shape:

```json
{
  "schema_version": "univer-team-standup/v0.2",
  "owner_id": "yangluoshen",
  "display_name": "yangluoshen",
  "github_handle": "yangluoshen",
  "agent_id": "codex-yangluoshen-local",
  "personal_sheet": "log__yangluoshen",
  "timezone": "Asia/Shanghai",
  "default_repo": "dream-num/univer-cli",
  "default_project": "Univer CLI"
}
```

Expected result: no role field is required for member usage.

- [ ] **Step 3: Replace Onboard workflow sheet references**

In the Onboard section, replace underscored sheet names and role language with:

```markdown
5. Inspect workbook, `People`, and `Dashboard` through public CLI reads.
6. Stop if `People` already has the same `owner_id` with a different `personal_sheet`.
7. If the personal sheet is missing, create it with the Personal Log header below.
8. Add/update only this owner's `People` row with `是否启用=是`.
9. Add/update only this owner's `Dashboard` row with `更新状态=待更新`.
10. Append `Audit` with `操作=onboard`.
```

Expected result: Onboard only touches member-owned state.

- [ ] **Step 4: Replace Append workflow sheet references**

In the Append section, update the workbook repair and write steps to:

```markdown
4. Inspect workbook-visible state and repair only this owner's missing profile sheet, `People` row, or `Dashboard` row.
8. Write only to `profile.personal_sheet`.
9. Read back the written range and verify key fields.
10. Update only this owner's `Dashboard` row.
11. Append `Audit`.
```

Expected result: Append no longer mentions report refresh or host summary.

- [ ] **Step 5: Delete Generate Daily Report workflow**

Remove the entire section beginning with:

```markdown
## Workflow: Generate Daily Report
```

through the paragraph ending with daily HTML requirements.

Expected result: the skill no longer exposes `generateDay`.

- [ ] **Step 6: Replace Workbook Contract section**

Use this exact contract:

````markdown
## Workbook Contract

Expected sheets: `Dashboard`, `People`, `Audit`, `log__<owner_id>`.

Headers:

```csv
Dashboard: 成员ID,成员,更新状态,昨天完成,今天计划,阻塞,风险,下一步,最近日志,最近更新时间,预览状态
People: 成员ID,显示名称,GitHub账号,AgentID,个人日志表,默认仓库,默认项目,时区,是否启用,更新时间
Audit: 审计ID,创建时间,成员ID,AgentID,操作,工作表,范围,日志ID,操作摘要,状态
Personal Log: 日志ID,日期,成员ID,工作项,状态,优先级,阻塞,风险,下一步,仓库,分支,关联项,分类,模块,规模,昨天完成,今天计划,影响,证据,来源,AgentID,置信度,原始备注,创建时间,校验时间,校验码
```
````

Expected result: visible contract matches the generated workbook.

- [ ] **Step 7: Replace success messages**

Keep only the append success message and update sheet names:

```text
已写入本地晨会表并完成预览，尚未提交或同步远端。

- owner: <owner_id>
- sheet: <personal_sheet>
- log_id: <log_id>
- dashboard: 已刷新当前成员行
- preview: <view_url_or_status>
- visibility: 其他人不会看到这次本地更新，除非你明确要求 commit/sync 或团队已有其他发布流程
- next: 如需发布，请明确要求 commit/sync
```

Delete the `generateDay` success message.

- [ ] **Step 8: Verify removed terms**

Run:

```bash
rg -n "host|generateDay|genarateDay|Reports|_Dashboard|_People|_Reports|_Audit|standup_roles|生成晨会日报|生成当天日报" skills/univer-team-standup/SKILL.md
```

Expected: no output.

- [ ] **Step 9: Commit skill update**

Run:

```bash
git add skills/univer-team-standup/SKILL.md
git commit -m "docs: simplify standup skill to member flow"
```

Expected: commit includes only `skills/univer-team-standup/SKILL.md`.

## Task 7: Update First-Run Documentation

**Files:**
- Modify: `docs/univer-team-standup-first-run.md`

- [ ] **Step 1: Replace document content with member-only guide**

Replace the full file with:

```markdown
# univer-team-standup First Run

This guide explains how a member starts using `univer-team-standup` while keeping local preview separate from shared visibility.

## Member: First Day

1. Ask your agent to use `univer-team-standup` and run `onboard`.
2. Provide `owner_id`, `display_name`, `github_handle`, `agent_id`, `timezone`, `default_repo`, and `default_project`.
3. Confirm the proposed `personal_sheet`, normally `log__<owner_id>`.
4. Let the agent create `.univer-agent/profile.json`, register your own `People` row, create your own personal log sheet if missing, and create your own `Dashboard` row.
5. Preview the workbook.
6. Ask the agent to `append` or `记录进展`.
7. Review the candidate row before the agent writes.
8. Preview again after write.

Local onboarding and local append are not visible to other members until you explicitly ask for commit/sync or the team uses another agreed publishing flow.

## Member: Normal Morning

1. Ask your agent to `append` or `记录进展`.
2. Confirm the generated candidate row.
3. Review the workbook preview.
4. Explicitly ask for `commit/sync` only when you want to publish your local workbook changes.

## Workbook Rule

`ops/team-ops.univer` is the team source of truth after it is bound to the shared remote. If `univer pull ops/team-ops.univer` reports that no remote is bound, the run is local template preview only.

## Local Files

Do not commit `.univer-agent/profile.json` or `.univer-agent/dependency-check.json`.
```

Expected result: first-run guide no longer contains host or report workflow.

- [ ] **Step 2: Verify removed terms**

Run:

```bash
rg -n "Host|host|generateDay|Reports|_Dashboard|_People|_Reports|_Audit|日报" docs/univer-team-standup-first-run.md
```

Expected: no output.

- [ ] **Step 3: Commit first-run docs**

Run:

```bash
git add docs/univer-team-standup-first-run.md
git commit -m "docs: update first run for member dashboard"
```

Expected: commit includes only `docs/univer-team-standup-first-run.md`.

## Task 8: Create Temporary Review Workbook With Sample Data

**Files:**
- Read: `ops/team-ops.univer`
- Temporary only: `/tmp/team-ops-member-dashboard-review.univer`

- [ ] **Step 1: Copy formal workbook to a review-only path**

Run:

```bash
rm -rf /tmp/team-ops-member-dashboard-review.univer
cp -a ops/team-ops.univer /tmp/team-ops-member-dashboard-review.univer
```

Expected: repository workbook remains unchanged.

- [ ] **Step 2: Inject Chinese review sample data into the copy**

Run:

```bash
univer run /tmp/team-ops-member-dashboard-review.univer --code '() => {
  const workbook = univerAPI.getActiveWorkbook();
  const dashboard = workbook.getSheetByName("Dashboard");
  const people = workbook.getSheetByName("People");
  const audit = workbook.getSheetByName("Audit");
  const log = workbook.getSheetByName("log__sample_member");
  if (!dashboard || !people || !audit || !log) {
    return { success: false, error: "missing expected sheet" };
  }

  people.getRange("A2:J4").setValues([
    ["yangluoshen", "洛神", "yangluoshen", "codex-yangluoshen-local", "log__sample_member", "dream-num/univer-cli", "Univer CLI", "Asia/Shanghai", "是", "2026-05-18T18:30:00+08:00"],
    ["mira", "米拉", "mira", "codex-mira-local", "log__mira", "dream-num/univer-cli", "Univer CLI", "Asia/Shanghai", "是", "2026-05-18T18:20:00+08:00"],
    ["chen", "陈同学", "chen", "codex-chen-local", "log__chen", "dream-num/univer-cli", "Univer CLI", "Asia/Shanghai", "是", "2026-05-18T18:10:00+08:00"]
  ]);

  dashboard.getRange("A16:K18").setValues([
    ["yangluoshen", "洛神", "已更新", "完成 team-ops 模板现状梳理，确认旧 Reports 与 host 流程需要移除。", "实现中文驾驶舱布局并补齐 workbook 可见验证。", "", "图表 API 可能在不同运行时表现不一致，需要保留诊断输出。", "先生成临时 review 副本，再确认正式模板保持空数据。", "20260518-yangluoshen-001", "2026-05-18T18:30:00+08:00", "本地预览"],
    ["mira", "米拉", "已更新", "整理成员 onboarding 字段和 profile 契约。", "检查 append 候选日志的证据来源和中文字段映射。", "等待 profile 字段最终确认。", "", "确认字段后更新 skill 文档。", "20260518-mira-001", "2026-05-18T18:20:00+08:00", "本地预览"],
    ["chen", "陈同学", "待更新", "", "准备补充今天的晨会内容。", "", "依赖远端同步策略确认。", "完成本地 append 后再显式发布。", "", "", "未预览"]
  ]);

  log.getRange("A2:Z3").setValues([
    ["20260518-yangluoshen-001", "2026-05-18", "yangluoshen", "美化 team-ops workbook", "待确认", "P1", "", "图表 API 可能不稳定", "完成正式模板和 review 副本验证", "dream-num/univer-cli", "feat-oprimize-team-ops-file", "TEAMOPS-2026-05-18", "dogfooding", "Workbook", "M", "确认旧模板结构和冗余点", "实现 member-only 中文驾驶舱", "降低晨会协作噪音", "docs/superpowers/specs/2026-05-18-team-ops-member-dashboard-design.md", "agent", "codex-yangluoshen-local", 0.86, "review 示例数据，只写入临时副本", "2026-05-18T18:30:00+08:00", "", "review-sample-001"],
    ["20260518-mira-001", "2026-05-18", "mira", "确认 member profile 契约", "已完成", "P2", "等待 profile 字段最终确认", "", "更新 skill 文档", "dream-num/univer-cli", "feat-oprimize-team-ops-file", "TEAMOPS-2026-05-18", "docs", "Skill", "S", "整理旧角色模型", "收敛到 member-only", "减少使用入口", "skills/univer-team-standup/SKILL.md", "manual", "codex-mira-local", 0.74, "review 示例数据，只写入临时副本", "2026-05-18T18:20:00+08:00", "", "review-sample-002"]
  ]);

  audit.getRange("A2:J4").setValues([
    ["audit-review-001", "2026-05-18T18:30:00+08:00", "yangluoshen", "codex-yangluoshen-local", "append", "log__sample_member", "A2:Z2", "20260518-yangluoshen-001", "写入 review 示例日志", "成功"],
    ["audit-review-002", "2026-05-18T18:31:00+08:00", "yangluoshen", "codex-yangluoshen-local", "refresh_dashboard", "Dashboard", "A16:K18", "", "刷新 review 示例成员看板", "成功"],
    ["audit-review-003", "2026-05-18T18:32:00+08:00", "mira", "codex-mira-local", "append", "log__sample_member", "A3:Z3", "20260518-mira-001", "写入第二条 review 示例日志", "成功"]
  ]);

  return { success: true, workbook: "/tmp/team-ops-member-dashboard-review.univer", ranges: ["Dashboard!A16:K18", "People!A2:J4", "Audit!A2:J4", "log__sample_member!A2:Z3"] };
}'
```

Expected JSON includes `"success":true`. This command modifies only `/tmp/team-ops-member-dashboard-review.univer`.

- [ ] **Step 3: Verify review copy sample data**

Run:

```bash
univer pipe out /tmp/team-ops-member-dashboard-review.univer --range 'Dashboard!A1:R20' --format tsv
univer pipe out /tmp/team-ops-member-dashboard-review.univer --range 'People!A1:J4' --format tsv
univer pipe out /tmp/team-ops-member-dashboard-review.univer --range 'log__sample_member!A1:Z3' --format tsv
```

Expected: output contains `洛神`, `米拉`, `陈同学`, `美化 team-ops workbook`, and Chinese long text. The committed `ops/team-ops.univer` remains empty of these sample rows.

- [ ] **Step 4: Start workbook preview for review**

Run:

```bash
univer view /tmp/team-ops-member-dashboard-review.univer --no-open --json
```

Expected JSON includes `"ok":true` and a local `url`. Share this URL with the user for visual review.

## Task 9: Final Verification And Cleanup

**Files:**
- Verify: `tools/univer-team-standup/create-template-workbook.js`
- Verify: `ops/team-ops.univer`
- Verify: `skills/univer-team-standup/SKILL.md`
- Verify: `docs/univer-team-standup-first-run.md`

- [ ] **Step 1: Run complete syntax and workbook verification**

Run:

```bash
node --check tools/univer-team-standup/create-template-workbook.js
univer inspect workbook ops/team-ops.univer | sed -n '1,22p'
univer pipe out ops/team-ops.univer --range 'Dashboard!A1:R20' --format tsv
univer pipe out ops/team-ops.univer --range 'People!A1:J3' --format tsv
univer pipe out ops/team-ops.univer --range 'Audit!A1:J3' --format tsv
univer pipe out ops/team-ops.univer --range 'log__sample_member!A1:Z3' --format tsv
```

Expected:

- syntax check exits `0`
- active sheet is `Dashboard`
- sheet count is `4`
- sheet order is `Dashboard`, `People`, `Audit`, `log__sample_member`
- formal workbook headers are Chinese
- formal workbook has no sample member rows

- [ ] **Step 2: Run forbidden-term checks**

Run:

```bash
rg -n 'const reports|sheets\["_Reports"\]|clearTemplateRange\(reports|setWidths\(reports|sample-host|host|generateDay|genarateDay|standup_roles|Sample Member|Sample Host|Univer Team Pulse' \
  tools/univer-team-standup/create-template-workbook.js
rg -n "_Dashboard|_People|_Reports|_Audit|Reports|host|generateDay|genarateDay|standup_roles|Sample Member|Sample Host|Univer Team Pulse" \
  skills/univer-team-standup/SKILL.md \
  docs/univer-team-standup-first-run.md
```

Expected: both commands produce no output. The generator may keep legacy underscored sheet names only in a cleanup allowlist.

- [ ] **Step 3: Verify formal workbook remains sample-free**

Run:

```bash
univer pipe out ops/team-ops.univer --range 'Dashboard!A16:K20' --format tsv > /tmp/team-ops-dashboard-empty.tsv
univer pipe out ops/team-ops.univer --range 'People!A2:J5' --format tsv > /tmp/team-ops-people-empty.tsv
univer pipe out ops/team-ops.univer --range 'log__sample_member!A2:Z5' --format tsv > /tmp/team-ops-log-empty.tsv
rg -n "洛神|米拉|陈同学|review 示例|sample-member|sample-host|Sample" /tmp/team-ops-dashboard-empty.tsv /tmp/team-ops-people-empty.tsv /tmp/team-ops-log-empty.tsv
```

Expected: no output.

- [ ] **Step 4: Check git status**

Run:

```bash
git status --short
```

Expected:

```text
?? standup.md
```

If `.superpowers/` appears, confirm it is ignored by `.gitignore`. If `/tmp` review workbook changes appear, stop because `/tmp` should not be tracked.

- [ ] **Step 5: Summarize commits**

Run:

```bash
git log --oneline --decorate -8
```

Expected: recent commits include generator contract, Dashboard layout, support sheet localization, regenerated workbook, skill update, and first-run docs.

## Plan Self-Review

- Spec coverage: The tasks cover member-only scope, `Dashboard` first and active, removal of `Reports`, removal of host/`generateDay`, Chinese-first headers, light `Audit`, clean formal template, and temporary review sample data.
- Placeholder scan: This plan contains exact file paths, code snippets, commands, and expected outputs. It avoids unresolved placeholders.
- Type and API consistency: `Dashboard`, `People`, `Audit`, and `log__sample_member` names are consistent across generator, workbook verification, skill docs, and first-run docs. The plan uses verified `workbook.setActiveSheet(dashboard)` for active sheet selection.
