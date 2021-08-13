import { ServiceType, GenericServiceConfigProvider } from '../GenericServiceProvider';
import { LocalContainerService } from './LocalServiceProvider';
import { Runtime } from '../../../commons/Runtime';
import { Framework } from '../../../commons/Framework';

export class LocalServiceConfigProvider implements GenericServiceConfigProvider {
    /**
     * Provides local service configuration.
     * @param serviceType service type.
     * @param name service name.
     * @param cpu cpu number.
     * @param memory memory number in GB.
     */
    public createDevelopmentConfig(name: string, type: ServiceType, runtime: Runtime, cpus?: number, memory?: number, packages?: string[]): LocalContainerService {
        switch (type) {
            case ServiceType.JUPYTER: return this.createJupyterConfig(type, name, runtime, cpus, memory, packages);
            case ServiceType.THEIA_PYTHON: return this.createTheiaConfig(type, name, runtime, cpus, memory, packages);
            default: return this.createMinimalConfig(name);
        }
    }

    /**
     * Create local deployment configuration.
     * @param type service type.
     * @param workspaceId workspace id.
     * @param version model version.
     * @param cpu cpu units.
     * @param memory memory amount.
     * @param publishedPort 
     * @returns 
     */
    public createDeploymentConfig(type: ServiceType, workspaceId: string, version: number, runtime: Runtime, framework: Framework, cpus?: number, memory?: number, publishedPort?: number): LocalContainerService {
        switch (type) {
            case ServiceType.FLASK_SKLEARN: return this.createFlaskAPIConfig(type, workspaceId, version, runtime, framework, cpus, memory, publishedPort);
            case ServiceType.TENSORFLOW: return this.createTensorflowConfig(type, workspaceId, version, runtime, framework, cpus, memory, publishedPort);
            default: throw new Error('Invalid service type');
        }
    }

    private createJupyterConfig(type: ServiceType, name: string, runtime: Runtime, cpus?: number, memory?: number, packages?: string[]): LocalContainerService {
        const traefikLabel = `traefik.http.routers.${name}.rule`;
        const traefikValue = `PathPrefix(\`/i/${name}\`)`;
        return {
            type: type,
            name: name,
            ExposedPorts: { "8888/tcp": {} },
            Containers: [{
                Image: `ntcore/datascience-notebook:${runtime}`,
                HostConfig: { 
                    PortBindings: { },
                    NetworkMode: 'ntcore_gateway',
                    Mounts: [ { Target: '/home/jovyan', Source: name, Type: 'volume' } ],
                    CpuQuota: cpus * 100000, // CpuQuota * CpuPeriod
                    Memory: memory * 1024 * 1024 * 1024, // GB
                },
                Labels: {
                    type: type, 
                    [traefikLabel]: traefikValue,
                    'traefik.enable': 'true',
                },
                Env: [ 
                    `DSP_INSTANCE_NAME=${name}`,
                    `DSP_INSTANCE_HOME=/home/jovyan`,
                    `DSP_PYTHON_PACKAGES=${packages.join(' ')}`,
                    `DSP_RUNTIME_VERSION=${runtime}`,
                    `NTCORE_HOST=http://ntcore:8180`
                ],
            }],
        };
    }

    private createTheiaConfig(type: ServiceType, name: string, runtime: Runtime, cpus?: number, memory?: number, packages?: string[]): LocalContainerService {
        const traefikLabel = `traefik.http.routers.${name}.rule`;
        const traefikValue = `PathPrefix(\`/i/${name}\`)`;
        return {
            type: type,
            name: name,
            ExposedPorts: { "80/tcp": {} },
            Containers: [{
                Image: `ntcore/theia-python:${runtime}`,
                HostConfig: { 
                    PortBindings: { }, // Example: PortBindings: { "80/tcp": [{ HostPort: "3000" }] },
                    NetworkMode: 'ntcore_gateway',
                    Mounts: [ { Target: '/home/project', Source: name, Type: 'volume' } ],
                    CpuQuota: cpus * 100000, // CpuQuota * CpuPeriod
                    Memory: memory * 1024 * 1024 * 1024, // GB
                },
                Labels: {
                    type: type, 
                    [traefikLabel]: traefikValue,
                    'traefik.enable': 'true',
                },
                Env: [ 
                    `DSP_INSTANCE_NAME=${name}`,
                    `DSP_INSTANCE_HOME=/home/project`,
                    `DSP_PYTHON_PACKAGES=${packages.join(' ')}`,
                    `DSP_RUNTIME_VERSION=${runtime}`,
                    `NTCORE_HOST=http://ntcore:8180`
                ],
            }],
        };
    }

    private createFlaskAPIConfig(type: ServiceType, workspaceId: string, version: number, runtime: Runtime, framework: Framework, cpus?: number, memory?: number, publishedPort?: number): LocalContainerService {
        const traefikLabel = `traefik.http.routers.${workspaceId.toLowerCase()}.rule`;
        const traefikValue = `PathPrefix(\`/s/${workspaceId}\`)`;
        return {
            type: type,
            name: `flask-${workspaceId.toLowerCase()}`,
            ExposedPorts: { "8000/tcp": {} },
            Containers: [{
                HostConfig: { 
                    PortBindings: { },
                    NetworkMode: 'ntcore_gateway',
                    CpuQuota: cpus * 100000, // CpuQuota * CpuPeriod
                    Memory: memory * 1024 * 1024 * 1024, // GB
                },
                Image: `ntcore/flask-${framework}:${runtime}`,
                Labels: { 
                    [traefikLabel]: traefikValue,
                    'traefik.enable': 'true',
                },
                Env: [
                    'DSP_API_ENDPOINT=ntcore:8180',
                    `DSP_WORKSPACE_ID=${workspaceId}`,
                    `DSP_MODEL_VERSION=${version}`,
                    `NTCORE_HOST=ntcore:8180`
                ],
            }],
        };
    }

    private createTensorflowConfig(type: ServiceType, workspaceId: string, version: number, runtime: Runtime, framework: Framework, cpus?: number, memory?: number, publishedPort?: number): LocalContainerService {
        const traefikLabel = `traefik.http.routers.${workspaceId.toLowerCase()}.rule`;
        const traefikValue = `PathPrefix(\`/s/${workspaceId}\`)`;
        return {
            type: type,
            name: `tensorflow-${workspaceId.toLowerCase()}`,
            ExposedPorts: { "8000/tcp": {} },
            Containers: [{
                HostConfig: { 
                    PortBindings: { },
                    NetworkMode: 'ntcore_gateway',
                    CpuQuota: cpus * 100000, // CpuQuota * CpuPeriod
                    Memory: memory * 1024 * 1024 * 1024, // GB
                },
                Image: `ntcore/tensorflow`,
                Labels: { 
                    [traefikLabel]: traefikValue,
                    'traefik.enable': 'true',
                },
                Env: [
                    'DSP_API_ENDPOINT=ntcore:8180',
                    `DSP_WORKSPACE_ID=${workspaceId}`,
                    `DSP_MODEL_VERSION=${version}`,
                    `NTCORE_HOST=ntcore:8180`
                ],
            }],
        };
    }

    /**
     * Provides the minimal container config with only name.
     * @param name container name.
     * @returns 
     */
    private createMinimalConfig(name: string): LocalContainerService  {
        return { name: name }
    }
}