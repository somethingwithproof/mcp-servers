> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

macOS 애플리케이션용 Model Context Protocol (MCP) 서버 모노레포입니다.

## 패키지

- `packages/*` 아래의 TypeScript 워크스페이스 패키지: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, `voice-memos`.
- `uv`로 관리되는 `packages/ical` 아래의 Python 패키지.

## 현지화

`packages/i18n`(`@somethingwithproof/mcp-i18n`)은 CLI 도움말, 진단, 오류 메시지 및 현지화된 메타데이터를 위해 45개 로캘(Tier 1 20개, 아프리카 15개, 아시아 10개)에 걸친 런타임 의존성 없는 TypeScript 현지화 도우미를 제공합니다. 로캘 감지는 `LC_ALL`, `LC_MESSAGES`, `LANG`(및 `--lang`)을 따르며, MCP 도구 스키마와 응답의 하위 호환성을 유지하기 위해 기본값은 영어입니다.

## 명령

```bash
npm install
npm run build
npm run test
npm run lint
```

## 라이선스

전체 [영문 README](../../../README.md)와 [LICENSE](../../../LICENSE)를 참조하세요.
