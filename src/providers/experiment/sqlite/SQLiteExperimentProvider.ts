import { Experiment, ExperimentState, IExperimentProvider } from "../GenericExperimentProvider";
import {
    EXPERIMENTS_INITIALIZATION,
    EXPERIMENTS_LIST,
    EXPERIMENT_CREATE,
    EXPERIMENT_READ,
    EXPERIMENT_DELETE,
    EXPERIMENTS_CREATE_STATE_INDEX,
    EXPERIMENT_STATE_UPDATE,
    EXPERIMENT_UNREGISTER,
    EXPERIMENT_REGISTRY_READ,
    EXPERIMENT_MODEL_READ
} from "./SQLiteExperimentQueries"; 
import Database = require("better-sqlite3");

export class LocalExperimentProvider implements IExperimentProvider 
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
     * Create a new experiment.
     * @param experiment experiment object.
     */
    public async create(experiment: Experiment) 
    {
        this._databaseClient.prepare(EXPERIMENT_CREATE).run({
            workspace_id: experiment.workspaceId,
            version: experiment.version,
            runtime: experiment.runtime,
            framework: experiment.framework,
            description: experiment.description,
            parameters: JSON.stringify(experiment.parameters),
            metrics: JSON.stringify(experiment.metrics),
            model: experiment.model,
            state: experiment.state,
            created_by: experiment.createdBy,
            created_at: Math.floor(experiment.createdAt.getTime()/1000)
        });
        return experiment.version;
    }

    public async initialize() 
    {
        this._databaseClient.exec(EXPERIMENTS_INITIALIZATION);
        this._databaseClient.exec(EXPERIMENTS_CREATE_STATE_INDEX);
    }

    /**
     * List experiments for a given workspace.
     * @param workspaceId Workspace id.
     */
    public async list(workspaceId: string) 
    {
        return this._databaseClient.prepare(EXPERIMENTS_LIST).all({workspace_id: workspaceId});
    }

    /**
     * Retrieve an experiment with the given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async read(workspaceId: string, version: number) 
    {
        return this._databaseClient.prepare(EXPERIMENT_READ).get({workspace_id: workspaceId, version: version});
    }

    /**
     * Delete the model version.
     * @param workspace Workspace id.
     * @param version version number.
     */
    public async delete(workspaceId: string, version: number) 
    {
        return this._databaseClient.prepare(EXPERIMENT_DELETE).run({workspaceId: workspaceId, version: version});
    }

    /**
     * Retrieve the model.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     * @returns Model path.
     */
    public async loadModel(workspaceId: string, version: number) 
    {
        return this._databaseClient.prepare(EXPERIMENT_MODEL_READ).get({workspace_id: workspaceId, version: version});
    }

    /**
     * Register an experiment version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async register(workspaceId: string, version: number) 
    {
        this._databaseClient.transaction((workspaceId: string, version: number) => {
            this._databaseClient.prepare(EXPERIMENT_UNREGISTER).run({workspace_id: workspaceId});
            this._databaseClient.prepare(EXPERIMENT_STATE_UPDATE).run({workspace_id: workspaceId, version: version, state: ExperimentState.REGISTERED});
        })(workspaceId, version);
    }

    /**
     * Unregister an experiment version.
     * @param workspaceId Workspace id.
     */
    public async unregister(workspaceId: string) 
    {
        this._databaseClient.prepare(EXPERIMENT_UNREGISTER).run({workspace_id: workspaceId});
    }

    /**
     * Returns an registered experiment.
     * @param workspaceId Workspace id.
     */
    public async getRegistry(workspaceId: string) 
    {
        return this._databaseClient.prepare(EXPERIMENT_REGISTRY_READ).get({workspace_id: workspaceId});
    }
}