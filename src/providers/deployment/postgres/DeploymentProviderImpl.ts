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
import { Pool } from 'pg';

export class PostgresDeploymentProvider implements IDeploymentProvider 
{
    private _pgPool: Pool;
    /**
     * Initialize the experiments table.
     */
    constructor(pool: Pool) 
    {
        this._pgPool = pool;
    }

    /**
     * Initialize deployment table.
     */
    public async initialize() 
    {
        await this._pgPool.query(DEPLOYMENTS_INITIALIZATION);
    }

    /**
     * Create a new deployment.
     */
    public async create(deployment: Deployment): Promise<Deployment>
    {
        const { deploymentId, workspaceId, version, status, createdBy, createdAt } = deployment;
        await this._pgPool.query(DEPLOYMENT_CREATE, 
            [deploymentId, workspaceId, version, status, createdBy, createdAt]);
        return deployment;
    }

    /**
     * List all the deployments in a workspace.
     * @param workspaceId Workspace id.
     */
    public async listAll(workspaceId: string): Promise<Deployment[]>
    {
        return (await this._pgPool.query(DEPLOYMENTS_LIST, [workspaceId]))?.rows?.map(item => ({
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
        return (await this._pgPool.query(DEPLOYMENTS_ACTIVE_LIST, [userId]))?.rows.map(item => ({
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
        const rows = (await this._pgPool.query(DEPLOYMENT_READ, [workspaceId, deploymentId]))?.rows.map(item => ({
            workspaceId  : item?.workspace_id,
            deploymentId : item?.id,
            version      : parseInt(item?.version),
            status       : item?.status as DeploymentStatus,
            createdBy    : item?.created_by,
            createdAt    : Number(item?.created_at)
        }));
        return rows && rows.length > 0 ? rows[0] : null;
    }

    /**
     * Update the status of a deployment given a workspace id and deployment id.
     * @param workspaceId Workspace id.
     * @param deploymentId Deployment id.
     * @param status Status of the deployment.
     */
    public async updateStatus(workspaceId: string, deploymentId: string, status: DeploymentStatus): Promise<void>
    {
        await this._pgPool.query(DEPLOYMENT_STATUS_UPDATE, [workspaceId, deploymentId, status]);
    }

    /**
     * Get the latest deployment id.
     * @param workspaceId workspace id.
     */
    public async getLatest(workspaceId: string): Promise<Deployment>
    {
        const rows = (await this._pgPool.query(DEPLOYMENT_LATEST_READ, [workspaceId]))?.rows.map(item => ({
            workspaceId  : item?.workspace_id,
            deploymentId : item?.id,
            version      : parseInt(item?.version),
            status       : item?.status as DeploymentStatus,
            createdBy    : item?.created_by,
            createdAt    : Number(item?.created_at)
        }));
        return rows && rows.length > 0 ? rows[0] : null;
    }

    /**
     * Get the latest deployment id.
     * @param workspaceId workspace id.
     */
    public async getActive(workspaceId: string): Promise<Deployment>
    {
        const rows = (await this._pgPool.query(DEPLOYMENT_ACTIVE_READ, [workspaceId]))?.rows.map(item => ({
            workspaceId  : item?.workspace_id,
            deploymentId : item?.id,
            version      : parseInt(item?.version),
            status       : item?.status as DeploymentStatus,
            createdBy    : item?.created_by,
            createdAt    : Number(item?.created_at)
        }));
        return rows && rows.length > 0 ? rows[0] : null;
    }
}