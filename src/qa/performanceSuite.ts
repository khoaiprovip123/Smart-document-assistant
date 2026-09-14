export type PerformancePageClass = "100-page" | "300-page" | "custom";
export type PerformanceStatus = "MEASURED_ONLY" | "PASS" | "FAIL";

export interface PerformanceSampleInput {
  label: string;
  pageClass: PerformancePageClass;
  durationsMs: readonly number[];
  thresholdMs?: number;
}

export interface PerformanceSummary {
  label: string;
  pageClass: PerformancePageClass;
  sampleCount: number;
  averageMs: number;
  p95Ms: number;
  maxMs: number;
  thresholdMs?: number;
  targetDeclared: boolean;
  status: PerformanceStatus;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function summarizePerformanceSamples(input: PerformanceSampleInput): PerformanceSummary {
  const label = input.label.trim();
  if (!label) throw new Error("Performance sample label is required.");
  if (input.durationsMs.length === 0) throw new Error("At least one performance duration is required.");
  if (input.durationsMs.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Performance durations must be finite non-negative numbers.");
  }
  if (input.thresholdMs !== undefined && (!Number.isFinite(input.thresholdMs) || input.thresholdMs <= 0)) {
    throw new Error("Performance threshold must be a positive finite number when declared.");
  }

  const sorted = [...input.durationsMs].sort((a, b) => a - b);
  const averageMs = round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length);
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  const p95Ms = round(sorted[p95Index]);
  const maxMs = round(sorted.at(-1) ?? 0);
  const targetDeclared = input.thresholdMs !== undefined;
  const status: PerformanceStatus = !targetDeclared
    ? "MEASURED_ONLY"
    : p95Ms <= input.thresholdMs!
      ? "PASS"
      : "FAIL";

  return Object.freeze({
    label,
    pageClass: input.pageClass,
    sampleCount: sorted.length,
    averageMs,
    p95Ms,
    maxMs,
    thresholdMs: input.thresholdMs,
    targetDeclared,
    status
  });
}
