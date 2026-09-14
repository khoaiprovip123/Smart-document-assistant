import { createQualityFinding, type QualityContext } from "../context";
import { isQualityRequirement } from "../requirements";
import type { QualityFindingV2 } from "../types";

function hasDoubleSpaceOutsideLeadingIndent(text: string): boolean {
  const withoutLeadingIndent = text.replace(/^ +/, "");
  return withoutLeadingIndent.includes("  ");
}

function hasPunctuationSpacingIssue(text: string): boolean {
  return /\s+[,.!?;:]/u.test(text) || /[,.!?;:](?=[\p{L}\p{N}])/u.test(text);
}

export function evaluateTextHygiene(context: QualityContext): QualityFindingV2[] {
  const findings: QualityFindingV2[] = [];

  for (const resolvedRule of context.profile.rules.values()) {
    if (!isQualityRequirement(resolvedRule.requirement)) continue;
    const requirement = resolvedRule.requirement;
    if (requirement.kind !== "text-no-double-spaces" && requirement.kind !== "text-punctuation-spacing") continue;

    for (const paragraph of context.document.paragraphs) {
      if (!paragraph.text) continue;
      const violates = requirement.kind === "text-no-double-spaces"
        ? hasDoubleSpaceOutsideLeadingIndent(paragraph.text)
        : hasPunctuationSpacingIssue(paragraph.text);
      if (!violates) continue;

      findings.push(createQualityFinding(context, resolvedRule, {
        message: requirement.kind === "text-no-double-spaces"
          ? `Đoạn ${paragraph.index + 1} có khoảng trắng kép.`
          : `Đoạn ${paragraph.index + 1} có khoảng cách dấu câu chưa nhất quán.`,
        current: paragraph.text,
        expected: requirement.kind === "text-no-double-spaces" ? "single spaces" : "normalized punctuation spacing",
        location: { paragraphIndex: paragraph.index }
      }));
    }
  }

  return findings;
}
