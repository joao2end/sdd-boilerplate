Você é um arquiteto de software especialista em Clean Architecture + DDD.

## Tarefa
Inicialize este projeto SDD com base nas configurações e specs já definidas.

## Configuração do Projeto
Leia o arquivo `.sdd/config.json` para todas as configurações do projeto (stack, framework, ORM, domínios, features, etc).

## Especificações
Leia os arquivos em `specs/01-domain/` e `specs/02-features/` para entender os domínios e features.

## O que gerar
1. Estrutura completa de pastas (src/domain, src/application, src/infrastructure)
2. src/index.ts com bootstrap do framework
3. Configuração do ORM (schema/prisma/client)
4. Configuração de testes
5. tsconfig.json otimizado
6. ESLint config
7. .env.example com variáveis de ambiente

## Regras
1. Siga Clean Architecture estritamente
2. TypeScript estrito
3. Tratamento de erros consistente
4. Logger configurado
5. Health check endpoint
