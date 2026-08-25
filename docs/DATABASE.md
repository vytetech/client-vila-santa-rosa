# Banco de Dados

## Tecnologia

- Banco: MySQL.
- ORM: Drizzle ORM.
- Schema: `db/schema.ts`.
- Migrations: `db/migrations/`.
- Configuração Drizzle: `drizzle.config.ts`.

## Conexão

A conexão é lida por `DATABASE_URL`.

```env
DATABASE_URL=mysql://usuario:senha@host:porta/banco
```

Sem `DATABASE_URL`, comandos Drizzle e migrations não devem ser executados.

## Tabelas

### `users`

Usuários OAuth/Kimi e usuários admin.

Campos principais:

- `unionId`
- `name`
- `email`
- `avatar`
- `role`
- `createdAt`
- `updatedAt`
- `lastSignInAt`

### `guest_accounts`

Contas de hóspedes com usuário e senha.

Campos principais:

- `username`
- `passwordHash`
- `fullName`
- `phone`
- `email`
- `age`
- `hasPet`
- `gender`
- `petName`
- `petBreed`
- `petAge`
- `referralCode`
- `referredByCode`
- `hasLifetimeDiscount`
- `role`
- `isActive`
- `createdAt`

### `guest_sessions`

Sessões de hóspedes.

Campos principais:

- `token`
- `accountId`
- `expiresAt`
- `createdAt`

### `reviews`

Avaliações de hóspedes e destaques manuais.

Campos principais:

- `accountId`
- `authorName`
- `rating`
- `text`
- `source`
- `status`
- `createdAt`

### `referrals`

Indicações de hóspedes.

Campos principais:

- `referrerAccountId`
- `guestName`
- `checkIn`
- `checkOut`
- `status`
- `createdAt`

### `settings`

Configurações chave/valor do site e painel.

Campos principais:

- `key`
- `value`

### `booking_requests`

Solicitações de reserva.

Campos principais:

- `accountId`
- `guestName`
- `roomId`
- `checkIn`
- `checkOut`
- `guests`
- `pets`
- `phone`
- `couponCode`
- `paymentMethod`
- `platformSubtotalCents`
- `lodgingSubtotalCents`
- `petFeeCents`
- `couponDiscountCents`
- `totalCents`
- `depositBaseCents`
- `paymentFeeCents`
- `depositDueCents`
- `pricingSnapshot`
- `status`
- `createdAt`

### `suite_date_prices`

Preços específicos por suíte e data.

Campos principais:

- `roomId`
- `date`
- `price`

### `suite_date_min_nights`

Regras de mínimo e máximo de noites por suíte/data.

Campos principais:

- `roomId`
- `date`
- `minNights`
- `maxNights`

### `site_photos`

Fotos gerenciadas pelo painel.

Campos principais:

- `slot`
- `path`
- `alt`
- `sort`
- `createdAt`

### `blocked_dates`

Datas bloqueadas manualmente.

Campos principais:

- `roomId`
- `date`
- `createdAt`

Restrição:

- índice único `blocked_dates_room_date_unique` em `roomId` + `date`.

### `admin_tokens`

Tokens administrativos.

Campos principais:

- `token`
- `expiresAt`
- `createdAt`

### `password_resets`

Tokens de redefinição de senha.

Campos principais:

- `email`
- `token`
- `expiresAt`
- `used`
- `createdAt`

### `coupons`

Cupons de desconto.

Campos principais:

- `code`
- `percent`
- `active`
- `validFrom`
- `validUntil`
- `createdAt`

## Migrations Existentes

- `0001_production_schema_sync.sql`
- `0002_coupons_valid_until.sql`
- `0003_guest_accounts_is_active.sql`
- `0004_coupons_valid_from.sql`

## Aplicar Migrations

```bash
npm run db:push
```

Esse comando executa:

```bash
node scripts/db-migrate.mjs
node scripts/db-validate.mjs
```

## Cuidados

- Fazer backup antes de alterações estruturais.
- Não apagar tabelas de produção sem plano de migração.
- Não editar migrations já aplicadas sem controle.
- Preservar dados de reservas, hóspedes, cupons, bloqueios e fotos.
- Alterações no schema devem vir acompanhadas de migration e validação.
