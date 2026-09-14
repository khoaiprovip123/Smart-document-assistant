import type { DocumentRuleProfile } from "../types";
import { buildSemanticTablePlan, type SemanticCellAlignment } from "./tableSemanticFormatting";

export interface TableStandardizationConfig {
  fontName: string;
  fontSize: number;
  headerRowCount: number;
  tableAlignment: "Left" | "Centered" | "Right";
  minimumSemanticConfidence: number;
}

export interface TableStandardizationResult {
  processed: number;
  skipped: number;
  semanticColumnsAligned: number;
  semanticColumnsPreserved: number;
}

export function getTableStandardizationConfig(profile: DocumentRuleProfile): TableStandardizationConfig {
  return {
    fontName: profile.body.fontName,
    fontSize: 12,
    headerRowCount: 1,
    tableAlignment: "Left",
    minimumSemanticConfidence: 0.75
  };
}

function toWordAlignment(alignment: SemanticCellAlignment): Word.Alignment | undefined {
  if (alignment === "Preserve") return undefined;
  return alignment as Word.Alignment;
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

    tables.items.forEach((table) => table.load("rowCount,values,isUniform"));
    await context.sync();

    let processed = 0;
    let skipped = 0;
    let semanticColumnsAligned = 0;
    let semanticColumnsPreserved = 0;

    for (const table of tables.items) {
      if (table.rowCount < 1) {
        skipped += 1;
        continue;
      }

      table.font.name = config.fontName;
      table.font.size = config.fontSize;
      table.headerRowCount = Math.min(config.headerRowCount, table.rowCount);

      // `alignment` controls table placement on the page. Do not use
      // `horizontalAlignment` here because that would force every cell to one alignment.
      table.alignment = config.tableAlignment as Word.Alignment;

      if (!table.isUniform || !table.values?.[0]?.length) {
        semanticColumnsPreserved += table.values?.[0]?.length ?? 0;
        processed += 1;
        continue;
      }

      const plan = buildSemanticTablePlan(table.values);
      for (const column of plan.columns) {
        if (column.confidence < config.minimumSemanticConfidence) {
          semanticColumnsPreserved += 1;
          continue;
        }

        const headerAlignment = toWordAlignment(column.headerAlignment);
        if (headerAlignment && table.rowCount > 0) {
          const headerCell = table.getCell(0, column.columnIndex);
          headerCell.horizontalAlignment = headerAlignment;
          headerCell.verticalAlignment = "Center";
        }

        const bodyAlignment = toWordAlignment(column.bodyAlignment);
        if (!bodyAlignment) {
          semanticColumnsPreserved += 1;
          continue;
        }

        for (let rowIndex = config.headerRowCount; rowIndex < table.rowCount; rowIndex += 1) {
          const cell = table.getCell(rowIndex, column.columnIndex);
          cell.horizontalAlignment = bodyAlignment;
        }
        semanticColumnsAligned += 1;
      }

      processed += 1;
    }

    await context.sync();
    return { processed, skipped, semanticColumnsAligned, semanticColumnsPreserved };
  });
}
