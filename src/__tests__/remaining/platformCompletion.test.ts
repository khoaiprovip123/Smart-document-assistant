import { describe, expect, it } from "vitest";
import { createBuiltinDomainRegistry } from "../../domains/builtinDomainRegistry";
import { createTransactionStore } from "../../fixes/transactionStore";
import { buildTransactionHistoryView } from "../../fixes/transactionHistory";
import { buildV2AuditReport } from "../../preflight/auditReport";
import { summarizePerformanceSamples } from "../../qa/performanceSuite";
import { createDefaultWordDesktopReleaseMatrix } from "../../qa/defaultReleaseMatrix";
import { generateDraftProfile } from "../../templates/draftProfileGenerator";
import { buildReviewedDraft, createProfileReviewState, reviewProposal } from "../../templates/profileReview";
import { buildReviewedProfileExport, canSaveReviewedProfile } from "../../templates/profileExport";
import { evaluateV2Quality } from "../../v2/workflow";
import { buildWordCapabilityMatrix } from "../../word/capabilities";
import { createSemanticDocumentSnapshot } from "../../word/documentModel";

const capabilities = buildWordCapabilityMatrix(() => true);

function snapshot(text = "Nội dung") {
  return createSemanticDocumentSnapshot({
    capabilities,
    sections: [{ index: 0, pageSetup: { paperSize: "A4", topMarginPt: 56.7, bottomMarginPt: 56.7, leftMarginPt: 85.05, rightMarginPt: 56.7 } }],
    paragraphs: [{
      index: 0,
      text,
      style: "HPC.Normal",
      fontName: "Arial",
      fontSize: 11,
      alignment: "Left",
      semantic: { role: "body", confidence: 1, evidence: ["test"] }
    }],
    tables: [],
    fields: [],
    inlinePictures: [],
    comments: [],
    trackedChanges: []
  });
}

describe("remaining V2 review/export workflow", () => {
  it("blocks saving while learned proposals are pending and exports edited accepted rules as unverified", () => {
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
        confidence: 0.9,
        evidence: [{
          id: "body-font",
          kind: "body-typography",
          observed: "Times New Roman",
          occurrences: 3,
          confidence: 0.9,
          samples: ["A", "B"]
        }]
      },
      id: "LEARNED-REPORT",
      version: "0.1.0",
      name: "Learned Report",
      sourceId: "TRUSTED-TEMPLATE-LOCAL"
    });

    let state = createProfileReviewState(draft);
    expect(canSaveReviewedProfile(state)).toBe(false);
    expect(() => buildReviewedProfileExport(state)).toThrow(/pending/i);

    state = reviewProposal(state, draft.proposals[0].id, {
      decision: "accepted",
      requirement: { kind: "typography-font", roles: ["body"], allowedFontNames: ["Arial"] }
    });
    const reviewed = buildReviewedDraft(state);
    const exported = buildReviewedProfileExport(state);

    expect(canSaveReviewedProfile(state)).toBe(true);
    expect(reviewed.profile.status).toBe("unverified");
    expect(exported.profile.status).toBe("unverified");
    expect(exported.rules).toHaveLength(1);
    expect(exported.rules[0].requirement).toEqual({ kind: "typography-font", roles: ["body"], allowedFontNames: ["Arial"] });
    expect(exported.review.acceptedRuleIds).toEqual([draft.proposals[0].id]);
  });
});

describe("remaining V2 operator surfaces", () => {
  it("builds latest-first transaction history with rollback eligibility", () => {
    const store = createTransactionStore();
    store.record({ id: "tx-1", label: "First", before: snapshot("A"), findingIds: ["f1"], createdAt: "2026-09-14T01:00:00Z" });
    store.record({ id: "tx-2", label: "Second", before: snapshot("B"), findingIds: ["f2", "f3"], createdAt: "2026-09-14T02:00:00Z" });

    const view = buildTransactionHistoryView(store.history(), snapshot("B"));
    expect(view).toHaveLength(2);
    expect(view[0]).toEqual(expect.objectContaining({ id: "tx-2", findingCount: 2, isLatest: true, rollbackEligible: true }));
    expect(view[1]).toEqual(expect.objectContaining({ id: "tx-1", isLatest: false, rollbackEligible: false }));
  });

  it("generates an inspectable source-backed V2 audit report", () => {
    const registry = createBuiltinDomainRegistry();
    const report = evaluateV2Quality(registry, { id: "VN-ND30-ADMIN", version: "1.0.0" }, snapshot());
    const audit = buildV2AuditReport(report, "2026-09-14T06:00:00.000Z");

    expect(audit.profile).toEqual(expect.objectContaining({ id: "VN-ND30-ADMIN", version: "1.0.0" }));
    expect(audit.scannedAt).toBe("2026-09-14T06:00:00.000Z");
    expect(audit.sourceIds).toContain("VN-ND30-2020");
    expect(audit.unresolvedFindings.length).toBe(report.findings.length);
    expect(audit.preflightStatus).toBe(report.preflight.status);
  });
});

describe("remaining V2 QA/release qualification", () => {
  it("records performance measurements without inventing a target", () => {
    const exploratory = summarizePerformanceSamples({ label: "100-page synthetic", pageClass: "100-page", durationsMs: [100, 120, 110] });
    expect(exploratory.averageMs).toBe(110);
    expect(exploratory.p95Ms).toBe(120);
    expect(exploratory.targetDeclared).toBe(false);
    expect(exploratory.status).toBe("MEASURED_ONLY");

    const qualified = summarizePerformanceSamples({ label: "300-page synthetic", pageClass: "300-page", durationsMs: [300, 350, 400], thresholdMs: 450 });
    expect(qualified.targetDeclared).toBe(true);
    expect(qualified.status).toBe("PASS");
  });

  it("creates a pending Word Desktop release matrix instead of assuming support", () => {
    const matrix = createDefaultWordDesktopReleaseMatrix();
    expect(matrix.environments.length).toBeGreaterThan(0);
    expect(matrix.environments.some((item) => item.required)).toBe(true);
    expect(matrix.environments.every((item) => item.outcome === "not-run" && item.completedChecklist.length === 0)).toBe(true);
  });
});
