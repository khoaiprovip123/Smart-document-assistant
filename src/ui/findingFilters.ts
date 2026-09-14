import type { Finding, Severity } from "../types";

export type FindingFilter = "all" | Exclude<Severity, "passed"> | "capability";

export function filterFindings(findings: Finding[], filter: FindingFilter): Finding[] {
  const unresolved = findings.filter((finding) => finding.severity !== "passed");
  if (filter === "all") return unresolved;
  if (filter === "capability") return unresolved.filter((finding) => finding.scope === "capability");
  return unresolved.filter((finding) => finding.severity === filter);
}
