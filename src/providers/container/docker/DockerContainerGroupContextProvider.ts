import { ContainerGroupType, IContainerGroupContextProvider } from '../ContainerGroupProvider';
import { DockerContainer, DockerContainerGroup } from './DockerContainerGroup';
import { appConfig } from '../../../libs/config/AppConfigProvider';
import { DeploymentContext } from '../../deployment/DeploymentContextProvider';

export class DockerContainerGroupContextProvider implements IContainerGroupContextProvider 
{
    /**
     * Provides the docker container creation context.
     * @param requestContext request context.
     * @returns context for docker container creation.
     */
    public getContext(requestContext: DeploymentContext): DockerContainerGroup 
    {
        switch (requestContext.type) {
            case ContainerGroupType.SKLEARN: return this.getSklearnAPIContext(requestContext);
            case ContainerGroupType.TENSORFLOW: return this.getTensorflowAPIContext(requestContext);
            case ContainerGroupType.PYTORCH: return this.getTorchAPIContext(requestContext);
            default: throw new Error('Invalid container group type.');
        }
    }

    private getSklearnAPIContext(requestContext: DeploymentContext): DockerContainerGroup
    {
        const workspaceId = requestContext.workspaceId;
        const labels = {
            [`traefik.http.routers.${workspaceId.toLowerCase()}.rule`]: `PathPrefix(\`/s/${workspaceId}\`)`,
            [`traefik.enable`]: `true`,
        }
        return {
            name: `ntcore-${workspaceId.toLowerCase()}`,
            type: requestContext.type,
            ExposedPorts: { "8000/tcp": {} },
            Containers: [this.getContainer(requestContext, appConfig.container.images['sklearn'], labels)],
        };
    }

    private getTensorflowAPIContext(requestContext: DeploymentContext): DockerContainerGroup 
    {
        const workspaceId = requestContext.workspaceId;
        const labels = {
            [`traefik.http.routers.${workspaceId.toLowerCase()}.rule`]: `Path(\`/s/${workspaceId}/predict\`)`,
            [`traefik.http.middlewares.${workspaceId.toLowerCase()}.replacepath.path`]: `/v1/models/${workspaceId}:predict`,
            [`traefik.http.services.${workspaceId.toLowerCase()}.loadbalancer.server.port`]: `8501`,
            [`traefik.http.routers.${workspaceId.toLowerCase()}.middlewares`]: `${workspaceId.toLowerCase()}`,
            [`traefik.enable`]: `true`,
        }
        return {
            name: `ntcore-${workspaceId.toLowerCase()}`,
            type: requestContext.type,
            ExposedPorts: { "8501/tcp": {} },
            Containers: [this.getContainer(requestContext, appConfig.container.images['tensorflow'], labels)],
        };
    }

    private getTorchAPIContext(requestContext: DeploymentContext): DockerContainerGroup
    {
        const workspaceId = requestContext.workspaceId;
        const labels = { 
            [`traefik.http.routers.${workspaceId.toLowerCase()}.rule`]: `PathPrefix(\`/s/${workspaceId}\`)`,
            [`traefik.http.middlewares.${workspaceId.toLowerCase()}.stripprefix.prefixes`]: `/s/${workspaceId}`,
            [`traefik.http.routers.${workspaceId.toLowerCase()}.middlewares`]: `${workspaceId.toLowerCase()}`,
            [`traefik.enable`]: `true`,
        };
        return {
            name: `ntcore-${workspaceId.toLowerCase()}`,
            type: requestContext.type,
            ExposedPorts: { "80/tcp": {} },
            Containers: [this.getContainer(requestContext, appConfig.container.images['pytorch'], labels)],
        };
    }

    private getContainer(requestContext: DeploymentContext, image: string, labels: { [label: string]: string; }): DockerContainer
    {
        return {
            Image: image,
            Labels: labels,
            HostConfig: {
                PortBindings: { },
                NetworkMode: 'ntcore_gateway',
            },
            Env: [
                'DSP_API_ENDPOINT=ntcore:8180',
                'DSP_MONITORING_ENDPOINT=ntcore-monitoring:8180',
                `DSP_WORKSPACE_ID=${requestContext.workspaceId}`,
                `DSP_MODEL_VERSION=${requestContext.version}`,
            ],
        }
    }
}