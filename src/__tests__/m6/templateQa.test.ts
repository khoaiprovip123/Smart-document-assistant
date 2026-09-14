import { describe, expect, it } from "vitest";
import { analyzeTrustedTemplate } from "../../templates/templateAnalyzer";
import { generateDraftProfile } from "../../templates/draftProfileGenerator";
import { buildReviewedDraft, createProfileReviewState, reviewProposal } from "../../templates/profileReview";
import { getEngineFixtureLibrary } from "../../qa/fixtures";
import { validateCorpusManifest, type CorpusManifestEntry } from "../../qa/corpusManifest";
import { buildWordCapabilityMatrix } from "../../word/capabilities";
import { createSemanticDocumentSnapshot } from "../../word/documentModel";

const capabilities = buildWordCapabilityMatrix(() => true);

function trustedTemplateSnapshot() {
  return createSemanticDocumentSnapshot({
    capabilities,
    sections: [{
      index: 0,
      pageSetup: {
        paperSize: "A4",
        orientation: "Portrait",
        topMarginPt: 56.7,
        bottomMarginPt: 56.7,
        leftMarginPt: 85.05,
        rightMarginPt: 56.7
      },
      headerText: "HPC",
      footerText: "Page"
    }],
    paragraphs: [
      {
        index: 0,
        text: "BÁO CÁO",
        style: "HPC.Title",
        fontName: "Times New Roman",
        fontSize: 16,
        alignment: "Centered",
        semantic: { role: "title", confidence: 1, evidence: ["style:HPC.Title"] }
      },
      {
        index: 1,
        text: "1. Mục tiêu",
        style: "HPC.Heading1",
        fontName: "Times New Roman",
        fontSize: 14,
        listLevel: 0,
        listString: "1.",
        semantic: { role: "heading", headingLevel: 1, confidence: 1, evidence: ["style:HPC.Heading1"] }
      },
      {
        index: 2,
        text: "Nội dung thứ nhất",
        style: "HPC.Normal",
        fontName: "Times New Roman",
        fontSize: 13,
        alignment: "Justified",
        semantic: { role: "body", confidence: 1, evidence: ["test"] }
      },
      {
        index: 3,
        text: "Nội dung thứ hai",
        style: "HPC.Normal",
        fontName: "Times New Roman",
        fontSize: 13,
        alignment: "Justified",
        semantic: { role: "body", confidence: 1, evidence: ["test"] }
      },
      {
        index: 4,
        text: "Bảng 1. Kết quả",
        style: "HPC.Caption",
        fontName: "Times New Roman",
        fontSize: 12,
        semantic: { role: "caption", confidence: 1, evidence: ["style:HPC.Caption"] }
      }
    ],
    tables: [{ index: 0, rowCount: 2, columnCount: 2, style: "Grid Table 4" }],
    fields: [],
    inlinePictures: [],
    comments: [],
    trackedChanges: []
  });
}

describe("M6 trusted template learning", () => {
  it("extracts evidence without declaring the template authoritative", () => {
    const analysis = analyzeTrustedTemplate(trustedTemplateSnapshot());
    expect(analysis.sectionCount).toBe(1);
    expect(analysis.dominantBodyFont).toBe("Times New Roman");
    expect(analysis.dominantBodySizePt).toBe(13);
    expect(analysis.headingPatterns).toContainEqual(expect.objectContaining({ level: 1, style: "HPC.Heading1" }));
    expect(analysis.numberingExamples).toContain("1.");
    expect(analysis.captionStyles).toContain("HPC.Caption");
    expect(analysis.headerFooterEvidence).toContainEqual(expect.objectContaining({ headerText: "HPC", footerText: "Page" }));
    expect(analysis.confidence).toBeGreaterThan(0);
    expect(analysis.evidence.length).toBeGreaterThan(0);
  });

  it("always generates an unverified profile draft with evidence-backed proposals", () => {
    const draft = generateDraftProfile({
      analysis: analyzeTrustedTemplate(trustedTemplateSnapshot()),
      id: "LEARNED-HPC-REPORT",
      version: "0.1.0",
      name: "Learned HPC Report",
      sourceId: "TEMPLATE-HPC-REPORT"
    });
    expect(draft.profile.status).toBe("unverified");
    expect(draft.profile.layer).toBe("document-template");
    expect(draft.profile.sourceIds).toEqual(["TEMPLATE-HPC-REPORT"]);
    expect(draft.confidence).toBeGreaterThan(0);
    expect(draft.proposals.length).toBeGreaterThan(0);
    expect(draft.proposals.every((item) => item.decision === "pending" && item.evidence.length > 0)).toBe(true);
  });

  it("requires explicit review decisions before accepted learned rules can be exported", () => {
    const draft = generateDraftProfile({
      analysis: analyzeTrustedTemplate(trustedTemplateSnapshot()),
      id: "LEARNED-HPC-REPORT",
      version: "0.1.0",
      name: "Learned HPC Report",
      sourceId: "TEMPLATE-HPC-REPORT"
    });
    let state = createProfileReviewState(draft);
    expect(buildReviewedDraft(state).acceptedProposals).toHaveLength(0);

    state = reviewProposal(state, draft.proposals[0].id, { decision: "accepted" });
    state = reviewProposal(state, draft.proposals[1].id, { decision: "rejected" });
    const reviewed = buildReviewedDraft(state);
    expect(reviewed.profile.status).toBe("unverified");
    expect(reviewed.acceptedProposals.map((item) => item.id)).toEqual([draft.proposals[0].id]);
    expect(reviewed.rejectedProposalIds).toContain(draft.proposals[1].id);
  });
});

describe("M6 QA corpus foundations", () => {
  it("provides deterministic fixtures covering every P0 quality engine family", () => {
    const fixtures = getEngineFixtureLibrary();
    const engines = new Set(fixtures.map((item) => item.engine));
    expect(engines).toEqual(new Set([
      "layout",
      "typography",
      "structure",
      "heading-numbering",
      "table",
      "text-hygiene",
      "release-hygiene"
    ]));
    expect(fixtures.every((item) => Object.isFrozen(item.snapshot))).toBe(true);
    expect(new Set(fixtures.map((item) => item.id)).size).toBe(fixtures.length);
  });

  it("validates corpus metadata and forbids contradictory expectations", () => {
    const valid: CorpusManifestEntry[] = [{
      id: "admin-invalid-01",
      family: "administrative",
      profile: { id: "VN-ND30-ADMIN", version: "1.0.0" },
      artifactKind: "docx",
      artifactPath: "corpus/admin-invalid-01.docx",
      source: { title: "Synthetic QA document", license: "internal-test" },
      expectedFindingRuleIds: ["ND30-BODY-FONT"],
      forbiddenFalsePositiveRuleIds: ["ND30-PAPER-A4"],
      manualSmokeNotes: ["Open in Word Desktop and confirm font finding only."]
    }];
    expect(validateCorpusManifest(valid)).toHaveLength(1);

    expect(() => validateCorpusManifest([{ ...valid[0], artifactPath: "corpus/not-docx.txt" }])).toThrow(/docx/i);
    expect(() => validateCorpusManifest([valid[0], { ...valid[0] }])).toThrow(/duplicate/i);
    expect(() => validateCorpusManifest([{
      ...valid[0],
      forbiddenFalsePositiveRuleIds: ["ND30-BODY-FONT"]
    }])).toThrow(/expected.*forbidden|forbidden.*expected/i);
  });
});
