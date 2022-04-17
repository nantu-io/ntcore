import { Deployment, DeploymentProvider, DeploymentStatus } from "../DeploymentProvider";
import {
    DEPLOYMENTS_INITIALIZATION,
    DEPLOYMENTS_LIST,
    DEPLOYMENTS_ACTIVE_LIST,
    DEPLOYMENT_CREATE,
    DEPLOYMENT_READ,
    DEPLOYMENT_LOCK_INITIALIZATION,
    DEPLOYMENT_LOCK_CREATE,
    DEPLOYMENT_LOCK_DELETE,
    DEPLOYMENT_STATUS_UPDATE,
    DEPLOYMENT_ACTIVE_READ
} from "./PostgresDeploymentQueries";
import { Pool } from 'pg';

export class PostgresDeploymentProvider implements DeploymentProvider 
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
        await this._pgPool.query(DEPLOYMENT_LOCK_INITIALIZATION);
        console.log('Initialized deployments table.');
    }

    /**
     * Create a new deployment.
     */
    public async create(deployment: Deployment) 
    {
        const { deploymentId, workspaceId, version, status, createdBy, createdAt } = deployment;
        const row = [deploymentId, workspaceId, version, status, createdBy, Math.floor(createdAt.getTime()/1000)];
        await this._pgPool.query(DEPLOYMENT_CREATE, row);
        return deploymentId;
    }

    /**
     * List all the deployments in a workspace.
     * @param workspaceId Workspace id.
     */
    public async list(workspaceId: string) 
    {
        return await this._pgPool.query(DEPLOYMENTS_LIST, [workspaceId]).then(res => res.rows ? res.rows : []);
    }

    /**
     * List all active deployments.
     */
    public async listActive() 
    {
        return this._pgPool.query(DEPLOYMENTS_ACTIVE_LIST).then(res => res.rows ? res.rows : []);
    }

    /**
     * Retrieve a deployment with given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param deploymentId Deployment id.
     */
    public async read(workspaceId: string, deploymentId: string) 
    {
        return await this._pgPool.query(DEPLOYMENT_READ, [workspaceId, deploymentId]).then(res => res.rows.length > 0 ? res.rows[0] : null);
    }

    /**
     * Aquires the lock of the deployment for a workspace.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async aquireLock(workspaceId: string, version: number) 
    {
        await this._pgPool.query(DEPLOYMENT_LOCK_CREATE, [workspaceId, version, 'ntcore', Math.floor(new Date().getTime()/1000)]);
    }

    /**
     * Releases the lock of the deployment for a workspace.
     * @param workspaceId Workspace id.
     */
    public async releaseLock(workspaceId: string) 
    {
        await this._pgPool.query(DEPLOYMENT_LOCK_DELETE, [workspaceId]);
    }

    /**
     * Update the status of a deployment given a workspace id and deployment id.
     * @param workspaceId Workspace id.
     * @param id Deployment id.
     * @param status Status of the deployment.
     */
    public async updateStatus(workspaceId: string, id: string, status: DeploymentStatus) 
    {
        await this._pgPool.query(DEPLOYMENT_STATUS_UPDATE, [workspaceId, id, status]);
    }

    /**
     * Retrieve a deployment with given workspaceId and version.
     * @param workspaceId Workspace id.
     */
     public async getActive(workspaceId: string) 
     {
         return await this._pgPool.query(DEPLOYMENT_ACTIVE_READ, [workspaceId]).then(res => res.rows.length > 0 ? res.rows[0] : null);
     }
}