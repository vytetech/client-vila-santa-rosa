<!-- Apresentação pública padronizada pela VyteTech; documentação técnica original mantida abaixo. -->

<div align="center">

# Pousada Vila Santa Rosa

**Projeto desenvolvido pela [VyteTech](https://vytetech.com)** · Engenharia de software e soluções digitais

[Portfólio VyteTech](https://github.com/vytetech/VyteTech/blob/main/docs/PORTFOLIO.md) · [Contato](mailto:contato@vytetech.com)

</div>

> **Visão geral:** Plataforma digital de hospitalidade com reservas, área do hóspede e painel administrativo.

### Entregas e funcionalidades

- Site multilíngue e pré-renderização para SEO
- Fluxo de reserva e área do hóspede
- Administração de acomodações, preços, disponibilidade e conteúdo

**Tecnologias principais:** React, TypeScript, Vite, Hono, tRPC, MySQL e Railway.

**Direitos e uso:** código publicado com autorização do cliente. A disponibilidade pública não representa concessão automática de licença para reutilização ou redistribuição; aplicam-se os direitos e acordos pertinentes.

Para divulgação responsável de questões de segurança, consulte [SECURITY.md](SECURITY.md).

---

<details>
<summary><strong>Documentação técnica original do projeto (abrir)</strong></summary>

# Vila Santa Rosa

Website oficial e painel administrativo da Pousada Vila Santa Rosa, em Ilhabela.

O projeto entrega site público multi-idioma, pré-renderização SEO, fluxo de reservas, área do hóspede, painel administrativo, gestão de fotos, suítes, preços, noites mínimas, datas bloqueadas, cupons, avaliações e usuários.

## Stack

- Frontend: React 19, Vite 7, TypeScript, Tailwind CSS, Radix UI.
- Backend: Hono, tRPC, Node.js.
- Banco de dados: MySQL com Drizzle ORM.
- Testes: Vitest.
- Build: Vite, scripts de prerender/SEO e esbuild para o backend.
- Deploy: Railway com Railpack.

## Requisitos

- Node.js 20.
- npm 10.x, compatível com `>=10.5.0 <11`.
- MySQL acessível por `DATABASE_URL`.

O projeto possui `.node-version` e `.nvmrc` com Node 20.

## Instalação Local

```bash
npm ci --include=dev
```

O projeto usa o registry oficial configurado em `.npmrc`:

```text
https://registry.npmjs.org/
```

## Desenvolvimento

```bash
npm run dev
```

Rotas principais:

- `/` redireciona para `/pt/`.
- `/pt/`, `/en/`, `/es/`, `/fr/`, `/ar/`, `/zh/`, `/ja/`: site público.
- `/login`: login do hóspede.
- `/conta`: área do hóspede.
- `/pagamento`: etapa de pagamento/reserva.
- `/admin-access`: login administrativo por usuário e senha.
- `/admin`: painel administrativo.

## Scripts

```bash
npm run check          # TypeScript
npm run lint           # ESLint
npm run test           # Vitest
npm run verify:assets  # valida referências internas de assets
npm run seo:check      # valida SEO pré-renderizado
npm run build:full     # build completo de produção
npm start              # inicia dist/boot.js em produção
```

Banco:

```bash
npm run db:push
```

`db:push` executa migrations versionadas/idempotentes em `scripts/db-migrate.mjs` e valida o schema com `scripts/db-validate.mjs`. Ele não usa `drizzle-kit push` em produção para evitar prompt interativo.

## Build de Produção

```bash
npm run build:full
```

Esse comando executa:

1. `vite build`
2. `node scripts/prerender.mjs`
3. `node scripts/seo-validate.mjs`
4. `esbuild api/boot.ts --platform=node --bundle --format=esm --outdir=dist`

Saída esperada:

- `dist/public`: frontend estático.
- `dist/boot.js`: backend Node empacotado.
- rotas pré-renderizadas para `/pt/`, `/en/`, `/es/`, `/fr/`, `/ar/`, `/zh/`, `/ja/`.

## Variáveis de Ambiente

Consulte `.env.example` e [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

Obrigatórias em produção:

```env
DATABASE_URL=
NODE_ENV=production
UPLOAD_DIR=/app/dist/public/images/uploads
```

Opcionais:

```env
ADMIN_USER=
ADMIN_PASS=
ADMIN_SESSION_TTL_MINUTES=120
APP_ID=
APP_SECRET=
KIMI_AUTH_URL=
KIMI_OPEN_URL=
OWNER_UNION_ID=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

## Deploy Railway

O Railway usa `railpack.json`.

Pipeline esperado:

- Install: `npm ci --include=dev`
- Build: `npm run build:full`
- Start: `npm start`

Antes de publicar:

```bash
npm ci --include=dev
npm run check
npm run lint
npm run test
npm run verify:assets
npm run build:full
```

Depois das validações, o deploy pode ser executado pelo responsável do projeto:

```bash
railway up
```

Não relinkar o serviço Railway sem necessidade. O diretório deve continuar vinculado ao projeto e serviço existentes.

## Documentação

- [Entrega ao Cliente](docs/CLIENT_HANDOVER.md)
- [Guia de Operação](docs/OPERATION_GUIDE.md)
- [Deploy e Produção](docs/DEPLOYMENT.md)
- [Arquitetura Técnica](docs/TECHNICAL_OVERVIEW.md)
- [Referência de API](docs/API_REFERENCE.md)
- [Banco de Dados](docs/DATABASE.md)
- [Variáveis de Ambiente](docs/ENVIRONMENT.md)
- [Manutenção](docs/MAINTENANCE.md)

## Observações de Produção

- Não commitar `.env` com credenciais reais.
- Não remover `package-lock.json`.
- Não instalar Vite globalmente.
- `devDependencies` são necessárias durante o build.
- O build não depende de Playwright nem Chromium.
- Uploads administrativos devem usar volume persistente no Railway.


</details>
