# HPC Smart Document Assistant

Microsoft Word Add-in giúp HPC kiểm tra, chuẩn hóa và quản trị thể thức tài liệu theo Rule Profile có cấu hình, ưu tiên an toàn nội dung và khả năng triển khai nội bộ.

## Trạng thái

**1.0.0-rc.1** — Release Candidate để pilot trên Word Desktop trước khi phát hành production.

## Chức năng hiện có

- Word Task Pane + Ribbon command.
- Profile hệ thống `HPC-ND30`, `HPC-INTERNAL`, `HPC-SOP`.
- Import Rule Profile JSON tùy chỉnh trong Task Pane.
- Scan tài liệu và Compliance Score theo tỷ lệ rule được kiểm tra.
- Pre-release Check: Ready / Review / Blocked.
- Kiểm tra A4, hướng giấy, lề khi Word hỗ trợ Page Setup API.
- Document classifier: body, heading, list và các HPC semantic styles.
- Kiểm tra typography thân bài và Heading 1-4 theo role.
- Finding filter theo severity/capability và điều hướng tới paragraph có lỗi.
- Safe Fix Selected, chuẩn hóa vùng chọn và rollback có structure guard.
- HPC Styles hoàn chỉnh: Normal, Title, SubTitle, Heading1-4, Table, TableHeader, Caption, Note, Signature, Recipient, Appendix.
- Numbering heading đa cấp 1 / 1.1 / 1.1.1 / 1.1.1.1; bỏ qua heading đã thuộc list để tránh phá numbering có sẵn.
- Table standardizer: font, cỡ chữ, header row và alignment; không sửa text trong cell.
- SOP validator: section bắt buộc, duplicate và sai thứ tự.
- TOC manager: chèn tại vị trí con trỏ hoặc cập nhật mục lục hiện có khi WordApiDesktop 1.4 được hỗ trợ.
- CI build + unit tests + development manifest + production manifest validation.

## Phạm vi ND30

`HPC-ND30` hiện kiểm tra các rule đã được triển khai và xác minh trong engine: A4, hướng giấy, lề, typography thân bài và convention heading HPC. Đây **không phải tuyên bố kiểm tra toàn bộ mọi yêu cầu pháp lý của Nghị định 30/2020/NĐ-CP**.

`HPC-INTERNAL` và `HPC-SOP` vẫn là **DRAFT** cho đến khi HPC phê duyệt bộ rule nghiệp vụ chính thức.

## Nguyên tắc an toàn

- Không gửi nội dung tài liệu ra dịch vụ bên ngoài.
- Không tự rewrite nội dung nghiệp vụ.
- Mixed/Unknown font hoặc cỡ chữ là manual-only.
- Chỉ auto-fix finding có `autoFixable=true` mà người dùng chọn.
- Auto-format lưu snapshot trước khi sửa; rollback bị chặn nếu paragraph count/order/text đã thay đổi.
- Numbering chỉ áp lên heading chưa thuộc list và có thể rollback bằng cách gỡ list do add-in vừa tạo.
- Không tự accept Track Changes hoặc xóa Comments.
- Nếu Word thiếu API cần thiết, ứng dụng hiển thị capability warning/error thay vì giả lập kết quả.

## Development

```bash
npm install
npm run verify
npm run dev
```

Sideload Word Desktop:

```bash
npm run start:word
```

## Production manifest

```bash
ADDIN_ORIGIN=https://documents.example.com npm run build:manifest
npm run validate:manifest:production
```

Windows PowerShell:

```powershell
$env:ADDIN_ORIGIN="https://documents.example.com"
npm run build:manifest
npm run validate:manifest:production
```

Sau đó host `dist/` trên đúng HTTPS origin và triển khai `manifest.production.xml` qua Microsoft 365 Admin Center hoặc cơ chế sideload/pilot phù hợp.

## Tài liệu

- `ARCHITECTURE.md`: kiến trúc và safety boundary.
- `INSTALL.md`: cài đặt/pilot.
- `DEPLOYMENT.md`: đóng gói production.
- `docs/superpowers/specs/2026-09-14-smart-document-assistant-v1-design.md`: design v1.
- `docs/superpowers/plans/2026-09-14-smart-document-assistant-v1.md`: implementation plan/audit trail.

## Trước khi phát hành production

Bắt buộc smoke test trên Word Desktop với bản sao tài liệu thật: Scan → Styles → Fix → Numbering → TOC → Table → Rollback → Re-scan. Release Candidate chưa được xem là production-approved cho đến khi bước này hoàn tất.
