import { Experiment, ExperimentState, IExperimentProvider } from "../ExperimentProvider";
import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, UpdateItemCommand, QueryCommand, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { Framework } from "../../../commons/Framework";
import { Runtime } from "../../../commons/Runtime";

const TABLE_NAME = "Experiments";
const WORKSPACE_ID_STATE_INDEX_NAME = "workspace_id-rgtr_state-index";

export default class DynamoDBExperimentProvider implements IExperimentProvider 
{
    private _databaseClient: DynamoDBClient;
    /**
     * Initialize the experiments table.
     */
    constructor(databaseClient: DynamoDBClient) 
    {
        this._databaseClient = databaseClient;
    }

    public async initialize() 
    {
        
    }

    /**
     * Create a new experiment.
     * @param experiment experiment object.
     */
    public async create(experiment: Experiment) 
    {
        await this._databaseClient.send(new PutItemCommand({ TableName: TABLE_NAME, Item: this.createExperimentRecord(experiment) }));
        return experiment.version;
    }

    private createExperimentRecord(experiment: Experiment)
    {
        return {
            workspace_id: { S: experiment.workspaceId },
            version     : { N: experiment.version.toString() },
            runtime     : { S: experiment.runtime },
            framework   : { S: experiment.framework },
            description : { S: experiment.description ?? "" },
            parameters  : { S: JSON.stringify(experiment.parameters ?? {}) },
            metrics     : { S: JSON.stringify(experiment.metrics ?? {}), },
            rgtr_state  : { S: experiment.state },
            created_by  : { S: experiment.createdBy },
            created_at  : { N: experiment.createdAt?.toString() }
        }
    }

    /**
     * List experiments for a given workspace.
     * @param workspaceId Workspace id.
     */
    public async list(workspaceId: string): Promise<Experiment[]>
    {
        const command =  new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: `workspace_id = :workspaceId`,
            ExpressionAttributeValues: { ":workspaceId": { S: workspaceId } },
            ScanIndexForward: false
        });
        const items = (await this._databaseClient.send(command)).Items;
        return items?.map(item => ({
            workspaceId : workspaceId,
            version     : parseInt(item?.version.N),
            runtime     : item?.runtime.S as Runtime,
            framework   : item?.framework.S as Framework,
            description : item?.description.S,
            parameters  : JSON.parse(item?.parameters.S),
            metrics     : JSON.parse(item?.metrics.S),
            state       : item?.rgtr_state.S as ExperimentState,
            createdBy   : item?.created_by.S,
            createdAt   : Number(item?.created_at.N),
        }));
    }

    /**
     * Retrieve an experiment with the given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async read(workspaceId: string, version: number): Promise<Experiment>
    {
        const item = (await this._databaseClient.send(new GetItemCommand({
            TableName: TABLE_NAME,
            Key: { workspace_id: { S: workspaceId }, version: { N: version.toString() }}
        })))?.Item;
        if (!item) return null;
        const experiment: Experiment = {
            workspaceId : workspaceId,
            version     : parseInt(item?.version.N),
            runtime     : item?.runtime.S as Runtime,
            framework   : item?.framework.S as Framework,
            description : item?.description.S,
            parameters  : JSON.parse(item?.parameters.S),
            metrics     : JSON.parse(item?.metrics.S),
            state       : item?.rgtr_state.S as ExperimentState,
            createdBy   : item?.created_by.S,
            createdAt   : Number(item?.created_at.N),
        }
        return experiment
    }

    /**
     * Delete the model version.
     * @param workspaceId Workspace id.
     * @param version version number.
     */
    public async delete(workspaceId: string, version: number): Promise<void>
    {
        await this._databaseClient.send(new DeleteItemCommand({
            TableName: TABLE_NAME,
            Key: { workspace_id: { S: workspaceId }, version: { N: version.toString() }}
        }));
    }

    /**
     * Register an experiment version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async register(workspaceId: string, version: number): Promise<void>
    {
        const registry: Experiment = await (this.getRegistry(workspaceId));
        if (registry?.version === version) return;
        const experimentToRegister: Experiment = await this.read(workspaceId, version);
        const putRequests = [ { PutRequest: { Item: { ...this.createExperimentRecord(experimentToRegister), rgtr_state: { S: "REGISTERED" } } } } ];
        if (registry) putRequests.push({ PutRequest: { Item: { ...this.createExperimentRecord(registry), rgtr_state: { S: "UNREGISTERED" } } } });
        await this._databaseClient.send(new BatchWriteItemCommand({ RequestItems: { [TABLE_NAME]: putRequests } }));
    }

    /**
     * Unregister an experiment version.
     * @param workspaceId Workspace id.
     */
    public async deregister(workspaceId: string, version: number): Promise<void>
    {
        const command = new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: { workspace_id: { S: workspaceId }, version: { N: version.toString() }},
            UpdateExpression: "set rgtr_state=:state",
            ExpressionAttributeValues: { ":state": { S: "UNREGISTERED" } }
        });
        await this._databaseClient.send(command);
    }

    /**
     * Returns an registered experiment.
     * @param workspaceId Workspace id.
     */
    public async getRegistry(workspaceId: string): Promise<Experiment>
    {
        const command =  new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: WORKSPACE_ID_STATE_INDEX_NAME,
            KeyConditionExpression: `workspace_id = :workspaceId AND rgtr_state = :state`,
            ExpressionAttributeValues: { ":workspaceId": { S: workspaceId }, ":state": { S: "REGISTERED" } }
        });
        const item = (await this._databaseClient.send(command)).Items[0];
        if (!item) return null;
        return {
            workspaceId : workspaceId,
            version     : parseInt(item?.version.N),
            runtime     : item?.runtime.S as Runtime,
            framework   : item?.framework.S as Framework,
            description : item?.description.S,
            parameters  : JSON.parse(item?.parameters.S),
            metrics     : JSON.parse(item?.metrics.S),
            state       : item?.rgtr_state.S as ExperimentState,
            createdBy   : item?.created_by.S,
            createdAt   : Number(item?.created_at.N),
        };
    }
}