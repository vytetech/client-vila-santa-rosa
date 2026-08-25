# Arquitetura Técnica

## Visão Geral

A aplicação combina frontend React/Vite com backend Node/Hono/tRPC. Em produção, o frontend é gerado como arquivos estáticos e o backend é empacotado em `dist/boot.js`.

## Entrada da Aplicação

- `src/main.tsx`: entrada do frontend.
- `src/App.tsx`: roteamento React.
- `api/boot.ts`: aplicação Hono, segurança, tRPC e arquivos estáticos.
- `index.js`: entrada de produção executada por `npm start`.

## Rotas Frontend

- `/`: redireciona para `/pt/`.
- `/:locale/`: home pública localizada.
- `/login`: login.
- `/conta`: área do hóspede.
- `/pagamento`: pagamento/reserva.
- `/redefinir-senha`: redefinição de senha.
- `/admin`: painel administrativo.
- `*`: página 404.

Idiomas públicos suportados:

- `pt`
- `en`
- `es`
- `fr`
- `ar`
- `zh`
- `ja`

## API

Endpoint tRPC:

```text
/api/trpc/*
```

Health básico:

```text
appRouter.ping
```

Routers tRPC:

- `auth`
- `accounts`
- `guest`
- `reviews`
- `referrals`
- `settings`
- `availability`
- `bookings`
- `datePrices`
- `minNights`
- `photos`
- `coupons`
- `suites`

Rotas Hono especiais:

- `/admin-access`: login administrativo clássico.
- callback OAuth Kimi definido por `Paths.oauthCallback`.

## Segurança

O backend aplica headers de segurança:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Content-Security-Policy`

Também há limite de body:

```text
50 MB
```

Esse limite suporta uploads administrativos e evita payloads excessivos.

## Banco de Dados

ORM:

- Drizzle ORM.

Dialeto:

- MySQL.

Arquivo principal:

- `db/schema.ts`

Tabelas principais:

- `users`: usuários OAuth/Kimi e admins.
- `guest_accounts`: contas de hóspedes.
- `guest_sessions`: sessões de hóspedes.
- `reviews`: avaliações.
- `referrals`: indicações.
- `settings`: configurações chave/valor.
- `booking_requests`: solicitações de reserva.
- `suite_date_prices`: preços por suíte/data.
- `suite_date_min_nights`: mínimo/máximo de noites por suíte/data.
- `site_photos`: fotos gerenciadas pelo painel.
- `blocked_dates`: datas bloqueadas por suíte.
- `admin_tokens`: tokens administrativos.
- `password_resets`: tokens de redefinição de senha.
- `coupons`: cupons de desconto.

Migrations:

- `db/migrations/`
- `scripts/db-migrate.mjs`
- `scripts/db-validate.mjs`

## Estrutura de Pastas

```text
api/                 Backend Hono/tRPC, routers, queries e libs
contracts/           Constantes/contratos compartilhados
db/                  Schema, relations, seed e migrations
public/              Assets públicos
scripts/             Build, SEO, banco, snapshots e validações
src/                 Frontend React
src/components/      Componentes reutilizáveis
src/components/ui/   Componentes de UI
src/config/          Configurações de site/SEO
src/data/            Dados estáticos
src/hooks/           Hooks React
src/i18n/            Traduções e contexto de idioma
src/pages/           Páginas da aplicação
src/sections/        Seções do site público
```

## SEO

O SEO é tratado por:

- `scripts/prerender.mjs`
- `scripts/seo-validate.mjs`
- `scripts/seo-data.mjs`
- `src/config/seoCopy.ts`

O build valida as rotas pré-renderizadas para os 7 idiomas.

## Uploads

Fotos enviadas pelo painel são referenciadas na tabela `site_photos` e servidas a partir de caminhos públicos como:

```text
/images/uploads/arquivo.jpg
```

Em produção, o diretório deve estar em volume persistente.

## Testes

Testes ficam principalmente em `api/*.test.ts` e `api/lib/*.test.ts`.

Execução:

```bash
npm run test
```

## Convenções Importantes

- Preservar TypeScript.
- Preservar tRPC para contratos frontend/backend.
- Preservar migrations idempotentes.
- Não remover prerender/SEO.
- Não mover uploads para diretório sem persistência.
- Não expor secrets em logs ou arquivos versionados.
