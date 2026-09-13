# Cài đặt máy thử nghiệm

## Yêu cầu

- Node.js 22 LTS hoặc tương thích.
- Microsoft Word Desktop.
- Quyền sideload Office Add-in.

## Các bước

```bash
git clone https://github.com/khoaiprovip123/Smart-document-assistant.git
cd Smart-document-assistant
npm install
npm run build
npm test
npm run validate:manifest
npm run dev
```

Mở terminal thứ hai:

```bash
npm run start:word
```

Nếu chứng chỉ localhost chưa được trust, bộ công cụ Office Add-in sẽ yêu cầu tạo/trust development certificate.

Khi pilot, luôn thử trên bản sao tài liệu trước khi áp dụng lên tài liệu chính thức.
