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
export const INSTANCES_LIST = `SELECT name, type, state FROM instances WHERE created_by=$1;`
/**
* Query to read instance given username.
*/
export const INSTANCES_READ = `SELECT name, state, runtime, cpus, memory, packages FROM instances WHERE name=$1 AND created_by=$2;`
/**
* Query to update instance state.
*/
export const INSTANCE_STATE_UPSERT = `
    INSERT INTO instances (name, created_by, type, state, runtime, cpus, memory, packages, last_updated_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (name, created_by) DO UPDATE 
        SET name = $1,
            created_by = $2,
            type = instances.type,
            state = $4,
            runtime = instances.runtime, 
            cpus = instances.cpus,
            memory = instances.memory,
            packages = instances.packages,
            last_updated_at = $9;`;