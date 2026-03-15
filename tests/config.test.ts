import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { parseConfig, validateConfig, parseModuleEntry, validateModuleName } from '../src/core/config';

describe('validateConfig', () => {
  it('parses a valid config correctly', () => {
    const raw = {
      project: { name: 'my-app', description: 'A test app' },
      modules: ['base-conventions', { 'typescript-strict': { strict_mode: true } }],
    };
    const config = validateConfig(raw);
    expect(config.project.name).toBe('my-app');
    expect(config.project.description).toBe('A test app');
    expect(config.modules).toHaveLength(2);
  });

  it('throws on missing project.name', () => {
    expect(() =>
      validateConfig({ project: { description: 'oops' }, modules: [] })
    ).toThrow(/project\.name/);
  });

  it('throws on missing modules array', () => {
    expect(() =>
      validateConfig({ project: { name: 'x' } })
    ).toThrow(/modules/);
  });

  it('throws when config is not an object', () => {
    expect(() => validateConfig('bad')).toThrow(/Invalid config/);
  });

  it('throws when project section is missing', () => {
    expect(() => validateConfig({ modules: [] })).toThrow(/project/);
  });

  it('accepts valid string and object module entries', () => {
    const config = validateConfig({
      project: { name: 'app' },
      modules: ['valid', { 'also-valid': { key: 'val' } }],
    });
    expect(config.modules).toHaveLength(2);
  });

  it('throws on numeric module entry', () => {
    expect(() =>
      validateConfig({ project: { name: 'app' }, modules: [42] })
    ).toThrow(/Module entry at index 0 is invalid.*got number/);
  });

  it('throws on null module entry', () => {
    expect(() =>
      validateConfig({ project: { name: 'app' }, modules: [null] })
    ).toThrow(/Module entry at index 0 is invalid.*got null/);
  });

  it('throws on array module entry', () => {
    expect(() =>
      validateConfig({ project: { name: 'app' }, modules: [[]] })
    ).toThrow(/Module entry at index 0 is invalid.*got array/);
  });

  it('throws on non-string overrides value', () => {
    expect(() =>
      validateConfig({
        project: { name: 'app' },
        modules: [],
        overrides: { rules: 123 },
      })
    ).toThrow(/overrides\.rules must be a string path/);
  });
});

describe('parseConfig', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stackweave-config-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('reads and parses a valid .stackweave.yaml correctly', async () => {
    const yaml = `
project:
  name: test-project
  description: A test project

modules:
  - base-conventions
  - typescript-strict:
      strict_mode: true
`;
    const configPath = path.join(tmpDir, '.stackweave.yaml');
    await fs.writeFile(configPath, yaml, 'utf-8');
    const config = await parseConfig(configPath);
    expect(config.project.name).toBe('test-project');
    expect(config.modules).toHaveLength(2);
  });
});

describe('parseModuleEntry', () => {
  it('handles string form', () => {
    const result = parseModuleEntry('base-conventions');
    expect(result.name).toBe('base-conventions');
    expect(result.variables).toEqual({});
  });

  it('handles object form with variables', () => {
    const result = parseModuleEntry({ 'typescript-strict': { strict_mode: true } });
    expect(result.name).toBe('typescript-strict');
    expect(result.variables).toEqual({ strict_mode: true });
  });

  it('handles object form with empty variable object', () => {
    const result = parseModuleEntry({ 'react-native': {} });
    expect(result.name).toBe('react-native');
    expect(result.variables).toEqual({});
  });

  it('throws on path traversal module name', () => {
    expect(() => parseModuleEntry('../../etc/passwd')).toThrow(/Invalid module name/);
  });

  it('throws on path traversal in object form', () => {
    expect(() => parseModuleEntry({ '../secret': {} })).toThrow(/Invalid module name/);
  });
});

describe('validateModuleName', () => {
  it.each(['typescript-strict', 'base-conventions', 'react-native', 'expo', '0-base'])(
    'accepts valid name: %s',
    (name) => {
      expect(() => validateModuleName(name)).not.toThrow();
    }
  );

  it.each([
    ['../../etc/passwd', 'path traversal'],
    ['../secret', 'relative path'],
    ['My Module', 'uppercase and spaces'],
    ['module with spaces', 'spaces'],
    ['', 'empty string'],
    ['UPPERCASE', 'uppercase'],
    ['module/nested', 'slash'],
    ['-leading-hyphen', 'leading hyphen'],
  ])('rejects invalid name: %s (%s)', (name) => {
    expect(() => validateModuleName(name)).toThrow(/Invalid module name/);
  });
});
