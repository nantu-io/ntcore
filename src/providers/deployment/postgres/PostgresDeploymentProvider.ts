import { Deployment, GenericDeploymentProvider, DeploymentStatus } from "../GenericDeploymentProvider";
import {
    DEPLOYMENTS_INITIALIZATION,
    DEPLOYMENTS_LIST,
    DEPLOYMENTS_ACTIVE_LIST,
    DEPLOYMENT_CREATE,
    DEPLOYMENT_READ,
    DEPLOYMENT_LOCK_INITIALIZATION,
    DEPLOYMENT_LOCK_CREATE,
    DEPLOYMENT_LOCK_DELETE,
    DEPLOYMENT_STATUS_UPDATE
} from "./PostgresDeploymentQueries";
import { Pool } from 'pg';

export class PostgresDeploymentProvider implements GenericDeploymentProvider {
    private _pgPool: Pool;
    /**
     * Initialize the experiments table.
     */
    constructor(databaseClient: Pool) {
        this._pgPool = databaseClient;
        this.createDeploymentTablesIfNotExists();
    }

    /**
     * Create a new deployment.
     * @param experiment Deployment object.
     */
    public async create(deployment: Deployment) {
        const { deploymentId, workspaceId, version, status, createdBy, createdAt } = deployment;
        await this._pgPool.query(
            DEPLOYMENT_CREATE,
            [deploymentId, workspaceId, version, status, createdBy, Math.floor(createdAt.getTime()/1000)]
        );
        return deploymentId;
    }

    /**
     * List all the deployments in a workspace.
     * @param workspaceId Workspace id.
     */
    public async list(workspaceId: string) {
        return await this._pgPool.query(DEPLOYMENTS_LIST, [workspaceId]).then(res => res.rows.length > 0 ? res.rows[0] : null);
    }

    /**
     * List all active deployments.
     */
     public async listActive() {
        return this._pgPool.query(DEPLOYMENTS_ACTIVE_LIST).then(res => res.rows);
    }

    /**
     * Retrieve a deployment with given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async read(workspaceId: string, version: string) {
        return await this._pgPool.query(DEPLOYMENT_READ, [workspaceId, version]).then(res => res.rows.length > 0 ? res.rows[0] : null);
    }

    /**
     * Aquires the lock of the deployment for a workspace.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async aquireLock(workspaceId: string, version: number) {
        return await this._pgPool.query(DEPLOYMENT_LOCK_CREATE, [workspaceId, version, 'ntcore', Math.floor(new Date().getTime()/1000)]);
    }

    /**
     * Releases the lock of the deployment for a workspace.
     * @param workspaceId Workspace id.
     */
    public async releaseLock(workspaceId: string) {
        return await this._pgPool.query(DEPLOYMENT_LOCK_DELETE, [workspaceId]);
    }

    /**
     * Update the status of a deployment given a workspace id and deployment id.
     * @param workspaceId Workspace id.
     * @param id Deployment id.
     * @param status Status of the deployment.
     */
    public async updateStatus(workspaceId: string, id: string, status: DeploymentStatus) {
        return await this._pgPool.query(DEPLOYMENT_STATUS_UPDATE, [workspaceId, id, status]);
    }

    private createDeploymentTablesIfNotExists() {
        this._pgPool.query(DEPLOYMENTS_INITIALIZATION);
        this._pgPool.query(DEPLOYMENT_LOCK_INITIALIZATION);
    }
}