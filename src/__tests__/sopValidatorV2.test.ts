import { describe, expect, it } from "vitest";
import { getProfile } from "../config/rules";
import { validateSopStructure } from "../validators/sopValidator";

const p = (index: number, text: string) => ({ index, text });

describe("SOP validator v2", () => {
  it("detects duplicate required sections", () => {
    const findings = validateSopStructure(getProfile("HPC-SOP"), [
      p(0, "1. Mục đích"),
      p(1, "2. Phạm vi"),
      p(2, "3. Mục đích")
    ]);
    expect(findings.some((f) => f.ruleId === "SOP-DUPLICATE-SECTION" && f.severity === "warning")).toBe(true);
  });

  it("detects required sections that appear out of configured order", () => {
    const findings = validateSopStructure(getProfile("HPC-SOP"), [
      p(0, "1. Phạm vi"),
      p(1, "2. Mục đích")
    ]);
    expect(findings.some((f) => f.ruleId === "SOP-SECTION-ORDER" && f.severity === "warning")).toBe(true);
  });
});
