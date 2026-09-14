# Deployment

## 1. Pilot / Development

1. Cài Node.js 22 và Microsoft Word Desktop.
2. Chạy `npm install`.
3. Chạy `npm run verify`.
4. Chạy `npm run dev`.
5. Terminal khác chạy `npm run start:word` để sideload `manifest.xml`.
6. Luôn thử trên bản sao tài liệu trước.

`manifest.xml` development sử dụng `https://localhost:3000` và không được dùng trực tiếp cho production.

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

Script sẽ tạo `manifest.production.xml` từ `manifest.xml`; file sinh ra được ignore khỏi Git để tránh commit nhầm domain môi trường.

## 3. Hosting

- Host nội dung `dist/` trên đúng origin đã truyền vào `ADDIN_ORIGIN`.
- Bắt buộc HTTPS với certificate hợp lệ.
- `taskpane.html`, `commands.html` và `/assets/*` phải truy cập được từ origin đó.
- Không nhúng secrets hoặc API key vào bundle/manifest.

## 4. Microsoft 365 rollout

1. Pilot bằng nhóm IT/TechCenter trước.
2. Test Word Desktop bằng tài liệu bản sao.
3. Sau khi pilot pass, triển khai `manifest.production.xml` tập trung qua Microsoft 365 Admin Center cho nhóm mục tiêu.
4. Mở rộng assignment theo từng nhóm thay vì toàn công ty ngay lập tức.

## 5. Smoke test bắt buộc

Kiểm tra tối thiểu:

```text
Open Word -> HPC Assistant
-> Load/Create HPC Styles
-> Scan
-> Navigate finding
-> Fix Selected
-> Rollback
-> Normalize selection
-> Numbering Heading
-> Rollback numbering
-> Standardize table
-> Insert/update TOC
-> Re-scan
-> Pre-release status
```

Các API phụ thuộc phiên bản Word. Nếu host không hỗ trợ WordApi/WordApiDesktop cần thiết, add-in phải báo capability error và không cố giả lập thao tác.

## 6. Rollback deployment

- Ứng dụng: gỡ assignment hoặc quay lại manifest/web build trước.
- Formatting: dùng Rollback trong add-in khi structure guard còn hợp lệ.
- TOC/table operations: dùng Word native Undo nếu cần hoàn nguyên ngay sau thao tác; smoke test phải xác nhận hành vi này trên Word Desktop mục tiêu.

## 7. Release gate

Chỉ đánh dấu production-approved khi:

- GitHub Actions HEAD main pass Build + Unit Tests + cả hai manifest validation.
- Word Desktop smoke test pass trên tài liệu mẫu và bản sao tài liệu thực tế.
- HPC phê duyệt các profile đang mang trạng thái `draft` trước khi dùng làm chuẩn chính thức.
