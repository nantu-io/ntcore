import { IContainerGroupProvider, ContainerGroupState } from "../ContainerGroupProvider";
import { KubernetesContainerGroup } from "./KubeContainerGroup";
import { KubernetesObject, KubernetesObjectApi } from '@kubernetes/client-node';
import { IncomingMessage } from "http";
import { NotImplementedException } from "../../../commons/Errors";

export class KubernetesContainerGroupProvider implements IContainerGroupProvider 
{
    private readonly _kubernetesClient: KubernetesObjectApi;

    constructor(kubernetesClient: KubernetesObjectApi) 
    {
        this._kubernetesClient = kubernetesClient;
    }

    /**
     * Provisions the kubernetes service.
     * @param context Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async provision(context: KubernetesContainerGroup): Promise<KubernetesContainerGroup> 
    {
        return context;
    }

    /**
     * Starts the kubernetes service by applying service, ingressRoute and deployment configs.
     * @param context Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async start(context: KubernetesContainerGroup): Promise<KubernetesContainerGroup>  
    {
        const servicePromise = this.applyResource(() => this._kubernetesClient.create(context.service), console.warn);
        const ingressPromise = this.applyResource(() => this._kubernetesClient.create(context.ingress), console.warn);
        const deploymentPromise = this.applyResource(() => this._kubernetesClient.create(context.deployment), console.warn);
        await Promise.all([servicePromise, ingressPromise, deploymentPromise])
        return context;
    }

    /**
     * Stops the kubernetes service by deleting service, ingressRoute and deployment configs.
     * @param context Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async stop(context: KubernetesContainerGroup): Promise<KubernetesContainerGroup>  
    {
        const deploymentPromise = this.applyResource(() => this._kubernetesClient.delete(context.deployment), console.warn);
        const servicePromise = this.applyResource(() => this._kubernetesClient.delete(context.ingress), console.warn);
        const ingressPromise = this.applyResource(() => this._kubernetesClient.delete(context.service), console.warn);
        await Promise.all([servicePromise, ingressPromise, deploymentPromise])
        return context;
    }
    
    /**
     * Deletes the kubernetes service.
     * @param context Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async delete(context: KubernetesContainerGroup) 
    {
        return (await this.stop(context));
    }
    
    /**
     * Updates the kubernetes service.
     * @param context Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async update(context: KubernetesContainerGroup) 
    {
        await this.applyResource(() => this._kubernetesClient.patch(context.deployment), console.warn)
        return context;
    }
    
    /**
     * Retrieve the service state from kubernetes cluster
     * @param context Kubernetes container service config.
     * @returns Kubernetes service states.
     */
    public async getState(context: KubernetesContainerGroup): Promise<KubernetesContainerGroup> 
    {
        try {
            const status = (await this._kubernetesClient.read(context.deployment))?.body['status'];
            const conditions = status?.conditions;
            const isAvailable = conditions && conditions.some((c: { type: string; status: string; }) => c.type === "Available" && c.status === "True");
            const serviceState = isAvailable ? ContainerGroupState.RUNNING : ContainerGroupState.PENDING;
            return { namespace: context.namespace, type: context.type, name: context.name, state: serviceState };
        } catch (e) {
            return { namespace: context.namespace, type: context.type, name: context.name, state: ContainerGroupState.INACTIVE };
        }
    }

    public async getLogs(context: KubernetesContainerGroup): Promise<string>
    {
        throw new NotImplementedException();
    }

    /**
     * Executes the kubernetes operations and handles the client errors.
     * @param executor Kubernetes operation executor.
     * @param errorHandler Function to handle the kubernetes client errors.
     * @returns Promise of kubernetes container service.
     */
    private async applyResource(
        executor: () => Promise<{body: KubernetesObject, response: IncomingMessage}>, 
        errorHandler: (error: IncomingMessage) => any
    ): Promise<KubernetesObject> {
        try {
            return (await executor()).body;
        } catch (e) {
            errorHandler(e.body);
            throw e;
        }
    }
}