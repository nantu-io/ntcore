import { appConfig } from '../../../libs/config/AppConfigProvider';
import { DeploymentContext } from '../../deployment/DeploymentContextProvider';
import { KubernetesDeploymentV1, KubernetesContainer } from './KubeContainerGroup';

export class KubernetesDeploymentProviderV1
{
    public getKubernetesDeployment(namespace: string, deploymentContext: DeploymentContext)
    {
        const modelServingImage = appConfig.container.images[deploymentContext.type.toLowerCase()];
        const metricsProxyImage = appConfig.container.images['metricsProxy'];
        const bootstrapImage = appConfig.container.images['bootstrap'];
        const modelServingContainer = this.getModelServingContainer(modelServingImage, deploymentContext, 30);
        const metricsProxyContainer = this.getMetricsProxyContainer(metricsProxyImage, deploymentContext, 30);
        const bootstrapContainer = this.getBootstrapContainer(bootstrapImage, deploymentContext, 5);
        
        return this.createKubernetesDeployment(namespace, deploymentContext.name, [ bootstrapContainer, metricsProxyContainer, modelServingContainer ]);
    }

    private createKubernetesDeployment(namespace: string, name: string, containers: KubernetesContainer[]): KubernetesDeploymentV1 
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

    private getModelServingContainer(image: string, dc: DeploymentContext, initialDelaySeconds: number): KubernetesContainer 
    {
        return {
            name: `${dc.name}-core`,
            image: image,
            ports: [ { name: "web", containerPort: dc.servingConfig.targetPort } ],
            env: dc.servingConfig.environment,
            volumeMounts: [{ mountPath: "/models", name: dc.name }],
            readinessProbe: {
                httpGet: { path: dc.servingConfig.healthCheckPath, port: dc.servingConfig.targetPort },
                initialDelaySeconds: initialDelaySeconds,
                periodSeconds: 10,
            },
            resources: {
                requests: { /* memory: `${memory}Gi`, cpu: `${cpus}` */ }
            }
        }
    }

    private getBootstrapContainer(image: string, dc: DeploymentContext, initialDelaySeconds: number): KubernetesContainer 
    {
        return {
            name: `${dc.name}-bootstrap`,
            image: image,
            args: [ "/bin/sh", "-c", "touch /tmp/healthy; sleep infinity" ],
            env: [
                { name: "DSP_API_ENDPOINT", value: "ntcore:8180" },
                { name: "DSP_WORKSPACE_ID", value: dc.workspaceId }
            ],
            volumeMounts: [{ mountPath: "/models", name: dc.name }],
            readinessProbe: {
                exec: { command: [ "cat", "/tmp/healthy" ] },
                initialDelaySeconds: initialDelaySeconds,
                periodSeconds: 10,
            }
        }
    }

    private getMetricsProxyContainer(image: string, dc: DeploymentContext, initialDelaySeconds: number): KubernetesContainer 
    {
        return {
            name: `${dc.name}-proxy`,
            image: image,
            ports: [ { name: "web", containerPort: dc.listenPort } ],
            args: [ "mitmdump", "-s", "/usr/local/bin/metrics_collector.py", "--listen-port", dc.servingConfig.toString() ],
            env: [
                { name: "DSP_MONITORING_ENDPOINT", value: "ntcore-monitoring:8180"},
                { name: "DSP_WORKSPACE_ID", value: dc.workspaceId },
                { name: "DSP_BACKEND_PORT", value: dc.servingConfig.targetPort.toString() }
            ],
            readinessProbe: {
                httpGet: { path: dc.servingConfig.healthCheckPath, port: dc.listenPort },
                initialDelaySeconds: initialDelaySeconds,
                periodSeconds: 10,
            }
        }
    }
}