import { IContainerGroup, IContainer } from "../ContainerGroupProvider";
import { KubernetesDeploymentV1 } from "./KubeDeploymentProvider";
import { KubernetesIngressV1 } from "./KubeIngressProvider";
import { KubernetesServiceV1 } from "./KubeServiceProvider";

/**
 * Kubernetes container service.
 */
export class KubernetesContainerGroup extends IContainerGroup 
{
    namespace: string;
    service?: KubernetesServiceV1;
    deployment?: KubernetesDeploymentV1;
    ingressRoute?: KubernetesIngressRouteV1Alpha1;
    ingress?: KubernetesIngressV1;
    middlewares?: KubernetesIngressMiddlewareV1Alpha1[];
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
 * Kubernetes resource metadata.
 */
export class KubernetesResourceMetadata 
{
    namespace?: string;
    name?: string;
    labels?: {};
    annotations?: { [key: string]: string }
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
        },
        replacePath?: {
            path: string;
        }
    }
}

/**
 * Kubernetes traefik ingress route.
 */
export class KubernetesTraefikIngressRoute
{
    match: string;
    kind: string;
    services: { name: string, port: number }[];
    middlewares: { name: string, namespace: string }[];
}
/**
 * Kubernetes ingress route.
 */
export class KubernetesIngressRoute
{
    apiVersion: string;
    kind: string;
    metadata: KubernetesResourceMetadata;
    spec?: {
        entryPoints: string[],
        routes: KubernetesTraefikIngressRoute[];
    }
}