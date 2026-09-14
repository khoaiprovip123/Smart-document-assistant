import { describe, expect, it } from "vitest";
import { evaluateLayout } from "../../quality/engines/layoutEngine";
import { qualityContext, snapshot } from "./helpers";

describe("layout engine", () => {
  it("reports section-scoped paper/orientation/margin violations", () => {
    const context = qualityContext(snapshot({
      sections: [
        { index: 0, pageSetup: { paperSize: "Letter", orientation: "Landscape", leftMarginPt: 50 } },
        { index: 1, pageSetup: { paperSize: "A4", orientation: "Portrait", leftMarginPt: 90 } }
      ]
    }), [
      { kind: "layout-paper-size", expected: "A4" },
      { kind: "layout-orientation", expected: "Portrait" },
      { kind: "layout-margin-range", side: "left", minPt: 80, maxPt: 100, preferredPt: 85 }
    ]);

    const findings = evaluateLayout(context);
    expect(findings.some((f) => f.location?.sectionIndex === 0 && f.current === "Letter")).toBe(true);
    expect(findings.some((f) => f.location?.sectionIndex === 0 && f.current === "Landscape")).toBe(true);
    expect(findings.some((f) => f.location?.sectionIndex === 0 && f.current === 50)).toBe(true);
    expect(findings.some((f) => f.location?.sectionIndex === 1 && f.current === 90)).toBe(false);
  });

  it("does not report missing unobservable page setup as a violation", () => {
    const context = qualityContext(snapshot({ sections: [{ index: 0 }] }), [
      { kind: "layout-paper-size", expected: "A4" }
    ]);
    expect(evaluateLayout(context)).toEqual([]);
  });
});
