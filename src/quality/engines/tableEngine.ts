import { buildSemanticTablePlan } from "../../services/tableSemanticFormatting";
import { createQualityFinding, type QualityContext } from "../context";
import { isQualityRequirement } from "../requirements";
import type { QualityFindingV2 } from "../types";

function isMixedOrUnknown(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "mixed" || normalized === "unknown" || normalized.length === 0;
}

export function evaluateTables(context: QualityContext): QualityFindingV2[] {
  const findings: QualityFindingV2[] = [];

  for (const resolvedRule of context.profile.rules.values()) {
    if (!isQualityRequirement(resolvedRule.requirement)) continue;

    if (resolvedRule.requirement.kind === "table-require-header-row") {
      for (const table of context.document.tables) {
        if (table.headerRowCount === undefined) continue;
        if (table.headerRowCount < 1) {
          findings.push(createQualityFinding(context, resolvedRule, {
            message: `Bảng ${table.index + 1} chưa có hàng tiêu đề theo profile.`,
            current: table.headerRowCount,
            expected: ">= 1",
            location: { tableIndex: table.index }
          }));
        }
      }
      continue;
    }

    if (resolvedRule.requirement.kind !== "table-semantic-alignment") continue;
    const minimumConfidence = resolvedRule.requirement.minimumConfidence ?? 0.75;

    for (const table of context.document.tables) {
      if (!table.values?.length || !table.horizontalAlignment || isMixedOrUnknown(table.horizontalAlignment)) continue;

      const plan = buildSemanticTablePlan(table.values);
      const expectedAlignments = [...new Set(
        plan.columns
          .filter((column) => column.confidence >= minimumConfidence && column.bodyAlignment !== "Preserve")
          .map((column) => column.bodyAlignment)
      )];

      if (expectedAlignments.length < 2) continue;

      findings.push(createQualityFinding(context, resolvedRule, {
        message: `Bảng ${table.index + 1} đang áp một kiểu căn ngang cho toàn bộ ô trong khi các cột có ngữ nghĩa khác nhau.`,
        current: table.horizontalAlignment,
        expected: expectedAlignments.join(" / "),
        location: { tableIndex: table.index }
      }));
    }
  }

  return findings;
}
