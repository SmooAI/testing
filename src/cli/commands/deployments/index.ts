import { Command } from 'commander';

export function createDeploymentsCommand(program: Command): Command {
    const deployments = program.command('deployments').description('Manage deployments');

    deployments
        .command('create')
        .description('Create a deployment')
        .requiredOption('--name <name>', 'Deployment name')
        .option('--environment-id <id>', 'Environment ID')
        .option('--status <status>', 'Status (pending, in_progress, success, failure, cancelled)')
        .option('--source <source>', 'Source (e.g., github, gitlab)')
        .option('--external-id <id>', 'External ID')
        .option('--external-url <url>', 'External URL')
        .option('--ref <ref>', 'Git ref')
        .action(async (opts) => {
            const { runCreate } = await import('./create');
            runCreate({ ...opts, json: program.opts().json ?? opts.json });
        });

    deployments
        .command('list')
        .description('List deployments')
        .option('--status <status>', 'Filter by status')
        .option('--environment-id <id>', 'Filter by environment ID')
        .option('--source <source>', 'Filter by source')
        .option('--limit <n>', 'Max results', '50')
        .option('--offset <n>', 'Offset', '0')
        .action(async (opts) => {
            const { runList } = await import('./list');
            runList({ ...opts, json: program.opts().json ?? opts.json });
        });

    deployments
        .command('get')
        .description('Get a deployment by ID')
        .argument('<id>', 'Deployment ID')
        .action(async (id, opts) => {
            const { runGet } = await import('./get');
            runGet(id, { json: program.opts().json ?? opts.json });
        });

    deployments
        .command('update')
        .description('Update a deployment')
        .argument('<id>', 'Deployment ID')
        .option('--name <name>', 'New name')
        .option('--status <status>', 'New status')
        .option('--external-url <url>', 'New external URL')
        .action(async (id, opts) => {
            const { runUpdate } = await import('./update');
            runUpdate(id, { ...opts, json: program.opts().json ?? opts.json });
        });

    deployments
        .command('delete')
        .description('Delete a deployment')
        .argument('<id>', 'Deployment ID')
        .action(async (id, opts) => {
            const { runDelete } = await import('./delete');
            runDelete(id, { json: program.opts().json ?? opts.json });
        });

    return deployments;
}
