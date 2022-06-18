import { ContainerGroupType, ContainerGroupRequestContext, IContainerGroupContextProvider } from '../ContainerGroupProvider';
import { KubernetesContainerGroup, KubernetesDeploymentV1, KubernetesServiceV1, KubernetesContainer } from './KubeContainerGroup';
import { appConfig } from '../../../libs/config/AppConfigProvider';
import { KubernetesIngressRoutesProviderV1Alpha1 } from './KubeIngressRoutesProvider';

export class KubernetesContainerGroupContextProvider implements IContainerGroupContextProvider 
{
    private readonly _ingressRouteProvider: KubernetesIngressRoutesProviderV1Alpha1;

    public constructor()
    {
        this._ingressRouteProvider = new KubernetesIngressRoutesProviderV1Alpha1();
    }

    /**
     * Provides the docker container creation context.
     * @param requestContext request context.
     * @returns context for docker container creation.
     */
    public getContext(requestContext: ContainerGroupRequestContext): KubernetesContainerGroup 
    {
        switch (requestContext.type) {
            case ContainerGroupType.SKLEARN: return this.getSklearnAPIContext(requestContext);
            case ContainerGroupType.TENSORFLOW: return this.getTensorflowAPIContext(requestContext);
            case ContainerGroupType.PYTORCH: return this.getTorchAPIContext(requestContext);
            default: throw new Error('Invalid container group type.');
        }
    }

    private getSklearnAPIContext(requestContext: ContainerGroupRequestContext): KubernetesContainerGroup 
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
            ingress: this._ingressRouteProvider.getKubernetesIngressRoute(namespace, name, ['web'], [ traefikIngressRoute ]),
            middlewares: [ stripPrefixesMiddleware ]
        }
    }

    private getTensorflowAPIContext(requestContext: ContainerGroupRequestContext): KubernetesContainerGroup 
    {
        const namespace = appConfig.container.namespace;
        const workspaceId = requestContext.workspaceId;
        const name = `ntcore-${workspaceId.toLocaleLowerCase()}`;
        const image = appConfig.container.images['tensorflow'];
        const container = this.getKubernetesContainer(workspaceId, image, name, 8501, `/v1/models/${workspaceId}`, 120);
        const replacePathMiddleware = this._ingressRouteProvider.getReplacePathMiddleware(namespace, name, `/v1/models/${workspaceId}:predict`);
        const traefikIngressRoute = this._ingressRouteProvider.getPathMatchedRoute(namespace, name, 8501, `/s/${workspaceId}/predict`, [ name ]);
        return {
            name, 
            type: requestContext.type,
            namespace: namespace,
            service: this.getKubernetesService(namespace, name, 8501),
            deployment: this.getKubernetesDeployment(namespace, name, [ container ]),
            ingress: this._ingressRouteProvider.getKubernetesIngressRoute(namespace, name, ['web'], [ traefikIngressRoute ]),
            middlewares: [ replacePathMiddleware ]
        }
    }

    private getTorchAPIContext(requestContext: ContainerGroupRequestContext): KubernetesContainerGroup 
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
            ingress: this._ingressRouteProvider.getKubernetesIngressRoute(namespace, name, ['web'], [ traefikIngressRoute ]),
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
                        containers: containers
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