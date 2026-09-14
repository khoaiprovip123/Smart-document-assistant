import type { FindingProvenance } from "../types";
import type { ResolvedRule } from "../profiles/resolveProfile";
import type { StandardSource } from "./types";

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
