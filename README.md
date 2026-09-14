# HPC Smart Document Assistant

Microsoft Word Add-in giúp HPC kiểm tra, chuẩn hóa và quản trị thể thức tài liệu theo Rule Profile có cấu hình, ưu tiên an toàn nội dung và khả năng triển khai nội bộ.

## Trạng thái

**1.0.0-rc.1 + V2 pilot** — Release Candidate để pilot trên Word Desktop trước khi phát hành production.

V2 hiện đã có Standards Foundation, Semantic Document Model, Core Quality Engines, Domain Profiles, Safe Fix policy/transaction architecture, Document Health, Fix Preview và Preflight. Task Pane chạy V2 health song song với V1 compatibility.

## Chức năng hiện có

- Word Task Pane + Ribbon command.
- Profile V1 hệ thống `HPC-ND30`, `HPC-INTERNAL`, `HPC-SOP`.
- V2 built-in profiles gồm ND30 verified subset, HPC Corporate/SOP draft packs và Academic neutral base.
- Import Rule Profile JSON tùy chỉnh trong Task Pane.
- Scan tài liệu và Compliance Score V1.
- V2 semantic scan theo section/paragraph/table/field/picture/comment/tracked change và capability matrix.
- V2 Document Health theo severity, rule category và fixability.
- V2 source-backed Fix Preview hiển thị nguồn/rule/current/expected trước mutation.
- V2 Preflight: `READY` / `REVIEW_REQUIRED` / `BLOCKED` dựa trên blocker/review/capability/profile status, không dựa vào score đơn thuần.
- Fix policy V2: `auto-safe`, `auto-with-preview`, `review-required`, `never-auto-fix`.
- `Fix All Safe` boundary đã được unit-test để `review-required` và `never-auto-fix` không đi vào mutation callback.
- Transaction history V2 nhiều bước và structure-safe rollback guard.
- Kiểm tra A4, lề và typography theo profile/rule được hỗ trợ.
- Document classifier: body, heading, list và các HPC semantic styles.
- Kiểm tra typography thân bài và Heading 1-4 theo role.
- Finding filter theo severity/capability và điều hướng tới paragraph có lỗi.
- Safe Fix Selected V1, chuẩn hóa vùng chọn và rollback có structure guard.
- HPC Styles hoàn chỉnh: Normal, Title, SubTitle, Heading1-4, Table, TableHeader, Caption, Note, Signature, Recipient, Appendix.
- Numbering heading đa cấp 1 / 1.1 / 1.1.1 / 1.1.1.1; bỏ qua heading đã thuộc list để tránh phá numbering có sẵn.
- Table standardizer: font, cỡ chữ, header row và alignment; không sửa text trong cell.
- SOP validator: section bắt buộc, duplicate và sai thứ tự.
- TOC manager: chèn tại vị trí con trỏ hoặc cập nhật mục lục hiện có khi WordApiDesktop 1.4 được hỗ trợ.
- CI build + unit tests + development manifest + production manifest validation.

## Phạm vi ND30

V1 `HPC-ND30` tiếp tục kiểm tra bộ rule tương thích cũ.

V2 `VN-ND30-ADMIN` chỉ triển khai **verified subset** đã được source-backed: A4, lề và typography thân bài mà engine hiện diễn giải chính xác. V2 **không mã hóa Portrait thành rule bắt buộc cho mọi section**, vì quy định có trường hợp cho phép trang ngang; engine hiện chưa biểu diễn đủ điều kiện ngoại lệ.

Đây **không phải tuyên bố kiểm tra toàn bộ mọi yêu cầu pháp lý của Nghị định 30/2020/NĐ-CP**.

Các profile HPC Corporate/SOP vẫn là `unverified` cho đến khi HPC phê duyệt bộ rule nghiệp vụ/nguồn chính thức.

## Nguyên tắc an toàn

- Không gửi nội dung tài liệu ra dịch vụ bên ngoài.
- Không tự rewrite nội dung nghiệp vụ.
- Mixed/Unknown font hoặc cỡ chữ là manual-only.
- Không tự accept Track Changes hoặc xóa Comments.
- V2 `never-auto-fix` không được phép đi qua Fix All Safe mutation boundary.
- `auto-with-preview` chỉ được phép mutation sau khi preview được chấp thuận.
- Transaction snapshot được lưu trước mutation; rollback V2 bị chặn nếu nội dung/cấu trúc thay đổi sau transaction.
- Nếu Word thiếu API cần thiết, V2 Preflight hạ trạng thái xuống Review thay vì giả lập kết quả.
- V2 Word-specific mutation adapter chưa được bật trong pilot Task Pane; mutation thực tế hiện vẫn dùng V1 compatibility cho tới khi adapter V2 qua Word Desktop smoke test.

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
- `docs/standards/SOURCE_CATALOG.md`: source governance cho V2.
- `docs/superpowers/specs/2026-09-14-document-standards-platform-v2-design.md`: V2 architecture/design.
- `docs/superpowers/plans/2026-09-14-document-standards-platform-v2-master-plan.md`: master implementation plan M1-M6.

## Trước khi phát hành production

Bắt buộc smoke test trên Word Desktop với bản sao tài liệu thật: Scan V1/V2 → review Health/Preview/Preflight → Styles → Fix V1 compatibility → Numbering → TOC → Table → Rollback → Re-scan.

V2 Word mutation adapter phải có smoke test riêng trước khi bật `Fix All Safe` trực tiếp trong Word. Release Candidate chưa được xem là production-approved cho đến khi các bước này hoàn tất.

## Dependency hardening

CI hiện vẫn ghi nhận `npm install` báo 13 dependency vulnerabilities (5 moderate, 7 high, 1 critical). Chưa chạy `npm audit fix --force` vì có thể gây breaking changes; đây là hạng mục security/dependency audit riêng trước production.
