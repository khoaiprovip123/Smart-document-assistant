import { describe, expect, it } from "vitest";
import { getFixDisposition, selectFixAllSafe } from "../../fixes/fixPolicy";
import type { QualityFindingV2 } from "../../quality/types";
import type { FixPolicy } from "../../standards/types";

function finding(id: string, fixPolicy: FixPolicy): QualityFindingV2 {
  return {
    id,
    ruleId: `RULE-${id}`,
    category: "typography",
    severity: "warning",
    title: id,
    message: id,
    fixPolicy,
    provenance: {
      sourceId: "SRC",
      sourceTitle: "Source",
      sourceType: "custom",
      profileId: "P",
      profileVersion: "1",
      profileLayer: "custom",
      trace: []
    }
  };
}

describe("fix policy enforcement", () => {
  it("distinguishes safe, preview, review, and forbidden policies", () => {
    expect(getFixDisposition(finding("safe", "safe-auto-fix"))).toBe("apply");
    expect(getFixDisposition(finding("preview", "auto-with-preview"))).toBe("preview");
    expect(getFixDisposition(finding("preview", "auto-with-preview"), { previewApproved: true })).toBe("apply");
    expect(getFixDisposition(finding("review", "review-required"))).toBe("review");
    expect(getFixDisposition(finding("never", "never-auto-fix"))).toBe("forbidden");
  });

  it("Fix All Safe includes only safe fixes plus explicitly approved previews", () => {
    const findings = [
      finding("safe", "safe-auto-fix"),
      finding("preview", "auto-with-preview"),
      finding("review", "review-required"),
      finding("never", "never-auto-fix")
    ];
    expect(selectFixAllSafe(findings).map((item) => item.id)).toEqual(["safe"]);
    expect(selectFixAllSafe(findings, new Set(["preview"])).map((item) => item.id)).toEqual(["safe", "preview"]);
  });
});
