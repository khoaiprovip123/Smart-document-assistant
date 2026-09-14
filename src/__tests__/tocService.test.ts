import { describe, expect, it } from "vitest";
import { getTocOptions } from "../services/tocService";

describe("TOC configuration", () => {
  it("uses heading levels 1-4 with page numbers", () => {
    expect(getTocOptions()).toEqual({
      upperHeadingLevel: 1,
      lowerHeadingLevel: 4,
      arePageNumbersIncluded: true,
      arePageNumbersRightAligned: true,
      areBuiltInHeadingStylesUsed: true,
      useOutlineLevels: true
    });
  });
});
