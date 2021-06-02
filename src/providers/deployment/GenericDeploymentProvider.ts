/**
 * Defines the deployment statuses.
 */
export const enum DeploymentStatus {
    /**
     * Indicates the deployment is succeed.
     */
    SUCCEED = "SUCCEED",
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
export class Deployment {
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
export interface GenericDeploymentProvider {
    /**
     * Create a new deployment.
     */
    create: (deployment: Deployment) => Promise<string>;
    /**
     * Retrieve a deployment.
     */
    read: (workspaceId: string, version: string) => Promise<Deployment>;
    /**
     * List all deployments.
     */
    list: (workspaceId: string) => Promise<Array<Deployment>>;
    /**
     * List all deployments.
     */
    listActive: () => Promise<Array<Deployment>>;
    /**
     * Aquire deployment lock;
     */
    aquireLock: (workspaceId: string, version: number) => Promise<void>;
    /**
     * Release deployment lock;
     */
    releaseLock: (workspaceId: string) => Promise<void>;
    /**
     * Update the status of a deployment;
     */
    updateStatus: (workspaceId: string, id: string, status: DeploymentStatus) => Promise<void>;
}