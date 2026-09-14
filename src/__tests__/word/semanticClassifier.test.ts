import { describe, expect, it } from "vitest";
import { classifySemanticParagraph, classifySemanticParagraphs } from "../../word/semanticClassifier";
import type { ParagraphSnapshotV2 } from "../../word/documentModel";

const paragraph = (overrides: Partial<ParagraphSnapshotV2>): ParagraphSnapshotV2 => ({
  index: 0,
  text: "Nội dung",
  ...overrides
});

describe("semantic paragraph classifier", () => {
  it("recognizes explicit heading styles with maximum confidence", () => {
    const result = classifySemanticParagraph(paragraph({ style: "Heading 2" }));
    expect(result.role).toBe("heading");
    expect(result.headingLevel).toBe(2);
    expect(result.confidence).toBe(1);
    expect(result.evidence).toContain("style:Heading 2");
  });

  it("recognizes semantic and structural roles", () => {
    expect(classifySemanticParagraph(paragraph({ style: "HPC.Caption" })).role).toBe("caption");
    expect(classifySemanticParagraph(paragraph({ inTable: true })).role).toBe("tableText");
    expect(classifySemanticParagraph(paragraph({ text: "TÀI LIỆU THAM KHẢO" })).role).toBe("references");
    expect(classifySemanticParagraph(paragraph({ text: "PHỤ LỤC A" })).role).toBe("appendix");
    expect(classifySemanticParagraph(paragraph({ text: "Nơi nhận:" })).role).toBe("recipient");
  });

  it("falls back to body with explicit low-confidence evidence", () => {
    const result = classifySemanticParagraph(paragraph({ text: "Một đoạn văn thông thường." }));
    expect(result.role).toBe("body");
    expect(result.confidence).toBeLessThan(0.7);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it("classifies a collection without mutating the inputs", () => {
    const input = [paragraph({ style: "HPC.Title" }), paragraph({ text: "Body" })];
    const result = classifySemanticParagraphs(input);
    expect(result[0].semantic?.role).toBe("title");
    expect(input[0].semantic).toBeUndefined();
  });
});
