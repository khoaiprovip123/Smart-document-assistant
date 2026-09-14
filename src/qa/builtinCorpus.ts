import { validateCorpusManifest, type CorpusManifestEntry } from "./corpusManifest";

const syntheticSource = Object.freeze({
  title: "Synthetic deterministic semantic fixture",
  license: "internal-test"
});

export const BUILTIN_QA_CORPUS: readonly CorpusManifestEntry[] = validateCorpusManifest([
  {
    id: "nd30-layout-invalid",
    family: "administrative",
    profile: { id: "VN-ND30-ADMIN", version: "1.0.0" },
    artifactKind: "semantic-snapshot",
    artifactPath: "fixture://layout-invalid-paper-margin",
    source: syntheticSource,
    expectedFindingRuleIds: [
      "ND30-PAPER-A4",
      "ND30-MARGIN-TOP",
      "ND30-MARGIN-BOTTOM",
      "ND30-MARGIN-LEFT",
      "ND30-MARGIN-RIGHT"
    ],
    forbiddenFalsePositiveRuleIds: ["ND30-BODY-FONT", "ND30-BODY-SIZE", "ND30-BODY-ALIGNMENT"],
    manualSmokeNotes: ["Synthetic snapshot only; use a separate copied DOCX for Word Desktop smoke testing."]
  },
  {
    id: "nd30-typography-invalid",
    family: "administrative",
    profile: { id: "VN-ND30-ADMIN", version: "1.0.0" },
    artifactKind: "semantic-snapshot",
    artifactPath: "fixture://typography-invalid-body",
    source: syntheticSource,
    expectedFindingRuleIds: ["ND30-BODY-FONT", "ND30-BODY-SIZE", "ND30-BODY-ALIGNMENT"],
    forbiddenFalsePositiveRuleIds: [
      "ND30-PAPER-A4",
      "ND30-MARGIN-TOP",
      "ND30-MARGIN-BOTTOM",
      "ND30-MARGIN-LEFT",
      "ND30-MARGIN-RIGHT"
    ],
    manualSmokeNotes: ["Synthetic snapshot only; verify mixed/run-level typography separately in Word Desktop."]
  },
  {
    id: "hpc-text-hygiene-invalid",
    family: "corporate",
    profile: { id: "HPC-CORPORATE-BASE", version: "1.0.0" },
    artifactKind: "semantic-snapshot",
    artifactPath: "fixture://text-hygiene-spacing",
    source: syntheticSource,
    expectedFindingRuleIds: ["GEN-TEXT-DOUBLE-SPACES", "GEN-TEXT-PUNCTUATION"],
    forbiddenFalsePositiveRuleIds: ["GEN-RELEASE-NO-COMMENTS", "GEN-RELEASE-NO-TRACKED-CHANGES"],
    manualSmokeNotes: ["Synthetic snapshot only; confirm navigation and review-required behavior in Word Desktop."]
  },
  {
    id: "hpc-release-hygiene-invalid",
    family: "corporate",
    profile: { id: "HPC-CORPORATE-BASE", version: "1.0.0" },
    artifactKind: "semantic-snapshot",
    artifactPath: "fixture://release-hygiene-comments-revisions",
    source: syntheticSource,
    expectedFindingRuleIds: ["GEN-RELEASE-NO-COMMENTS", "GEN-RELEASE-NO-TRACKED-CHANGES"],
    forbiddenFalsePositiveRuleIds: ["GEN-TEXT-DOUBLE-SPACES", "GEN-TEXT-PUNCTUATION"],
    manualSmokeNotes: ["Synthetic snapshot only; comments and tracked changes must remain never-auto-fix."]
  }
]);
