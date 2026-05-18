async (providedUniverAPI) => {
  const api = providedUniverAPI || univerAPI;
  const workbook = api.getActiveWorkbook();

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
    purple: "#7C3AED",
    graySoft: "#F1F5F9",
  };

  const desiredSheets = [
    { name: "_People", rows: 80, cols: 11 },
    { name: "_Reports", rows: 120, cols: 14 },
    { name: "_Audit", rows: 200, cols: 15 },
    { name: "log__sample_member", rows: 200, cols: 26 },
    { name: "log__sample_host", rows: 200, cols: 26 },
    { name: "_Dashboard", rows: 80, cols: 17 },
  ];

  const desiredSheetNames = desiredSheets.map((definition) => definition.name);
  const createdSheets = [];
  const deletedSheets = [];
  const clearedRanges = [];

  const isBlankCell = (value) => value === null || value === undefined || value === "";

  const sheetAppearsEmpty = (sheet) => {
    const getLastRow = () => sheet.getLastRow();
    const getLastColumn = () => sheet.getLastColumn();
    const lastRow = getLastRow();
    const lastColumn = getLastColumn();
    if (lastRow < 0 || lastColumn < 0) {
      return true;
    }

    const values = sheet.getRange(0, 0, lastRow + 1, lastColumn + 1).getValues();
    return values.every((row) => row.every((value) => isBlankCell(value)));
  };

  for (const sheet of workbook.getSheets()) {
    const name = sheet.getSheetName();
    const isDesiredSheet = desiredSheetNames.includes(name);
    const isEmptySheet = sheetAppearsEmpty(sheet);
    if (isDesiredSheet && !isEmptySheet) {
      return {
        success: false,
        error: "Existing template sheet contains data; refusing to regenerate template",
        sheetName: name,
      };
    }

    if (!isDesiredSheet && !isEmptySheet) {
      return {
        success: false,
        error: "Unexpected non-empty sheet found; refusing to regenerate template",
        sheetName: name,
      };
    }
  }

  const ensureSheet = ({ name, rows, cols }) => {
    const existing = workbook.getSheetByName(name);
    if (existing) {
      return existing;
    }

    createdSheets.push(name);
    return workbook.create(name, rows, cols);
  };

  const sheets = {};
  desiredSheets.forEach((definition) => {
    sheets[definition.name] = ensureSheet(definition);
  });

  workbook.getSheets().forEach((sheet) => {
    const name = sheet.getSheetName();
    if (!desiredSheetNames.includes(name)) {
      deletedSheets.push(name);
      workbook.deleteSheet(sheet.getSheetId());
    }
  });

  const styleHeader = (range, background, color = "#17202A") => {
    range
      .setBackgroundColor(background)
      .setFontWeight("bold")
      .setFontColor(color)
      .setVerticalAlignment("middle");
  };

  const setWidths = (sheet, widths) => {
    widths.forEach((width, index) => sheet.setColumnWidth(index, width));
  };

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

  const addSampleLogConditionalFormatting = (sheet) => {
    addTextRule(sheet, "E2:E200", "done", colors.greenSoft, colors.green, true);
    addTextRule(sheet, "E2:E200", "needs_review", colors.amberSoft, colors.amber, true);
    addFormulaRule(sheet, "G2:G200", "=LEN($G2)>0", colors.redSoft, colors.red, true);
    addFormulaRule(sheet, "H2:H200", "=LEN($H2)>0", colors.amberSoft, colors.amber, true);
    return 4;
  };

  const clearTemplateRange = (sheet, sheetName, a1) => {
    sheet.getRange(a1).clear();
    clearedRanges.push(`${sheetName}!${a1}`);
  };

  let dashboardConditionalFormatRules = 0;
  let peopleConditionalFormatRules = 0;
  let sampleLogConditionalFormatRules = 0;

  const dashboard = sheets["_Dashboard"];
  clearTemplateRange(dashboard, "_Dashboard", "A1:Q80");
  dashboard.setHiddenGridlines(true);
  dashboard.setGridLinesColor(colors.grid);
  dashboard.setFrozenRows(8);
  dashboard.setFrozenColumns(2);
  dashboard.getRange("A1:Q80").setBackgroundColor(colors.canvas);
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

  dashboard.getRange("A3:L6").setBackgroundColor(colors.panel).setVerticalAlignment("middle");
  ["A3:B4", "C3:D4", "E3:F4", "G3:H4", "I3:L4", "A5:B6", "C5:D6", "E5:F6", "G5:H6", "I5:L6"].forEach((rangeA1) => {
    dashboard.getRange(rangeA1).setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, colors.grid);
  });
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
  dashboard
    .getRange("A3:L3")
    .setFontColor(colors.muted)
    .setFontWeight("bold")
    .setFontSize(9);
  dashboard
    .getRange("A5:L5")
    .setFontColor(colors.muted)
    .setFontWeight("bold")
    .setFontSize(9);
  dashboard
    .getRange("A4:L4")
    .setFontColor(colors.text)
    .setFontWeight("bold")
    .setFontSize(16);
  dashboard
    .getRange("A6:L6")
    .setFontColor(colors.text)
    .setFontWeight("bold")
    .setFontSize(12);

  dashboard.getRange("A8:L8").setValues([[
    "owner_id",
    "display_name",
    "update_status",
    "yesterday",
    "today",
    "blocker",
    "risk",
    "next_action",
    "last_log_id",
    "last_updated_at",
    "preview_status",
    "report_path",
  ]]);
  dashboard.getRange("A9:L10").setValues([
    [
      "sample-member",
      "Sample Member",
      "sample / inactive",
      "Example yesterday text",
      "Example today text",
      "",
      "",
      "Run onboarding to create a real member row",
      "",
      "",
      "sample only",
      "",
    ],
    [
      "sample-host",
      "Sample Host",
      "sample / inactive",
      "",
      "Generate daily standup HTML after members append",
      "",
      "",
      "",
      "Run generateDay after real members append",
      "",
      "",
      "sample only",
      "",
    ],
  ]);
  styleHeader(dashboard.getRange("A8:L8"), colors.header, colors.text);
  dashboard.getRange("A8:L8").setFontSize(10);
  dashboard.getRange("A9:L10").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, colors.grid);
  dashboard.getRange("A9:L60").setVerticalAlignment("top");
  dashboard.getRange("D9:H60").setVerticalAlignment("top");
  addTextRule(dashboard, "C9:C60", "updated", colors.greenSoft, colors.green, true);
  addTextRule(dashboard, "C9:C60", "No update", colors.amberSoft, colors.amber, true);
  addTextRule(dashboard, "C9:C60", "sample / inactive", colors.graySoft, colors.muted, false);
  addFormulaRule(dashboard, "F9:F60", "=LEN($F9)>0", colors.redSoft, colors.red, true);
  addFormulaRule(dashboard, "G9:G60", "=LEN($G9)>0", colors.amberSoft, colors.amber, true);
  addTextRule(dashboard, "K9:K60", "local preview", colors.blueSoft, colors.blue, false);
  dashboardConditionalFormatRules += 6;

  dashboard.getRange("N2:Q6").setBackgroundColor(colors.panel).setVerticalAlignment("middle");
  dashboard.getRange("N2:Q2").setValues([["metric", "value", "color", "note"]]);
  dashboard.getRange("N3").setValue("updated");
  dashboard.getRange("O3").setFormula('=COUNTIFS($A$9:$A$60,"<>",$C$9:$C$60,"updated")');
  dashboard.getRange("P3").setValue(colors.blue);
  dashboard.getRange("Q3").setValue("members with fresh standup");
  dashboard.getRange("N4").setValue("missing");
  dashboard.getRange("O4").setFormula('=COUNTIFS($C$9:$C$60,"<>updated",$C$9:$C$60,"<>sample / inactive",$A$9:$A$60,"<>")');
  dashboard.getRange("P4").setValue(colors.amber);
  dashboard.getRange("Q4").setValue("needs morning update");
  dashboard.getRange("N5").setValue("blockers");
  dashboard.getRange("O5").setFormula('=COUNTIFS($F$9:$F$60,"<>",$C$9:$C$60,"<>sample / inactive",$A$9:$A$60,"<>")');
  dashboard.getRange("P5").setValue(colors.red);
  dashboard.getRange("Q5").setValue("explicit blockers");
  dashboard.getRange("N6").setValue("risks");
  dashboard.getRange("O6").setFormula('=COUNTIFS($G$9:$G$60,"<>",$C$9:$C$60,"<>sample / inactive",$A$9:$A$60,"<>")');
  dashboard.getRange("P6").setValue(colors.purple);
  dashboard.getRange("Q6").setValue("risk notes raised");
  styleHeader(dashboard.getRange("N2:Q2"), colors.header, colors.text);
  dashboard.getRange("N2:Q6").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, colors.grid);

  setWidths(dashboard, [140, 150, 160, 280, 300, 220, 220, 270, 210, 220, 160, 260, 24, 120, 100, 110, 180]);
  dashboard.setRowHeights(8, 52, 54);

  const people = sheets["_People"];
  clearTemplateRange(people, "_People", "A1:K80");
  people.setHiddenGridlines(true);
  people.setFrozenRows(1);
  people.setFrozenColumns(2);
  people.getRange("A1:K1").setValues([[
    "owner_id",
    "display_name",
    "github_handle",
    "agent_id",
    "personal_sheet",
    "default_repo",
    "default_project",
    "timezone",
    "standup_roles",
    "active",
    "updated_at",
  ]]);
  people.getRange("A2:K3").setValues([
    [
      "sample-member",
      "Sample Member",
      "",
      "codex-sample-member-local",
      "log__sample_member",
      "dream-num/univer-cli",
      "Univer CLI",
      "Asia/Shanghai",
      "member",
      "FALSE",
      "2026-05-18T09:10:00+08:00",
    ],
    [
      "sample-host",
      "Sample Host",
      "",
      "codex-sample-host-local",
      "log__sample_host",
      "dream-num/univer-cli",
      "Univer CLI",
      "Asia/Shanghai",
      "host",
      "FALSE",
      "2026-05-18T09:15:00+08:00",
    ],
  ]);
  styleHeader(people.getRange("A1:K1"), "#EEF3F8");
  people.getRange("A1:K3").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  setWidths(people, [150, 160, 160, 230, 190, 220, 180, 150, 160, 100, 230]);
  addTextRule(people, "J2:J80", "TRUE", colors.greenSoft, colors.green, true);
  addTextRule(people, "J2:J80", "FALSE", colors.redSoft, colors.red, true);
  peopleConditionalFormatRules += 2;

  const reports = sheets["_Reports"];
  clearTemplateRange(reports, "_Reports", "A1:N120");
  reports.setHiddenGridlines(true);
  reports.setFrozenRows(1);
  reports.getRange("A1:N1").setValues([[
    "report_id",
    "report_type",
    "date_range",
    "generated_at",
    "generated_by",
    "output_format",
    "output_path",
    "source_sheets",
    "source_rows",
    "commit_ref",
    "sync_status",
    "preview_status",
    "review_url",
    "raw_note",
  ]]);
  styleHeader(reports.getRange("A1:N1"), "#EEF3F8");
  reports.getRange("A1:N1").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  setWidths(reports, [180, 130, 160, 230, 170, 130, 300, 220, 140, 160, 140, 160, 220, 300]);

  const audit = sheets["_Audit"];
  clearTemplateRange(audit, "_Audit", "A1:O200");
  audit.setHiddenGridlines(true);
  audit.setFrozenRows(1);
  audit.getRange("A1:O1").setValues([[
    "audit_id",
    "created_at",
    "owner_id",
    "agent_id",
    "role",
    "action",
    "sheet",
    "range",
    "log_id",
    "before_summary",
    "after_summary",
    "commit_ref",
    "review_url",
    "status",
    "raw_note",
  ]]);
  styleHeader(audit.getRange("A1:O1"), "#EEF3F8");
  audit.getRange("A1:O1").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  setWidths(audit, [190, 230, 150, 230, 110, 170, 170, 120, 210, 260, 260, 160, 220, 120, 320]);

  const log = sheets["log__sample_member"];
  const logHeaders = [
    "log_id",
    "date",
    "owner_id",
    "work_item_title",
    "status",
    "priority",
    "blocker",
    "risk",
    "next_action",
    "repo",
    "branch",
    "work_item_ref",
    "category",
    "area",
    "size",
    "yesterday",
    "today",
    "impact",
    "evidence",
    "source",
    "agent_id",
    "confidence",
    "raw_note",
    "created_at",
    "verified_at",
    "checksum",
  ];
  const logWidths = [
    230,
    120,
    150,
    280,
    120,
    100,
    240,
    260,
    260,
    220,
    220,
    170,
    130,
    150,
    90,
    320,
    320,
    260,
    320,
    140,
    230,
    120,
    340,
    230,
    230,
    280,
  ];
  const styleLogSheet = (sheet) => {
    sheet.setHiddenGridlines(true);
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(5);
    styleHeader(sheet.getRange("A1:I1"), "#DDEBFF");
    styleHeader(sheet.getRange("J1:O1"), "#EEF3F8");
    styleHeader(sheet.getRange("P1:S1"), "#EAF7EF");
    styleHeader(sheet.getRange("T1:Z1"), "#F7F2E8");
    setWidths(sheet, logWidths);
  };
  clearTemplateRange(log, "log__sample_member", "A1:Z200");
  log.getRange("A1:Z1").setValues([logHeaders]);
  log.getRange("A2:Z2").setValues([[
    "20260518-sample-member-001",
    "2026-05-18",
    "sample-member",
    "Example standup item",
    "needs_review",
    "P2",
    "",
    "",
    "Run onboarding before using the workbook for a real member",
    "dream-num/univer-cli",
    "feat-univer-morning-standup",
    "SAMPLE#2026-05-18",
    "example",
    "Dogfooding",
    "S",
    "Example yesterday text",
    "Example today text",
    "Demonstrates column layout only",
    "docs/univer-team-standup-first-run.md",
    "sample",
    "codex-sample-member-local",
    0.5,
    "Inactive sample row. Host reports must ignore this row because _People.active is FALSE.",
    "2026-05-18T09:10:00+08:00",
    "",
    "sample-20260518-sample-member-001",
  ]]);
  styleLogSheet(log);
  sampleLogConditionalFormatRules += addSampleLogConditionalFormatting(log);
  log.getRange("A1:Z2").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, "#D7DEE8");

  ["log__sample_host"].forEach((sheetName) => {
    const personalSheet = sheets[sheetName];
    clearTemplateRange(personalSheet, sheetName, "A1:Z200");
    personalSheet.getRange("A1:Z1").setValues([logHeaders]);
    styleLogSheet(personalSheet);
    sampleLogConditionalFormatRules += addSampleLogConditionalFormatting(personalSheet);
    personalSheet.getRange("A1:Z1").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  });

  await api.getFormula().onCalculationResultApplied();

  let chartResult = {
    attempted: true,
    inserted: false,
    error: null,
    message: "Chart insertion not attempted",
  };
  try {
    const chartInfo = dashboard
      .newChart()
      .setChartType(api.Enum.ChartType.Column)
      .addRange("N2:O6")
      .setPosition(2, 13, 0, 0)
      .setWidth(360)
      .setHeight(240)
      .setOptions("title.content", "Team Pulse")
      .build();
    const chart = await dashboard.insertChart(chartInfo);
    chartResult = {
      attempted: true,
      inserted: true,
      error: null,
      message: `Inserted chart ${chart.getChartId()}`,
      chartCount: dashboard.getCharts().length,
    };
  } catch (error) {
    chartResult = {
      attempted: true,
      inserted: false,
      error: error && error.name ? error.name : "ChartInsertError",
      message: error && error.message ? error.message : String(error),
      chartCount: dashboard.getCharts ? dashboard.getCharts().length : 0,
    };
  }

  return {
    success: true,
    sheets: workbook.getSheets().map((sheet) => sheet.getSheetName()),
    createdSheets,
    deletedSheets,
    clearedRanges,
    dashboardRange: "_Dashboard!A1:Q12",
    chartSourceRange: "_Dashboard!N2:Q6",
    personalLogRange: "log__sample_member!A1:Z2",
    dashboardConditionalFormatRules,
    peopleConditionalFormatRules,
    sampleLogConditionalFormatRules,
    dashboardCharts: chartResult,
  };
};
