# HPC Smart Document Assistant

Microsoft Word Add-in giúp HPC kiểm tra, chuẩn hóa và quản trị thể thức văn bản theo Rule Profile có cấu hình.

## MVP 0.1

- Word Task Pane + Ribbon command.
- Profile `HPC-ND30`, `HPC-INTERNAL`, `HPC-SOP`.
- Scan document.
- Kiểm tra A4/lề khi Word hỗ trợ PageSetup API.
- Kiểm tra font, cỡ chữ, alignment.
- Preview finding theo Critical / Warning / Suggestion / Passed.
- Fix Selected và rollback lần thay đổi gần nhất.
- Chuẩn hóa vùng chọn.
- Kiểm tra cấu trúc SOP.
- Unit tests cho Rule Engine.

> `HPC-INTERNAL` và `HPC-SOP` hiện là DRAFT kỹ thuật để chạy MVP, cần HPC chốt trước khi dùng làm chuẩn chính thức.

## Development

```bash
npm install
npm run build
npm test
npm run validate:manifest
npm run dev
```

Sideload Word Desktop:

```bash
npm run start:word
```

## Nguyên tắc an toàn

- Không tự sửa text content trong Auto Format.
- Chỉ sửa các finding người dùng chọn.
- Không tự accept Track Changes hoặc xóa Comments.
- Nếu Word không hỗ trợ API cần thiết, hiển thị cảnh báo thay vì giả lập kết quả.

## Roadmap gần nhất

1. Heading classifier + `HPC.Heading1..4`.
2. Numbering 1 / 1.1 / 1.1.1.
3. TOC manager.
4. Table standardizer.
5. Pre-release checker.
6. Rule JSON loader.
