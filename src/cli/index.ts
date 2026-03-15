import { Command } from 'commander';
import { generateCommand } from './generate';
import { initCommand } from './init';

declare const PKG_VERSION: string;

const program = new Command();

program
  .name('stackweave')
  .description('Compose .claude/ directories from reusable modules')
  .version(PKG_VERSION);

program.addCommand(generateCommand);
program.addCommand(initCommand);

program.parse();
