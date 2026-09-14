import type { CorpusManifestEntry } from "./corpusManifest";

export const WORD_DESKTOP_SMOKE_CHECKLIST = Object.freeze([
  "open",
  "classify/profile",
  "scan",
  "navigate",
  "preview",
  "fix safe",
  "rollback",
  "re-scan",
  "preflight"
] as const);

export type WordDesktopSmokeStep = (typeof WORD_DESKTOP_SMOKE_CHECKLIST)[number];
export type WordDesktopSmokeOutcome = "not-run" | "passed" | "failed";

export interface WordDesktopEnvironmentDefinition {
  id: string;
  label: string;
  required: boolean;
}

export interface WordDesktopEnvironmentResult extends WordDesktopEnvironmentDefinition {
  outcome: WordDesktopSmokeOutcome;
  completedChecklist: readonly WordDesktopSmokeStep[];
  notes?: string;
}

export interface WordDesktopReleaseMatrix {
  environments: readonly WordDesktopEnvironmentResult[];
}

export interface WordDesktopSmokeResultInput {
  outcome: Exclude<WordDesktopSmokeOutcome, "not-run">;
  completedChecklist: readonly WordDesktopSmokeStep[];
  notes?: string;
}

export interface CorpusObservationResult {
  entryId: string;
  passed: boolean;
  observedFindingRuleIds: readonly string[];
  missingExpectedFindingRuleIds: readonly string[];
  forbiddenObservedRuleIds: readonly string[];
}

export type ReleaseQualificationStatus = "QUALIFIED" | "PENDING_MANUAL" | "BLOCKED";

export interface ReleaseQualificationResult {
  status: ReleaseQualificationStatus;
  reasons: readonly string[];
  corpusPassed: boolean;
  requiredSmokePassed: boolean;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

export function evaluateCorpusObservation(
  entry: CorpusManifestEntry,
  observedFindingRuleIds: readonly string[]
): CorpusObservationResult {
  const observed = unique(observedFindingRuleIds.map((value) => value.trim()).filter(Boolean));
  const missingExpectedFindingRuleIds = Object.freeze(
    entry.expectedFindingRuleIds.filter((ruleId) => !observed.includes(ruleId))
  );
  const forbiddenObservedRuleIds = Object.freeze(
    entry.forbiddenFalsePositiveRuleIds.filter((ruleId) => observed.includes(ruleId))
  );

  return Object.freeze({
    entryId: entry.id,
    passed: missingExpectedFindingRuleIds.length === 0 && forbiddenObservedRuleIds.length === 0,
    observedFindingRuleIds: observed,
    missingExpectedFindingRuleIds,
    forbiddenObservedRuleIds
  });
}

export function createWordDesktopReleaseMatrix(
  environments: readonly WordDesktopEnvironmentDefinition[]
): WordDesktopReleaseMatrix {
  const ids = new Set<string>();
  const normalized = environments.map((environment) => {
    const id = required(environment.id, "Word Desktop environment id");
    if (ids.has(id)) throw new Error(`Duplicate Word Desktop environment id: ${id}`);
    ids.add(id);
    return Object.freeze({
      id,
      label: required(environment.label, "Word Desktop environment label"),
      required: environment.required,
      outcome: "not-run" as const,
      completedChecklist: Object.freeze([] as WordDesktopSmokeStep[])
    });
  });
  return Object.freeze({ environments: Object.freeze(normalized) });
}

export function recordWordDesktopSmokeResult(
  matrix: WordDesktopReleaseMatrix,
  environmentId: string,
  result: WordDesktopSmokeResultInput
): WordDesktopReleaseMatrix {
  const knownSteps = new Set<string>(WORD_DESKTOP_SMOKE_CHECKLIST);
  for (const step of result.completedChecklist) {
    if (!knownSteps.has(step)) throw new Error(`Unknown Word Desktop smoke step: ${step}`);
  }
  const completedChecklist = unique(result.completedChecklist);
  if (result.outcome === "passed" && WORD_DESKTOP_SMOKE_CHECKLIST.some((step) => !completedChecklist.includes(step))) {
    throw new Error("A passed Word Desktop smoke result must complete the full checklist");
  }

  let found = false;
  const environments = matrix.environments.map((environment) => {
    if (environment.id !== environmentId) return environment;
    found = true;
    return Object.freeze({
      ...environment,
      outcome: result.outcome,
      completedChecklist,
      notes: result.notes?.trim() || undefined
    });
  });
  if (!found) throw new Error(`Unknown Word Desktop environment: ${environmentId}`);
  return Object.freeze({ environments: Object.freeze(environments) });
}

export function evaluateReleaseQualification(input: {
  ciPassed: boolean;
  corpusResults: readonly CorpusObservationResult[];
  wordDesktopMatrix: WordDesktopReleaseMatrix;
}): ReleaseQualificationResult {
  const reasons: string[] = [];
  const corpusFailures = input.corpusResults.filter((result) => !result.passed);
  const requiredEnvironments = input.wordDesktopMatrix.environments.filter((environment) => environment.required);
  const failedRequiredEnvironments = requiredEnvironments.filter((environment) => environment.outcome === "failed");
  const pendingRequiredEnvironments = requiredEnvironments.filter((environment) => environment.outcome !== "passed");
  const corpusPassed = input.corpusResults.length > 0 && corpusFailures.length === 0;
  const requiredSmokePassed = requiredEnvironments.length > 0 && pendingRequiredEnvironments.length === 0;

  if (!input.ciPassed) reasons.push("CI gate chưa pass.");
  for (const failure of corpusFailures) {
    reasons.push(`Corpus ${failure.entryId} không đạt expected/forbidden finding contract.`);
  }
  for (const environment of failedRequiredEnvironments) {
    reasons.push(`Word Desktop smoke thất bại: ${environment.label}.`);
  }

  if (!input.ciPassed || corpusFailures.length > 0 || failedRequiredEnvironments.length > 0) {
    return Object.freeze({
      status: "BLOCKED",
      reasons: Object.freeze(reasons),
      corpusPassed,
      requiredSmokePassed
    });
  }

  if (input.corpusResults.length === 0) reasons.push("Chưa có corpus observation để release qualification.");
  if (requiredEnvironments.length === 0) reasons.push("Chưa khai báo Word Desktop environment bắt buộc.");
  for (const environment of pendingRequiredEnvironments) {
    reasons.push(`Chưa hoàn tất Word Desktop smoke: ${environment.label}.`);
  }

  if (!corpusPassed || !requiredSmokePassed) {
    return Object.freeze({
      status: "PENDING_MANUAL",
      reasons: Object.freeze(reasons),
      corpusPassed,
      requiredSmokePassed
    });
  }

  return Object.freeze({
    status: "QUALIFIED",
    reasons: Object.freeze([]),
    corpusPassed: true,
    requiredSmokePassed: true
  });
}
