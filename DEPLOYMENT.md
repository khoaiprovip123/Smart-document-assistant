# Deployment

## Pilot

1. Build và test trên máy IT.
2. Chạy HTTPS dev server hoặc host bản build trên HTTPS.
3. Sideload `manifest.xml` vào Word Desktop.
4. Kiểm thử trên file bản sao.
5. Chỉ mở rộng cho nhóm pilot sau khi các rule nội bộ được xác nhận.

## Production

- Host nội dung `dist/` trên HTTPS domain nội bộ hoặc hạ tầng web được HPC kiểm soát.
- Thay toàn bộ `https://localhost:3000` trong `manifest.xml` bằng production origin.
- Validate manifest lại.
- Triển khai tập trung qua Microsoft 365 Admin Center cho nhóm người dùng mục tiêu.

## Rollback

- Ứng dụng: gỡ assignment Add-in hoặc quay lại manifest/version trước.
- Tài liệu: MVP hỗ trợ rollback lần thay đổi formatting gần nhất trong phiên Task Pane.

## Lưu ý

Không triển khai production với `localhost`. Không đưa API key hoặc dữ liệu nhạy cảm vào source/manifest.
