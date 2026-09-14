import { describe, expect, it } from "vitest";
import { createStandardSourceRegistry, isSourceActiveAt } from "../../standards/sourceRegistry";
import type { StandardSource } from "../../standards/types";

const nd30: StandardSource = {
  id: "VN-GOV-ND30-2020",
  title: "Nghị định 30/2020/NĐ-CP",
  issuer: "Chính phủ Việt Nam",
  sourceType: "law",
  url: "https://vbpl.moj.gov.vn/bonoivu/Pages/vbpq-van-ban-goc.aspx?ItemID=141142",
  effectiveFrom: "2020-03-05",
  verifiedAt: "2026-09-14"
};

describe("standard source registry", () => {
  it("indexes a source by stable id", () => {
    const registry = createStandardSourceRegistry([nd30]);
    expect(registry.require("VN-GOV-ND30-2020").issuer).toBe("Chính phủ Việt Nam");
  });

  it("rejects duplicate source ids", () => {
    expect(() => createStandardSourceRegistry([nd30, nd30])).toThrow(/duplicate source id/i);
  });

  it("evaluates source lifecycle at a date", () => {
    expect(isSourceActiveAt(nd30, "2026-09-14")).toBe(true);
    expect(isSourceActiveAt({ ...nd30, effectiveTo: "2025-12-31" }, "2026-09-14")).toBe(false);
  });

  it("throws for an unknown required source", () => {
    const registry = createStandardSourceRegistry([nd30]);
    expect(() => registry.require("MISSING")).toThrow(/unknown standard source/i);
  });
});
