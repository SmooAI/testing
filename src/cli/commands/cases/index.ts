import { Command } from 'commander';

export function createCasesCommand(program: Command): Command {
    const cases = program.command('cases').description('Manage test cases');

    cases
        .command('create')
        .description('Create a test case')
        .requiredOption('--title <title>', 'Test case title')
        .option('--description <desc>', 'Description')
        .option('--priority <priority>', 'Priority (e.g., critical, high, medium, low)')
        .option('--automation-status <status>', 'Automation status')
        .option('--tags <tags>', 'Comma-separated tags')
        .action(async (opts) => {
            const { runCreate } = await import('./create');
            runCreate({ ...opts, json: program.opts().json ?? opts.json });
        });

    cases
        .command('list')
        .description('List test cases')
        .option('--tags <tags>', 'Filter by comma-separated tags')
        .option('--priority <priority>', 'Filter by priority')
        .option('--automation-status <status>', 'Filter by automation status')
        .option('--limit <n>', 'Max results', '50')
        .option('--offset <n>', 'Offset', '0')
        .action(async (opts) => {
            const { runList } = await import('./list');
            runList({ ...opts, json: program.opts().json ?? opts.json });
        });

    cases
        .command('get')
        .description('Get a test case by ID')
        .argument('<id>', 'Test case ID')
        .action(async (id, opts) => {
            const { runGet } = await import('./get');
            runGet(id, { json: program.opts().json ?? opts.json });
        });

    cases
        .command('update')
        .description('Update a test case')
        .argument('<id>', 'Test case ID')
        .option('--title <title>', 'New title')
        .option('--description <desc>', 'New description')
        .option('--priority <priority>', 'New priority')
        .option('--automation-status <status>', 'New automation status')
        .option('--tags <tags>', 'New comma-separated tags')
        .action(async (id, opts) => {
            const { runUpdate } = await import('./update');
            runUpdate(id, { ...opts, json: program.opts().json ?? opts.json });
        });

    cases
        .command('delete')
        .description('Delete a test case')
        .argument('<id>', 'Test case ID')
        .action(async (id, opts) => {
            const { runDelete } = await import('./delete');
            runDelete(id, { json: program.opts().json ?? opts.json });
        });

    return cases;
}
