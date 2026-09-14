import type { ProfileRef } from "../profiles/types";

export type CorpusArtifactKind = "docx" | "semantic-snapshot";

export interface CorpusSourceMetadata {
  title: string;
  license: string;
  url?: string;
}

export interface CorpusManifestEntry {
  id: string;
  family: string;
  profile: ProfileRef;
  artifactKind: CorpusArtifactKind;
  artifactPath: string;
  source: CorpusSourceMetadata;
  expectedFindingRuleIds: readonly string[];
  forbiddenFalsePositiveRuleIds: readonly string[];
  manualSmokeNotes: readonly string[];
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function unique(values: readonly string[], label: string): readonly string[] {
  const normalized = values.map((value) => required(value, label));
  if (new Set(normalized).size !== normalized.length) throw new Error(`Duplicate ${label}`);
  return Object.freeze(normalized);
}

function freezeEntry(entry: CorpusManifestEntry): CorpusManifestEntry {
  const artifactPath = required(entry.artifactPath, "artifact path");
  if (entry.artifactKind === "docx" && !artifactPath.toLocaleLowerCase("en-US").endsWith(".docx")) {
    throw new Error(`DOCX corpus artifact must use a .docx path: ${artifactPath}`);
  }
  if (entry.artifactKind === "semantic-snapshot" && !artifactPath.startsWith("fixture://")) {
    throw new Error(`Semantic snapshot corpus artifact must use fixture:// path: ${artifactPath}`);
  }

  const expected = unique(entry.expectedFindingRuleIds, "expected finding rule id");
  const forbidden = unique(entry.forbiddenFalsePositiveRuleIds, "forbidden false-positive rule id");
  const overlap = expected.find((ruleId) => forbidden.includes(ruleId));
  if (overlap) {
    throw new Error(`Rule ${overlap} cannot be both expected and forbidden false positive`);
  }

  const notes = unique(entry.manualSmokeNotes, "manual smoke note");
  if (notes.length === 0) throw new Error("At least one manual smoke note is required");

  return Object.freeze({
    id: required(entry.id, "corpus id"),
    family: required(entry.family, "document family"),
    profile: Object.freeze({
      id: required(entry.profile.id, "profile id"),
      version: required(entry.profile.version, "profile version")
    }),
    artifactKind: entry.artifactKind,
    artifactPath,
    source: Object.freeze({
      title: required(entry.source.title, "source title"),
      license: required(entry.source.license, "source license"),
      url: entry.source.url?.trim() || undefined
    }),
    expectedFindingRuleIds: expected,
    forbiddenFalsePositiveRuleIds: forbidden,
    manualSmokeNotes: notes
  });
}

export function validateCorpusManifest(entries: readonly CorpusManifestEntry[]): readonly CorpusManifestEntry[] {
  const ids = new Set<string>();
  const validated = entries.map((entry) => {
    const normalizedId = required(entry.id, "corpus id");
    if (ids.has(normalizedId)) throw new Error(`Duplicate corpus id: ${normalizedId}`);
    ids.add(normalizedId);
    return freezeEntry({ ...entry, id: normalizedId });
  });
  return Object.freeze(validated);
}
