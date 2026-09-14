import { describe, expect, it } from "vitest";
import { buildFixPreview } from "../../fixes/fixPreview";
import { summarizeDocumentHealth } from "../../quality/healthDashboard";
import type { QualityFindingV2 } from "../../quality/types";
import type { FixPolicy, RuleCategory } from "../../standards/types";

function finding(id: string, severity: QualityFindingV2["severity"], category: RuleCategory, fixPolicy: FixPolicy): QualityFindingV2 {
  return {
    id,
    ruleId: `RULE-${id}`,
    category,
    severity,
    title: `Title ${id}`,
    message: `Message ${id}`,
    current: "before",
    expected: "after",
    fixPolicy,
    provenance: {
      sourceId: "SRC",
      sourceTitle: "Source",
      sourceType: "law",
      sourceLocator: "Appendix I",
      profileId: "P",
      profileVersion: "1",
      profileLayer: "legal",
      trace: []
    }
  };
}

describe("document health and fix preview", () => {
  it("summarizes severity, category and fix-policy counts", () => {
    const findings = [
      finding("a", "critical", "layout", "safe-auto-fix"),
      finding("b", "warning", "typography", "auto-with-preview"),
      finding("c", "suggestion", "typography", "review-required")
    ];
    const health = summarizeDocumentHealth(findings);
    expect(health.total).toBe(3);
    expect(health.bySeverity.critical).toBe(1);
    expect(health.byCategory.typography).toBe(2);
    expect(health.fixability.safeAuto).toBe(1);
    expect(health.fixability.previewRequired).toBe(1);
    expect(health.fixability.reviewRequired).toBe(1);
  });

  it("builds a non-mutating preview with source-backed details", () => {
    const preview = buildFixPreview([
      finding("a", "warning", "layout", "auto-with-preview"),
      finding("b", "warning", "release-hygiene", "never-auto-fix")
    ]);
    expect(preview).toHaveLength(2);
    expect(preview[0]).toMatchObject({ findingId: "a", current: "before", expected: "after", disposition: "preview" });
    expect(preview[0].sourceLabel).toContain("Source");
    expect(preview[1].disposition).toBe("forbidden");
  });
});
