# Deploy e Produção

## Ambiente Oficial

- Plataforma: Railway.
- Builder: Railpack.
- Runtime: Node.js 20.
- Banco: MySQL via `DATABASE_URL`.
- Uploads: Railway Volume.
- Start command: `npm start`.

## Arquivos de Configuração

- `railpack.json`: pipeline de install/build/start.
- `.npmrc`: registry oficial e ajustes npm.
- `.node-version`: Node 20.
- `.nvmrc`: Node 20.
- `package-lock.json`: lockfile obrigatório.

## Railpack

Configuração atual:

```json
{
  "$schema": "https://schema.railpack.com",
  "steps": {
    "install": {
      "deployOutputs": [],
      "commands": [
        { "path": "/app/node_modules/.bin" },
        { "src": "package-lock.json", "dest": "package-lock.json" },
        { "src": "package.json", "dest": "package.json" },
        { "src": ".npmrc", "dest": ".npmrc" },
        "npm ci --include=dev"
      ]
    },
    "build": {
      "commands": ["npm run build:full"]
    }
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

## Pipeline Esperado

Install:

```bash
npm ci --include=dev
```

Build:

```bash
npm run build:full
```

Start:

```bash
npm start
```

## Build Completo

`npm run build:full` executa:

- `vite build`;
- `scripts/prerender.mjs`;
- `scripts/seo-validate.mjs`;
- `esbuild api/boot.ts`.

O build gera `dist/public` e `dist/boot.js`.

## Package Manager

O projeto usa npm 10.x nativo do ambiente Node.

Configuração:

```json
{
  "engines": {
    "node": ">=18.0.0 <25.0.0",
    "npm": ">=10.5.0 <11"
  }
}
```

Não há `packageManager` fixando npm via Corepack. Isso evita dependência frágil de `/opt/corepack` no plano do Railpack.

## Variáveis Obrigatórias

```env
DATABASE_URL=
NODE_ENV=production
UPLOAD_DIR=/app/dist/public/images/uploads
```

## Deploy Seguro

Antes de publicar:

```bash
npm ci --include=dev
npm run check
npm run lint
npm run test
npm run verify:assets
npm run build:full
```

Depois:

```bash
railway up
```

## Pontos de Atenção

- Não remover `package-lock.json`.
- Não trocar `npm ci` por `npm install`.
- Não configurar `omit=dev` no estágio de build.
- Não instalar Vite globalmente.
- Não criar `/opt/corepack` manualmente.
- Não remover SEO/prerender.
- Não reintroduzir Playwright/Chromium no build.
- Não relinkar o serviço Railway sem necessidade.

## Diagnóstico de Falhas

`vite: not found` normalmente indica que `npm ci` falhou ou que `devDependencies` foram omitidas.

`lstat /opt/corepack: no such file or directory` indica plano Railpack tentando copiar Corepack inexistente. A correção é não forçar npm via `packageManager` quando o npm nativo 10.x é suficiente.

`EBADENGINE` com npm indica incompatibilidade entre `engines.npm` e a versão real em execução.
