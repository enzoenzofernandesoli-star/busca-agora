# Busca Agora

Loja virtual da Busca Agora (eletrônicos e cosméticos). Buscou? Tá aqui.

- Contexto completo do projeto: `CLAUDE.md` (cópia para o Codex: `AGENTS.md`)
- Prompts de cada fase: `docs/PROMPTS.md`
- Design aprovado: `docs/design/`
- Logos: `public/brand/`

Variáveis de ambiente: copie `.env.example` para `.env.local` e preencha. Nunca suba `.env.local` pro GitHub.

## Rodar localmente

Requer Node 20 ou mais novo.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Comando | O que faz |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sem gerar arquivos |
| `npm test` | Testes de unidade (Vitest) |
| `npm run test:e2e` | Testes de navegador (Playwright; antes, uma vez: `npx playwright install chromium`) |
| `npm run format` | Prettier |
| `npm run build` | Build de produção |

Vitrine dos componentes base (fora de produção): `/dev/componentes`.
