import { StorageEngineType } from "../../commons/ProviderType";
import { appConfig } from "../../libs/config/AppConfigProvider";
import { StorageEngine } from "multer";
import { DockerVolumeProvider } from "./volume/DockerVolumeProvider";
import { RequestHandler } from "express";

/**
 * Interface for volume provider.
 */
export interface StorageProvider
{
    /**
     * Provides the storage engine.
     */
    getStorageEngine: () => StorageEngine
    /**
     * Creates workspace root for models.
     */
    createWorkspace: (workspaceId: string) => Promise<void>
    /**
     * Moves object to the target location.
     */
    putObject: (workspaceId: string, version: number) => Promise<void>
    /**
     * Returns the path for the object
     */
    getObjectProxy: () => RequestHandler
    /**
     * Deletes objects under a given workspace.
     */
    deleteWorkspace: (workspaceId: string) => Promise<void>;
}

export class StorageProviderFactory 
{
    /**
     * Create a provider for local volumes.
     * @returns Deployment provider.
     */
    public createProvider(): StorageProvider 
    {
        const providerType: StorageEngineType = appConfig.storage.provider;
        switch(providerType) {
            case StorageEngineType.S3: return;
            case StorageEngineType.VOLUME: return new DockerVolumeProvider();
            default: throw new Error("Invalid storage type.");
        }
    }
}