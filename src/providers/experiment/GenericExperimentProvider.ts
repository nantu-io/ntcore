import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import { Runtime } from '../../commons/Runtime';
import { Framework } from '../../commons/Framework';
import { LocalExperimentProvider } from "./local/LocalExperimentProvider";
import { ProviderType } from "../../commons/ProviderType";
import { appConfig } from "../../libs/config/AppConfigProvider";
import { PostgresExperimentProvider } from "./postgres/PostgresExperimentProvider";
import PostgresClientProvider from "../../libs/client/PostgresClientProvider";

export const enum ExperimentState {
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
export class Experiment {
    workspaceId: string;
    version: number;
    runtime: Runtime;
    framework: Framework;
    createdBy: string;
    createdAt: Date;
    description: string;
    parameters: string;
    metrics: string;
    model: Buffer;
    state: ExperimentState
}
/**
 * Interface for experiment provider.
 */
export interface GenericExperimentProvider 
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
    unregister: (workspaceId: string) => Promise<any>
    /**
     * Get registered model.
     */
    getRegistry: (workspaceId: string) => Promise<Experiment>
}

export class ExperimentProviderFactory
{
    /**
     * Create a provider for local experiments.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Experiment provider.
     */
    public createProvider(): GenericExperimentProvider
    {
        const providerType = appConfig.container.provider;
        switch(providerType) {
            // TODO: Update this client provider to be postgres provider for kubernetes when it's ready.
            case ProviderType.KUBERNETES: return new LocalExperimentProvider(SQliteClientProvider.get());
            case ProviderType.DOCKER: return new PostgresExperimentProvider(PostgresClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}