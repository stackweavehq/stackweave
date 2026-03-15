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
  description: An Expo app with Supabase backend

modules:
  - conventional-commits
  - typescript-strict:
      strict_mode: true
      target: "ES2022"
  - expo:
      target_platforms: "ios,android"
  - supabase:
      auth_providers: "email,google"
      client_framework: "react-native"
```

**2. Run generate:**

```bash
npx stackweave generate
```

**3. Your `.claude/` directory is ready:**

```
.claude/
├── CLAUDE.md          # merged from all modules, ordered by layer
├── rules/
│   ├── git-conventions.md
│   ├── typescript-patterns.md
│   └── ...
├── commands/
│   ├── run-dev.md
│   └── ...
└── guides/
    ├── supabase-auth.md
    └── ...
```

## Built-in modules

| Module | Layer | Description |
|--------|-------|-------------|
| `base-conventions` | base | Git workflow, code quality, PR discipline |
| `conventional-commits` | base | Conventional Commits spec enforcement |
| `typescript-strict` | lang | Strict TS config, no-any rules, type safety patterns |
| `python` | lang | PEP 8, type hints, project structure |
| `react-native` | stack | React Native patterns, navigation, testing |
| `expo` | stack | Expo managed workflow, EAS, Expo Router |
| `node-express` | stack | Express.js architecture, validation, error handling |
| `supabase` | infra | Supabase RLS, auth, migrations, Edge Functions |
| `docker` | infra | Dockerfile + Compose best practices |

## Layer system

Modules are organized into **layers**. Higher layers override lower layers when fragment filenames conflict:

```
1. base → 2. lang → 3. stack → 4. infra → 5. pattern → 6. project
```

| Layer     | Purpose                         |
|-----------|-------------------------------- |
| `base`    | Universal dev conventions       |
| `lang`    | Language-level rules            |
| `stack`   | Framework / platform            |
| `infra`   | Backend services                |
| `pattern` | Architectural patterns          |
| `project` | Project-specific (always wins)  |

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

Use `{{variable_name}}` (Handlebars syntax) in any fragment file to interpolate variables. Override defaults per-module in `.stackweave.yaml`:

```yaml
modules:
  - my-module:
      strict_mode: false
```

## Creating custom modules

Module names must be lowercase alphanumeric with hyphens, matching `/^[a-z0-9][a-z0-9-]*$/`.

Place custom modules in a `modules/` directory next to your `.stackweave.yaml`. Each module needs at minimum a `module.yaml` manifest and at least one fragment file.

## CLI reference

```
stackweave generate [options]

Options:
  -c, --config <path>   Path to .stackweave.yaml (default: .stackweave.yaml)
  -o, --output <path>   Output directory (default: .claude/ next to config)
  -h, --help            Show help
```

### Coming soon

- `init` — scaffold a new `.stackweave.yaml`
- `list` — list available modules
- `validate` — check config and module integrity
- `diff` — preview changes before writing
- Config-level `overrides` for fragment paths

## License

MIT

---

Built by [Fendrel](https://fendrel.app)
