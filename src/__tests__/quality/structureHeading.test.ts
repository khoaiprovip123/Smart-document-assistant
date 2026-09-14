import { describe, expect, it } from "vitest";
import { evaluateStructure } from "../../quality/engines/structureEngine";
import { evaluateHeadingHierarchy } from "../../quality/engines/headingEngine";
import { qualityContext, snapshot } from "./helpers";

describe("structure and heading engines", () => {
  it("reports a missing required heading", () => {
    const context = qualityContext(snapshot({
      paragraphs: [
        { index: 0, text: "Giới thiệu", semantic: { role: "heading", headingLevel: 1, confidence: 1, evidence: ["test"] } }
      ]
    }), [{ kind: "structure-required-heading", text: "MỤC ĐÍCH" }]);

    const findings = evaluateStructure(context);
    expect(findings).toHaveLength(1);
    expect(findings[0].expected).toBe("MỤC ĐÍCH");
  });

  it("accepts a required heading case-insensitively", () => {
    const context = qualityContext(snapshot({
      paragraphs: [
        { index: 0, text: "Mục đích", semantic: { role: "heading", headingLevel: 1, confidence: 1, evidence: ["test"] } }
      ]
    }), [{ kind: "structure-required-heading", text: "MỤC ĐÍCH" }]);
    expect(evaluateStructure(context)).toEqual([]);
  });

  it("reports heading level jumps but allows resets", () => {
    const context = qualityContext(snapshot({
      paragraphs: [
        { index: 0, text: "H1", semantic: { role: "heading", headingLevel: 1, confidence: 1, evidence: ["test"] } },
        { index: 1, text: "H3", semantic: { role: "heading", headingLevel: 3, confidence: 1, evidence: ["test"] } },
        { index: 2, text: "H1 again", semantic: { role: "heading", headingLevel: 1, confidence: 1, evidence: ["test"] } }
      ]
    }), [{ kind: "heading-max-level-jump", maxJump: 1 }]);

    const findings = evaluateHeadingHierarchy(context);
    expect(findings).toHaveLength(1);
    expect(findings[0].location?.paragraphIndex).toBe(1);
  });
});
