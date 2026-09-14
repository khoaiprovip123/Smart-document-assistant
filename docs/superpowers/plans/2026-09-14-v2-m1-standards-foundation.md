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

## Status

- [x] Design approved by user.
- [x] RED tests prepared for V2-STD-001..005.
- [ ] RED CI verification.
- [ ] GREEN implementation.
- [ ] Full release-gate verification.

## File Structure

```text
src/
  standards/
    types.ts
    sourceRegistry.ts
    ruleRegistry.ts
    findingProvenance.ts
  profiles/
    types.ts
    profileRegistry.ts
    resolveProfile.ts
  types.ts
src/__tests__/
  standards/
  profiles/
```

## Exit Gate

M1 may be marked complete only when source/rule/profile integrity, deterministic precedence, provenance, V1 compatibility, build/tests and both manifests are green.
