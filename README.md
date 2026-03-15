# stackweave

[![CI](https://github.com/stackweavehq/stackweave/actions/workflows/ci.yml/badge.svg)](https://github.com/stackweavehq/stackweave/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/stackweave)](https://www.npmjs.com/package/stackweave)
[![license](https://img.shields.io/npm/l/stackweave)](./LICENSE)

**Helm for Claude Code configs.** Compose `.claude/` directories from reusable, stackable configuration modules. Declare your stack in a `.stackweave.yaml` file and let stackweave resolve dependencies, merge fragments by layer priority, interpolate variables, and write the final `.claude/` output.

## Install

```bash
npm install -g stackweave
# or use directly
npx stackweave generate
```

## Quick start

**1. Create `.stackweave.yaml` in your project root:**

```yaml
project:
  name: my-app
  description: A React Native app

modules:
  - base-conventions
  - typescript-strict:
      strict_mode: true
      target: "ES2022"
  - react-native
```

**2. Run generate:**

```bash
npx stackweave generate
# or, with a custom config path:
npx stackweave generate --config path/to/.stackweave.yaml
```

**3. Your `.claude/` directory is ready:**

```
.claude/
├── CLAUDE.md          # merged from all modules, ordered by layer
├── rules/
│   ├── git-conventions.md
│   ├── typescript-rules.md
│   └── react-native-rules.md
└── commands/
    └── build-debug.md
```

## How it works

Modules are organized into **layers** (priority order, higher wins on conflicts):

| Layer     | Purpose                              | Examples                          |
|-----------|--------------------------------------|-----------------------------------|
| `base`    | Universal dev conventions            | `base-conventions`                |
| `lang`    | Language-level rules                 | `typescript-strict`, `python`     |
| `stack`   | Framework / platform                 | `react-native`, `next-js`         |
| `infra`   | Backend services                     | `supabase`, `firebase`            |
| `pattern` | Architectural patterns               | `offline-first`, `cqrs`           |
| `project` | Project-specific overrides (always wins) | your local overrides          |

Each module is a directory with a `module.yaml` manifest and optional fragment folders (`rules/`, `commands/`, `guides/`, `agents/`, `claude-md/`).

## Module format

```yaml
# modules/my-module/module.yaml
name: my-module
description: My custom conventions
layer: lang
version: 1.0.0
dependencies:
  - base-conventions
variables:
  strict_mode:
    type: boolean
    default: true
    description: Enable strict checks
```

Use `{{variable_name}}` (Handlebars syntax) in any fragment file to interpolate variables.

## Built-in modules

- **`base-conventions`** — git workflow, conventional commits, PR discipline
- **`typescript-strict`** — strict TS config, no-any rules, type safety patterns
- **`react-native`** — functional components, StyleSheet, platform conventions

## CLI reference

```
stackweave generate [options]

Options:
  -c, --config <path>   Path to .stackweave.yaml (default: .stackweave.yaml)
  -o, --output <path>   Output directory (default: .claude/ next to config)
  -h, --help            Show help
```

## License

MIT

---

Built by [Fendrel](https://fendrel.app)
