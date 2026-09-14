import { expect, it } from "vitest";
import { createStandardSourceRegistry } from "../../standards/sourceRegistry";

it("returns immutable source snapshots from the registry", () => {
  const registry = createStandardSourceRegistry([{ id: "S", title: "Source", issuer: "Issuer", sourceType: "custom" }]);
  expect(Object.isFrozen(registry.require("S"))).toBe(true);
  expect(Object.isFrozen(registry.all())).toBe(true);
});
