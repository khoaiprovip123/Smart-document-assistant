# V2 M1 Standards Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce the source-backed, versioned standards/profile foundation required by every V2 validation engine without breaking the current V1 rule profiles.

**Architecture:** Add isolated `standards/` and `profiles/` modules with pure validation/resolution functions first. Keep V1 `DocumentRuleProfile` intact during M1; V2 findings gain optional provenance so existing V1 tests remain green while new V2 engines can require provenance. Profile resolution is deterministic, traces precedence decisions, and rejects circular inheritance or orphan source/rule references.

**Tech Stack:** TypeScript 5.9, Vitest 3.2, existing React/Office.js application.

**Spec:** `docs/superpowers/specs/2026-09-14-document-standards-platform-v2-design.md`

## Global Constraints

- No existing V1 profile or V1 finding behavior may be removed in M1.
- Every V2 normative rule must reference a registered source.
- Legal/institution/publisher precedence must be deterministic and inspectable.
- No network calls belong in registries/resolvers; they operate on supplied data.
- Profiles are immutable input records; resolution returns new objects.
- All public functions in M1 are pure except registry construction.
- Run `npm run build`, `npm test`, `npm run validate:manifest`, and production-manifest validation before claiming M1 complete.

## File Structure

```text
src/
  standards/
    types.ts                 # source/rule/fix-policy/scope/provenance types
    sourceRegistry.ts        # source validation, lookup, active-date logic
    ruleRegistry.ts          # rule validation and source-reference integrity
    findingProvenance.ts     # convert resolved rule metadata to Finding provenance
  profiles/
    types.ts                 # versioned profile, layer and override types
    profileRegistry.ts       # profile validation, lookup, cycle checks
    resolveProfile.ts        # inheritance + layer precedence + resolution trace
  types.ts                   # backward-compatible FindingProvenance field
src/__tests__/
  standards/
    sourceRegistry.test.ts
    ruleRegistry.test.ts
    findingProvenance.test.ts
  profiles/
    profileRegistry.test.ts
    resolveProfile.test.ts
```

---

### Task V2-STD-001: Standard Source Registry

**Files:**
- Create: `src/standards/types.ts`
- Create: `src/standards/sourceRegistry.ts`
- Test: `src/__tests__/standards/sourceRegistry.test.ts`

**Interfaces:**
- Produces: `StandardSource`, `SourceType`, `StandardSourceRegistry`, `createStandardSourceRegistry()`, `isSourceActiveAt()`.
- Consumed later by: V2-STD-002 rule registry and V2-STD-005 provenance.

- [ ] **Step 1: Write the failing source-registry tests**

```ts
import { describe, expect, it } from "vitest";
import { createStandardSourceRegistry, isSourceActiveAt } from "../../standards/sourceRegistry";
import type { StandardSource } from "../../standards/types";

const nd30: StandardSource = {
  id: "VN-GOV-ND30-2020",
  title: "Nghị định 30/2020/NĐ-CP",
  issuer: "Chính phủ Việt Nam",
  sourceType: "law",
  url: "https://vbpl.moj.gov.vn/bonoivu/Pages/vbpq-van-ban-goc.aspx?ItemID=141142",
  effectiveFrom: "2020-03-05",
  verifiedAt: "2026-09-14"
};

describe("standard source registry", () => {
  it("indexes a source by stable id", () => {
    const registry = createStandardSourceRegistry([nd30]);
    expect(registry.require("VN-GOV-ND30-2020").issuer).toBe("Chính phủ Việt Nam");
  });

  it("rejects duplicate source ids", () => {
    expect(() => createStandardSourceRegistry([nd30, nd30])).toThrow(/duplicate source id/i);
  });

  it("evaluates source lifecycle at a date", () => {
    expect(isSourceActiveAt(nd30, "2026-09-14")).toBe(true);
    expect(isSourceActiveAt({ ...nd30, effectiveTo: "2025-12-31" }, "2026-09-14")).toBe(false);
  });

  it("throws for an unknown required source", () => {
    const registry = createStandardSourceRegistry([nd30]);
    expect(() => registry.require("MISSING")).toThrow(/unknown standard source/i);
  });
});
```

- [ ] **Step 2: Run RED**

Run:
```bash
npx vitest run src/__tests__/standards/sourceRegistry.test.ts
```
Expected: FAIL because `src/standards/*` does not exist.

- [ ] **Step 3: Implement exact source types**

Create `src/standards/types.ts`:

```ts
export type SourceType =
  | "law"
  | "institution"
  | "publisher"
  | "standard"
  | "style-guide"
  | "template"
  | "custom";

export interface StandardSource {
  id: string;
  title: string;
  issuer: string;
  sourceType: SourceType;
  url?: string;
  publicationDate?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  verifiedAt?: string;
}

export interface StandardSourceRegistry {
  all(): readonly StandardSource[];
  has(id: string): boolean;
  get(id: string): StandardSource | undefined;
  require(id: string): StandardSource;
}
```

- [ ] **Step 4: Implement registry and lifecycle logic**

Create `src/standards/sourceRegistry.ts`:

```ts
import type { StandardSource, StandardSourceRegistry } from "./types";

function compareIsoDate(left: string, right: string): number {
  return left.localeCompare(right);
}

export function isSourceActiveAt(source: StandardSource, date: string): boolean {
  if (source.effectiveFrom && compareIsoDate(date, source.effectiveFrom) < 0) return false;
  if (source.effectiveTo && compareIsoDate(date, source.effectiveTo) > 0) return false;
  return true;
}

export function createStandardSourceRegistry(sources: readonly StandardSource[]): StandardSourceRegistry {
  const byId = new Map<string, StandardSource>();
  for (const source of sources) {
    if (!source.id.trim()) throw new Error("Standard source id is required");
    if (byId.has(source.id)) throw new Error(`Duplicate source id: ${source.id}`);
    byId.set(source.id, Object.freeze({ ...source }));
  }
  const frozen = Object.freeze([...byId.values()]);
  return {
    all: () => frozen,
    has: (id) => byId.has(id),
    get: (id) => byId.get(id),
    require: (id) => {
      const value = byId.get(id);
      if (!value) throw new Error(`Unknown standard source: ${id}`);
      return value;
    }
  };
}
```

- [ ] **Step 5: Run GREEN and regression suite**

```bash
npx vitest run src/__tests__/standards/sourceRegistry.test.ts
npm run build
npm test
```
Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/standards src/__tests__/standards/sourceRegistry.test.ts
git commit -m "feat: add standard source registry"
```

---

### Task V2-STD-002: Rule Schema and Rule Registry

**Files:**
- Modify: `src/standards/types.ts`
- Create: `src/standards/ruleRegistry.ts`
- Test: `src/__tests__/standards/ruleRegistry.test.ts`

**Interfaces:**
- Consumes: `StandardSourceRegistry` from V2-STD-001.
- Produces: `FixPolicy`, `RuleCategory`, `RuleScope`, `StandardRule`, `StandardRuleRegistry`, `createStandardRuleRegistry()`.

- [ ] **Step 1: Write failing tests for valid rules and orphan sources**

```ts
import { describe, expect, it } from "vitest";
import { createStandardSourceRegistry } from "../../standards/sourceRegistry";
import { createStandardRuleRegistry } from "../../standards/ruleRegistry";
import type { StandardRule } from "../../standards/types";

const sources = createStandardSourceRegistry([{
  id: "SOURCE-1", title: "Source", issuer: "Issuer", sourceType: "institution"
}]);

const rule: StandardRule<number> = {
  id: "LAYOUT-MARGIN-LEFT",
  title: "Left margin",
  category: "layout",
  requirement: 30,
  severity: "critical",
  fixPolicy: "auto-with-preview",
  sourceId: "SOURCE-1",
  sourceLocator: "Section 2.1",
  scope: { documentFamilies: ["administrative"] },
  enabled: true
};

describe("standard rule registry", () => {
  it("registers a source-backed rule", () => {
    const registry = createStandardRuleRegistry([rule], sources);
    expect(registry.require(rule.id).sourceId).toBe("SOURCE-1");
  });

  it("rejects orphan source references", () => {
    expect(() => createStandardRuleRegistry([{ ...rule, sourceId: "MISSING" }], sources))
      .toThrow(/unknown standard source/i);
  });

  it("rejects duplicate rule ids", () => {
    expect(() => createStandardRuleRegistry([rule, rule], sources)).toThrow(/duplicate rule id/i);
  });
});
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run src/__tests__/standards/ruleRegistry.test.ts
```
Expected: FAIL because rule types/registry are missing.

- [ ] **Step 3: Add exact rule types**

Append to `src/standards/types.ts`:

```ts
export type FixPolicy = "auto-safe" | "auto-with-preview" | "review-required" | "never-auto-fix";

export type RuleCategory =
  | "layout"
  | "typography"
  | "structure"
  | "heading-numbering"
  | "table-figure-equation"
  | "citation-reference"
  | "accessibility"
  | "language-consistency"
  | "release-hygiene";

export interface RuleScope {
  documentFamilies?: string[];
  documentTypes?: string[];
  profileTags?: string[];
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

export interface StandardRuleRegistry {
  all(): readonly StandardRule[];
  has(id: string): boolean;
  get(id: string): StandardRule | undefined;
  require(id: string): StandardRule;
}
```

- [ ] **Step 4: Implement source-integrity validation**

Create `src/standards/ruleRegistry.ts`:

```ts
import type { StandardRule, StandardRuleRegistry, StandardSourceRegistry } from "./types";

export function createStandardRuleRegistry(
  rules: readonly StandardRule[],
  sources: StandardSourceRegistry
): StandardRuleRegistry {
  const byId = new Map<string, StandardRule>();
  for (const rule of rules) {
    if (byId.has(rule.id)) throw new Error(`Duplicate rule id: ${rule.id}`);
    sources.require(rule.sourceId);
    byId.set(rule.id, Object.freeze({ ...rule, scope: { ...rule.scope } }));
  }
  const frozen = Object.freeze([...byId.values()]);
  return {
    all: () => frozen,
    has: (id) => byId.has(id),
    get: (id) => byId.get(id),
    require: (id) => {
      const value = byId.get(id);
      if (!value) throw new Error(`Unknown standard rule: ${id}`);
      return value;
    }
  };
}
```

- [ ] **Step 5: Run GREEN + all tests**

```bash
npx vitest run src/__tests__/standards/ruleRegistry.test.ts
npm run build
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/standards src/__tests__/standards/ruleRegistry.test.ts
git commit -m "feat: add source-backed rule registry"
```

---

### Task V2-STD-003: Versioned Profile Registry and Inheritance Guard

**Files:**
- Create: `src/profiles/types.ts`
- Create: `src/profiles/profileRegistry.ts`
- Test: `src/__tests__/profiles/profileRegistry.test.ts`

**Interfaces:**
- Consumes: rule IDs from `StandardRuleRegistry`.
- Produces: `ProfileLayer`, `ProfileRef`, `ProfileRuleBinding`, `StandardProfile`, `StandardProfileRegistry`, `createStandardProfileRegistry()`.

- [ ] **Step 1: Write failing tests for unique versions, rule integrity and cycles**

```ts
import { describe, expect, it } from "vitest";
import { createStandardProfileRegistry } from "../../profiles/profileRegistry";
import type { StandardProfile } from "../../profiles/types";

const base: StandardProfile = {
  id: "ACADEMIC-BASE",
  version: "1.0.0",
  name: "Academic Base",
  status: "verified",
  layer: "document-template",
  sourceIds: ["SRC"],
  ruleBindings: [{ ruleId: "RULE-1", enabled: true }]
};

it("rejects duplicate id+version", () => {
  expect(() => createStandardProfileRegistry([base, base], new Set(["RULE-1"])))
    .toThrow(/duplicate profile version/i);
});

it("rejects unknown rule bindings", () => {
  expect(() => createStandardProfileRegistry([base], new Set()))
    .toThrow(/unknown rule/i);
});

it("rejects circular parent inheritance", () => {
  const a = { ...base, id: "A", parent: { id: "B", version: "1.0.0" } };
  const b = { ...base, id: "B", parent: { id: "A", version: "1.0.0" } };
  expect(() => createStandardProfileRegistry([a, b], new Set(["RULE-1"]))).toThrow(/circular profile inheritance/i);
});
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run src/__tests__/profiles/profileRegistry.test.ts
```

- [ ] **Step 3: Implement exact profile types**

Create `src/profiles/types.ts`:

```ts
export type ProfileLayer =
  | "legal"
  | "institution-publisher"
  | "document-template"
  | "citation-editorial"
  | "house-style"
  | "custom"
  | "generic";

export interface ProfileRef { id: string; version: string; }

export interface ProfileRuleBinding {
  ruleId: string;
  enabled: boolean;
  requirementOverride?: unknown;
}

export interface StandardProfile {
  id: string;
  version: string;
  name: string;
  status: "draft" | "unverified" | "verified" | "retired";
  layer: ProfileLayer;
  sourceIds: string[];
  parent?: ProfileRef;
  tags?: string[];
  effectiveFrom?: string;
  effectiveTo?: string;
  ruleBindings: ProfileRuleBinding[];
}

export interface StandardProfileRegistry {
  all(): readonly StandardProfile[];
  get(ref: ProfileRef): StandardProfile | undefined;
  require(ref: ProfileRef): StandardProfile;
}
```

- [ ] **Step 4: Implement registry and DFS cycle detection**

Create `src/profiles/profileRegistry.ts` with:

```ts
import type { ProfileRef, StandardProfile, StandardProfileRegistry } from "./types";

const keyOf = (ref: ProfileRef) => `${ref.id}@${ref.version}`;

export function createStandardProfileRegistry(
  profiles: readonly StandardProfile[],
  knownRuleIds: ReadonlySet<string>
): StandardProfileRegistry {
  const byKey = new Map<string, StandardProfile>();
  for (const profile of profiles) {
    const key = keyOf(profile);
    if (byKey.has(key)) throw new Error(`Duplicate profile version: ${key}`);
    for (const binding of profile.ruleBindings) {
      if (!knownRuleIds.has(binding.ruleId)) throw new Error(`Unknown rule: ${binding.ruleId}`);
    }
    byKey.set(key, Object.freeze({ ...profile, ruleBindings: profile.ruleBindings.map((x) => Object.freeze({ ...x })) }));
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (profile: StandardProfile): void => {
    const key = keyOf(profile);
    if (visiting.has(key)) throw new Error(`Circular profile inheritance: ${key}`);
    if (visited.has(key)) return;
    visiting.add(key);
    if (profile.parent) {
      const parent = byKey.get(keyOf(profile.parent));
      if (!parent) throw new Error(`Unknown parent profile: ${keyOf(profile.parent)}`);
      visit(parent);
    }
    visiting.delete(key);
    visited.add(key);
  };
  byKey.forEach(visit);

  const frozen = Object.freeze([...byKey.values()]);
  return {
    all: () => frozen,
    get: (ref) => byKey.get(keyOf(ref)),
    require: (ref) => {
      const value = byKey.get(keyOf(ref));
      if (!value) throw new Error(`Unknown profile: ${keyOf(ref)}`);
      return value;
    }
  };
}
```

- [ ] **Step 5: Run GREEN and regressions**

```bash
npx vitest run src/__tests__/profiles/profileRegistry.test.ts
npm run build
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/profiles src/__tests__/profiles/profileRegistry.test.ts
git commit -m "feat: add versioned profile registry"
```

---

### Task V2-STD-004: Deterministic Profile and Rule Precedence Resolver

**Files:**
- Create: `src/profiles/resolveProfile.ts`
- Test: `src/__tests__/profiles/resolveProfile.test.ts`

**Interfaces:**
- Consumes: `StandardProfileRegistry`, `StandardRuleRegistry`.
- Produces: `ResolvedRule`, `ResolutionDecision`, `ResolvedProfile`, `resolveProfiles()`.

- [ ] **Step 1: Write failing precedence and trace tests**

```ts
import { describe, expect, it } from "vitest";
import { profileLayerWeight, resolveRuleCandidates } from "../../profiles/resolveProfile";

it("orders layers from legal to generic", () => {
  expect(profileLayerWeight("legal")).toBeGreaterThan(profileLayerWeight("institution-publisher"));
  expect(profileLayerWeight("custom")).toBeGreaterThan(profileLayerWeight("generic"));
});

it("chooses the higher-priority candidate and records the loser", () => {
  const result = resolveRuleCandidates("RULE-1", [
    { profileId: "GEN", profileVersion: "1", layer: "generic", requirement: 10 },
    { profileId: "LAW", profileVersion: "1", layer: "legal", requirement: 20 }
  ]);
  expect(result.winner.profileId).toBe("LAW");
  expect(result.trace.some((x) => x.profileId === "GEN" && x.outcome === "overridden")).toBe(true);
});
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run src/__tests__/profiles/resolveProfile.test.ts
```

- [ ] **Step 3: Implement resolver types and weight table**

Create `src/profiles/resolveProfile.ts`:

```ts
import type { ProfileLayer } from "./types";

export interface RuleCandidate {
  profileId: string;
  profileVersion: string;
  layer: ProfileLayer;
  requirement: unknown;
}

export interface ResolutionDecision extends RuleCandidate {
  outcome: "selected" | "overridden";
}

export interface ResolvedRuleCandidateSet {
  ruleId: string;
  winner: RuleCandidate;
  trace: ResolutionDecision[];
}

const weights: Record<ProfileLayer, number> = {
  legal: 700,
  "institution-publisher": 600,
  "document-template": 500,
  "citation-editorial": 400,
  "house-style": 300,
  custom: 200,
  generic: 100
};

export const profileLayerWeight = (layer: ProfileLayer): number => weights[layer];

export function resolveRuleCandidates(ruleId: string, candidates: readonly RuleCandidate[]): ResolvedRuleCandidateSet {
  if (!candidates.length) throw new Error(`No candidates for rule: ${ruleId}`);
  const sorted = [...candidates].sort((a, b) => {
    const weightDelta = profileLayerWeight(b.layer) - profileLayerWeight(a.layer);
    if (weightDelta !== 0) return weightDelta;
    return `${a.profileId}@${a.profileVersion}`.localeCompare(`${b.profileId}@${b.profileVersion}`);
  });
  const [winner, ...losers] = sorted;
  return {
    ruleId,
    winner,
    trace: [
      { ...winner, outcome: "selected" },
      ...losers.map((candidate) => ({ ...candidate, outcome: "overridden" as const }))
    ]
  };
}
```

- [ ] **Step 4: Add inheritance expansion test before full `resolveProfiles()`**

Add a test proving a child profile includes parent bindings and child bindings replace the same rule only within that inheritance chain before cross-layer precedence is evaluated.

Expected assertion:
```ts
expect(resolved.rules.get("RULE-1")?.profileId).toBe("CHILD");
```

- [ ] **Step 5: Implement `resolveProfiles()` using registry parent expansion and `resolveRuleCandidates()`**

The function signature must be:

```ts
export function resolveProfiles(
  refs: readonly ProfileRef[],
  profiles: StandardProfileRegistry,
  rules: StandardRuleRegistry
): ResolvedProfile
```

`ResolvedProfile` must contain:

```ts
export interface ResolvedRule {
  rule: StandardRule;
  requirement: unknown;
  profileId: string;
  profileVersion: string;
  layer: ProfileLayer;
  resolutionTrace: ResolutionDecision[];
}

export interface ResolvedProfile {
  activeProfiles: ProfileRef[];
  rules: Map<string, ResolvedRule>;
}
```

Implementation rules:
- recursively expand parents before children;
- disabled bindings remove that profile candidate only, not candidates from unrelated higher layers;
- `requirementOverride` replaces the base rule requirement only for that profile candidate;
- cross-profile conflicts are resolved by layer weight;
- ties use stable `id@version` ordering and retain the full trace.

- [ ] **Step 6: Run GREEN + full suite**

```bash
npx vitest run src/__tests__/profiles/resolveProfile.test.ts
npm run build
npm test
```

- [ ] **Step 7: Commit**

```bash
git add src/profiles/resolveProfile.ts src/__tests__/profiles/resolveProfile.test.ts
git commit -m "feat: resolve profile precedence with trace"
```

---

### Task V2-STD-005: Finding Provenance Contract

**Files:**
- Modify: `src/types.ts`
- Create: `src/standards/findingProvenance.ts`
- Test: `src/__tests__/standards/findingProvenance.test.ts`

**Interfaces:**
- Consumes: `ResolvedRule` from V2-STD-004 and `StandardSourceRegistry`.
- Produces: `FindingProvenance`, `buildFindingProvenance()`.
- V1 compatibility: `Finding.provenance` is optional during migration; all V2 engines must supply it.

- [ ] **Step 1: Write failing provenance test**

```ts
import { expect, it } from "vitest";
import { buildFindingProvenance } from "../../standards/findingProvenance";

it("builds explainable provenance from a resolved rule", () => {
  const provenance = buildFindingProvenance(
    {
      rule: {
        id: "RULE-1", title: "Rule", category: "layout", requirement: 30,
        severity: "critical", fixPolicy: "auto-with-preview", sourceId: "SRC",
        sourceLocator: "Appendix I", scope: {}, enabled: true
      },
      requirement: 30,
      profileId: "VN-ND30",
      profileVersion: "1.0.0",
      layer: "legal",
      resolutionTrace: []
    },
    { id: "SRC", title: "Source", issuer: "Issuer", sourceType: "law" }
  );
  expect(provenance.sourceId).toBe("SRC");
  expect(provenance.profileId).toBe("VN-ND30");
  expect(provenance.sourceLocator).toBe("Appendix I");
});
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run src/__tests__/standards/findingProvenance.test.ts
```

- [ ] **Step 3: Add backward-compatible provenance to `Finding`**

In `src/types.ts` add:

```ts
export interface FindingProvenance {
  sourceId: string;
  sourceTitle: string;
  issuer: string;
  sourceLocator?: string;
  sourceUrl?: string;
  profileId: string;
  profileVersion: string;
}
```

and inside `Finding`:

```ts
provenance?: FindingProvenance;
```

Do not remove `ruleId`, `autoFixable`, or existing V1 fields in M1.

- [ ] **Step 4: Implement provenance builder**

Create `src/standards/findingProvenance.ts`:

```ts
import type { FindingProvenance } from "../types";
import type { StandardSource } from "./types";
import type { ResolvedRule } from "../profiles/resolveProfile";

export function buildFindingProvenance(rule: ResolvedRule, source: StandardSource): FindingProvenance {
  if (rule.rule.sourceId !== source.id) {
    throw new Error(`Source mismatch for rule ${rule.rule.id}`);
  }
  return {
    sourceId: source.id,
    sourceTitle: source.title,
    issuer: source.issuer,
    sourceLocator: rule.rule.sourceLocator,
    sourceUrl: source.url,
    profileId: rule.profileId,
    profileVersion: rule.profileVersion
  };
}
```

- [ ] **Step 5: Add a migration guard test**

Add a test importing an existing V1 `Finding` fixture without provenance and assert TypeScript/build still accepts it. This prevents M1 from breaking the shipping V1 scanner before V2 engines are migrated.

- [ ] **Step 6: Run full M1 verification**

```bash
npx vitest run src/__tests__/standards src/__tests__/profiles
npm run build
npm test
npm run validate:manifest
ADDIN_ORIGIN=https://addin.example.com npm run build:manifest
npm run validate:manifest:production
```

Expected: every command exits 0; no existing V1 unit test regresses.

- [ ] **Step 7: Update docs/log and commit**

Update:
- `CHANGELOG.md` with M1 Standards Foundation entry.
- `docs/standards/SOURCE_CATALOG.md` only if a source was added/changed during implementation.

Commit:
```bash
git add src docs CHANGELOG.md
git commit -m "feat: add V2 standards provenance foundation"
```

---

## M1 Exit Gate

M1 may be marked complete only when:

1. Source IDs and rule IDs are duplicate-safe.
2. Orphan rule→source and profile→rule references fail fast.
3. Circular profile inheritance fails fast.
4. Precedence follows legal → institution/publisher → document template → citation/editorial → house style → custom → generic.
5. Every resolved rule includes a deterministic resolution trace.
6. V2 finding provenance identifies source + locator + profile/version.
7. Existing V1 scans/tests remain compatible.
8. Development and generated production manifests validate.
9. `CHANGELOG.md` records the delivered M1 behavior.

## Next Plan After M1

After M1 is implemented and verified, create and execute the detailed M2 Semantic Document Model plan for `V2-DOC-001..006`. Do not start M3 engines until M2 snapshot contracts are green, because all engine correctness depends on stable document semantics.
