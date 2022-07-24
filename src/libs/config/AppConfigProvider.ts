import { ProviderType, ProviderTypeMapping, StorageEngineTypeMapping, StorageEngineType } from '../../commons/ProviderType';
import { AppConfigDatabase } from "./AppConfigDatabase";
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
 * Storage config in AppConfig.
 */
class AppConfigStorage
{
    provider: StorageEngineType;
    config: AppConfigDiskStorage | AppConfigS3Storage
}
/**
 * Disk storage config in AppConfig.
 */
class AppConfigDiskStorage
{
    root: string;
}
/**
 * S3 storage config in AppConfig.
 */
class AppConfigS3Storage 
{
    bucket: string;
    root: string;
}
/**
 * Application configuration.
 */
class AppConfig 
{
    container: AppConfigContainer;
    database: AppConfigDatabase;
    storage: AppConfigStorage;
    // Deprecate this field in favor of user authentication.
    account: { username: string };
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

function getStorageEngineProviderConfig(config: any): AppConfigStorage
{
    const providerConfig = config['storage'].provider;
    const provider = StorageEngineTypeMapping[providerConfig.type];
    switch(provider) {
        case StorageEngineType.S3: return { provider: provider, config: { bucket: providerConfig.config.bucket, root: providerConfig.config.root } };
        case StorageEngineType.VOLUME: return { provider: provider, config: { root: providerConfig.config.root } };
        default: throw new Error("Invalid storage engine provider");
    }
}

function getAppConfig(): AppConfig 
{
    const config = yaml.load(fs.readFileSync('app-config/ntcore.yml', 'utf8'));
    return { 
        container: getContainerProviderConfig(config),
        database: config['database'].provider,
        storage: getStorageEngineProviderConfig(config),
        account: config['account']
    };
}

export const appConfig = getAppConfig();