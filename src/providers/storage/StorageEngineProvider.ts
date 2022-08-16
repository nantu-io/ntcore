import { appConfig } from "../../libs/config/AppConfigProvider";
import { StorageEngine } from "multer";
import { DockerVolumeProvider } from "./volume/DockerVolumeProvider";
import { S3Provider } from "../storage/s3/S3Provider";
import { RequestHandler } from "express";
import S3ClientProvider from "../../libs/client/aws/s3Client";

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
     * Create a provider for volumes.
     * @returns Deployment provider.
     */
    public createProvider(): StorageProvider 
    {
        switch(appConfig.storage.type) {
            case "s3": return new S3Provider(S3ClientProvider.get());
            case "volume": return new DockerVolumeProvider();
            default: throw new Error("Invalid storage type.");
        }
    }
}