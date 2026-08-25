# Variáveis de Ambiente

## Arquivo de Referência

Use `.env.example` como base.

Nunca commitar `.env` real.

## Obrigatórias em Produção

### `DATABASE_URL`

URL de conexão MySQL.

Usada por:

- API;
- queries;
- migrations;
- validação de schema.

Exemplo de formato:

```env
DATABASE_URL=mysql://usuario:senha@host:porta/banco
```

### `NODE_ENV`

Ambiente de execução.

Em produção:

```env
NODE_ENV=production
```

### `UPLOAD_DIR`

Diretório físico para uploads administrativos.

Em Railway:

```env
UPLOAD_DIR=/app/dist/public/images/uploads
```

Deve apontar para local coberto por volume persistente.

## Administrativas

### `ADMIN_USER`

Usuário do login clássico em `/admin-access`.

Se não definido, o sistema usa `admin`.

### `ADMIN_PASS`

Senha do login clássico em `/admin-access`.

Se não definida, esse fluxo fica bloqueado.

### `ADMIN_SESSION_TTL_MINUTES`

Duração da sessão administrativa.

Padrão:

```env
ADMIN_SESSION_TTL_MINUTES=120
```

## Kimi OAuth

Variáveis opcionais:

```env
APP_ID=
APP_SECRET=
KIMI_AUTH_URL=
KIMI_OPEN_URL=
OWNER_UNION_ID=
```

O site e o painel não devem depender dessas variáveis para carregar, mas fluxos OAuth só funcionam quando configurados corretamente.

## SMTP

Variáveis opcionais para redefinição de senha:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Sem SMTP configurado, funcionalidades de envio de e-mail podem não operar.

## npm/Railway

O build precisa de `devDependencies`, portanto não configurar:

```env
NPM_CONFIG_OMIT=dev
```

Também não configurar `production=true` no npm durante o estágio de build. Se aparecer warning:

```text
npm warn config production Use `--omit=dev` instead.
```

verificar variáveis do Railway ou configurações globais que estejam setando `production`.

## Segurança

- Não enviar tokens por prints, logs ou commits.
- Rotacionar senhas após compartilhamento por canal inseguro.
- Manter `DATABASE_URL` restrito ao ambiente de produção.
- Não usar credenciais reais em ambiente local compartilhado.
