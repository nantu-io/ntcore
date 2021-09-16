import { Experiment, ExperimentState, GenericExperimentProvider } from "../GenericExperimentProvider";
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
} from "./PostgresExperimentQueries"; 
import { Pool } from 'pg';

export class PostgresExperimentProvider implements GenericExperimentProvider {
    private _pgPool: Pool;
    /**
     * Initialize the experiments table.
     */
    constructor(pool: Pool) {
        this._pgPool = pool;
    }

    public async initialize() {
        await this._pgPool.query(EXPERIMENTS_INITIALIZATION);
        await this._pgPool.query(EXPERIMENTS_CREATE_STATE_INDEX);
        console.log('Initialized experiments table.');
    }

    /**
     * Create a new experiment.
     * @param experiment experiment object.
     */
    public async create(experiment: Experiment) {
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
            Math.floor(experiment.createdAt.getTime()/1000)
        ]);
        return experiment.version;
    }

    /**
     * List experiments for a given workspace.
     * @param workspaceId Workspace id.
     */
    public async list(workspaceId: string) {
        return await this._pgPool.query(EXPERIMENTS_LIST, [ workspaceId ]).then(res => res.rows ? res.rows : []);
    }

    /**
     * Retrieve an experiment with the given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async read(workspaceId: string, version: number) {
        return await this._pgPool.query(EXPERIMENT_READ, [workspaceId, version]).then(res => res.rows ? res.rows[0] : null);
    }

    /**
     * Delete the model version.
     * @param workspace Workspace id.
     * @param version version number.
     */
     public async delete(workspaceId: string, version: number) {
        await this._pgPool.query(EXPERIMENT_DELETE, [workspaceId, version]);
    }

    /**
     * Retrieve the model.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     * @returns Model path.
     */
    public async loadModel(workspaceId: string, version: number) {
        return await this._pgPool.query(EXPERIMENT_MODEL_READ, [workspaceId, version]).then(res => res.rows ? res.rows[0] : null);
    }

    /**
     * Register an experiment version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async register(workspaceId: string, version: number) {
        const client = await this._pgPool.connect();
        try {
            await client.query('BEGIN');
            await client.query(EXPERIMENT_UNREGISTER, [ workspaceId ]);
            await client.query(EXPERIMENT_STATE_UPDATE, [ workspaceId, version, ExperimentState.REGISTERED ]);
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
    public async unregister(workspaceId: string) {
        await this._pgPool.query(EXPERIMENT_UNREGISTER, [workspaceId]);
    }

    /**
     * Returns an registered experiment.
     * @param workspaceId Workspace id.
     */
    public async getRegistry(workspaceId: string) {
        return await this._pgPool.query(EXPERIMENT_REGISTRY_READ, [ workspaceId ]).then(res => res.rows ? res.rows[0] : null);
    }
}