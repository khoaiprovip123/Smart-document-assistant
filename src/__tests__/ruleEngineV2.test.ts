import { describe, expect, it } from "vitest";
import { evaluateDocument } from "../rules/ruleEngine";
import { getProfile } from "../config/rules";
import { mmToPoints } from "../utils/units";
import type { DocumentSnapshot } from "../types";

function baseSnapshot(): DocumentSnapshot {
  return {
    supportsPageSetup: true,
    pageSetup: {
      paperSize: "A4",
      orientation: "Portrait",
      topMarginPt: mmToPoints(20),
      bottomMarginPt: mmToPoints(20),
      leftMarginPt: mmToPoints(30),
      rightMarginPt: mmToPoints(20)
    },
    paragraphs: []
  };
}

describe("rule engine v2", () => {
  it("does not apply body typography rules to signature paragraphs", () => {
    const snapshot = baseSnapshot();
    snapshot.paragraphs.push({
      index: 0,
      text: "TỔNG GIÁM ĐỐC",
      style: "HPC.Signature",
      fontName: "Arial",
      fontSize: 18,
      alignment: "Centered"
    });

    const result = evaluateDocument(getProfile("HPC-ND30"), snapshot);
    expect(result.findings.some((f) => f.scope === "paragraph" && f.paragraphIndex === 0 && f.ruleId.startsWith("BODY-"))).toBe(false);
  });

  it("evaluates heading formatting separately from body formatting", () => {
    const snapshot = baseSnapshot();
    snapshot.paragraphs.push({
      index: 0,
      text: "1. Mục đích",
      style: "HPC.Heading1",
      fontName: "Arial",
      fontSize: 10,
      alignment: "Left"
    });

    const result = evaluateDocument(getProfile("HPC-ND30"), snapshot);
    expect(result.findings.some((f) => f.ruleId === "HEADING-FONT-NAME" && f.paragraphIndex === 0)).toBe(true);
    expect(result.findings.some((f) => f.ruleId === "BODY-FONT-NAME" && f.paragraphIndex === 0)).toBe(false);
  });

  it("does not penalize score for capability-only findings", () => {
    const snapshot: DocumentSnapshot = {
      supportsPageSetup: false,
      paragraphs: []
    };
    const result = evaluateDocument(getProfile("HPC-ND30"), snapshot);
    expect(result.score).toBe(100);
  });

  it("keeps score proportional instead of collapsing on long documents", () => {
    const snapshot = baseSnapshot();
    snapshot.paragraphs = Array.from({ length: 20 }, (_, index) => ({
      index,
      text: `Đoạn ${index + 1}`,
      style: "Normal",
      fontName: index === 0 ? "Arial" : "Times New Roman",
      fontSize: 13,
      alignment: "Justified",
      firstLineIndentPt: mmToPoints(10)
    }));

    const result = evaluateDocument(getProfile("HPC-ND30"), snapshot);
    expect(result.score).toBeGreaterThan(80);
    expect(result.score).toBeLessThan(100);
  });
});
