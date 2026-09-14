import { describe, expect, it } from "vitest";
import { parseRuleProfiles } from "../config/profileLoader";
import { getProfile } from "../config/rules";

describe("rule profile JSON loader", () => {
  it("loads valid profile JSON", () => {
    const profile = getProfile("HPC-ND30");
    const loaded = parseRuleProfiles(JSON.stringify([profile]));
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("HPC-ND30");
  });

  it("rejects profiles without required page/body configuration", () => {
    expect(() => parseRuleProfiles(JSON.stringify([{ id: "BROKEN", name: "Broken" }]))).toThrow(/không hợp lệ/i);
  });

  it("rejects duplicate profile ids", () => {
    const profile = getProfile("HPC-ND30");
    expect(() => parseRuleProfiles(JSON.stringify([profile, profile]))).toThrow(/trùng/i);
  });
});
