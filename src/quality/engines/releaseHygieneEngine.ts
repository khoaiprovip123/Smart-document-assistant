import { createQualityFinding, type QualityContext } from "../context";
import { isQualityRequirement } from "../requirements";
import type { QualityFindingV2 } from "../types";

export function evaluateReleaseHygiene(context: QualityContext): QualityFindingV2[] {
  const findings: QualityFindingV2[] = [];

  for (const resolvedRule of context.profile.rules.values()) {
    if (!isQualityRequirement(resolvedRule.requirement)) continue;
    const requirement = resolvedRule.requirement;

    if (requirement.kind === "release-no-comments") {
      const count = context.document.releaseMetadata.commentsCount;
      if (count > 0) {
        findings.push(createQualityFinding(context, resolvedRule, {
          message: `Tài liệu còn ${count} comment trước khi phát hành.`,
          current: count,
          expected: 0
        }));
      }
      continue;
    }

    if (requirement.kind === "release-no-tracked-changes") {
      const count = context.document.releaseMetadata.trackedChangesCount;
      if (count > 0) {
        findings.push(createQualityFinding(context, resolvedRule, {
          message: `Tài liệu còn ${count} tracked change trước khi phát hành.`,
          current: count,
          expected: 0
        }));
      }
    }
  }

  return findings;
}
