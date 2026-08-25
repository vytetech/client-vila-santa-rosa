# Guia de Operação - Vila Santa Rosa

Este guia orienta a operação diária do site e do painel administrativo.

## Acesso Administrativo

1. Acesse `/admin-access`.
2. Informe usuário e senha configurados nas variáveis `ADMIN_USER` e `ADMIN_PASS`.
3. Após login, o sistema redireciona para `/admin`.

Se `ADMIN_PASS` não estiver configurada, o login por `/admin-access` fica bloqueado. Contas administrativas do banco continuam válidas pelos fluxos internos da aplicação.

## Áreas do Painel

O painel possui telas para:

- Estatísticas e acompanhamento.
- Reservas.
- Calendário de preços.
- Noites mínimas e máximas.
- Datas bloqueadas.
- Cupons.
- Fotos.
- Suítes.
- Café da manhã.
- Textos.
- Aparência.
- Avaliações.
- Usuários.
- Integração iCal.

## Reservas

O fluxo de reserva considera:

- suíte selecionada;
- check-in e check-out;
- quantidade de hóspedes;
- pets;
- cupom, quando informado;
- subtotal de hospedagem;
- taxa de pet;
- desconto;
- total;
- valor de sinal/deposito;
- status da reserva.

Status possíveis:

- `pending`: pendente;
- `confirmed`: confirmada;
- `cancelled`: cancelada.

## Preços por Data

A tela de preços permite ajustar valores por suíte e data específica. Esses valores são usados no cálculo da reserva.

Boas práticas:

- cadastrar valores especiais com antecedência;
- revisar feriados e alta temporada;
- conferir total da reserva após alterações relevantes.

## Noites Mínimas e Máximas

A regra por data permite controlar restrições comerciais por suíte.

Campos principais:

- data;
- suíte;
- mínimo de noites;
- máximo de noites.

## Datas Bloqueadas

Use para fechar datas indisponíveis manualmente.

Cada bloqueio é associado a:

- suíte;
- data.

O banco possui regra única por suíte e data para evitar bloqueio duplicado.

## Cupons

Cupons possuem:

- código;
- percentual de desconto;
- status ativo/inativo;
- data inicial opcional;
- data final opcional.

## Fotos

As fotos administrativas são salvas como caminhos públicos em `/images/uploads/...`.

Em produção, o diretório de uploads deve apontar para volume persistente:

```env
UPLOAD_DIR=/app/dist/public/images/uploads
```

Não remover o volume no Railway, pois isso pode apagar imagens enviadas pelo painel.

## Avaliações

Avaliações podem ter origem:

- `site`: avaliação enviada pelo site;
- `booking`: destaque cadastrado manualmente.

Status:

- `pending`;
- `approved`;
- `rejected`.

Somente avaliações aprovadas devem aparecer publicamente.

## Usuários e Hóspedes

O sistema possui:

- usuários OAuth/Kimi, quando configurado;
- contas de hóspedes com usuário e senha;
- sessões de hóspedes;
- redefinição de senha por token.

Credenciais e dados pessoais devem ser tratados com cuidado e não devem ser exportados sem necessidade.

## iCal

A tela de iCal centraliza configuração/sincronização de calendário quando utilizada. Antes de alterar integrações externas, validar o contrato de calendário e impacto em disponibilidade.

## Rotina Recomendada

- Verificar reservas pendentes diariamente.
- Atualizar bloqueios e preços antes de períodos de alta demanda.
- Aprovar ou rejeitar avaliações pendentes.
- Conferir fotos e textos após atualizações.
- Validar cupons ativos periodicamente.
