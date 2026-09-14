import { describe, expect, it } from "vitest";
import { createSemanticDocumentSnapshot } from "../../word/documentModel";
import type { WordCapabilityMatrix } from "../../word/capabilities";

const capabilities: WordCapabilityMatrix = {
  wordApi11: true,
  lists: true,
  commentsFields: true,
  styles15: true,
  trackedChanges: true,
  uniqueParagraphIds: true,
  pageSetupDesktop: true,
  tocDesktop: true,
  ooxml: true,
  inlinePictures: true
};

describe("semantic document model", () => {
  it("preserves independent section layouts and computes release metadata", () => {
    const snapshot = createSemanticDocumentSnapshot({
      capabilities,
      sections: [
        { index: 0, pageSetup: { orientation: "Portrait", leftMarginPt: 85 } },
        { index: 1, pageSetup: { orientation: "Landscape", leftMarginPt: 56 } }
      ],
      paragraphs: [{ index: 0, text: "Title", semantic: { role: "title", confidence: 1, evidence: ["style:HPC.Title"] } }],
      tables: [{ index: 0, rowCount: 2, columnCount: 3 }],
      fields: [{ index: 0, type: "TOC", resultText: "Contents" }],
      inlinePictures: [{ index: 0, altTextTitle: "Architecture" }],
      comments: [{ id: "1", content: "Review" }],
      trackedChanges: [{ index: 0, type: "Inserted", text: "new" }],
      ooxml: "<w:document/>"
    });

    expect(snapshot.sections[0].pageSetup?.orientation).toBe("Portrait");
    expect(snapshot.sections[1].pageSetup?.orientation).toBe("Landscape");
    expect(snapshot.releaseMetadata).toEqual({
      commentsCount: 1,
      trackedChangesCount: 1,
      fieldCount: 1,
      inlinePictureCount: 1
    });
  });

  it("returns immutable top-level collections and cloned evidence", () => {
    const evidence = ["style:HPC.Title"];
    const snapshot = createSemanticDocumentSnapshot({
      capabilities,
      sections: [],
      paragraphs: [{ index: 0, text: "Title", semantic: { role: "title", confidence: 1, evidence } }],
      tables: [], fields: [], inlinePictures: [], comments: [], trackedChanges: []
    });

    evidence.push("mutated");
    expect(snapshot.paragraphs[0].semantic?.evidence).toEqual(["style:HPC.Title"]);
    expect(Object.isFrozen(snapshot.paragraphs)).toBe(true);
    expect(Object.isFrozen(snapshot.sections)).toBe(true);
  });
});
