import { Command } from 'commander';
import * as path from 'path';
import { generate } from '../core/engine';

export const generateCommand = new Command('generate')
  .description('Generate .claude/ directory from .stackweave.yaml')
  .option('-c, --config <path>', 'Path to .stackweave.yaml', '.stackweave.yaml')
  .option('-o, --output <path>', 'Output directory (default: .claude/ next to config)')
  .action(async (options: { config: string; output?: string }) => {
    const configPath = path.resolve(options.config);
    const outputDir = options.output ? path.resolve(options.output) : undefined;
    try {
      const result = await generate(configPath, { outputDir });
      console.log(`Generated .claude/ at ${result.outputDir}`);
      console.log(`  Modules: ${result.modules.join(', ')}`);
      console.log(`  Fragments: ${result.fragmentCount} file(s)`);
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
