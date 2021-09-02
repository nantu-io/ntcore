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
} from './PostgresWorkspaceQueries';
import { Pool } from 'pg';

export class PostgresWorkspaceProvider implements GenericWorkspaceProvider {

    private _pgPool: Pool;
    
    constructor(pool: Pool) {
        this._pgPool = pool;
        this.createWorkspaceTableIfNotExists();
    }

    public async create(workspace: Workspace) {
        const { id, name, type, createdBy, createdAt, maxVersion } = workspace;
        await this._pgPool.query(WORKSPACE_CREATE, [id, name, type, createdBy, Math.floor(createdAt.getTime()/1000), maxVersion]);
        return id;
    }

    public async update(workspace: Workspace) {
        const { id, name, type, createdBy, createdAt } = workspace;
        await this._pgPool.query(WORKSPACE_UPDATE, [name, type, createdBy, Math.floor(createdAt.getTime()/1000), id]);
        return workspace.id;
    }

    public async read(id: string) {
        return await this._pgPool.query(WORKSPACE_READ, [id]).then(res => res.rows ? res.rows[0] : []);
    }

    public async list() {
        return await this._pgPool.query(WORKSPACE_LIST).then(res => res.rows);
    }

    public async delete(id: string) {
        await this._pgPool.query(WORKSPACE_DELETE, [id]);
        return id;
    }

    public async incrementVersion(id: string) {
        return await this._pgPool.query(MAX_VERSION_INCREMENT, [id]).then(res => res?.rows[0]?.max_version ?? 0);
    }

    private async createWorkspaceTableIfNotExists() {
        return await this._pgPool.query(WORKPACE_INITIALIZATION);
    }
}
