import type { StandardProfile } from "../profiles/types";
import type { QualityFindingV2 } from "../quality/types";

export type V2PreflightStatus = "READY" | "REVIEW_REQUIRED" | "BLOCKED";

export interface V2PreflightChecklistItem {
  id: "no-critical" | "no-warning" | "verified-profile" | "capabilities-complete";
  label: string;
  passed: boolean;
  blocking: boolean;
  message: string;
}

export interface V2PreflightInput {
  profileStatus: StandardProfile["status"];
  findings: readonly QualityFindingV2[];
  missingCapabilities: readonly string[];
}

export interface V2PreflightResult {
  status: V2PreflightStatus;
  blockingCount: number;
  reviewCount: number;
  suggestionCount: number;
  missingCapabilities: readonly string[];
  checklist: readonly V2PreflightChecklistItem[];
}

export function evaluateV2Preflight(input: V2PreflightInput): V2PreflightResult {
  const blockingCount = input.findings.filter((finding) => finding.severity === "critical").length;
  const warningCount = input.findings.filter((finding) => finding.severity === "warning").length;
  const suggestionCount = input.findings.filter((finding) => finding.severity === "suggestion").length;
  const profileVerified = input.profileStatus === "verified";
  const profileRetired = input.profileStatus === "retired";
  const capabilitiesComplete = input.missingCapabilities.length === 0;

  const checklist: readonly V2PreflightChecklistItem[] = Object.freeze([
    Object.freeze({
      id: "no-critical" as const,
      label: "Không còn lỗi Critical",
      passed: blockingCount === 0,
      blocking: true,
      message: blockingCount === 0 ? "Không còn lỗi chặn." : `Còn ${blockingCount} lỗi Critical.`
    }),
    Object.freeze({
      id: "no-warning" as const,
      label: "Không còn Warning cần xác nhận",
      passed: warningCount === 0,
      blocking: false,
      message: warningCount === 0 ? "Không còn Warning." : `Còn ${warningCount} Warning cần rà soát.`
    }),
    Object.freeze({
      id: "verified-profile" as const,
      label: "Profile đã được xác minh",
      passed: profileVerified,
      blocking: profileRetired,
      message: profileVerified
        ? "Profile đang ở trạng thái verified."
        : profileRetired
          ? "Profile đã retired và không còn phù hợp để phát hành."
          : `Profile đang ở trạng thái ${input.profileStatus}.`
    }),
    Object.freeze({
      id: "capabilities-complete" as const,
      label: "Word API đủ capability cho các kiểm tra yêu cầu",
      passed: capabilitiesComplete,
      blocking: false,
      message: capabilitiesComplete
        ? "Không có capability gap đã biết."
        : `Thiếu capability: ${input.missingCapabilities.join(", ")}.`
    })
  ]);

  const reviewCount =
    warningCount +
    (profileVerified ? 0 : 1) +
    input.missingCapabilities.length;

  const status: V2PreflightStatus =
    blockingCount > 0 || profileRetired
      ? "BLOCKED"
      : reviewCount > 0
        ? "REVIEW_REQUIRED"
        : "READY";

  return Object.freeze({
    status,
    blockingCount,
    reviewCount,
    suggestionCount,
    missingCapabilities: Object.freeze([...input.missingCapabilities]),
    checklist
  });
}
