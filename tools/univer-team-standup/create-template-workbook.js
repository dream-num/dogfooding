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
    { name: "Dashboard", rows: 90, cols: 18 },
    { name: "People", rows: 80, cols: 10 },
    { name: "Audit", rows: 200, cols: 10 },
    { name: "log__sample_member", rows: 200, cols: 26 },
  ];

  const legacyTemplateSheets = new Set(["_Dashboard", "_People", "_Reports", "_Audit", "log__sample_host"]);
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

    const range = sheet.getRange(0, 0, lastRow + 1, lastColumn + 1);
    const values = range.getValues();
    const formulas = typeof range.getFormulas === "function" ? range.getFormulas() : [];
    return values.every((row, rowIndex) =>
      row.every((value, columnIndex) => {
        const formula = formulas[rowIndex] && formulas[rowIndex][columnIndex];
        return isBlankCell(value) && isBlankCell(formula);
      })
    );
  };

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

    if (isLegacyTemplateSheet && !isEmptySheet) {
      return {
        success: false,
        error: "Legacy template sheet contains data; refusing to delete during member dashboard regeneration",
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

  const ensureSheet = ({ name, rows, cols }) => {
    const existing = workbook.getSheetByName(name);
    if (existing) {
      return existing;
    }

    createdSheets.push(name);
    return workbook.create(name, rows, cols);
  };

  const sheets = {};
  const sheetCreationOrder = [
    ...desiredSheets.filter((definition) => definition.name !== "Dashboard"),
    ...desiredSheets.filter((definition) => definition.name === "Dashboard"),
  ];

  sheetCreationOrder.forEach((definition) => {
    sheets[definition.name] = ensureSheet(definition);
  });

  workbook.getSheets().forEach((sheet) => {
    const name = sheet.getSheetName();
    if (!desiredSheetNames.includes(name)) {
      deletedSheets.push(name);
      workbook.deleteSheet(sheet.getSheetId());
    }
  });

  workbook.moveSheet(sheets["Dashboard"], 0);

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
    addTextRule(sheet, "E2:E200", "已完成", colors.greenSoft, colors.green, true);
    addTextRule(sheet, "E2:E200", "待确认", colors.amberSoft, colors.amber, true);
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
  let auditConditionalFormatRules = 0;
  let sampleLogConditionalFormatRules = 0;

  const dashboard = sheets["Dashboard"];
  clearTemplateRange(dashboard, "Dashboard", "A1:R90");
  dashboard.setHiddenGridlines(true);
  dashboard.setGridLinesColor(colors.grid);
  dashboard.setFrozenRows(3);
  dashboard.setFrozenColumns(0);
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
  dashboard.getRange("A6").setFormula('=COUNTIFS($A$11:$A$89,"<>",$C$11:$C$89,"已更新")');
  dashboard.getRange("D5").setValue("待更新");
  dashboard.getRange("D6").setFormula('=COUNTIFS($A$11:$A$89,"<>",$C$11:$C$89,"<>已更新")');
  dashboard.getRange("G5").setValue("阻塞");
  dashboard.getRange("G6").setFormula('=COUNTIFS($F$11:$F$89,"<>",$A$11:$A$89,"<>")');
  dashboard.getRange("J5").setValue("风险");
  dashboard.getRange("J6").setFormula('=COUNTIFS($G$11:$G$89,"<>",$A$11:$A$89,"<>")');
  dashboard.getRange("M5").setValue("最后写入");
  dashboard.getRange("M6").setFormula('=IF(COUNT($L$11:$L$89)=0,"-",INDEX($J$11:$J$89,MATCH(MAX($L$11:$L$89),$L$11:$L$89,0)))');
  dashboard.getRange("A7").setValue("来自成员看板");
  dashboard.getRange("D7").setValue("等待成员记录");
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

  dashboard.getRange("A10:K89").setBackgroundColor(colors.panel).setVerticalAlignment("middle");
  dashboard.getRange("M10:R28").setBackgroundColor(colors.panel).setVerticalAlignment("middle");
  dashboard.getRange("M10:R10").merge({ isForceMerge: true });
  dashboard.getRange("M10").setValue("更新分布");
  dashboard
    .getRange("M10:R10")
    .setBackgroundColor("#EAF1FF")
    .setFontColor(colors.text)
    .setFontWeight("bold")
    .setFontSize(12);
  dashboard.getRange("M11:R28").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, colors.grid);

  dashboard.getRange("M30:R34").setBackgroundColor("#F8FAFC").setVerticalAlignment("middle");
  dashboard.getRange("M30:R30").setValues([["指标", "数值", "颜色", "说明", "状态", ""]]);
  dashboard.getRange("M31").setValue("已更新");
  dashboard.getRange("N31").setFormula('=COUNTIFS($A$11:$A$89,"<>",$C$11:$C$89,"已更新")');
  dashboard.getRange("O31").setValue(colors.green);
  dashboard.getRange("P31").setValue("已完成当天更新的成员");
  dashboard.getRange("Q31").setValue("正常");
  dashboard.getRange("M32").setValue("待更新");
  dashboard.getRange("N32").setFormula('=COUNTIFS($A$11:$A$89,"<>",$C$11:$C$89,"<>已更新")');
  dashboard.getRange("O32").setValue(colors.amber);
  dashboard.getRange("P32").setValue("需要补充晨会内容");
  dashboard.getRange("Q32").setValue("关注");
  dashboard.getRange("M33").setValue("阻塞");
  dashboard.getRange("N33").setFormula('=COUNTIFS($F$11:$F$89,"<>",$A$11:$A$89,"<>")');
  dashboard.getRange("O33").setValue(colors.red);
  dashboard.getRange("P33").setValue("需要当天处理");
  dashboard.getRange("Q33").setValue("高优先级");
  dashboard.getRange("M34").setValue("风险");
  dashboard.getRange("N34").setFormula('=COUNTIFS($G$11:$G$89,"<>",$A$11:$A$89,"<>")');
  dashboard.getRange("O34").setValue(colors.amber);
  dashboard.getRange("P34").setValue("需要持续关注");
  dashboard.getRange("Q34").setValue("观察");
  styleHeader(dashboard.getRange("M30:R30"), colors.header, colors.text);
  dashboard.getRange("M30:R34").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, colors.grid);

  dashboard.getRange("A10:K10").setValues([[
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
  styleHeader(dashboard.getRange("A10:K10"), colors.header, colors.text);
  dashboard.getRange("A10:K10").setFontSize(10);
  dashboard.getRange("A11:K89").setBackgroundColor(colors.panel);
  dashboard.getRange("A10:K89").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, colors.grid);
  dashboard.getRange("A11:K89").setVerticalAlignment("top");
  dashboard.getRange("D11:H89").setWrap(true).setVerticalAlignment("top");
  dashboard.getRange("L11:L89").setValues(
    Array.from({ length: 79 }, (_, index) => {
      const row = index + 11;
      return [`=IFERROR(VALUE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(LEFT($J${row},19),"-",""),"T",""),":","")),"")`];
    })
  );

  addTextRule(dashboard, "C11:C89", "已更新", colors.greenSoft, colors.green, true);
  addTextRule(dashboard, "C11:C89", "待更新", colors.amberSoft, colors.amber, true);
  addFormulaRule(dashboard, "F11:F89", "=LEN($F11)>0", colors.redSoft, colors.red, true);
  addFormulaRule(dashboard, "G11:G89", "=LEN($G11)>0", colors.amberSoft, colors.amber, true);
  addTextRule(dashboard, "K11:K89", "本地预览", colors.blueSoft, colors.blue, false);
  dashboardConditionalFormatRules += 5;

  setWidths(dashboard, [130, 150, 130, 300, 320, 240, 240, 300, 210, 220, 160, 24, 110, 120, 90, 260, 140, 130]);
  setHeights(dashboard, [
    [0, 34],
    [1, 34],
    [2, 34],
    [4, 26],
    [5, 38],
    [6, 24],
    [9, 30],
    [29, 30],
  ]);
  dashboard.setRowHeights(10, 79, 54);

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

  const log = sheets["log__sample_member"];
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
  styleLogSheet(log);
  sampleLogConditionalFormatRules += addSampleLogConditionalFormatting(log);
  log.getRange("A1:Z1").setBorder(api.Enum.BorderType.ALL, api.Enum.BorderStyleTypes.THIN, "#D7DEE8");

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
      .addRange("M30:N34")
      .setPosition(10, 12, 0, 0)
      .setWidth(640)
      .setHeight(250)
      .setOptions("title.content", "更新分布")
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

  workbook.setActiveSheet(dashboard);

  return {
    success: true,
    sheets: workbook.getSheets().map((sheet) => sheet.getSheetName()),
    createdSheets,
    deletedSheets,
    clearedRanges,
    dashboardRange: "Dashboard!A1:R34",
    chartSourceRange: "Dashboard!M30:R34",
    personalLogRange: "log__sample_member!A1:Z1",
    dashboardConditionalFormatRules,
    peopleConditionalFormatRules,
    auditConditionalFormatRules,
    sampleLogConditionalFormatRules,
    dashboardCharts: chartResult,
  };
};
