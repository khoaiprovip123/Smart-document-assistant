import { describe, expect, it } from "vitest";
import { getProfile } from "../config/rules";
import { getTableStandardizationConfig } from "../services/tableService";

describe("table standardization config", () => {
  it("keeps table placement separate from semantic cell alignment", () => {
    expect(getTableStandardizationConfig(getProfile("HPC-ND30"))).toEqual({
      fontName: "Times New Roman",
      fontSize: 12,
      headerRowCount: 1,
      tableAlignment: "Left",
      minimumSemanticConfidence: 0.75
    });
  });
});
