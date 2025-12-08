#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('openfacilitator')
  .description('CLI for self-hosting OpenFacilitator x402 payment facilitators')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new facilitator configuration')
  .option('-n, --name <name>', 'Facilitator name')
  .option('-s, --subdomain <subdomain>', 'Subdomain')
  .option('-o, --owner <address>', 'Owner wallet address')
  .action(initCommand);

program
  .command('start')
  .description('Start the facilitator server')
  .option('-p, --port <port>', 'Port to listen on', '3001')
  .option('-h, --host <host>', 'Host to bind to', '0.0.0.0')
  .action(startCommand);

program
  .command('config')
  .description('Manage facilitator configuration')
  .argument('[action]', 'Action: show, set, reset')
  .option('-k, --key <key>', 'Configuration key')
  .option('-v, --value <value>', 'Configuration value')
  .action(configCommand);

program
  .command('generate')
  .description('Generate deployment files')
  .argument('<type>', 'Type: docker, systemd, nginx')
  .action(async (type: string) => {
    console.log(chalk.blue(`Generating ${type} configuration...`));
    console.log(chalk.yellow('Coming soon!'));
  });

console.log(
  chalk.green(`
   ____                   ______          _ _ _ _        _             
  / __ \\                 |  ____|        (_) (_) |      | |            
 | |  | |_ __   ___ _ __ | |__ __ _  ___  _| |_| |_ __ _| |_ ___  _ __ 
 | |  | | '_ \\ / _ \\ '_ \\|  __/ _\` |/ __|| | | | __/ _\` | __/ _ \\| '__|
 | |__| | |_) |  __/ | | | | | (_| | (__ | | | | || (_| | || (_) | |   
  \\____/| .__/ \\___|_| |_|_|  \\__,_|\\___||_|_|_|\\__\\__,_|\\__\\___/|_|   
        | |                                                            
        |_|                                                            
`)
);

program.parse();

