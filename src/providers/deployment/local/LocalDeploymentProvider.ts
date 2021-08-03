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
} from "./LocalDeploymentQueries";
import Database = require("better-sqlite3");

export class LocalDeploymentProvider implements GenericDeploymentProvider {
    private _databaseClient: Database.Database;
    /**
     * Initialize the experiments table.
     */
    constructor(databaseClient: Database.Database) {
        this._databaseClient = databaseClient;
        this.createDeploymentTablesIfNotExists();
    }

    /**
     * Create a new deployment.
     * @param experiment Deployment object.
     */
    public async create(deployment: Deployment) {
        this._databaseClient.prepare(DEPLOYMENT_CREATE).run({
            id: deployment.deploymentId,
            workspace_id: deployment.workspaceId,
            version: deployment.version,
            status: deployment.status,
            created_by: deployment.createdBy,
            created_at: Math.floor(deployment.createdAt.getTime()/1000)
        });
        return deployment.deploymentId;
    }

    /**
     * List all the deployments in a workspace.
     * @param workspaceId Workspace id.
     */
    public async list(workspaceId: string) {
        return this._databaseClient.prepare(DEPLOYMENTS_LIST).all({workspace_id: workspaceId});;
    }

    /**
     * List all active deployments.
     */
     public async listActive() {
        return this._databaseClient.prepare(DEPLOYMENTS_ACTIVE_LIST).all();
    }

    /**
     * Retrieve a deployment with given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async read(workspaceId: string, version: string) {
        return this._databaseClient.prepare(DEPLOYMENT_READ).get({workspace_id: workspaceId, version: version});
    }

    /**
     * Aquires the lock of the deployment for a workspace.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async aquireLock(workspaceId: string, version: number) {
        return this._databaseClient.prepare(DEPLOYMENT_LOCK_CREATE).run({
            workspace_id: workspaceId,
            version: version,
            created_by: 'ntcore',
            created_at: Math.floor(new Date().getTime()/1000)
        });
    }

    /**
     * Releases the lock of the deployment for a workspace.
     * @param workspaceId Workspace id.
     */
    public async releaseLock(workspaceId: string) {
        return this._databaseClient.prepare(DEPLOYMENT_LOCK_DELETE).run({workspaceId: workspaceId});
    }

    /**
     * Update the status of a deployment given a workspace id and deployment id.
     * @param workspaceId Workspace id.
     * @param id Deployment id.
     * @param status Status of the deployment.
     */
    public async updateStatus(workspaceId: string, id: string, status: DeploymentStatus) {
        return this._databaseClient.prepare(DEPLOYMENT_STATUS_UPDATE).run({workspaceId: workspaceId, id: id, status: status})
    }

    private createDeploymentTablesIfNotExists() {
        this._databaseClient.exec(DEPLOYMENTS_INITIALIZATION);
        this._databaseClient.exec(DEPLOYMENT_LOCK_INITIALIZATION);
    }
}
