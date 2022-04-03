import { 
    IWorkspaceProvider,
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
} from './PostgresWorkspaceQueries';
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
        console.log('Initialized workspaces table.');
    }

    /**
     * Create a new workspace.
     */
    public async create(workspace: Workspace) 
    {
        const { id, name, type, createdBy, createdAt, maxVersion } = workspace;
        await this._pgPool.query(WORKSPACE_CREATE, [id, name, type, createdBy, Math.floor(createdAt.getTime()/1000), maxVersion]);
        return id;
    }

    /**
     * Update an existing workspace.
     */
    public async update(workspace: Workspace) 
    {
        const { id, name, type, createdBy, createdAt } = workspace;
        await this._pgPool.query(WORKSPACE_UPDATE, [name, type, createdBy, Math.floor(createdAt.getTime()/1000), id]);
        return workspace.id;
    }

    /**
     * Retrieve workspace based on the given id.
     */
    public async read(id: string) 
    {
        return await this._pgPool.query(WORKSPACE_READ, [id]).then(res => res.rows ? res.rows[0] : []);
    }

    /**
     * Retrieve a list of workspaces based on the given id.
     */
    public async list() 
    {
        return await this._pgPool.query(WORKSPACE_LIST).then(res => res.rows);
    }

    /**
     * Delete a workspace based on a given id.
     */
    public async delete(id: string) 
    {
        await this._pgPool.query(WORKSPACE_DELETE, [id]);
        return id;
    }

    /**
     * Increment the max revision of experiments in a given workspace.
     */
    public async incrementVersion(id: string) 
    {
        return await this._pgPool.query(MAX_VERSION_INCREMENT, [id]).then(res => res?.rows[0]?.max_version ?? 0);
    }
}
