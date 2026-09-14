import { describe, expect, it } from "vitest";
import { createBuiltinDomainRegistry, ND30_COVERAGE } from "../../domains/builtinDomainRegistry";
import type { QualityRequirement } from "../../quality/requirements";
import { mmToPoints, nearlyEqual } from "../../utils/units";

describe("built-in V2 domain profiles", () => {
  it("registers an official source-backed ND30 profile without overstating coverage", () => {
    const registry = createBuiltinDomainRegistry();
    const source = registry.sources.require("VN-ND30-2020");
    const profile = registry.profiles.require({ id: "VN-ND30-ADMIN", version: "1.0.0" });

    expect(source.issuer).toBe("Chính phủ");
    expect(source.sourceType).toBe("law");
    expect(source.url).toContain("vanban.chinhphu.vn");
    expect(profile.status).toBe("verified");
    expect(profile.layer).toBe("legal");
    expect(profile.sourceIds).toContain("VN-ND30-2020");
    expect(ND30_COVERAGE.fullLegalCompliance).toBe(false);
    expect(ND30_COVERAGE.omittedConditionalRules.some((item) => item.includes("orientation"))).toBe(true);
  });

  it("encodes only supported verified ND30 layout/body requirements", () => {
    const registry = createBuiltinDomainRegistry();
    const profile = registry.profiles.require({ id: "VN-ND30-ADMIN", version: "1.0.0" });
    const requirements = profile.ruleBindings.map((binding) =>
      registry.rules.require(binding.ruleId).requirement as QualityRequirement
    );

    expect(requirements.some((item) => item.kind === "layout-paper-size" && item.expected === "A4")).toBe(true);
    expect(requirements.some((item) => item.kind === "layout-orientation")).toBe(false);
    expect(requirements.some((item) => item.kind === "typography-font" && item.allowedFontNames.includes("Times New Roman"))).toBe(true);
    expect(requirements.some((item) => item.kind === "typography-size-range" && item.minPt === 13 && item.maxPt === 14)).toBe(true);
    expect(requirements.some((item) => item.kind === "typography-alignment" && item.expected === "Justified")).toBe(true);

    const left = requirements.find((item) => item.kind === "layout-margin-range" && item.side === "left");
    expect(left?.kind).toBe("layout-margin-range");
    if (left?.kind === "layout-margin-range") {
      expect(nearlyEqual(left.minPt, mmToPoints(30))).toBe(true);
      expect(nearlyEqual(left.maxPt, mmToPoints(35))).toBe(true);
    }
  });

  it("keeps HPC corporate packs unverified until an approved HPC source exists", () => {
    const registry = createBuiltinDomainRegistry();
    for (const id of ["HPC-PROPOSAL", "HPC-REPORT", "HPC-MINUTES", "HPC-MEMO", "HPC-GUIDELINE"]) {
      const profile = registry.profiles.require({ id, version: "1.0.0" });
      expect(profile.status).toBe("unverified");
      expect(profile.layer).toBe("house-style");
      expect(profile.sourceIds).toContain("HPC-HOUSE-DRAFT");
    }
  });

  it("keeps the academic base neutral from institution-specific layout and typography", () => {
    const registry = createBuiltinDomainRegistry();
    const profile = registry.profiles.require({ id: "ACADEMIC-BASE", version: "1.0.0" });
    const requirements = profile.ruleBindings.map((binding) =>
      registry.rules.require(binding.ruleId).requirement as QualityRequirement
    );
    expect(profile.status).toBe("unverified");
    expect(requirements.some((item) => item.kind.startsWith("layout-") || item.kind.startsWith("typography-"))).toBe(false);
  });

  it("resolves every built-in profile without orphan rule bindings", () => {
    const registry = createBuiltinDomainRegistry();
    for (const profile of registry.profiles.all()) {
      for (const binding of profile.ruleBindings) expect(registry.rules.has(binding.ruleId)).toBe(true);
      for (const sourceId of profile.sourceIds) expect(registry.sources.has(sourceId)).toBe(true);
    }
  });
});
