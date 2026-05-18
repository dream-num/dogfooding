() => {
  const workbook = univerAPI.getActiveWorkbook();

  const desiredSheets = [
    { name: "_People", rows: 80, cols: 11 },
    { name: "_Reports", rows: 120, cols: 14 },
    { name: "_Audit", rows: 200, cols: 15 },
    { name: "log__sample_member", rows: 200, cols: 26 },
    { name: "log__sample_host", rows: 200, cols: 26 },
    { name: "_Dashboard", rows: 60, cols: 12 },
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

  const clearTemplateRange = (sheet, sheetName, a1) => {
    sheet.getRange(a1).clear();
    clearedRanges.push(`${sheetName}!${a1}`);
  };

  const dashboard = sheets["_Dashboard"];
  clearTemplateRange(dashboard, "_Dashboard", "A1:L60");
  dashboard.setHiddenGridlines(true);
  dashboard.setGridLinesColor("#D7DEE8");
  dashboard.setFrozenRows(7);
  dashboard.setFrozenColumns(2);
  dashboard.getRange("A1:L1").merge({ isForceMerge: true });
  dashboard.getRange("A1").setValue("Univer Team Standup");
  dashboard
    .getRange("A1:L1")
    .setBackgroundColor("#18212D")
    .setFontColor("#F5F8FB")
    .setFontWeight("bold")
    .setFontSize(16)
    .setVerticalAlignment("middle");
  dashboard.setRowHeight(0, 34);
  dashboard.getRange("A3:H4").setValues([
    ["date", "Use generateDay date", "updated", "0/0", "blockers", "0", "daily_report", "Not generated"],
    ["mode", "local template preview", "sync_status", "not_synced", "risks", "0", "preview", "use univer view"],
  ]);
  dashboard.getRange("A3:H4").setBackgroundColor("#F7F9FC").setVerticalAlignment("middle");
  dashboard.getRange("A7:L7").setValues([[
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
  dashboard.getRange("A8:L9").setValues([
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
  styleHeader(dashboard.getRange("A7:L7"), "#EEF3F8");
  dashboard.getRange("A8:L9").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  setWidths(dashboard, [140, 150, 170, 260, 280, 220, 220, 260, 210, 230, 160, 260]);

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
  people.getRange("A1:K3").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  setWidths(people, [150, 160, 160, 230, 190, 220, 180, 150, 160, 100, 230]);

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
  reports.getRange("A1:N1").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
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
  audit.getRange("A1:O1").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
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
  log.getRange("A1:Z2").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");

  ["log__sample_host"].forEach((sheetName) => {
    const personalSheet = sheets[sheetName];
    clearTemplateRange(personalSheet, sheetName, "A1:Z200");
    personalSheet.getRange("A1:Z1").setValues([logHeaders]);
    styleLogSheet(personalSheet);
    personalSheet.getRange("A1:Z1").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
  });

  return {
    success: true,
    sheets: workbook.getSheets().map((sheet) => sheet.getSheetName()),
    createdSheets,
    deletedSheets,
    clearedRanges,
    dashboardRange: "_Dashboard!A1:L9",
    personalLogRange: "log__sample_member!A1:Z2",
  };
};
