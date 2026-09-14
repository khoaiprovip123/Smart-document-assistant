# Architecture

## Mục tiêu

HPC Smart Document Assistant là Microsoft Word Add-in dùng Office.js để kiểm tra, chuẩn hóa và quản trị thể thức tài liệu. Thiết kế ưu tiên an toàn tài liệu, rule có cấu hình, chạy nội bộ và mở rộng thành nền tảng Document Governance.

## Kiến trúc

```text
Word document
  -> Office.js adapter
  -> DocumentSnapshot
  -> Document Classifier
  -> Role-aware Rule Engine
  -> Findings + Safe Fix Plan
  -> Transaction / Rollback
  -> Re-scan + Pre-release Check
```

## Modules chính

- `src/config/rules.ts`: profile hệ thống.
- `src/config/profileLoader.ts`: validate/import profile JSON.
- `src/rules/documentClassifier.ts`: phân loại body/heading/list/semantic role.
- `src/rules/ruleEngine.ts`: pure rule evaluation và normalized compliance score.
- `src/services/wordService.ts`: Office.js adapter, snapshot, safe fix, navigation, rollback.
- `src/services/rollbackStore.ts`: snapshot formatting/structure gần nhất trong phiên.
- `src/services/styleManager.ts`: HPC custom styles + outline levels.
- `src/services/headingNumberingService.ts`: numbering heading đa cấp với guard cho list hiện hữu.
- `src/services/tocService.ts`: insert/update Table of Contents với capability guard.
- `src/services/tableService.ts`: chuẩn hóa bảng không sửa cell text.
- `src/validators/sopValidator.ts`: presence/duplicate/order của SOP sections.
- `src/validators/preReleaseValidator.ts`: Ready / Review / Blocked.
- `src/ui/findingFilters.ts`: filter finding thuần, có unit test.
- `src/App.tsx`: Task Pane orchestration/UI.

## Document model

`DocumentSnapshot` giữ page setup, paragraph text/style/formatting và list metadata. Rule Engine không gọi Office.js trực tiếp; vì vậy phần lớn logic có thể unit test ngoài Word runtime.

Classifier ưu tiên metadata/style rõ ràng trước heuristic. Body rules chỉ áp lên paragraph role `body`; heading dùng rule riêng. Các semantic role như Signature/Caption/Recipient không bị ép theo body rule.

## Safe mutation

Flow sửa định dạng:

```text
readDocumentSnapshot()
  -> rollbackStore.save()
  -> apply mutation
  -> context.sync()
  -> scan lại
```

Rollback so sánh paragraph count/order/text trước khi restore formatting. Nếu nội dung/cấu trúc đã đổi, rollback bị chặn. Numbering chỉ tác động heading chưa thuộc list; rollback có thể detach list do add-in vừa tạo.

Mixed/Unknown font/cỡ chữ không auto-fix để tránh phá run-level formatting.

## Styles, numbering và TOC

`HPC.Heading1..4` có outline levels 1..4. Điều này cho phép Word Desktop dùng outline level khi tạo Table of Contents. Numbering sử dụng Word list API và định dạng đa cấp 1 / 1.1 / 1.1.1 / 1.1.1.1.

TOC cần `WordApiDesktop 1.4`; numbering/list metadata cần `WordApi 1.3`; custom style/outline level cần `WordApi 1.5`. Tất cả tính năng đều kiểm tra capability trước khi chạy.

## Scoring

Capability finding không làm giảm Compliance Score. Các finding thực sự được chấm theo tỷ lệ số check, với trọng số Critical > Warning > Suggestion, tránh tình trạng tài liệu dài tự động tụt về 0 chỉ vì nhiều lỗi nhỏ.

## Security / privacy boundary

- Không có backend/API cloud trong release này.
- Không upload nội dung tài liệu.
- Không lưu API key trong source hoặc manifest.
- Không tự sửa business text, Track Changes hoặc Comments.
- Custom Rule JSON chỉ được parse/validate local trong Task Pane.

## Production

Development dùng `https://localhost:3000`. Production manifest được sinh bằng `scripts/build-manifest.mjs` từ biến `ADDIN_ORIGIN`, bắt buộc HTTPS và được CI validate trước khi triển khai.
