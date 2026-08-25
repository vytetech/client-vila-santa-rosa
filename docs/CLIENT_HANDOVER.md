# Entrega ao Cliente - Vila Santa Rosa

## Resumo do Projeto

Foi entregue uma aplicação web completa para a Pousada Vila Santa Rosa, composta por site institucional multi-idioma e painel administrativo para operação comercial da pousada.

O site foi desenvolvido para apresentar a pousada, suítes, localização, fotos, café da manhã, avaliações, regras, perguntas frequentes e fluxo de reserva com foco em conversão e SEO.

## Escopo Entregue

- Site público responsivo.
- Conteúdo disponível em 7 idiomas: português, inglês, espanhol, francês, árabe, chinês e japonês.
- Páginas pré-renderizadas para SEO.
- Painel administrativo protegido.
- Gestão de fotos do site.
- Gestão de suítes.
- Gestão de textos e aparência.
- Gestão de reservas.
- Gestão de preços por data.
- Gestão de noites mínimas e máximas.
- Gestão de datas bloqueadas.
- Gestão de cupons de desconto.
- Gestão de avaliações.
- Gestão de usuários.
- Área do hóspede.
- Login e redefinição de senha.
- Integração opcional com SMTP para e-mails.
- Integração opcional com Kimi OAuth.
- Banco MySQL com migrations versionadas.
- Deploy preparado para Railway.

## Acessos Principais

- Site público: domínio oficial configurado no Railway.
- Painel administrativo: `/admin-access`.
- Dashboard admin: `/admin`.
- Login do hóspede: `/login`.
- Conta do hóspede: `/conta`.

As credenciais reais devem ser entregues por canal seguro e nunca devem ser armazenadas no repositório.

## Infraestrutura

- Hospedagem: Railway.
- Runtime: Node.js 20.
- Banco de dados: MySQL.
- Uploads: Railway Volume.
- Build: Railpack.
- Start: `npm start`.

## Validações Realizadas

Comandos esperados antes de publicação:

```bash
npm ci --include=dev
npm run check
npm run lint
npm run test
npm run verify:assets
npm run build:full
```

O build completo gera:

- site estático em `dist/public`;
- backend empacotado em `dist/boot.js`;
- páginas SEO pré-renderizadas para os 7 idiomas.

## Itens que o Cliente Deve Preservar

- Acesso ao Railway.
- Variáveis de ambiente de produção.
- Banco MySQL.
- Volume persistente de uploads.
- Domínio e DNS.
- Credenciais administrativas.

## Recomendações Pós-Entrega

- Manter backup periódico do banco.
- Validar o site após qualquer alteração no painel.
- Não remover volume de uploads.
- Não alterar variáveis sensíveis sem orientação técnica.
- Atualizar imagens e textos pelo painel sempre que possível.
- Solicitar manutenção técnica antes de mudanças estruturais.
