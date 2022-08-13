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
import { Pool } from 'pg';

export class PostgresExperimentProvider implements IExperimentProvider 
{
    private _pgPool: Pool;
    /**
     * Initialize the experiments table.
     */
    constructor(pool: Pool) 
    {
        this._pgPool = pool;
    }

    public async initialize() 
    {
        await this._pgPool.query(EXPERIMENTS_INITIALIZATION);
        await this._pgPool.query(EXPERIMENTS_CREATE_STATE_INDEX);
    }

    /**
     * Create a new experiment.
     * @param experiment experiment object.
     */
    public async create(experiment: Experiment): Promise<number>
    {
        this._pgPool.query(EXPERIMENT_CREATE, [
            experiment.workspaceId,
            experiment.version,
            experiment.runtime,
            experiment.framework,
            experiment.description,
            JSON.stringify(experiment.parameters),
            JSON.stringify(experiment.metrics),
            experiment.model,
            experiment.state,
            experiment.createdBy,
            experiment.createdAt
        ]);
        return experiment.version;
    }

    /**
     * List experiments for a given workspace.
     * @param workspaceId Workspace id.
     */
    public async list(workspaceId: string): Promise<Experiment[]>
    {
        return (await this._pgPool.query(EXPERIMENTS_LIST, [workspaceId]))?.rows?.map(item => ({
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
        const rows = (await this._pgPool.query(EXPERIMENT_READ, [workspaceId, version]))?.rows?.map(item => ({
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
        return rows && rows.length > 0 ? rows[0] : null;
    }

    /**
     * Delete the model version.
     * @param workspaceId Workspace id.
     * @param version version number.
     */
    public async delete(workspaceId: string, version: number): Promise<void>
    {
        await this._pgPool.query(EXPERIMENT_DELETE, [workspaceId, version]);
    }

    /**
     * Register an experiment version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async register(workspaceId: string, version: number): Promise<void>
    {
        const client = await this._pgPool.connect();
        try {
            await client.query('BEGIN');
            const registryRows = await this._pgPool.query(EXPERIMENT_REGISTRY_READ, [ workspaceId ]);
            if (registryRows.rows && registryRows.rows.length) {
                await client.query(EXPERIMENT_DEREGISTER, [ workspaceId, registryRows.rows[0].version ]);
            }
            await client.query(EXPERIMENT_STATE_UPDATE, [ workspaceId, version, "REGISTERED" ]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    /**
     * Unregister an experiment version.
     * @param workspaceId Workspace id.
     */
    public async deregister(workspaceId: string, version: number): Promise<void>
    {
        await this._pgPool.query(EXPERIMENT_DEREGISTER, [workspaceId, version]);
    }

    /**
     * Returns an registered experiment.
     * @param workspaceId Workspace id.
     */
    public async getRegistry(workspaceId: string): Promise<Experiment>
    {
        const rows = (await this._pgPool.query(EXPERIMENT_REGISTRY_READ, [ workspaceId ]))?.rows?.map(item => ({
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
        return rows && rows.length > 0 ? rows[0] : null;
    }
}