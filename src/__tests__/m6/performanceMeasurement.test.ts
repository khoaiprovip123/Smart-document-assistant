import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { createBuiltinDomainRegistry } from "../../domains/builtinDomainRegistry";
import { summarizePerformanceSamples } from "../../qa/performanceSuite";
import { evaluateV2Quality } from "../../v2/workflow";
import { buildWordCapabilityMatrix } from "../../word/capabilities";
import { createSemanticDocumentSnapshot } from "../../word/documentModel";

const capabilities = buildWordCapabilityMatrix(() => true);
const registry = createBuiltinDomainRegistry();

function syntheticLongSnapshot(paragraphCount: number) {
  return createSemanticDocumentSnapshot({
    capabilities,
    sections: [{ index: 0, pageSetup: { paperSize: "A4" } }],
    paragraphs: Array.from({ length: paragraphCount }, (_, index) => ({
      index,
      text: index % 17 === 0 ? `Synthetic  paragraph ${index},with punctuation.` : `Synthetic paragraph ${index}.`,
      style: "HPC.Normal",
      fontName: "Times New Roman",
      fontSize: 13,
      alignment: "Justified",
      semantic: { role: "body" as const, confidence: 1, evidence: ["synthetic-performance-fixture"] }
    })),
    tables: [],
    fields: [],
    inlinePictures: [],
    comments: [],
    trackedChanges: []
  });
}

function measure(paragraphCount: number, passes = 3): number[] {
  const snapshot = syntheticLongSnapshot(paragraphCount);
  return Array.from({ length: passes }, () => {
    const start = performance.now();
    evaluateV2Quality(registry, { id: "HPC-CORPORATE-BASE", version: "1.0.0" }, snapshot);
    return performance.now() - start;
  });
}

describe("M6 long-document performance measurement", () => {
  it("records 1,000-paragraph and 3,000-paragraph synthetic proxies without inventing a release target", () => {
    const medium = summarizePerformanceSamples({
      label: "synthetic-long-1000-paragraph-proxy",
      pageClass: "100-page",
      durationsMs: measure(1000)
    });
    const large = summarizePerformanceSamples({
      label: "synthetic-long-3000-paragraph-proxy",
      pageClass: "300-page",
      durationsMs: measure(3000)
    });

    expect(medium.sampleCount).toBe(3);
    expect(large.sampleCount).toBe(3);
    expect(medium.averageMs).toBeGreaterThanOrEqual(0);
    expect(large.p95Ms).toBeGreaterThanOrEqual(0);
    expect(medium.targetDeclared).toBe(false);
    expect(large.targetDeclared).toBe(false);
    expect(medium.status).toBe("MEASURED_ONLY");
    expect(large.status).toBe("MEASURED_ONLY");
  });
});
