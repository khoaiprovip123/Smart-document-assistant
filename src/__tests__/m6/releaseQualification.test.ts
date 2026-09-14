import { describe, expect, it } from "vitest";
import { BUILTIN_QA_CORPUS } from "../../qa/builtinCorpus";
import {
  WORD_DESKTOP_SMOKE_CHECKLIST,
  createWordDesktopReleaseMatrix,
  evaluateCorpusObservation,
  evaluateReleaseQualification,
  recordWordDesktopSmokeResult
} from "../../qa/releaseQualification";


describe("M6 release qualification", () => {
  it("ships synthetic corpus metadata without pretending fixture snapshots are DOCX files", () => {
    expect(BUILTIN_QA_CORPUS.length).toBeGreaterThanOrEqual(4);
    expect(BUILTIN_QA_CORPUS.every((item) => item.artifactKind === "semantic-snapshot")).toBe(true);
    expect(BUILTIN_QA_CORPUS.every((item) => item.artifactPath.startsWith("fixture://"))).toBe(true);
  });

  it("covers administrative, academic, corporate and SOP families in the synthetic manifest", () => {
    expect(BUILTIN_QA_CORPUS.some((item) => item.family === "administrative")).toBe(true);
    expect(BUILTIN_QA_CORPUS.some((item) => item.family === "academic")).toBe(true);
    expect(BUILTIN_QA_CORPUS.some((item) => item.family === "corporate")).toBe(true);
    expect(BUILTIN_QA_CORPUS.some((item) => item.profile.id === "HPC-SOP-POLICY")).toBe(true);
  });

  it("fails a corpus observation for missing expected findings or forbidden false positives", () => {
    const entry = BUILTIN_QA_CORPUS.find((item) => item.id === "nd30-typography-invalid");
    expect(entry).toBeDefined();
    const missing = evaluateCorpusObservation(entry!, ["ND30-BODY-FONT"]);
    expect(missing.passed).toBe(false);
    expect(missing.missingExpectedFindingRuleIds.length).toBeGreaterThan(0);

    const falsePositive = evaluateCorpusObservation(entry!, [
      ...entry!.expectedFindingRuleIds,
      ...entry!.forbiddenFalsePositiveRuleIds
    ]);
    expect(falsePositive.passed).toBe(false);
    expect(falsePositive.forbiddenObservedRuleIds.length).toBeGreaterThan(0);
  });

  it("requires actual Word Desktop smoke completion before production qualification", () => {
    expect(WORD_DESKTOP_SMOKE_CHECKLIST).toEqual([
      "open",
      "classify/profile",
      "scan",
      "navigate",
      "preview",
      "fix safe",
      "rollback",
      "re-scan",
      "preflight"
    ]);

    let matrix = createWordDesktopReleaseMatrix([
      { id: "windows-m365", label: "Windows Microsoft 365 Word Desktop", required: true }
    ]);

    const corpusResults = BUILTIN_QA_CORPUS.map((entry) =>
      evaluateCorpusObservation(entry, entry.expectedFindingRuleIds)
    );

    expect(evaluateReleaseQualification({ ciPassed: true, corpusResults, wordDesktopMatrix: matrix }).status)
      .toBe("PENDING_MANUAL");

    matrix = recordWordDesktopSmokeResult(matrix, "windows-m365", {
      outcome: "passed",
      completedChecklist: WORD_DESKTOP_SMOKE_CHECKLIST,
      notes: "Pilot smoke completed on copied test document."
    });
    expect(evaluateReleaseQualification({ ciPassed: true, corpusResults, wordDesktopMatrix: matrix }).status)
      .toBe("QUALIFIED");
  });

  it("blocks release when CI, corpus, or required smoke environment fails", () => {
    let matrix = createWordDesktopReleaseMatrix([
      { id: "windows-m365", label: "Windows Microsoft 365 Word Desktop", required: true }
    ]);
    matrix = recordWordDesktopSmokeResult(matrix, "windows-m365", {
      outcome: "failed",
      completedChecklist: ["open", "classify/profile"],
      notes: "Task pane failed during scan."
    });
    expect(evaluateReleaseQualification({ ciPassed: true, corpusResults: [], wordDesktopMatrix: matrix }).status)
      .toBe("BLOCKED");
    expect(evaluateReleaseQualification({ ciPassed: false, corpusResults: [], wordDesktopMatrix: matrix }).status)
      .toBe("BLOCKED");
  });
});
