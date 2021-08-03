import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import { LocalWorkspaceProvider } from "./local/LocalWorkspaceProvider";
import { ProviderType } from "../../commons/ProviderType";
import { appConfig } from "../../libs/config/AppConfigProvider";

/**
 * Workspace types.
 */
export const enum WorkspaceType 
{
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
export interface GenericWorkspaceProvider 
{
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
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Workspace provider.
     */
    public createProvider(): GenericWorkspaceProvider {
        const providerType = appConfig.container.provider;
        switch(providerType) {
            // TODO: Update this client provider to be postgres provider for kubernetes when it's ready.
            case ProviderType.KUBERNETES: return new LocalWorkspaceProvider(SQliteClientProvider.get());
            case ProviderType.DOCKER: return new LocalWorkspaceProvider(SQliteClientProvider.get());
            default: throw new Error("Invalide provider type.");
        }
    }
}