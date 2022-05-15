import { IContainerGroupProvider,  ContainerGroupState, IContainerGroup, ContainerGroupTypeMapping } from "../ContainerGroupProvider";
import { DockerContainerGroup } from "./DockerContainerGroup";
import { NotImplementedException } from "../../../commons/Errors";
import Dockerode = require("dockerode");

export class DockerContainerGroupProvider implements IContainerGroupProvider 
{
    private readonly _dockerClient: Dockerode;

    constructor(dockerClient: Dockerode) 
    {
        this._dockerClient = dockerClient;
    }

    /**
     * Provisions docker container.
     * @param context docker container creation context.
     * @returns Promise of the docker container context.
     */
    public async provision(context: DockerContainerGroup): Promise<IContainerGroup> 
    {
        return await this.buildImage(context);
    }

    /**
     * Starts docker container.
     * @param context docker container creation context.
     * @returns Promise of the docker container context.
     */
    public async start(context: DockerContainerGroup): Promise<IContainerGroup> 
    {
        const container = await this.getContainerByName(context.name);
        if (container) {
            await this.stop(context);
            await this.delete(context);
        }
        return (await this.startContainer(context));
    }

    /**
     * Stops docker container.
     * @param context docker container stopping context.
     * @returns Promise of the docker container context.
     */
    public async stop(context: DockerContainerGroup): Promise<IContainerGroup> 
    {
        try {
            const container = await this.getContainerByName(context.name);
            if (container) await container.stop()
        } catch (err) {
            // Don't do anything if container has already stopped
            if (err.statusCode !== 304) throw err;
        }
        return context;
    }

    /**
     * Deletes docker container.
     * @param context docker container deletion context.
     * @returns Promise of the docker container context.
     */
    public async delete(context: DockerContainerGroup): Promise<IContainerGroup> 
    {
        const container = await this.getContainerByName(context.name);
        if (container) {
            await container.remove()
        }
        return context;
    }

    /**
     * Updates docker container.
     * @param context docker container update context.
     * @returns Promise of the docker container context.
     */
    public async update(context: DockerContainerGroup): Promise<IContainerGroup> 
    {
        throw new NotImplementedException();
    }

    /**
     * Gets current docker container state.
     * @param context docker container state retrieval context.  
     * @returns Promise of the docker container context with state.
     */
    public async getState(context: DockerContainerGroup): Promise<IContainerGroup> 
    {
        const options = {"limit": 1, "filters": `{"name": ["/${context.name}"]}`};
        const containers = await this.listContainers(options);
        if (containers && containers.length > 0) {
            return { type: containers[0].type, name: containers[0].name, state: containers[0].state };
        } else {
            return { type: null, name: context.name, state: ContainerGroupState.UNKNOWN };
        }
    }

    /**
     * Gets log events from docker container.
     * @param context docker container logs retrieval context.  
     */
    public async getLogs(context: DockerContainerGroup): Promise<string>
    {
        throw new NotImplementedException();
    }

    private async buildImage(context: DockerContainerGroup): Promise<IContainerGroup> 
    {
        const stream = await this._dockerClient.buildImage(
            { context: `${__dirname}/../dockerfiles/${context.type.toLowerCase()}`, src: ["Dockerfile"] }, 
            { t: context.Containers[0].Image }
        );
        await new Promise((resolve, reject) => {
            this._dockerClient.modem.followProgress(stream, (err: any, res: any) => err ? reject(err) : resolve(res));
        });
        return context;
    }

    private async startContainer(context: DockerContainerGroup): Promise<IContainerGroup>
    {
        (await this._dockerClient.createContainer({
            name: context.name,
            ExposedPorts: context.ExposedPorts,
            Image: context.Containers[0].Image,
            HostConfig: context.Containers[0].HostConfig,
            Env: context.Containers[0].Env,
            Labels: context.Containers[0].Labels
        })).start();
        return context;
    }

    private async listContainers(options: {}): Promise<DockerContainerGroup[]> 
    {
        return (await this._dockerClient.listContainers(options)).map(res => this.containerInfoToContainerGroupContext(res));
    }

    private containerInfoToContainerGroupContext(container: Dockerode.ContainerInfo): DockerContainerGroup
    {
        return {
            type: ContainerGroupTypeMapping[container.Labels['type']],
            state: this.containerInfoToContainerGroupState(container),
            name: container.Names[0].substring(1),
            Containers: [{
                name: container.Names[0].substring(1),
                Image: container.Image,
                Labels: container.Labels,
            }]
        }
    }

    private containerInfoToContainerGroupState(container: Dockerode.ContainerInfo): ContainerGroupState 
    {
        if (container.Status.includes('(healthy)')) {
            return ContainerGroupState.RUNNING;
        } else if (container.State === 'running' || container.State === 'created') {
            return ContainerGroupState.PENDING;
        } else {
            return ContainerGroupState.INACTIVE;
        }
    }

    private async getContainerByName(name: string): Promise<Dockerode.Container> 
    {
        const options = {"limit": 1, "filters": `{"name": ["/${name}"]}`};
        const containers = await this._dockerClient.listContainers(options);
        if (!containers || containers.length === 0) {
            return null;
        }
        return this._dockerClient.getContainer(containers[0].Id);
    }
}
