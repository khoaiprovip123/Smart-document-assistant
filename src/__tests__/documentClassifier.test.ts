import { describe, expect, it } from "vitest";
import { classifyParagraph } from "../rules/documentClassifier";
import type { ParagraphSnapshot } from "../types";

const paragraph = (overrides: Partial<ParagraphSnapshot>): ParagraphSnapshot => ({
  index: 0,
  text: "Nội dung",
  style: "Normal",
  ...overrides
});

describe("document classifier", () => {
  it("classifies explicit HPC heading styles with level", () => {
    expect(classifyParagraph(paragraph({ style: "HPC.Heading2", text: "2.1 Phạm vi" }))).toMatchObject({
      role: "heading",
      headingLevel: 2,
      confidence: "explicit"
    });
  });

  it("classifies semantic HPC styles without applying body rules", () => {
    expect(classifyParagraph(paragraph({ style: "HPC.Signature", text: "TỔNG GIÁM ĐỐC" }))).toMatchObject({
      role: "signature",
      confidence: "explicit"
    });
  });

  it("classifies Word list metadata as list", () => {
    expect(classifyParagraph(paragraph({ listLevel: 1, listString: "a)" }))).toMatchObject({
      role: "list",
      listLevel: 1
    });
  });

  it("uses body as the safe fallback for normal prose", () => {
    expect(classifyParagraph(paragraph({ text: "Đây là một đoạn nội dung thông thường." }))).toMatchObject({
      role: "body"
    });
  });
});
