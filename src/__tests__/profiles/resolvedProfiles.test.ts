import { describe, expect, it } from "vitest";
import { createStandardSourceRegistry } from "../../standards/sourceRegistry";
import { createStandardRuleRegistry } from "../../standards/ruleRegistry";
import { createStandardProfileRegistry } from "../../profiles/profileRegistry";
import { resolveProfiles } from "../../profiles/resolveProfile";
import type { StandardRule } from "../../standards/types";
import type { StandardProfile } from "../../profiles/types";

const sourceRegistry = createStandardSourceRegistry([
  { id: "SRC", title: "Source", issuer: "Issuer", sourceType: "institution" }
]);

const rule: StandardRule<number> = {
  id: "RULE-1", title: "Rule", category: "layout", requirement: 10,
  severity: "warning", fixPolicy: "review-required", sourceId: "SRC", scope: {}, enabled: true
};
const ruleRegistry = createStandardRuleRegistry([rule], sourceRegistry);

describe("resolved profiles", () => {
  it("applies requirement overrides without mutating the registered rule", () => {
    const profile: StandardProfile = {
      id: "P", version: "1", name: "P", status: "verified", layer: "institution-publisher",
      sourceIds: ["SRC"], ruleBindings: [{ ruleId: "RULE-1", enabled: true, requirementOverride: 25 }]
    };
    const registry = createStandardProfileRegistry([profile], new Set(["RULE-1"]));
    const resolved = resolveProfiles([{ id: "P", version: "1" }], registry, ruleRegistry);
    expect(resolved.rules.get("RULE-1")?.requirement).toBe(25);
    expect(ruleRegistry.require("RULE-1").requirement).toBe(10);
  });
});
