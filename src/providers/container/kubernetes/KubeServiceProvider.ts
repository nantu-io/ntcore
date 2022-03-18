import { GenericServiceProvider, ServiceState } from "../GenericServiceProvider";
import { KubeContainerService } from "./KubeContainerService";
import { KubernetesObject, KubernetesObjectApi } from '@kubernetes/client-node';
import { IncomingMessage } from "http";

export class KubeContainerServiceProvider implements GenericServiceProvider 
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
    public async provision(config: KubeContainerService): Promise<KubeContainerService>  {
        return config;
    }

    /**
     * Starts the kubernetes service by applying service, ingressRoute and deployment configs.
     * @param config Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async start(config: KubeContainerService): Promise<KubeContainerService>  {
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
    public async stop(config: KubeContainerService): Promise<KubeContainerService>  {
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
    public async delete(config: KubeContainerService) {
        return config;
    }
    
    /**
     * Updates the kubernetes service.
     * @param config Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async update(config: KubeContainerService) {
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
    public async listServices(): Promise<KubeContainerService[]> {
        return;
    }

    /**
     * Retrieve the service state from kubernetes cluster
     * @param config Kubernetes container service config.
     * @returns Kubernetes service states.
     */
    public async getState(config: KubeContainerService): Promise<KubeContainerService> {
        try {
            const conditions = (await this._kubernetesClient.read(config.deployment)).body['status'].conditions;
            const isAvailable = conditions.some((c: { type: string; status: string; }) => c.type === "Available" && c.status === "True");
            const serviceState = isAvailable ? ServiceState.RUNNING : ServiceState.PENDING;
            return { namespace: config.namespace, type: config.type, name: config.name, state: serviceState };
        } catch (e) {
            return { namespace: config.namespace, type: config.type, name: config.name, state: ServiceState.INACTIVE };
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