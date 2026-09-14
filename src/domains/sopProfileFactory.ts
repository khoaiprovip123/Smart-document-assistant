import type { StandardProfile } from "../profiles/types";
import type { QualityRequirement } from "../quality/requirements";
import type { StandardRule } from "../standards/types";

export interface SopProfileBundleOptions {
  id: string;
  version: string;
  name: string;
  sourceId: string;
  requiredSections: readonly string[];
}

export interface SopProfileBundle {
  profile: StandardProfile;
  rules: readonly StandardRule<QualityRequirement>[];
}

const normalizeSection = (value: string): string => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");

function slugSection(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "SECTION";
}

export function createSopProfileBundle(options: SopProfileBundleOptions): SopProfileBundle {
  const normalized = options.requiredSections.map(normalizeSection);
  if (normalized.some((item) => !item)) throw new Error("SOP section name must not be empty");
  if (new Set(normalized).size !== normalized.length) throw new Error("Duplicate SOP section name");

  const rules = options.requiredSections.map((rawSection, index): StandardRule<QualityRequirement> => {
    const section = rawSection.trim().replace(/\s+/g, " ");
    return Object.freeze({
      id: `${options.id}-SECTION-${index + 1}-${slugSection(section)}`,
      title: `SOP required section: ${section}`,
      category: "structure",
      requirement: Object.freeze({ kind: "structure-required-heading", text: section }),
      severity: "warning",
      fixPolicy: "review-required",
      sourceId: options.sourceId,
      sourceLocator: `Required section: ${section}`,
      scope: Object.freeze({ documentFamilies: Object.freeze(["sop-policy"]) }),
      enabled: true
    });
  });

  const profile: StandardProfile = Object.freeze({
    id: options.id,
    version: options.version,
    name: options.name,
    status: "unverified",
    layer: "house-style",
    sourceIds: Object.freeze([options.sourceId]),
    tags: Object.freeze(["sop", "policy", "configurable", "draft"]),
    ruleBindings: Object.freeze(rules.map((rule) => Object.freeze({ ruleId: rule.id, enabled: true })))
  });

  return Object.freeze({ profile, rules: Object.freeze(rules) });
}
