# Manutenção

## Checklist Antes de Alterações

1. Confirmar objetivo da alteração.
2. Identificar arquivos relacionados.
3. Verificar impacto em site público, painel, banco e deploy.
4. Rodar validações locais.
5. Publicar somente após build passar.

## Validações Padrão

```bash
npm ci --include=dev
npm run check
npm run lint
npm run test
npm run verify:assets
npm run build:full
```

## Banco de Dados

Para aplicar migrations:

```bash
npm run db:push
```

Cuidados:

- Não editar migrations já aplicadas sem avaliação.
- Não fazer alterações destrutivas sem backup.
- Validar `DATABASE_URL` antes de rodar comandos de banco.
- Preservar dados de reservas, hóspedes, cupons e uploads.

## Deploy

Fluxo recomendado:

1. Rodar validações locais.
2. Conferir variáveis no Railway.
3. Rodar deploy.
4. Abrir site público.
5. Testar `/admin-access`.
6. Verificar imagens enviadas.
7. Conferir uma rota por idioma.

## Backups

Recomendado:

- backup periódico do MySQL;
- backup/export de uploads do volume;
- registro de alterações em produção.

Antes de mudanças maiores:

- exportar banco;
- confirmar volume de uploads;
- preservar versão anterior do deploy.

## Atualização de Dependências

Não atualizar dependências em lote sem necessidade.

Fluxo seguro:

```bash
npm outdated
npm install pacote@versao
npm run check
npm run lint
npm run test
npm run build:full
```

Manter `package-lock.json` versionado.

## Problemas Comuns

### `vite: not found`

Normalmente indica que `npm ci` falhou ou que `devDependencies` foram omitidas.

Verificar:

- `npm ci --include=dev`;
- ausência de `omit=dev`;
- ausência de `production=true` no estágio de build.

### `dist/boot.js` não encontrado

O backend de produção não foi gerado.

Rodar:

```bash
npm run build:full
```

### Uploads sumiram após deploy

Verificar:

- `UPLOAD_DIR`;
- volume Railway;
- montagem do volume;
- se arquivos foram enviados para diretório persistente.

### Erro de banco

Verificar:

- `DATABASE_URL`;
- status do MySQL Railway;
- migrations;
- logs do serviço.

### SEO falhando

Rodar:

```bash
npm run build:full
```

Se `seo-validate` falhar, revisar:

- `scripts/seo-data.mjs`;
- `src/config/seoCopy.ts`;
- rotas pré-renderizadas.

## Itens que Não Devem Ser Alterados Sem Necessidade

- Stack principal.
- Pipeline `npm ci --include=dev` e `npm run build:full`.
- Estrutura do banco.
- Caminho persistente de uploads.
- Prerender e validação SEO.
- Rotas públicas multi-idioma.
- Serviço Railway vinculado.
