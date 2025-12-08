import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

interface StartOptions {
  port?: string;
  host?: string;
}

export async function startCommand(options: StartOptions) {
  const spinner = ora('Starting facilitator server...').start();

  try {
    // Check for configuration
    const configPath = path.join(process.cwd(), 'openfacilitator.json');

    try {
      await fs.access(configPath);
    } catch {
      spinner.fail('No configuration found. Run `openfacilitator init` first.');
      return;
    }

    // Load configuration
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    const port = options.port || config.server?.port || '3001';
    const host = options.host || config.server?.host || '0.0.0.0';

    spinner.succeed('Configuration loaded');

    console.log('\n' + chalk.blue('Starting OpenFacilitator server...'));
    console.log(chalk.gray(`  Name: ${config.name}`));
    console.log(chalk.gray(`  Subdomain: ${config.subdomain}`));
    console.log(chalk.gray(`  Address: http://${host}:${port}`));
    console.log('');

    // Spawn the server process
    const serverProcess = spawn('node', ['node_modules/@openfacilitator/server/dist/index.js'], {
      env: {
        ...process.env,
        PORT: port,
        HOST: host,
        FACILITATOR_NAME: config.name,
        FACILITATOR_SUBDOMAIN: config.subdomain,
        OWNER_ADDRESS: config.ownerAddress,
        DATABASE_PATH: config.database?.path || './data/openfacilitator.db',
      },
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    serverProcess.on('error', (error) => {
      console.error(chalk.red('Failed to start server:'), error.message);
      process.exit(1);
    });

    serverProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(chalk.red(`Server exited with code ${code}`));
        process.exit(code || 1);
      }
    });

    // Handle SIGINT/SIGTERM
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nShutting down server...'));
      serverProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      serverProcess.kill('SIGTERM');
    });
  } catch (error) {
    spinner.fail('Failed to start server');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

