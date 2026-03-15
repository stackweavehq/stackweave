import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { generate } from '../src/core/engine';

// Path to the real modules shipped with the repo
const REAL_MODULES_DIR = path.join(__dirname, '..', 'modules');

describe('new modules integration', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stackweave-new-modules-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  // ─── Test 1: Python + Docker stack ───────────────────────────────────────────

  it('Test 1: Python + Docker stack generates correct output', async () => {
    const configPath = path.join(tmpDir, '.stackweave.yaml');
    await fs.writeFile(
      configPath,
      [
        'project:',
        '  name: ml-api',
        '  description: Python ML API with Docker',
        'modules:',
        '  - base-conventions',
        '  - conventional-commits:',
        '      require_scope: true',
        '      max_subject_length: 80',
        '  - python:',
        '      python_version: "3.12"',
        '      formatter: "ruff"',
        '  - docker:',
        '      base_image: "python:3.12-slim"',
        '      expose_port: 8000',
      ].join('\n'),
      'utf-8'
    );

    const outputDir = path.join(tmpDir, '.claude');
    await generate(configPath, { outputDir, modulePaths: [REAL_MODULES_DIR] });

    // CLAUDE.md exists and contains all 4 module sections
    const claudeMdPath = path.join(outputDir, 'CLAUDE.md');
    const claudeMd = await fs.readFile(claudeMdPath, 'utf-8');

    // Project header
    expect(claudeMd).toContain('# ml-api');

    // All four module claude-md sections present
    expect(claudeMd).toContain('## Development Conventions'); // base-conventions
    expect(claudeMd).toContain('## Commit Conventions');     // conventional-commits
    expect(claudeMd).toContain('## Python Stack');           // python
    expect(claudeMd).toContain('## Docker Infrastructure'); // docker

    // Rules files exist
    const rulesDir = path.join(outputDir, 'rules');
    const ruleFiles = await fs.readdir(rulesDir);

    expect(ruleFiles).toContain('conventional-commits.md');
    expect(ruleFiles).toContain('python-style.md');
    expect(ruleFiles).toContain('python-testing.md');
    expect(ruleFiles).toContain('dockerfile-best-practices.md');

    // Commands exist
    const commandsDir = path.join(outputDir, 'commands');
    const commandFiles = await fs.readdir(commandsDir);

    expect(commandFiles).toContain('commit-message.md');
    expect(commandFiles).toContain('format-check.md');
    expect(commandFiles).toContain('build-image.md');

    // Guides exist
    const guidesDir = path.join(outputDir, 'guides');
    const guideFiles = await fs.readdir(guidesDir);

    expect(guideFiles).toContain('python-project-structure.md');
    expect(guideFiles).toContain('docker-compose-patterns.md');

    // Interpolated values in CLAUDE.md
    expect(claudeMd).toContain('3.12');
    expect(claudeMd).toContain('ruff');
    expect(claudeMd).toContain('python:3.12-slim');
    expect(claudeMd).toContain('8000');

    // require_scope: true effect — commit conventions section should mention scope
    expect(claudeMd).toContain('scope');

    // Check interpolated values in rule files
    const commitRules = await fs.readFile(
      path.join(rulesDir, 'conventional-commits.md'),
      'utf-8'
    );
    expect(commitRules).toContain('80'); // max_subject_length interpolated

    const dockerfileRules = await fs.readFile(
      path.join(rulesDir, 'dockerfile-best-practices.md'),
      'utf-8'
    );
    expect(dockerfileRules).toContain('python:3.12-slim');
    expect(dockerfileRules).toContain('8000');
  });

  // ─── Test 2: Expo + Supabase stack ───────────────────────────────────────────

  it('Test 2: Expo + Supabase stack generates correct output', async () => {
    const configPath = path.join(tmpDir, '.stackweave.yaml');
    await fs.writeFile(
      configPath,
      [
        'project:',
        '  name: my-mobile-app',
        '  description: Expo app with Supabase backend',
        'modules:',
        '  - base-conventions',
        '  - conventional-commits',
        '  - expo:',
        '      target_platforms: "ios, android"',
        '      min_ios: "16.0"',
        '  - supabase:',
        '      supabase_project_id: "xyzproject"',
        '      use_realtime: true',
        '      auth_providers: "email, google, apple"',
      ].join('\n'),
      'utf-8'
    );

    const outputDir = path.join(tmpDir, '.claude');
    await generate(configPath, { outputDir, modulePaths: [REAL_MODULES_DIR] });

    const claudeMdPath = path.join(outputDir, 'CLAUDE.md');
    const claudeMd = await fs.readFile(claudeMdPath, 'utf-8');

    // CLAUDE.md has both Expo and Supabase sections
    expect(claudeMd).toContain('## Expo');
    expect(claudeMd).toContain('## Supabase');

    // Rules from expo and supabase both present
    const rulesDir = path.join(outputDir, 'rules');
    const ruleFiles = await fs.readdir(rulesDir);

    expect(ruleFiles).toContain('expo-conventions.md');
    expect(ruleFiles).toContain('expo-performance.md');
    expect(ruleFiles).toContain('supabase-patterns.md');
    expect(ruleFiles).toContain('supabase-security.md');

    // Commands from expo and supabase both present
    const commandsDir = path.join(outputDir, 'commands');
    const commandFiles = await fs.readdir(commandsDir);

    expect(commandFiles).toContain('eas-build.md');
    expect(commandFiles).toContain('new-screen.md');
    expect(commandFiles).toContain('new-migration.md');
    expect(commandFiles).toContain('gen-types.md');

    // Guides from expo and supabase both present
    const guidesDir = path.join(outputDir, 'guides');
    const guideFiles = await fs.readdir(guidesDir);

    expect(guideFiles).toContain('expo-deployment.md');
    expect(guideFiles).toContain('supabase-rls.md');
    expect(guideFiles).toContain('supabase-auth.md');

    // Interpolated values in CLAUDE.md
    expect(claudeMd).toContain('xyzproject');
    expect(claudeMd).toContain('ios, android');
    expect(claudeMd).toContain('16.0');

    // Interpolated values in rule files
    const expoRules = await fs.readFile(
      path.join(rulesDir, 'expo-conventions.md'),
      'utf-8'
    );
    expect(expoRules).toContain('ios, android');
    expect(expoRules).toContain('16.0');

    const supabaseRules = await fs.readFile(
      path.join(rulesDir, 'supabase-patterns.md'),
      'utf-8'
    );
    expect(supabaseRules).toContain('xyzproject');
    expect(supabaseRules).toContain('email, google, apple');
  });

  // ─── Test 3: Layer ordering ───────────────────────────────────────────────────

  it('Test 3: CLAUDE.md sections appear in layer order (base → lang → infra)', async () => {
    const configPath = path.join(tmpDir, '.stackweave.yaml');
    await fs.writeFile(
      configPath,
      [
        'project:',
        '  name: layer-order-test',
        'modules:',
        '  - base-conventions',
        '  - conventional-commits',
        '  - python:',
        '      python_version: "3.12"',
        '  - docker:',
        '      base_image: "python:3.12-slim"',
        '      expose_port: 8000',
      ].join('\n'),
      'utf-8'
    );

    const outputDir = path.join(tmpDir, '.claude');
    await generate(configPath, { outputDir, modulePaths: [REAL_MODULES_DIR] });

    const claudeMd = await fs.readFile(path.join(outputDir, 'CLAUDE.md'), 'utf-8');

    // Locate the positions of each section heading
    const basePos = claudeMd.indexOf('## Development Conventions');   // base-conventions (base)
    const commitPos = claudeMd.indexOf('## Commit Conventions');       // conventional-commits (base)
    const pythonPos = claudeMd.indexOf('## Python Stack');             // python (lang)
    const dockerPos = claudeMd.indexOf('## Docker Infrastructure');   // docker (infra)

    // All sections must be present
    expect(basePos).toBeGreaterThan(-1);
    expect(commitPos).toBeGreaterThan(-1);
    expect(pythonPos).toBeGreaterThan(-1);
    expect(dockerPos).toBeGreaterThan(-1);

    // base sections come before lang section
    expect(basePos).toBeLessThan(pythonPos);
    expect(commitPos).toBeLessThan(pythonPos);

    // lang section comes before infra section
    expect(pythonPos).toBeLessThan(dockerPos);
  });
});
