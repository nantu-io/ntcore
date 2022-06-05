import { IWorkspaceProvider,Workspace } from '../WorkspaceProvider';
import {
    WORKPACE_INITIALIZATION,
    WORKSPACE_CREATE,
    WORKSPACE_UPDATE,
    WORKSPACE_READ,
    WORKSPACE_LIST,
    WORKSPACE_DELETE,
    MAX_VERSION_INCREMENT,
} from './SQLiteWorkspaceQueries';
import Database = require("better-sqlite3");

export class SQLiteWorkspaceProvider implements IWorkspaceProvider 
{
    private _databaseClient: Database.Database
    /**
     * Create the database locally.
     */
    constructor(databaseClient: Database.Database) 
    {
        this._databaseClient = databaseClient;
    }

    public async initialize()
    {
        this._databaseClient.exec(WORKPACE_INITIALIZATION);
    }
    /**
     * Create a new workspace.
     * @param workspace Workspace object.
     */
    public async create(workspace: Workspace): Promise<string>
    {
        this._databaseClient.prepare(WORKSPACE_CREATE).run({
            id: workspace.id,
            name: workspace.name,
            type: workspace.type,
            created_by: workspace.createdBy,
            created_at: workspace.createdAt,
            max_version: workspace.maxVersion
        });
        return workspace.id;
    }
    /**
     * Update the workspace
     * @param workspace Workspace object.
     */
    public async update(workspace: Workspace): Promise<string>
    {
        this._databaseClient.prepare(WORKSPACE_UPDATE).run({
            id: workspace.id,
            name: workspace.name,
            type: workspace.type,
            created_by: workspace.createdBy,
            created_at: workspace.createdAt
        });
        return workspace.id;
    }
    /**
     * Retrieve the workspace.
     * @param id workspace id.
     */
    public async read(id: string): Promise<Workspace> 
    {
        const row = this._databaseClient.prepare(WORKSPACE_READ).get({ workspaceId: id });
        return {
            id: row.id, 
            name: row.name, 
            type: row.type, 
            createdBy: row.created_by, 
            createdAt: row.created_at, 
            maxVersion: row.max_version
        };
    }
    /**
     * Lists all workspaces.
     */
    public async list(username: string): Promise<Workspace[]>
    {
        return this._databaseClient.prepare(WORKSPACE_LIST).all({ createdBy: username }).map(row => 
        ({
            id: row.id,
            name: row.name, 
            type: row.type,
            createdBy: row.created_by,
            createdAt: row.created_at, 
            maxVersion: row.max_version
        }));
    }
    /**
     * Delete the workspace.
     * @param id Workspace id.
     */
    public async delete(id: string): Promise<void>
    {
        this._databaseClient.prepare(WORKSPACE_DELETE).run({id: id});
    }

    /**
     * Increment and return the max version of experiment for a given workspace.
     * @param id Workspace id.
     */
    public async incrementVersion(id: string): Promise<number>
    {
        return this._databaseClient.transaction((workspaceId: string) => {
            this._databaseClient.prepare(MAX_VERSION_INCREMENT).run({workspaceId: workspaceId});
            const workspace = this._databaseClient.prepare(WORKSPACE_READ).get({ workspaceId: workspaceId });
            return (workspace && workspace.max_version) ? workspace.max_version : 0;
        })(id);
    }
}