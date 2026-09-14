import { expect, it } from "vitest";
import { createStandardProfileRegistry } from "../../profiles/profileRegistry";
import type { StandardProfile } from "../../profiles/types";

it("returns immutable profile snapshots from the registry", () => {
  const input: StandardProfile = {
    id: "P", version: "1", name: "Profile", status: "verified", layer: "generic",
    sourceIds: ["SRC"], ruleBindings: []
  };
  const registry = createStandardProfileRegistry([input], new Set());
  const stored = registry.require({ id: "P", version: "1" });
  expect(Object.isFrozen(stored)).toBe(true);
  expect(Object.isFrozen(stored.ruleBindings)).toBe(true);
});
