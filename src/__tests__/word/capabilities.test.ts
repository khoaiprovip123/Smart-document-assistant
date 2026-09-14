import { describe, expect, it } from "vitest";
import { buildWordCapabilityMatrix } from "../../word/capabilities";

function supported(entries: string[]) {
  const set = new Set(entries);
  return (name: string, version: string) => set.has(`${name}@${version}`);
}

describe("Word capability matrix", () => {
  it("maps requirement sets to explicit capabilities", () => {
    const matrix = buildWordCapabilityMatrix(supported([
      "WordApi@1.1",
      "WordApi@1.3",
      "WordApi@1.4",
      "WordApi@1.5",
      "WordApi@1.6",
      "WordApiDesktop@1.3",
      "WordApiDesktop@1.4"
    ]));

    expect(matrix.wordApi11).toBe(true);
    expect(matrix.lists).toBe(true);
    expect(matrix.commentsFields).toBe(true);
    expect(matrix.styles15).toBe(true);
    expect(matrix.trackedChanges).toBe(true);
    expect(matrix.uniqueParagraphIds).toBe(true);
    expect(matrix.pageSetupDesktop).toBe(true);
    expect(matrix.tocDesktop).toBe(true);
    expect(matrix.ooxml).toBe(true);
    expect(matrix.inlinePictures).toBe(true);
  });

  it("does not invent unsupported capabilities", () => {
    const matrix = buildWordCapabilityMatrix(supported(["WordApi@1.1"]));
    expect(matrix.ooxml).toBe(true);
    expect(matrix.inlinePictures).toBe(true);
    expect(matrix.commentsFields).toBe(false);
    expect(matrix.trackedChanges).toBe(false);
    expect(matrix.pageSetupDesktop).toBe(false);
    expect(matrix.tocDesktop).toBe(false);
  });
});
