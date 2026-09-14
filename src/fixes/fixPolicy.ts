import type { QualityFindingV2 } from "../quality/types";

export type FixDisposition = "apply" | "preview" | "review" | "forbidden";

export interface FixDispositionOptions {
  previewApproved?: boolean;
}

export function getFixDisposition(
  finding: QualityFindingV2,
  options: FixDispositionOptions = {}
): FixDisposition {
  switch (finding.fixPolicy) {
    case "auto-safe":
      return "apply";
    case "auto-with-preview":
      return options.previewApproved ? "apply" : "preview";
    case "review-required":
      return "review";
    case "never-auto-fix":
      return "forbidden";
  }
}

export function selectFixAllSafe(
  findings: readonly QualityFindingV2[],
  approvedPreviewFindingIds: ReadonlySet<string> = new Set<string>()
): QualityFindingV2[] {
  return findings.filter((finding) =>
    getFixDisposition(finding, {
      previewApproved: approvedPreviewFindingIds.has(finding.id)
    }) === "apply"
  );
}
