import { createStandardProfileRegistry } from "../../profiles/profileRegistry";
import { resolveProfiles } from "../../profiles/resolveProfile";
import { createStandardRuleRegistry } from "../../standards/ruleRegistry";
import { createStandardSourceRegistry } from "../../standards/sourceRegistry";
import type { RuleCategory, StandardRule } from "../../standards/types";
import type { QualityRequirement } from "../../quality/requirements";
import { createQualityContext } from "../../quality/context";
import { createSemanticDocumentSnapshot, type SemanticDocumentSnapshotInput } from "../../word/documentModel";
import type { WordCapabilityMatrix } from "../../word/capabilities";

export const capabilities: WordCapabilityMatrix = {
  wordApi11: true,
  lists: true,
  commentsFields: true,
  styles15: true,
  trackedChanges: true,
  uniqueParagraphIds: true,
  pageSetupDesktop: true,
  tocDesktop: true,
  ooxml: true,
  inlinePictures: true
};

export function snapshot(overrides: Partial<SemanticDocumentSnapshotInput> = {}) {
  return createSemanticDocumentSnapshot({
    capabilities,
    sections: [],
    paragraphs: [],
    tables: [],
    fields: [],
    inlinePictures: [],
    comments: [],
    trackedChanges: [],
    ...overrides
  });
}

function categoryFor(requirement: QualityRequirement): RuleCategory {
  if (requirement.kind.startsWith("layout-")) return "layout";
  if (requirement.kind.startsWith("typography-")) return "typography";
  if (requirement.kind.startsWith("structure-")) return "structure";
  if (requirement.kind.startsWith("heading-")) return "heading-numbering";
  if (requirement.kind.startsWith("table-")) return "table-figure-equation";
  if (requirement.kind.startsWith("release-")) return "release-hygiene";
  return "language-consistency";
}

export function qualityContext(documentSnapshot: ReturnType<typeof snapshot>, requirements: QualityRequirement[]) {
  const sources = createStandardSourceRegistry([{
    id: "TEST-SOURCE",
    title: "Test Standard",
    issuer: "Test Issuer",
    sourceType: "custom",
    url: "https://example.com/standard"
  }]);

  const rules: StandardRule<QualityRequirement>[] = requirements.map((requirement, index) => ({
    id: `TEST-RULE-${index + 1}`,
    title: requirement.kind,
    category: categoryFor(requirement),
    requirement,
    severity: "warning",
    fixPolicy: "review-required",
    sourceId: "TEST-SOURCE",
    sourceLocator: `Rule ${index + 1}`,
    scope: {},
    enabled: true
  }));

  const ruleRegistry = createStandardRuleRegistry(rules, sources);
  const profile = createStandardProfileRegistry([{
    id: "TEST-PROFILE",
    version: "1.0.0",
    name: "Test Profile",
    status: "verified",
    layer: "custom",
    sourceIds: ["TEST-SOURCE"],
    ruleBindings: rules.map((rule) => ({ ruleId: rule.id, enabled: true }))
  }], new Set(rules.map((rule) => rule.id)));

  const resolved = resolveProfiles([{ id: "TEST-PROFILE", version: "1.0.0" }], profile, ruleRegistry);
  return createQualityContext(documentSnapshot, resolved, sources);
}
