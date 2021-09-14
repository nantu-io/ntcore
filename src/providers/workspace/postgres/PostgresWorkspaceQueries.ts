/**
 * Query to verify if the workspaces table exists.
 */
export const WORKSPACE_EXISTENCE = `SELECT name FROM sqlite_master WHERE type='table' and name='workspaces';`
 /**
  * Query to insert the new workspace.
  */
export const WORKSPACE_CREATE = `INSERT INTO workspaces (id, name, type, created_by, created_at, max_version) VALUES ($1, $2, $3, $4, $5, $6)`
 /**
  * Query to update workspace with the given id.
  */
export const WORKSPACE_UPDATE = `UPDATE workspaces SET name=$1, type=$2, created_by=$3, created_at=$4) WHERE id=$5`
 /**
  * Query to retrieve workspace with the given id.
  */
export const WORKSPACE_READ = `SELECT id, name, type, created_by, created_at, max_version FROM workspaces WHERE id=$1`
 /**
  * Query to retrieve workspace with the given id.
  */
export const WORKSPACE_LIST = `SELECT id, name, type, created_by, created_at, max_version FROM workspaces`
 /**
  * Query to delete workspace with the given id.
  */
export const WORKSPACE_DELETE = `DELETE FROM workspaces WHERE id=$1;`
 /**
  * Query to increment the max version;
  */
export const MAX_VERSION_INCREMENT = `
    UPDATE workspaces
    SET max_version = max_version + 1
    WHERE id = $1
    RETURNING max_version;
`;
 /**
  * Query to create the workspace table.
  */
export const WORKPACE_INITIALIZATION = `
    CREATE TABLE IF NOT EXISTS workspaces (
        id         TEXT PRIMARY KEY,
        name       TEXT,
        type       TEXT,
        created_by TEXT,
        created_at INTEGER,
        max_version INTEGER
    );
`;
