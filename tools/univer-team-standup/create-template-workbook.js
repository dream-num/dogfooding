() => {
  const workbook = univerAPI.getActiveWorkbook();

  const desiredSheets = [
    { name: "_Dashboard", rows: 60, cols: 12 },
    { name: "_People", rows: 80, cols: 11 },
    { name: "_Reports", rows: 120, cols: 14 },
    { name: "_Audit", rows: 200, cols: 15 },
    { name: "log__yangluoshen", rows: 200, cols: 26 },
    { name: "log__host", rows: 200, cols: 26 },
    { name: "log__example-member", rows: 200, cols: 26 },
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
    if (!desiredSheetNames.includes(name) && !sheetAppearsEmpty(sheet)) {
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
    ["date", "2026-05-18", "updated", "2/3", "blockers", "1", "daily_report", "Not generated"],
    ["mode", "local template preview", "sync_status", "not_synced", "risks", "1", "preview", "use univer view"],
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
  dashboard.getRange("A8:L10").setValues([
    [
      "yangluoshen",
      "yangluoshen",
      "updated",
      "Confirmed workbook-led MVP scope",
      "Create skill and workbook template",
      "",
      "Remote workbook is not bound yet",
      "Bind shared workbook before team usage",
      "20260518-yangluoshen-001",
      "2026-05-18T09:00:00+08:00",
      "local preview",
      "",
    ],
    [
      "host",
      "Standup Host",
      "updated",
      "Prepared daily report flow",
      "Generate daily standup HTML",
      "",
      "",
      "Run generateDay after members append",
      "",
      "2026-05-18T09:05:00+08:00",
      "local preview",
      "",
    ],
    [
      "example-member",
      "Example Member",
      "No update / Needs follow-up",
      "",
      "",
      "",
      "",
      "Ask member to append before standup",
      "",
      "",
      "pending",
      "",
    ],
  ]);
  styleHeader(dashboard.getRange("A7:L7"), "#EEF3F8");
  dashboard.getRange("A8:L10").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
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
  people.getRange("A2:K4").setValues([
    [
      "yangluoshen",
      "yangluoshen",
      "yangluoshen",
      "codex-yangluoshen-local",
      "log__yangluoshen",
      "dream-num/univer-cli",
      "Univer CLI",
      "Asia/Shanghai",
      "member,host",
      "TRUE",
      "2026-05-18T09:00:00+08:00",
    ],
    [
      "host",
      "Standup Host",
      "",
      "codex-standup-host-local",
      "log__host",
      "dream-num/univer-cli",
      "Univer CLI",
      "Asia/Shanghai",
      "host",
      "TRUE",
      "2026-05-18T09:05:00+08:00",
    ],
    [
      "example-member",
      "Example Member",
      "",
      "codex-example-member-local",
      "log__example-member",
      "dream-num/univer-cli",
      "Univer CLI",
      "Asia/Shanghai",
      "member",
      "TRUE",
      "2026-05-18T09:10:00+08:00",
    ],
  ]);
  styleHeader(people.getRange("A1:K1"), "#EEF3F8");
  people.getRange("A1:K4").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");
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

  const log = sheets["log__yangluoshen"];
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
  clearTemplateRange(log, "log__yangluoshen", "A1:Z200");
  log.getRange("A1:Z1").setValues([logHeaders]);
  log.getRange("A2:Z2").setValues([[
    "20260518-yangluoshen-001",
    "2026-05-18",
    "yangluoshen",
    "Design univer-team-standup MVP",
    "done",
    "P1",
    "",
    "Remote workbook is not bound yet",
    "Create skill and template workbook",
    "dream-num/univer-cli",
    "feat-univer-morning-standup",
    "SPEC#2026-05-18",
    "feature",
    "Dogfooding",
    "M",
    "Confirmed MVP scope and workbook-led approach",
    "Write implementation plan and create template",
    "Team can dogfood standup workflow",
    "docs/superpowers/specs/2026-05-18-univer-team-standup-design.md",
    "manual",
    "codex-yangluoshen-local",
    0.95,
    "Seed example row for local template preview.",
    "2026-05-18T09:00:00+08:00",
    "2026-05-18T09:00:00+08:00",
    "seed-20260518-yangluoshen-001",
  ]]);
  styleLogSheet(log);
  log.getRange("A1:Z2").setBorder(univerAPI.Enum.BorderType.ALL, univerAPI.Enum.BorderStyleTypes.THIN, "#D7DEE8");

  ["log__host", "log__example-member"].forEach((sheetName) => {
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
    dashboardRange: "_Dashboard!A1:L10",
    personalLogRange: "log__yangluoshen!A1:Z2",
  };
};
