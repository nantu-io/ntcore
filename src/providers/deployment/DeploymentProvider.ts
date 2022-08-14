import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import { SQLiteDeploymentProvider } from "./sqlite/DeploymentProviderImpl";
import { appConfig } from "../../libs/config/AppConfigProvider";
import { PostgresDeploymentProvider } from "./postgres/DeploymentProviderImpl";
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
    [ContainerGroupState.PENDING] : "PENDING",
    /**
     * Running.
     */
    [ContainerGroupState.RUNNING] : "RUNNING",
    /**
     * Stopped.
     */
    [ContainerGroupState.STOPPED] : "STOPPED",
    /**
     * Inactive.
     */
    [ContainerGroupState.INACTIVE] : "STOPPED",
}
/**
 * Defines the deployment statuses.
 */
export type DeploymentStatus = "RUNNING" | "STOPPED" | "FAILED" | "PENDING" | "UNKNOWN"
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
    createdAt: number;
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
     * Get the latest deployment.
     */
    getLatest: (workspaceId: string) => Promise<Deployment>;
    /**
     * List all deployments.
     */
    listActive: (userId: string) => Promise<Array<Deployment>>;
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