import type { DocumentRuleProfile } from "../types";

export interface TableStandardizationConfig {
  fontName: string;
  fontSize: number;
  headerRowCount: number;
  horizontalAlignment: "Left" | "Centered" | "Right" | "Justified";
}

export interface TableStandardizationResult {
  processed: number;
  skipped: number;
}

export function getTableStandardizationConfig(profile: DocumentRuleProfile): TableStandardizationConfig {
  return {
    fontName: profile.body.fontName,
    fontSize: 12,
    headerRowCount: 1,
    horizontalAlignment: "Left"
  };
}

export async function standardizeTables(profile: DocumentRuleProfile): Promise<TableStandardizationResult> {
  if (typeof Office === "undefined" || Office.context?.host !== Office.HostType.Word) {
    throw new Error("Tính năng chuẩn hóa bảng chỉ hoạt động trong Microsoft Word.");
  }
  if (!Office.context.requirements.isSetSupported("WordApi", "1.3")) {
    throw new Error("Microsoft Word hiện tại chưa hỗ trợ WordApi 1.3 để chuẩn hóa bảng an toàn.");
  }

  const config = getTableStandardizationConfig(profile);
  return Word.run(async (context) => {
    const tables = context.document.body.tables;
    tables.load("items");
    await context.sync();

    tables.items.forEach((table) => table.load("rowCount"));
    await context.sync();

    let processed = 0;
    let skipped = 0;
    for (const table of tables.items) {
      if (table.rowCount < 1) {
        skipped += 1;
        continue;
      }
      table.font.name = config.fontName;
      table.font.size = config.fontSize;
      table.headerRowCount = Math.min(config.headerRowCount, table.rowCount);
      table.horizontalAlignment = config.horizontalAlignment;
      processed += 1;
    }

    await context.sync();
    return { processed, skipped };
  });
}
