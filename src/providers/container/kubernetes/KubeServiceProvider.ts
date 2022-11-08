import { DeploymentContext } from "../../deployment/DeploymentContextProvider";
import { KubernetesResourceMetadata } from "./KubeContainerGroup";
import { interpolation } from 'interpolate-json';
import yaml = require('js-yaml');
import fs = require('fs');

/* Load service resource template from yaml */
const serviceResource = yaml.load(fs.readFileSync('app-config/kubernetes/service.yml', 'utf8'));

/**
 * Kubernetes service resource definition.
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
 * Kubernetes service resource provider.
 */
export class KubernetesServiceProviderV1
{
    /**
     * Generate the kubernetes service resource for model serving.
     * @param namespace kubernetes namespace
     * @param dc container group request context
     * @returns kubernetes service resource
     */
    public getKubernetesService(namespace: string, dc: DeploymentContext): KubernetesServiceV1 
    {
        return interpolation.expand(serviceResource, { namespace: namespace, name: dc.name, port: dc.listenPort });
    }
}