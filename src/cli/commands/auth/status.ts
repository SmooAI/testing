import { loadCredentials } from '../../utils/credentials';
import { isInteractive, jsonOutput } from '../../utils/output';

interface StatusOptions {
    json?: boolean;
}

export function runStatus(options: StatusOptions): void {
    const creds = loadCredentials();

    if (!isInteractive(options.json)) {
        jsonOutput({
            loggedIn: !!creds,
            orgId: creds?.orgId ?? null,
            apiUrl: creds?.apiUrl ?? null,
            authUrl: creds?.authUrl ?? null,
        });
    }

    if (!creds) {
        console.log('Not logged in. Run `smooai-testing login` to authenticate.');
        return;
    }

    console.log(`Logged in`);
    console.log(`  Organization: ${creds.orgId}`);
    console.log(`  API URL:      ${creds.apiUrl}`);
    console.log(`  Auth URL:     ${creds.authUrl}`);
    console.log(`  Client ID:    ${creds.clientId.slice(0, 8)}...`);
}
