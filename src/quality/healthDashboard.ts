import type { QualityFindingV2 } from "./types";
import type { FixPolicy, RuleCategory } from "../standards/types";

const RULE_CATEGORIES: readonly RuleCategory[] = [
  "layout",
  "typography",
  "structure",
  "heading-numbering",
  "table-figure-equation",
  "citation-reference",
  "accessibility",
  "language-consistency",
  "release-hygiene"
];

export interface DocumentHealthSummary {
  total: number;
  bySeverity: Readonly<Record<QualityFindingV2["severity"], number>>;
  byCategory: Readonly<Record<RuleCategory, number>>;
  fixability: Readonly<{
    safeAuto: number;
    previewRequired: number;
    reviewRequired: number;
    forbidden: number;
  }>;
}

export function summarizeDocumentHealth(findings: readonly QualityFindingV2[]): DocumentHealthSummary {
  const bySeverity: Record<QualityFindingV2["severity"], number> = {
    critical: 0,
    warning: 0,
    suggestion: 0,
    info: 0
  };

  const byCategory = Object.fromEntries(RULE_CATEGORIES.map((category) => [category, 0])) as Record<RuleCategory, number>;
  const byPolicy: Record<FixPolicy, number> = {
    "auto-safe": 0,
    "auto-with-preview": 0,
    "review-required": 0,
    "never-auto-fix": 0
  };

  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
    byCategory[finding.category] += 1;
    byPolicy[finding.fixPolicy] += 1;
  }

  return Object.freeze({
    total: findings.length,
    bySeverity: Object.freeze(bySeverity),
    byCategory: Object.freeze(byCategory),
    fixability: Object.freeze({
      safeAuto: byPolicy["auto-safe"],
      previewRequired: byPolicy["auto-with-preview"],
      reviewRequired: byPolicy["review-required"],
      forbidden: byPolicy["never-auto-fix"]
    })
  });
}
