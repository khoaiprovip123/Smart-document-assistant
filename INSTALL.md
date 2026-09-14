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

## 4. Chế độ Ribbon-first trong Word

Sau khi web bundle được host trên HTTPS thật và `manifest.production.xml` được triển khai qua Microsoft 365 cho người dùng mục tiêu:

1. Người dùng mở Microsoft Word bình thường — không chạy Node/npm.
2. Custom tab **`HPC VĂN BẢN`** xuất hiện trên Ribbon với 8 nhóm: KIỂM TRA, SỬA & HOÀN TÁC, ĐỊNH DẠNG, BẢNG, HEADING & MỤC LỤC, TIÊU CHUẨN, PHÁT HÀNH, CÔNG CỤ.
3. Các thao tác ngắn chạy trực tiếp trên Ribbon:
   - `Hoàn tác HPC`.
   - `Chuẩn hóa vùng chọn`.
   - `HPC Styles`.
   - `Chuẩn hóa bảng`.
   - `Đánh số Heading`.
   - `Tạo/Cập nhật mục lục`.
4. Các luồng cần xem kết quả/review mở Task Pane **Trung tâm chi tiết**:
   - `Kiểm tra tài liệu`.
   - `Sửa lỗi an toàn`.
   - `Bộ tiêu chuẩn`.
   - `Trước phát hành`.
   - `Trung tâm chi tiết`.
5. Nếu muốn một file cụ thể tự mở Task Pane ở những lần mở sau, bật:

   **Luôn mở HPC Assistant cùng tài liệu này**

Tùy chọn này lưu `Office.AutoShowTaskpaneWithDocument` vào **document hiện tại**. Nó không cài add-in cho máy/tài khoản; add-in phải được triển khai/cài trước.

## 5. Kịch bản smoke test Ribbon khuyến nghị

Luôn dùng **bản sao** tài liệu thực tế trong pilot:

1. Mở Word bình thường, mở tài liệu cần test và xác nhận tab `HPC VĂN BẢN` có đủ 8 nhóm.
2. Bấm `Kiểm tra tài liệu`; xác nhận Trung tâm chi tiết mở và scan hoàn tất.
3. Chọn profile phù hợp và kiểm tra Compliance Score, Document Health, Fix Preview và Kiểm tra trước phát hành.
4. Dùng `Đi tới vị trí` trên một vấn đề cấp paragraph.
5. Chọn một vài vấn đề và dùng `Sửa mục đã chọn`; sau đó dùng `Hoàn tác HPC` và xác nhận formatting được hoàn nguyên khi rollback guard cho phép.
6. Chọn một đoạn text, chạy `Chuẩn hóa vùng chọn`, sau đó thử `Hoàn tác HPC`.
7. Chạy `HPC Styles`; xác nhận các style HPC được tạo/cập nhật mà không sửa nội dung văn bản.
8. Áp `HPC.Heading1..4`, chạy `Đánh số Heading`; xác nhận heading đã thuộc list hiện hữu không bị phá.
9. Chạy `Chuẩn hóa bảng` trên bảng có cột STT, tên/nội dung, số lượng, đơn giá/thành tiền và ghi chú; xác nhận từng cột được căn theo ngữ nghĩa, không bị ép canh giữa toàn bảng.
10. Đặt con trỏ tại vị trí muốn tạo mục lục và bấm `Tạo/Cập nhật mục lục`; xác nhận insert/update đúng trên Word Desktop mục tiêu.
11. Mở `Bộ tiêu chuẩn` và `Trước phát hành`; xác nhận các luồng review vẫn ở Trung tâm chi tiết, không tự mutation rule `review-required` / `never-auto-fix`.
12. Bật `Luôn mở HPC Assistant cùng tài liệu này`, lưu/đóng/mở lại file và xác nhận Task Pane tự mở.
13. Scan lại và kiểm tra trạng thái cuối.

## 6. Import Rule JSON

Task Pane hỗ trợ chọn file `.json` chứa **mảng profile**. Loader validate cấu trúc cơ bản, numeric ranges và ID trùng trong file. Profile import không được trùng ID profile hệ thống.

## 7. Compatibility

- Custom Ribbon tab/commands: cần `AddinCommands` 1.3 trong VersionOverrides; base manifest vẫn là fallback.
- Numbering/list metadata: cần WordApi 1.3.
- Table cell semantic alignment: cần WordApi 1.3.
- Custom HPC Styles + outline level: cần WordApi 1.5.
- TOC manager: cần WordApiDesktop 1.4.
- Page Setup: phụ thuộc WordApiDesktop được host hỗ trợ.
- Auto-open Task Pane theo document: add-in phải được cài/triển khai trước và manifest phải dùng `Office.AutoShowTaskpaneWithDocument`.
- Phase Ribbon-first hiện không bật Shared Runtime; function command dùng FunctionFile riêng.

Nếu không đủ API, add-in phải trả capability warning/error thay vì chạy mù.

## 8. Production

Không sửa `manifest.xml` development bằng tay. Dùng:

```bash
ADDIN_ORIGIN=https://your-production-domain npm run build:manifest
npm run validate:manifest:production
```

Sau đó host `dist/` trên đúng HTTPS origin và triển khai `manifest.production.xml` qua Microsoft 365 Integrated Apps / Admin Center cho nhóm pilot trước. Xem `DEPLOYMENT.md`.
