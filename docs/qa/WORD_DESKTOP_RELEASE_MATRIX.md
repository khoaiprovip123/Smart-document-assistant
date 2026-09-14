# Word Desktop Release Qualification Matrix

## Current status

**PENDING MANUAL**

CI, semantic corpus tests and manifest validation do not replace a real Microsoft Word Desktop smoke test. No environment below should be marked `PASSED` until the checklist has actually been completed on that environment.

## Environments

| Environment | Required | Current outcome | Office build | Windows build | Test date | Tester | Notes |
|---|---:|---|---|---|---|---|---|
| Windows Word Desktop / Microsoft 365 Current Channel | Yes | NOT RUN | — | — | — | — | Required production gate |
| Windows Word Desktop / Microsoft 365 Monthly Enterprise Channel | No | NOT RUN | — | — | — | — | Recommended enterprise compatibility check |

## Required smoke checklist

For each required environment, use a copied/sanitized representative Word document and complete every step:

- [ ] Open document and load the add-in.
- [ ] Classify/confirm the intended profile.
- [ ] Run scan.
- [ ] Navigate to a finding.
- [ ] Review a preview-required change.
- [ ] Apply a safe fix through the supported compatibility path.
- [ ] Roll back the latest supported change.
- [ ] Re-scan.
- [ ] Verify preflight status and unresolved release blockers.

Canonical machine-readable checklist:

`open → classify/profile → scan → navigate → preview → fix safe → rollback → re-scan → preflight`

## Additional M6 checks

- [ ] Analyze the current document as a trusted template.
- [ ] Confirm every learned proposal is labeled `UNVERIFIED`.
- [ ] Accept/reject/edit learned rules and export the local JSON draft.
- [ ] Export the V2 audit JSON.
- [ ] Refresh Transaction History after Fix Selected / Normalize Selection / Heading Numbering.
- [ ] Confirm a structure change blocks rollback eligibility.
- [ ] Confirm comments/tracked changes remain never-auto-fix.

## Qualification rule

Production status is `QUALIFIED` only when all of the following are true:

1. Latest CI is green: build, unit tests, development manifest and production manifest.
2. Corpus observations contain all expected findings and no forbidden false positives.
3. Every required Word Desktop environment has outcome `passed` and the full smoke checklist completed.
4. Any release blocker discovered during smoke testing has been resolved and re-tested.

Until then, the application remains a **pilot/release candidate**, even if CI is green.
