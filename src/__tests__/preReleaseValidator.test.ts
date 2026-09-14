import { describe, expect, it } from "vitest";
import { evaluateReleaseReadiness } from "../validators/preReleaseValidator";
import type { DocumentCheckResult, Finding } from "../types";

const finding = (severity: Finding["severity"], scope: Finding["scope"] = "paragraph"): Finding => ({
  id: `${severity}-${scope}`,
  ruleId: `${severity}-${scope}`,
  severity,
  scope,
  title: "Test",
  message: "Test",
  autoFixable: false
});

const result = (findings: Finding[]): DocumentCheckResult => ({
  profileId: "HPC-ND30",
  checkedAt: new Date(0).toISOString(),
  score: 90,
  findings,
  counts: {
    critical: findings.filter((f) => f.severity === "critical").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    suggestion: findings.filter((f) => f.severity === "suggestion").length,
    passed: findings.filter((f) => f.severity === "passed").length
  }
});

describe("pre-release validator", () => {
  it("blocks release when a critical finding exists", () => {
    expect(evaluateReleaseReadiness(result([finding("critical")]))).toMatchObject({ status: "blocked" });
  });

  it("requires review for warnings but ignores capability warnings as blockers", () => {
    expect(evaluateReleaseReadiness(result([finding("warning")]))).toMatchObject({ status: "review" });
    expect(evaluateReleaseReadiness(result([finding("warning", "capability")]))).toMatchObject({ status: "ready" });
  });

  it("marks clean documents ready", () => {
    expect(evaluateReleaseReadiness(result([finding("passed")]))).toMatchObject({ status: "ready" });
  });
});
