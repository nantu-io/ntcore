/**
 * Query to create the workspace table.
 */
export const INSTANCES_INITIALIZATION = `
    CREATE TABLE IF NOT EXISTS instances (
        name             TEXT NOT NULL,
        created_by       TEXT NOT NULL,
        type             TEXT,
        state            TEXT,
        runtime          TEXT,
        cpus             TEXT,
        memory           TEXT,
        packages         TEXT,
        last_updated_at  INTEGER,
        PRIMARY KEY(name, created_by)
    );`
/**
 * Query to read instance given username.
 */
export const INSTANCES_LIST = `SELECT name, type, state FROM instances WHERE created_by=$createdBy;`
/**
 * Query to read instance given username.
 */
export const INSTANCES_READ = `SELECT name, state, runtime, cpus, memory, packages FROM instances WHERE name=$name AND created_by=$createdBy;`
/**
 * Query to update instance state.
 */
 export const INSTANCE_STATE_UPSERT = `
    INSERT OR REPLACE INTO instances (name, state, type, runtime, cpus, memory, packages, created_by, last_updated_at) 
    VALUES (
        $name, 
        $state, 
        $type, 
        COALESCE($runtime, (SELECT runtime FROM instances WHERE name=$name AND created_by=$createdBy)), 
        COALESCE($cpus, (SELECT cpus FROM instances WHERE name=$name AND created_by=$createdBy)), 
        COALESCE($memory, (SELECT memory FROM instances WHERE name=$name AND created_by=$createdBy)), 
        COALESCE($packages, (SELECT packages FROM instances WHERE name=$name AND created_by=$createdBy)),
        $createdBy, 
        $lastUpdatedAt
    )
`;