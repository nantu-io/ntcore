import { IContainerGroupProvider, GroupState } from "../ContainerGroupProvider";
import { KubeContainerGroup } from "./KubeContainerGroup";
import { KubernetesObject, KubernetesObjectApi } from '@kubernetes/client-node';
import { IncomingMessage } from "http";

export class KubeContainerGroupProvider implements IContainerGroupProvider 
{
    private readonly _kubernetesClient: KubernetesObjectApi;

    constructor(kubernetesClient: KubernetesObjectApi) {
        this._kubernetesClient = kubernetesClient;
    }

    /**
     * Provisions the kubernetes service.
     * @param config Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async provision(config: KubeContainerGroup): Promise<KubeContainerGroup>  {
        return config;
    }

    /**
     * Starts the kubernetes service by applying service, ingressRoute and deployment configs.
     * @param config Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async start(config: KubeContainerGroup): Promise<KubeContainerGroup>  {
        const servicePromise = this.applyResource(() => this._kubernetesClient.create(config.service), console.warn);
        const ingressPromise = this.applyResource(() => this._kubernetesClient.create(config.ingress), console.warn);
        const deploymentPromise = this.applyResource(() => this._kubernetesClient.create(config.deployment), console.warn);
        await Promise.all([servicePromise, ingressPromise, deploymentPromise])
        return config;
    }

    /**
     * Stops the kubernetes service by deleting service, ingressRoute and deployment configs.
     * @param config Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async stop(config: KubeContainerGroup): Promise<KubeContainerGroup>  {
        const deploymentPromise = this.applyResource(() => this._kubernetesClient.delete(config.deployment), console.warn);
        const servicePromise = this.applyResource(() => this._kubernetesClient.delete(config.ingress), console.warn);
        const ingressPromise = this.applyResource(() => this._kubernetesClient.delete(config.service), console.warn);
        await Promise.all([servicePromise, ingressPromise, deploymentPromise])
        return config;
    }
    
    /**
     * Deletes the kubernetes service.
     * @param config Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async delete(config: KubeContainerGroup) {
        return config;
    }
    
    /**
     * Updates the kubernetes service.
     * @param config Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async update(config: KubeContainerGroup) {
        await this.applyResource(() => this._kubernetesClient.patch(config.deployment), console.warn)
        return config;
    }
     
    /**
     * Executes commands in the kubernetes service.
     * @param config Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async exec(name: string, command: string) {
        return;
    }
    
    /**
     * Lists all kubernetes container services.
     * @param config Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async listServices(): Promise<KubeContainerGroup[]> {
        return;
    }

    /**
     * Retrieve the service state from kubernetes cluster
     * @param config Kubernetes container service config.
     * @returns Kubernetes service states.
     */
    public async getState(config: KubeContainerGroup): Promise<KubeContainerGroup> {
        try {
            const conditions = (await this._kubernetesClient.read(config.deployment)).body['status'].conditions;
            const isAvailable = conditions.some((c: { type: string; status: string; }) => c.type === "Available" && c.status === "True");
            const serviceState = isAvailable ? GroupState.RUNNING : GroupState.PENDING;
            return { namespace: config.namespace, type: config.type, name: config.name, state: serviceState };
        } catch (e) {
            return { namespace: config.namespace, type: config.type, name: config.name, state: GroupState.INACTIVE };
        }
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
        }
    }
}