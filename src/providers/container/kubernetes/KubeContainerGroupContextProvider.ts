import { ContainerGroupType, ContainerGroupRequestContext, IContainerGroupContextProvider } from '../ContainerGroupProvider';
import { KubernetesContainerGroup, KubernetesDeploymentV1, KubernetesIngressRouteV1Alpha1, KubernetesServiceV1, KubernetesContainer, KubernetesIngressMiddlewareV1Alpha1 } from './KubeContainerGroup';
import { appConfig } from '../../../libs/config/AppConfigProvider';

export class KubernetesContainerGroupContextProvider implements IContainerGroupContextProvider 
{
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
        const container = this.getKubernetesContainer(workspaceId, `ntcore/flask-sklearn`, name, 8000, `/s/${workspaceId}/healthcheck`, 120);
        return {
            name, 
            type: requestContext.type,
            namespace: namespace,
            service: this.getKubernetesService(namespace, name, 8000),
            deployment: this.getKubernetesDeployment(namespace, name, [ container ]),
            ingress: this.getKubernetesIngressRoute(namespace, name, 8000, `/s/${workspaceId}`, [])
        }
    }

    private getTensorflowAPIContext(requestContext: ContainerGroupRequestContext): KubernetesContainerGroup 
    {
        const namespace = appConfig.container.namespace;
        const workspaceId = requestContext.workspaceId;
        const name = `ntcore-${workspaceId.toLocaleLowerCase()}`;
        const container = this.getKubernetesContainer(workspaceId, `ntcore/tensorflow-serving`, name, 8501, `/s/${workspaceId}/healthcheck`, 300);
        return {
            name, 
            type: requestContext.type,
            namespace: namespace,
            service: this.getKubernetesService(namespace, name, 8501),
            deployment: this.getKubernetesDeployment(namespace, name, [ container ]),
            ingress: this.getKubernetesIngressRoute(namespace, name, 8501, `/s/${workspaceId}`, [])
        }
    }

    private getTorchAPIContext(requestContext: ContainerGroupRequestContext): KubernetesContainerGroup 
    {
        const namespace = appConfig.container.namespace;
        const workspaceId = requestContext.workspaceId;
        const name = `ntcore-${workspaceId.toLocaleLowerCase()}`;
        const container = this.getKubernetesContainer(workspaceId, `ntcore/fast-torch`, name, 80, `/health`, 120);
        const stripPrefixesMiddleware = this.getKubernetesIngressMiddleware(namespace, name, [ `/s/${workspaceId}` ]);
        return {
            name, 
            type: requestContext.type,
            namespace: namespace,
            service: this.getKubernetesService(namespace, name, 80),
            deployment: this.getKubernetesDeployment(namespace, name, [ container ]),
            ingress: this.getKubernetesIngressRoute(namespace, name, 80, `/s/${workspaceId}`, [ name ]),
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

    private getKubernetesIngressRoute(namespace: string, name: string, port: number, pathPrefix: string, middlewares: string[]): KubernetesIngressRouteV1Alpha1 
    {
        return {
            apiVersion: "traefik.containo.us/v1alpha1",
            kind: "IngressRoute",
            metadata: {
                name: `${name}`,
                namespace: namespace,
            },
            spec: {
                entryPoints: ['web'],
                routes: [{
                    match: `PathPrefix(\`${pathPrefix}\`)`,
                    kind: "Rule",
                    services: [{ name: name, port: port }],
                    middlewares: middlewares.map(name => { return { name: name, namespace: namespace }}),
                }]
            }
        }
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

    private getKubernetesIngressMiddleware(namespace: string, name: string, stripPrefixes?: string[]): KubernetesIngressMiddlewareV1Alpha1
    {
        return {
            apiVersion: "traefik.containo.us/v1alpha1",
            kind: "Middleware",
            metadata: {
                name: `${name}`,
                namespace: namespace,
            },
            spec: {
                stripPrefix: {
                    prefixes: stripPrefixes
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