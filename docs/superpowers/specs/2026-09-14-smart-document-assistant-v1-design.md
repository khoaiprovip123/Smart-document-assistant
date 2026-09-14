# Smart Document Assistant v1 Design

## Goal

Hoàn thiện HPC Smart Document Assistant thành Microsoft Word Add-in kiểm tra, chuẩn hóa và quản trị thể thức tài liệu theo profile, ưu tiên an toàn tài liệu và khả năng triển khai nội bộ.

## Product principles

- Không tự sửa nội dung nghiệp vụ.
- Không gửi nội dung tài liệu ra dịch vụ ngoài.
- Mọi auto-fix phải có preview/finding và chỉ sửa rule đã chọn hoặc nhóm safe-fix.
- Mixed/unknown formatting không được auto-fix nếu có nguy cơ phá định dạng cục bộ.
- Rollback phải chặn khi cấu trúc/nội dung tài liệu đã thay đổi sau snapshot.
- ND30 chỉ tuyên bố kiểm tra các rule mà engine thực sự hỗ trợ; không gắn nhãn full legal compliance.

## Target architecture

Word document -> Office.js adapter -> DocumentSnapshot -> classifier -> role-aware rule engine -> findings/fix plan -> transaction/rollback -> re-scan/report.

### Document model

Paragraph được phân loại thành: body, heading1..4, list, caption, signature, recipient, note, appendix, tableText, unknown. Snapshot giữ style, list metadata và formatting. Snapshot table giữ row/column/style/header metadata khi WordApi hỗ trợ.

### Rule engine

Rule thân bài chỉ áp cho role=body. Heading có rule riêng. Capability findings tách khỏi compliance score. Score là tỷ lệ tuân thủ chuẩn hóa theo số check thay vì trừ điểm tuyệt đối theo số lỗi.

### Safe-fix transaction

`applyFindings` và `normalizeSelectedText` đều tạo rollback snapshot trước khi sửa. Rollback chỉ thực hiện khi paragraph count/order/text không đổi. Navigation tới finding chỉ chọn đoạn, không sửa nội dung.

### Styles

HPC styles gồm Normal, Title, SubTitle, Heading1..4, Table, TableHeader, Caption, Note, Signature, Recipient, Appendix với blueprint formatting có ý nghĩa, không chỉ font name.

### Structure and document tools

SOP validator kiểm tra presence, duplicate và order của section. Heading validator kiểm tra level/style và numbering suggestion. Table standardizer áp font/cỡ chữ/alignment/header-row theo API được hỗ trợ. Pre-release checker tổng hợp critical/warning/capability để người dùng biết tài liệu có sẵn sàng phát hành hay không.

### UI/UX

Task pane có dashboard score, trạng thái phát hành, filter severity, nhóm finding theo scope/paragraph, chọn safe-fix, điều hướng tới vị trí lỗi, rescan sau fix/rollback. DRAFT profile được cảnh báo rõ.

### Deployment

Development tiếp tục dùng localhost HTTPS. Production dùng manifest riêng sinh từ `manifest.xml` bằng script thay origin. CI build/test/manifest validation và chống workflow chồng bằng concurrency.

## Explicit non-goals for this release

- Không dùng AI cloud để đọc nội dung.
- Không tự rewrite câu chữ.
- Không tự accept Track Changes/xóa Comments.
- Không tuyên bố kiểm tra toàn bộ mọi quy định pháp lý của Nghị định 30 nếu Office.js/model chưa biểu diễn được.

## Verification

- TypeScript build.
- Unit tests classifier/rule engine/SOP/rollback/style/pre-release.
- Office manifest validation.
- GitHub Actions CI success trên HEAD main.
- Smoke test Word Desktop do người dùng thực hiện sau khi nhận bản hoàn thiện.
