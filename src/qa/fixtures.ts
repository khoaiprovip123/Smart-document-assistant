import { buildWordCapabilityMatrix } from "../word/capabilities";
import { createSemanticDocumentSnapshot, type SemanticDocumentSnapshot } from "../word/documentModel";

export type P0EngineFixtureKind =
  | "layout"
  | "typography"
  | "structure"
  | "heading-numbering"
  | "table"
  | "text-hygiene"
  | "release-hygiene";

export interface EngineSnapshotFixture {
  id: string;
  engine: P0EngineFixtureKind;
  description: string;
  snapshot: SemanticDocumentSnapshot;
}

const capabilities = buildWordCapabilityMatrix(() => true);

function baseSnapshot(overrides: Partial<Parameters<typeof createSemanticDocumentSnapshot>[0]> = {}): SemanticDocumentSnapshot {
  return createSemanticDocumentSnapshot({
    capabilities,
    sections: [{ index: 0, pageSetup: { paperSize: "A4", topMarginPt: 56.7, bottomMarginPt: 56.7, leftMarginPt: 85.05, rightMarginPt: 56.7 } }],
    paragraphs: [{
      index: 0,
      text: "Nội dung chuẩn",
      fontName: "Times New Roman",
      fontSize: 13,
      alignment: "Justified",
      semantic: { role: "body", confidence: 1, evidence: ["fixture"] }
    }],
    tables: [],
    fields: [],
    inlinePictures: [],
    comments: [],
    trackedChanges: [],
    ...overrides
  });
}

const fixtures: readonly EngineSnapshotFixture[] = Object.freeze([
  Object.freeze({
    id: "layout-invalid-paper-margin",
    engine: "layout" as const,
    description: "A3 section with out-of-range margins for layout engine tests.",
    snapshot: baseSnapshot({
      sections: [{ index: 0, pageSetup: { paperSize: "A3", topMarginPt: 20, bottomMarginPt: 20, leftMarginPt: 20, rightMarginPt: 20 } }]
    })
  }),
  Object.freeze({
    id: "typography-invalid-body",
    engine: "typography" as const,
    description: "Body paragraph with non-baseline font, size and alignment.",
    snapshot: baseSnapshot({
      paragraphs: [{
        index: 0,
        text: "Typography fixture",
        fontName: "Arial",
        fontSize: 11,
        alignment: "Left",
        semantic: { role: "body", confidence: 1, evidence: ["fixture"] }
      }]
    })
  }),
  Object.freeze({
    id: "structure-missing-required-heading",
    engine: "structure" as const,
    description: "Body-only document used with a required-heading rule.",
    snapshot: baseSnapshot()
  }),
  Object.freeze({
    id: "heading-level-jump",
    engine: "heading-numbering" as const,
    description: "Heading hierarchy jumps from level 1 to level 3.",
    snapshot: baseSnapshot({
      paragraphs: [
        { index: 0, text: "1. Heading", style: "Heading1", listLevel: 0, listString: "1.", semantic: { role: "heading", headingLevel: 1, confidence: 1, evidence: ["fixture"] } },
        { index: 1, text: "1.1.1 Deep", style: "Heading3", listLevel: 2, listString: "1.1.1", semantic: { role: "heading", headingLevel: 3, confidence: 1, evidence: ["fixture"] } }
      ]
    })
  }),
  Object.freeze({
    id: "table-without-header-row",
    engine: "table" as const,
    description: "Simple table without declared header rows.",
    snapshot: baseSnapshot({ tables: [{ index: 0, rowCount: 3, columnCount: 2, headerRowCount: 0 }] })
  }),
  Object.freeze({
    id: "text-hygiene-spacing",
    engine: "text-hygiene" as const,
    description: "Paragraph includes double spaces and punctuation spacing issue.",
    snapshot: baseSnapshot({
      paragraphs: [{ index: 0, text: "Nội dung  có khoảng trắng ,sai.", semantic: { role: "body", confidence: 1, evidence: ["fixture"] } }]
    })
  }),
  Object.freeze({
    id: "release-hygiene-comments-revisions",
    engine: "release-hygiene" as const,
    description: "Document has an unresolved comment and tracked change.",
    snapshot: baseSnapshot({
      comments: [{ id: "c1", content: "Review", resolved: false }],
      trackedChanges: [{ index: 0, type: "Inserted", text: "draft" }]
    })
  })
]);

export function getEngineFixtureLibrary(): readonly EngineSnapshotFixture[] {
  return fixtures;
}
