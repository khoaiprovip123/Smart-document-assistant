import { describe, expect, it } from "vitest";
import { assertSemanticRollbackSafe, createTransactionStore } from "../../fixes/transactionStore";
import { createWordCapabilityMatrix } from "../../word/capabilities";
import { createSemanticDocumentSnapshot } from "../../word/documentModel";

const capabilities = createWordCapabilityMatrix({ wordApi: "1.6", wordApiDesktop: "1.4" });

function snapshot(text = "Body", tableCount = 1) {
  return createSemanticDocumentSnapshot({
    capabilities,
    sections: [{ index: 0 }],
    paragraphs: [{ index: 0, uniqueLocalId: "p-1", text }],
    tables: Array.from({ length: tableCount }, (_, index) => ({ index })),
    fields: [],
    inlinePictures: [],
    comments: [],
    trackedChanges: []
  });
}

describe("change transaction store", () => {
  it("keeps multiple immutable transactions in LIFO order", () => {
    const store = createTransactionStore(2);
    const first = snapshot("A");
    store.record({ id: "tx-1", label: "First", before: first, findingIds: ["f1"] });
    store.record({ id: "tx-2", label: "Second", before: snapshot("B"), findingIds: ["f2"] });
    store.record({ id: "tx-3", label: "Third", before: snapshot("C"), findingIds: ["f3"] });

    expect(store.history().map((item) => item.id)).toEqual(["tx-2", "tx-3"]);
    expect(store.peek()?.id).toBe("tx-3");
    expect(store.pop()?.id).toBe("tx-3");
    expect(store.peek()?.id).toBe("tx-2");

    first.paragraphs[0].text = "MUTATED";
    expect(store.peek()?.before.paragraphs[0].text).toBe("B");
  });

  it("blocks rollback when semantic document structure or text has changed", () => {
    expect(() => assertSemanticRollbackSafe(snapshot("A"), snapshot("A"))).not.toThrow();
    expect(() => assertSemanticRollbackSafe(snapshot("A"), snapshot("Changed"))).toThrow(/rollback/i);
    expect(() => assertSemanticRollbackSafe(snapshot("A", 1), snapshot("A", 2))).toThrow(/rollback/i);
  });
});
