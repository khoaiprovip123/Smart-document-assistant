import { createStandardProfileRegistry } from "../profiles/profileRegistry";
import type { StandardProfile, StandardProfileRegistry } from "../profiles/types";
import type { QualityRequirement } from "../quality/requirements";
import { createStandardRuleRegistry } from "../standards/ruleRegistry";
import { createStandardSourceRegistry } from "../standards/sourceRegistry";
import type { StandardRule, StandardRuleRegistry, StandardSource, StandardSourceRegistry } from "../standards/types";
import { mmToPoints } from "../utils/units";
import { createSopProfileBundle } from "./sopProfileFactory";

export interface BuiltinDomainRegistry {
  sources: StandardSourceRegistry;
  rules: StandardRuleRegistry;
  profiles: StandardProfileRegistry;
}

export const ND30_COVERAGE = Object.freeze({
  fullLegalCompliance: false,
  sourceId: "VN-ND30-2020",
  profileId: "VN-ND30-ADMIN",
  implementedRuleIds: Object.freeze([
    "ND30-PAPER-A4",
    "ND30-MARGIN-TOP",
    "ND30-MARGIN-BOTTOM",
    "ND30-MARGIN-LEFT",
    "ND30-MARGIN-RIGHT",
    "ND30-BODY-FONT",
    "ND30-BODY-SIZE",
    "ND30-BODY-ALIGNMENT"
  ]),
  omittedConditionalRules: Object.freeze([
    "orientation: portrait is the default, but landscape is permitted for qualifying tables/figures; conditional scoping is not yet encoded"
  ]),
  notes: Object.freeze([
    "Coverage is limited to requirement kinds implemented by the V2 P0 engines.",
    "No full Nghị định 30/2020/NĐ-CP compliance claim is made."
  ])
});

const sources: readonly StandardSource[] = Object.freeze([
  Object.freeze({
    id: "VN-ND30-2020",
    title: "Nghị định số 30/2020/NĐ-CP về công tác văn thư - Phụ lục I",
    issuer: "Chính phủ",
    sourceType: "law",
    url: "https://vanban.chinhphu.vn/?docid=199378&pageid=27160",
    publicationDate: "2020-03-05",
    effectiveFrom: "2020-03-05",
    verifiedAt: "2026-09-14"
  }),
  Object.freeze({
    id: "HPC-HOUSE-DRAFT",
    title: "HPC internal document house style baseline - draft pending approval",
    issuer: "Hạo Phương Corporation",
    sourceType: "custom"
  }),
  Object.freeze({
    id: "HPC-SOP-DRAFT",
    title: "HPC SOP/Policy structure baseline - draft pending approval",
    issuer: "Hạo Phương Corporation",
    sourceType: "custom"
  }),
  Object.freeze({
    id: "SDA-GENERIC-QUALITY",
    title: "Smart Document Assistant neutral quality baseline",
    issuer: "HPC Smart Document Assistant",
    sourceType: "style-guide"
  })
]);

const marginRule = (
  id: string,
  side: "top" | "bottom" | "left" | "right",
  minMm: number,
  maxMm: number,
  preferredMm: number,
  locator: string
): StandardRule<QualityRequirement> => Object.freeze({
  id,
  title: `ND30 ${side} margin`,
  category: "layout",
  requirement: Object.freeze({
    kind: "layout-margin-range",
    side,
    minPt: mmToPoints(minMm),
    maxPt: mmToPoints(maxMm),
    preferredPt: mmToPoints(preferredMm)
  }),
  severity: "warning",
  fixPolicy: "auto-with-preview",
  sourceId: "VN-ND30-2020",
  sourceLocator: locator,
  scope: Object.freeze({ documentFamilies: Object.freeze(["administrative"]) }),
  enabled: true
});

const nd30Rules: readonly StandardRule<QualityRequirement>[] = Object.freeze([
  Object.freeze({
    id: "ND30-PAPER-A4",
    title: "Khổ giấy A4",
    category: "layout",
    requirement: Object.freeze({ kind: "layout-paper-size", expected: "A4" }),
    severity: "warning",
    fixPolicy: "auto-with-preview",
    sourceId: "VN-ND30-2020",
    sourceLocator: "Phụ lục I, Phần I, mục 1",
    scope: Object.freeze({ documentFamilies: Object.freeze(["administrative"]) }),
    enabled: true
  }),
  marginRule("ND30-MARGIN-TOP", "top", 20, 25, 20, "Phụ lục I, Phần I, mục 3"),
  marginRule("ND30-MARGIN-BOTTOM", "bottom", 20, 25, 20, "Phụ lục I, Phần I, mục 3"),
  marginRule("ND30-MARGIN-LEFT", "left", 30, 35, 30, "Phụ lục I, Phần I, mục 3"),
  marginRule("ND30-MARGIN-RIGHT", "right", 15, 20, 20, "Phụ lục I, Phần I, mục 3"),
  Object.freeze({
    id: "ND30-BODY-FONT",
    title: "Phông chữ nội dung hành chính",
    category: "typography",
    requirement: Object.freeze({ kind: "typography-font", roles: Object.freeze(["body"] as const), allowedFontNames: Object.freeze(["Times New Roman"]) }),
    severity: "warning",
    fixPolicy: "auto-with-preview",
    sourceId: "VN-ND30-2020",
    sourceLocator: "Phụ lục I, Phần I, mục 4; Phần II, mục 6.b",
    scope: Object.freeze({ documentFamilies: Object.freeze(["administrative"]) }),
    enabled: true
  }),
  Object.freeze({
    id: "ND30-BODY-SIZE",
    title: "Cỡ chữ nội dung hành chính",
    category: "typography",
    requirement: Object.freeze({ kind: "typography-size-range", roles: Object.freeze(["body"] as const), minPt: 13, maxPt: 14, preferredPt: 13 }),
    severity: "warning",
    fixPolicy: "auto-with-preview",
    sourceId: "VN-ND30-2020",
    sourceLocator: "Phụ lục I, Phần II, mục 6.b",
    scope: Object.freeze({ documentFamilies: Object.freeze(["administrative"]) }),
    enabled: true
  }),
  Object.freeze({
    id: "ND30-BODY-ALIGNMENT",
    title: "Căn đều nội dung hành chính",
    category: "typography",
    requirement: Object.freeze({ kind: "typography-alignment", roles: Object.freeze(["body"] as const), expected: "Justified" }),
    severity: "warning",
    fixPolicy: "auto-with-preview",
    sourceId: "VN-ND30-2020",
    sourceLocator: "Phụ lục I, Phần II, mục 6.b",
    scope: Object.freeze({ documentFamilies: Object.freeze(["administrative"]) }),
    enabled: true
  })
]);

const genericRules: readonly StandardRule<QualityRequirement>[] = Object.freeze([
  Object.freeze({
    id: "GEN-TEXT-DOUBLE-SPACES",
    title: "Khoảng trắng kép",
    category: "language-consistency",
    requirement: Object.freeze({ kind: "text-no-double-spaces" }),
    severity: "suggestion",
    fixPolicy: "review-required",
    sourceId: "SDA-GENERIC-QUALITY",
    sourceLocator: "Neutral quality baseline: spacing hygiene",
    scope: Object.freeze({}),
    enabled: true
  }),
  Object.freeze({
    id: "GEN-TEXT-PUNCTUATION",
    title: "Khoảng cách dấu câu",
    category: "language-consistency",
    requirement: Object.freeze({ kind: "text-punctuation-spacing" }),
    severity: "suggestion",
    fixPolicy: "review-required",
    sourceId: "SDA-GENERIC-QUALITY",
    sourceLocator: "Neutral quality baseline: punctuation hygiene",
    scope: Object.freeze({}),
    enabled: true
  }),
  Object.freeze({
    id: "GEN-RELEASE-NO-COMMENTS",
    title: "Không còn comment trước phát hành",
    category: "release-hygiene",
    requirement: Object.freeze({ kind: "release-no-comments" }),
    severity: "warning",
    fixPolicy: "never-auto-fix",
    sourceId: "SDA-GENERIC-QUALITY",
    sourceLocator: "Neutral release checklist: comments",
    scope: Object.freeze({}),
    enabled: true
  }),
  Object.freeze({
    id: "GEN-RELEASE-NO-TRACKED-CHANGES",
    title: "Không còn tracked changes trước phát hành",
    category: "release-hygiene",
    requirement: Object.freeze({ kind: "release-no-tracked-changes" }),
    severity: "warning",
    fixPolicy: "never-auto-fix",
    sourceId: "SDA-GENERIC-QUALITY",
    sourceLocator: "Neutral release checklist: tracked changes",
    scope: Object.freeze({}),
    enabled: true
  })
]);

const houseDraftRules: readonly StandardRule<QualityRequirement>[] = Object.freeze([
  Object.freeze({
    id: "HPC-DRAFT-BODY-FONT",
    title: "HPC draft body font",
    category: "typography",
    requirement: Object.freeze({ kind: "typography-font", roles: Object.freeze(["body"] as const), allowedFontNames: Object.freeze(["Times New Roman"]) }),
    severity: "warning",
    fixPolicy: "auto-with-preview",
    sourceId: "HPC-HOUSE-DRAFT",
    sourceLocator: "Draft baseline - pending HPC approval",
    scope: Object.freeze({ documentFamilies: Object.freeze(["corporate"]) }),
    enabled: true
  }),
  Object.freeze({
    id: "HPC-DRAFT-BODY-SIZE",
    title: "HPC draft body size",
    category: "typography",
    requirement: Object.freeze({ kind: "typography-size-range", roles: Object.freeze(["body"] as const), minPt: 13, maxPt: 14, preferredPt: 13 }),
    severity: "warning",
    fixPolicy: "auto-with-preview",
    sourceId: "HPC-HOUSE-DRAFT",
    sourceLocator: "Draft baseline - pending HPC approval",
    scope: Object.freeze({ documentFamilies: Object.freeze(["corporate"]) }),
    enabled: true
  }),
  Object.freeze({
    id: "HPC-DRAFT-BODY-ALIGNMENT",
    title: "HPC draft body alignment",
    category: "typography",
    requirement: Object.freeze({ kind: "typography-alignment", roles: Object.freeze(["body"] as const), expected: "Justified" }),
    severity: "warning",
    fixPolicy: "auto-with-preview",
    sourceId: "HPC-HOUSE-DRAFT",
    sourceLocator: "Draft baseline - pending HPC approval",
    scope: Object.freeze({ documentFamilies: Object.freeze(["corporate"]) }),
    enabled: true
  })
]);

const genericBindingIds = genericRules.map((rule) => rule.id);
const houseBindingIds = houseDraftRules.map((rule) => rule.id);

const nd30Profile: StandardProfile = Object.freeze({
  id: "VN-ND30-ADMIN",
  version: "1.0.0",
  name: "Vietnam Administrative - ND30 verified subset",
  status: "verified",
  layer: "legal",
  sourceIds: Object.freeze(["VN-ND30-2020"]),
  tags: Object.freeze(["administrative", "vietnam", "nd30", "verified-subset"]),
  ruleBindings: Object.freeze(nd30Rules.map((rule) => Object.freeze({ ruleId: rule.id, enabled: true })))
});

const corporateBase: StandardProfile = Object.freeze({
  id: "HPC-CORPORATE-BASE",
  version: "1.0.0",
  name: "HPC Corporate Base - draft",
  status: "unverified",
  layer: "house-style",
  sourceIds: Object.freeze(["HPC-HOUSE-DRAFT", "SDA-GENERIC-QUALITY"]),
  tags: Object.freeze(["hpc", "corporate", "draft"]),
  ruleBindings: Object.freeze([...houseBindingIds, ...genericBindingIds].map((ruleId) => Object.freeze({ ruleId, enabled: true })))
});

const corporateProfiles: readonly StandardProfile[] = Object.freeze([
  ["HPC-PROPOSAL", "HPC Tờ trình"],
  ["HPC-REPORT", "HPC Báo cáo"],
  ["HPC-MINUTES", "HPC Biên bản"],
  ["HPC-MEMO", "HPC Ghi nhớ"],
  ["HPC-GUIDELINE", "HPC Hướng dẫn"]
].map(([id, name]) => Object.freeze({
  id,
  version: "1.0.0",
  name: `${name} - draft`,
  status: "unverified" as const,
  layer: "house-style" as const,
  sourceIds: Object.freeze(["HPC-HOUSE-DRAFT", "SDA-GENERIC-QUALITY"]),
  parent: Object.freeze({ id: "HPC-CORPORATE-BASE", version: "1.0.0" }),
  tags: Object.freeze(["hpc", "corporate", id.replace("HPC-", "").toLocaleLowerCase("en-US"), "draft"]),
  ruleBindings: Object.freeze([])
})));

const academicBase: StandardProfile = Object.freeze({
  id: "ACADEMIC-BASE",
  version: "1.0.0",
  name: "Academic neutral base",
  status: "unverified",
  layer: "generic",
  sourceIds: Object.freeze(["SDA-GENERIC-QUALITY"]),
  tags: Object.freeze(["academic", "neutral", "no-institution-format"]),
  ruleBindings: Object.freeze(genericBindingIds.map((ruleId) => Object.freeze({ ruleId, enabled: true })))
});

const builtInSop = createSopProfileBundle({
  id: "HPC-SOP-POLICY",
  version: "1.0.0",
  name: "HPC SOP/Policy - draft",
  sourceId: "HPC-SOP-DRAFT",
  requiredSections: [
    "Mục đích",
    "Phạm vi",
    "Thuật ngữ",
    "Trách nhiệm",
    "Quy trình",
    "Hồ sơ và biểu mẫu",
    "Tài liệu tham chiếu",
    "Phụ lục",
    "Lịch sử sửa đổi"
  ]
});

export function createBuiltinDomainRegistry(): BuiltinDomainRegistry {
  const allRules: readonly StandardRule<QualityRequirement>[] = Object.freeze([
    ...nd30Rules,
    ...genericRules,
    ...houseDraftRules,
    ...builtInSop.rules
  ]);
  const sourceRegistry = createStandardSourceRegistry(sources);
  const ruleRegistry = createStandardRuleRegistry(allRules, sourceRegistry);
  const allProfiles: readonly StandardProfile[] = Object.freeze([
    nd30Profile,
    corporateBase,
    ...corporateProfiles,
    academicBase,
    builtInSop.profile
  ]);
  const profileRegistry = createStandardProfileRegistry(allProfiles, new Set(allRules.map((rule) => rule.id)));
  return Object.freeze({ sources: sourceRegistry, rules: ruleRegistry, profiles: profileRegistry });
}
