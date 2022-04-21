import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import { SQLiteDeploymentProvider } from "./sqlite/SQLiteDeploymentProvider";
import { DatabaseType } from "../../commons/ProviderType";
import { appConfig } from "../../libs/config/AppConfigProvider";
import { PostgresDeploymentProvider } from "./postgres/PostgresDeploymentProvider";
import PostgresClientProvider from "../../libs/client/PostgresClientProvider";

/**
 * Defines the deployment statuses.
 */
export const enum DeploymentStatus
{
    /**
     * Indicates the deployment is succeed.
     */
    RUNNING = "RUNNING",
    /**
     * Indicates the deployment is succeed.
     */
    STOPPED = "STOPPED",
    /**
     * Indicates the deployment is failed.
     */
    FAILED = "FAILED",
    /**
     * Indicate the deployment is ongoing.
     */
    PENDING = "PENDING",
}
/**
 * Defines the deployment object.
 */
export class Deployment 
{
    workspaceId: string;
    deploymentId: string;
    version: number;
    status: string;
    createdBy: string;
    createdAt: Date;
}
/**
 * Defines the illegal state error.
 */
export class IllegalStateError extends Error {}
/**
 * Interface for deployment provider.
 */
export interface DeploymentProvider 
{
    /**
     * Initialize required resource.
     */
    initialize: () => Promise<void>;
    /**
     * Create a new deployment.
     */
    create: (deployment: Deployment) => Promise<string>;
    /**
     * Retrieve a deployment.
     */
    read: (workspaceId: string, deploymentId: string) => Promise<Deployment>;
    /**
     * List all deployments.
     */
    list: (workspaceId: string) => Promise<Array<Deployment>>;
    /**
     * Get active deployment.
     */
    getActive: (workspaceId: string) => Promise<Deployment>;
    /**
     * List all deployments.
     */
    listActive: () => Promise<Array<Deployment>>;
    /**
     * Aquire deployment lock;
     */
    aquireLock: (workspaceId: string, version: number) => Promise<any>;
    /**
     * Release deployment lock;
     */
    releaseLock: (workspaceId: string) => Promise<any>;
    /**
     * Update the status of a deployment;
     */
    updateStatus: (workspaceId: string, id: string, status: DeploymentStatus) => Promise<any>;
}

export class DeploymentProviderFactory
{
    /**
     * Create a provider for local deployments.
     * @returns Deployment provider.
     */
    public createProvider(): DeploymentProvider 
    {
        const providerType: DatabaseType = appConfig.database.provider;
        switch(providerType) {
            case DatabaseType.POSTGRES: return new PostgresDeploymentProvider(PostgresClientProvider.get());
            case DatabaseType.SQLITE: return new SQLiteDeploymentProvider(SQliteClientProvider.get());
            default: throw new Error("Invalide provider type.");
        }
    }
}