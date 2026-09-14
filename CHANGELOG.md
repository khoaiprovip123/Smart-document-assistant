# Changelog

## Unreleased

### Semantic Table Formatting & Persistent Word Mode

- Thay cơ chế chuẩn hóa bảng dùng một alignment chung bằng semantic column alignment:
  - STT/mã/ngày/trạng thái → giữa.
  - Số lượng/đơn giá/thành tiền/tỷ lệ → phải.
  - Tên/nội dung/mô tả/ghi chú → trái.
  - Cột mơ hồ hoặc confidence thấp → giữ nguyên.
- Tách `Word.Table.alignment` (vị trí bảng trên trang) khỏi `TableCell.horizontalAlignment`; không còn dùng `table.horizontalAlignment` để ép mọi cell cùng một kiểu căn.
- Thêm `table-semantic-alignment` quality requirement và semantic snapshot `values/horizontalAlignment` để phát hiện bảng bị áp uniform alignment quá mức; `Mixed/Unknown` không bị đoán.
- Thêm document-level auto-open bằng `Office.AutoShowTaskpaneWithDocument` và UI `Luôn mở HPC Assistant cùng tài liệu này`.
- `npm run start:word` chuyển thành lệnh hướng dẫn Persistent Word Mode và không còn tự mở Word/document trắng.
- Debug launcher đổi sang `npm run debug:word`; stop bằng `npm run debug:word:stop`.
- Cập nhật `INSTALL.md`, `DEPLOYMENT.md`, `README.md` cho production hosting HTTPS + Microsoft 365 Integrated Apps rollout.
- Production dependency audit tiếp tục là blocking CI gate; full dev/toolchain audit chỉ diagnostic, không dùng `npm audit fix --force` tự động.
- Production approval vẫn yêu cầu Word Desktop smoke test thực tế, gồm semantic table alignment và save/close/reopen document auto-open.

### V2 Document Standards Platform

- Hoàn tất M1 Standards Foundation: source registry, rule registry, profile registry, precedence resolution và provenance.
- Hoàn tất M2 Semantic Document Model: capability matrix, section/paragraph/table/field/picture/comment/tracked-change snapshot, semantic role classifier và Word adapter.
- Hoàn tất M3 Core Quality Engines: layout, typography, structure, heading hierarchy, table, text-quality, release hygiene và deterministic aggregate runner.
- Hoàn tất M4 Domain Profiles:
  - `VN-ND30-ADMIN` là **verified subset** dựa trên nguồn Chính phủ; không tuyên bố full legal compliance.
  - Không mã hóa orientation Portrait thành rule cứng vì ND30 có trường hợp cho phép trang ngang và engine hiện chưa biểu diễn đủ điều kiện ngoại lệ.
  - `HPC-CORPORATE-BASE`, Tờ trình/Báo cáo/Biên bản/Ghi nhớ/Hướng dẫn, `HPC-SOP-POLICY` và `ACADEMIC-BASE` giữ trạng thái `unverified` cho đến khi có nguồn/quy định được phê duyệt.
- Hoàn tất M5 Safe Fix & Preflight core:
  - Fix policy `auto-safe` / `auto-with-preview` / `review-required` / `never-auto-fix`.
  - `Fix All Safe` executor chặn `review-required` và `never-auto-fix` trước mutation boundary.
  - Transaction history nhiều bước, immutable snapshot và structure-safe rollback guard.
  - Source-backed Fix Preview, Document Health dashboard và V2 Preflight `READY` / `REVIEW_REQUIRED` / `BLOCKED`.
  - V2 workflow orchestration: V1 system-profile mapping → semantic snapshot → resolved profile → engines → health/preview/preflight.
  - Task Pane hiển thị V2 health, fixability, provenance preview, capability gaps và preflight song song với V1 compatibility.
- Hoàn tất M6 core: Template Analyzer, UNVERIFIED Draft Generator, Profile Review UI, Audit Report, synthetic QA corpus, performance measurement proxy và Word Desktop release matrix.
- V2 Word mutation adapter vẫn ở chế độ preview/policy architecture; mutation thực tế tiếp tục dùng V1 compatibility cho đến khi V2 adapter qua Word Desktop smoke test.
- CI kiểm chứng các gate bằng production dependency audit + Build + Unit Tests + development/production manifest validation.

### Planning / source governance

- Thêm V2 architecture cho Document Standards Platform đa chuẩn: hành chính, học thuật, khoa học, xuất bản, corporate, SOP và custom institution/publisher profiles.
- Thêm source-backed standards model, profile precedence, provenance, safe-fix policy, semantic document model và preflight release gates vào thiết kế.
- Thêm Master Implementation Plan theo 6 milestone M1-M6 với task ID, dependency, P0/P1/P2, acceptance criteria, test cases và release gates.
- Thêm `docs/standards/SOURCE_CATALOG.md` ghi nguồn chính thức/primary source đã kiểm chứng và quy tắc ingest/re-verify.
- Thêm execution plan chi tiết cho M1 Standards Foundation theo TDD RED -> GREEN.

- Chờ Word Desktop smoke test của release candidate trên tài liệu pilot thực tế.
- `HPC-INTERNAL` và `HPC-SOP` V1 vẫn cần HPC phê duyệt rule nghiệp vụ trước production.

## 1.0.0-rc.1 - 2026-09-14

### Validation Core v2

- Thêm Document Classifier: body, heading, list và HPC semantic styles.
- Body rule không còn áp nhầm lên Signature/Caption/Recipient/List.
- Thêm Heading 1-4 rule riêng.
- Compliance Score chuyển sang normalized proportional score và loại capability finding khỏi điểm.
- Mở rộng SOP validator: missing, duplicate và section order.
- Thêm Pre-release Check: Ready / Review / Blocked.

### Safe Formatting & Document Tools

- Hoàn thiện HPC Styles thay vì font-only placeholders.
- `HPC.Heading1..4` có outline level 1-4.
- Mixed/Unknown formatting vẫn manual-only.
- `normalizeSelectedText()` lưu rollback snapshot trước mutation.
- Rollback tiếp tục có document structure guard.
- Numbering Heading đa cấp 1 / 1.1 / 1.1.1 / 1.1.1.1.
- Numbering bỏ qua heading đã thuộc list để bảo vệ numbering hiện hữu.
- Rollback có thể detach numbering list do add-in vừa tạo.
- Thêm Table Standardizer không sửa nội dung ô.
- Thêm TOC manager với capability guard WordApiDesktop 1.4.
- Thêm navigation tới paragraph của finding.

### Profiles & UI

- Thêm Rule JSON loader/validator local.
- Task Pane cho phép import custom profile JSON.
- Thêm filter finding theo severity/capability.
- Thêm cảnh báo rõ cho DRAFT profile.
- Dashboard hiển thị Compliance Score và Pre-release status.

### CI / Deployment

- GitHub Actions có concurrency và tự hủy run bị supersede.
- Pin dependency versions trong `package.json`.
- Thêm script sinh `manifest.production.xml` từ `ADDIN_ORIGIN` bắt buộc HTTPS.
- CI validate cả development và generated production manifest.
- Cập nhật tài liệu Architecture / Install / Deployment / README.

### Verification policy

- TDD RED -> GREEN cho classifier/rule engine/pre-release/SOP.
- TDD RED -> GREEN cho styles/table/finding filters.
- TDD RED -> GREEN cho numbering/TOC/profile loader.
- Production approval vẫn yêu cầu Word Desktop smoke test riêng.

## Phase 2 - Safe Auto-Fix & Rollback Hardening

- Chặn Auto-Fix đối với font/cỡ chữ `Mixed/Unknown` để bảo toàn mixed/run-level formatting.
- Luôn tạo finding `BODY-FONT-SIZE` khi Word trả mixed/unknown, nhưng đánh dấu manual-only.
- Bổ sung document structure guard cho rollback.
- Rollback bị chặn nếu số lượng, thứ tự hoặc nội dung paragraph thay đổi sau lần Fix.
- Bổ sung regression tests cho mixed formatting và rollback safety.
- Quy trình kiểm chứng Phase 2: TDD RED → GREEN, sau đó chạy lại Build + Unit Tests + Office manifest validation trên HEAD trước khi merge `main`.

## CI Queue Hardening - 2026-09-14

- Thêm GitHub Actions `concurrency` theo workflow + PR/ref.
- Bật `cancel-in-progress: true` để tự hủy CI cũ khi có commit mới cùng nhóm.
- Giữ nguyên Build + Unit Tests + Office manifest validation.

## 0.1.0 - 2026-09-13

- Khởi tạo Microsoft Word Office Add-in.
- Thêm Ribbon button `HPC Assistant` và React Task Pane.
- Thêm Rule Engine và các profile `HPC-ND30`, `HPC-INTERNAL`, `HPC-SOP`.
- Thêm scan document, margin/font/size/alignment validation.
- Thêm Preview, Fix Selected, normalize selection và rollback.
- Thêm SOP structure validator.
- Thêm HPC custom style bootstrap.
- Thêm CI: build, unit tests, manifest validation.
