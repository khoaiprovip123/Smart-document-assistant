import { describe, expect, it } from "vitest";
import { evaluateV2Preflight } from "../../preflight/preflight";
import type { QualityFindingV2 } from "../../quality/types";

function finding(severity: QualityFindingV2["severity"], id = severity): QualityFindingV2 {
  return {
    id,
    ruleId: `RULE-${id}`,
    category: "release-hygiene",
    severity,
    title: id,
    message: id,
    fixPolicy: "review-required",
    provenance: {
      sourceId: "SRC",
      sourceTitle: "Source",
      issuer: "Issuer",
      profileId: "P",
      profileVersion: "1"
    }
  };
}

describe("V2 preflight", () => {
  it("returns READY only for verified profiles with no blocking/review findings", () => {
    const result = evaluateV2Preflight({ profileStatus: "verified", findings: [], missingCapabilities: [] });
    expect(result.status).toBe("READY");
    expect(result.checklist.every((item) => item.passed)).toBe(true);
  });

  it("blocks on critical findings", () => {
    const result = evaluateV2Preflight({ profileStatus: "verified", findings: [finding("critical")], missingCapabilities: [] });
    expect(result.status).toBe("BLOCKED");
    expect(result.blockingCount).toBe(1);
  });

  it("requires review for warnings, unverified profiles, or capability gaps", () => {
    expect(evaluateV2Preflight({ profileStatus: "verified", findings: [finding("warning")], missingCapabilities: [] }).status)
      .toBe("REVIEW_REQUIRED");
    expect(evaluateV2Preflight({ profileStatus: "unverified", findings: [], missingCapabilities: [] }).status)
      .toBe("REVIEW_REQUIRED");
    expect(evaluateV2Preflight({ profileStatus: "verified", findings: [], missingCapabilities: ["trackedChanges"] }).status)
      .toBe("REVIEW_REQUIRED");
  });

  it("keeps suggestions non-blocking", () => {
    expect(evaluateV2Preflight({ profileStatus: "verified", findings: [finding("suggestion")], missingCapabilities: [] }).status)
      .toBe("READY");
  });
});
