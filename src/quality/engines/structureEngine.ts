import { createQualityFinding, type QualityContext } from "../context";
import { isQualityRequirement } from "../requirements";
import type { QualityFindingV2 } from "../types";

const normalizeHeadingText = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");

export function evaluateStructure(context: QualityContext): QualityFindingV2[] {
  const findings: QualityFindingV2[] = [];
  const headings = context.document.paragraphs.filter((paragraph) => paragraph.semantic?.role === "heading");

  for (const resolvedRule of context.profile.rules.values()) {
    if (!isQualityRequirement(resolvedRule.requirement)) continue;
    const requirement = resolvedRule.requirement;
    if (requirement.kind !== "structure-required-heading") continue;

    const expected = normalizeHeadingText(requirement.text);
    const exists = headings.some((paragraph) => normalizeHeadingText(paragraph.text) === expected);
    if (!exists) {
      findings.push(createQualityFinding(context, resolvedRule, {
        message: `Thiếu đề mục bắt buộc: ${requirement.text}.`,
        current: "missing",
        expected: requirement.text,
        discriminator: normalizeHeadingText(requirement.text)
      }));
    }
  }

  return findings;
}
