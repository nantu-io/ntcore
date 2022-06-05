import { Experiment, IExperimentProvider } from "../ExperimentProvider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

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
        return experiment.version;
    }

    /**
     * List experiments for a given workspace.
     * @param workspaceId Workspace id.
     */
    public async list(workspaceId: string) 
    {
        return [];
    }

    /**
     * Retrieve an experiment with the given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async read(workspaceId: string, version: number) 
    {
        return null;
    }

    /**
     * Delete the model version.
     * @param workspaceId Workspace id.
     * @param version version number.
     */
    public async delete(workspaceId: string, version: number) 
    {
        
    }

    /**
     * Retrieve the model.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     * @returns Model path.
     */
    public async loadModel(workspaceId: string, version: number) 
    {
        return null;
    }

    /**
     * Register an experiment version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async register(workspaceId: string, version: number) 
    {
        
    }

    /**
     * Unregister an experiment version.
     * @param workspaceId Workspace id.
     */
    public async deregister(workspaceId: string, version: number) 
    {

    }

    /**
     * Returns an registered experiment.
     * @param workspaceId Workspace id.
     */
    public async getRegistry(workspaceId: string) 
    {
        return null;
    }
}