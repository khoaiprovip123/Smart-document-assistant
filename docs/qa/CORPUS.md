# V2 QA Corpus

## Current automated corpus

The repository currently ships **synthetic semantic snapshots**, not copied or fabricated DOCX files. They are deterministic fixtures used to verify expected findings and forbidden false positives.

| Corpus ID | Family | Profile | Fixture |
|---|---|---|---|
| `nd30-layout-invalid` | administrative | `VN-ND30-ADMIN@1.0.0` | `fixture://layout-invalid-paper-margin` |
| `nd30-typography-invalid` | administrative | `VN-ND30-ADMIN@1.0.0` | `fixture://typography-invalid-body` |
| `academic-text-hygiene-invalid` | academic | `ACADEMIC-BASE@1.0.0` | `fixture://text-hygiene-spacing` |
| `hpc-text-hygiene-invalid` | corporate | `HPC-CORPORATE-BASE@1.0.0` | `fixture://text-hygiene-spacing` |
| `hpc-release-hygiene-invalid` | corporate | `HPC-CORPORATE-BASE@1.0.0` | `fixture://release-hygiene-comments-revisions` |
| `hpc-sop-structure-invalid` | sop-policy | `HPC-SOP-POLICY@1.0.0` | `fixture://structure-missing-required-heading` |

Each manifest entry declares:

- document family/profile and version;
- source/license metadata;
- expected finding rule IDs;
- forbidden false-positive rule IDs;
- manual smoke notes.

## What is intentionally not claimed

- Synthetic fixtures are not `.docx` documents.
- Academic fixtures do not assert institution-specific fonts/margins without verified sources.
- `HPC-SOP-POLICY` remains an unverified draft baseline until HPC approves required sections.
- The ND30 profile covers only the verified/implemented subset documented in the repository.

## Real DOCX corpus requirement

V2-QA-003/004/005 should be extended with authorized representative Word documents before production qualification. Real files must not be committed unless their source/license and confidentiality status permit it. For internal or sensitive documents, use sanitized copies in the approved test environment rather than the public repository.

Recommended real-document coverage:

- Administrative: valid and intentionally invalid layout/typography documents.
- Academic: front matter, heading hierarchy, tables/figures and references.
- Corporate/SOP: metadata, required sections, revision history, comments/tracked changes and mixed formatting.

Release qualification must still include the Word Desktop smoke matrix even when all synthetic corpus tests are green.
