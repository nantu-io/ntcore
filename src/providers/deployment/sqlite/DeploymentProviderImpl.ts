import { Deployment, IDeploymentProvider, DeploymentStatus } from "../DeploymentProvider";
import {
    DEPLOYMENTS_INITIALIZATION,
    DEPLOYMENTS_LIST,
    DEPLOYMENTS_ACTIVE_LIST,
    DEPLOYMENT_CREATE,
    DEPLOYMENT_READ,
    DEPLOYMENT_STATUS_UPDATE,
    DEPLOYMENT_LATEST_READ,
    DEPLOYMENT_ACTIVE_READ
} from "./DeploymentQueries";
import Database = require("better-sqlite3");

export class SQLiteDeploymentProvider implements IDeploymentProvider 
{
    private _databaseClient: Database.Database;
    /**
     * Initialize the experiments table.
     */
    constructor(databaseClient: Database.Database) 
    {
        this._databaseClient = databaseClient;
    }

    /**
     * Initialize deployment table.
     */
    public async initialize() 
    {
        this._databaseClient.exec(DEPLOYMENTS_INITIALIZATION);
    }

    /**
     * Create a new deployment.
     * @param deployment Deployment object.
     */
    public async create(deployment: Deployment): Promise<Deployment>
    {
        this._databaseClient.prepare(DEPLOYMENT_CREATE).run({
            id: deployment.deploymentId,
            workspace_id: deployment.workspaceId,
            version: deployment.version,
            status: deployment.status,
            created_by: deployment.createdBy,
            created_at: deployment.createdAt
        });
        return deployment;
    }

    /**
     * List all the deployments in a workspace.
     * @param workspaceId Workspace id.
     */
    public async listAll(workspaceId: string): Promise<Deployment[]>
    {
        return this._databaseClient.prepare(DEPLOYMENTS_LIST).all({workspace_id: workspaceId})?.map(item => ({
            workspaceId  : item?.workspace_id,
            deploymentId : item?.id,
            version      : parseInt(item?.version),
            status       : item?.status as DeploymentStatus,
            createdBy    : item?.created_by,
            createdAt    : Number(item?.created_at)
        }));
    }

    /**
     * List all active deployments.
     */
    public async listActive(userId: string): Promise<Deployment[]>
    {
        return this._databaseClient.prepare(DEPLOYMENTS_ACTIVE_LIST).all({created_by: userId})?.map(item => ({
            workspaceId  : item?.workspace_id,
            deploymentId : item?.id,
            version      : parseInt(item?.version),
            status       : item?.status as DeploymentStatus,
            createdBy    : item?.created_by,
            createdAt    : Number(item?.created_at)
        }));
    }

    /**
     * Retrieve a deployment with given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param deploymentId Deployment id.
     */
    public async read(workspaceId: string, deploymentId: string): Promise<Deployment>
    {
        const item = this._databaseClient.prepare(DEPLOYMENT_READ).get({workspace_id: workspaceId, id: deploymentId});
        if (!item) return null; 
        return {
            workspaceId  : item?.workspace_id,
            deploymentId : item?.id,
            version      : parseInt(item?.version),
            status       : item?.status as DeploymentStatus,
            createdBy    : item?.created_by,
            createdAt    : Number(item?.created_at)
        };
    }

    /**
     * Update the status of a deployment given a workspace id and deployment id.
     * @param workspaceId Workspace id.
     * @param deploymentId Deployment id.
     * @param status Status of the deployment.
     */
    public async updateStatus(workspaceId: string, deploymentId: string, status: DeploymentStatus): Promise<void> 
    {
        this._databaseClient.prepare(DEPLOYMENT_STATUS_UPDATE).run({workspaceId: workspaceId, id: deploymentId, status: status})
    }

    /**
     * Get the latest deployment id.
     * @param workspaceId workspace id.
     */
    public async getLatest(workspaceId: string): Promise<Deployment>
    {
        const item = this._databaseClient.prepare(DEPLOYMENT_LATEST_READ).get({workspaceId: workspaceId});
        if (!item) return null; 
        return {
            workspaceId  : item?.workspace_id,
            deploymentId : item?.id,
            version      : parseInt(item?.version),
            status       : item?.status as DeploymentStatus,
            createdBy    : item?.created_by,
            createdAt    : Number(item?.created_at)
        };
    }

    /**
     * Get the latest deployment id.
     * @param workspaceId workspace id.
     */
    public async getActive(workspaceId: string): Promise<Deployment>
    {
        const item = this._databaseClient.prepare(DEPLOYMENT_ACTIVE_READ).get({workspaceId: workspaceId});
        if (!item) return null; 
        return {
            workspaceId  : item?.workspace_id,
            deploymentId : item?.id,
            version      : parseInt(item?.version),
            status       : item?.status as DeploymentStatus,
            createdBy    : item?.created_by,
            createdAt    : Number(item?.created_at)
        };
    }
}
