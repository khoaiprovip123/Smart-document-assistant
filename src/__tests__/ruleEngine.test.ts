import { describe, expect, it } from "vitest";
import { getProfile } from "../config/rules";
import { evaluateDocument } from "../rules/ruleEngine";
import { mmToPoints, pointsToMm } from "../utils/units";
import type { DocumentRuleProfile, DocumentSnapshot } from "../types";

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
          alignment: "Justified",
          firstLineIndentPt: mmToPoints(10)
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
          alignment: "Left",
          firstLineIndentPt: mmToPoints(10)
        }
      ]
    };

    const result = evaluateDocument(profile, snapshot);
    expect(result.counts.critical).toBeGreaterThanOrEqual(2);
    expect(result.findings.some((f) => f.ruleId === "BODY-FONT-NAME" && f.severity === "warning")).toBe(true);
    expect(result.score).toBeLessThan(100);
  });

  it("detects wrong orientation and first-line indent", () => {
    const profile = getProfile("HPC-ND30");
    const snapshot: DocumentSnapshot = {
      supportsPageSetup: true,
      pageSetup: {
        paperSize: "A4",
        orientation: "Landscape",
        topMarginPt: mmToPoints(20),
        bottomMarginPt: mmToPoints(20),
        leftMarginPt: mmToPoints(30),
        rightMarginPt: mmToPoints(20)
      },
      paragraphs: [
        {
          index: 0,
          text: "Sai hướng giấy và thụt đầu dòng",
          style: "Normal",
          fontName: "Times New Roman",
          fontSize: 13,
          alignment: "Justified",
          firstLineIndentPt: mmToPoints(2)
        }
      ]
    };

    const result = evaluateDocument(profile, snapshot);
    expect(result.findings.some((f) => f.ruleId === "PAGE-ORIENTATION" && f.severity === "critical")).toBe(true);
    expect(result.findings.some((f) => f.ruleId === "BODY-FIRST-LINE-INDENT" && f.severity === "warning")).toBe(true);
  });

  it("checks configured paragraph spacing and line spacing", () => {
    const base = getProfile("HPC-ND30");
    const profile: DocumentRuleProfile = {
      ...base,
      body: {
        ...base.body,
        spaceBeforePt: { min: 0, max: 0, preferred: 0, unit: "pt" },
        spaceAfterPt: { min: 6, max: 6, preferred: 6, unit: "pt" },
        lineSpacingPt: { min: 18, max: 18, preferred: 18, unit: "pt" }
      }
    };
    const snapshot: DocumentSnapshot = {
      supportsPageSetup: false,
      paragraphs: [
        {
          index: 0,
          text: "Đoạn có spacing sai",
          style: "Normal",
          fontName: "Times New Roman",
          fontSize: 13,
          alignment: "Justified",
          firstLineIndentPt: mmToPoints(10),
          spaceBeforePt: 3,
          spaceAfterPt: 0,
          lineSpacingPt: 12
        }
      ]
    };

    const result = evaluateDocument(profile, snapshot);
    expect(result.findings.some((f) => f.ruleId === "BODY-SPACE-BEFORE" && f.severity === "suggestion")).toBe(true);
    expect(result.findings.some((f) => f.ruleId === "BODY-SPACE-AFTER" && f.severity === "suggestion")).toBe(true);
    expect(result.findings.some((f) => f.ruleId === "BODY-LINE-SPACING" && f.severity === "suggestion")).toBe(true);
  });

  it("does not apply body rules to HPC heading styles", () => {
    const profile = getProfile("HPC-ND30");
    const snapshot: DocumentSnapshot = {
      supportsPageSetup: false,
      paragraphs: [
        {
          index: 0,
          text: "1. Tiêu đề",
          style: "HPC.Heading1",
          fontName: "Arial",
          fontSize: 20,
          alignment: "Left"
        }
      ]
    };

    const result = evaluateDocument(profile, snapshot);
    expect(result.findings.some((f) => f.scope === "paragraph" && f.paragraphIndex === 0)).toBe(false);
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
