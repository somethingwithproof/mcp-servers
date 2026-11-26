> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo de servidores Model Context Protocol (MCP) para aplicativos do macOS.

## Pacotes

- Pacotes de workspace em TypeScript em `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` e `voice-memos`.
- Pacote Python em `packages/ical` gerenciado com `uv`.

## Localização

`packages/i18n` (`@somethingwithproof/mcp-i18n`) fornece um auxiliar de localização em TypeScript sem dependências de runtime para 45 locales (20 Tier 1, 15 africanos e 10 asiáticos) destinado à ajuda da CLI, diagnósticos, mensagens de erro e metadados localizados. A detecção de locale respeita `LC_ALL`, `LC_MESSAGES` e `LANG` (além de `--lang`), com padrão em inglês para que os esquemas e respostas das ferramentas MCP permaneçam retrocompatíveis.

## Comandos

```bash
npm install
npm run build
npm run test
npm run lint
```

## Licença

Consulte o [README em inglês](../../../README.md) completo e [LICENSE](../../../LICENSE).
