import { describe, expect, it, vi } from "vitest";
import { executeFixAllSafe } from "../../fixes/fixExecutor";
import { createTransactionStore } from "../../fixes/transactionStore";
import type { QualityFindingV2 } from "../../quality/types";
import type { FixPolicy } from "../../standards/types";
import { buildWordCapabilityMatrix } from "../../word/capabilities";
import { createSemanticDocumentSnapshot } from "../../word/documentModel";

function finding(id: string, fixPolicy: FixPolicy): QualityFindingV2 {
  return {
    id,
    ruleId: `RULE-${id}`,
    category: "typography",
    severity: "warning",
    title: id,
    message: id,
    fixPolicy,
    provenance: {
      sourceId: "SRC",
      sourceTitle: "Source",
      issuer: "Issuer",
      profileId: "P",
      profileVersion: "1"
    }
  };
}

function snapshot() {
  return createSemanticDocumentSnapshot({
    capabilities: buildWordCapabilityMatrix(() => true),
    sections: [{ index: 0 }],
    paragraphs: [{ index: 0, uniqueLocalId: "p-1", text: "Body" }],
    tables: [],
    fields: [],
    inlinePictures: [],
    comments: [],
    trackedChanges: []
  });
}

describe("Fix All Safe executor", () => {
  it("never sends review-required or never-auto-fix findings to mutation", async () => {
    const store = createTransactionStore();
    const apply = vi.fn(async (_finding: QualityFindingV2) => undefined);
    const findings = [
      finding("safe", "auto-safe"),
      finding("preview", "auto-with-preview"),
      finding("review", "review-required"),
      finding("never", "never-auto-fix")
    ];

    const result = await executeFixAllSafe({
      findings,
      approvedPreviewFindingIds: new Set(["preview"]),
      before: snapshot(),
      store,
      apply,
      transactionId: "tx-1"
    });

    expect(apply.mock.calls.map(([item]) => item.id)).toEqual(["safe", "preview"]);
    expect(result.appliedFindingIds).toEqual(["safe", "preview"]);
    expect(result.skippedFindingIds).toEqual(["review", "never"]);
    expect(store.peek()?.id).toBe("tx-1");
    expect(store.peek()?.findingIds).toEqual(["safe", "preview"]);
  });

  it("does not create an empty transaction when nothing is safe to mutate", async () => {
    const store = createTransactionStore();
    const apply = vi.fn(async (_finding: QualityFindingV2) => undefined);
    const result = await executeFixAllSafe({
      findings: [finding("never", "never-auto-fix")],
      before: snapshot(),
      store,
      apply,
      transactionId: "tx-empty"
    });

    expect(result.appliedFindingIds).toEqual([]);
    expect(store.history()).toHaveLength(0);
    expect(apply).not.toHaveBeenCalled();
  });
});
