import type { StandardRule, StandardRuleRegistry } from "../standards/types";
import type { ProfileLayer, ProfileRef, StandardProfile, StandardProfileRegistry } from "./types";

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

export function resolveRuleCandidates(
  ruleId: string,
  candidates: readonly RuleCandidate[]
): ResolvedRuleCandidateSet {
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

function expandProfileChain(ref: ProfileRef, profiles: StandardProfileRegistry): StandardProfile[] {
  const current = profiles.require(ref);
  const parents = current.parent ? expandProfileChain(current.parent, profiles) : [];
  return [...parents, current];
}

function buildChainCandidates(
  ref: ProfileRef,
  profiles: StandardProfileRegistry,
  rules: StandardRuleRegistry
): Map<string, RuleCandidate> {
  const candidates = new Map<string, RuleCandidate>();

  for (const profile of expandProfileChain(ref, profiles)) {
    for (const binding of profile.ruleBindings) {
      if (!binding.enabled) {
        candidates.delete(binding.ruleId);
        continue;
      }

      const rule = rules.require(binding.ruleId);
      if (!rule.enabled) {
        candidates.delete(binding.ruleId);
        continue;
      }

      candidates.set(binding.ruleId, {
        profileId: profile.id,
        profileVersion: profile.version,
        layer: profile.layer,
        requirement: binding.requirementOverride === undefined ? rule.requirement : binding.requirementOverride
      });
    }
  }

  return candidates;
}

export function resolveProfiles(
  refs: readonly ProfileRef[],
  profiles: StandardProfileRegistry,
  rules: StandardRuleRegistry
): ResolvedProfile {
  const candidatesByRule = new Map<string, RuleCandidate[]>();

  for (const ref of refs) {
    const chainCandidates = buildChainCandidates(ref, profiles, rules);
    for (const [ruleId, candidate] of chainCandidates) {
      const candidates = candidatesByRule.get(ruleId) ?? [];
      candidates.push(candidate);
      candidatesByRule.set(ruleId, candidates);
    }
  }

  const resolvedRules = new Map<string, ResolvedRule>();
  for (const [ruleId, candidates] of candidatesByRule) {
    const resolution = resolveRuleCandidates(ruleId, candidates);
    const rule = rules.require(ruleId);
    resolvedRules.set(ruleId, {
      rule,
      requirement: resolution.winner.requirement,
      profileId: resolution.winner.profileId,
      profileVersion: resolution.winner.profileVersion,
      layer: resolution.winner.layer,
      resolutionTrace: resolution.trace
    });
  }

  return {
    activeProfiles: refs.map((ref) => ({ ...ref })),
    rules: resolvedRules
  };
}
