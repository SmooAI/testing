import { Command } from 'commander';

export function createEnvironmentsCommand(program: Command): Command {
    const envs = program.command('envs').description('Manage test environments');

    envs.command('create')
        .description('Create a test environment')
        .requiredOption('--name <name>', 'Environment name')
        .option('--description <desc>', 'Description')
        .option('--base-url <url>', 'Base URL')
        .action(async (opts) => {
            const { runCreate } = await import('./create');
            runCreate({ ...opts, json: program.opts().json ?? opts.json });
        });

    envs.command('list')
        .description('List test environments')
        .action(async (opts) => {
            const { runList } = await import('./list');
            runList({ json: program.opts().json ?? opts.json });
        });

    envs.command('get')
        .description('Get a test environment by ID')
        .argument('<id>', 'Environment ID')
        .action(async (id, opts) => {
            const { runGet } = await import('./get');
            runGet(id, { json: program.opts().json ?? opts.json });
        });

    envs.command('update')
        .description('Update a test environment')
        .argument('<id>', 'Environment ID')
        .option('--name <name>', 'New name')
        .option('--description <desc>', 'New description')
        .option('--base-url <url>', 'New base URL')
        .action(async (id, opts) => {
            const { runUpdate } = await import('./update');
            runUpdate(id, { ...opts, json: program.opts().json ?? opts.json });
        });

    return envs;
}
