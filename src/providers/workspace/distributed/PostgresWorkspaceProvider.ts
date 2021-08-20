import { 
    GenericWorkspaceProvider,
    Workspace
} from '../GenericWorkspaceProvider';

const pgAdaptor = require('../../../database/postgresAdaptor');

export class PostgresWorkspaceProvider implements GenericWorkspaceProvider {

    constructor() {
        this.initialzeWorkspaceTableIfNotExists();
    }

    public async create(workspace: Workspace) {
        const { id, name, type, createdBy, createdAt, maxVersion } = workspace;
        const query = `INSERT INTO workspaces(id, name, type, created_by, created_at, max_version) 
                        VALUES ('${id}', '${name}', '${type}', '${createdBy}', ${Math.floor(createdAt.getTime()/1000)}, ${maxVersion})`;
        await pgAdaptor.executeQuery(query);
        return id;
    }

    public async update(workspace: Workspace) {
        const { id, name, type, createdBy, createdAt } = workspace;
        const query = `UPDATE workspaces SET name='${name}', type='${type}', created_by=${createdBy}, created_at=${Math.floor(createdAt.getTime()/1000)}) WHERE id='${id}'`;
        await pgAdaptor.executeQuery(query);
        return workspace.id;
    }

    public async read(id: string) {
        const query = `SELECT id, name, type, created_by, created_at, max_version FROM workspaces WHERE id='${id}'`;
        return await pgAdaptor.executeQuery(query).then(res => res.rows[0]);
    }

    public async list() {
        const query = `SELECT id, name, type, created_by, created_at, max_version FROM workspaces`;
        return await pgAdaptor.executeQuery(query).then(res => res.rows);
    }

    public async delete(id: string) {
        const query = `DELETE FROM workspaces WHERE id='${id}';`;
        await pgAdaptor.executeQuery(query);
        return id;
    }

    public async incrementVersion(id: string) {
        const query = `
                        UPDATE workspaces
                        SET max_version = max_version + 1
                        WHERE id = '${id}'
                    `;
        return await pgAdaptor.executeQuery(query);
    }

    private async initialzeWorkspaceTableIfNotExists() {
        return await pgAdaptor.executeQuery(`
            CREATE TABLE IF NOT EXISTS workspaces (
                id         TEXT PRIMARY KEY,
                name       TEXT,
                type       TEXT,
                created_by TEXT,
                created_at INTEGER,
                max_version INTEGER
            );
        `);
    }

}