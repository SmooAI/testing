import { Command } from 'commander';
import { createCasesCommand } from './commands/cases/index';
import { createDeploymentsCommand } from './commands/deployments/index';
import { createEnvironmentsCommand } from './commands/environments/index';
import { createRunsCommand } from './commands/runs/index';

const program = new Command();

program.name('smooai-testing').description('Smoo AI Testing SDK — manage test runs, cases, environments, and deployments').version('0.1.0');

// Global --json flag
program.option('--json', 'Output in JSON format (auto-enabled when no TTY detected)');

// Auth commands
program
    .command('login')
    .description('Store M2M credentials for CLI access')
    .requiredOption('--client-id <id>', 'M2M client ID')
    .requiredOption('--client-secret <secret>', 'M2M client secret')
    .requiredOption('--org-id <id>', 'Organization ID')
    .option('--api-url <url>', 'API base URL', 'https://api.production.smoo.ai')
    .option('--auth-url <url>', 'Auth token URL', 'https://auth.production.smoo.ai/token')
    .action(async (opts) => {
        const { runLogin } = await import('./commands/auth/login');
        runLogin({ ...opts, json: program.opts().json ?? opts.json });
    });

program
    .command('logout')
    .description('Remove stored credentials')
    .action(async (opts) => {
        const { runLogout } = await import('./commands/auth/logout');
        runLogout({ json: program.opts().json ?? opts.json });
    });

program
    .command('status')
    .description('Show current authentication status')
    .action(async (opts) => {
        const { runStatus } = await import('./commands/auth/status');
        runStatus({ json: program.opts().json ?? opts.json });
    });

// Resource command groups
createRunsCommand(program);
createCasesCommand(program);
createEnvironmentsCommand(program);
createDeploymentsCommand(program);

program.parse();
