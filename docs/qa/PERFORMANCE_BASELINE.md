# V2 Performance Baseline

## Status

`MEASURED_ONLY` — no production performance target is declared yet.

The CI suite includes deterministic long-document semantic proxies at 1,000 and 3,000 paragraphs. These measurements exercise the V2 quality pipeline and produce average/P95 timing data through `src/qa/performanceSuite.ts`, but they are **not equivalent to Microsoft Word pagination of real 100-page or 300+ page DOCX files**.

## Why no threshold is hard-coded

A threshold without representative Word Desktop documents, Office build information, machine class and document features would be fabricated. The project therefore records timing first and only changes the status from `MEASURED_ONLY` after a reviewed target is adopted.

## CI measurement scope

- Profile: `HPC-CORPORATE-BASE@1.0.0`.
- Synthetic load: 1,000 body paragraphs.
- Synthetic load: 3,000 body paragraphs.
- Three measurement passes per load.
- No fixed timing assertion; CI asserts that measurements are valid and that no undeclared target is treated as passed.

## Real Word Desktop qualification

Before declaring a performance SLO, run copied/authorized representative documents in Word Desktop and record at minimum:

- Office/Word build and update channel.
- Windows build.
- CPU/RAM class.
- Document page count and approximate paragraph/table/figure counts.
- Scan elapsed time for three or more runs.
- Fix/rollback elapsed time for representative safe mutations.
- Any capability gaps or Office.js errors.

Recommended corpus classes are approximately 100 pages and 300+ pages, but the actual acceptance threshold must be approved from measured HPC usage rather than inferred from the synthetic CI proxy.
