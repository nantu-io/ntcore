import { 
    GenericWorkspaceProvider,
    Workspace
} from '../GenericWorkspaceProvider';
import {
    WORKPACE_INITIALIZATION,
    WORKSPACE_CREATE,
    WORKSPACE_UPDATE,
    WORKSPACE_READ,
    WORKSPACE_LIST,
    WORKSPACE_DELETE,
    MAX_VERSION_INCREMENT,
} from './LocalWorkspaceQueries';
import { database } from "../../../commons/ClientConfig";
import fs = require('fs');

export class LocalWorkspaceProvider implements GenericWorkspaceProvider {
    /**
     * Create the database locally.
     */
    constructor() {
        this.createWorkspaceTableIfNotExists();
    }
    /**
     * Create a new workspace.
     * @param workspace Workspace object.
     */
    public async create(workspace: Workspace) {
        await database.prepare(WORKSPACE_CREATE).run({
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
        await database.prepare(WORKSPACE_UPDATE).run({
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
        return await database.prepare(WORKSPACE_READ).get({ workspaceId: id });
    }
    /**
     * Lists all workspaces.
     */
    public async list() {
        return await database.prepare(WORKSPACE_LIST).all();
    }
    /**
     * Delete the workspace.
     * @param workspace Workspace id.
     */
    public async delete(id: string) {
        await new Promise((resolve) => fs.rmdir(`data/blob/${id}`, { recursive: true }, resolve));
        return await database.prepare(WORKSPACE_DELETE).run({id: id});
    }

    /**
     * Increment and return the max version of experiment for a given workspace.
     * @param workspace Workspace id.
     */
    public async incrementVersion(id: string) {
        return await database.transaction((workspaceId: string) => {
            database.prepare(MAX_VERSION_INCREMENT).run({workspaceId: workspaceId});
            const workspace = database.prepare(WORKSPACE_READ).get({ workspaceId: workspaceId });
            return (workspace && workspace.max_version) ? workspace.max_version : 0;
        })(id);
    }
    
    private createWorkspaceTableIfNotExists() {
        database.exec(WORKPACE_INITIALIZATION);
    }
}