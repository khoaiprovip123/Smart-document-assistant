import { describe, expect, it } from "vitest";
import { evaluateTables } from "../../quality/engines/tableEngine";
import { evaluateTextHygiene } from "../../quality/engines/textHygieneEngine";
import { evaluateReleaseHygiene } from "../../quality/engines/releaseHygieneEngine";
import { qualityContext, snapshot } from "./helpers";

describe("table, text and release hygiene engines", () => {
  it("reports a table without a required header row", () => {
    const context = qualityContext(snapshot({
      tables: [{ index: 0, rowCount: 3, columnCount: 2, headerRowCount: 0 }]
    }), [{ kind: "table-require-header-row" }]);
    const findings = evaluateTables(context);
    expect(findings).toHaveLength(1);
    expect(findings[0].location?.tableIndex).toBe(0);
  });

  it("does not guess when table header observability is unknown", () => {
    const context = qualityContext(snapshot({ tables: [{ index: 0, rowCount: 2 }] }), [
      { kind: "table-require-header-row" }
    ]);
    expect(evaluateTables(context)).toEqual([]);
  });

  it("reports double spaces and punctuation spacing", () => {
    const context = qualityContext(snapshot({
      paragraphs: [{ index: 0, text: "Nội dung  bị lỗi ,và tiếp tục.", semantic: { role: "body", confidence: 1, evidence: ["test"] } }]
    }), [
      { kind: "text-no-double-spaces" },
      { kind: "text-punctuation-spacing" }
    ]);
    const findings = evaluateTextHygiene(context);
    expect(findings.map((finding) => finding.ruleId)).toEqual(["TEST-RULE-1", "TEST-RULE-2"]);
  });

  it("reports comments and tracked changes using exact release metadata", () => {
    const context = qualityContext(snapshot({
      comments: [{ id: "c1", content: "check" }],
      trackedChanges: [{ index: 0, type: "Inserted", text: "new" }]
    }), [
      { kind: "release-no-comments" },
      { kind: "release-no-tracked-changes" }
    ]);
    const findings = evaluateReleaseHygiene(context);
    expect(findings).toHaveLength(2);
    expect(findings.some((finding) => finding.current === 1 && finding.ruleId === "TEST-RULE-1")).toBe(true);
    expect(findings.some((finding) => finding.current === 1 && finding.ruleId === "TEST-RULE-2")).toBe(true);
  });
});
