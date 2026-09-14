import type { QualityContext } from "./context";
import { evaluateHeadingHierarchy } from "./engines/headingEngine";
import { evaluateLayout } from "./engines/layoutEngine";
import { evaluateReleaseHygiene } from "./engines/releaseHygieneEngine";
import { evaluateStructure } from "./engines/structureEngine";
import { evaluateTables } from "./engines/tableEngine";
import { evaluateTextHygiene } from "./engines/textHygieneEngine";
import { evaluateTypography } from "./engines/typographyEngine";
import type { QualityFindingV2 } from "./types";

const severityWeight: Record<QualityFindingV2["severity"], number> = {
  critical: 400,
  warning: 300,
  suggestion: 200,
  info: 100
};

function locationKey(finding: QualityFindingV2): string {
  return [
    finding.location?.sectionIndex ?? -1,
    finding.location?.paragraphIndex ?? -1,
    finding.location?.tableIndex ?? -1
  ].join(":");
}

export function runCoreQualityEngines(context: QualityContext): QualityFindingV2[] {
  const findings = [
    ...evaluateLayout(context),
    ...evaluateTypography(context),
    ...evaluateStructure(context),
    ...evaluateHeadingHierarchy(context),
    ...evaluateTables(context),
    ...evaluateTextHygiene(context),
    ...evaluateReleaseHygiene(context)
  ];

  const ids = new Set<string>();
  for (const finding of findings) {
    if (ids.has(finding.id)) throw new Error(`Duplicate quality finding id: ${finding.id}`);
    ids.add(finding.id);
  }

  return [...findings].sort((left, right) => {
    const severity = severityWeight[right.severity] - severityWeight[left.severity];
    if (severity !== 0) return severity;
    const category = left.category.localeCompare(right.category);
    if (category !== 0) return category;
    const rule = left.ruleId.localeCompare(right.ruleId);
    if (rule !== 0) return rule;
    return locationKey(left).localeCompare(locationKey(right));
  });
}
