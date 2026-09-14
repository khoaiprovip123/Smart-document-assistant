import type { WordCapabilityMatrix } from "./capabilities";

export type SemanticRole =
  | "title"
  | "subtitle"
  | "heading"
  | "body"
  | "list"
  | "tableText"
  | "tableTitle"
  | "caption"
  | "signature"
  | "recipient"
  | "references"
  | "appendix"
  | "quote"
  | "note"
  | "unknown";

export interface SemanticRoleInfoV2 {
  role: SemanticRole;
  confidence: number;
  evidence: readonly string[];
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

export interface SectionSnapshotV2 {
  index: number;
  pageSetup?: {
    paperSize?: string;
    orientation?: string;
    topMarginPt?: number;
    bottomMarginPt?: number;
    leftMarginPt?: number;
    rightMarginPt?: number;
    gutterPt?: number;
    sectionStart?: string;
    differentFirstPageHeaderFooter?: boolean;
    oddAndEvenPagesHeaderFooter?: boolean;
  };
  headerText?: string;
  footerText?: string;
}

export interface RunEvidenceSnapshot {
  index: number;
  text: string;
  fontName?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: string;
  color?: string;
  source: "ooxml" | "range-derived";
}

export interface ParagraphSnapshotV2 {
  index: number;
  text: string;
  style?: string;
  uniqueLocalId?: string;
  fontName?: string;
  fontSize?: number;
  alignment?: string;
  firstLineIndentPt?: number;
  spaceBeforePt?: number;
  spaceAfterPt?: number;
  lineSpacingPt?: number;
  listLevel?: number;
  listString?: string;
  inTable?: boolean;
  runs?: readonly RunEvidenceSnapshot[];
  semantic?: SemanticRoleInfoV2;
}

export interface FieldSnapshotV2 {
  index: number;
  type?: string;
  code?: string;
  resultText?: string;
}

export interface PictureSnapshotV2 {
  index: number;
  altTextTitle?: string;
  altTextDescription?: string;
  hyperlink?: string;
  width?: number;
  height?: number;
}

export interface CommentSnapshotV2 {
  id: string;
  content?: string;
  authorName?: string;
  resolved?: boolean;
}

export interface TrackedChangeSnapshotV2 {
  index: number;
  type?: string;
  text?: string;
  author?: string;
}

export interface TableSnapshotV2 {
  index: number;
  rowCount?: number;
  columnCount?: number;
  style?: string;
  headerRowCount?: number;
}

export interface SemanticDocumentSnapshot {
  capabilities: WordCapabilityMatrix;
  sections: readonly SectionSnapshotV2[];
  paragraphs: readonly ParagraphSnapshotV2[];
  tables: readonly TableSnapshotV2[];
  fields: readonly FieldSnapshotV2[];
  inlinePictures: readonly PictureSnapshotV2[];
  comments: readonly CommentSnapshotV2[];
  trackedChanges: readonly TrackedChangeSnapshotV2[];
  ooxml?: string;
  releaseMetadata: {
    commentsCount: number;
    trackedChangesCount: number;
    fieldCount: number;
    inlinePictureCount: number;
  };
}

export type SemanticDocumentSnapshotInput = Omit<SemanticDocumentSnapshot, "releaseMetadata">;

const frozenArray = <T>(items: readonly T[], clone: (value: T) => T): readonly T[] =>
  Object.freeze(items.map((item) => Object.freeze(clone(item))));

function cloneSemantic(value?: SemanticRoleInfoV2): SemanticRoleInfoV2 | undefined {
  if (!value) return undefined;
  return Object.freeze({ ...value, evidence: Object.freeze([...value.evidence]) });
}

export function createSemanticDocumentSnapshot(input: SemanticDocumentSnapshotInput): SemanticDocumentSnapshot {
  const sections = frozenArray(input.sections, (section) => ({
    ...section,
    pageSetup: section.pageSetup ? Object.freeze({ ...section.pageSetup }) : undefined
  }));
  const paragraphs = frozenArray(input.paragraphs, (paragraph) => ({
    ...paragraph,
    runs: paragraph.runs ? frozenArray(paragraph.runs, (run) => ({ ...run })) : undefined,
    semantic: cloneSemantic(paragraph.semantic)
  }));
  const tables = frozenArray(input.tables, (table) => ({ ...table }));
  const fields = frozenArray(input.fields, (field) => ({ ...field }));
  const inlinePictures = frozenArray(input.inlinePictures, (picture) => ({ ...picture }));
  const comments = frozenArray(input.comments, (comment) => ({ ...comment }));
  const trackedChanges = frozenArray(input.trackedChanges, (change) => ({ ...change }));

  return Object.freeze({
    capabilities: Object.freeze({ ...input.capabilities }),
    sections,
    paragraphs,
    tables,
    fields,
    inlinePictures,
    comments,
    trackedChanges,
    ooxml: input.ooxml,
    releaseMetadata: Object.freeze({
      commentsCount: comments.length,
      trackedChangesCount: trackedChanges.length,
      fieldCount: fields.length,
      inlinePictureCount: inlinePictures.length
    })
  });
}
