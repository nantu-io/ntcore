import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import { Runtime } from '../../commons/Runtime';
import { Framework } from '../../commons/Framework';
import { SQLiteExperimentProvider } from "./sqlite/SQLiteExperimentProvider";
import { DatabaseType } from "../../commons/ProviderType";
import { appConfig } from "../../libs/config/AppConfigProvider";
import { PostgresExperimentProvider } from "./postgres/PostgresExperimentProvider";
import PostgresClientProvider from "../../libs/client/PostgresClientProvider";

export const enum ExperimentState 
{
    /**
     * Deploy instances locally with docker.
     */
    PENDING = "PENDING",
    /**
     * Deploy instances in Kubernetes cluster.
     */
    REGISTERED = "REGISTERED",
    /**
     * Deploy instances in AWS 
     */
    UNREGISTERED = "UNREGISTERED",
}
/**
 * Provider type mapping.
 */
export const ExperimentStateMapping = {
    /**
     * Docker.
     */
    "PENDING": ExperimentState.PENDING,
    /**
     * Kubernetes.
     */
    "REGISTERED": ExperimentState.REGISTERED,
    /**
     * AWS.
     */
    "UNREGISTERED": ExperimentState.UNREGISTERED,
}
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
    createdAt: Date;
    description: string;
    parameters: string;
    metrics: string;
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
     * Load model
     */
    loadModel: (workspaceId: string, version: number) => Promise<string>
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
        const providerType: DatabaseType = appConfig.database.provider;
        switch(providerType) {
            case DatabaseType.POSTGRES: return new PostgresExperimentProvider(PostgresClientProvider.get());
            case DatabaseType.SQLITE: return new SQLiteExperimentProvider(SQliteClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}