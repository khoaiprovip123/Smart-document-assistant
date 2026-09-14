# Ribbon-first Word UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển thao tác chính của HPC Smart Document Assistant sang custom tab `HPC VĂN BẢN`, giữ Task Pane làm Detail Center.

**Architecture:** XML manifest dùng `PrimaryCommandSurface > CustomTab`. Các thao tác mutation ngắn gọi existing services qua một command dispatcher độc lập; các luồng dài/review dùng `ShowTaskpane`. Không bật SharedRuntime trong phase đầu.

**Tech Stack:** Office.js, Word JavaScript API, XML add-in-only manifest, TypeScript, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-14-ribbon-first-word-ux-design.md`

## Global Constraints

- Không sửa nội dung nghiệp vụ.
- Không auto-run `review-required` / `never-auto-fix`.
- Không bật V2 mutation adapter.
- Giữ safety/rollback hiện hữu.
- Custom tab yêu cầu AddinCommands 1.3; base manifest là fallback.
- Function command luôn gọi `event.completed()`.

---

### Task 1: Lock Ribbon manifest behavior with tests

**Files:**
- Create: `src/__tests__/ribbon/manifestRibbon.test.ts`
- Modify: `manifest.xml`

**Interfaces:**
- Produces custom tab id `HPC.Tab`, groups and function names used by Task 2.

- [ ] Write a failing test reading `manifest.xml` and asserting `CustomTab id="HPC.Tab"`, label `HPC VĂN BẢN`, required group IDs, and absence of `<OfficeTab id="TabHome">` in `PrimaryCommandSurface`.
- [ ] Run `npm test -- src/__tests__/ribbon/manifestRibbon.test.ts` and verify RED.
- [ ] Replace the single Home-tab group with the approved custom tab groups and resource strings.
- [ ] Add `AddinCommands` 1.3 requirement inside VersionOverrides.
- [ ] Run focused test and `npm run validate:manifest`.
- [ ] Commit manifest + test.

### Task 2: Add Ribbon command dispatcher with TDD

**Files:**
- Create: `src/ribbon/commandRegistry.ts`
- Create: `src/ribbon/ribbonCommands.ts`
- Create: `src/__tests__/ribbon/commandRegistry.test.ts`
- Modify: `commands.html`

**Interfaces:**
- Produces handlers `hpcRollback`, `hpcNormalizeSelection`, `hpcEnsureStyles`, `hpcStandardizeTables`, `hpcNumberHeadings`, `hpcManageToc`.
- Consumes existing services from `src/services/*`.

- [ ] Write failing registry test asserting exact command IDs and that every function command has a handler.
- [ ] Add lifecycle test with fake event and injected action proving `completed()` runs on success and thrown errors.
- [ ] Implement a small `runRibbonCommand(event, action)` wrapper with in-runtime busy guard and `finally { event.completed(); }`.
- [ ] Implement handlers using the existing services; use `getProfile("HPC-ND30")` only as conservative phase-1 default for profile-dependent direct commands.
- [ ] Associate handlers with `Office.actions.associate` after `Office.onReady`.
- [ ] Change `commands.html` to load the TypeScript module through Vite.
- [ ] Run focused tests + build.
- [ ] Commit.

### Task 3: Wire manifest actions to dispatcher and Detail Center

**Files:**
- Modify: `manifest.xml`
- Test: `src/__tests__/ribbon/manifestRibbon.test.ts`

**Interfaces:**
- Function commands map to Task 2 function names.
- Review/detail commands map to `ShowTaskpane` and `Taskpane.Url`.

- [ ] Extend manifest test to assert each direct button uses expected `ExecuteFunction/FunctionName` and each detail button uses `ShowTaskpane`.
- [ ] Run test RED.
- [ ] Add controls for KIỂM TRA, SỬA & HOÀN TÁC, ĐỊNH DẠNG, BẢNG, HEADING & MỤC LỤC, TIÊU CHUẨN, PHÁT HÀNH, CÔNG CỤ.
- [ ] Keep labels short and Vietnamese; put explanatory copy in Supertip.
- [ ] Run manifest test + validation.
- [ ] Commit.

### Task 4: Reduce Task Pane duplication safely

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/ui/V2OperationsPanel.tsx`
- Create: `src/__tests__/ui/detailCenter.test.tsx`

**Interfaces:**
- Task Pane remains capable of scan/findings/fix preview/profile/template/preflight/audit/settings.

- [ ] Write SSR test asserting heading `Trung tâm chi tiết` and core detail sections remain reachable.
- [ ] Keep existing functionality, but rename technical user-facing labels where low-risk (`Finding`→`Vấn đề`, `Preflight`→`Kiểm tra trước phát hành`, `Transaction History`→`Lịch sử thay đổi`).
- [ ] Do not remove old buttons that lack a verified Ribbon replacement; only demote/rename duplicate actions.
- [ ] Run UI tests + full unit suite.
- [ ] Commit.

### Task 5: Documentation and full verification

**Files:**
- Modify: `README.md`
- Modify: `INSTALL.md`
- Modify: `DEPLOYMENT.md`
- Modify: `CHANGELOG.md`

- [ ] Document `HPC VĂN BẢN` custom tab and direct-vs-detail command model.
- [ ] Add Word Desktop smoke checklist for every Ribbon command.
- [ ] Run `npm run build`.
- [ ] Run `npm test`.
- [ ] Run `npm run validate:manifest`.
- [ ] Generate production manifest with CI-compatible HTTPS origin and validate it through existing workflow.
- [ ] Confirm GitHub Actions on final HEAD passes production dependency audit, build, unit tests, development manifest and production manifest.
- [ ] Commit docs if not already included and record final HEAD.
