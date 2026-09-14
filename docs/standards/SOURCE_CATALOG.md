# Standards Source Catalog

Verified: 2026-09-14

This catalog records authoritative or primary sources that may be used to build V2 standards profiles. A source appearing here does **not** mean all of its rules have already been encoded. Every encoded rule must still identify a precise source locator and review status.

## Source quality levels

- **A — Binding / normative:** law, regulation, official standard or mandatory institutional rule.
- **B — Official institutional/publisher guidance:** official university, publisher, professional organization or platform guidance.
- **C — General best practice:** official product/accessibility/editorial guidance that may be overridden by a higher-priority profile.

## Catalog

| Source ID | Quality | Scope | Version / status | Primary URL | V2 use |
|---|---|---|---|---|---|
| `VN-GOV-ND30-2020` | A | Vietnamese administrative records/document presentation | Nghị định 30/2020/NĐ-CP; effective 2020-03-05; national legal database reports **Còn hiệu lực** as checked 2026-09-14 | https://vbpl.moj.gov.vn/bonoivu/Pages/vbpq-van-ban-goc.aspx?ItemID=141142 | Base legal source for `VN-ND30` family; encode only verified Appendix/Article requirements with locators |
| `HCMUT-MASTER-FORMAT-2025` | A/B | HCMUT master's thesis | Official HCMUT postgraduate page dated 2025-07-28 with attached thesis-format and citation guidance | https://pgs.hcmut.edu.vn/vi/thong-bao/thac-si-tai-bach-khoa/item/91-cach-trinh-bay-luan-van-thac-si | Institution-specific academic profile; attachment must be reviewed before rule encoding |
| `HARVARD-GSAS-DISSERTATION` | A/B | Harvard Griffin GSAS dissertation | Current online guidance checked 2026-09-14 | https://gsas.harvard.edu/resource/dissertation-formatting-guidance | Demonstrates institution-specific page size, margins, spacing, font ranges, front-matter and pagination rules |
| `IEEE-JOURNAL-TEMPLATES` | B | IEEE journal manuscripts | Current IEEE Author Center templates/guidance checked 2026-09-14 | https://journals.ieeeauthorcenter.ieee.org/create-your-ieee-journal-article/authoring-tools-and-templates/tools-for-ieee-authors/ieee-article-templates/ | Publication/template selector source; do not claim one adapter matches every IEEE journal |
| `IEEE-AUTHOR-TOOLS` | B | IEEE article preparation/preflight | Current IEEE Author Center checked 2026-09-14 | https://journals.ieeeauthorcenter.ieee.org/create-your-ieee-journal-article/authoring-tools-and-templates/ | Model reference-validation/template/PDF-preflight workflow |
| `ISO-690-2021` | A | Bibliographic references and citations | ISO 690:2021, Edition 4, 2021-06 | https://www.iso.org/standard/72642.html | Citation/reference principles; implementation must respect licensed text and use only permitted/publicly verifiable requirements |
| `ISO-2145-1978` | A | Numbering divisions/subdivisions in written documents | ISO 2145:1978 Edition 2; ISO reports confirmed current in 2026 | https://www.iso.org/standard/6937.html | Generic numbering profile where no higher-priority institution/publisher scheme applies |
| `MS-WORD-ACCESSIBILITY` | C | Accessible Word documents | Microsoft Support guidance checked 2026-09-14 | https://support.microsoft.com/en-us/accessibility/word/make-your-word-documents-accessible-to-people-with-disabilities | Accessibility engine: semantic headings, alt text, meaningful links, real lists, table headers and simple table structures |
| `CHICAGO-MANUSCRIPT-PREP` | B/C | Book/journal manuscript preparation | Chicago Manual of Style manuscript-preparation resources checked 2026-09-14 | https://www.chicagomanualofstyle.org/help-tools/manuscript-prep.html | Publishing profile guidance; explicitly subordinate to individual publisher/journal instructions |
| `MLA-STYLE-CENTER` | B | MLA academic research paper/citations | MLA Style Center, authorized MLA website, checked 2026-09-14 | https://style.mla.org/mla-format/ | MLA adapter and paper-format profile; instructor/institution rules override generic MLA setup |
| `ICMJE-RECOMMENDATIONS-2026` | B | Biomedical scholarly manuscripts | ICMJE Recommendations updated January 2026 | https://www.icmje.org/recommendations/ | Medical-manuscript profile; journal-specific instructions remain higher priority |

## Source ingestion rules

1. Prefer official primary sources over blogs, summaries or third-party templates.
2. Record `verifiedAt` whenever a source is reviewed.
3. For legal/standards sources, record effective dates and status when available.
4. A source URL alone is insufficient: every encoded rule needs `sourceLocator` such as article, appendix, section or heading.
5. If the public page links an authoritative attachment (PDF/DOCX), inspect the attachment before encoding detailed numeric rules.
6. Institution/publisher instructions override generic citation/editorial conventions where legally permissible.
7. If two active sources conflict, the resolver must surface the conflict/precedence trace rather than silently choose based on load order.
8. Paid/copyrighted standards may be referenced by identity and publicly verifiable scope, but the repository must not copy protected standard text beyond what licensing permits.
9. `verified` profile status requires human review of source mappings; template-learning output starts as `unverified`.
10. Re-verify web-based sources before a major release or when the issuing body publishes an update.

## Research backlog

Add primary-source entries only after verification for:
- APA Style official paper-format/reference guidance;
- additional Vietnamese universities (UEH, FTU, NEU, VNU, etc.) based on their current official regulations/templates;
- specific Elsevier/Springer/Wiley journal instructions rather than generic publisher assumptions;
- NLM Citing Medicine for detailed biomedical reference formatting;
- institution-specific corporate/SOP controlled-document standards provided by authorized organizations.
