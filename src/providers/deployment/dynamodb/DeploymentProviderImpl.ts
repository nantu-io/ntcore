import { Deployment, IDeploymentProvider, DeploymentStatus } from "../DeploymentProvider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export default class DynamoDeploymentProvider implements IDeploymentProvider 
{
    private _databaseClient: DynamoDBClient;
    /**
     * Initialize the experiments table.
     */
    constructor(databaseClient: DynamoDBClient) 
    {
        this._databaseClient = databaseClient;
    }

    /**
     * Initialize deployment table.
     */
    public async initialize() 
    {
        
    }

    /**
     * Create a new deployment.
     * @param deployment Deployment object.
     */
    public async create(deployment: Deployment) 
    {
        return deployment.deploymentId;
    }

    /**
     * List all the deployments in a workspace.
     * @param workspaceId Workspace id.
     */
    public async list(workspaceId: string) 
    {
        return [];
    }

    /**
     * List all active deployments.
     */
    public async listActive() 
    {
        return [];
    }

    /**
     * Retrieve a deployment with given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param deploymentId Deployment id.
     */
    public async read(workspaceId: string, deploymentId: string) 
    {
        return null;
    }

    /**
     * Aquires the lock of the deployment for a workspace.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async aquireLock(workspaceId: string, version: number) 
    {
        
    }

    /**
     * Releases the lock of the deployment for a workspace.
     * @param workspaceId Workspace id.
     */
    public async releaseLock(workspaceId: string) 
    {
        
    }

    /**
     * Update the status of a deployment given a workspace id and deployment id.
     * @param workspaceId Workspace id.
     * @param id Deployment id.
     * @param status Status of the deployment.
     */
    public async updateStatus(workspaceId: string, id: string, status: DeploymentStatus) 
    {
        
    }

    /**
     * Get the currently active deployment id.
     * @param workspaceId workspace id.
     */
    public async getActive(workspaceId: string)
    {
        return null;
    }

    /**
     * Get the latest deployment id.
     * @param workspaceId workspace id.
     */
    public async getLatest(workspaceId: string)
    {
        return null;
    }
}