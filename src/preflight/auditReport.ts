import type { V2QualityReport } from "../v2/workflow";

export interface V2AuditFinding {
  id: string;
  ruleId: string;
  category: string;
  severity: string;
  title: string;
  message: string;
  fixPolicy: string;
  sourceId: string;
  sourceLocator?: string;
  location?: Readonly<{ sectionIndex?: number; paragraphIndex?: number; tableIndex?: number }>;
}

export interface V2AuditReport {
  schemaVersion: "1.0";
  scannedAt: string;
  profile: Readonly<{
    id: string;
    version: string;
    name: string;
    status: string;
  }>;
  preflightStatus: V2QualityReport["preflight"]["status"];
  health: V2QualityReport["health"];
  missingCapabilities: readonly string[];
  sourceIds: readonly string[];
  unresolvedFindings: readonly V2AuditFinding[];
}

export function buildV2AuditReport(report: V2QualityReport, scannedAt = new Date().toISOString()): V2AuditReport {
  const timestamp = scannedAt.trim();
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) {
    throw new Error("Audit report scannedAt must be a valid ISO-compatible timestamp.");
  }

  const sourceIds = Object.freeze([...new Set(report.findings.map((finding) => finding.provenance.sourceId))].sort());
  const unresolvedFindings = Object.freeze(report.findings.map((finding) => Object.freeze({
    id: finding.id,
    ruleId: finding.ruleId,
    category: finding.category,
    severity: finding.severity,
    title: finding.title,
    message: finding.message,
    fixPolicy: finding.fixPolicy,
    sourceId: finding.provenance.sourceId,
    sourceLocator: finding.provenance.sourceLocator,
    location: finding.location ? Object.freeze({ ...finding.location }) : undefined
  })));

  return Object.freeze({
    schemaVersion: "1.0" as const,
    scannedAt: timestamp,
    profile: Object.freeze({
      id: report.profile.id,
      version: report.profile.version,
      name: report.profile.name,
      status: report.profile.status
    }),
    preflightStatus: report.preflight.status,
    health: report.health,
    missingCapabilities: Object.freeze([...report.missingCapabilities]),
    sourceIds,
    unresolvedFindings
  });
}
