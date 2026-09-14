# HPC Smart Document Assistant

Microsoft Word Add-in giúp HPC kiểm tra, chuẩn hóa và quản trị thể thức tài liệu theo Rule Profile có cấu hình, ưu tiên an toàn nội dung và khả năng triển khai nội bộ.

## Trạng thái

**1.0.0-rc.1 + V2 pilot** — Release Candidate để pilot trên Word Desktop trước khi phát hành production.

V2 hiện đã có Standards Foundation, Semantic Document Model, Core Quality Engines, Domain Profiles, Safe Fix policy/transaction architecture, Document Health, Fix Preview, Preflight, Template Learning/Review, Audit/QA và Persistent Word Mode.

## Chức năng hiện có

- Word Task Pane + Ribbon command.
- Profile V1 hệ thống `HPC-ND30`, `HPC-INTERNAL`, `HPC-SOP`.
- V2 built-in profiles gồm ND30 verified subset, HPC Corporate/SOP draft packs và Academic neutral base.
- Import Rule Profile JSON tùy chỉnh trong Task Pane.
- Scan tài liệu và Compliance Score V1.
- V2 semantic scan theo section/paragraph/table/field/picture/comment/tracked change và capability matrix.
- V2 Document Health, source-backed Fix Preview và Preflight `READY` / `REVIEW_REQUIRED` / `BLOCKED`.
- Fix policy V2: `auto-safe`, `auto-with-preview`, `review-required`, `never-auto-fix`.
- `Fix All Safe` boundary chặn `review-required`/`never-auto-fix` trước mutation.
- Transaction history V2 và structure-safe rollback guard.
- Persistent Word control: `Luôn mở HPC Assistant cùng tài liệu này` lưu `Office.AutoShowTaskpaneWithDocument` vào document hiện tại.
- Semantic Table Formatting:
  - STT/mã/ngày/trạng thái → giữa.
  - Số lượng/đơn giá/thành tiền/% → phải.
  - Tên/nội dung/mô tả/ghi chú → trái.
  - Cột mơ hồ/confidence thấp → giữ nguyên.
  - Tách `table.alignment` (vị trí bảng trên trang) khỏi alignment của cell; không sửa text cell, không merge/unmerge.
- Table quality engine hỗ trợ rule `table-semantic-alignment` để phát hiện trường hợp một alignment đang bị áp đồng loạt dù các cột có ngữ nghĩa khác nhau; `Mixed/Unknown` không bị đoán.
- HPC Styles: Normal, Title, SubTitle, Heading1-4, Table, TableHeader, Caption, Note, Signature, Recipient, Appendix.
- Numbering heading đa cấp 1 / 1.1 / 1.1.1 / 1.1.1.1; bảo vệ list hiện hữu.
- SOP validator, TOC manager, finding navigation, Template Learning/Review, Audit JSON, synthetic QA corpus và release matrix.
- CI: production dependency audit + build + unit tests + development/production manifest validation.

## Phạm vi ND30

V2 `VN-ND30-ADMIN` chỉ triển khai **verified subset** đã được source-backed: A4, lề và typography thân bài mà engine hiện diễn giải chính xác. V2 không mã hóa Portrait thành rule bắt buộc cho mọi section vì quy định có trường hợp cho phép trang ngang.

Đây **không phải tuyên bố kiểm tra toàn bộ mọi yêu cầu pháp lý của Nghị định 30/2020/NĐ-CP**.

Các profile HPC Corporate/SOP vẫn là `unverified` cho đến khi HPC phê duyệt bộ rule nghiệp vụ/nguồn chính thức.

## Nguyên tắc an toàn

- Không gửi nội dung tài liệu ra dịch vụ bên ngoài.
- Không tự rewrite nội dung nghiệp vụ.
- Mixed/Unknown formatting là manual-only.
- Không tự accept Track Changes hoặc xóa Comments.
- `never-auto-fix` không đi qua Fix All Safe mutation boundary.
- `auto-with-preview` chỉ mutation sau preview được chấp thuận.
- Rollback bị chặn nếu nội dung/cấu trúc thay đổi sau transaction.
- Nếu Word thiếu API cần thiết, Preflight hạ trạng thái xuống Review thay vì giả lập kết quả.
- Cột bảng confidence thấp được giữ nguyên thay vì đoán.

## Development

```bash
npm install
npm run verify
npm run dev
```

Debug/sideload Word Desktop — **chỉ dùng khi phát triển**:

```bash
npm run debug:word
```

`npm run debug:word` có thể mở Word/document phục vụ phiên debug.

Lệnh:

```bash
npm run start:word
```

nay không mở Word; nó chỉ hiển thị hướng dẫn Persistent Word Mode để tránh vô tình tạo file trắng.

## Dùng thường trực trong Word

Production không cần chạy Node/npm trên máy người dùng:

1. Host `dist/` trên HTTPS thật.
2. Sinh `manifest.production.xml`:

```bash
ADDIN_ORIGIN=https://documents.example.com npm run build:manifest
npm run validate:manifest:production
```

3. Triển khai manifest qua Microsoft 365 Admin Center / Integrated Apps cho nhóm pilot.
4. Người dùng mở Word bình thường; `HPC Assistant` xuất hiện trên Ribbon cho tài khoản được assignment.
5. Với file cần tự mở Task Pane ở lần sau, bật `Luôn mở HPC Assistant cùng tài liệu này`.

Chi tiết xem `INSTALL.md` và `DEPLOYMENT.md`.

## Tài liệu

- `ARCHITECTURE.md`: kiến trúc và safety boundary.
- `INSTALL.md`: development, pilot và Persistent Word Mode.
- `DEPLOYMENT.md`: production hosting + Microsoft 365 rollout.
- `docs/standards/SOURCE_CATALOG.md`: source governance cho V2.
- `docs/qa/`: corpus, performance baseline và Word Desktop release matrix.
- `docs/superpowers/specs/2026-09-14-document-standards-platform-v2-design.md`: V2 architecture/design.
- `docs/superpowers/plans/2026-09-14-document-standards-platform-v2-master-plan.md`: master plan M1-M6.

## Trước khi phát hành production

Bắt buộc Word Desktop smoke test trên **bản sao tài liệu thật**: Ribbon persistent → Scan V1/V2 → Health/Preview/Preflight → Styles → Fix/Rollback → Numbering → Semantic Table → TOC → bật auto-open → save/close/reopen file → Re-scan.

Release Candidate chưa được xem là production-approved cho đến khi smoke matrix thực tế hoàn tất.

## Dependency hardening

CI dùng `npm audit --omit=dev --audit-level=high` làm production/runtime security gate và hiện gate này pass. Full audit vẫn ghi nhận vấn đề ở dev/toolchain (Vitest/Vite/Office add-in tooling); không dùng `npm audit fix --force` tự động vì có thể gây breaking changes.
