import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { topologicalSort, resolveModules, LAYER_ORDER } from '../src/core/resolver';
import { ResolvedModule } from '../src/types';

function makeModule(
  name: string,
  layer: ResolvedModule['manifest']['layer'],
  dependencies: string[] = []
): ResolvedModule {
  return {
    manifest: { name, description: '', layer, version: '1.0.0', dependencies },
    path: `/fake/${name}`,
    variables: {},
  };
}

describe('topologicalSort', () => {
  it('orders deps before dependents', () => {
    const base = makeModule('base-conventions', 'base');
    const lang = makeModule('typescript-strict', 'lang', ['base-conventions']);
    const sorted = topologicalSort([lang, base]);
    const names = sorted.map((m) => m.manifest.name);
    expect(names.indexOf('base-conventions')).toBeLessThan(
      names.indexOf('typescript-strict')
    );
  });

  it('throws on circular dependency', () => {
    const a = makeModule('a', 'base', ['b']);
    const b = makeModule('b', 'lang', ['a']);
    expect(() => topologicalSort([a, b])).toThrow(/[Cc]ircular/);
  });

  it('sorts base < lang < stack when no deps', () => {
    const stack = makeModule('react-native', 'stack');
    const base = makeModule('base-conventions', 'base');
    const lang = makeModule('typescript-strict', 'lang');
    const sorted = topologicalSort([stack, lang, base]);
    const names = sorted.map((m) => m.manifest.name);
    expect(names).toEqual(['base-conventions', 'typescript-strict', 'react-native']);
  });

  it('returns a single module unchanged', () => {
    const base = makeModule('base-conventions', 'base');
    const sorted = topologicalSort([base]);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].manifest.name).toBe('base-conventions');
  });
});

describe('LAYER_ORDER', () => {
  it('has base < lang < stack < infra < pattern < project', () => {
    expect(LAYER_ORDER.base).toBeLessThan(LAYER_ORDER.lang);
    expect(LAYER_ORDER.lang).toBeLessThan(LAYER_ORDER.stack);
    expect(LAYER_ORDER.stack).toBeLessThan(LAYER_ORDER.infra);
    expect(LAYER_ORDER.infra).toBeLessThan(LAYER_ORDER.pattern);
    expect(LAYER_ORDER.pattern).toBeLessThan(LAYER_ORDER.project);
  });
});

describe('resolveModules', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stackweave-resolver-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function createModule(
    dir: string,
    name: string,
    layer: string,
    deps: string[] = [],
    vars: Record<string, unknown> = {}
  ): Promise<void> {
    const modDir = path.join(dir, name);
    await fs.mkdir(modDir, { recursive: true });
    const depsYaml = deps.length
      ? `dependencies:\n${deps.map((d) => `  - ${d}`).join('\n')}`
      : '';
    const varsSection =
      Object.keys(vars).length > 0
        ? `variables:\n${Object.entries(vars)
            .map(([k, v]) => `  ${k}:\n    type: string\n    default: "${v}"`)
            .join('\n')}`
        : '';
    await fs.writeFile(
      path.join(modDir, 'module.yaml'),
      `name: ${name}\ndescription: test\nlayer: ${layer}\nversion: 1.0.0\n${depsYaml}\n${varsSection}`,
      'utf-8'
    );
  }

  it('finds a module by name in searchPaths', async () => {
    await createModule(tmpDir, 'base-conventions', 'base');
    const config = {
      project: { name: 'test' },
      modules: ['base-conventions'],
    };
    const resolved = await resolveModules(config, [tmpDir]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].manifest.name).toBe('base-conventions');
  });

  it('throws when module is not found', async () => {
    const config = { project: { name: 'test' }, modules: ['nonexistent'] };
    await expect(resolveModules(config, [tmpDir])).rejects.toThrow(/nonexistent/);
  });

  it('resolves transitive dependencies', async () => {
    await createModule(tmpDir, 'base-conventions', 'base');
    await createModule(tmpDir, 'typescript-strict', 'lang', ['base-conventions']);
    const config = {
      project: { name: 'test' },
      modules: ['typescript-strict'],
    };
    const resolved = await resolveModules(config, [tmpDir]);
    const names = resolved.map((m) => m.manifest.name);
    expect(names).toContain('base-conventions');
    expect(names).toContain('typescript-strict');
  });

  it('merges default variable values with user overrides', async () => {
    await createModule(tmpDir, 'typescript-strict', 'lang', [], { target: 'ES2022' });
    const config = {
      project: { name: 'test' },
      modules: [{ 'typescript-strict': { target: 'ES2020' } }],
    };
    const resolved = await resolveModules(config, [tmpDir]);
    expect(resolved[0].variables.target).toBe('ES2020');
  });
});
