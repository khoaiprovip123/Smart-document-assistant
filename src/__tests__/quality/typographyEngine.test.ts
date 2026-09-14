import { describe, expect, it } from "vitest";
import { evaluateTypography } from "../../quality/engines/typographyEngine";
import { qualityContext, snapshot } from "./helpers";

describe("typography engine", () => {
  it("checks only targeted semantic roles", () => {
    const context = qualityContext(snapshot({
      paragraphs: [
        { index: 0, text: "Body", fontName: "Arial", fontSize: 11, alignment: "Left", semantic: { role: "body", confidence: 1, evidence: ["test"] } },
        { index: 1, text: "Caption", fontName: "Arial", fontSize: 10, alignment: "Centered", semantic: { role: "caption", confidence: 1, evidence: ["test"] } }
      ]
    }), [
      { kind: "typography-font", roles: ["body"], allowedFontNames: ["Times New Roman"] },
      { kind: "typography-size-range", roles: ["body"], minPt: 13, maxPt: 14, preferredPt: 13 },
      { kind: "typography-alignment", roles: ["body"], expected: "Justified" }
    ]);

    const findings = evaluateTypography(context);
    expect(findings).toHaveLength(3);
    expect(findings.every((finding) => finding.location?.paragraphIndex === 0)).toBe(true);
  });

  it("does not create false violations for unknown aggregate formatting", () => {
    const context = qualityContext(snapshot({
      paragraphs: [{ index: 0, text: "Mixed", semantic: { role: "body", confidence: 1, evidence: ["test"] } }]
    }), [{ kind: "typography-font", roles: ["body"], allowedFontNames: ["Times New Roman"] }]);
    expect(evaluateTypography(context)).toEqual([]);
  });
});
