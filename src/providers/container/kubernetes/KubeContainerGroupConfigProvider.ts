import { ContainerGroupType, IContainerGroupConfigProvider } from '../ContainerGroupProvider';
import { Runtime } from '../../../commons/Runtime';
import { Framework } from '../../../commons/Framework';
import { KubernetesContainerGroup, KubernetesDeploymentV1, KubernetesIngressRouteV1Alpha1, KubernetesServiceV1, KubernetesContainer, KubernetesEnvironmentVariable } from './KubeContainerGroup';

export class KubernetesContainerGroupConfigProvider implements IContainerGroupConfigProvider 
{
    /**
     * Provides kubernetes service configuration.
     * @param name Service name generated based on service type and user name.
     * @param type Service type, i.e., JUPYTER, FLASK_SKLEARN etc.
     * @param runtime python runtime with version, e.g., python-3.8.
     * @param cpus Requested cpu units. See https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/#cpu-units.
     * @param memory Requested memory in GB.
     * @param packages List of packages to install when instance starts.
     * @returns Kubernetes service configuration.
     */
    public createDevelopmentConfig(name: string, type: ContainerGroupType, runtime: Runtime, cpus?: number, memory?: number, packages?: string[]): KubernetesContainerGroup {
        const serviceName = name.replace(/_/g, "-");
        switch (type) {
            case ContainerGroupType.JUPYTER: return this.createJupyterConfig(type, serviceName, runtime, cpus, memory, packages);
            case ContainerGroupType.THEIA_PYTHON: return this.createTheiaConfig(type, serviceName, runtime, cpus, memory, packages);
            default: return this.createMinimalConfig('default', serviceName);
        }
    }

    /**
     * Create kubernetes service configuration to deploy API for the given machine learning model.
     * @param type Service type, i.e., JUPYTER, FLASK_SKLEARN etc.
     * @param workspaceId Workspace id.
     * @param version Model version from experiments.
     * @param cpus Requested cpu units. See https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/#cpu-units.
     * @param memory Requested memory in GB.
     * @returns Kubernetes service configuration.
     */
    public createDeploymentConfig(type: ContainerGroupType, workspaceId: string, version: number, runtime: Runtime, framework: Framework, cpus?: number, memory?: number): KubernetesContainerGroup {
        switch (type) {
            case ContainerGroupType.FLASK_SKLEARN: return this.createFlaskSklearnConfig(type, workspaceId, framework, version, runtime, cpus, memory);
            default: throw new Error('Invalid service type');
        }
    }

    private createJupyterConfig(type: ContainerGroupType, name: string, runtime: Runtime, cpus?: number, memory?: number, packages?: string[]): KubernetesContainerGroup {
        const namespace = "default";
        const kubernetesEnv = this.getKubernetesEnvironmentVariables(name, runtime, "/home/jovyan", packages, null, null);
        const container = this.getKubernetesContainer(name, 8888, `ntcore/datascience-notebook:${runtime}`, kubernetesEnv, cpus, memory, `/i/${name}/static/base/images/favicon.ico`, 300);
        return {
            name, type,
            namespace: namespace,
            service: this.getKubernetesService(namespace, name, 8888),
            deployment: this.getKubernetesDeployment(namespace, name, [ container ]),
            ingress: this.getKubernetesIngressRoute(namespace, name, 8888, `/i/${name}`)
        }
    }

    private createTheiaConfig(type: ContainerGroupType, name: string, runtime: Runtime, cpus?: number, memory?: number, packages?: string[]): KubernetesContainerGroup {
        const namespace = "default";
        const kubernetesEnv = this.getKubernetesEnvironmentVariables(name, runtime, "/home/project", packages, null, null);
        const container = this.getKubernetesContainer(name, 80, `ntcore/theia-python:${runtime}`, kubernetesEnv, cpus, memory, `/i/${name}/`, 300);
        return {
            name, type,
            namespace: namespace,
            service: this.getKubernetesService(namespace, name, 80),
            deployment: this.getKubernetesDeployment(namespace, name, [ container ]),
            ingress: this.getKubernetesIngressRoute(namespace, name, 80, `/i/${name}`)
        }
    }

    private createFlaskSklearnConfig(type: ContainerGroupType, workspaceId: string, framework: Framework, version: number, runtime: Runtime, cpus?: number, memory?: number): KubernetesContainerGroup {
        const namespace = "default";
        const name = `flask-${workspaceId.toLocaleLowerCase()}`;
        const kubernetesEnv = this.getKubernetesEnvironmentVariables(name, runtime, null, null, workspaceId, version);
        const container = this.getKubernetesContainer(name, 8000, `ntcore/flask-${framework}:${runtime}`, kubernetesEnv, cpus, memory, `/s/${workspaceId}/healthcheck`, 120);
        return {
            name, type,
            namespace: namespace,
            service: this.getKubernetesService(namespace, name, 8000),
            deployment: this.getKubernetesDeployment(namespace, name, [ container ]),
            ingress: this.getKubernetesIngressRoute(namespace, name, 8000, `/s/${workspaceId}`)
        }
    }

    private getKubernetesService(namespace: string, serviceName: string, servicePort: number): KubernetesServiceV1 {
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

    private getKubernetesIngressRoute(namespace: string, name: string, port: number, pathPrefix: string): KubernetesIngressRouteV1Alpha1 {
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
                    services: [{
                        name: name,
                        port: port
                    }]
                }]
            }
        }
    }

    private getKubernetesDeployment(namespace: string, name: string, containers: KubernetesContainer[]): KubernetesDeploymentV1 {
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

    private getKubernetesContainer(name: string, port: number, image: string, env: KubernetesEnvironmentVariable[], cpus: number, memory: number, healthCheckPath: string, initialDelaySeconds: number): KubernetesContainer {
        return {
            name: name,
            image: image,
            ports: [ { name: "web", containerPort: port } ],
            env: env,
            readinessProbe: {
                httpGet: { 
                    path: healthCheckPath,
                    port: port
                },
                initialDelaySeconds: initialDelaySeconds,
                periodSeconds: 10,
            },
            resources: {
                requests: {
                    memory: `${memory}Gi`,
                    cpu: `${cpus}`
                }
            }
        }
    }

    private getKubernetesEnvironmentVariables(serviceName?: string, runtime?: string, home?: string, packages?: string[], workspaceId?: string, version?: number): KubernetesEnvironmentVariable[] {
        const env = [ { name: "NTCORE_HOST", value: "http://ntcore:8180" }, { name: "DSP_API_ENDPOINT", value: "ntcore:8180" } ];
        if (serviceName) env.push({ name: "DSP_INSTANCE_NAME", value: serviceName });
        if (home) env.push({ name: "DSP_INSTANCE_HOME", value: home });
        if (packages) env.push({ name: "DSP_PYTHON_PACKAGES", value: `${packages.join(' ')}` });
        if (runtime) env.push({ name: "DSP_RUNTIME_VERSION", value: runtime });
        if (workspaceId) env.push({ name: "DSP_WORKSPACE_ID", value: workspaceId });
        if (version) env.push({ name: "DSP_MODEL_VERSION", value: `${version}` });
        
        return env;
    }

    /**
     * Provides the minimal container config with only name.
     * @param name container name.
     * @returns 
     */
     private createMinimalConfig(namespace: string, name: string): KubernetesContainerGroup  {
        return { 
            namespace: namespace, 
            name: name,
            service: {
                apiVersion: "v1",
                kind: "Service",
                metadata: { name: name, namespace: namespace }
            },
            ingress: {
                apiVersion: "traefik.containo.us/v1alpha1",
                kind: "IngressRoute",
                metadata: { name: name, namespace: namespace }
            },
            deployment: {
                kind: "Deployment",
                apiVersion: "apps/v1",
                metadata: { namespace: namespace, name: name, labels: { app: name } }
            }
        }
    }
}