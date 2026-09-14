import { describe, expect, it } from "vitest";
import { createBuiltinDomainRegistry } from "../../domains/builtinDomainRegistry";
import { buildWordCapabilityMatrix } from "../../word/capabilities";
import { createSemanticDocumentSnapshot } from "../../word/documentModel";
import { evaluateV2Quality, resolveLegacyProfileRef } from "../../v2/workflow";

const allCapabilities = buildWordCapabilityMatrix(() => true);

function snapshot(fontName = "Arial") {
  return createSemanticDocumentSnapshot({
    capabilities: allCapabilities,
    sections: [{
      index: 0,
      pageSetup: {
        paperSize: "A4",
        topMarginPt: 56.7,
        bottomMarginPt: 56.7,
        leftMarginPt: 85.1,
        rightMarginPt: 56.7
      }
    }],
    paragraphs: [{
      index: 0,
      text: "Nội dung văn bản",
      fontName,
      fontSize: 13,
      alignment: "Justified",
      semantic: { role: "body", confidence: 1, evidence: ["test"] }
    }],
    tables: [],
    fields: [],
    inlinePictures: [],
    comments: [],
    trackedChanges: []
  });
}

describe("V2 workflow orchestration", () => {
  it("maps compatible V1 system profiles to V2 profiles", () => {
    expect(resolveLegacyProfileRef("HPC-ND30")).toEqual({ id: "VN-ND30-ADMIN", version: "1.0.0" });
    expect(resolveLegacyProfileRef("HPC-INTERNAL")).toEqual({ id: "HPC-CORPORATE-BASE", version: "1.0.0" });
    expect(resolveLegacyProfileRef("HPC-SOP")).toEqual({ id: "HPC-SOP-POLICY", version: "1.0.0" });
    expect(resolveLegacyProfileRef("CUSTOM")).toBeUndefined();
  });

  it("builds findings, health, preview and preflight from one resolved profile", () => {
    const registry = createBuiltinDomainRegistry();
    const result = evaluateV2Quality(
      registry,
      { id: "VN-ND30-ADMIN", version: "1.0.0" },
      snapshot("Arial")
    );

    expect(result.profile.id).toBe("VN-ND30-ADMIN");
    expect(result.findings.some((finding) => finding.ruleId === "ND30-BODY-FONT")).toBe(true);
    expect(result.health.total).toBe(result.findings.length);
    expect(result.preview.length).toBe(result.findings.length);
    expect(result.preflight.status).toBe("REVIEW_REQUIRED");
    expect(result.missingCapabilities).toEqual([]);
  });

  it("surfaces capability gaps required by active rules", () => {
    const registry = createBuiltinDomainRegistry();
    const limited = createSemanticDocumentSnapshot({
      ...snapshot("Times New Roman"),
      capabilities: buildWordCapabilityMatrix(() => false)
    });
    const result = evaluateV2Quality(
      registry,
      { id: "VN-ND30-ADMIN", version: "1.0.0" },
      limited
    );
    expect(result.missingCapabilities).toContain("pageSetupDesktop");
    expect(result.preflight.status).toBe("REVIEW_REQUIRED");
  });
});
