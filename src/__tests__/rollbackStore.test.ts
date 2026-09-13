import { describe, expect, it } from "vitest";
import { assertRollbackSafe, hasSameDocumentStructure } from "../services/rollbackStore";
import type { DocumentSnapshot } from "../types";

function snapshot(texts: string[], fontName = "Times New Roman"): DocumentSnapshot {
  return {
    supportsPageSetup: false,
    paragraphs: texts.map((text, index) => ({
      index,
      text,
      fontName,
      fontSize: 13,
      alignment: "Justified"
    }))
  };
}

describe("rollback document structure guard", () => {
  it("accepts formatting-only changes when paragraph text/order is unchanged", () => {
    const before = snapshot(["Đoạn một", "Đoạn hai"], "Arial");
    const current = snapshot(["Đoạn một", "Đoạn hai"], "Times New Roman");

    expect(hasSameDocumentStructure(before, current)).toBe(true);
    expect(() => assertRollbackSafe(before, current)).not.toThrow();
  });

  it("rejects rollback after paragraph insertion or deletion", () => {
    const before = snapshot(["Đoạn một", "Đoạn hai"]);
    const current = snapshot(["Đoạn mới", "Đoạn một", "Đoạn hai"]);

    expect(hasSameDocumentStructure(before, current)).toBe(false);
    expect(() => assertRollbackSafe(before, current)).toThrow(/thay đổi/i);
  });

  it("rejects rollback after paragraph text changes", () => {
    const before = snapshot(["Đoạn một", "Đoạn hai"]);
    const current = snapshot(["Đoạn một đã sửa", "Đoạn hai"]);

    expect(hasSameDocumentStructure(before, current)).toBe(false);
    expect(() => assertRollbackSafe(before, current)).toThrow(/thay đổi/i);
  });
});
