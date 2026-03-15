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
      await generate(configPath, { outputDir });
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
