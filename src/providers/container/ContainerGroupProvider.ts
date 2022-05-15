import { ProviderType } from '../../commons/ProviderType'; 
import { Runtime } from '../../commons/Runtime';
import { Framework } from '../../commons/Framework';
/**
 * Defines the service loading states
 */
export const enum ContainerGroupState
{
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
export const enum ContainerGroupType
{
    /**
     * Flask sklearn.
     */
    SKLEARN = "SKLEARN",
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
     * Jupyter notebook or Jupyter lab.
     */
    JUPYTER = "JUPYTER",
    /**
     * Theia python ide.
     */
    THEIA_PYTHON = "THEIA_PYTHON",
}
/**
 * Mapping from string to ServiceType.
 */
export const ContainerGroupTypeMapping = {
    /**
     * Jupyter notebook/lab.
     */
    JUPYTER: ContainerGroupType.JUPYTER,
    /**
     * Jupyter notebook/lab with Pytorch
     */
    PYTORCH: ContainerGroupType.PYTORCH,
    /**
     * Rstudio suite.
     */
    RSTUDIO: ContainerGroupType.RSTUDIO,
    /**
     * Jupyter notebook/lab with Tensorflow.
     */
    TENSORFLOW: ContainerGroupType.TENSORFLOW,
    /**
     * Jupyter notebook/lab with Tensorflow.
     */
    THEIA_PYTHON: ContainerGroupType.THEIA_PYTHON,
    /**
     * Flask for sklearn.
     */
    SKLEARN: ContainerGroupType.SKLEARN,
}
/**
 * Container definition.
 */
export abstract class IContainer 
{
    id?: string;
    name?: string;
}
/**
 * Service config base.
 */
export abstract class IContainerGroup
{
    type?: ContainerGroupType;
    id?: string;
    name?: string;
    state?: ContainerGroupState;
    vars?: string[]
}
/**
 * Container group request context.
 */
export class ContainerGroupRequestContext
{
    name?: string;
    type?: ContainerGroupType;
    workspaceId?: string;
    version?: number;
    runtime?: Runtime;
    command?: string;
    workflow?: string;
}
/**
 * Interface for container provider.
 */
export interface IContainerGroupProvider
{
    /**
     * Prepare the setup before launching any service.
     */
    provision: (context: IContainerGroup) => Promise<IContainerGroup>;
    /**
     * Starts the service and returns the container id.
     */
    start: (context: IContainerGroup) => Promise<IContainerGroup>;
    /**
     * Stops the service based on given id.
     */
    stop: (context: IContainerGroup) => Promise<IContainerGroup>;
    /**
     * Deletes the service 
     */
    delete: (context: IContainerGroup) => Promise<IContainerGroup>;
    /**
     * Execute command on the container.
     */
    update: (context: IContainerGroup) => Promise<IContainerGroup>;
    /**
     * Returns the state of a service.
     */
    getState: (context: IContainerGroup) => Promise<IContainerGroup>
    /**
     * Returns the logs of a service.
     */
    getLogs: (context: IContainerGroup) => Promise<string>
}
/**
 * Interface for service state provider.
 */
export interface IContainerGroupStateProvider
{
    /**
     * Initialize required resource.
     */
    initialize: () => Promise<void>;
    /**
     * Records the service state.
     */
    record: (config: IContainerGroup, username: string, state: ContainerGroupState, runtime?: Runtime, cpus?: any, memory?: any, packages?: string[]) => Promise<IContainerGroup>;
    /**
     * Gets the service state.
     */
    get: (name: string, username: string) => Promise<IContainerGroup>;
    /**
     * Lists service states.
     */
    list: (username: string) => Promise<IContainerGroup[]>
}
/**
 * Interface for config provider.
 */
export interface IContainerGroupConfigProvider 
{
    /**
     * Create config for development instances.
     */
    createDevelopmentConfig: (name: string, type?: ContainerGroupType, runtime?: Runtime, cpus?: any, memory?: any, packages?: string[]) => IContainerGroup
    /**
     * Create config for deployment instances.
     */
    createDeploymentConfig: (type: ContainerGroupType, workspaceId: string, version?: number, runtime?: Runtime, framework?: Framework, cpus?: any, memory?: any, publishedPort?: number) => IContainerGroup
}
/**
 * Interface for context provider.
 */
export interface IContainerGroupContextProvider 
{
    getContext: (requestContext: ContainerGroupRequestContext) => IContainerGroup
}
/**
 * Provider factory.
 */
export interface IProviderFactory<T> 
{
    /**
     * Creates provider.
     */
    createProvider: (providerType: ProviderType) => T
}