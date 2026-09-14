# V2 M2 Semantic Document Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task with TDD RED -> GREEN.

**Goal:** Build a capability-aware semantic Word snapshot that preserves sections, layout, paragraph evidence, tables, fields, pictures, comments, tracked changes and document-family signals without breaking the V1 snapshot.

**Architecture:** Introduce a separate V2 model under `src/word/` and a new Office.js adapter. The adapter checks requirement sets before every advanced API. V2 semantic roles carry confidence + evidence. Paragraph aggregate formatting remains distinct from exact run evidence; OOXML is retained as a fidelity source and must never be treated as an automatic mutation target.

**Spec:** `docs/superpowers/specs/2026-09-14-document-standards-platform-v2-design.md`

## Global Constraints

- Keep existing `DocumentSnapshot` and V1 `wordService.ts` operational during M2.
- Unsupported Word APIs return capability=false and empty optional collections, never fabricated data.
- Exact run-level claims require explicit run evidence; mixed paragraph formatting remains review-only when exact run evidence is unavailable.
- Semantic classification is advisory unless confidence/evidence meet the consuming rule's threshold.
- No content mutation is introduced in M2.
- All pure model/classifier functions are unit-tested before adapter code is added.

## File Map

```text
src/word/
  capabilities.ts            # requirement-set capability matrix
  documentModel.ts           # V2 snapshot contracts + immutable builder
  semanticClassifier.ts      # paragraph semantic role inference
  profileClassifier.ts       # ranked document-family candidates
  semanticWordService.ts     # Office.js read-only adapter
src/__tests__/word/
  capabilities.test.ts
  documentModel.test.ts
  semanticClassifier.test.ts
  profileClassifier.test.ts
```

---

### V2-DOC-001 — Capability Matrix

**Produces:**
```ts
export interface WordCapabilityMatrix {
  wordApi11: boolean;
  lists: boolean;
  commentsFields: boolean;
  styles15: boolean;
  trackedChanges: boolean;
  uniqueParagraphIds: boolean;
  pageSetupDesktop: boolean;
  tocDesktop: boolean;
  ooxml: boolean;
  inlinePictures: boolean;
}

export function buildWordCapabilityMatrix(
  isSupported: (setName: string, version: string) => boolean
): WordCapabilityMatrix;

export function detectCurrentWordCapabilities(): WordCapabilityMatrix;
```

**Acceptance:** deterministic pure matrix; WordApi 1.6 implies tracked changes/unique paragraph IDs, WordApi 1.4 implies comments/fields, WordApiDesktop 1.3 controls page setup, Desktop 1.4 controls TOC.

**TDD:** tests inject an `isSupported` function; production wrapper reads `Office.context.requirements.isSetSupported`.

---

### V2-DOC-002 — Immutable Semantic Snapshot Model

**Produces:**
```ts
export type SemanticRole =
  | "title" | "subtitle" | "heading" | "body" | "list"
  | "tableText" | "tableTitle" | "caption" | "signature" | "recipient"
  | "references" | "appendix" | "quote" | "note" | "unknown";

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

export interface FieldSnapshotV2 { index: number; type?: string; code?: string; resultText?: string; }
export interface PictureSnapshotV2 { index: number; altTextTitle?: string; altTextDescription?: string; hyperlink?: string; width?: number; height?: number; }
export interface CommentSnapshotV2 { id: string; content?: string; authorName?: string; resolved?: boolean; }
export interface TrackedChangeSnapshotV2 { index: number; type?: string; text?: string; author?: string; }
export interface TableSnapshotV2 { index: number; rowCount?: number; columnCount?: number; style?: string; headerRowCount?: number; }

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
```

**Acceptance:** builder deep-copies/freeze top-level collections and computes release counts; preserves multiple section layouts independently.

---

### V2-DOC-003 — Semantic Role Classifier V2

**Produces:**
```ts
export function classifySemanticParagraph(paragraph: ParagraphSnapshotV2): SemanticRoleInfoV2;
export function classifySemanticParagraphs(paragraphs: readonly ParagraphSnapshotV2[]): ParagraphSnapshotV2[];
```

**Evidence order:** explicit HPC/built-in style > list/table metadata > strong structural text marker > heuristic > fallback.

**Required cases:** Heading 1..9 and HPC.Heading1..4; Caption/HPC.Caption; inTable; `TÀI LIỆU THAM KHẢO`/`REFERENCES`; `PHỤ LỤC`/`APPENDIX`; `Nơi nhận:`; fallback body. Low-confidence heuristic never becomes an auto-fix permission by itself.

---

### V2-DOC-004 — Document Family/Profile Classifier

**Produces:**
```ts
export type DocumentFamily = "administrative" | "academic" | "scientific" | "publishing" | "corporate" | "sop" | "unknown";
export interface DocumentFamilyCandidate { family: DocumentFamily; score: number; evidence: readonly string[]; }
export interface DocumentFamilyClassification {
  candidates: readonly DocumentFamilyCandidate[];
  selected: DocumentFamily;
  selectedScore: number;
  requiresConfirmation: boolean;
}
export function classifyDocumentFamily(snapshot: SemanticDocumentSnapshot, confirmationThreshold?: number): DocumentFamilyClassification;
```

**Acceptance:** ranked deterministic candidates; threshold defaults 0.70; ties deterministic; low confidence returns `requiresConfirmation=true`; no profile is silently activated here.

---

### V2-DOC-005 — Read-only Office.js Semantic Adapter

**Produces:**
```ts
export async function readSemanticDocumentSnapshot(): Promise<SemanticDocumentSnapshot>;
```

**Read strategy:**
1. Verify Word host.
2. Build capability matrix.
3. Load body paragraphs/tables and section collection.
4. Load per-section page setup only when `pageSetupDesktop=true`.
5. Retain Body OOXML when `ooxml=true`.
6. Read inline pictures on supported base API.
7. Read fields/comments only when `commentsFields=true`.
8. Read tracked changes only when `trackedChanges=true`.
9. Load `uniqueLocalId` only when supported.
10. Convert Office proxies into plain immutable V2 snapshot; run semantic classification after proxy data is materialized.

**Safety:** no mutation, no forced unsupported loads, no invented values.

---

### V2-DOC-006 — M2 Integration/Regression Gate

Tests must prove:
- V1 `readDocumentSnapshot()` contract remains compilable.
- V2 snapshot supports different page setup per section.
- Capability=false paths produce empty optional data rather than errors in pure builders.
- Classifier evidence/confidence survives snapshot construction.
- Release metadata counts comments/tracked changes/fields/pictures exactly.

## M2 Verification

```bash
npx vitest run src/__tests__/word
npm run build
npm test
npm run validate:manifest
ADDIN_ORIGIN=https://addin.example.com npm run build:manifest
npm run validate:manifest:production
```

## M2 Exit Gate

M2 is complete only when the exact HEAD passes all commands above and the adapter is read-only/capability-aware. Word Desktop smoke validation remains a separate release qualification task and must not be inferred from unit/CI success.
