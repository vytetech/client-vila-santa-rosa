# Governança documental — Cliente Vila Santa Rosa

**Versão 0.1 | 11/11/2026 | Status: proposta | Classificação: publico**

Aplicação do padrão de governança corporativo ao projeto. A documentação já existente deve ser preservada e referenciada, não substituída.

## Princípios e responsabilidades
- GitHub: documentação técnica versionada com o código, PRs, testes, ADRs e runbooks.
- Google Drive: governança, contrato, autorização, entregas, atas e materiais comerciais, com acesso mínimo.
- Revisão documental na mesma PR que muda a arquitetura, contrato, schema, segurança ou processo operacional.
- Dono técnico e aprovador precisam ser nomeados; esta proposta não implica aprovação nem conformidade validada.
- Marcar cada afirmação operacional como **verificada**, **documentada ainda não validada** ou **pendente**.
- Preservar documentação anterior, registrar substituições e não apagar histórico sem análise.
- Revisar em mudanças materiais, releases relevantes e inventário trimestral.

## Fluxo de mudança
~~~mermaid
flowchart LR
 A[Demanda] --> B[Análise de impacto]
 B --> C[Decisão e documentação]
 C --> D[PR e testes]
 D --> E[Revisão de segurança]
 E --> F[Aprovação]
 F --> G[Release e handover]
~~~

## Matriz de documentação
| Área | Cobertura mínima | Estado da verificação |
|---|---|---|
| Visão e escopo | Problema, público, requisitos, limites e aceites | A conferir por evidência |
| Arquitetura | C4, componentes, dependências, fluxo de dados | A conferir por evidência |
| API e dados | Contratos, autenticação, autorização, migração e retenção | A conferir por evidência |
| Segurança | Fronteiras de confiança, riscos, classificação, LGPD | A conferir por evidência |
| Operação | Deploy, smoke-test, rollback, backups e incidentes | A conferir por evidência |
| Qualidade | CI, testes, evidências e revisão de código | A conferir por evidência |
| Decisões | ADRs, alternativas, consequências e aprovações | A conferir por evidência |
| Entrega | Changelog, handover, aceite, ownership e manutenção | A conferir por evidência |

## Modelo de metadados
| Campo | Exemplo |
|---|---|
| ID | VYT-DOC-001 |
| Status | Rascunho / Revisão / Aprovado / Obsoleto |
| Classificação | Público / Interno / Confidencial |
| Proprietário | Papel responsável |
| Versão e revisão | SemVer documental, data e PR |
| Evidências | Links de arquivos, testes e commits |
| Próxima revisão | Evento, release ou data |

## Segurança da informação
- Nunca documentar tokens, senhas, chaves privadas ou recovery codes; manter segredos em vault.
- Material de clientes, contratos e dados pessoais somente no Drive ou sistemas restritos autorizados.
- Em repositórios públicos: não expor topologia interna, dados identificáveis, credenciais, instruções sensíveis ou documentos contratuais.
- A proteção de dados e permissões deve ser verificada em cada sistema, não presumida.

## Verificações específicas
- Confirmar código e arquitetura atuais do Cliente Vila Santa Rosa antes de declarar estado de produção.
- Inventariar os documentos já presentes em README e docs/ e mapear lacunas sem duplicação.
- Confirmar contratos, fluxos, sistemas externos, incidentes, rollback e testes usando evidências.
- Referência corporativa após aprovação: https://github.com/vytetech/VyteTech/blob/main/docs/DOCUMENTATION_STANDARD.md

## Pendências para aprovação
1. Designar proprietário e aprovador.
2. Revisar os riscos e a classificação antes de publicar novas informações.
3. Validar a cobertura documental com a equipe responsável.
4. Aprovar a PR; nenhuma mudança funcional é incluída.
