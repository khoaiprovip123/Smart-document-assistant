# Document Standards Platform V2 Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standards-driven Word document quality platform covering administrative, academic, scientific, publishing, corporate, SOP and custom documents with source-backed validation, safe fixes and preflight release gates.

**Architecture:** Keep the current V1 Office.js core as a compatibility layer while introducing a versioned standards registry, semantic document model and independent validation engines. Domain profiles compose rules through precedence resolution; findings retain provenance and fix policy. Mutation is transaction-based and preflight status is determined by unresolved blockers/review items, not score alone.

**Tech Stack:** TypeScript, React 19, Office.js / Word JavaScript API, Fluent UI, Vite, Vitest, JSON profile bundles.

**Spec:** `docs/superpowers/specs/2026-09-14-document-standards-platform-v2-design.md`

## Global Constraints

- Microsoft Word is the primary host.
- No content-changing fix may be automatic without explicit rule-level approval.
- No fabricated content or bibliographic data.
- Every normative rule must expose provenance.
- Institution/publisher rules override generic best practices where legally permissible.
- Profiles must be versioned and source-backed.
- Unsupported Word API capabilities must degrade with explicit user-facing explanations.
- Existing V1 behavior remains available during migration until its V2 replacement passes regression tests.

---

## Delivery Model

The V2 scope contains multiple independent subsystems, so implementation is split into six milestones. Each milestone produces working, testable software and has its own release gate.

| Milestone | Priority | Outcome |
|---|---|---|
| M1 Standards Foundation | P0 | Versioned standards/profile registry + provenance + precedence |
| M2 Semantic Document Model | P0 | Section/block/run/table/field-aware snapshot + semantic roles |
| M3 Core Quality Engines | P0 | Layout/typography/structure/numbering/table/text-quality engines |
| M4 Domain Engines | P1 | Administrative/academic/scientific/publishing/corporate/SOP profiles |
| M5 Safe Fix & Preflight | P0 | Transaction history, preview, rollback, health dashboard, release gate |
| M6 Template Learning & QA Corpus | P1 | Template-to-profile draft flow + DOCX corpus + release qualification |

## Work Item Registry

### M1 — Standards Foundation

#### V2-STD-001 — Standard source registry
**Priority:** P0  
**Depends on:** none  
**Files:**
- Create `src/standards/types.ts`
- Create `src/standards/sourceRegistry.ts`
- Test `src/__tests__/standards/sourceRegistry.test.ts`

**Acceptance criteria:**
- Sources have stable IDs, issuer, type, lifecycle dates, URL and verification timestamp.
- Duplicate source IDs are rejected.
- Expired sources remain readable but are marked inactive.

**Key test cases:** duplicate ID rejected; active-at-date selection; expired source status.

#### V2-STD-002 — Standard rule schema
**Priority:** P0  
**Depends on:** V2-STD-001  
**Files:** `src/standards/types.ts`, `src/standards/ruleRegistry.ts`, tests.

**Acceptance criteria:** every rule requires category, severity, fix policy, source ID and scope; orphan source IDs fail validation.

#### V2-STD-003 — Versioned profile schema
**Priority:** P0  
**Depends on:** V2-STD-002  
**Files:** `src/profiles/types.ts`, `src/profiles/profileRegistry.ts`, tests.

**Acceptance criteria:** profile ID/version unique; lifecycle dates supported; parent profile supported; circular inheritance rejected.

#### V2-STD-004 — Rule precedence resolver
**Priority:** P0  
**Depends on:** V2-STD-003  
**Files:** `src/profiles/resolveProfile.ts`, tests.

**Acceptance criteria:** legal > institution/publisher > document template > citation/editorial > house style > custom > generic; conflicts produce deterministic resolution trace.

#### V2-STD-005 — Provenance on findings
**Priority:** P0  
**Depends on:** V2-STD-004  
**Files:** modify `src/types.ts`, `src/rules/ruleEngine.ts`, findings UI, tests.

**Acceptance criteria:** every normative finding contains source ID, profile ID/version, locator and rule ID; UI exposes “Why this rule?”.

#### V2-STD-006 — JSON profile validator/importer V2
**Priority:** P1  
**Depends on:** V2-STD-003  
**Acceptance criteria:** imported profile validates schema, references known sources or embeds allowed custom source metadata, and is marked `verified` or `unverified` explicitly.

### M2 — Semantic Document Model

#### V2-DOC-001 — Capability matrix
**Priority:** P0  
**Depends on:** none

Create `src/word/capabilities.ts` with named capability checks for page setup, lists, TOC, fields, comments, revisions, headers/footers and advanced APIs.

**Acceptance:** no engine accesses unsupported API without capability check; unsupported features return explicit diagnostic objects.

#### V2-DOC-002 — Section-aware snapshot
**Priority:** P0  
**Depends on:** V2-DOC-001

Extend snapshot to include sections, page setup per section, headers/footers, page-number metadata when available.

**Tests:** multiple sections; landscape section; different-first-page; unsupported API degradation.

#### V2-DOC-003 — Run-level typography snapshot
**Priority:** P0  
**Depends on:** V2-DOC-001

Capture runs/ranges required to distinguish mixed font/size/style within a paragraph.

**Acceptance:** mixed formatting becomes addressable without flattening paragraph content.

#### V2-DOC-004 — Table/shape/field snapshot
**Priority:** P0  
**Depends on:** V2-DOC-001

Capture tables, captions candidates, inline shapes, fields, hyperlinks and accessible metadata available through Word API.

#### V2-DOC-005 — Comments/revisions/release metadata snapshot
**Priority:** P1  
**Depends on:** V2-DOC-001

Capture comments, tracked-change state or detectable revision indicators, document properties and hidden-text signals where API allows.

#### V2-DOC-006 — Semantic role classifier V2
**Priority:** P0  
**Depends on:** V2-DOC-002/003/004

Create role inference with confidence/evidence for Title, Heading, Body, TableTitle, Caption, Signature, Recipient, References, Appendix, etc.

**Acceptance:** classifier never silently promotes low-confidence role to destructive fix; confidence/evidence exposed.

#### V2-DOC-007 — Document family/profile classifier
**Priority:** P1  
**Depends on:** V2-DOC-006, V2-STD-004

Return ranked profile candidates and require user confirmation below confidence threshold.

### M3 — Core Quality Engines

#### V2-ENG-001 — Layout engine
**Priority:** P0  
**Depends on:** V2-DOC-002, V2-STD-004

Validate paper size, orientation, margins, gutter/mirroring where supported, header/footer distance, section breaks and pagination profile rules.

**Acceptance:** section-scoped findings point to section and source rule; no global fix overwrites intentionally different landscape sections.

#### V2-ENG-002 — Typography engine
**Priority:** P0  
**Depends on:** V2-DOC-003

Validate run-level fonts/sizes/styles, alignment, indents, line/paragraph spacing, tabs and mixed-format cases.

#### V2-ENG-003 — Structure engine
**Priority:** P0  
**Depends on:** V2-DOC-006

Validate required/optional sections, order, duplicates, empties and semantic hierarchy.

#### V2-ENG-004 — Heading/numbering engine
**Priority:** P0  
**Depends on:** V2-ENG-003

Validate semantic heading usage, level jumps, numbering scheme, manual-number detection and appendix numbering.

#### V2-ENG-005 — TOC/cross-reference engine
**Priority:** P1  
**Depends on:** V2-ENG-004, V2-DOC-004

Detect stale/missing TOC relationships and broken cross-reference candidates without rewriting content.

#### V2-ENG-006 — Table engine
**Priority:** P0  
**Depends on:** V2-DOC-004

Validate table title/caption/header rows, width, alignment, typography, row splitting and source/note conventions per profile.

#### V2-ENG-007 — Figure/equation engine
**Priority:** P1  
**Depends on:** V2-DOC-004

Validate captions, numbering, alt text/source, equation numbering and cross-reference consistency.

#### V2-ENG-008 — Text hygiene engine
**Priority:** P0  
**Depends on:** V2-DOC-003

Detect double spaces, tabs, blank paragraph sequences, punctuation spacing, quote/bracket imbalance, dash/hyphen inconsistency, unit/date/time/currency formatting.

#### V2-ENG-009 — Terminology/abbreviation consistency
**Priority:** P1  
**Depends on:** V2-ENG-008

Cluster equivalent variants and flag inconsistent terms/abbreviations. All normalization proposals are review-required.

#### V2-ENG-010 — Accessibility engine
**Priority:** P1  
**Depends on:** V2-DOC-004, V2-DOC-006

Validate semantic headings/lists, alt text, hyperlink labels and table-header structure where observable.

#### V2-ENG-011 — Privacy/release-hygiene engine
**Priority:** P0  
**Depends on:** V2-DOC-005

Flag comments, tracked changes/revision state, hidden text, unresolved fields, document metadata and broken-link candidates.

#### V2-ENG-012 — Citation/reference reconciliation core
**Priority:** P1  
**Depends on:** V2-DOC-006

Build neutral citation/reference model and reconcile in-text citations with bibliography entries. Never synthesize missing bibliographic facts.

### M4 — Domain Engines & Profiles

#### V2-DOM-001 — Vietnamese administrative profile pack
**Priority:** P0  
**Depends on:** M1, V2-ENG-001/002/003/004/006

Create source-backed ND30 profile family. Cover only verified requirements and display coverage scope explicitly.

**Acceptance:** profile never claims full ND30 compliance for rules not implemented/verified.

#### V2-DOM-002 — HPC corporate profile pack
**Priority:** P0  
**Depends on:** M1, core engines

Profiles: proposal, report, minutes, memo, guideline. Separate internal branding rules from public/legal rules.

#### V2-DOM-003 — SOP/Policy profile pack
**Priority:** P0  
**Depends on:** V2-ENG-003

Validate metadata and purpose/scope/definitions/responsibilities/procedure/records/references/appendices/revision-history with configurable required sections.

#### V2-DOM-004 — Academic base profile
**Priority:** P0  
**Depends on:** M1, M3

Provide neutral thesis/dissertation schema with front matter/body/back matter capabilities but no institution-specific fixed margins/font unless sourced.

#### V2-DOM-005 — Institution profile adapters
**Priority:** P1  
**Depends on:** V2-DOM-004

Start with one verified Vietnamese university profile and one configurable international university profile. Add more profiles only with source-backed requirements.

#### V2-DOM-006 — Scientific manuscript base profile
**Priority:** P1  
**Depends on:** M3

Support title/authors/affiliations/abstract/keywords/declarations/funding/conflict/data availability + figures/tables/equations.

#### V2-DOM-007 — IEEE-style adapter
**Priority:** P1  
**Depends on:** V2-DOM-006, V2-ENG-012

Validate template-bound structure and numbered citation/reference consistency without claiming compatibility with every IEEE publication.

#### V2-DOM-008 — Publishing manuscript base profile
**Priority:** P1  
**Depends on:** M3

Support front matter, part/chapter/section hierarchy, notes, bibliography, glossary, credits/index markers and publisher overrides.

#### V2-DOM-009 — Citation style adapters
**Priority:** P1/P2  
**Depends on:** V2-ENG-012

Implement adapters incrementally: IEEE first, APA second, then Chicago/ISO 690/Harvard/Vancouver/MLA as separate reviewed work items.

### M5 — Safe Fix, Transactions, Dashboard & Preflight

#### V2-FIX-001 — Fix policy enforcement
**Priority:** P0  
**Depends on:** V2-STD-002

All fixes must declare `auto-safe`, `auto-with-preview`, `review-required`, or `never-auto-fix` and mutation APIs reject missing policy.

#### V2-FIX-002 — Change transaction store
**Priority:** P0  
**Depends on:** V2-FIX-001

Replace single snapshot model with transaction/session history, document fingerprint and grouped change records.

#### V2-FIX-003 — Structure-safe rollback V2
**Priority:** P0  
**Depends on:** V2-FIX-002

Rollback checks document fingerprint/target identity and refuses unsafe rollback with clear explanation.

#### V2-FIX-004 — Fix preview
**Priority:** P0  
**Depends on:** V2-FIX-001

Show before/after formatting/structure delta for preview-required changes; user approves specific change or group.

#### V2-FIX-005 — Fix All Safe
**Priority:** P0  
**Depends on:** V2-FIX-001/002

Apply only auto-safe findings in one transaction, then automatically re-scan.

#### V2-UI-001 — Document identity/profile panel
**Priority:** P0  
**Depends on:** V2-DOC-007

Show detected family, institution/publisher/profile/version and confirmation state.

#### V2-UI-002 — Health dashboard
**Priority:** P0  
**Depends on:** core engines

Show category health separately from blocker/review/safe counts.

#### V2-UI-003 — Source-backed finding detail
**Priority:** P0  
**Depends on:** V2-STD-005

Finding drawer shows rule, expected/current, source, source locator, fix policy and navigation.

#### V2-UI-004 — Transaction history
**Priority:** P1  
**Depends on:** V2-FIX-002/003

Show sessions, applied groups and rollback eligibility.

#### V2-PREF-001 — Preflight status engine
**Priority:** P0  
**Depends on:** all P0 core engines

`BLOCKED` if unresolved critical/blocker; `REVIEW_REQUIRED` if no blocker but mandatory review remains; otherwise `READY`.

#### V2-PREF-002 — Release checklist
**Priority:** P0  
**Depends on:** V2-PREF-001, V2-ENG-011

Show exact unresolved release blockers, comments/revisions/metadata hygiene and stale fields before export/submission.

#### V2-PREF-003 — Audit report
**Priority:** P1  
**Depends on:** V2-PREF-001

Generate inspectable summary: document/profile versions, scan timestamp, category scores, resolved/unresolved findings and source IDs.

### M6 — Template Learning & QA Corpus

#### V2-TPL-001 — Trusted template analyzer
**Priority:** P1  
**Depends on:** M2

Analyze a trusted DOCX for section/page setup, styles, semantic heading patterns, numbering, captions and headers/footers.

#### V2-TPL-002 — Draft profile generator
**Priority:** P1  
**Depends on:** V2-TPL-001, V2-STD-003

Generate an `unverified` profile draft with extracted evidence and confidence; never auto-mark verified.

#### V2-TPL-003 — Profile review UI
**Priority:** P1  
**Depends on:** V2-TPL-002

Allow users/admins to accept/reject/edit learned rules before saving.

#### V2-QA-001 — Snapshot fixture library
**Priority:** P0  
**Depends on:** M2

Create deterministic TypeScript fixtures for each engine before DOCX corpus automation.

#### V2-QA-002 — DOCX corpus manifest
**Priority:** P0  
**Depends on:** V2-QA-001

Define corpus metadata schema: family/profile, source/license, expected findings, forbidden false positives, manual-smoke notes.

#### V2-QA-003 — Administrative corpus
**Priority:** P1  
**Depends on:** V2-DOM-001, V2-QA-002

At least valid/invalid representative documents with expected findings.

#### V2-QA-004 — Academic corpus
**Priority:** P1  
**Depends on:** V2-DOM-004/005, V2-QA-002

Include front-matter pagination, hierarchy, table/figure and reference cases.

#### V2-QA-005 — Corporate/SOP corpus
**Priority:** P1  
**Depends on:** V2-DOM-002/003, V2-QA-002

Include metadata/revision-history/structure cases.

#### V2-QA-006 — Long-document performance suite
**Priority:** P1  
**Depends on:** core engines

Measure scan/fix responsiveness on 100-page and 300-page synthetic/authorized documents; record thresholds before declaring performance target.

#### V2-QA-007 — Word Desktop release matrix
**Priority:** P0  
**Depends on:** P0 feature completion

Manual smoke checklist: open → classify/profile → scan → navigate → preview → fix safe → rollback → re-scan → preflight on supported Word Desktop environments.

---

## Detailed TDD Execution Pattern

Every implementation work item follows this sequence:

- [ ] Write focused failing test for one acceptance criterion.
- [ ] Run only that test and confirm failure is caused by missing/incorrect behavior.
- [ ] Implement the smallest production change.
- [ ] Re-run focused test until green.
- [ ] Run affected suite.
- [ ] Run `npm run build`.
- [ ] Run `npm test`.
- [ ] Run development manifest validation.
- [ ] If packaging changed, generate and validate production manifest.
- [ ] Update `CHANGELOG.md` and relevant profile/source documentation.
- [ ] Commit with one coherent feature/fix message.

## Release Gates

### Gate G1 — Foundation
Must pass V2-STD-001..005, V2-DOC-001..006, V2-QA-001.

### Gate G2 — General Document Quality
Must pass P0 core engines: layout, typography, structure, heading/numbering, table, text hygiene, plus source-backed findings.

### Gate G3 — Domain Pilot
Must pass ND30 scoped profile, HPC Corporate, SOP and Academic Base with explicit coverage statements.

### Gate G4 — Safe Mutation
Must pass fix-policy enforcement, transactions, preview, rollback and Fix All Safe; no `never-auto-fix` finding may reach mutation APIs.

### Gate G5 — Preflight RC
Must pass dashboard, release status, release checklist, privacy hygiene, CI and Word Desktop smoke matrix.

## Definition of Done for Any Rule/Profile

A rule/profile is not complete unless all conditions hold:
1. Normative source or explicitly-labeled custom/best-practice origin exists.
2. Scope and precedence are defined.
3. Valid fixture produces no false positive.
4. Invalid fixture produces expected finding.
5. Finding contains source/profile/version metadata.
6. Fix policy is explicit.
7. Any automatic fix has red/green regression tests and rollback coverage.
8. UI can explain the rule to the user.

## Recommended Execution Order

1. `V2-STD-001` → `005`
2. `V2-DOC-001` → `006`
3. `V2-QA-001`
4. `V2-ENG-001` → `004`, `006`, `008`
5. `V2-FIX-001` → `005`
6. `V2-UI-001` → `003`
7. `V2-PREF-001` → `002`
8. `V2-DOM-001` → `004`
9. `V2-QA-002`, `003`, `005`, `007`
10. P1 citation/scientific/publishing/accessibility/template-learning work

## Initial P0 Backlog Summary

**Standards:** V2-STD-001..005  
**Document model:** V2-DOC-001..006  
**Core engines:** V2-ENG-001..004, 006, 008, 011  
**Domains:** V2-DOM-001..004  
**Fix:** V2-FIX-001..005  
**UI/Preflight:** V2-UI-001..003, V2-PREF-001..002  
**QA:** V2-QA-001, V2-QA-002, V2-QA-007

These P0 tasks establish the minimum credible V2 platform before expanding citation styles, publishers and template learning.