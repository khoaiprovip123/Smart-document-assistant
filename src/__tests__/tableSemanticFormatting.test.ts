import { describe, expect, it } from "vitest";
import { buildSemanticTablePlan, inferColumnAlignment } from "../services/tableSemanticFormatting";


describe("semantic table formatting", () => {
  it("aligns common business columns by meaning instead of forcing one alignment for the whole table", () => {
    const plan = buildSemanticTablePlan([
      ["STT", "Tên thiết bị", "SL", "Đơn giá", "Thành tiền", "Ghi chú"],
      ["1", "Laptop Dell Latitude", "5", "25.000.000", "125.000.000", "Cấp cho kỹ thuật"],
      ["2", "Màn hình 27 inch", "3", "6.500.000", "19.500.000", "Phòng họp"]
    ]);

    expect(plan.columns.map((column) => column.bodyAlignment)).toEqual([
      "Centered",
      "Left",
      "Right",
      "Right",
      "Right",
      "Left"
    ]);
    expect(plan.columns[0].headerAlignment).toBe("Centered");
    expect(plan.columns[5].headerAlignment).toBe("Left");
    expect(plan.columns.every((column) => column.confidence >= 0.75)).toBe(true);
  });

  it("preserves ambiguous mixed-content columns instead of guessing", () => {
    const decision = inferColumnAlignment("Thông tin", ["ABC", "125.000", "Đã duyệt", "Ghi chú dài"]);

    expect(decision.bodyAlignment).toBe("Preserve");
    expect(decision.confidence).toBeLessThan(0.75);
  });
});
