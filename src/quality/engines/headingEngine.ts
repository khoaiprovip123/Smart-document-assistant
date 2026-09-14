import { createQualityFinding, type QualityContext } from "../context";
import { isQualityRequirement } from "../requirements";
import type { QualityFindingV2 } from "../types";

export function evaluateHeadingHierarchy(context: QualityContext): QualityFindingV2[] {
  const findings: QualityFindingV2[] = [];
  const headings = context.document.paragraphs.filter(
    (paragraph) => paragraph.semantic?.role === "heading" && typeof paragraph.semantic.headingLevel === "number"
  );

  for (const resolvedRule of context.profile.rules.values()) {
    if (!isQualityRequirement(resolvedRule.requirement)) continue;
    const requirement = resolvedRule.requirement;
    if (requirement.kind !== "heading-max-level-jump") continue;

    for (let index = 1; index < headings.length; index += 1) {
      const previous = headings[index - 1];
      const current = headings[index];
      const previousLevel = previous.semantic?.headingLevel;
      const currentLevel = current.semantic?.headingLevel;
      if (previousLevel === undefined || currentLevel === undefined) continue;

      const jump = currentLevel - previousLevel;
      if (jump > requirement.maxJump) {
        findings.push(createQualityFinding(context, resolvedRule, {
          message: `Heading nhảy từ cấp ${previousLevel} lên cấp ${currentLevel}, vượt mức cho phép.`,
          current: { previousLevel, currentLevel },
          expected: { maxJump: requirement.maxJump },
          location: { paragraphIndex: current.index }
        }));
      }
    }
  }

  return findings;
}
