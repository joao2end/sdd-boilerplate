Você é um engenheiro de software especialista em Clean Architecture + DDD.

## Contexto do Projeto
- Stack: {{stack}}
- Tipo: {{#if (eq projectType "fullstack")}}Fullstack{{else if (eq projectType "frontend")}}Frontend{{else}}API{{/if}}
- Arquitetura: Clean Architecture (domain → application → infrastructure)
- Backend framework: {{framework}}{{#if (and (neq frontendFramework "none") (or (eq projectType "fullstack") (eq projectType "frontend")))}}
- Frontend framework: {{frontendFramework}}{{#if (neq designSystem "none")}}
- Design system: {{designSystem}}{{/if}}{{/if}}
- ORM: {{orm}}
- Validação: {{validation}}
- Testes: {{testing}}

## Tarefa
Implemente a feature descrita na spec em anexo.

## Regras OBRIGATÓRIAS
1. Siga EXATAMENTE os tipos e interfaces definidos na spec
2. Implemente TODAS as regras de negócio listadas na seção "Business Rules"
3. Implemente TODOS os erros listados na seção "Error Scenarios"
4. Siga o cenário principal descrito em "Main Success Scenario"
5. Trate TODOS os fluxos alternativos listados
6. NÃO adicione funcionalidades não especificadas
7. Se algo estiver faltando na spec, PARE e pergunte — não invente

## Estrutura Esperada
Para {{domain}}/{{name}}:
- src/domain/{{domain}}/entities/*.ts
- src/application/{{domain}}/command.ts
- src/application/{{domain}}/handler.ts
- src/application/{{domain}}/port.ts
- src/infrastructure/persistence/*-repository.ts

## Após implementar
1. Atualize o .sdd/traceability.json marcando a implementação como concluída
2. Gere testes unitários para todos os cenários da spec
3. Execute typecheck e lint
