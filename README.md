# sdd-boilerplate

**SDD CLI** — Spec-Driven Development with AI.

Scaffolds Node.js/TypeScript projects following Clean Architecture + DDD, generates structured specs in Markdown, and uses `opencode` as engine to produce consistent, high-quality code.

## Install

```bash
npm install -g sdd-boilerplate
```

## Usage

```bash
# Create a new project
sdd-boilerplate init

# Add a feature (wizard → spec → opencode generates code)
sdd-boilerplate feature create-order

# Refactor an existing feature
sdd-boilerplate refactor order-service

# Fix a bug (spec + code + regression test)
sdd-boilerplate bugfix "login fails with special chars"

# Validate project integrity
sdd-boilerplate validate

# List all specs and their status
sdd-boilerplate list --status
```

## How it works

1. **Wizard** — interactive prompts gather requirements
2. **Spec** — structured Markdown spec is generated (source of truth)
3. **Opencode** — pre-configured prompts call opencode to implement
4. **Guardrails** — AGENTS.md, skills, husky hooks prevent bad code

## License

MIT
