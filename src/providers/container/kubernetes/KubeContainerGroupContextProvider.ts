import { ContainerGroupType, IContainerGroupContextProvider } from '../ContainerGroupProvider';
import { KubernetesContainerGroup, KubernetesDeploymentV1, KubernetesServiceV1, KubernetesContainer } from './KubeContainerGroup';
import { appConfig } from '../../../libs/config/AppConfigProvider';
import { KubernetesIngressRoutesProviderV1Alpha1 } from './KubeIngressRoutesProvider';
import { KubernetesIngressProviderV1 } from './KubeIngressProvider';
import { KubernetesDeploymentProviderV1 } from './KubeDeploymentProvider';
import { DeploymentContext } from '../../deployment/DeploymentContextProvider';
import { KubernetesServiceProviderV1 } from './KubeServiceProvider';

export class KubernetesContainerGroupContextProvider implements IContainerGroupContextProvider 
{
    private readonly _ingressRouteProvider: KubernetesIngressRoutesProviderV1Alpha1;
    private readonly _ingressProvider: KubernetesIngressProviderV1;
    private readonly _deploymentProvider: KubernetesDeploymentProviderV1;
    private readonly _serviceProvider: KubernetesServiceProviderV1;

    public constructor()
    {
        this._ingressRouteProvider = new KubernetesIngressRoutesProviderV1Alpha1();
        this._ingressProvider = new KubernetesIngressProviderV1();
        this._deploymentProvider = new KubernetesDeploymentProviderV1();
        this._serviceProvider = new KubernetesServiceProviderV1();
    }

    /**
     * Provides the docker container creation context.
     * @param requestContext request context.
     * @returns context for docker container creation.
     */
    public getContext(requestContext: DeploymentContext): KubernetesContainerGroup 
    {
        switch (requestContext.type) {
            case ContainerGroupType.SKLEARN: return this.getSklearnAPIContext(requestContext);
            case ContainerGroupType.TENSORFLOW: return this.getTensorflowServingContext(requestContext);
            case ContainerGroupType.PYTORCH: return this.getTorchAPIContext(requestContext);
            default: throw new Error('Invalid container group type.');
        }
    }

    private getSklearnAPIContext(requestContext: DeploymentContext): KubernetesContainerGroup 
    {
        const namespace = appConfig.container.namespace;
        const workspaceId = requestContext.workspaceId;
        const name = `ntcore-${workspaceId.toLocaleLowerCase()}`;
        const image = appConfig.container.images['sklearn'];
        const container = this.getKubernetesContainer(workspaceId, image, name, 8000, `/s/${workspaceId}/healthcheck`, 120);
        const stripPrefixesMiddleware = this._ingressRouteProvider.getStripPrefixMiddleware(namespace, name, [ `/s/${workspaceId}` ]);
        const traefikIngressRoute = this._ingressRouteProvider.getPathPrefixMatchedRoute(namespace, name, 8000, `/s/${workspaceId}`, [ name ]);
        return {
            name,
            type: requestContext.type,
            namespace: namespace,
            service: this.getKubernetesService(namespace, name, 8000),
            deployment: this.getKubernetesDeployment(namespace, name, [ container ]),
            ingressRoute: this._ingressRouteProvider.getKubernetesIngressRoute(namespace, name, ['web'], [ traefikIngressRoute ]),
            middlewares: [ stripPrefixesMiddleware ]
        }
    }

    private getTensorflowServingContext(dc: DeploymentContext): KubernetesContainerGroup
    {
        const namespace = appConfig.container.namespace;
        const service = this._serviceProvider.getKubernetesService(namespace, dc);
        const deployment = this._deploymentProvider.getKubernetesDeployment(namespace, dc);
        const ingress = this._ingressProvider.getKubernetesIngress(namespace, dc);
        
        return { name: dc.name, type: dc.type, namespace, service, deployment, ingress }
    }

    private getTorchAPIContext(requestContext: DeploymentContext): KubernetesContainerGroup 
    {
        const namespace = appConfig.container.namespace;
        const workspaceId = requestContext.workspaceId;
        const name = `ntcore-${workspaceId.toLocaleLowerCase()}`;
        const image = appConfig.container.images['pytorch'];
        const container = this.getKubernetesContainer(workspaceId, image, name, 80, `/health`, 120);
        const stripPrefixesMiddleware = this._ingressRouteProvider.getStripPrefixMiddleware(namespace, name, [ `/s/${workspaceId}` ]);
        const traefikIngressRoute = this._ingressRouteProvider.getPathPrefixMatchedRoute(namespace, name, 80, `/s/${workspaceId}`, [ name ]);
        return {
            name, 
            type: requestContext.type,
            namespace: namespace,
            service: this.getKubernetesService(namespace, name, 80),
            deployment: this.getKubernetesDeployment(namespace, name, [ container ]),
            ingressRoute: this._ingressRouteProvider.getKubernetesIngressRoute(namespace, name, ['web'], [ traefikIngressRoute ]),
            middlewares: [ stripPrefixesMiddleware ]
        }
    }

    private getKubernetesService(namespace: string, serviceName: string, servicePort: number): KubernetesServiceV1 
    {
        return {
            apiVersion: "v1",
            kind: "Service",
            metadata: { 
                name: serviceName,
                namespace: namespace
            },
            spec: {
                selector: { app: serviceName },
                ports: [ { protocol: "TCP", name: "web", port: servicePort } ]
            }
        };
    }

    private getKubernetesDeployment(namespace: string, name: string, containers: KubernetesContainer[]): KubernetesDeploymentV1 
    {
        return {
            kind: "Deployment",
            apiVersion: "apps/v1",
            metadata: {
                namespace: namespace,
                name: name,
                labels: { app: name }
            },
            spec: {
                replicas: 1,
                selector: { matchLabels: { app: name } },
                template: {
                    metadata: { labels: { app: name } },
                    spec: {
                        containers: containers,
                        volumes: [ { name: name, emptyDir: {} } ]
                    }
                }
            }
        }
    }

    private getKubernetesContainer(workspaceId: string, image: string, name: string, port: number, healthCheckPath: string, initialDelaySeconds: number): KubernetesContainer 
    {
        return {
            name: name,
            image: image,
            ports: [ { name: "web", containerPort: port } ],
            env: [
                { name: "DSP_API_ENDPOINT", value: "ntcore:8180" },
                { name: "DSP_MONITORING_ENDPOINT", value: "ntcore-monitoring:8180"},
                { name: "DSP_WORKSPACE_ID", value: workspaceId }
            ],
            volumeMounts: [{ mountPath: "/models", name: name }],
            readinessProbe: {
                httpGet: { path: healthCheckPath, port: port },
                initialDelaySeconds: initialDelaySeconds,
                periodSeconds: 10,
            },
            resources: {
                requests: {
                    /* memory: `${memory}Gi`, cpu: `${cpus}` */
                }
            }
        }
    }
}