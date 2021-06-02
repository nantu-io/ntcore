/**
 * Workspace types.
 */
export const enum WorkspaceType {
    /**
     * RShiny app.
     */
    RSHINY_APP = "RSHINY_APP",
    /**
     * Flask app.
     */
    FLASK_APP = "FLASK_APP"
}
/**
 * Workspace class.
 */
export class Workspace {
    id: string;
    name: string;
    type: WorkspaceType;
    createdBy: string;
    createdAt: Date;
    maxVersion: number;
}
/**
 * Interface for workspace provider.
 */
export interface GenericWorkspaceProvider {
    /**
     * Create a new workpace.
     */
    create: (workspace: Workspace) => Promise<string>;
    /**
     * Create a new workpace.
     */
    update: (workspace: Workspace) => Promise<string>;
    /**
     * Create a new workpace.
     */
    read: (id: string) => Promise<Workspace>;
    /**
     * List all workspaces.
     */
    list: () => Promise<Array<Workspace>>;
    /**
     * Create a new workpace.
     */
    delete: (id: string) => Promise<string>;
    /**
     * Increment the max version of experiment;
     */
    incrementVersion: (id: string) => Promise<number>;
}