# Deployment

## 1. Development / debug only

1. Cài Node.js 22 và Microsoft Word Desktop.
2. Chạy `npm install`.
3. Chạy `npm run verify`.
4. Chạy `npm run dev`.
5. Chỉ khi cần debug Word Desktop, chạy `npm run debug:word`.
6. Luôn thử trên bản sao tài liệu trước.

`manifest.xml` development sử dụng `https://localhost:3000` và không được dùng trực tiếp cho production.

`npm run start:word` không còn gọi debug launcher; lệnh này chỉ hiển thị hướng dẫn Persistent Word Mode. Điều này tránh việc người dùng vô tình mở Word/document trắng khi chỉ muốn sử dụng add-in.

## 2. Production build

Build web bundle:

```bash
npm run build
```

Sinh manifest theo HTTPS origin thật:

```bash
ADDIN_ORIGIN=https://documents.example.com npm run build:manifest
npm run validate:manifest:production
```

PowerShell:

```powershell
$env:ADDIN_ORIGIN="https://documents.example.com"
npm run build:manifest
npm run validate:manifest:production
```

Script tạo `manifest.production.xml` từ `manifest.xml`; file sinh ra được ignore khỏi Git để tránh commit nhầm domain môi trường.

## 3. Hosting

- Host nội dung `dist/` trên đúng origin đã truyền vào `ADDIN_ORIGIN`.
- Bắt buộc HTTPS với certificate hợp lệ.
- `taskpane.html`, `commands.html` và `/assets/*` phải truy cập được từ origin đó.
- Không nhúng secrets hoặc API key vào bundle/manifest.
- Production không phụ thuộc Vite dev server/localhost.

## 4. Microsoft 365 persistent rollout

Mục tiêu của production rollout là người dùng **mở Word bình thường, không chạy npm**, và `HPC Assistant` có sẵn trên Ribbon.

Khuyến nghị:

1. Microsoft 365 Admin Center → **Settings → Integrated apps**.
2. Chọn triển khai custom Office Add-in và upload `manifest.production.xml`.
3. Assignment trước cho nhóm IT/TechCenter pilot.
4. Đóng/mở lại Word bằng tài khoản pilot và xác nhận nhóm `HPC VĂN BẢN` / nút `HPC Assistant` xuất hiện trên Ribbon.
5. Sau smoke test mới mở rộng assignment theo nhóm/phòng ban; không rollout toàn công ty ngay lần đầu.

Centralized/Integrated Apps deployment là cơ chế cài add-in; `npm run debug:word` chỉ là dev tooling và không được dùng làm cách vận hành production.

## 5. Auto-open theo từng tài liệu

Manifest đã dùng:

```xml
<TaskpaneId>Office.AutoShowTaskpaneWithDocument</TaskpaneId>
```

Trong Task Pane, người dùng có thể bật:

**Luôn mở HPC Assistant cùng tài liệu này**

Add-in lưu document setting:

```text
Office.AutoShowTaskpaneWithDocument = true
```

Quy tắc an toàn:

- Setting áp dụng cho file Word hiện tại, không phải global setting cho mọi document.
- Add-in phải được cài/triển khai trước thì auto-open mới hoạt động.
- Tắt checkbox chỉ tắt auto-open của file đó; Ribbon command vẫn tồn tại nếu add-in còn được assignment.

## 6. Semantic table formatting

`Chuẩn hóa bảng` tách hai khái niệm:

- `table.alignment`: vị trí bảng trên trang.
- alignment của từng cell/cột: căn theo ngữ nghĩa dữ liệu.

Mặc định:

- STT, mã/ký hiệu ngắn, ngày/trạng thái → giữa.
- Số lượng, đơn giá, thành tiền, tỷ lệ/% → phải.
- Tên, nội dung, mô tả, ghi chú → trái.
- Cột mơ hồ/confidence thấp → giữ nguyên.

Không merge/unmerge và không sửa text cell.

## 7. Smoke test bắt buộc

Kiểm tra tối thiểu:

```text
Open Word normally -> HPC Assistant exists on Ribbon
-> Open copied real document
-> Scan
-> Navigate finding
-> Fix Selected
-> Rollback
-> Normalize selection
-> Numbering Heading
-> Rollback numbering
-> Standardize table with mixed semantic columns
-> Verify STT/text/numeric/note alignment separately
-> Enable “Luôn mở HPC Assistant cùng tài liệu này”
-> Save/close/reopen the same document
-> Verify Task Pane auto-opens
-> Insert/update TOC
-> Re-scan
-> Preflight status
```

Các API phụ thuộc phiên bản Word. Nếu host không hỗ trợ WordApi/WordApiDesktop cần thiết, add-in phải báo capability error/warning và không cố giả lập thao tác.

## 8. Security gate

CI bắt buộc chạy:

```bash
npm audit --omit=dev --audit-level=high
```

Production/runtime dependency audit hiện là gate blocking. Full dev/toolchain audit được ghi diagnostic riêng; không dùng `npm audit fix --force` tự động vì Office add-in tooling có thể yêu cầu breaking changes.

## 9. Rollback deployment

- Ứng dụng: gỡ assignment hoặc quay lại manifest/web build trước.
- Formatting: dùng Rollback trong add-in khi structure guard còn hợp lệ.
- TOC/table operations: dùng Word native Undo nếu cần hoàn nguyên ngay sau thao tác; smoke test phải xác nhận hành vi này trên Word Desktop mục tiêu.

## 10. Release gate

Chỉ đánh dấu production-approved khi:

- GitHub Actions HEAD `main` pass production dependency audit + Build + Unit Tests + development/production manifest validation.
- Web bundle production được host trên HTTPS thật.
- Add-in được assignment qua Microsoft 365 Integrated Apps cho nhóm pilot.
- Word Desktop smoke test pass trên bản sao tài liệu thực tế, gồm semantic table alignment và document auto-open.
- HPC phê duyệt các profile đang mang trạng thái `draft/unverified` trước khi dùng làm chuẩn chính thức.
