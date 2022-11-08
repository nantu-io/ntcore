import { IContainer, IContainerGroup, IContainerGroupContextProvider } from '../ContainerGroupProvider';
import { appConfig } from '../../../libs/config/AppConfigProvider';
import { DeploymentContext } from '../../deployment/DeploymentContextProvider';
import { KubernetesIngressProviderV1, KubernetesIngressV1 } from './KubeIngressProvider';
import { KubernetesDeploymentProviderV1, KubernetesDeploymentV1 } from './KubeDeploymentProvider';
import { KubernetesServiceProviderV1, KubernetesServiceV1 } from './KubeServiceProvider';

/**
 * Kubernetes container service.
 */
export class KubernetesContainerGroup extends IContainerGroup 
{
    namespace: string;
    service?: KubernetesServiceV1;
    deployment?: KubernetesDeploymentV1;
    ingress?: KubernetesIngressV1;
}

/**
 * Kubernetes container.
 */
export class KubernetesContainer extends IContainer 
{
    name: string;
    image: string;
    env: {name: string, value: string}[];
    args?: string[];
    ports?: {
        name: string;
        containerPort: number;
    }[];
    volumeMounts?: {
        mountPath: string;
        name: string;
    }[];
    readinessProbe?: {
        httpGet?: {
            path: string;
            port: number;
        };
        exec?: {
            command: string[];
        };
        initialDelaySeconds?: number;
        periodSeconds?: number;
    };
    resources?: {
        requests?: {
            memory?: string;
            cpu?: string;
        };
        limits?: {
            memory?: string;
            cpu?: string;
        }
    }
}

/**
 * Kubernetes resource metadata definition.
 */
export class KubernetesResourceMetadata 
{
    namespace?: string;
    name?: string;
    labels?: {};
    annotations?: { [key: string]: string }
}

/**
 * Kubernetes container group context provider
 */
export class KubernetesContainerGroupContextProvider implements IContainerGroupContextProvider 
{
    private readonly _ingressProvider: KubernetesIngressProviderV1;
    private readonly _deploymentProvider: KubernetesDeploymentProviderV1;
    private readonly _serviceProvider: KubernetesServiceProviderV1;

    public constructor()
    {
        this._ingressProvider = new KubernetesIngressProviderV1();
        this._deploymentProvider = new KubernetesDeploymentProviderV1();
        this._serviceProvider = new KubernetesServiceProviderV1();
    }

    /**
     * Provides the kubernetes container creation context.
     * @param deploymentContext request context.
     * @returns context for kubernetes container creation.
     */
    public getContext(deploymentContext: DeploymentContext): KubernetesContainerGroup 
    {
        const namespace = appConfig.container.namespace;
        const name = deploymentContext.name;
        const type = deploymentContext.type;
        const service = this._serviceProvider.getKubernetesService(namespace, deploymentContext);
        const deployment = this._deploymentProvider.getKubernetesDeployment(namespace, deploymentContext);
        const ingress = this._ingressProvider.getKubernetesIngress(namespace, deploymentContext);

        return { namespace, name, type, service, deployment, ingress };
    }
}