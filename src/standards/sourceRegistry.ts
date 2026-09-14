import type { StandardSource, StandardSourceRegistry } from "./types";

function compareIsoDate(left: string, right: string): number {
  return left.localeCompare(right);
}

export function isSourceActiveAt(source: StandardSource, date: string): boolean {
  if (source.effectiveFrom && compareIsoDate(date, source.effectiveFrom) < 0) return false;
  if (source.effectiveTo && compareIsoDate(date, source.effectiveTo) > 0) return false;
  return true;
}

export function createStandardSourceRegistry(sources: readonly StandardSource[]): StandardSourceRegistry {
  const byId = new Map<string, StandardSource>();

  for (const source of sources) {
    const id = source.id.trim();
    if (!id) throw new Error("Standard source id is required");
    if (byId.has(id)) throw new Error(`Duplicate source id: ${id}`);

    const frozenSource = Object.freeze({ ...source, id });
    byId.set(id, frozenSource);
  }

  const frozen = Object.freeze([...byId.values()]);

  return Object.freeze({
    all: () => frozen,
    has: (id: string) => byId.has(id),
    get: (id: string) => byId.get(id),
    require: (id: string) => {
      const value = byId.get(id);
      if (!value) throw new Error(`Unknown standard source: ${id}`);
      return value;
    }
  });
}
