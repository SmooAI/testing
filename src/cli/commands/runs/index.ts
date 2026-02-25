import { Command } from 'commander';

export function createRunsCommand(program: Command): Command {
    const runs = program.command('runs').description('Manage test runs');

    runs.command('create')
        .description('Create a test run')
        .requiredOption('--name <name>', 'Run name')
        .option('--environment <name>', 'Environment name (auto-creates if needed)')
        .option('--environment-id <id>', 'Environment ID')
        .option('--deployment-id <id>', 'Deployment ID')
        .option('--tool <name>', 'Tool name (e.g., vitest, playwright)')
        .option('--tags <tags>', 'Comma-separated tags (e.g., e2e,brent-rager)')
        .option('--runner-name <name>', 'Runner name')
        .option('--runner-url <url>', 'Runner URL')
        .action(async (opts) => {
            const { runCreate } = await import('./create');
            runCreate({ ...opts, json: program.opts().json ?? opts.json });
        });

    runs.command('list')
        .description('List test runs')
        .option('--status <status>', 'Filter by status')
        .option('--environment-id <id>', 'Filter by environment ID')
        .option('--tool <name>', 'Filter by tool')
        .option('--tags <tags>', 'Filter by tags (comma-separated)')
        .option('--limit <n>', 'Max results', '50')
        .option('--offset <n>', 'Offset', '0')
        .action(async (opts) => {
            const { runList } = await import('./list');
            runList({ ...opts, json: program.opts().json ?? opts.json });
        });

    runs.command('get')
        .description('Get a test run by ID')
        .argument('<id>', 'Test run ID')
        .action(async (id, opts) => {
            const { runGet } = await import('./get');
            runGet(id, { json: program.opts().json ?? opts.json });
        });

    runs.command('update')
        .description('Update a test run')
        .argument('<id>', 'Test run ID')
        .option('--status <status>', 'New status')
        .action(async (id, opts) => {
            const { runUpdate } = await import('./update');
            runUpdate(id, { ...opts, json: program.opts().json ?? opts.json });
        });

    runs.command('report')
        .description('Report test results from a CTRF file (create run + submit results)')
        .argument('<ctrf-file>', 'Path to CTRF JSON report file')
        .option('--name <name>', 'Run name (defaults to filename)')
        .option('--environment <name>', 'Environment name')
        .option('--deployment-id <id>', 'Deployment ID')
        .option('--tool <name>', 'Override tool name from CTRF')
        .option('--tags <tags>', 'Comma-separated tags (e.g., e2e,brent-rager)')
        .option('--build-name <name>', 'Build name (e.g., git SHA)')
        .option('--build-url <url>', 'Build URL (e.g., CI run link)')
        .action(async (ctrfFile, opts) => {
            const { runReport } = await import('./report');
            runReport(ctrfFile, { ...opts, json: program.opts().json ?? opts.json });
        });

    return runs;
}
