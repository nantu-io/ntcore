import { GenericWorkspaceProvider,Workspace } from '../GenericWorkspaceProvider';
import {
    WORKPACE_INITIALIZATION,
    WORKSPACE_CREATE,
    WORKSPACE_UPDATE,
    WORKSPACE_READ,
    WORKSPACE_LIST,
    WORKSPACE_DELETE,
    MAX_VERSION_INCREMENT,
} from './LocalWorkspaceQueries';
import Database = require("better-sqlite3");
import fs = require('fs');

export class LocalWorkspaceProvider implements GenericWorkspaceProvider {
    private _databaseClient: Database.Database
    /**
     * Create the database locally.
     */
    constructor(databaseClient: Database.Database) {
        this._databaseClient = databaseClient;
        this.createWorkspaceTableIfNotExists();
    }
    /**
     * Create a new workspace.
     * @param workspace Workspace object.
     */
    public async create(workspace: Workspace) {
        this._databaseClient.prepare(WORKSPACE_CREATE).run({
            id: workspace.id,
            name: workspace.name,
            type: workspace.type,
            created_by: workspace.createdBy,
            created_at: Math.floor(workspace.createdAt.getTime()/1000),
            max_version: workspace.maxVersion
        });
        return workspace.id;
    }
    /**
     * Update the workspace
     * @param workspace Workspace object.
     */
    public async update(workspace: Workspace) {
        this._databaseClient.prepare(WORKSPACE_UPDATE).run({
            id: workspace.id,
            name: workspace.name,
            type: workspace.type,
            created_by: workspace.createdBy,
            created_at: Math.floor(workspace.createdAt.getTime()/1000)
        });
        return workspace.id;
    }
    /**
     * Retrieve the workspace.
     * @param id workspace id.
     */
    public async read(id: string) {
        return this._databaseClient.prepare(WORKSPACE_READ).get({ workspaceId: id });
    }
    /**
     * Lists all workspaces.
     */
    public async list() {
        return this._databaseClient.prepare(WORKSPACE_LIST).all();
    }
    /**
     * Delete the workspace.
     * @param workspace Workspace id.
     */
    public async delete(id: string) {
        await new Promise((resolve) => fs.rmdir(`data/blob/${id}`, { recursive: true }, resolve));
        return this._databaseClient.prepare(WORKSPACE_DELETE).run({id: id});
    }

    /**
     * Increment and return the max version of experiment for a given workspace.
     * @param workspace Workspace id.
     */
    public async incrementVersion(id: string) {
        return this._databaseClient.transaction((workspaceId: string) => {
            this._databaseClient.prepare(MAX_VERSION_INCREMENT).run({workspaceId: workspaceId});
            const workspace = this._databaseClient.prepare(WORKSPACE_READ).get({ workspaceId: workspaceId });
            return (workspace && workspace.max_version) ? workspace.max_version : 0;
        })(id);
    }
    
    private createWorkspaceTableIfNotExists() {
        this._databaseClient.exec(WORKPACE_INITIALIZATION);
    }
}