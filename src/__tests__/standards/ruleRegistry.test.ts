import { describe, expect, it } from "vitest";
import { createStandardSourceRegistry } from "../../standards/sourceRegistry";
import { createStandardRuleRegistry } from "../../standards/ruleRegistry";
import type { StandardRule } from "../../standards/types";

const sources = createStandardSourceRegistry([{
  id: "SOURCE-1", title: "Source", issuer: "Issuer", sourceType: "institution"
}]);

const rule: StandardRule<number> = {
  id: "LAYOUT-MARGIN-LEFT",
  title: "Left margin",
  category: "layout",
  requirement: 30,
  severity: "critical",
  fixPolicy: "auto-with-preview",
  sourceId: "SOURCE-1",
  sourceLocator: "Section 2.1",
  scope: { documentFamilies: ["administrative"] },
  enabled: true
};

describe("standard rule registry", () => {
  it("registers a source-backed rule", () => {
    const registry = createStandardRuleRegistry([rule], sources);
    expect(registry.require(rule.id).sourceId).toBe("SOURCE-1");
  });

  it("rejects orphan source references", () => {
    expect(() => createStandardRuleRegistry([{ ...rule, sourceId: "MISSING" }], sources))
      .toThrow(/unknown standard source/i);
  });

  it("rejects duplicate rule ids", () => {
    expect(() => createStandardRuleRegistry([rule, rule], sources)).toThrow(/duplicate rule id/i);
  });
});
