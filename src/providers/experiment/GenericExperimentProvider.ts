import { Runtime } from '../../commons/Runtime';
import { Framework } from '../../commons/Framework';

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
export interface GenericExperimentProvider {
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
}