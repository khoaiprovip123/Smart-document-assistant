import type { QualityRequirement } from "../quality/requirements";
import type { LearnedProfileDraft, LearnedRuleDecision, LearnedRuleProposal } from "./draftProfileGenerator";

export interface ProfileReviewState {
  draft: LearnedProfileDraft;
  proposals: readonly LearnedRuleProposal[];
}

export interface ProposalReviewUpdate {
  decision: Exclude<LearnedRuleDecision, "pending"> | "pending";
  requirement?: QualityRequirement;
}

export interface ReviewedProfileDraft extends LearnedProfileDraft {
  acceptedProposals: readonly LearnedRuleProposal[];
  rejectedProposalIds: readonly string[];
  pendingProposalIds: readonly string[];
}

function cloneProposal(proposal: LearnedRuleProposal): LearnedRuleProposal {
  return Object.freeze({
    ...proposal,
    rule: Object.freeze({
      ...proposal.rule,
      requirement: Object.freeze(structuredClone(proposal.rule.requirement)),
      scope: Object.freeze({ ...proposal.rule.scope })
    }),
    evidence: Object.freeze([...proposal.evidence])
  });
}

export function createProfileReviewState(draft: LearnedProfileDraft): ProfileReviewState {
  return Object.freeze({
    draft,
    proposals: Object.freeze(draft.proposals.map(cloneProposal))
  });
}

export function reviewProposal(
  state: ProfileReviewState,
  proposalId: string,
  update: ProposalReviewUpdate
): ProfileReviewState {
  let found = false;
  const proposals = state.proposals.map((proposal) => {
    if (proposal.id !== proposalId) return proposal;
    found = true;
    const requirement = update.requirement ?? proposal.rule.requirement;
    return Object.freeze({
      ...proposal,
      decision: update.decision,
      rule: Object.freeze({
        ...proposal.rule,
        requirement: Object.freeze(structuredClone(requirement))
      })
    });
  });
  if (!found) throw new Error(`Unknown learned rule proposal: ${proposalId}`);
  return Object.freeze({ draft: state.draft, proposals: Object.freeze(proposals) });
}

export function buildReviewedDraft(state: ProfileReviewState): ReviewedProfileDraft {
  const acceptedProposals = Object.freeze(state.proposals.filter((proposal) => proposal.decision === "accepted"));
  const rejectedProposalIds = Object.freeze(state.proposals.filter((proposal) => proposal.decision === "rejected").map((proposal) => proposal.id));
  const pendingProposalIds = Object.freeze(state.proposals.filter((proposal) => proposal.decision === "pending").map((proposal) => proposal.id));
  const profile = Object.freeze({
    ...state.draft.profile,
    status: "unverified" as const,
    ruleBindings: Object.freeze(acceptedProposals.map((proposal) => Object.freeze({ ruleId: proposal.rule.id, enabled: true })))
  });

  return Object.freeze({
    ...state.draft,
    profile,
    proposals: Object.freeze(state.proposals.map(cloneProposal)),
    acceptedProposals,
    rejectedProposalIds,
    pendingProposalIds
  });
}
