import { clearCredentials } from '../../utils/credentials';
import { isInteractive, jsonOutput } from '../../utils/output';

interface LogoutOptions {
    json?: boolean;
}

export function runLogout(options: LogoutOptions): void {
    clearCredentials();

    if (!isInteractive(options.json)) {
        jsonOutput({ success: true, message: 'Logged out' });
    }

    console.log('Logged out. M2M credentials removed from ~/.smooai/credentials.json');
}
