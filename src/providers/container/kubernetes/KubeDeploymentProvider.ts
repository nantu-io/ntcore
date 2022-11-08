import { appConfig } from '../../../libs/config/AppConfigProvider';
import { DeploymentContext } from '../../deployment/DeploymentContextProvider';
import { KubernetesContainer, KubernetesResourceMetadata } from './KubeContainerGroup';
import { interpolation } from 'interpolate-json';
import yaml = require('js-yaml');
import fs = require('fs');

/* Load deployment resource template from yaml */
const deploymentResource = yaml.load(fs.readFileSync('app-config/kubernetes/deployment.yml', 'utf8'));
/* Load container templates from yaml */
const containerTemplates = yaml.load(fs.readFileSync('app-config/kubernetes/containers.yml', 'utf8'));

/**
 * Kubernetes deployment resource definition.
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
                volumes: { name: string; emptyDir: {} }[]
            }
        };
    }
}

/**
 * Kubernetes deployment resource provider.
 */
export class KubernetesDeploymentProviderV1
{
    /**
     * Generate the kubernetes deployment resource for model serving.
     * @param namespace kubernetes namespace
     * @param dc container group request context
     * @returns kubernetes deployment resource
     */
    public getKubernetesDeployment(namespace: string, dc: DeploymentContext)
    {
        const modelServingImage = appConfig.container.images[dc.type.toLowerCase()];
        const modelServingContainer = this.getModelServingContainer(modelServingImage, dc);
        const metricsProxyContainer = this.getMetricsProxyContainer(dc);
        const bootstrapContainer = this.getBootstrapContainer(dc);

        return this.createKubernetesDeployment(namespace, dc.name, [ bootstrapContainer, metricsProxyContainer, modelServingContainer ]);
    }

    private createKubernetesDeployment(namespace: string, name: string, containers: KubernetesContainer[]): KubernetesDeploymentV1 
    {
        const deployment = interpolation.expand(deploymentResource, { namespace, name, replicas: 1 }) as KubernetesDeploymentV1;
        deployment.spec.template.spec.containers = containers;
        return deployment;
    }

    private getModelServingContainer(image: string, dc: DeploymentContext): KubernetesContainer 
    {
        const container = interpolation.expand(containerTemplates['modelServing'], 
            { image, name: dc.name, targetPort: dc.servingConfig.targetPort, healthCheckPath: dc.servingConfig.healthCheckPath, initialDelaySeconds: 30, periodSeconds: 10 }) as KubernetesContainer;
        container.env = dc.servingConfig.environment;
        return container;
    }

    private getMetricsProxyContainer(dc: DeploymentContext): KubernetesContainer 
    {
        return interpolation.expand(containerTemplates['metricsProxy'], 
            { name: dc.name, workspaceId: dc.workspaceId, listenPort: dc.listenPort, targetPort: dc.servingConfig.targetPort, healthCheckPath: dc.servingConfig.healthCheckPath, initialDelaySeconds: 30, periodSeconds: 10 });
    }

    private getBootstrapContainer(dc: DeploymentContext): KubernetesContainer 
    {
        return interpolation.expand(containerTemplates['bootstrap'], { name: dc.name, workspaceId: dc.workspaceId, initialDelaySeconds: 5, periodSeconds: 10 });
    }
}