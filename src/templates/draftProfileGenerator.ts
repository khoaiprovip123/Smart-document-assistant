import type { StandardProfile } from "../profiles/types";
import type { QualityRequirement } from "../quality/requirements";
import type { RuleCategory, StandardRule } from "../standards/types";
import type { TemplateEvidence, TrustedTemplateAnalysis } from "./templateAnalyzer";

export type LearnedRuleDecision = "pending" | "accepted" | "rejected";

export interface LearnedRuleProposal {
  id: string;
  rule: StandardRule<QualityRequirement>;
  confidence: number;
  evidence: readonly TemplateEvidence[];
  decision: LearnedRuleDecision;
}

export interface LearnedProfileDraft {
  profile: StandardProfile;
  proposals: readonly LearnedRuleProposal[];
  confidence: number;
  sourceId: string;
}

export interface DraftProfileGeneratorInput {
  analysis: TrustedTemplateAnalysis;
  id: string;
  version: string;
  name: string;
  sourceId: string;
}

const slug = (value: string): string => value.trim().toLocaleUpperCase("en-US").replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

function evidenceById(analysis: TrustedTemplateAnalysis, id: string): readonly TemplateEvidence[] {
  return Object.freeze(analysis.evidence.filter((item) => item.id === id));
}

function proposal(
  profileId: string,
  suffix: string,
  title: string,
  category: RuleCategory,
  requirement: QualityRequirement,
  confidence: number,
  evidence: readonly TemplateEvidence[],
  sourceId: string
): LearnedRuleProposal {
  const id = `${slug(profileId)}-LEARNED-${suffix}`;
  return Object.freeze({
    id,
    rule: Object.freeze({
      id,
      title,
      category,
      requirement: Object.freeze(requirement),
      severity: "suggestion" as const,
      fixPolicy: "review-required" as const,
      sourceId,
      sourceLocator: "Learned from explicitly trusted template; requires human review before registry import",
      scope: Object.freeze({ profileTags: Object.freeze(["learned-template", "unverified"]) }),
      enabled: true
    }),
    confidence,
    evidence: Object.freeze([...evidence]),
    decision: "pending" as const
  });
}

export function generateDraftProfile(input: DraftProfileGeneratorInput): LearnedProfileDraft {
  const proposals: LearnedRuleProposal[] = [];
  const analysis = input.analysis;

  if (analysis.dominantBodyFont) {
    const evidence = evidenceById(analysis, "body-font");
    proposals.push(proposal(
      input.id,
      "BODY-FONT",
      "Learned body font",
      "typography",
      { kind: "typography-font", roles: ["body"], allowedFontNames: [analysis.dominantBodyFont] },
      evidence[0]?.confidence ?? analysis.confidence,
      evidence,
      input.sourceId
    ));
  }

  if (typeof analysis.dominantBodySizePt === "number") {
    const evidence = evidenceById(analysis, "body-size");
    proposals.push(proposal(
      input.id,
      "BODY-SIZE",
      "Learned body font size",
      "typography",
      {
        kind: "typography-size-range",
        roles: ["body"],
        minPt: analysis.dominantBodySizePt,
        maxPt: analysis.dominantBodySizePt,
        preferredPt: analysis.dominantBodySizePt
      },
      evidence[0]?.confidence ?? analysis.confidence,
      evidence,
      input.sourceId
    ));
  }

  if (analysis.dominantBodyAlignment) {
    const evidence = evidenceById(analysis, "body-alignment");
    proposals.push(proposal(
      input.id,
      "BODY-ALIGNMENT",
      "Learned body alignment",
      "typography",
      { kind: "typography-alignment", roles: ["body"], expected: analysis.dominantBodyAlignment },
      evidence[0]?.confidence ?? analysis.confidence,
      evidence,
      input.sourceId
    ));
  }

  if (analysis.pageSetups.length > 0) {
    const paperSizes = analysis.pageSetups
      .map((setup) => setup.paperSize)
      .filter((value): value is string => typeof value === "string" && Boolean(value));
    const distinctPaperSizes = [...new Set(paperSizes)];
    if (distinctPaperSizes.length === 1) {
      const evidence = analysis.evidence.filter((item) => item.kind === "page-setup");
      proposals.push(proposal(
        input.id,
        "PAPER-SIZE",
        "Learned paper size",
        "layout",
        { kind: "layout-paper-size", expected: distinctPaperSizes[0] },
        paperSizes.length / analysis.pageSetups.length,
        evidence,
        input.sourceId
      ));
    }
  }

  const profile: StandardProfile = Object.freeze({
    id: input.id.trim(),
    version: input.version.trim(),
    name: input.name.trim(),
    status: "unverified",
    layer: "document-template",
    sourceIds: Object.freeze([input.sourceId.trim()]),
    tags: Object.freeze(["learned-template", "unverified"]),
    ruleBindings: Object.freeze([])
  });

  return Object.freeze({
    profile,
    proposals: Object.freeze(proposals),
    confidence: analysis.confidence,
    sourceId: input.sourceId.trim()
  });
}
