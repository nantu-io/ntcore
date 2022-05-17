import { IContainerGroup, IContainer } from "../ContainerGroupProvider";

/**
 * Kubernetes container service.
 */
export class KubernetesContainerGroup extends IContainerGroup 
{
    namespace?: string;
    service?: KubernetesServiceV1;
    deployment?: KubernetesDeploymentV1;
    ingress?: KubernetesIngressRouteV1Alpha1;
    middlewares?: KubernetesIngressMiddlewareV1Alpha1[];
}
/**
 * Kubernetes container.
 */
export class KubernetesContainer extends IContainer 
{
    name: string;
    image: string;
    env: KubernetesEnvironmentVariable[];
    ports: {
        name: string
        containerPort: number
    }[];
    readinessProbe?: {
        httpGet?: {
            path: string;
            port: number;
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
 * Kubernetes resource metadata.
 */
export class KubernetesResourceMetadata 
{
    namespace?: string;
    name?: string;
    labels?: {}
}
/**
 * Kubernetes environment variable.
 */
export class KubernetesEnvironmentVariable 
{
    name: string;
    value: string;
}
/**
 * Kubernetes service configuration.
 */
export class KubernetesServiceV1 
{
    apiVersion: string;
    kind: string;
    metadata: KubernetesResourceMetadata;
    spec?: {
        selector: {};
        ports: {
            name: string;
            port: number;
            protocol?: string;
            targetPort?: number;
        }[];
    }
}
/**
 * Kubernetes deployment.
 */
 export class KubernetesDeploymentV1 
 {
    kind: string;
    apiVersion: string;
    metadata: KubernetesResourceMetadata;
    spec?: {
        replicas: number;
        selector: {};
        template: {
            metadata: KubernetesResourceMetadata;
            spec: {
                containers: KubernetesContainer[];
            }
        };
    }
}
/**
 * Kubernetes ingress route.
 */
 export class KubernetesIngressRouteV1Alpha1 
 {
    kind: string;
    apiVersion: string;
    metadata: KubernetesResourceMetadata;
    spec?: {
        entryPoints: string[];
        routes: {
            match: string;
            kind: string;
            services: {
                name: string;
                port: number;
            }[],
            middlewares?: {
                name: string;
                namespace: string;
            }[]
        }[];
    }
}
/**
 * Kubernetes ingress middleware.
 */
export class KubernetesIngressMiddlewareV1Alpha1
{
    kind: string;
    apiVersion: string;
    metadata: KubernetesResourceMetadata;
    spec?: {
        stripPrefix?: {
            prefixes: string[];
        }
    }
}
/**
 * Kubernetes ingress v1.
 */
class KubernetesIngressV1 
{
    apiVersion: string;
    kind: string;
    metadata: KubernetesResourceMetadata;
    spec?: {
        rules: {
            http: {
                paths: {
                    pathType: "Prefix";
                    path: string;
                    backend: {
                        service: {
                            name: string,
                            port: { number: number }
                        }
                    }
                }[]
            }
        }[];
    };
}
/**
 * Kubernetes ingress v1beta1.
 */
class KubernetesIngressV1Beta1 
{
    apiVersion: string;
    kind: string;
    metadata: KubernetesResourceMetadata;
    spec?: {
        rules: {
            http: {
                paths: {
                    path: string;
                    backend: {
                        serviceName: string;
                        servicePort: number
                    }
                }[]
            }
        }[];
    };
}