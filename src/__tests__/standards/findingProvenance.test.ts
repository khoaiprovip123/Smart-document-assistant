import { expect, it } from "vitest";
import { buildFindingProvenance } from "../../standards/findingProvenance";
import type { Finding } from "../../types";

it("builds explainable provenance from a resolved rule", () => {
  const provenance = buildFindingProvenance(
    {
      rule: {
        id: "RULE-1", title: "Rule", category: "layout", requirement: 30,
        severity: "critical", fixPolicy: "auto-with-preview", sourceId: "SRC",
        sourceLocator: "Appendix I", scope: {}, enabled: true
      },
      requirement: 30,
      profileId: "VN-ND30",
      profileVersion: "1.0.0",
      layer: "legal",
      resolutionTrace: []
    },
    { id: "SRC", title: "Source", issuer: "Issuer", sourceType: "law" }
  );
  expect(provenance.sourceId).toBe("SRC");
  expect(provenance.profileId).toBe("VN-ND30");
  expect(provenance.sourceLocator).toBe("Appendix I");
});

it("rejects a mismatched source object", () => {
  expect(() => buildFindingProvenance(
    {
      rule: {
        id: "RULE-1", title: "Rule", category: "layout", requirement: 30,
        severity: "critical", fixPolicy: "auto-with-preview", sourceId: "SRC",
        scope: {}, enabled: true
      },
      requirement: 30,
      profileId: "PROFILE",
      profileVersion: "1",
      layer: "legal",
      resolutionTrace: []
    },
    { id: "OTHER", title: "Other", issuer: "Issuer", sourceType: "law" }
  )).toThrow(/source mismatch/i);
});

it("keeps V1 Finding compatible without provenance", () => {
  const finding: Finding = {
    id: "legacy-1",
    ruleId: "BODY-FONT",
    severity: "warning",
    scope: "paragraph",
    title: "Legacy",
    message: "Legacy finding remains valid",
    autoFixable: false
  };
  expect(finding.provenance).toBeUndefined();
});
