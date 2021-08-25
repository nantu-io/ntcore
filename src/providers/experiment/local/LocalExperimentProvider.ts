import { Experiment, GenericExperimentProvider } from "../GenericExperimentProvider";
import {
    EXPERIMENTS_INITIALIZATION,
    EXPERIMENTS_LIST,
    EXPERIMENT_CREATE,
    EXPERIMENT_READ,
    EXPERIMENT_DELETE,
    EXPERIMENTS_CREATE_IS_REGISTERED_INDEX,
    EXPERIMENT_REGISTER,
    EXPERIMENT_UNREGISTER,
    EXPERIMENT_REGISTRY_READ
} from "./LocalExperimentQueries"; 
import Database = require("better-sqlite3");
import mkdirp = require('mkdirp');
import fs = require('fs');

export class LocalExperimentProvider implements GenericExperimentProvider {
    private _databaseClient: Database.Database;
    /**
     * Initialize the experiments table.
     */
    constructor(databaseClient: Database.Database) {
        this._databaseClient = databaseClient;
        this.createExperimentsTableIfNotExists();
    }
    /**
     * Create a new experiment.
     * @param experiment experiment object.
     */
    public async create(experiment: Experiment) {
        this._databaseClient.prepare(EXPERIMENT_CREATE).run({
            workspace_id: experiment.workspaceId,
            version: experiment.version,
            runtime: experiment.runtime,
            framework: experiment.framework,
            description: experiment.description,
            parameters: JSON.stringify(experiment.parameters),
            metrics: JSON.stringify(experiment.metrics),
            created_by: experiment.createdBy,
            created_at: Math.floor(experiment.createdAt.getTime()/1000)
        });
        return experiment.version;
    }

    /**
     * List experiments for a given workspace.
     * @param workspaceId Workspace id.
     */
    public async list(workspaceId: string) {
        return this._databaseClient.prepare(EXPERIMENTS_LIST).all({workspace_id: workspaceId});
    }

    /**
     * Retrieve an experiment with the given workspaceId and version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async read(workspaceId: string, version: number) {
        return this._databaseClient.prepare(EXPERIMENT_READ).get({workspace_id: workspaceId, version: version});
    }

    /**
     * Delete the model version.
     * @param workspace Workspace id.
     * @param version version number.
     */
     public async delete(workspaceId: string, version: number) {
        return this._databaseClient.prepare(EXPERIMENT_DELETE).run({workspaceId: workspaceId, version: version});
    }

    /**
     * Save the serialized model from an experiment.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     * @param base64 Base64 encoded model.
     * @returns 
     */
    public async saveModel(workspaceId: string, version: number, base64: string) {
        const modelDirectory = `data/blob/${workspaceId}/${version}`;
        const modelPath = `${modelDirectory}/model.pkl`;
        const modelBlob = Buffer.from(base64, 'base64');
        await mkdirp(modelDirectory);
        return await new Promise((resolve) => { fs.writeFile(modelPath, modelBlob, resolve); });
    }

    /**
     * Retrieve the model.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     * @returns Model path.
     */
    public async loadModel(workspaceId: string, version: number) {
        return `data/blob/${workspaceId}/${version}/model.pkl`;
    }

    /**
     * Delete the model.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async deleteModel(workspaceId: string, version: number) {
        await new Promise((resolve) => fs.rmdir(`data/blob/${workspaceId}/${version}`, { recursive: true }, resolve));
    }

    /**
     * Register an experiment version.
     * @param workspaceId Workspace id.
     * @param version Experiment version.
     */
    public async register(workspaceId: string, version: number) {
        this._databaseClient.transaction((workspaceId: string, version: number) => {
            this._databaseClient.prepare(EXPERIMENT_UNREGISTER).run({workspace_id: workspaceId});
            this._databaseClient.prepare(EXPERIMENT_REGISTER).run({workspace_id: workspaceId, version: version});
        })(workspaceId, version);
    }

    /**
     * Unregister an experiment version.
     * @param workspaceId Workspace id.
     */
    public async unregister(workspaceId: string) {
        this._databaseClient.prepare(EXPERIMENT_UNREGISTER).run({workspace_id: workspaceId});
    }

    /**
     * Returns an registered experiment.
     * @param workspaceId Workspace id.
     */
    public async getRegistry(workspaceId: string) {
        return this._databaseClient.prepare(EXPERIMENT_REGISTRY_READ).get({workspace_id: workspaceId});
    }
    
    private createExperimentsTableIfNotExists() {
        this._databaseClient.exec(EXPERIMENTS_INITIALIZATION);
        this._databaseClient.exec(EXPERIMENTS_CREATE_IS_REGISTERED_INDEX);
    }
}