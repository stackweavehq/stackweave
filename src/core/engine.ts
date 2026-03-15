import * as path from 'path';
import { parseConfig } from './config';
import { resolveModules, topologicalSort } from './resolver';
import { buildMergeResult } from './merger';
import { cleanOutput, writeOutput } from './writer';

export interface GenerateOptions {
  outputDir?: string;
  modulePaths?: string[];
}

export interface GenerateResult {
  outputDir: string;
  modules: string[];
  fragmentCount: number;
}

/**
 * Main entry point for the generate pipeline:
 *   parseConfig → resolveModules → topologicalSort → merge → write
 */
export async function generate(configPath: string, options: GenerateOptions = {}): Promise<GenerateResult> {
  const configDir = path.dirname(path.resolve(configPath));

  const outputDir = options.outputDir ?? path.join(configDir, '.claude');
  const modulePaths = options.modulePaths ?? [
    path.join(configDir, 'modules'),
    path.join(__dirname, '../modules'),   // installed package: dist/ → ../modules
    path.join(__dirname, '../../modules'), // ts-node dev: src/core/ → ../../modules
  ];

  // 1. Parse config
  const config = await parseConfig(configPath);

  // Warn about unsupported config sections
  if (config.overrides && Object.keys(config.overrides).length > 0) {
    console.warn("Warning: 'overrides' in config is not yet supported and will be ignored");
  }

  // TODO: implement overrides support

  // 2. Resolve modules (with transitive deps)
  const resolved = await resolveModules(config, modulePaths);

  // 3. Topological sort (deps before dependents, then by layer)
  const sorted = topologicalSort(resolved);

  // 4. Merge fragments and build CLAUDE.md
  const mergeResult = await buildMergeResult(
    sorted,
    config.project.name,
    config.project.description
  );

  // 5. Write output
  await cleanOutput(outputDir, configDir);
  await writeOutput(outputDir, mergeResult);

  return {
    outputDir,
    modules: sorted.map((m) => m.manifest.name),
    fragmentCount: Object.keys(mergeResult.fragments).length,
  };
}
