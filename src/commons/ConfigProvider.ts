import yaml = require('js-yaml');
import fs = require('fs');
import { ProviderType, ProviderTypeMapping } from './ProviderType';

/**
 * Application configuration.
 */
export class AppConfig {
    provider: ProviderType
}

export class AppConfigProvider {
    public getConfig() {
        const config = yaml.load(fs.readFileSync('config.yml', 'utf8'));
        const provider = config['provider'];
        return { provider: ProviderTypeMapping[provider] };
    }
}