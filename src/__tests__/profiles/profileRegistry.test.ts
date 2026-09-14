import { expect, it } from "vitest";
import { createStandardProfileRegistry } from "../../profiles/profileRegistry";
import type { StandardProfile } from "../../profiles/types";

const base: StandardProfile = {
  id: "ACADEMIC-BASE",
  version: "1.0.0",
  name: "Academic Base",
  status: "verified",
  layer: "document-template",
  sourceIds: ["SRC"],
  ruleBindings: [{ ruleId: "RULE-1", enabled: true }]
};

it("rejects duplicate id+version", () => {
  expect(() => createStandardProfileRegistry([base, base], new Set(["RULE-1"])))
    .toThrow(/duplicate profile version/i);
});

it("rejects unknown rule bindings", () => {
  expect(() => createStandardProfileRegistry([base], new Set()))
    .toThrow(/unknown rule/i);
});

it("rejects circular parent inheritance", () => {
  const a: StandardProfile = { ...base, id: "A", parent: { id: "B", version: "1.0.0" } };
  const b: StandardProfile = { ...base, id: "B", parent: { id: "A", version: "1.0.0" } };
  expect(() => createStandardProfileRegistry([a, b], new Set(["RULE-1"]))).toThrow(/circular profile inheritance/i);
});

it("rejects unknown parent profile", () => {
  const child: StandardProfile = { ...base, id: "CHILD", parent: { id: "MISSING", version: "1.0.0" } };
  expect(() => createStandardProfileRegistry([child], new Set(["RULE-1"]))).toThrow(/unknown parent profile/i);
});
