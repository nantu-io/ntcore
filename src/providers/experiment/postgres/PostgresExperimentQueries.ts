/**
 * Query to insert the new workspace.
 */
 export const EXPERIMENT_CREATE = `
    INSERT INTO experiments (workspace_id, version, runtime, framework, description, parameters, metrics, model, state, created_by, created_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`
/**
* Query to create the workspace table.
*/
export const EXPERIMENTS_INITIALIZATION = `
    CREATE TABLE IF NOT EXISTS experiments (
        workspace_id  TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
        version       TEXT NOT NULL,
        runtime       TEXT,
        framework     TEXT,
        description   TEXT,
        parameters    TEXT,
        metrics       TEXT,
        model         BYTEA,
        state         TEXT,
        created_by    TEXT,
        created_at    INTEGER,
        PRIMARY KEY(workspace_id, version)
);`
/**
* Queyr to create index on state;
*/
export const EXPERIMENTS_CREATE_STATE_INDEX = `CREATE INDEX IF NOT EXISTS state_index ON experiments(state)`;
/**
* Query to read experiment given workspace id and version.
*/
export const EXPERIMENTS_LIST = `SELECT workspace_id, version, runtime, framework, description, parameters, metrics, created_by, created_at FROM experiments WHERE workspace_id=$1 ORDER BY created_at DESC;`
/**
* Query to read experiment given workspace id and version.
*/
export const EXPERIMENT_READ = `SELECT workspace_id, version, runtime, framework, description, parameters, metrics, model, created_by, created_at FROM experiments WHERE workspace_id=$1 AND version=$2;`
/**
* Query to read experiment given workspace id and version.
*/
export const EXPERIMENT_MODEL_READ = `SELECT model FROM experiments WHERE workspace_id=$1 AND version=$2;`
/**
* Query to delete an experiment version given the workspace id and version number.
*/
export const EXPERIMENT_DELETE = `DELETE FROM experiments WHERE workspace_id=$1 AND version=$2;`;
/**
* Query to register an experiment. 
*/
export const EXPERIMENT_STATE_UPDATE = `UPDATE experiments SET state = $3 WHERE workspace_id = $1 AND version = $2;`;
/**
* Query to unregister experiments in a workspace.
*/
export const EXPERIMENT_DEREGISTER = `UPDATE experiments SET state = 'UNREGISTERED' WHERE workspace_id = $1 AND version = $2;`
/**
* Query to return the registered model in a workspace.
*/
export const EXPERIMENT_REGISTRY_READ = `SELECT workspace_id, version, runtime, framework, description, parameters, metrics, created_by, created_at FROM experiments WHERE workspace_id=$1 AND state='REGISTERED';`;