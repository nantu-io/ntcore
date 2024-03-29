import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import { Runtime } from '../../commons/Runtime';
import { Framework } from '../../commons/Framework';
import { SQLiteExperimentProvider } from "./sqlite/ExperimentProviderImpl";
import { appConfig } from "../../libs/config/AppConfigProvider";
import { PostgresExperimentProvider } from "./postgres/ExperimentProviderImpl";
import PostgresClientProvider from "../../libs/client/PostgresClientProvider";
import DynamoDBExperimentProvider from "./dynamodb/ExperimentProviderImpl";
import DynamoDBClientProvider from "../../libs/client/aws/DynamoDBClientProvider";

/**
 * Experiment states.
 */
export type ExperimentState = "PENDING" | "REGISTERED" | "UNREGISTERED";

/**
 * Experiment class.
 */
export class Experiment 
{
    workspaceId: string;
    version: number;
    runtime: Runtime;
    framework: Framework;
    createdBy: string;
    createdAt: number;
    description: string;
    parameters: { [key: string]: string | number };
    metrics: { [key: string]: string | number };
    model?: Buffer;
    state: ExperimentState
}
/**
 * Interface for experiment provider.
 */
export interface IExperimentProvider 
{
    /**
     * Initialize required resources.
     */
    initialize: () => Promise<void>;
    /**
     * Create a new experiment.
     */
    create: (experiment: Experiment) => Promise<number>;
    /**
     * Create a new experiment.
     */
    read: (workspaceId: string, version: number) => Promise<Experiment>;
    /**
     * List all experiments.
     */
    list: (workspaceId: string) => Promise<Array<Experiment>>;
    /**
     * Delete a given experiment.
     */
    delete: (workspaceId: string, version: number) => Promise<any>;
    /**
     * Register model.
     */
    register: (workspaceId: string, version: number) => Promise<any>
    /**
     * Unregister model.
     */
    deregister: (workspaceId: string, version: number) => Promise<any>
    /**
     * Get registered model.
     */
    getRegistry: (workspaceId: string) => Promise<Experiment>
}

export class ExperimentProviderFactory
{
    /**
     * Create a provider for local experiments.
     * @returns Experiment provider.
     */
    public createProvider(): IExperimentProvider
    {
        switch(appConfig.database.type) {
            case "postgres": return new PostgresExperimentProvider(PostgresClientProvider.get());
            case "sqlite": return new SQLiteExperimentProvider(SQliteClientProvider.get());
            case "dynamodb": return new DynamoDBExperimentProvider(DynamoDBClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}