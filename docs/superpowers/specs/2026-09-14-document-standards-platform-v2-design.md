# Smart Document Assistant V2 — Document Standards Platform Design

## 1. Product Intent

V2 transforms the add-in from a formatting utility into a standards-driven document quality platform for Microsoft Word. The product must support administrative, academic, scientific, publishing, corporate, SOP, technical, and custom institutional documents without applying one global format to all files.

The core principle is: **determine the document context first, resolve the applicable standards second, validate third, fix only when safe, then run a preflight gate before release/submission/publication.**

## 2. Product Scope

### 2.1 Supported document families

- Vietnamese administrative documents: official letter, proposal, decision, notice, minutes, report, plan, invitation, authorization.
- Academic documents: assignment, essay, research proposal, undergraduate thesis, master's thesis, doctoral dissertation.
- Scientific publishing: journal manuscript, conference paper, technical paper.
- Publishing manuscripts: books, chapters, manuals, monographs, textbooks, eBook manuscripts.
- Corporate documents: proposals, reports, minutes, policies, procedures, memos, financial/technical reports.
- SOP / technical documentation: SOP, work instruction, policy, procedure, technical guideline, user manual.
- Custom institution/publisher profiles supplied by users.

### 2.2 Explicit non-goals

- Do not claim one universal format is correct for every document.
- Do not silently rewrite legal, academic, scientific, or business meaning.
- Do not fabricate missing citations, references, names, dates, document numbers, research data, authors, or signatories.
- Do not label a document legally compliant unless the active profile has verified source-backed rules covering the required scope.

## 3. Standards Resolution Model

Rules are resolved in the following precedence order:

1. Mandatory legal/regulatory rule.
2. Institution / university / publisher rule.
3. Document-type template rule.
4. Citation/editorial style rule.
5. Corporate house style.
6. User custom rule.
7. General typography/accessibility best practice.

A lower-priority rule may not override a mandatory higher-priority rule unless the profile explicitly marks the higher rule as non-applicable.

## 4. Standard Registry

Every rule must carry provenance and lifecycle metadata.

```ts
export interface StandardSource {
  id: string;
  title: string;
  issuer: string;
  sourceType: "law" | "institution" | "publisher" | "standard" | "style-guide" | "template" | "custom";
  url?: string;
  publicationDate?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  verifiedAt?: string;
}

export interface StandardRule<T = unknown> {
  id: string;
  title: string;
  category: RuleCategory;
  requirement: T;
  severity: "critical" | "warning" | "suggestion" | "info";
  fixPolicy: FixPolicy;
  sourceId: string;
  sourceLocator?: string;
  scope: RuleScope;
  enabled: boolean;
}
```

Each finding shown to the user must be able to answer:
- What is wrong?
- What should it be?
- Why is this a rule?
- Which source/profile introduced it?
- Can it be fixed automatically?

## 5. Profile Model

Profiles are composable and versioned.

Example hierarchy:

```text
VN-ND30
├── OfficialLetter
├── Proposal
├── Decision
├── Notice
└── Minutes

ACADEMIC
├── VN
│   ├── HCMUT
│   │   ├── Master
│   │   └── PhD
│   └── CustomUniversity
└── INTERNATIONAL
    ├── CustomUniversity
    └── PublisherTemplate

PUBLISHING
├── IEEE
├── CustomJournal
└── CustomBookPublisher

CORPORATE
└── HPC
    ├── Proposal
    ├── Report
    ├── Minutes
    └── SOP
```

Profiles may inherit from parent profiles and override only documented dimensions.

## 6. Document Classification

Classification runs before validation and returns ranked candidates instead of forcing one profile.

```ts
export interface DocumentClassification {
  language: string;
  family: DocumentFamily;
  type?: string;
  institution?: string;
  publisher?: string;
  citationStyle?: string;
  profileCandidates: Array<{ profileId: string; confidence: number }>;
  requiresConfirmation: boolean;
}
```

Auto-selection is allowed only when confidence is above a configurable threshold and no conflicting high-priority evidence exists. Otherwise the UI asks the user to confirm.

## 7. Semantic Document Model

V2 must inspect Word at section, block, paragraph, run, table, shape, field, footnote/endnote, header/footer, and reference levels.

Core semantic roles:

```text
DocumentTitle, Subtitle, Author, Organization, DocumentNumber,
Heading1..Heading9, Body, Quote, BlockQuote, Note, Warning,
TableTitle, Table, TableNote, Figure, FigureCaption,
Equation, EquationCaption, Signature, Recipient, ApprovalBlock,
Footnote, Endnote, References, Bibliography, Appendix, Index, Glossary
```

A rule must target semantic roles, not arbitrary paragraph positions.

## 8. Validation Engines

### 8.1 Layout Engine
- paper size and orientation;
- section-specific orientation;
- margins, gutter, mirrored margins;
- header/footer distances;
- columns;
- section breaks;
- different first page / odd-even headers;
- page numbering style, restart and suppression.

### 8.2 Typography Engine
- font family, size, weight, italic, underline, color, highlight;
- superscript/subscript, small caps, all caps;
- mixed formatting at run level;
- paragraph alignment and indent;
- spacing and tab stops;
- keep-with-next, keep-lines-together, widow/orphan where Word API permits;
- Unicode / legacy font detection.

### 8.3 Structure Engine
- semantic role recognition;
- required/optional sections;
- ordering;
- duplicate and empty sections;
- heading hierarchy;
- front matter/body/back matter;
- signature/recipient/approval blocks.

### 8.4 Numbering & Navigation Engine
- heading numbering;
- list semantics;
- appendix numbering;
- TOC consistency;
- cross-reference integrity.

### 8.5 Table/Figure/Equation Engine
- captions, numbering, placement, width and overflow;
- repeating table headers;
- row splitting policies;
- figure source/alt text/cross-reference;
- equation numbering and references.

### 8.6 Citation & Reference Engine
- support profile adapters for APA, IEEE, Chicago, ISO 690, Harvard, Vancouver, MLA and custom institutional styles;
- citation ↔ bibliography reconciliation;
- duplicate/unreferenced entries;
- sequence/order rules;
- required bibliographic fields;
- never invent missing bibliographic facts.

### 8.7 Text Quality Engine
- duplicate spaces, tabs and blank lines;
- punctuation spacing;
- quotes and bracket balance;
- dash/hyphen consistency;
- dates, times, units, percentages, currencies;
- abbreviation and terminology consistency;
- Vietnamese/English mixed terminology alerts.

### 8.8 Accessibility Engine
- semantic headings;
- heading hierarchy;
- real lists;
- image alt text;
- meaningful hyperlinks;
- table header structure;
- contrast checks where API/data allow.

### 8.9 Privacy & Release Hygiene Engine
- comments;
- tracked changes;
- hidden text;
- document metadata/properties;
- unresolved fields;
- broken links;
- stale TOC/cross-references;
- release-copy cleanliness.

## 9. Domain-Specific Engines

### 9.1 Vietnamese Administrative
Validate ND30-backed elements only when an ND30-based profile is active. Include document authority/name, national heading/slogan where applicable, number/symbol, place/date, document type/summary, body, signature, recipient, appendices, urgent/confidential markings, and layout rules.

### 9.2 Academic Thesis / Dissertation
Support institution-specific front matter, chapter structure, lists of tables/figures/abbreviations, abstracts, appendices, pagination transitions, citation/reference style, figure/table/equation rules and submission preflight.

### 9.3 Scientific Manuscript
Support title/authors/affiliations, abstract/keywords, journal or conference section requirements, declarations, funding/conflict/data availability, figures/tables/equations, template layout and reference style.

### 9.4 Publishing Manuscript
Support front matter, chapter/part hierarchy, notes, bibliography, glossary, credits, index markers, editorial queries and publisher profile overrides.

### 9.5 Corporate / SOP
Support organization identity, document ID/version/effective date, owner/reviewer/approver, confidentiality, revision history, purpose/scope/definitions/responsibilities/procedure/records/references/appendices.

## 10. Fix Safety Model

```ts
export type FixPolicy =
  | "auto-safe"
  | "auto-with-preview"
  | "review-required"
  | "never-auto-fix";
```

Examples:
- `auto-safe`: duplicate spaces, exact font/spacing correction, margins where profile is unambiguous.
- `auto-with-preview`: heading conversion, numbering conversion, table resizing.
- `review-required`: role classification ambiguity, abbreviation normalization, caption association.
- `never-auto-fix`: legal wording, research data, signer, document number, dates, authors, unverifiable references, conclusions.

## 11. Change Transactions

Every mutation is a transaction.

```ts
export interface ChangeTransaction {
  id: string;
  createdAt: string;
  profileId: string;
  ruleIds: string[];
  changes: ChangeRecord[];
  documentFingerprint: string;
  status: "applied" | "rolled-back" | "partially-rolled-back";
}
```

The UI exposes transaction history and supports rollback at change group/session level where structure guards confirm safety.

## 12. Scoring and Release Gate

The product must not rely on a single subtractive score.

Required category scores:
- Structure;
- Layout;
- Typography;
- Headings & Numbering;
- Tables/Figures/Equations;
- Citations & References;
- Accessibility;
- Language Consistency;
- Release Hygiene.

Release status is authoritative:

```text
BLOCKED         = at least one unresolved critical/blocking finding
REVIEW_REQUIRED = no blocker, but unresolved review-required finding exists
READY           = no blocker and no mandatory review remains
```

A 98% document may still be `BLOCKED`.

## 13. UI Information Architecture

Primary workflow:

```text
Open document
→ Detect/confirm profile
→ Scan
→ Review health dashboard
→ Fix all safe
→ Review preview-required changes
→ Re-scan
→ Preflight
→ READY / REVIEW REQUIRED / BLOCKED
```

Dashboard sections:
- document identity/profile;
- overall health;
- category health;
- blocker/review/safe counts;
- source-backed findings;
- fix preview;
- transaction history;
- release checklist.

Tool-specific actions such as TOC or table standardization become contextual actions inside relevant categories, not the primary navigation model.

## 14. Template Learning

Users may provide a trusted DOCX template. The analyzer extracts layout, styles, semantic heading patterns, numbering, captions, headers/footers and section behavior into a draft profile. The generated profile is always marked `unverified` until reviewed and saved.

## 15. Test Strategy

### 15.1 Unit tests
Each engine has pure rule-level tests with deterministic fixtures.

### 15.2 Profile tests
Each profile has expected valid/invalid snapshot fixtures.

### 15.3 DOCX corpus
Maintain a curated corpus by family:
- administrative valid/invalid;
- thesis valid/invalid;
- journal/conference valid/invalid;
- SOP/corporate valid/invalid;
- publishing valid/invalid;
- long documents, multilingual documents, table-heavy documents.

Each corpus case defines expected findings and prohibited false positives.

### 15.4 Word Desktop smoke tests
Before release, verify Scan → Navigate → Preview → Fix → Rollback → Re-scan → Preflight on supported Word Desktop environments.

## 16. Global Constraints

- Microsoft Word is the primary host.
- TypeScript/React/Office.js remain the main stack.
- No content-changing fix may be automatic without explicit rule-level approval.
- No fabricated content or bibliographic data.
- Every normative rule must expose provenance.
- Institution/publisher template rules override generic best practices where legally permissible.
- Profiles must be versioned and source-backed.
- Unsupported Word API capabilities must degrade with explicit user-facing explanations.
- Existing V1 behavior remains available during migration until its V2 replacement passes regression tests.

## 17. Success Criteria

V2 is successful when a user can open an arbitrary supported Word document, identify or confirm the applicable profile, receive source-backed findings by category, safely auto-fix deterministic presentation issues, review ambiguous fixes, re-scan, and receive a defensible preflight status for submission/release/publication without the tool changing document meaning.