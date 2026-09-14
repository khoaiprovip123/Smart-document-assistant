import { describe, expect, it } from "vitest";
import { getHeadingNumberingLevels } from "../services/headingNumberingService";

describe("heading numbering configuration", () => {
  it("builds hierarchical arabic numbering for four heading levels", () => {
    expect(getHeadingNumberingLevels()).toEqual([
      { level: 0, format: [0] },
      { level: 1, format: [0, ".", 1] },
      { level: 2, format: [0, ".", 1, ".", 2] },
      { level: 3, format: [0, ".", 1, ".", 2, ".", 3] }
    ]);
  });
});
