import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { collectFragments, mergeFragments, interpolate, buildClaudeMd } from '../src/core/merger';
import { Fragment, ResolvedModule } from '../src/types';

function makeFragment(
  filename: string,
  layer: Fragment['layer'],
  content = 'content',
  type = 'rules',
  moduleName = 'test'
): Fragment {
  return { type, filename, content, layer, moduleName };
}

describe('mergeFragments', () => {
  it('higher layer wins when same filename in multiple modules', () => {
    const base = makeFragment('api-rules.md', 'base', 'base content');
    const lang = makeFragment('api-rules.md', 'lang', 'lang content');
    const result = mergeFragments([base, lang]);
    expect(result['api-rules.md'].content).toBe('lang content');
    expect(result['api-rules.md'].layer).toBe('lang');
  });

  it('lower layer file kept when no conflict', () => {
    const base = makeFragment('base-only.md', 'base', 'base content');
    const lang = makeFragment('lang-only.md', 'lang', 'lang content');
    const result = mergeFragments([base, lang]);
    expect(result['base-only.md'].content).toBe('base content');
    expect(result['lang-only.md'].content).toBe('lang content');
  });

  it('returns empty object for empty input', () => {
    expect(mergeFragments([])).toEqual({});
  });

  it('stack layer beats base layer', () => {
    const base = makeFragment('shared.md', 'base', 'base');
    const stack = makeFragment('shared.md', 'stack', 'stack');
    const result = mergeFragments([base, stack]);
    expect(result['shared.md'].layer).toBe('stack');
  });

  it('project layer beats all others', () => {
    const base = makeFragment('shared.md', 'base', 'base');
    const lang = makeFragment('shared.md', 'lang', 'lang');
    const project = makeFragment('shared.md', 'project', 'project');
    const result = mergeFragments([base, lang, project]);
    expect(result['shared.md'].layer).toBe('project');
  });
});

describe('interpolate', () => {
  it('substitutes {{variable}} correctly', () => {
    const result = interpolate('Hello {{name}}!', { name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('substitutes multiple variables', () => {
    const result = interpolate('{{a}} + {{b}} = {{c}}', { a: '1', b: '2', c: '3' });
    expect(result).toBe('1 + 2 = 3');
  });

  it('leaves unknown variables as empty string (Handlebars default)', () => {
    const result = interpolate('Hello {{unknown}}!', {});
    expect(result).toBe('Hello !');
  });

  it('handles boolean variables', () => {
    const result = interpolate('strict: {{strict_mode}}', { strict_mode: true });
    expect(result).toBe('strict: true');
  });

  it('returns content unchanged when no variables', () => {
    const content = '# No variables here';
    expect(interpolate(content, {})).toBe(content);
  });
});

describe('collectFragments', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stackweave-merger-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function makeModule(
    name: string,
    layer: ResolvedModule['manifest']['layer'],
    files: Record<string, string>,
    fragmentType: string
  ): Promise<ResolvedModule> {
    const modPath = path.join(tmpDir, name);
    const fragDir = path.join(modPath, fragmentType);
    await fs.mkdir(fragDir, { recursive: true });
    for (const [filename, content] of Object.entries(files)) {
      await fs.writeFile(path.join(fragDir, filename), content, 'utf-8');
    }
    // write module.yaml
    await fs.writeFile(
      path.join(modPath, 'module.yaml'),
      `name: ${name}\ndescription: test\nlayer: ${layer}\nversion: 1.0.0`,
      'utf-8'
    );
    return {
      manifest: { name, description: 'test', layer, version: '1.0.0' },
      path: modPath,
      variables: {},
    };
  }

  it('collects fragment files from a module directory', async () => {
    const mod = await makeModule('base', 'base', { 'git.md': '# Git' }, 'rules');
    const frags = await collectFragments([mod], 'rules');
    expect(frags).toHaveLength(1);
    expect(frags[0].filename).toBe('git.md');
    expect(frags[0].content).toBe('# Git');
    expect(frags[0].layer).toBe('base');
  });

  it('returns empty array when fragment type dir does not exist', async () => {
    const mod = await makeModule('base', 'base', {}, 'rules');
    const frags = await collectFragments([mod], 'agents');
    expect(frags).toHaveLength(0);
  });

  it('interpolates variables in collected content', async () => {
    const modPath = path.join(tmpDir, 'ts-mod');
    const rulesDir = path.join(modPath, 'rules');
    await fs.mkdir(rulesDir, { recursive: true });
    await fs.writeFile(path.join(rulesDir, 'ts.md'), 'target: {{target}}', 'utf-8');
    await fs.writeFile(
      path.join(modPath, 'module.yaml'),
      'name: ts-mod\ndescription: test\nlayer: lang\nversion: 1.0.0',
      'utf-8'
    );
    const mod: ResolvedModule = {
      manifest: { name: 'ts-mod', description: 'test', layer: 'lang', version: '1.0.0' },
      path: modPath,
      variables: { target: 'ES2022' },
    };
    const frags = await collectFragments([mod], 'rules');
    expect(frags[0].content).toBe('target: ES2022');
  });
});

describe('buildClaudeMd', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stackweave-claudemd-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function makeModuleWithClaudeMd(
    name: string,
    layer: ResolvedModule['manifest']['layer'],
    files: Record<string, string>,
    variables: Record<string, unknown> = {}
  ): Promise<ResolvedModule> {
    const modPath = path.join(tmpDir, name);
    const claudeMdDir = path.join(modPath, 'claude-md');
    await fs.mkdir(claudeMdDir, { recursive: true });
    for (const [filename, content] of Object.entries(files)) {
      await fs.writeFile(path.join(claudeMdDir, filename), content, 'utf-8');
    }
    await fs.writeFile(
      path.join(modPath, 'module.yaml'),
      `name: ${name}\ndescription: test\nlayer: ${layer}\nversion: 1.0.0`,
      'utf-8'
    );
    return {
      manifest: { name, description: 'test', layer, version: '1.0.0' },
      path: modPath,
      variables,
    };
  }

  it('produces sections with headers and project name', async () => {
    const mod = await makeModuleWithClaudeMd('base', 'base', {
      'conventions.md': '## Dev Conventions\n\nKeep it clean.',
    });
    const result = await buildClaudeMd([mod], 'MyApp', 'A great app');
    expect(result).toContain('# MyApp');
    expect(result).toContain('A great app');
    expect(result).toContain('## Dev Conventions');
  });

  it('concatenates sections from multiple modules in layer order', async () => {
    const base = await makeModuleWithClaudeMd('base', 'base', {
      'conventions.md': '## Base Section',
    });
    const lang = await makeModuleWithClaudeMd('lang-mod', 'lang', {
      'ts.md': '## Lang Section',
    });
    const result = await buildClaudeMd([base, lang], 'MyApp');
    const baseIdx = result.indexOf('## Base Section');
    const langIdx = result.indexOf('## Lang Section');
    expect(baseIdx).toBeGreaterThanOrEqual(0);
    expect(langIdx).toBeGreaterThanOrEqual(0);
    expect(baseIdx).toBeLessThan(langIdx);
  });

  it('interpolates variables in claude-md sections', async () => {
    const mod = await makeModuleWithClaudeMd(
      'ts-mod',
      'lang',
      { 'ts.md': '## TypeScript\nstrict: {{strict_mode}}' },
      { strict_mode: true }
    );
    const result = await buildClaudeMd([mod], 'MyApp');
    expect(result).toContain('strict: true');
  });

  it('includes sections from ALL modules (not winner-takes-all) for claude-md', async () => {
    const lang = await makeModuleWithClaudeMd('typescript-strict', 'lang', {
      'tech-stack.md': '## TypeScript Configuration',
    });
    const stack = await makeModuleWithClaudeMd('react-native', 'stack', {
      'tech-stack.md': '## React Native Stack',
    });
    // Both have tech-stack.md — BOTH should appear in CLAUDE.md
    const result = await buildClaudeMd([lang, stack], 'MyApp');
    expect(result).toContain('## TypeScript Configuration');
    expect(result).toContain('## React Native Stack');
  });
});
