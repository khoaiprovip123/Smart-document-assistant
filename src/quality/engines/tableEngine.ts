import { createQualityFinding, type QualityContext } from "../context";
import { isQualityRequirement } from "../requirements";
import type { QualityFindingV2 } from "../types";

export function evaluateTables(context: QualityContext): QualityFindingV2[] {
  const findings: QualityFindingV2[] = [];

  for (const resolvedRule of context.profile.rules.values()) {
    if (!isQualityRequirement(resolvedRule.requirement)) continue;
    if (resolvedRule.requirement.kind !== "table-require-header-row") continue;

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
  }

  return findings;
}
