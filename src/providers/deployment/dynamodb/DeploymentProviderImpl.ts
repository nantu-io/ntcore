import { Deployment, IDeploymentProvider, DeploymentStatus } from "../DeploymentProvider";
import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";

const TABLE_NAME = "Deployments";
const WORKSPACE_ID_CREATED_AT_INDEX = "workspace_id-created_at-index";
const WORKSPACE_ID_STATUS_INDEX = "workspace_id-deploy_status-index";
const CREATED_BY_STATUS_INDEX = "created_by-deploy_status-index";

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
    public async create(deployment: Deployment): Promise<Deployment>
    {
        const item = {
            workspace_id   : { S: deployment.workspaceId },
            deployment_id  : { S: deployment.deploymentId },
            version        : { N: deployment.version.toString() },
            deploy_status  : { S: deployment.status },
            created_by     : { S: deployment.createdBy },
            created_at     : { N: deployment.createdAt?.toString() },
        }
        await this._databaseClient.send(new PutItemCommand({ TableName: TABLE_NAME, Item: item }));
        return deployment;
    }

    /**
     * List all the deployments in a workspace.
     * @param workspaceId Workspace id.
     */
    public async listAll(workspaceId: string): Promise<Deployment[]> 
    {
        const command =  new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: WORKSPACE_ID_CREATED_AT_INDEX,
            KeyConditionExpression: "workspace_id = :workspaceId",
            ExpressionAttributeValues: { ":workspaceId": { S: workspaceId } },
            ScanIndexForward: false
        });
        const items = (await this._databaseClient.send(command)).Items;
        return items?.map(item => ({
            workspaceId  : item?.workspace_id.S,
            deploymentId : item?.deployment_id.S,
            version      : parseInt(item?.version.N),
            status       : item?.deploy_status.S as DeploymentStatus,
            createdBy    : item?.created_by.S,
            createdAt    : Number(item?.created_at.N)
        }));
    }

    /**
     * List all active deployments.
     */
    public async listActive(userId: string): Promise<Deployment[]>
    {
        const command =  new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: CREATED_BY_STATUS_INDEX,
            KeyConditionExpression: `created_by = :createdBy AND deploy_status = :status`,
            ExpressionAttributeValues: { ":createdBy": { S: userId }, ":status": { S: "RUNNING" } },
            ScanIndexForward: false
        });
        const items = (await this._databaseClient.send(command)).Items;
        return items?.map(item => ({
            deploymentId : item?.deployment_id.S,
            workspaceId  : item?.workspace_id.S,
            version      : parseInt(item?.version.N),
            status       : item?.deploy_status.S as DeploymentStatus,
            createdBy    : item?.created_by.S,
            createdAt    : Number(item?.created_at.N)
        }));
    }

    /**
     * Retrieve a deployment with given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param deploymentId Deployment id.
     */
    public async read(workspaceId: string, deploymentId: string): Promise<Deployment>
    {
        const item = (await this._databaseClient.send(new GetItemCommand({
            TableName: TABLE_NAME,
            Key: { id: { S: deploymentId.toString() }, workspace_id: { S: workspaceId }}
        })))?.Item;
        if (!item) return null;
        const deployment: Deployment = {
            workspaceId  : item?.workspace_id.S,
            deploymentId : item?.deployment_id.S,
            version      : parseInt(item?.version.N),
            status       : item?.deploy_status.S as DeploymentStatus,
            createdBy    : item?.created_by.S,
            createdAt    : Number(item?.created_at.N)
        }
        return deployment
    }

    /**
     * Update the status of a deployment given a workspace id and deployment id.
     * @param workspaceId Workspace id.
     * @param deploymentId Deployment id.
     * @param status Status of the deployment.
     */
    public async updateStatus(workspaceId: string, deploymentId: string, status: DeploymentStatus) 
    {
        const command = new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: { workspace_id: { S: workspaceId }, deployment_id: { S: deploymentId } },
            UpdateExpression: "set deploy_status=:status",
            ExpressionAttributeValues: { ":status": { S: status }}
        });
        await this._databaseClient.send(command);
    }

    /**
     * Get the latest deployment id.
     * @param workspaceId workspace id.
     */
    public async getLatest(workspaceId: string): Promise<Deployment>
    {
        const command =  new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: WORKSPACE_ID_CREATED_AT_INDEX,
            KeyConditionExpression: `workspace_id = :workspaceId`,
            ExpressionAttributeValues: { ":workspaceId": { S: workspaceId } },
            ScanIndexForward: false
        });
        const item = (await this._databaseClient.send(command)).Items[0];
        if (!item) return null;
        const deployment: Deployment = {
            workspaceId  : item?.workspace_id.S,
            deploymentId : item?.deployment_id.S,
            version      : parseInt(item?.version.N),
            status       : item?.deploy_status.S as DeploymentStatus,
            createdBy    : item?.created_by.S,
            createdAt    : Number(item?.created_at.N)
        }
        return deployment;
    }

    /**
     * Get the latest deployment id.
     * @param workspaceId workspace id.
     */
    public async getActive(workspaceId: string): Promise<Deployment>
    {
        const command =  new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: WORKSPACE_ID_STATUS_INDEX,
            KeyConditionExpression: `workspace_id = :workspaceId AND deploy_status = :status`,
            ExpressionAttributeValues: { ":workspaceId": { S: workspaceId }, ":status": { S: "RUNNING" } },
            ScanIndexForward: false
        });
        const item = (await this._databaseClient.send(command)).Items[0];
        if (!item) return null;
        const deployment: Deployment = {
            workspaceId  : item?.workspace_id.S,
            deploymentId : item?.deployment_id.S,
            version      : parseInt(item?.version.N),
            status       : item?.deploy_status.S as DeploymentStatus,
            createdBy    : item?.created_by.S,
            createdAt    : Number(item?.created_at.N)
        }
        return deployment;
    }
}