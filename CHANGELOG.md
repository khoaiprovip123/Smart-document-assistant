# Changelog

## Unreleased

- Chờ Word Desktop smoke test của release candidate trên tài liệu pilot thực tế.
- `HPC-INTERNAL` và `HPC-SOP` vẫn cần HPC phê duyệt rule nghiệp vụ trước production.

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
