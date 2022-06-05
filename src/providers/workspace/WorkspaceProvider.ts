import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import PostgresClientProvider from "../../libs/client/PostgresClientProvider";
import { SQLiteWorkspaceProvider } from "./sqlite/SQLiteWorkspaceProvider";
import { appConfig } from "../../libs/config/AppConfigProvider";
import { PostgresWorkspaceProvider } from "./postgres/PostgresWorkspaceProvider";
import DynamoDBClientProvider from "../../libs/client/aws/DynamoDBClientProvider";
import DynamoDBWorkspaceProvider from "./dynamodb/WorkspaceProviderImpl";

/**
 * Workspace types.
 */
export type WorkspaceType = "API" | "Batch";
/**
 * Workspace class.
 */
export class Workspace 
{
    id: string;
    name: string;
    type: WorkspaceType;
    createdBy: string;
    createdAt: number;
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
    list: (username: string) => Promise<Workspace[]>;
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
    public createProvider(): IWorkspaceProvider 
    {
        switch(appConfig.database.type) {
            case "postgres": return new PostgresWorkspaceProvider(PostgresClientProvider.get());
            case "sqlite": return new SQLiteWorkspaceProvider(SQliteClientProvider.get());
            case "dynamodb": return new DynamoDBWorkspaceProvider(DynamoDBClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}