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
            case ContainerGroupType.TENSORFLOW: return this.getTensorflowServingContext(requestContext);
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

    private getTensorflowServingContext(requestContext: ContainerGroupRequestContext): KubernetesContainerGroup 
    {
        const namespace = appConfig.container.namespace;
        const workspaceId = requestContext.workspaceId;
        const name = `ntcore-${workspaceId.toLocaleLowerCase()}`;
        const modelServingImage = appConfig.container.images['tensorflow'];
        const metricsProxyImage = appConfig.container.images['metricsProxy'];
        const bootstrapImage = appConfig.container.images['bootstrap'];
        const modelServingContainer = this.getModelServingContainer(workspaceId, modelServingImage, name, 8501, `/v1/models/${workspaceId}`, 60);
        const metricsProxyContainer = this.getMetricsProxyContainer(workspaceId, metricsProxyImage, name, 8501, `/v1/models/${workspaceId}`, 10);
        const bootstrapContainer = this.getBootstrapContainer(workspaceId, bootstrapImage, name, 5);
        const replacePathMiddleware = this._ingressRouteProvider.getReplacePathMiddleware(namespace, name, `/v1/models/${workspaceId}:predict`);
        const traefikIngressRoute = this._ingressRouteProvider.getPathMatchedRoute(namespace, name, 18080, `/s/${workspaceId}/predict`, [ name ]);
        return {
            name, 
            type: requestContext.type,
            namespace: namespace,
            service: this.getKubernetesService(namespace, name, 18080),
            deployment: this.getKubernetesDeployment(namespace, name, [ bootstrapContainer, metricsProxyContainer, modelServingContainer ]),
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

    private getModelServingContainer(workspaceId: string, image: string, name: string, port: number, healthCheckPath: string, initialDelaySeconds: number): KubernetesContainer 
    {
        return {
            name: name, image: image,
            ports: [ { name: "web", containerPort: port } ],
            env: [ { name: "MODEL_NAME", value: workspaceId } ],
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

    private getBootstrapContainer(workspaceId: string, image: string, name: string, initialDelaySeconds: number): KubernetesContainer 
    {
        return {
            name: name + "-bootstrap",
            image: image,
            args: [ "/bin/sh", "-c", "touch /tmp/healthy; sleep infinity" ],
            env: [
                { name: "DSP_API_ENDPOINT", value: "ntcore:8180" },
                { name: "DSP_WORKSPACE_ID", value: workspaceId }
            ],
            volumeMounts: [{ mountPath: "/models", name: name }],
            readinessProbe: {
                exec: { command: [ "cat", "/tmp/healthy" ] },
                initialDelaySeconds: initialDelaySeconds,
                periodSeconds: 10,
            }
        }
    }

    private getMetricsProxyContainer(workspaceId: string, image: string, name: string, backendPort: number, healthCheckPath: string, initialDelaySeconds: number): KubernetesContainer 
    {
        return {
            name: name + "-proxy",
            image: image,
            ports: [ { name: "web", containerPort: 18080 } ],
            args: [ "mitmdump", "-s", "/usr/local/bin/metrics_collector.py", "--listen-port", "18080" ],
            env: [
                { name: "DSP_MONITORING_ENDPOINT", value: "ntcore-monitoring:8180"},
                { name: "DSP_WORKSPACE_ID", value: workspaceId },
                { name: "DSP_BACKEND_PORT", value: `${backendPort}` }
            ],
            readinessProbe: {
                httpGet: { path: healthCheckPath, port: 18080 },
                initialDelaySeconds: initialDelaySeconds,
                periodSeconds: 10,
            }
        }
    }
}