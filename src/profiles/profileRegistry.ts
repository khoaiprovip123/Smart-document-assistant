import type { ProfileRef, ProfileRuleBinding, StandardProfile, StandardProfileRegistry } from "./types";

const keyOf = (ref: ProfileRef): string => `${ref.id}@${ref.version}`;

function freezeBindings(bindings: readonly ProfileRuleBinding[]): readonly ProfileRuleBinding[] {
  return Object.freeze(bindings.map((binding) => Object.freeze({ ...binding })));
}

function freezeProfile(profile: StandardProfile): StandardProfile {
  const sourceIds = Object.freeze([...profile.sourceIds]);
  const tags = profile.tags ? Object.freeze([...profile.tags]) : undefined;
  const parent = profile.parent ? Object.freeze({ ...profile.parent }) : undefined;
  const ruleBindings = freezeBindings(profile.ruleBindings);

  return Object.freeze({
    ...profile,
    sourceIds,
    tags,
    parent,
    ruleBindings
  });
}

export function createStandardProfileRegistry(
  profiles: readonly StandardProfile[],
  knownRuleIds: ReadonlySet<string>
): StandardProfileRegistry {
  const byKey = new Map<string, StandardProfile>();

  for (const profile of profiles) {
    const key = keyOf(profile);
    if (byKey.has(key)) throw new Error(`Duplicate profile version: ${key}`);

    for (const binding of profile.ruleBindings) {
      if (!knownRuleIds.has(binding.ruleId)) throw new Error(`Unknown rule: ${binding.ruleId}`);
    }

    byKey.set(key, freezeProfile(profile));
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (profile: StandardProfile): void => {
    const key = keyOf(profile);
    if (visiting.has(key)) throw new Error(`Circular profile inheritance: ${key}`);
    if (visited.has(key)) return;

    visiting.add(key);
    if (profile.parent) {
      const parentKey = keyOf(profile.parent);
      const parent = byKey.get(parentKey);
      if (!parent) throw new Error(`Unknown parent profile: ${parentKey}`);
      visit(parent);
    }
    visiting.delete(key);
    visited.add(key);
  };

  byKey.forEach(visit);
  const frozen = Object.freeze([...byKey.values()]);

  return Object.freeze({
    all: () => frozen,
    get: (ref: ProfileRef) => byKey.get(keyOf(ref)),
    require: (ref: ProfileRef) => {
      const value = byKey.get(keyOf(ref));
      if (!value) throw new Error(`Unknown profile: ${keyOf(ref)}`);
      return value;
    }
  });
}
