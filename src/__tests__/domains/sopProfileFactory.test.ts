import { describe, expect, it } from "vitest";
import { createSopProfileBundle } from "../../domains/sopProfileFactory";
import type { QualityRequirement } from "../../quality/requirements";

describe("SOP profile factory", () => {
  it("creates an unverified configurable profile from exact required sections", () => {
    const bundle = createSopProfileBundle({
      id: "HPC-SOP-CUSTOM",
      version: "1.0.0",
      name: "HPC SOP Custom",
      sourceId: "HPC-SOP-DRAFT",
      requiredSections: ["Mục đích", "Phạm vi", "Trách nhiệm", "Quy trình"]
    });

    expect(bundle.profile.status).toBe("unverified");
    expect(bundle.profile.layer).toBe("house-style");
    expect(bundle.profile.sourceIds).toEqual(["HPC-SOP-DRAFT"]);
    expect(bundle.rules).toHaveLength(4);
    expect(bundle.profile.ruleBindings).toHaveLength(4);

    const requirements = bundle.rules.map((rule) => rule.requirement as QualityRequirement);
    expect(requirements).toEqual([
      { kind: "structure-required-heading", text: "Mục đích" },
      { kind: "structure-required-heading", text: "Phạm vi" },
      { kind: "structure-required-heading", text: "Trách nhiệm" },
      { kind: "structure-required-heading", text: "Quy trình" }
    ]);
  });

  it("rejects empty and duplicate required section names", () => {
    expect(() => createSopProfileBundle({
      id: "BAD", version: "1", name: "Bad", sourceId: "SRC", requiredSections: ["Mục đích", " "]
    })).toThrow(/section/i);

    expect(() => createSopProfileBundle({
      id: "BAD2", version: "1", name: "Bad", sourceId: "SRC", requiredSections: ["Mục đích", "mục đích"]
    })).toThrow(/duplicate/i);
  });
});
