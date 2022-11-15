import { ProviderType } from '../../commons/ProviderType'; 
import { DeploymentContext } from '../deployment/DeploymentContextProvider';

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
     * Tensorflow notebook.
     */
    TENSORFLOW = "TENSORFLOW",
    /**
     * PyTorch notebook.
     */
    PYTORCH = "PYTORCH",
}
/**
 * Mapping from string to ServiceType.
 */
export const ContainerGroupTypeMapping = {
    /**
     * Jupyter notebook/lab with Pytorch
     */
    PYTORCH: ContainerGroupType.PYTORCH,
    /**
     * Jupyter notebook/lab with Tensorflow.
     */
    TENSORFLOW: ContainerGroupType.TENSORFLOW,
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
     * Returns the state of a service.
     */
    getState: (context: IContainerGroup) => Promise<IContainerGroup>
}
/**
 * Interface for context provider.
 */
export interface IContainerGroupContextProvider 
{
    getContext: (requestContext: DeploymentContext) => IContainerGroup
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