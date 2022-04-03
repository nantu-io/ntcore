import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import PostgresClientProvider from "../../libs/client/PostgresClientProvider";
import { LocalWorkspaceProvider } from "./sqlite/SQLiteWorkspaceProvider";
import { DatabaseType } from "../../commons/ProviderType";
import { appConfig } from "../../libs/config/AppConfigProvider";
import { PostgresWorkspaceProvider } from "./postgres/PostgresWorkspaceProvider";
import { WorkspaceType } from '../../commons/WorkspaceType';

/**
 * Workspace class.
 */
export class Workspace 
{
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
export interface IWorkspaceProvider 
{
    /**
     * Initialize required resources.
     */
    initialize: () => Promise<void>;
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
    delete: (id: string) => Promise<any>;
    /**
     * Increment the max version of experiment;
     */
    incrementVersion: (id: string) => Promise<number>;
}

export class WorkpaceProviderFactory 
{
    /**
     * Create a provider for local workspaces.
     * @returns Workspace provider.
     */
    public createProvider(): IWorkspaceProvider {
        const providerType: DatabaseType = appConfig.database.provider;
        switch(providerType) {
            case DatabaseType.POSTGRES: return new PostgresWorkspaceProvider(PostgresClientProvider.get());
            case DatabaseType.SQLITE: return new LocalWorkspaceProvider(SQliteClientProvider.get());
            default: throw new Error("Invalide provider type.");
        }
    }
}