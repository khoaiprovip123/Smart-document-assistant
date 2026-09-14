import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TemplateReviewPanel from "../../ui/TemplateReviewPanel";
import { generateDraftProfile } from "../../templates/draftProfileGenerator";
import { createProfileReviewState } from "../../templates/profileReview";

function reviewState() {
  const draft = generateDraftProfile({
    analysis: {
      sectionCount: 1,
      dominantBodyFont: "Times New Roman",
      pageSetups: [],
      styles: [],
      headingPatterns: [],
      numberingExamples: [],
      captionStyles: [],
      headerFooterEvidence: [],
      confidence: 0.8,
      evidence: [{
        id: "body-font",
        kind: "body-typography",
        observed: "Times New Roman",
        occurrences: 2,
        confidence: 0.8,
        samples: ["A"]
      }]
    },
    id: "LEARNED-UI",
    version: "0.1.0",
    name: "Learned UI",
    sourceId: "LOCAL-TEMPLATE"
  });
  return createProfileReviewState(draft);
}

describe("TemplateReviewPanel", () => {
  it("renders evidence-backed pending proposals and keeps export disabled until review completes", () => {
    const state = reviewState();
    const proposal = state.proposals[0];
    const html = renderToStaticMarkup(
      <TemplateReviewPanel
        state={state}
        analysisConfidence={0.8}
        requirementJson={{ [proposal.id]: JSON.stringify(proposal.rule.requirement, null, 2) }}
        busy={false}
        onRequirementJsonChange={() => undefined}
        onApplyRequirement={() => undefined}
        onDecision={() => undefined}
        onExport={() => undefined}
        onReset={() => undefined}
      />
    );

    expect(html).toContain("Template Learning Review");
    expect(html).toContain("PENDING");
    expect(html).toContain("Times New Roman");
    expect(html).toContain("Xuất draft JSON");
    expect(html).toContain("disabled");
  });
});
