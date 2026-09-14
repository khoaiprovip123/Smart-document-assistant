import { describe, expect, it } from "vitest";
import { filterFindings } from "../ui/findingFilters";
import type { Finding } from "../types";

const finding = (id: string, severity: Finding["severity"], scope: Finding["scope"]): Finding => ({
  id,
  ruleId: id,
  severity,
  scope,
  title: id,
  message: id,
  autoFixable: false
});

describe("finding filters", () => {
  const findings = [
    finding("critical", "critical", "document"),
    finding("warning", "warning", "paragraph"),
    finding("capability", "warning", "capability"),
    finding("passed", "passed", "paragraph")
  ];

  it("hides passed findings by default", () => {
    expect(filterFindings(findings, "all").map((item) => item.id)).toEqual(["critical", "warning", "capability"]);
  });

  it("filters by severity without dropping capability warnings", () => {
    expect(filterFindings(findings, "warning").map((item) => item.id)).toEqual(["warning", "capability"]);
  });
});
