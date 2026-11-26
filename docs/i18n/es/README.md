> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorrepositorio de servidores de Model Context Protocol (MCP) para aplicaciones de macOS.

## Paquetes

- Paquetes de espacio de trabajo en TypeScript bajo `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` y `voice-memos`.
- Paquete en Python bajo `packages/ical` gestionado con `uv`.

## Localización

`packages/i18n` (`@somethingwithproof/mcp-i18n`) proporciona una utilidad de localización en TypeScript sin dependencias de ejecución para 45 configuraciones regionales (20 de nivel 1, 15 africanas y 10 asiáticas) destinada a la ayuda de la CLI, los diagnósticos, los mensajes de error y los metadatos localizados. La detección de configuración regional respeta `LC_ALL`, `LC_MESSAGES` y `LANG` (además de `--lang`), y utiliza el inglés de forma predeterminada para que los esquemas y respuestas de las herramientas MCP mantengan la compatibilidad con versiones anteriores.

## Comandos

```bash
npm install
npm run build
npm run test
npm run lint
```

## Licencia

Consulta el [README completo en inglés](../../../README.md) y [LICENSE](../../../LICENSE).
