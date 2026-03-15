import { Command } from 'commander';

export const initCommand = new Command('init')
  .description('Initialize a new .stackweave.yaml (not yet implemented)')
  .action(() => {
    console.log('init not yet implemented');
  });
