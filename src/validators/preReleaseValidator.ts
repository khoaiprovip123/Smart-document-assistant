import type { DocumentCheckResult } from "../types";

export type ReleaseStatus = "ready" | "review" | "blocked";

export interface ReleaseReadiness {
  status: ReleaseStatus;
  label: string;
  message: string;
  blockingCount: number;
  reviewCount: number;
  capabilityCount: number;
}

export function evaluateReleaseReadiness(result: DocumentCheckResult): ReleaseReadiness {
  const substantive = result.findings.filter((finding) => finding.scope !== "capability");
  const blockingCount = substantive.filter((finding) => finding.severity === "critical").length;
  const reviewCount = substantive.filter((finding) => finding.severity === "warning").length;
  const capabilityCount = result.findings.filter((finding) => finding.scope === "capability").length;

  if (blockingCount > 0) {
    return {
      status: "blocked",
      label: "Chưa sẵn sàng phát hành",
      message: `Còn ${blockingCount} lỗi Critical cần xử lý trước khi phát hành.`,
      blockingCount,
      reviewCount,
      capabilityCount
    };
  }

  if (reviewCount > 0) {
    return {
      status: "review",
      label: "Cần rà soát",
      message: `Không còn Critical nhưng còn ${reviewCount} Warning cần người dùng xác nhận.`,
      blockingCount,
      reviewCount,
      capabilityCount
    };
  }

  return {
    status: "ready",
    label: "Sẵn sàng theo rule hiện có",
    message:
      capabilityCount > 0
        ? `Không phát hiện lỗi chặn theo rule đã kiểm tra; có ${capabilityCount} giới hạn API cần lưu ý.`
        : "Không phát hiện lỗi chặn theo rule đã kiểm tra.",
    blockingCount,
    reviewCount,
    capabilityCount
  };
}
