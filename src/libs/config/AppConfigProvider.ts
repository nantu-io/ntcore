import { ProviderType, ProviderTypeMapping } from '../../commons/ProviderType';
import { AppConfigDatabase } from "./AppConfigDatabase";
import { AppConfigStorage } from "./AppConfigStorage";
import yaml = require('js-yaml');
import fs = require('fs');

/**
 * Container setup in AppConfig.
 */
class AppConfigContainer 
{
    provider: ProviderType;
    namespace?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    images: {[key: string]: string}
}
/**
 * Application configuration.
 */
class AppConfig 
{
    container: AppConfigContainer;
    database: AppConfigDatabase;
    storage: AppConfigStorage;
    account: { username: string }; // This is only used when user auth is disabled
}

function getContainerProviderConfig(config: any): AppConfigContainer 
{
    const providerConfig = config['container'].provider;
    const images = config['container'].images;
    const provider = ProviderTypeMapping[providerConfig.type];
    switch(provider) {
        case ProviderType.KUBERNETES: return { provider: provider, namespace: providerConfig.config.namespace, images };
        case ProviderType.DOCKER: return { provider: provider, images };
        default: throw new Error("Invalid container provider");
    }
}

export function getAppConfig(): AppConfig 
{
    const config = yaml.load(fs.readFileSync('app-config/ntcore.yml', 'utf8'));
    return { 
        container: getContainerProviderConfig(config),
        database: config['database'].provider,
        storage: config['storage'].provider,
        account: config['account']
    };
}

export const appConfig = getAppConfig();