import { expect, it } from "vitest";
import type { StandardProfile } from "../../profiles/types";

it("keeps profile records JSON-serializable", () => {
  const profile: StandardProfile = {
    id: "SERIALIZABLE", version: "1.0.0", name: "Serializable", status: "draft",
    layer: "generic", sourceIds: [], ruleBindings: []
  };
  expect(JSON.parse(JSON.stringify(profile)).id).toBe("SERIALIZABLE");
});
