import { describe, expect, it } from "vitest";
import { getProfile } from "../config/rules";
import { evaluateDocument } from "../rules/ruleEngine";
import { mmToPoints, pointsToMm } from "../utils/units";
import type { DocumentSnapshot } from "../types";

describe("unit conversion", () => {
  it("converts mm and points consistently", () => {
    expect(pointsToMm(mmToPoints(30))).toBeCloseTo(30, 5);
  });
});

describe("rule engine", () => {
  it("passes compliant ND30 page setup and body paragraph", () => {
    const profile = getProfile("HPC-ND30");
    const snapshot: DocumentSnapshot = {
      supportsPageSetup: true,
      pageSetup: {
        paperSize: "A4",
        orientation: "Portrait",
        topMarginPt: mmToPoints(20),
        bottomMarginPt: mmToPoints(20),
        leftMarginPt: mmToPoints(30),
        rightMarginPt: mmToPoints(20)
      },
      paragraphs: [
        {
          index: 0,
          text: "Đây là nội dung kiểm thử.",
          style: "Normal",
          fontName: "Times New Roman",
          fontSize: 13,
          alignment: "Justified"
        }
      ]
    };

    const result = evaluateDocument(profile, snapshot);
    expect(result.counts.critical).toBe(0);
    expect(result.counts.warning).toBe(0);
    expect(result.score).toBe(100);
  });

  it("detects wrong margins and font", () => {
    const profile = getProfile("HPC-ND30");
    const snapshot: DocumentSnapshot = {
      supportsPageSetup: true,
      pageSetup: {
        paperSize: "A4",
        orientation: "Portrait",
        topMarginPt: mmToPoints(10),
        bottomMarginPt: mmToPoints(20),
        leftMarginPt: mmToPoints(20),
        rightMarginPt: mmToPoints(20)
      },
      paragraphs: [
        {
          index: 0,
          text: "Sai font",
          style: "Normal",
          fontName: "Arial",
          fontSize: 11,
          alignment: "Left"
        }
      ]
    };

    const result = evaluateDocument(profile, snapshot);
    expect(result.counts.critical).toBeGreaterThanOrEqual(2);
    expect(result.findings.some((f) => f.ruleId === "BODY-FONT-NAME" && f.severity === "warning")).toBe(true);
    expect(result.score).toBeLessThan(100);
  });

  it("checks required SOP sections without altering text", () => {
    const profile = getProfile("HPC-SOP");
    const snapshot: DocumentSnapshot = {
      supportsPageSetup: false,
      paragraphs: [
        { index: 0, text: "1. Mục đích" },
        { index: 1, text: "2. Phạm vi" }
      ]
    };
    const result = evaluateDocument(profile, snapshot);
    expect(result.findings.some((f) => f.title === "Thiếu mục: Thuật ngữ")).toBe(true);
  });
});
