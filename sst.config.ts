/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
    app(input) {
        return {
            name: 'smooai-testing',
            removal: input?.stage === 'production' ? 'retain' : 'remove',
            home: 'aws',
            providers: {
                aws: { region: 'us-east-2' },
            },
        };
    },
    async run() {
        // E2E integration test secrets
        new sst.Secret('E2eClientId');
        new sst.Secret('E2eClientSecret');
        new sst.Secret('E2eAuthUrl');
        new sst.Secret('E2eOrgId');
        new sst.Secret('E2eBaseUrl');
        new sst.Secret('E2eEnv');
    },
});
