import { describe, expect, it } from "vitest";
import { getProfile } from "../config/rules";
import { getTableStandardizationConfig } from "../services/tableService";

describe("table standardization config", () => {
  it("derives safe table formatting without changing cell content", () => {
    expect(getTableStandardizationConfig(getProfile("HPC-ND30"))).toEqual({
      fontName: "Times New Roman",
      fontSize: 12,
      headerRowCount: 1,
      horizontalAlignment: "Left"
    });
  });
});
