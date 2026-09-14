# Cài đặt và Pilot trên Word Desktop

## Yêu cầu

- Node.js 22.
- Microsoft Word Desktop.
- Quyền sideload Office Add-in.
- Git.

## Cài source

```bash
git clone https://github.com/khoaiprovip123/Smart-document-assistant.git
cd Smart-document-assistant
npm install
npm run verify
```

`npm run verify` chạy TypeScript/Vite build, unit tests và validate development manifest.

## Chạy development

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run start:word
```

Nếu localhost certificate chưa được trust, Office Add-in tooling sẽ yêu cầu tạo/trust development certificate.

## Kịch bản test khuyến nghị

Dùng **bản sao** tài liệu thực tế và test theo thứ tự:

1. Mở `HPC Assistant` từ Ribbon.
2. Chọn `HPC-ND30` hoặc profile phù hợp.
3. `Tạo/Cập nhật HPC Styles`.
4. `Kiểm tra văn bản`.
5. Kiểm tra Compliance Score và Pre-release Check.
6. Dùng `Đi tới vị trí` trên một finding paragraph.
7. Chọn một vài finding và `Sửa mục đã chọn`.
8. `Rollback` và xác nhận formatting được hoàn nguyên.
9. `Chuẩn hóa vùng chọn` rồi thử `Rollback`.
10. Áp `HPC.Heading1..4`, chạy `Numbering Heading`, sau đó thử `Rollback`.
11. Chạy `Chuẩn hóa bảng` trên tài liệu có table.
12. Đặt con trỏ tại vị trí muốn tạo mục lục và bấm `Mục lục`.
13. Scan lại và kiểm tra trạng thái cuối.

## Import Rule JSON

Task Pane hỗ trợ chọn file `.json` chứa **mảng profile**. Loader validate cấu trúc cơ bản, numeric ranges và ID trùng trong file. Profile import không được trùng ID profile hệ thống.

## Lưu ý compatibility

- Numbering/list metadata: cần WordApi 1.3.
- Custom HPC Styles + outline level: cần WordApi 1.5.
- TOC manager: cần WordApiDesktop 1.4.
- Page Setup: phụ thuộc WordApiDesktop được host hỗ trợ.

Nếu không đủ API, add-in sẽ trả lỗi/capability warning thay vì chạy mù.

## Production

Không sửa `manifest.xml` bằng tay. Xem `DEPLOYMENT.md` và dùng:

```bash
ADDIN_ORIGIN=https://your-production-domain npm run build:manifest
npm run validate:manifest:production
```
