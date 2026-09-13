# Architecture

## Mục tiêu

HPC Smart Document Assistant là Microsoft Word Add-in, không phải VBA macro. Thiết kế ưu tiên: an toàn tài liệu, rule có cấu hình, triển khai tập trung và mở rộng thành nền tảng Document Governance.

## Modules MVP

- `src/config/rules.ts`: rule profile.
- `src/rules/ruleEngine.ts`: đánh giá snapshot, không phụ thuộc Word runtime.
- `src/services/wordService.ts`: Office.js adapter để đọc/sửa document.
- `src/services/rollbackStore.ts`: snapshot formatting gần nhất trong phiên.
- `src/services/styleManager.ts`: tạo custom styles HPC.
- `src/validators/sopValidator.ts`: kiểm tra cấu trúc SOP.
- `src/App.tsx`: Task Pane UI.

## Luồng scan

```text
Word document
  -> readDocumentSnapshot()
  -> DocumentSnapshot
  -> evaluateDocument(profile, snapshot)
  -> DocumentCheckResult
  -> Preview UI
```

## Luồng sửa

```text
User selects findings
  -> save rollback snapshot
  -> apply selected formatting only
  -> context.sync()
  -> scan lại
```

## Nguyên tắc dữ liệu

MVP xử lý formatting và cấu trúc. Không gửi nội dung tài liệu ra dịch vụ bên ngoài. Không tự ý sửa nội dung nghiệp vụ.
