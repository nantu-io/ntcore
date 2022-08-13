import { Experiment, ExperimentState, IExperimentProvider } from "../ExperimentProvider";
import {
    EXPERIMENTS_INITIALIZATION,
    EXPERIMENTS_LIST,
    EXPERIMENT_CREATE,
    EXPERIMENT_READ,
    EXPERIMENT_DELETE,
    EXPERIMENTS_CREATE_STATE_INDEX,
    EXPERIMENT_STATE_UPDATE,
    EXPERIMENT_DEREGISTER,
    EXPERIMENT_REGISTRY_READ
} from "./ExperimentQueries";
import { Framework } from "../../../commons/Framework";
import { Runtime } from "../../../commons/Runtime";
import Database = require("better-sqlite3");

export class SQLiteExperimentProvider implements IExperimentProvider 
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
            created_at: experiment.createdAt
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
    public async list(workspaceId: string): Promise<Experiment[]>
    {
        return (this._databaseClient.prepare(EXPERIMENTS_LIST).all({workspace_id: workspaceId}))?.map(item => ({
            workspaceId : workspaceId,
            version     : parseInt(item.version),
            runtime     : item.runtime as Runtime,
            framework   : item.framework as Framework,
            description : item.description,
            parameters  : item.parameters,
            metrics     : item.metrics,
            state       : item.state as ExperimentState,
            createdBy   : item.created_by,
            createdAt   : Number(item.created_at),
        }));
    }

    /**
     * Retrieve an experiment with the given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async read(workspaceId: string, version: number): Promise<Experiment>
    {
        const item = this._databaseClient.prepare(EXPERIMENT_READ).get({workspace_id: workspaceId, version: version});
        if (!item) return null; 
        return {
            workspaceId : workspaceId,
            version     : parseInt(item.version),
            runtime     : item.runtime as Runtime,
            framework   : item.framework as Framework,
            description : item.description,
            parameters  : item.parameters,
            metrics     : item.metrics,
            state       : item.state as ExperimentState,
            createdBy   : item.created_by,
            createdAt   : Number(item.created_at)
        };
    }

    /**
     * Delete the model version.
     * @param workspaceId Workspace id.
     * @param version version number.
     */
    public async delete(workspaceId: string, version: number): Promise<void>
    {
        this._databaseClient.prepare(EXPERIMENT_DELETE).run({workspaceId: workspaceId, version: version});
    }

    /**
     * Register an experiment version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async register(workspaceId: string, version: number): Promise<void>
    {
        this._databaseClient.transaction((workspaceId: string, version: number) => {
            const registry = this._databaseClient.prepare(EXPERIMENT_REGISTRY_READ).get({workspace_id: workspaceId});
            if (registry) this._databaseClient.prepare(EXPERIMENT_DEREGISTER).run({workspace_id: workspaceId, version: registry.version});
            this._databaseClient.prepare(EXPERIMENT_STATE_UPDATE).run({workspace_id: workspaceId, version: version, state: "REGISTERED"});
        })
        (workspaceId, version);
    }

    /**
     * Deregister an experiment version.
     * @param workspaceId Workspace id.
     */
    public async deregister(workspaceId: string, version: number): Promise<void>
    {
        this._databaseClient.prepare(EXPERIMENT_DEREGISTER).run({workspace_id: workspaceId, version: version});
    }

    /**
     * Returns an registered experiment.
     * @param workspaceId Workspace id.
     */
    public async getRegistry(workspaceId: string): Promise<Experiment>
    {
        const item = this._databaseClient.prepare(EXPERIMENT_REGISTRY_READ).get({workspace_id: workspaceId});
        if (!item) return null; 
        return {
            workspaceId : workspaceId,
            version     : parseInt(item.version),
            runtime     : item.runtime as Runtime,
            framework   : item.framework as Framework,
            description : item.description,
            parameters  : item.parameters,
            metrics     : item.metrics,
            state       : item.state as ExperimentState,
            createdBy   : item.created_by,
            createdAt   : Number(item.created_at),
        };
    }
}