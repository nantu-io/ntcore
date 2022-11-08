import { DeploymentContext } from "../../deployment/DeploymentContextProvider";
import { KubernetesResourceMetadata } from "./KubeContainerGroupContextProvider";
import { interpolation } from 'interpolate-json';
import yaml = require('js-yaml');
import fs = require('fs');

/* Load ingress resource template from yaml */
const ingressResource = yaml.load(fs.readFileSync('app-config/kubernetes/ingress.yml', 'utf8'));

/**
 * Kubernetes ingress resource definition.
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

/**
 * Kubernetes ingress resource provider.
 */
export class KubernetesIngressProviderV1
{
    /**
     * Generate the kubernetes nginx ingress for model serving.
     * @param namespace kubernetes namespace
     * @param dc container group request context
     * @returns kubernetes ingress resource
     */
    public getKubernetesIngress(namespace: string, dc: DeploymentContext): KubernetesIngressV1
    {
        return interpolation.expand(ingressResource, { namespace, name: dc.name, sourcePath: dc.servingConfig.sourcePath, targetPath: dc.servingConfig.targetPath, listenPort: dc.listenPort });
    }
}