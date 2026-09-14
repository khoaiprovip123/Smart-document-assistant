import { createQualityFinding, type QualityContext } from "../context";
import { isQualityRequirement, type LayoutMarginSide, type QualityRequirement } from "../requirements";
import type { QualityFindingV2 } from "../types";

const marginProperty: Record<LayoutMarginSide, "topMarginPt" | "bottomMarginPt" | "leftMarginPt" | "rightMarginPt"> = {
  top: "topMarginPt",
  bottom: "bottomMarginPt",
  left: "leftMarginPt",
  right: "rightMarginPt"
};

function evaluateRequirement(
  context: QualityContext,
  resolvedRule: Parameters<typeof createQualityFinding>[1],
  requirement: QualityRequirement
): QualityFindingV2[] {
  if (!requirement.kind.startsWith("layout-")) return [];
  const findings: QualityFindingV2[] = [];

  for (const section of context.document.sections) {
    const setup = section.pageSetup;
    if (!setup) continue;
    const location = { sectionIndex: section.index };

    if (requirement.kind === "layout-paper-size") {
      if (setup.paperSize !== undefined && setup.paperSize !== requirement.expected) {
        findings.push(createQualityFinding(context, resolvedRule, {
          message: `Khổ giấy section ${section.index + 1} không đúng profile.`,
          current: setup.paperSize,
          expected: requirement.expected,
          location
        }));
      }
      continue;
    }

    if (requirement.kind === "layout-orientation") {
      if (setup.orientation !== undefined && setup.orientation !== requirement.expected) {
        findings.push(createQualityFinding(context, resolvedRule, {
          message: `Hướng trang section ${section.index + 1} không đúng profile.`,
          current: setup.orientation,
          expected: requirement.expected,
          location
        }));
      }
      continue;
    }

    if (requirement.kind === "layout-margin-range") {
      const current = setup[marginProperty[requirement.side]];
      if (typeof current === "number" && (current < requirement.minPt || current > requirement.maxPt)) {
        findings.push(createQualityFinding(context, resolvedRule, {
          message: `Lề ${requirement.side} của section ${section.index + 1} nằm ngoài khoảng cho phép.`,
          current,
          expected: { minPt: requirement.minPt, maxPt: requirement.maxPt, preferredPt: requirement.preferredPt },
          location
        }));
      }
    }
  }

  return findings;
}

export function evaluateLayout(context: QualityContext): QualityFindingV2[] {
  const findings: QualityFindingV2[] = [];
  for (const resolvedRule of context.profile.rules.values()) {
    if (!isQualityRequirement(resolvedRule.requirement)) continue;
    findings.push(...evaluateRequirement(context, resolvedRule, resolvedRule.requirement));
  }
  return findings;
}
