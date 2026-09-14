# V2 M3 Core Quality Engines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans with TDD RED -> GREEN.

**Goal:** Build profile-driven, source-backed quality engines for layout, typography, structure, heading hierarchy, tables, text hygiene and release hygiene.

**Architecture:** Core engines consume `SemanticDocumentSnapshot + ResolvedProfile + StandardSourceRegistry`. They never embed institution-specific numeric standards. Every supported rule requirement has a discriminated `kind`; the engine executes only requirement kinds it understands and emits provenance-rich `QualityFindingV2` objects.

**Spec:** `docs/superpowers/specs/2026-09-14-document-standards-platform-v2-design.md`

## Files

```text
src/quality/
  types.ts
  requirements.ts
  context.ts
  runCoreQualityEngines.ts
  engines/
    layoutEngine.ts
    typographyEngine.ts
    structureEngine.ts
    headingEngine.ts
    tableEngine.ts
    textHygieneEngine.ts
    releaseHygieneEngine.ts
src/__tests__/quality/
  helpers.ts
  layoutEngine.test.ts
  typographyEngine.test.ts
  structureHeading.test.ts
  tableTextRelease.test.ts
  runCoreQualityEngines.test.ts
```

## Core Finding Contract

```ts
interface QualityFindingV2 {
  id: string;
  ruleId: string;
  category: RuleCategory;
  severity: "critical" | "warning" | "suggestion" | "info";
  title: string;
  message: string;
  current?: unknown;
  expected?: unknown;
  location?: { sectionIndex?: number; paragraphIndex?: number; tableIndex?: number };
  fixPolicy: FixPolicy;
  provenance: FindingProvenance;
}
```

No normative V2 finding may exist without provenance.

## Supported P0 Requirement Kinds

- `layout-paper-size`
- `layout-orientation`
- `layout-margin-range`
- `typography-font`
- `typography-size-range`
- `typography-alignment`
- `structure-required-heading`
- `heading-max-level-jump`
- `table-require-header-row`
- `text-no-double-spaces`
- `text-punctuation-spacing`
- `release-no-comments`
- `release-no-tracked-changes`

Unsupported requirement kinds are not guessed; they are skipped by that engine and remain visible to future coverage tooling.

## V2-ENG-001 Layout

For each layout requirement, inspect every applicable section. Findings must carry `sectionIndex`. Margin ranges compare points because snapshot layout is stored in points. Missing observable values do not become false violations.

## V2-ENG-002 Typography

Typography rules may specify semantic roles. Evaluate paragraph aggregate formatting only when the observed property is concrete. Mixed/unknown values remain outside automatic correction until exact run evidence exists.

## V2-ENG-003 Structure

`structure-required-heading` searches semantic headings and normalized text. Missing required heading creates one document/structure finding. Optional case-insensitive/diacritic-preserving match is deterministic.

## V2-ENG-004 Heading hierarchy

`heading-max-level-jump` checks consecutive semantic headings. Example: H1 -> H3 violates `maxJump=1`; H2 -> H1 does not violate downward reset. Findings point to the second heading.

## V2-ENG-006 Table

`table-require-header-row` reports tables with missing/zero `headerRowCount`. Unknown header information is review-only when the rule cannot establish an observable violation.

## V2-ENG-008 Text hygiene

Detect double ASCII spaces outside leading indentation and obvious punctuation-spacing errors. Findings are paragraph-scoped and must never rewrite content in M3.

## V2-ENG-011 Release hygiene

Block/review based on exact `releaseMetadata.commentsCount` and `trackedChangesCount`. This engine is the source for later Preflight blockers.

## Integration Runner

```ts
runCoreQualityEngines(context): QualityFindingV2[]
```

Runs the seven engines, returns stable sorting by severity weight, category, ruleId and location. Duplicate `id` values are forbidden.

## TDD Gate

1. RED tests prove modules/behaviors do not exist.
2. GREEN implementation makes focused tests pass.
3. Full `npm run build` + `npm test`.
4. Development and production manifests validate.
5. No existing V1 test regression.

## Exit Gate

M3 P0 is complete only when valid fixtures produce no false positive for the supported kinds, invalid fixtures produce source-backed findings, aggregate runner is deterministic, and exact HEAD passes CI.
