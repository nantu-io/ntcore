/**
 * Query to insert the new workspace.
 */
export const DEPLOYMENT_CREATE = `
    INSERT INTO deployments (
        id,
        workspace_id, 
        version,
        status,
        created_by, 
        created_at
    ) VALUES (
        $id,
        $workspace_id, 
        $version, 
        $status, 
        $created_by, 
        $created_at
    );`
/**
 * Query to create the workspace table.
 */
export const DEPLOYMENTS_INITIALIZATION = `
    CREATE TABLE IF NOT EXISTS deployments (
        id             TEXT NOT NULL,
        workspace_id   TEXT NOT NULL,
        version        INTEGER,
        status         TEXT,
        created_by     TEXT,
        created_at     INTEGER,
        PRIMARY KEY(id, workspace_id),
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE ON UPDATE NO ACTION
    );`
/**
 * Query to create the deployment lock
 */
export const DEPLOYMENT_LOCK_INITIALIZATION = `
    CREATE TABLE IF NOT EXISTS deployment_locks (
        workspace_id   TEXT NOT NULL,
        version        INTEGER,
        created_by     TEXT,
        created_at     INTEGER,
        PRIMARY KEY(workspace_id),
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE ON UPDATE NO ACTION
    );`;
/**
 * Query to read experiment given workspace id and version.
 */
export const DEPLOYMENTS_LIST = `SELECT id, workspace_id, version, status, created_by, created_at FROM deployments WHERE workspace_id=$workspace_id ORDER BY created_at DESC;`
/**
 * Query to list all active deployments.
 */
export const DEPLOYMENTS_ACTIVE_LIST = `
    SELECT id, workspace_id, version, status, created_by, created_at
    FROM deployments
    WHERE status = 'RUNNING'
    ORDER BY created_at DESC;
;`
/**
 * Query to list all active deployments.
 */
export const DEPLOYMENT_ACTIVE_READ = `
    SELECT id, workspace_id, version, status, created_by, created_at
    FROM deployments
    WHERE workspace_id = $workspaceId AND status = 'RUNNING'
    ORDER BY created_at DESC;
;`
/**
 * Query to list all active deployments.
 */
export const DEPLOYMENT_LATEST_READ = `
    SELECT id, workspace_id, version, status, created_by, created_at
    FROM deployments
    WHERE workspace_id = $workspaceId
    ORDER BY created_at DESC
    LIMIT 1;
;`
/**
 * Query to read experiment given workspace id and version.
 */
export const DEPLOYMENT_READ = `SELECT id, workspace_id, version, status, created_by, created_at FROM deployments WHERE workspace_id=$workspace_id AND id=$id;`
/**
 * Query to insert the entry to deployment_locks table;
 */
export const DEPLOYMENT_LOCK_CREATE = `
    INSERT INTO deployment_locks (
        workspace_id, 
        version,
        created_by, 
        created_at
    ) VALUES (
        $workspace_id, 
        $version, 
        $created_by, 
        $created_at
    );`
/**
 * Query to update the status of a deployment;
 */
export const DEPLOYMENT_STATUS_UPDATE = `
    UPDATE deployments
    SET status = CASE
        WHEN id=$id THEN $status
        ELSE 'STOPPED' END
    WHERE workspace_id = $workspaceId AND (status = 'PENDING' OR status = 'RUNNING');
`;
/**
 * Query to upsert the status of a deployment;
 */
export const DEPLOYMENT_STATUS_UPSERT = `
INSERT OR REPLACE INTO deployments (id, workspace_id, version, status, created_by, created_at) 
VALUES (
    $id, 
    $workspaceId,
    (SELECT version FROM deployments WHERE workspace_id=$workspaceId AND id=$id), 
    $status,
    (SELECT created_by FROM deployments WHERE workspace_id=$workspaceId AND id=$id), 
    (SELECT created_at FROM deployments WHERE workspace_id=$workspaceId AND id=$id)
);
`;
/**
 * Query to delete the deployment lock.
 */
export const DEPLOYMENT_LOCK_DELETE = `DELETE FROM deployment_locks WHERE workspace_id=$workspaceId;`;