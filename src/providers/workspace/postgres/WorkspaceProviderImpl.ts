import { IWorkspaceProvider,Workspace } from '../WorkspaceProvider';
import {
    WORKPACE_INITIALIZATION,
    WORKSPACE_CREATE,
    WORKSPACE_UPDATE,
    WORKSPACE_READ,
    WORKSPACE_LIST,
    WORKSPACE_DELETE,
    MAX_VERSION_INCREMENT,
} from './WorkspaceQueries';
import { Pool } from 'pg';

export class PostgresWorkspaceProvider implements IWorkspaceProvider 
{
    private _pgPool: Pool;
    
    constructor(pool: Pool) 
    {
        this._pgPool = pool;
    }

    /**
     * Initialize the workspaces table.
     */
    public async initialize() 
    {
        await this._pgPool.query(WORKPACE_INITIALIZATION);
    }

    /**
     * Create a new workspace.
     */
    public async create(workspace: Workspace): Promise<string>
    {
        const { id, name, type, createdBy, createdAt, maxVersion } = workspace;
        await this._pgPool.query(WORKSPACE_CREATE, [id, name, type, createdBy, createdAt, maxVersion]);
        return workspace.id;
    }

    /**
     * Update an existing workspace.
     */
    public async update(workspace: Workspace): Promise<string>
    {
        const { id, name, type, createdBy, createdAt } = workspace;
        await this._pgPool.query(WORKSPACE_UPDATE, [name, type, createdBy, createdAt, id]);
        return workspace.id;
    }

    /**
     * Retrieve workspace based on the given id.
     */
    public async read(id: string): Promise<Workspace>
    {
        const workspaces = (await this._pgPool.query(WORKSPACE_READ, [id])).rows.map(row => 
        ({
            id: row.id,
            name: row.name, 
            type: row.type,
            createdBy: row.created_by,
            createdAt: row.created_at, 
            maxVersion: row.max_version
        }));
        return (workspaces && workspaces.length > 0) ? workspaces[0] : null;
    }

    /**
     * Retrieve a list of workspaces based on the given id.
     */
    public async list(username: string): Promise<Workspace[]>
    {
        return (await this._pgPool.query(WORKSPACE_LIST, [username])).rows.map(row => 
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
     * Delete a workspace based on a given id.
     */
    public async delete(id: string): Promise<void>
    {
        await this._pgPool.query(WORKSPACE_DELETE, [id]);
    }

    /**
     * Increment the max revision of experiments in a given workspace.
     */
    public async incrementVersion(id: string): Promise<number>
    {
        return await this._pgPool.query(MAX_VERSION_INCREMENT, [id]).then(res => res?.rows[0]?.max_version ?? 0);
    }
}
