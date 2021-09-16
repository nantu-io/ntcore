import { ProviderType } from '../../commons/ProviderType';
import { Runtime } from '../../commons/Runtime';
import { Framework } from '../../commons/Framework';
/**
 * Defines the service loading states
 */
export const enum ServiceState {
    /**
     * Indicates the container is being initilialized.
     */
    PENDING = "PENDING",
    /**
     * Indicates the container is running.
     */
    RUNNING = "RUNNING",
    /**
     * Indicates the container is being stopped.
     */
    STOPPING = "STOPPING",
    /**
     * Indicates the container is stopped.
     */
    STOPPED = "STOPPED",
    /**
     * Indicates the container is inactive.
     */
    INACTIVE = "INACTIVE",
    /**
     * Indicates the container is unknown.
     */
    UNKNOWN = "UNKNOWN",
}
/**
 * Defines the service types.
 */
export const enum ServiceType {
    /**
     * Jupyter notebook or Jupyter lab.
     */
    JUPYTER = "JUPYTER",
    /**
     * RStudio.
     */
    RSTUDIO = "RSTUDIO",
    /**
     * Tensorflow notebook.
     */
    TENSORFLOW = "TENSORFLOW",
    /**
     * PyTorch notebook.
     */
    PYTORCH = "PYTORCH",
    /**
     * Theia python ide.
     */
    THEIA_PYTHON = "THEIA_PYTHON",
    /**
     * Flask sklearn.
     */
    FLASK_SKLEARN = "FLASK_SKLEARN",
}
/**
 * Mapping from string to ServiceType.
 */
export const ServiceTypeMapping = {
    /**
     * Jupyter notebook/lab.
     */
    JUPYTER: ServiceType.JUPYTER,
    /**
     * Jupyter notebook/lab with Pytorch
     */
    PYTORCH: ServiceType.PYTORCH,
    /**
     * Rstudio suite.
     */
    RSTUDIO: ServiceType.RSTUDIO,
    /**
     * Jupyter notebook/lab with Tensorflow.
     */
    TENSORFLOW: ServiceType.TENSORFLOW,
    /**
     * Jupyter notebook/lab with Tensorflow.
     */
    THEIA_PYTHON: ServiceType.THEIA_PYTHON,
    /**
     * Flask for sklearn.
     */
    FLASK_SKLEARN: ServiceType.FLASK_SKLEARN,
}
/**
 * Docker environment variable.
 */
export class EnvironmentVariable {
    name: string;
    value: string;
}
/**
 * Docker labels
 */
export class DockerLabels {
    [key: string]: string;
}
/**
 * Mount point configuration
 */
export class MountPoint {
    containerPath: string;
    sourceVolume: string;
}
/**
 * Docker volumn.
 */
export class Volume {
    name: string;
}
/**
 * Volum from container.
 */
export class VolumeFrom {
    sourceContainer: string;
    readonly: boolean;
}
/**
 * Port mapping.
 */
export class PortMapping {
    containerPort: number;
    hostPort: number;
    protocol: string;
}
/**
 * Container definition.
 */
 export abstract class GenericContainer {
    id?: string;
    name?: string;
}
/**
 * Service config base.
 */
export abstract class GenericService {
    type?: ServiceType;
    name?: string;
    state?: ServiceState;
    vars?: string[]
}
/**
 * Interface for container provider.
 */
export interface GenericServiceProvider {
    /**
     * Prepare the setup before launching any service.
     */
    provision: (config: GenericService) => Promise<GenericService>;
    /**
     * Starts the service and returns the container id.
     */
    start: (config: GenericService) => Promise<GenericService>;
    /**
     * Stops the service based on given id.
     */
    stop: (config: GenericService) => Promise<GenericService>;
    /**
     * Deletes the service 
     */
    delete: (config: GenericService) => Promise<GenericService>;
    /**
     * Execute command on the container.
     */
    update: (config: GenericService) => Promise<GenericService>;
    /**
     * Create workspace directory in container.
     */
    exec: (name: string, command: string) => Promise<any>;
    /**
     * Lists all containers.
     */
    listServices: () => Promise<Array<GenericService>>;
    /**
     * Returns the state of a service.
     */
    getState: (config: GenericService) => Promise<GenericService>
}
/**
 * Interface for service state provider.
 */
export interface GenericServiceStateProvider {
    /**
     * Initialize required resource.
     */
    initialize: () => Promise<void>;
    /**
     * Records the service state.
     */
    record: (config: GenericService, username: string, state: ServiceState, runtime?: Runtime, cpus?: any, memory?: any, packages?: string[]) => Promise<GenericService>;
    /**
     * Gets the service state.
     */
    get: (name: string, username: string) => Promise<GenericService>;
    /**
     * Lists service states.
     */
    list: (username: string) => Promise<GenericService[]>
}
/**
 * Interface for config provider.
 */
export interface GenericServiceConfigProvider {
    /**
     * Create config for development instances.
     */
    createDevelopmentConfig: (name: string, type?: ServiceType, runtime?: Runtime, cpus?: any, memory?: any, packages?: string[]) => GenericService
    /**
     * Create config for deployment instances.
     */
    createDeploymentConfig: (type: ServiceType, workspaceId: string, version?: number, runtime?: Runtime, framework?: Framework, cpus?: any, memory?: any, publishedPort?: number) => GenericService
}
/**
 * Provider factory.
 */
export interface GenericProviderFactory<T> {
    /**
     * Creates provider.
     */
    createProvider: (providerType: ProviderType) => T
}