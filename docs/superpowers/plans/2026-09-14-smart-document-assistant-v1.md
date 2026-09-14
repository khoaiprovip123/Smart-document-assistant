# Smart Document Assistant v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện Word Add-in thành nền tảng kiểm tra/chuẩn hóa tài liệu HPC an toàn, role-aware, có rollback, document tools, pre-release check và CI ổn định.

**Architecture:** Giữ Office.js adapter tách khỏi pure rule engine. Mở rộng `DocumentSnapshot` bằng role/list/table metadata, dùng classifier trước rule engine, mọi mutation đi qua snapshot transaction và re-scan.

**Tech Stack:** React 19, TypeScript 5.9, Fluent UI v9, Office.js Word API, Vite 7, Vitest 3.

**Spec:** `docs/superpowers/specs/2026-09-14-smart-document-assistant-v1-design.md`

## Global Constraints

- Không gửi nội dung tài liệu ra dịch vụ ngoài.
- Không tự sửa nội dung nghiệp vụ.
- Mixed/unknown formatting là manual-only.
- Auto-fix phải có rollback snapshot và chặn rollback nếu cấu trúc/text đã đổi.
- Không tuyên bố full legal compliance ngoài các rule đã triển khai.
- Main branch được người dùng cho phép chỉnh trực tiếp.

---

### Task 1: Document model + classifier

**Files:** `src/types.ts`, `src/rules/documentClassifier.ts`, `src/__tests__/documentClassifier.test.ts`

**Produces:** `classifyParagraph(paragraph): ParagraphRoleInfo` và metadata role/heading/list/table.

- [ ] Viết tests cho Heading style, HPC role style, list metadata và body fallback.
- [ ] Chạy test để xác nhận RED.
- [ ] Implement classifier pure, không phụ thuộc Office runtime.
- [ ] Chạy test GREEN.

### Task 2: Rule Engine v2 + normalized score

**Files:** `src/rules/ruleEngine.ts`, `src/__tests__/ruleEngine.test.ts`

**Consumes:** classifier từ Task 1.

- [ ] Thêm regression tests: body rule không áp lên signature/caption/list; heading rule riêng; score không sụp về 0 chỉ vì tài liệu dài; capability không làm giảm score.
- [ ] Implement role-aware evaluation và normalized compliance score.
- [ ] Chạy tests.

### Task 3: SOP/pre-release validation

**Files:** `src/validators/sopValidator.ts`, `src/validators/preReleaseValidator.ts`, tests tương ứng.

- [ ] Test missing/duplicate/out-of-order SOP section.
- [ ] Test release readiness: critical => blocked, warning => review, clean => ready.
- [ ] Implement validators pure.
- [ ] Chạy tests.

### Task 4: Safe mutation + navigation + table standardizer

**Files:** `src/services/wordService.ts`, `src/services/tableService.ts`, rollback tests.

- [ ] Bảo đảm normalize selection lưu snapshot trước mutation.
- [ ] Thêm `selectFinding` để điều hướng paragraph.
- [ ] Thêm table standardizer dùng WordApi 1.3 khi hỗ trợ; không sửa cell text.
- [ ] Giữ capability guard cho Word version cũ.

### Task 5: Complete HPC style blueprints

**Files:** `src/services/styleManager.ts`, `src/__tests__/styleManager.test.ts`

- [ ] Định nghĩa formatting riêng cho Title/SubTitle/Heading1..4/TableHeader/Caption/Note/Signature/Recipient/Appendix.
- [ ] Test blueprint output.
- [ ] Không overwrite style type xung đột.

### Task 6: UI/UX v1

**Files:** `src/App.tsx`, `src/styles.css`

- [ ] Dashboard score + release readiness.
- [ ] Severity filter và finding cards.
- [ ] Navigate to finding.
- [ ] Safe-fix selection; DRAFT warning.
- [ ] Table standardize action.
- [ ] Busy/error/status state nhất quán.

### Task 7: Deployment hardening

**Files:** `scripts/build-manifest.mjs`, `package.json`, `DEPLOYMENT.md`, `INSTALL.md`, `.github/workflows/ci.yml`.

- [ ] Thêm script sinh `manifest.production.xml` từ `ADDIN_ORIGIN`.
- [ ] CI validate development manifest và build/test.
- [ ] Tài liệu production không yêu cầu sửa XML thủ công.

### Task 8: Documentation + changelog

**Files:** `README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`.

- [ ] Đồng bộ module, feature, safety boundary và known limitations.
- [ ] Ghi rõ ND30 coverage hiện có.

### Task 9: Verification

- [ ] GitHub Actions: Build PASS.
- [ ] Vitest PASS.
- [ ] Manifest validation PASS.
- [ ] Kiểm tra HEAD main và diff cuối.
- [ ] Không claim Word Desktop smoke test cho đến khi người dùng test thực tế.
