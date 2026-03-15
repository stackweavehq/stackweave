import { Command } from 'commander';
import { generateCommand } from './generate';
import { initCommand } from './init';

const program = new Command();

program
  .name('stackweave')
  .description('Compose .claude/ directories from reusable modules')
  .version('2.0.0');

program.addCommand(generateCommand);
program.addCommand(initCommand);

program.parse();
