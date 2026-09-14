import { createQualityFinding, type QualityContext } from "../context";
import { isQualityRequirement } from "../requirements";
import type { QualityFindingV2 } from "../types";

const normalize = (value: string) => value.trim().toLocaleLowerCase("en-US");

export function evaluateTypography(context: QualityContext): QualityFindingV2[] {
  const findings: QualityFindingV2[] = [];

  for (const resolvedRule of context.profile.rules.values()) {
    if (!isQualityRequirement(resolvedRule.requirement)) continue;
    const requirement = resolvedRule.requirement;
    if (
      requirement.kind !== "typography-font" &&
      requirement.kind !== "typography-size-range" &&
      requirement.kind !== "typography-alignment"
    ) continue;

    for (const paragraph of context.document.paragraphs) {
      const role = paragraph.semantic?.role;
      if (!role || !requirement.roles.includes(role)) continue;
      const location = { paragraphIndex: paragraph.index };

      if (requirement.kind === "typography-font") {
        if (paragraph.fontName === undefined) continue;
        const allowed = requirement.allowedFontNames.map(normalize);
        if (!allowed.includes(normalize(paragraph.fontName))) {
          findings.push(createQualityFinding(context, resolvedRule, {
            message: `Font của đoạn ${paragraph.index + 1} không đúng profile.`,
            current: paragraph.fontName,
            expected: [...requirement.allowedFontNames],
            location
          }));
        }
        continue;
      }

      if (requirement.kind === "typography-size-range") {
        if (typeof paragraph.fontSize !== "number") continue;
        if (paragraph.fontSize < requirement.minPt || paragraph.fontSize > requirement.maxPt) {
          findings.push(createQualityFinding(context, resolvedRule, {
            message: `Cỡ chữ của đoạn ${paragraph.index + 1} nằm ngoài khoảng cho phép.`,
            current: paragraph.fontSize,
            expected: { minPt: requirement.minPt, maxPt: requirement.maxPt, preferredPt: requirement.preferredPt },
            location
          }));
        }
        continue;
      }

      if (paragraph.alignment === undefined) continue;
      if (normalize(paragraph.alignment) !== normalize(requirement.expected)) {
        findings.push(createQualityFinding(context, resolvedRule, {
          message: `Căn lề của đoạn ${paragraph.index + 1} không đúng profile.`,
          current: paragraph.alignment,
          expected: requirement.expected,
          location
        }));
      }
    }
  }

  return findings;
}
