import { ProviderType } from "../../commons/ProviderType";
import { DatabaseProviderType as DatabaseType } from '../../commons/DatabaseProviderType';
import { LocalWorkspaceProvider } from "./local/LocalWorkspaceProvider";
import { PostgresWorkspaceProvider } from './distributed/PostgresWorkspaceProvider';

export class WorkpaceProviderFactory {
    /**
     * Create a provider for local workspaces.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Workspace provider.
     */
    public createProvider(type: ProviderType, databaseType: DatabaseType) {
        switch(type) {
            case ProviderType.LOCAL: {
                switch (databaseType) {
                    case DatabaseType.SQLITE:
                        return new LocalWorkspaceProvider();
                    case DatabaseType.POSTGRES:
                        return new PostgresWorkspaceProvider();
                }
            }
        }
    }
}