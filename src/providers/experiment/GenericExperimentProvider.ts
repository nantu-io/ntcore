import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import { Runtime } from '../../commons/Runtime';
import { Framework } from '../../commons/Framework';
import { LocalExperimentProvider } from "./local/LocalExperimentProvider";
import { ProviderType } from "../../commons/ProviderType";
import { appConfig } from "../../libs/config/AppConfigProvider";

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
}
/**
 * Interface for experiment provider.
 */
export interface GenericExperimentProvider 
{
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
     * Save model
     */
    saveModel: (workspaceId: string, version: number, base64: string) => Promise<any>
    /**
     * Load model
     */
    loadModel: (workspaceId: string, version: number) => Promise<string>
    /**
     * Delete model
     */
    deleteModel: (workspaceId: string, version: number) => Promise<any>
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
            case ProviderType.DOCKER: return new LocalExperimentProvider(SQliteClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}