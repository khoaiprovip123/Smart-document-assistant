import { expect, it } from "vitest";
import { createStandardSourceRegistry } from "../../standards/sourceRegistry";
import { createStandardRuleRegistry } from "../../standards/ruleRegistry";
import { createStandardProfileRegistry } from "../../profiles/profileRegistry";
import type { StandardRule } from "../../standards/types";
import type { StandardProfile } from "../../profiles/types";

it("creates source, rule and profile registries without mutating inputs", () => {
  const source = { id: "SRC", title: "Source", issuer: "Issuer", sourceType: "custom" as const };
  const rule: StandardRule = {
    id: "RULE", title: "Rule", category: "structure", requirement: true,
    severity: "warning", fixPolicy: "review-required", sourceId: "SRC", scope: {}, enabled: true
  };
  const profile: StandardProfile = {
    id: "PROFILE", version: "1", name: "Profile", status: "unverified", layer: "custom",
    sourceIds: ["SRC"], ruleBindings: [{ ruleId: "RULE", enabled: true }]
  };

  const sources = createStandardSourceRegistry([source]);
  const rules = createStandardRuleRegistry([rule], sources);
  const profiles = createStandardProfileRegistry([profile], new Set(rules.all().map((x) => x.id)));

  expect(sources.require("SRC").title).toBe("Source");
  expect(rules.require("RULE").title).toBe("Rule");
  expect(profiles.require({ id: "PROFILE", version: "1" }).name).toBe("Profile");
  expect(source.title).toBe("Source");
});
