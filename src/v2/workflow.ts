import type { BuiltinDomainRegistry } from "../domains/builtinDomainRegistry";
import { buildFixPreview } from "../fixes/fixPreview";
import type { ProfileRef, StandardProfile } from "../profiles/types";
import { resolveProfiles, type ResolvedProfile } from "../profiles/resolveProfile";
import { evaluateV2Preflight, type V2PreflightResult } from "../preflight/preflight";
import { createQualityContext } from "../quality/context";
import { summarizeDocumentHealth, type DocumentHealthSummary } from "../quality/healthDashboard";
import { isQualityRequirement } from "../quality/requirements";
import { runCoreQualityEngines } from "../quality/runCoreQualityEngines";
import type { QualityFindingV2 } from "../quality/types";
import type { FixPreviewItem } from "../fixes/fixPreview";
import type { SemanticDocumentSnapshot } from "../word/documentModel";

const LEGACY_PROFILE_MAP: Readonly<Record<string, ProfileRef>> = Object.freeze({
  "HPC-ND30": Object.freeze({ id: "VN-ND30-ADMIN", version: "1.0.0" }),
  "HPC-INTERNAL": Object.freeze({ id: "HPC-CORPORATE-BASE", version: "1.0.0" }),
  "HPC-SOP": Object.freeze({ id: "HPC-SOP-POLICY", version: "1.0.0" })
});

export interface V2QualityReport {
  profile: StandardProfile;
  resolvedProfile: ResolvedProfile;
  findings: readonly QualityFindingV2[];
  health: DocumentHealthSummary;
  preview: readonly FixPreviewItem[];
  missingCapabilities: readonly string[];
  preflight: V2PreflightResult;
}

export function resolveLegacyProfileRef(legacyProfileId: string): ProfileRef | undefined {
  const ref = LEGACY_PROFILE_MAP[legacyProfileId];
  return ref ? { ...ref } : undefined;
}

function collectMissingCapabilities(
  resolvedProfile: ResolvedProfile,
  document: SemanticDocumentSnapshot
): readonly string[] {
  const missing = new Set<string>();

  for (const resolvedRule of resolvedProfile.rules.values()) {
    if (!isQualityRequirement(resolvedRule.requirement)) continue;

    switch (resolvedRule.requirement.kind) {
      case "layout-paper-size":
      case "layout-orientation":
      case "layout-margin-range":
        if (!document.capabilities.pageSetupDesktop) missing.add("pageSetupDesktop");
        break;
      case "release-no-comments":
        if (!document.capabilities.commentsFields) missing.add("commentsFields");
        break;
      case "release-no-tracked-changes":
        if (!document.capabilities.trackedChanges) missing.add("trackedChanges");
        break;
      default:
        break;
    }
  }

  return Object.freeze([...missing].sort());
}

export function evaluateV2Quality(
  registry: BuiltinDomainRegistry,
  profileRef: ProfileRef,
  document: SemanticDocumentSnapshot
): V2QualityReport {
  const profile = registry.profiles.require(profileRef);
  const resolvedProfile = resolveProfiles([profileRef], registry.profiles, registry.rules);
  const context = createQualityContext(document, resolvedProfile, registry.sources);
  const findings = Object.freeze(runCoreQualityEngines(context));
  const missingCapabilities = collectMissingCapabilities(resolvedProfile, document);
  const health = summarizeDocumentHealth(findings);
  const preview = buildFixPreview(findings);
  const preflight = evaluateV2Preflight({
    profileStatus: profile.status,
    findings,
    missingCapabilities
  });

  return Object.freeze({
    profile,
    resolvedProfile,
    findings,
    health,
    preview,
    missingCapabilities,
    preflight
  });
}
