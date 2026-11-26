> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo chứa các máy chủ Model Context Protocol (MCP) dành cho các ứng dụng macOS.

## Các gói

- Các gói workspace TypeScript trong `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` và `voice-memos`.
- Gói Python trong `packages/ical` được quản lý bằng `uv`.

## Bản địa hóa

`packages/i18n` (`@somethingwithproof/mcp-i18n`) cung cấp trình hỗ trợ bản địa hóa TypeScript không phụ thuộc thư viện runtime cho 45 ngôn ngữ địa phương (20 ngôn ngữ Bậc 1, 15 ngôn ngữ châu Phi và 10 ngôn ngữ châu Á), phục vụ phần trợ giúp CLI, chẩn đoán, thông báo lỗi và siêu dữ liệu đã bản địa hóa. Việc nhận diện ngôn ngữ tuân theo `LC_ALL`, `LC_MESSAGES` và `LANG` (cùng `--lang`), mặc định là tiếng Anh để lược đồ công cụ MCP và phản hồi luôn duy trì tính tương thích ngược.

## Các lệnh

```bash
npm install
npm run build
npm run test
npm run lint
```

## Giấy phép

Xem đầy đủ [README tiếng Anh](../../../README.md) và [LICENSE](../../../LICENSE).
