import { describe, expect, it } from "vitest";
import { runCoreQualityEngines } from "../../quality/runCoreQualityEngines";
import { qualityContext, snapshot } from "./helpers";

describe("core quality runner", () => {
  it("returns deterministic source-backed findings without duplicate ids", () => {
    const context = qualityContext(snapshot({
      sections: [{ index: 0, pageSetup: { paperSize: "Letter" } }],
      paragraphs: [{ index: 0, text: "Body  text", fontName: "Arial", semantic: { role: "body", confidence: 1, evidence: ["test"] } }],
      comments: [{ id: "c1", content: "comment" }]
    }), [
      { kind: "layout-paper-size", expected: "A4" },
      { kind: "typography-font", roles: ["body"], allowedFontNames: ["Times New Roman"] },
      { kind: "text-no-double-spaces" },
      { kind: "release-no-comments" }
    ]);

    const findings = runCoreQualityEngines(context);
    expect(findings).toHaveLength(4);
    expect(new Set(findings.map((finding) => finding.id)).size).toBe(findings.length);
    expect(findings.every((finding) => finding.provenance.sourceId === "TEST-SOURCE")).toBe(true);
    expect(findings.every((finding) => finding.provenance.profileId === "TEST-PROFILE")).toBe(true);

    const again = runCoreQualityEngines(context);
    expect(again.map((finding) => finding.id)).toEqual(findings.map((finding) => finding.id));
  });
});
