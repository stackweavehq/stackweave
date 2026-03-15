import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { generate } from '../src/core/engine';

describe('engine.generate (integration)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stackweave-engine-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function createModule(
    modulesDir: string,
    name: string,
    layer: string,
    deps: string[] = [],
    opts: {
      rules?: Record<string, string>;
      claudeMd?: Record<string, string>;
      commands?: Record<string, string>;
      variables?: Record<string, { type: string; default: string | boolean }>;
    } = {}
  ): Promise<void> {
    const modDir = path.join(modulesDir, name);
    await fs.mkdir(modDir, { recursive: true });

    const depsYaml = deps.length
      ? `dependencies:\n${deps.map((d) => `  - ${d}`).join('\n')}`
      : '';

    const varsYaml = opts.variables
      ? `variables:\n${Object.entries(opts.variables)
          .map(
            ([k, v]) =>
              `  ${k}:\n    type: ${v.type}\n    default: ${JSON.stringify(v.default)}`
          )
          .join('\n')}`
      : '';

    await fs.writeFile(
      path.join(modDir, 'module.yaml'),
      `name: ${name}\ndescription: ${name} module\nlayer: ${layer}\nversion: 1.0.0\n${depsYaml}\n${varsYaml}`,
      'utf-8'
    );

    if (opts.rules) {
      const rulesDir = path.join(modDir, 'rules');
      await fs.mkdir(rulesDir, { recursive: true });
      for (const [file, content] of Object.entries(opts.rules)) {
        await fs.writeFile(path.join(rulesDir, file), content, 'utf-8');
      }
    }

    if (opts.claudeMd) {
      const claudeMdDir = path.join(modDir, 'claude-md');
      await fs.mkdir(claudeMdDir, { recursive: true });
      for (const [file, content] of Object.entries(opts.claudeMd)) {
        await fs.writeFile(path.join(claudeMdDir, file), content, 'utf-8');
      }
    }

    if (opts.commands) {
      const commandsDir = path.join(modDir, 'commands');
      await fs.mkdir(commandsDir, { recursive: true });
      for (const [file, content] of Object.entries(opts.commands)) {
        await fs.writeFile(path.join(commandsDir, file), content, 'utf-8');
      }
    }
  }

  it('full pipeline: generates .claude/ with CLAUDE.md and rules/', async () => {
    const modulesDir = path.join(tmpDir, 'modules');
    await fs.mkdir(modulesDir, { recursive: true });

    await createModule(modulesDir, 'base-conventions', 'base', [], {
      rules: { 'git-conventions.md': '# Git Conventions\n\nUse conventional commits.' },
      claudeMd: { 'conventions.md': '## Dev Conventions\n\nKeep it clean.' },
    });

    const configPath = path.join(tmpDir, '.stackweave.yaml');
    await fs.writeFile(
      configPath,
      `project:\n  name: TestApp\n  description: A test application\n\nmodules:\n  - base-conventions\n`,
      'utf-8'
    );

    const outputDir = path.join(tmpDir, '.claude');
    await generate(configPath, { outputDir, modulePaths: [modulesDir] });

    // CLAUDE.md should exist
    const claudeMdPath = path.join(outputDir, 'CLAUDE.md');
    const claudeMd = await fs.readFile(claudeMdPath, 'utf-8');
    expect(claudeMd).toContain('# TestApp');
    expect(claudeMd).toContain('## Dev Conventions');

    // rules/git-conventions.md should exist
    const gitRules = await fs.readFile(
      path.join(outputDir, 'rules', 'git-conventions.md'),
      'utf-8'
    );
    expect(gitRules).toContain('# Git Conventions');
  });

  it('higher-layer module wins rules conflict', async () => {
    const modulesDir = path.join(tmpDir, 'modules');
    await fs.mkdir(modulesDir, { recursive: true });

    await createModule(modulesDir, 'base-conventions', 'base', [], {
      rules: { 'shared.md': '# Base Rules' },
    });
    await createModule(modulesDir, 'typescript-strict', 'lang', ['base-conventions'], {
      rules: { 'shared.md': '# Lang Rules' },
    });

    const configPath = path.join(tmpDir, '.stackweave.yaml');
    await fs.writeFile(
      configPath,
      `project:\n  name: TestApp\n\nmodules:\n  - base-conventions\n  - typescript-strict\n`,
      'utf-8'
    );

    const outputDir = path.join(tmpDir, '.claude');
    await generate(configPath, { outputDir, modulePaths: [modulesDir] });

    const sharedRules = await fs.readFile(
      path.join(outputDir, 'rules', 'shared.md'),
      'utf-8'
    );
    // lang layer should win
    expect(sharedRules).toBe('# Lang Rules');
  });

  it('CLAUDE.md contains sections from all modules (not winner-takes-all)', async () => {
    const modulesDir = path.join(tmpDir, 'modules');
    await fs.mkdir(modulesDir, { recursive: true });

    await createModule(modulesDir, 'base-conventions', 'base', [], {
      claudeMd: { 'tech-stack.md': '## Base Tech Stack' },
    });
    await createModule(modulesDir, 'typescript-strict', 'lang', ['base-conventions'], {
      claudeMd: { 'tech-stack.md': '## TypeScript Tech Stack' },
    });

    const configPath = path.join(tmpDir, '.stackweave.yaml');
    await fs.writeFile(
      configPath,
      `project:\n  name: TestApp\n\nmodules:\n  - base-conventions\n  - typescript-strict\n`,
      'utf-8'
    );

    const outputDir = path.join(tmpDir, '.claude');
    await generate(configPath, { outputDir, modulePaths: [modulesDir] });

    const claudeMd = await fs.readFile(path.join(outputDir, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('## Base Tech Stack');
    expect(claudeMd).toContain('## TypeScript Tech Stack');
  });

  it('interpolates variables in output files', async () => {
    const modulesDir = path.join(tmpDir, 'modules');
    await fs.mkdir(modulesDir, { recursive: true });

    await createModule(modulesDir, 'typescript-strict', 'lang', [], {
      rules: { 'ts.md': 'Target: {{target}}' },
      variables: { target: { type: 'string', default: 'ES2022' } },
    });

    const configPath = path.join(tmpDir, '.stackweave.yaml');
    await fs.writeFile(
      configPath,
      `project:\n  name: TestApp\n\nmodules:\n  - typescript-strict:\n      target: ES2020\n`,
      'utf-8'
    );

    const outputDir = path.join(tmpDir, '.claude');
    await generate(configPath, { outputDir, modulePaths: [modulesDir] });

    const tsRules = await fs.readFile(path.join(outputDir, 'rules', 'ts.md'), 'utf-8');
    expect(tsRules).toBe('Target: ES2020');
  });

  it('throws when a declared module is not found', async () => {
    const modulesDir = path.join(tmpDir, 'modules');
    await fs.mkdir(modulesDir, { recursive: true });

    const configPath = path.join(tmpDir, '.stackweave.yaml');
    await fs.writeFile(
      configPath,
      `project:\n  name: TestApp\n\nmodules:\n  - nonexistent-module\n`,
      'utf-8'
    );

    await expect(
      generate(configPath, { modulePaths: [modulesDir] })
    ).rejects.toThrow(/nonexistent-module/);
  });
});
