# Cài đặt và Pilot trên Word Desktop

## 1. Yêu cầu

- Node.js 22 cho development/pilot.
- Microsoft Word Desktop.
- Quyền sideload Office Add-in khi phát triển.
- Git.
- Với chế độ dùng thường trực: quyền triển khai custom Office Add-in qua Microsoft 365 Admin Center / Integrated Apps hoặc cơ chế quản trị tương đương của tổ chức.

## 2. Cài source cho development

```bash
git clone https://github.com/khoaiprovip123/Smart-document-assistant.git
cd Smart-document-assistant
npm install
npm run verify
```

`npm run verify` chạy TypeScript/Vite build, unit tests và validate development manifest.

## 3. Development / debug

Terminal 1:

```bash
npm run dev
```

Terminal 2, chỉ khi cần debug/sideload Word Desktop:

```bash
npm run debug:word
```

`debug:word` có thể mở Word và tạo/mở một document phục vụ phiên debug. Đây không phải cách vận hành hằng ngày.

Dừng phiên debug:

```bash
npm run debug:word:stop
```

Lệnh cũ:

```bash
npm run start:word
```

nay **không khởi chạy Word**; nó chỉ in hướng dẫn Persistent Word Mode để tránh vô tình mở một document trắng.

## 4. Chế độ dùng thường trực trong Word

Sau khi web bundle được host trên HTTPS thật và `manifest.production.xml` được triển khai qua Microsoft 365 cho người dùng mục tiêu:

1. Người dùng mở Microsoft Word bình thường — không chạy Node/npm.
2. Nhóm `HPC VĂN BẢN` và nút `HPC Assistant` xuất hiện trên Ribbon cho tài khoản được cấp add-in.
3. Bấm `HPC Assistant` để mở Task Pane trên tài liệu đang làm việc.
4. Nếu muốn một file cụ thể tự mở Task Pane ở những lần mở sau, bật:

   **Luôn mở HPC Assistant cùng tài liệu này**

Tùy chọn này lưu `Office.AutoShowTaskpaneWithDocument` vào **document hiện tại**. Nó không cài add-in cho máy/tài khoản; add-in phải được triển khai/cài trước.

## 5. Kịch bản test khuyến nghị

Luôn dùng **bản sao** tài liệu thực tế trong pilot:

1. Mở Word bình thường và mở tài liệu cần test.
2. Mở `HPC Assistant` từ Ribbon.
3. Chọn profile phù hợp.
4. `Tạo/Cập nhật HPC Styles`.
5. `Kiểm tra văn bản`.
6. Kiểm tra Compliance Score, Document Health và Preflight.
7. Dùng `Đi tới vị trí` trên finding paragraph.
8. Chọn một vài finding và `Sửa mục đã chọn`.
9. `Rollback` và xác nhận formatting được hoàn nguyên.
10. `Chuẩn hóa vùng chọn` rồi thử `Rollback`.
11. Áp `HPC.Heading1..4`, chạy `Numbering Heading`, sau đó thử `Rollback`.
12. Chạy `Chuẩn hóa bảng` trên bảng có cột STT, tên/nội dung, số lượng, đơn giá/thành tiền và ghi chú; xác nhận từng cột được căn theo ngữ nghĩa, không bị ép canh giữa toàn bảng.
13. Đặt con trỏ tại vị trí muốn tạo mục lục và bấm `Mục lục`.
14. Bật `Luôn mở HPC Assistant cùng tài liệu này`, lưu/đóng/mở lại file và xác nhận Task Pane tự mở.
15. Scan lại và kiểm tra trạng thái cuối.

## 6. Import Rule JSON

Task Pane hỗ trợ chọn file `.json` chứa **mảng profile**. Loader validate cấu trúc cơ bản, numeric ranges và ID trùng trong file. Profile import không được trùng ID profile hệ thống.

## 7. Compatibility

- Numbering/list metadata: cần WordApi 1.3.
- Table cell semantic alignment: cần WordApi 1.3.
- Custom HPC Styles + outline level: cần WordApi 1.5.
- TOC manager: cần WordApiDesktop 1.4.
- Page Setup: phụ thuộc WordApiDesktop được host hỗ trợ.
- Auto-open Task Pane theo document: add-in phải được cài/triển khai trước và manifest phải dùng `Office.AutoShowTaskpaneWithDocument`.

Nếu không đủ API, add-in phải trả capability warning/error thay vì chạy mù.

## 8. Production

Không sửa `manifest.xml` development bằng tay. Dùng:

```bash
ADDIN_ORIGIN=https://your-production-domain npm run build:manifest
npm run validate:manifest:production
```

Sau đó host `dist/` trên đúng HTTPS origin và triển khai `manifest.production.xml` qua Microsoft 365 Integrated Apps / Admin Center cho nhóm pilot trước. Xem `DEPLOYMENT.md`.
