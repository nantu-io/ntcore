import { IContainerGroupProvider, ContainerGroupState } from "../ContainerGroupProvider";
import { KubernetesContainerGroup } from "./KubeContainerGroupContextProvider";
import { KubernetesObject, KubernetesObjectApi } from '@kubernetes/client-node';
import { IncomingMessage } from "http";
import moment = require('moment');

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
        const deployment = await this.apply(() => this._kubernetesClient.read(context.deployment), console.warn);
        if (deployment) {
            const restartAt = moment().format();
            context.deployment.spec.template.metadata.annotations = { 'kubectl.kubernetes.io/restartedAt': restartAt };
            await this.apply(() => this._kubernetesClient.patch(context.deployment), console.warn);
        } else {
            const deploymentPromise = this.apply(() => this._kubernetesClient.create(context.deployment), console.warn);
            const servicePromise = this.apply(() => this._kubernetesClient.create(context.service), console.warn);
            const ingressPromise = this.apply(() => this._kubernetesClient.create(context.ingress), console.warn);
            await Promise.all([servicePromise, deploymentPromise, ingressPromise]);
        }
        return context;
    }

    /**
     * Stops the kubernetes service by deleting service, ingressRoute and deployment configs.
     * @param context Kubernetes container service config.
     * @returns Kubernetes container service config.
     */
    public async stop(context: KubernetesContainerGroup): Promise<KubernetesContainerGroup>
    {
        const deploymentPromise = this.apply(() => this._kubernetesClient.delete(context.deployment), console.warn);
        const servicePromise = this.apply(() => this._kubernetesClient.delete(context.service), console.warn);
        const ingressPromise = this.apply(() => this._kubernetesClient.delete(context.ingress), console.warn);
        await Promise.all([servicePromise, deploymentPromise, ingressPromise])
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
            const deployment = await this.apply(() => this._kubernetesClient.read(context.deployment), console.warn);
            const unavailableReplicas: number = deployment['status']['unavailableReplicas'];
            const isAvailable = !unavailableReplicas || unavailableReplicas === 0;
            const serviceState = isAvailable ? ContainerGroupState.RUNNING : ContainerGroupState.PENDING;
            return { namespace: context.namespace, type: context.type, name: context.name, state: serviceState };
        } catch (e) {
            return { namespace: context.namespace, type: context.type, name: context.name, state: ContainerGroupState.INACTIVE };
        }
    }

    /**
     * Executes the kubernetes operations and handles the client errors.
     * @param executor Kubernetes operation executor.
     * @param errorHandler Function to handle the kubernetes client errors.
     * @returns Promise of kubernetes container service.
     */
    private async apply(
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