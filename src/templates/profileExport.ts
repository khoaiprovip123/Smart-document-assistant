import type { StandardProfile } from "../profiles/types";
import type { QualityRequirement } from "../quality/requirements";
import type { StandardRule } from "../standards/types";
import { buildReviewedDraft, type ProfileReviewState } from "./profileReview";

export interface ReviewedProfileExport {
  schemaVersion: "1.0";
  profile: StandardProfile;
  rules: readonly StandardRule<QualityRequirement>[];
  source: Readonly<{
    id: string;
    kind: "trusted-template";
    verified: false;
  }>;
  review: Readonly<{
    acceptedRuleIds: readonly string[];
    rejectedRuleIds: readonly string[];
  }>;
}

function cloneRule(rule: StandardRule<QualityRequirement>): StandardRule<QualityRequirement> {
  return Object.freeze({
    ...structuredClone(rule),
    requirement: Object.freeze(structuredClone(rule.requirement)),
    scope: Object.freeze(structuredClone(rule.scope))
  });
}

export function canSaveReviewedProfile(state: ProfileReviewState): boolean {
  return state.proposals.every((proposal) => proposal.decision !== "pending");
}

export function buildReviewedProfileExport(state: ProfileReviewState): ReviewedProfileExport {
  if (!canSaveReviewedProfile(state)) {
    throw new Error("Cannot save learned profile while review proposals are pending.");
  }

  const reviewed = buildReviewedDraft(state);
  const rules = Object.freeze(reviewed.acceptedProposals.map((proposal) => cloneRule(proposal.rule)));

  return Object.freeze({
    schemaVersion: "1.0" as const,
    profile: Object.freeze({
      ...structuredClone(reviewed.profile),
      status: "unverified" as const,
      ruleBindings: Object.freeze(reviewed.profile.ruleBindings.map((binding) => Object.freeze({ ...binding })))
    }),
    rules,
    source: Object.freeze({
      id: reviewed.sourceId,
      kind: "trusted-template" as const,
      verified: false as const
    }),
    review: Object.freeze({
      acceptedRuleIds: Object.freeze(rules.map((rule) => rule.id)),
      rejectedRuleIds: Object.freeze([...reviewed.rejectedProposalIds])
    })
  });
}
