import { describe, expect, it } from "vitest";
import { createStandardSourceRegistry } from "../../standards/sourceRegistry";
import { createStandardRuleRegistry } from "../../standards/ruleRegistry";
import { createStandardProfileRegistry } from "../../profiles/profileRegistry";
import { profileLayerWeight, resolveProfiles, resolveRuleCandidates } from "../../profiles/resolveProfile";
import type { StandardRule } from "../../standards/types";
import type { StandardProfile } from "../../profiles/types";

const sources = createStandardSourceRegistry([
  { id: "SRC", title: "Source", issuer: "Issuer", sourceType: "institution" }
]);

const rule: StandardRule<number> = {
  id: "RULE-1",
  title: "Rule",
  category: "layout",
  requirement: 10,
  severity: "warning",
  fixPolicy: "review-required",
  sourceId: "SRC",
  scope: {},
  enabled: true
};

const rules = createStandardRuleRegistry([rule], sources);

describe("profile precedence resolver", () => {
  it("orders layers from legal to generic", () => {
    expect(profileLayerWeight("legal")).toBeGreaterThan(profileLayerWeight("institution-publisher"));
    expect(profileLayerWeight("custom")).toBeGreaterThan(profileLayerWeight("generic"));
  });

  it("chooses the higher-priority candidate and records the loser", () => {
    const result = resolveRuleCandidates("RULE-1", [
      { profileId: "GEN", profileVersion: "1", layer: "generic", requirement: 10 },
      { profileId: "LAW", profileVersion: "1", layer: "legal", requirement: 20 }
    ]);
    expect(result.winner.profileId).toBe("LAW");
    expect(result.trace.some((x) => x.profileId === "GEN" && x.outcome === "overridden")).toBe(true);
  });

  it("lets a child replace the same rule within its inheritance chain", () => {
    const base: StandardProfile = {
      id: "BASE", version: "1", name: "Base", status: "verified", layer: "document-template",
      sourceIds: ["SRC"], ruleBindings: [{ ruleId: "RULE-1", enabled: true, requirementOverride: 11 }]
    };
    const child: StandardProfile = {
      id: "CHILD", version: "1", name: "Child", status: "verified", layer: "document-template",
      sourceIds: ["SRC"], parent: { id: "BASE", version: "1" },
      ruleBindings: [{ ruleId: "RULE-1", enabled: true, requirementOverride: 12 }]
    };
    const profiles = createStandardProfileRegistry([base, child], new Set(["RULE-1"]));
    const resolved = resolveProfiles([{ id: "CHILD", version: "1" }], profiles, rules);
    expect(resolved.rules.get("RULE-1")?.profileId).toBe("CHILD");
    expect(resolved.rules.get("RULE-1")?.requirement).toBe(12);
  });

  it("keeps unrelated higher-layer candidates when a child disables its own candidate", () => {
    const legal: StandardProfile = {
      id: "LAW", version: "1", name: "Law", status: "verified", layer: "legal",
      sourceIds: ["SRC"], ruleBindings: [{ ruleId: "RULE-1", enabled: true, requirementOverride: 20 }]
    };
    const custom: StandardProfile = {
      id: "CUSTOM", version: "1", name: "Custom", status: "verified", layer: "custom",
      sourceIds: ["SRC"], ruleBindings: [{ ruleId: "RULE-1", enabled: false }]
    };
    const profiles = createStandardProfileRegistry([legal, custom], new Set(["RULE-1"]));
    const resolved = resolveProfiles([
      { id: "CUSTOM", version: "1" },
      { id: "LAW", version: "1" }
    ], profiles, rules);
    expect(resolved.rules.get("RULE-1")?.profileId).toBe("LAW");
  });

  it("uses stable id+version ordering for equal layer priority", () => {
    const result = resolveRuleCandidates("RULE-1", [
      { profileId: "B", profileVersion: "1", layer: "custom", requirement: 2 },
      { profileId: "A", profileVersion: "1", layer: "custom", requirement: 1 }
    ]);
    expect(result.winner.profileId).toBe("A");
  });
});
