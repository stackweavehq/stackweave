import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { validateOutputDir, cleanOutput } from '../src/core/writer';

describe('validateOutputDir', () => {
  it('throws when outputDir is /', () => {
    expect(() => validateOutputDir('/', '/some/project')).toThrow(
      'Refusing to clean "/"'
    );
  });

  it('throws when outputDir is the home directory', () => {
    const home = os.homedir();
    expect(() => validateOutputDir(home, '/some/project')).toThrow(
      `Refusing to clean "${home}"`
    );
  });

  it('throws when outputDir is outside configDir', () => {
    expect(() =>
      validateOutputDir('/other/place/.claude', '/some/project')
    ).toThrow('output directory must be inside the project root');
  });

  it('throws when outputDir traverses above configDir via ..', () => {
    expect(() =>
      validateOutputDir('/some/project/../../etc/.claude', '/some/project')
    ).toThrow('output directory must be inside the project root');
  });

  it('throws when basename does not start with a dot', () => {
    expect(() =>
      validateOutputDir('/some/project/output', '/some/project')
    ).toThrow('output directory basename must start with a dot');
  });

  it('accepts a valid .claude directory inside configDir', () => {
    expect(() =>
      validateOutputDir('/some/project/.claude', '/some/project')
    ).not.toThrow();
  });

  it('accepts nested dot-prefixed directory inside configDir', () => {
    expect(() =>
      validateOutputDir('/some/project/sub/.config', '/some/project')
    ).not.toThrow();
  });
});

describe('cleanOutput', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stackweave-writer-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('cleans and recreates a valid .claude directory', async () => {
    const outputDir = path.join(tmpDir, '.claude');
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'old-file.md'), 'old content');

    await cleanOutput(outputDir, tmpDir);

    const entries = await fs.readdir(outputDir);
    expect(entries).toEqual([]);
  });

  it('rejects cleaning / at runtime', async () => {
    await expect(cleanOutput('/', tmpDir)).rejects.toThrow(
      'Refusing to clean "/"'
    );
  });
});
