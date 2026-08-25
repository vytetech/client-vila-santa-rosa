# Referência de API

## Protocolo

A API principal usa tRPC sobre Hono.

Endpoint base:

```text
/api/trpc/*
```

Rotas não encontradas em `/api/*` retornam JSON com status 404.

## Contexto e Autorização

Os routers são organizados por nível de acesso:

- `publicQuery`: acesso público ou com contexto opcional.
- `authedQuery`: exige usuário autenticado.
- `adminQuery`: exige permissão administrativa.

Sessões administrativas usam cookie HTTP-only definido pelo backend.

## Router Principal

Arquivo:

```text
api/router.ts
```

Procedimento básico:

- `ping`: retorna `{ ok: true, ts }`.

Routers montados:

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

## Módulos

### `auth`

Arquivo:

```text
api/auth-router.ts
```

Responsável por sessão autenticada e logout.

Procedures:

- `me`
- `logout`

### `accounts`

Arquivo:

```text
api/accounts-router.ts
```

Responsável por contas administrativas/de usuários.

Procedures principais:

- `list`
- mutações de criação, atualização, senha/status e permissões conforme validações do router.

### `guest`

Arquivo:

```text
api/guest-router.ts
```

Responsável por cadastro, login, sessão, logout e recuperação de acesso de hóspedes.

Procedures principais:

- cadastro;
- login;
- logout;
- atualização de conta;
- recuperação/redefinição;
- `me`;
- `requireMe`.

### `bookings`

Arquivo:

```text
api/booking-router.ts
```

Responsável por solicitações de reserva, reservas do hóspede e listagem administrativa.

Procedures principais:

- criação de reserva;
- `mine`;
- cancelamento/atualização pelo usuário;
- `adminList`;
- `stats`;
- atualização de status administrativo.

### `availability`

Arquivo:

```text
api/availability-router.ts
```

Responsável por disponibilidade, bloqueios e sincronização iCal.

Procedures principais:

- consulta de disponibilidade;
- consulta de datas bloqueadas;
- criação/remoção de bloqueios;
- `status`;
- `icalLinks`;
- `icalConfig`;
- atualização de configuração iCal;
- `syncNow`.

### `datePrices`

Arquivo:

```text
api/date-prices-router.ts
```

Responsável por preços por suíte/data.

Procedures principais:

- consulta por período;
- consulta administrativa;
- criação/atualização;
- remoção;
- limpeza por intervalo.

### `minNights`

Arquivo:

```text
api/min-nights-router.ts
```

Responsável por noites mínimas e máximas.

Procedures principais:

- `defaults`;
- `maxDefaults`;
- consulta por quarto;
- consulta por data;
- criação/atualização;
- remoção.

### `photos`

Arquivo:

```text
api/photos-router.ts
```

Responsável por fotos do site e painel.

Procedures principais:

- consulta pública por slot;
- `all`;
- upload/cadastro;
- reordenação;
- remoção.

### `coupons`

Arquivo:

```text
api/coupons-router.ts
```

Responsável por cupons de desconto.

Procedures principais:

- validação pública de cupom;
- `list`;
- criação;
- atualização;
- ativação/desativação;
- remoção.

### `reviews`

Arquivo:

```text
api/review-router.ts
```

Responsável por avaliações públicas, avaliações do hóspede e moderação administrativa.

Procedures principais:

- `listApproved`;
- `highlights`;
- `publicList`;
- criação;
- `mine`;
- `adminList`;
- atualização;
- aprovação;
- rejeição;
- remoção.

### `referrals`

Arquivo:

```text
api/referral-router.ts
```

Responsável por indicações.

Procedures principais:

- `mine`;
- `adminList`;
- criação;
- confirmação;
- remoção.

### `settings`

Arquivo:

```text
api/settings-router.ts
```

Responsável por configurações de preço, disponibilidade, site, textos, analytics, tema, café da manhã e legendas.

Procedures principais:

- `adminCheck`;
- `pricing`;
- atualização de preço;
- `availability`;
- atualização de disponibilidade;
- `syncIcal`;
- `site`;
- `texts`;
- atualização de textos;
- `analytics`;
- atualização de analytics;
- `theme`;
- atualização/reset de tema;
- `breakfast`;
- atualização de café da manhã;
- `photoCaptions`;
- atualização de legendas.

### `suites`

Arquivo:

```text
api/suites-router.ts
```

Responsável por listagem pública e administração de suítes.

Procedures principais:

- `publicList`;
- `adminList`;
- atualização administrativa.

## Rotas Hono Fora do tRPC

Arquivo:

```text
api/boot.ts
```

Rotas:

- `/admin-access` com `GET` e `POST`.
- callback OAuth Kimi definido em `contracts`.
- fallback `/api/*` com 404.

## Segurança da API

- Body limit: 50 MB.
- Cookies administrativos HTTP-only.
- Headers de segurança aplicados globalmente.
- CSP restritiva com permissões explícitas para imagens, fontes, analytics e scripts necessários.

## Cuidados ao Alterar API

- Preservar contratos tRPC usados pelo frontend.
- Validar inputs com schemas existentes.
- Não vazar dados sensíveis em erros.
- Manter rotas administrativas protegidas.
- Criar/atualizar testes ao mudar regra de negócio.
