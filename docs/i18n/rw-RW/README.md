> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo ya seriveri za Model Context Protocol (MCP) zigenewe porogaramu za macOS.

## Amapaki

- Amapaki y'aho bakorera ya TypeScript ari munsi ya `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, na `voice-memos`.
- Ipaki ya Python iri munsi ya `packages/ical` iyoborwa hakoreshejwe `uv`.

## Ishyirwa mu ndimi

`packages/i18n` (`@somethingwithproof/mcp-i18n`) itanga igikoresho gifasha gushyira mu ndimi cya TypeScript kidakenera ibindi bikoresho mu gihe cyo gukora mu ndimi 45 (indimi 20 z'icyiciro cya 1, 15 zo muri Afurika, na 10 zo muri Aziya) ku bufasha bwa CLI, isuzuma, ubutumwa bw'amakosa, n'amakuru ya metadata yashyizwe mu ndimi. Kumenya ururimi bikurikiza `LC_ALL`, `LC_MESSAGES`, na `LANG` (hamwe na `--lang`), bigahera ku Cyongereza kugira ngo imiterere ya MCP tool n'ibisubizo bikomeze guhuza n'ibya kera.

## Amabwiriza

```bash
npm install
npm run build
npm run test
npm run lint
```

## Uruhushya

Reba [README yuzuye mu Cyongereza](../../../README.md) na [LICENSE](../../../LICENSE).
