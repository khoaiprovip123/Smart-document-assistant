# HPC Smart Document Assistant — Ribbon-first Word UX Design

## Goal

Chuyển trải nghiệm chính từ Task Pane sang một custom tab Word duy nhất `HPC VĂN BẢN`. Người dùng thực hiện thao tác thường xuyên ngay trên Ribbon; Task Pane chỉ còn là Detail Center cho kết quả kiểm tra, preview, audit, profile/template review và cài đặt nâng cao.

## Constraints

- Không thay đổi nội dung nghiệp vụ của tài liệu.
- Không tự động áp dụng `review-required` hoặc `never-auto-fix`.
- Giữ rollback/safety guard hiện có.
- Không gắn best-practice bảng thành yêu cầu pháp lý ND30.
- `VN-ND30-ADMIN` vẫn chỉ là verified subset, không phải full legal compliance.
- Profile HPC/SOP draft vẫn `unverified` cho đến khi có nguồn được phê duyệt.
- Phase đầu không bắt buộc SharedRuntime để tránh nâng minimum client không cần thiết.
- Custom tab dùng AddinCommands 1.3; nếu VersionOverrides không được hỗ trợ, base task-pane manifest vẫn là fallback.

## Ribbon Sitemap

Custom tab: `HPC VĂN BẢN`

### Group: KIỂM TRA

- `Kiểm tra tài liệu` — ShowTaskpane vào Detail Center; scan là luồng có kết quả dài nên không cố nhồi vào function command.
- `Chi tiết lỗi` — ShowTaskpane.

### Group: SỬA & HOÀN TÁC

- `Sửa lỗi an toàn` — mở Detail Center để người dùng review danh sách auto-fixable trước mutation trong phase đầu.
- `Hoàn tác HPC` — ExecuteFunction gọi rollback hiện có.

### Group: ĐỊNH DẠNG

- `Chuẩn hóa vùng chọn` — ExecuteFunction.
- `HPC Styles` — ExecuteFunction.

### Group: BẢNG

- `Chuẩn hóa bảng` — ExecuteFunction; dùng Table Semantic Formatting, không căn toàn bộ cell về một alignment.

### Group: HEADING & MỤC LỤC

- `Đánh số Heading` — ExecuteFunction.
- `Tạo/Cập nhật mục lục` — ExecuteFunction, giữ capability guard WordApiDesktop hiện có.

### Group: TIÊU CHUẨN

- `Bộ tiêu chuẩn` — ShowTaskpane vào Profile/Standards area.
- `Học từ tài liệu` — ShowTaskpane vào Template Learning/Review area.

### Group: PHÁT HÀNH

- `Kiểm tra trước phát hành` — ShowTaskpane vào Preflight/Health.
- `Audit & QA` — ShowTaskpane vào V2 Operations/QA.

### Group: CÔNG CỤ

- `Trung tâm chi tiết` — ShowTaskpane.
- `Cài đặt` — ShowTaskpane; bao gồm auto-open theo document và thông tin phiên bản.

## Command Architecture

### Direct function commands

Các thao tác có mutation rõ, ngắn và đã có safety boundary sẽ gọi service hiện hữu qua command dispatcher:

- `rollbackLastChange()`
- `normalizeSelectedText(profile)`
- `ensureHpcStyles(profile)`
- `standardizeTables(profile)`
- `normalizeHeadingNumbering()`
- `insertOrUpdateTableOfContents()`

Mỗi function command:

1. chống double-execution trong cùng runtime;
2. resolve profile mặc định/persisted an toàn;
3. gọi service;
4. catch lỗi;
5. luôn gọi `event.completed()` trong `finally`.

### Detail Center commands

Các luồng có output dài hoặc cần user review dùng `ShowTaskpane` thay vì function command:

- scan/findings;
- fix preview / safe fix review;
- profile selection/import;
- template learning;
- preflight;
- audit/QA;
- settings.

Điều này giữ Ribbon đơn giản và tránh chạy auto-fix không có preview.

## Profile State

Phase đầu giữ profile selection trong Task Pane. Các direct command phụ thuộc profile dùng profile V1 mặc định `HPC-ND30` nếu chưa có persisted preference. Bước tiếp theo sẽ tách `profilePreferenceService` và persist built-in profile theo document trước khi cho phép Ribbon direct command dùng profile tùy chỉnh.

Để tránh hành vi bất ngờ, Ribbon không được chạy custom imported profile khi không thể reconstruct đầy đủ profile trong command runtime.

## Task Pane Redesign Boundary

Task Pane không bị xóa. Nó trở thành Detail Center với các khu vực:

- Tình trạng tài liệu;
- Danh sách vấn đề;
- Chi tiết nguồn/rule;
- Preview sửa lỗi;
- Lịch sử thay đổi;
- Bộ tiêu chuẩn;
- Template Review;
- Audit/QA;
- Cài đặt.

Các nút thao tác phổ biến không cần lặp lại dày đặc trong Task Pane sau khi Ribbon đã ổn định.

## Compatibility

- XML add-in-only manifest tiếp tục được dùng trong phase này.
- CustomTab nằm trong `PrimaryCommandSurface`.
- `AddinCommands 1.3` được dùng cho custom tab.
- SharedRuntime 1.1 là phase sau, chỉ bật khi cần command ↔ task pane state thời gian thực.
- WordApi/WordApiDesktop capability guards hiện hữu tiếp tục có hiệu lực.

## Testing

- Manifest structure test: custom tab tồn tại, không còn `OfficeTab id="TabHome"` cho primary command surface.
- Manifest validation: development + production.
- Command registration unit test: mọi `FunctionName` có handler tương ứng.
- Command lifecycle test: handler luôn complete event cả success và error.
- Regression tests cho table semantic formatting, rollback, heading numbering và TOC.
- Word Desktop smoke: custom tab hiển thị; từng direct command chạy; Detail Center commands mở pane; lỗi capability không phá document.

## Non-goals in this phase

- Không bật V2 Word mutation adapter trực tiếp từ Ribbon.
- Không auto-fix toàn bộ document không preview.
- Không dynamic show/hide Ribbon dựa vào RibbonApi 1.3.
- Không migrate sang unified manifest trong cùng phase.
- Không thay đổi nguồn tiêu chuẩn hoặc claim compliance.