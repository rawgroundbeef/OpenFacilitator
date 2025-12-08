import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

interface ConfigOptions {
  key?: string;
  value?: string;
}

export async function configCommand(action: string = 'show', options: ConfigOptions) {
  const configPath = path.join(process.cwd(), 'openfacilitator.json');

  try {
    switch (action) {
      case 'show': {
        const configData = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);
        console.log(chalk.blue('\nCurrent configuration:\n'));
        console.log(JSON.stringify(config, null, 2));
        break;
      }

      case 'set': {
        if (!options.key || options.value === undefined) {
          console.log(chalk.red('Usage: openfacilitator config set -k <key> -v <value>'));
          return;
        }

        const configData = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);

        // Handle nested keys (e.g., "server.port")
        const keys = options.key.split('.');
        let current = config;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!(keys[i] in current)) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }

        // Try to parse as JSON, otherwise use as string
        try {
          current[keys[keys.length - 1]] = JSON.parse(options.value);
        } catch {
          current[keys[keys.length - 1]] = options.value;
        }

        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        console.log(chalk.green(`Set ${options.key} = ${options.value}`));
        break;
      }

      case 'reset': {
        console.log(chalk.yellow('This will reset your configuration. Are you sure?'));
        console.log(chalk.gray('Run `openfacilitator init --force` to reinitialize.'));
        break;
      }

      default:
        console.log(chalk.red(`Unknown action: ${action}`));
        console.log(chalk.gray('Available actions: show, set, reset'));
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(chalk.red('No configuration found. Run `openfacilitator init` first.'));
    } else {
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

