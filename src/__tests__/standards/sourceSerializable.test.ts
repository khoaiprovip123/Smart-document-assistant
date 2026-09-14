import { expect, it } from "vitest";
import type { StandardSource } from "../../standards/types";

it("keeps source records JSON-serializable", () => {
  const source: StandardSource = { id: "S", title: "S", issuer: "I", sourceType: "custom" };
  expect(JSON.parse(JSON.stringify(source)).id).toBe("S");
});
