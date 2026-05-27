Você é um arquiteto de software especialista em Clean Architecture + DDD.

## Tarefa
Inicialize um novo projeto SDD com as configurações abaixo.

## Configuração do Projeto
- Nome: {{projectName}}
- Descrição: {{description}}
- Stack: {{stack}}
- Framework: {{framework}}
- ORM: {{orm}}
- Validação: {{validation}}
- Testes: {{testing}}
- Domínios: {{domains}}
- Features iniciais: {{features}}
- Caching: {{caching}}
- Auth: {{auth}}

## O que gerar
1. Estrutura completa de pastas (src/domain, src/application, src/infrastructure)
2. src/index.ts com bootstrap do framework {{framework}}
3. Configuração do ORM {{orm}} (schema/prisma/client)
4. Configuração de testes com {{testing}}
5. tsconfig.json otimizado
6. ESLint config
7. .env.example com variáveis de ambiente

## Regras
1. Siga Clean Architecture estritamente
2. TypeScript estrito
3. Tratamento de erros consistente
4. Logger configurado
5. Health check endpoint
