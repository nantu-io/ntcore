import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, UpdateItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { IWorkspaceProvider, Workspace, WorkspaceType } from '../WorkspaceProvider';

const TABLE_NAME = "Workspaces";
const INDEX_NAME = "created_by-index";

export default class DynamoDBWorkspaceProvider implements IWorkspaceProvider
{
    private _databaseClient: DynamoDBClient;
    
    constructor(client: DynamoDBClient) 
    {
        this._databaseClient = client;
    }

    /**
     * Initialize the workspaces table.
     */
     public async initialize() 
     {
        
     }
 
     /**
      * Create a new workspace.
      */
    public async create(workspace: Workspace): Promise<string>
    {
        const item = {
            id: { S: workspace.id },
            name: { S: workspace.name },
            type: { S: workspace.type },
            created_by: { S: workspace.createdBy },
            created_at: { N: workspace.createdAt?.toString() },
            max_version: { N: workspace.maxVersion?.toString() }
        }
        await this._databaseClient.send(new PutItemCommand({ TableName: TABLE_NAME, Item: item }));
        return workspace.id;
    }

    /**
     * Update an existing workspace.
     */
    public async update(workspace: Workspace): Promise<string>
    {
        const command = new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: { id: { S: workspace.id } },
            UpdateExpression: "set name=:name, set type=:type, created_by=:created_by, created_at=:created_at, max_version=:max_version",
            ExpressionAttributeValues: {
                ":name": { S: workspace.name },
                ":type": { S: workspace.type },
                ":created_by": { S: workspace.createdBy },
                ":created_at": { N: workspace.createdAt?.toString() },
                ":max_version": { N: workspace.maxVersion?.toString() }
            }
        });
        await this._databaseClient.send(command);
        return workspace.id;
    }

    /**
     * Retrieve workspace based on the given id.
     */
    public async read(id: string): Promise<Workspace>
    {
        const item = (await this._databaseClient.send(new GetItemCommand({
            TableName: TABLE_NAME,
            Key: { id: { S: id } },
        })))?.Item;
        const workspace: Workspace = {
            id: item?.id.S,
            name: item?.name.S,
            type: item?.type.S as WorkspaceType,
            createdBy: item?.created_by.S,
            createdAt: Number(item?.created_at.N),
            maxVersion: Number(item?.max_version.N)
        }
        return workspace;
    }

    /**
     * Retrieve a list of workspaces based on the given id.
     */
    public async list(username: string): Promise<Workspace[]>
    {
        const command =  new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: INDEX_NAME,
            KeyConditionExpression: `created_by = :username`,
            ExpressionAttributeValues: {
                ":username": { S: username },
            }
        });
        const items = (await this._databaseClient.send(command)).Items;
        return items?.map(item => ({
            id: item?.id.S,
            name: item?.name.S,
            type: item?.type.S as WorkspaceType,
            createdBy: item?.created_by.S,
            createdAt: Number(item?.created_at.N),
            maxVersion: Number(item?.max_version.N)
        }));
    }

    /**
     * Delete a workspace based on a given id.
     */
    public async delete(id: string): Promise<void>
    {
        await this._databaseClient.send(new DeleteItemCommand({
            TableName: TABLE_NAME,
            Key: { id: { S: id } }
        }));
    }

    /**
     * Increment the max revision of experiments in a given workspace.
     */
    public async incrementVersion(id: string): Promise<number>
    {     
        const command = new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: { id: { S: id } },
            UpdateExpression: "set max_version = max_version + :incr",
            ReturnValues: "UPDATED_NEW",
            ExpressionAttributeValues: { ":incr": { N: "1" } }
        });
        const item = await this._databaseClient.send(command);
        return Number(item.Attributes.max_version.N)
    }
}