/**
 * Query to verify if the workspaces table exists.
 */
export const EXPERIMENTS_EXISTENCE = `SELECT name FROM sqlite_master WHERE type='table' and name='experiments';`
/**
 * Query to insert the new workspace.
 */
export const EXPERIMENT_CREATE = `
    INSERT INTO experiments (workspace_id, version, runtime, framework, description, parameters, metrics, created_by, created_at) 
    VALUES ($workspace_id, $version, $runtime, $framework, $description, $parameters, $metrics, $created_by, $created_at);`
/**
 * Query to create the workspace table.
 */
export const EXPERIMENTS_INITIALIZATION = `
    CREATE TABLE IF NOT EXISTS experiments (
        workspace_id TEXT NOT NULL,
        version      TEXT NOT NULL,
        runtime      TEXT,
        framework    TEXT,
        description  TEXT,
        parameters   TEXT,
        metrics      TEXT,
        created_by   TEXT,
        created_at   INTEGER,
        PRIMARY KEY(workspace_id, version),
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE ON UPDATE NO ACTION
    );`
/**
 * Query to read experiment given workspace id and version.
 */
export const EXPERIMENTS_LIST = `SELECT workspace_id, version, runtime, framework, description, parameters, metrics, created_by, created_at FROM experiments WHERE workspace_id=$workspace_id ORDER BY created_at DESC;`
/**
 * Query to read experiment given workspace id and version.
 */
export const EXPERIMENT_READ = `SELECT workspace_id, version, runtime, framework, description, parameters, metrics, created_by, created_at FROM experiments WHERE workspace_id=$workspace_id AND version=$version;`
/**
 * Query to update experiment state given workspace id and version.
 */
export const EXPERIMENT_STATE_UPDATE = `UPDATE experiments SET state = $state WHERE workspace_id = $workspace_id AND version = $version;`;
/**
 * Query to update experiment state given workspace id and version.
 */
export const EXPERIMENTS_STATE_BATCH_UPDATE = `UPDATE experiments SET state = $state WHERE workspace_id = $workspace_id`;
/**
 * Query to delete an experiment version given the workspace id and version number.
 */
export const EXPERIMENT_DELETE = `DELETE FROM experiments WHERE workspace_id=$workspaceId AND version=$version;`;