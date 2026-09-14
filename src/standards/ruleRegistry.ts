import type { RuleScope, StandardRule, StandardRuleRegistry, StandardSourceRegistry } from "./types";

function freezeScope(scope: RuleScope): RuleScope {
  const documentFamilies = scope.documentFamilies ? Object.freeze([...scope.documentFamilies]) : undefined;
  const documentTypes = scope.documentTypes ? Object.freeze([...scope.documentTypes]) : undefined;
  const profileTags = scope.profileTags ? Object.freeze([...scope.profileTags]) : undefined;
  return Object.freeze({ documentFamilies, documentTypes, profileTags });
}

export function createStandardRuleRegistry(
  rules: readonly StandardRule[],
  sources: StandardSourceRegistry
): StandardRuleRegistry {
  const byId = new Map<string, StandardRule>();

  for (const rule of rules) {
    const id = rule.id.trim();
    if (!id) throw new Error("Standard rule id is required");
    if (byId.has(id)) throw new Error(`Duplicate rule id: ${id}`);
    sources.require(rule.sourceId);

    byId.set(id, Object.freeze({ ...rule, id, scope: freezeScope(rule.scope) }));
  }

  const frozen = Object.freeze([...byId.values()]);

  return Object.freeze({
    all: () => frozen,
    has: (id: string) => byId.has(id),
    get: (id: string) => byId.get(id),
    require: (id: string) => {
      const value = byId.get(id);
      if (!value) throw new Error(`Unknown standard rule: ${id}`);
      return value;
    }
  });
}
