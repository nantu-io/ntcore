import { KubernetesResourceMetadata, KubernetesTraefikIngressRoute } from "./KubeContainerGroup";

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

export class KubernetesIngressRoutesProviderV1Alpha1
{
    /**
     * Creates kubernetes ingress route.
     */
    public getKubernetesIngressRoute(namespace: string, name: string, entryPoints: string[], routes: KubernetesTraefikIngressRoute[]): KubernetesIngressRouteV1Alpha1 
    {
        return {
            apiVersion: "traefik.containo.us/v1alpha1",
            kind: "IngressRoute",
            metadata: {
                name: `${name}`,
                namespace: namespace,
            },
            spec: {
                entryPoints: entryPoints,
                routes: routes
            }
        }
    }

    /**
     * Creates match route with path prefix.
     */
    public getPathPrefixMatchedRoute(namespace: string, name: string, port: number, pathPrefix: string, middlewares: string[]): KubernetesTraefikIngressRoute
    {
        return {
            match: `PathPrefix(\`${pathPrefix}\`)`,
            kind: "Rule",
            services: [{ name: name, port: port }],
            middlewares: middlewares.map(name => ({ name: name, namespace: namespace })),
        }
    }

    /**
     * Creates match route with exact match.
     */
    public getPathMatchedRoute(namespace: string, name: string, port: number, path: string, middlewares: string[]): KubernetesTraefikIngressRoute
    {
        return {
            match: `Path(\`${path}\`)`,
            kind: "Rule",
            services: [{ name: name, port: port }],
            middlewares: middlewares.map(name => ({ name: name, namespace: namespace })),
        }
    }

    /**
     * Creates middleware to strip the path prefix.
     */
    public getStripPrefixMiddleware(namespace: string, name: string, stripPrefixes?: string[]): KubernetesIngressMiddlewareV1Alpha1
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

    /**
     * Creates middleware to replace the entire path.
     */
    public getReplacePathMiddleware(namespace: string, name: string, path: string): KubernetesIngressMiddlewareV1Alpha1
    {
        return {
            apiVersion: "traefik.containo.us/v1alpha1",
            kind: "Middleware",
            metadata: {
                name: `${name}`,
                namespace: namespace,
            },
            spec: {
                replacePath: {
                    path: path
                }
            }
        }   
    }
}