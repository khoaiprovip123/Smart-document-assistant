# Changelog

## Unreleased

### CI Reliability

- Thêm `concurrency` cho GitHub Actions CI theo workflow + PR/branch.
- Bật `cancel-in-progress: true` để run mới tự hủy run CI cũ cùng PR/branch, giảm tình trạng queued chồng nhau.
- Giữ nguyên các bước build, unit test và Office manifest validation.
- Ghi nhận các run cũ ở trạng thái `queued` nhưng không có job là record stale/orphan phía GitHub Actions; thay đổi này nhằm ngăn phát sinh thêm run trùng trong repo.

### Phase 2 - Safe Auto-Fix & Rollback Hardening

- Chặn Auto-Fix đối với font/cỡ chữ `Mixed/Unknown` để bảo toàn mixed/run-level formatting.
- Luôn tạo finding `BODY-FONT-SIZE` khi Word trả mixed/unknown, nhưng đánh dấu manual-only.
- Bổ sung document structure guard cho rollback.
- Rollback bị chặn nếu số lượng, thứ tự hoặc nội dung paragraph thay đổi sau lần Fix.
- Bổ sung regression tests cho mixed formatting và rollback safety.
- Quy trình kiểm chứng Phase 2: TDD RED → GREEN, sau đó chạy lại Build + Unit Tests + Office manifest validation trên HEAD trước khi merge `main`.

## 0.1.0 - 2026-09-13

- Khởi tạo Microsoft Word Office Add-in.
- Thêm Ribbon button `HPC Assistant` và React Task Pane.
- Thêm Rule Engine và các profile `HPC-ND30`, `HPC-INTERNAL`, `HPC-SOP`.
- Thêm scan document, margin/font/size/alignment validation.
- Thêm Preview, Fix Selected, normalize selection và rollback.
- Thêm SOP structure validator.
- Thêm HPC custom style bootstrap.
- Thêm CI: build, unit tests, manifest validation.
