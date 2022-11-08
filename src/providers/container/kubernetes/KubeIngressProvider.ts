import { DeploymentContext } from "../../deployment/DeploymentContextProvider";
import { KubernetesResourceMetadata } from "./KubeContainerGroup";

/**
 * Kubernetes ingress definition.
 */
export class KubernetesIngressV1
{
    apiVersion: string;
    kind: string;
    metadata: KubernetesResourceMetadata;
    spec?: {
        rules: {
            http: {
                paths: {
                    pathType: "Prefix" | "Exact";
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

export class KubernetesIngressProviderV1
{
    /**
     * Generate the nginx ingress for target service.
     * @param namespace kubernetes namespace
     * @param dc container group request context
     * @returns kubernetes ingress object
     */
    public getKubernetesIngress(namespace: string, dc: DeploymentContext): KubernetesIngressV1
    {
        return {
            apiVersion: "networking.k8s.io/v1",
            kind: "Ingress",
            metadata: {
                namespace: namespace,
                name: dc.name,
                annotations: {
                    "nginx.ingress.kubernetes.io/rewrite-target": dc.servingConfig.targetPath,
                    "kubernetes.io/ingress.class": "nginx"
                }
            },
            spec: {
                rules: [{
                    http: {
                        paths: [ { path: dc.servingConfig.sourcePath, pathType: "Exact", backend: { service: { name: dc.name, port: { number: dc.listenPort } } } } ]
                    }
                }]
            }
        }
    }
}