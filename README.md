# Vila Santa Rosa

Aplicação oficial da Pousada Vila Santa Rosa, construída com React, Vite, Hono, tRPC, Drizzle ORM e MySQL.

## Produção

Infraestrutura oficial:

- Railway
- Node.js 20
- MySQL Railway via `DATABASE_URL`
- Railway Volume para uploads administrativos
- Build: `npm run build:full`
- Pre-deploy: `npm run db:push`
- Start: `npm start`

Não é necessário relinkar o projeto Railway. O diretório atual deve continuar vinculado ao projeto e serviço existentes.

## Variáveis

Obrigatórias:

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

## Desenvolvimento

```bash
npm ci --registry=https://registry.npmjs.org/
npm run dev
```

## Validação

```bash
npm run check
npm run lint
npm run test
npm run verify:assets
npm run build:full
```

`npm run db:push` executa migrations versionadas/idempotentes em
`scripts/db-migrate.mjs` e valida o schema com `scripts/db-validate.mjs`.
Ele não usa `drizzle-kit push`, porque esse comando pode pedir confirmação
interativa em produção.

## Deploy

Após validação local:

```bash
railway up
```

O comando acima deve publicar no mesmo serviço Railway já vinculado.
