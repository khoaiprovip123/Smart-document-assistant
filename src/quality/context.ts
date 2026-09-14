import type { ResolvedProfile, ResolvedRule } from "../profiles/resolveProfile";
import { buildFindingProvenance } from "../standards/findingProvenance";
import type { StandardSourceRegistry } from "../standards/types";
import type { SemanticDocumentSnapshot } from "../word/documentModel";
import type { QualityFindingLocation, QualityFindingV2 } from "./types";

export interface QualityContext {
  document: SemanticDocumentSnapshot;
  profile: ResolvedProfile;
  sources: StandardSourceRegistry;
}

export interface QualityFindingInput {
  title?: string;
  message: string;
  current?: unknown;
  expected?: unknown;
  location?: QualityFindingLocation;
  discriminator?: string;
}

export function createQualityContext(
  document: SemanticDocumentSnapshot,
  profile: ResolvedProfile,
  sources: StandardSourceRegistry
): QualityContext {
  return Object.freeze({ document, profile, sources });
}

export function stableFindingId(ruleId: string, location?: QualityFindingLocation, discriminator = "default"): string {
  const section = location?.sectionIndex ?? "-";
  const paragraph = location?.paragraphIndex ?? "-";
  const table = location?.tableIndex ?? "-";
  return `${ruleId}:${section}:${paragraph}:${table}:${discriminator}`;
}

export function createQualityFinding(
  context: QualityContext,
  resolvedRule: ResolvedRule,
  input: QualityFindingInput
): QualityFindingV2 {
  const source = context.sources.require(resolvedRule.rule.sourceId);
  return {
    id: stableFindingId(resolvedRule.rule.id, input.location, input.discriminator),
    ruleId: resolvedRule.rule.id,
    category: resolvedRule.rule.category,
    severity: resolvedRule.rule.severity,
    title: input.title ?? resolvedRule.rule.title,
    message: input.message,
    current: input.current,
    expected: input.expected,
    location: input.location,
    fixPolicy: resolvedRule.rule.fixPolicy,
    provenance: buildFindingProvenance(resolvedRule, source)
  };
}
