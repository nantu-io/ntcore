import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import { SQLiteDeploymentProvider } from "./sqlite/SQLiteDeploymentProvider";
import { appConfig } from "../../libs/config/AppConfigProvider";
import { PostgresDeploymentProvider } from "./postgres/PostgresDeploymentProvider";
import DynamoDBClientProvider from "../../libs/client/aws/DynamoDBClientProvider";
import PostgresClientProvider from "../../libs/client/PostgresClientProvider";
import { ContainerGroupState } from "../container/ContainerGroupProvider";
import DynamoDBDeploymetnProvider from "../deployment/dynamodb/DeploymentProviderImpl";

/**
 * Container group state to deployment status mapping
 */
export const ContainerGroupStateToDeploymentStatusMapping = {
    /**
     * Pending.
     */
    [ContainerGroupState.PENDING] : DeploymentStatus.PENDING,
    /**
     * Running.
     */
    [ContainerGroupState.RUNNING] : DeploymentStatus.RUNNING,
    /**
     * Stopped.
     */
    [ContainerGroupState.STOPPED] : DeploymentStatus.STOPPED,
    /**
     * Inactive.
     */
    [ContainerGroupState.INACTIVE] : DeploymentStatus.STOPPED,
}
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
    /**
     * Indicate deployment retrieval is failed.
     */
    UNKNOWN = "UNKNOWN"
}
/**
 * Defines the deployment object.
 */
export class Deployment 
{
    workspaceId: string;
    deploymentId: string;
    version: number;
    status: DeploymentStatus;
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
export interface IDeploymentProvider 
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
     * Get the latest deployment.
     */
    getLatest: (workspaceId: string) => Promise<Deployment>;
    /**
     * List all deployments.
     */
    listActive: (userId: string) => Promise<Array<Deployment>>;
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
    public createProvider(): IDeploymentProvider 
    {
        switch(appConfig.database.type) {
            case "postgres": return new PostgresDeploymentProvider(PostgresClientProvider.get());
            case "sqlite": return new SQLiteDeploymentProvider(SQliteClientProvider.get());
            case "dynamodb": return new DynamoDBDeploymetnProvider(DynamoDBClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}