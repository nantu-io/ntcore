import {
    GenericServiceProvider,
    ServiceState,
    GenericService,
    ServiceTypeMapping,
} from "../GenericServiceProvider";
import { LocalContainerService } from "./LocalContainerService";
import Dockerode = require("dockerode");

export class GenericLocalServiceProvider implements GenericServiceProvider 
{
    private readonly _dockerClient: Dockerode;

    constructor(dockerClient: Dockerode) {
        this._dockerClient = dockerClient;
    }

    /**
     * Provision the local container.
     * @param config Local container configuration.
     * @returns Promise of the local container configuration.
     */
    public async provision(config: LocalContainerService): Promise<GenericService> 
    {
        await this.buildLocalImage(config);
        return config;
    }

    /**
     * Start the local container.
     * @param config Local container configuration.
     * @returns Promise of the local container configuration.
     */
    public async start(config: LocalContainerService): Promise<GenericService> 
    {
        const container = await this.getContainerByName(config.name);
        if (container) {
            await this.stop(config);
            await this.delete(config);
        }
        await this.startLocalContainer(config);
        return config;
    }

    /**
     * Stop the local container.
     * @param config Local container configuration.
     * @returns Promise of the local container configuration.
     */
    public async stop(config: LocalContainerService): Promise<GenericService> 
    {
        try {
            const container = await this.getContainerByName(config.name);
            if (container) await container.stop()
        } catch (err) {
            // Don't do anything if container has already stopped
            if (err.statusCode !== 304) throw err;
        }
        return config;
    }

    /**
     * Delete the local container.
     * @param config Local container configuration.
     * @returns Promise of the local container configuration.
     */
    public async delete(config: LocalContainerService): Promise<GenericService> 
    {
        const container = await this.getContainerByName(config.name);
        if (container) {
            await container.remove()
        }
        return config;
    }

    /**
     * Execute command on the container.
     * @param config Local service config.
     * @returns Promise of the local container configuration.
     */
    public async update(config: LocalContainerService): Promise<GenericService> 
    {
        return config;
    }

    /**
     * Execute command on the container.
     * @param config Local service config.
     * @returns Promise of the local container configuration.
     */
    public async exec(name: string, command: string): Promise<any> 
    {
        const container = await this.getContainerByName(name);
        if (!container) {
            return;
        }
        const execObj = await container.exec({Cmd: ['/bin/bash', '-c', command]});
        await execObj.start({});
    }

    /**
     * Return the list of local containers.
     * @param config Local container configuration.
     * @returns Promise of the local container configuration list.
     */
    public listServices(): Promise<Array<GenericService>> 
    {
        return this.listContainers({});
    }

    /**
     * Wait for a specific state of a service.
     */
    public async getState(config: LocalContainerService): Promise<GenericService> 
    {
        const options = {"limit": 1, "filters": `{"name": ["/${config.name}"]}`};
        const containers = await this.listContainers(options);
        if (containers && containers.length > 0) {
            const container = containers[0];
            return { type: container.type, name: container.name, state: container.state };
        } else {
            return { type: null, name: config.name, state: ServiceState.UNKNOWN };
        }
    }

    private async buildLocalImage(config: LocalContainerService): Promise<any> 
    {
        const stream = await this._dockerClient.buildImage(
            { context: `${__dirname}/../dockerfiles/${config.type.toLowerCase()}`, src: ["Dockerfile"] }, 
            { t: config.Containers[0].Image }
        );
        await new Promise((resolve, reject) => {
            this._dockerClient.modem.followProgress(stream, (err: any, res: any) => err ? reject(err) : resolve(res));
        });
    }

    private async startLocalContainer(config: LocalContainerService) 
    {
        const containerConfig = config.Containers[0];
        const localContainerContext: Dockerode.ContainerCreateOptions = {
            name: config.name,
            ExposedPorts: config.ExposedPorts,
            Image: containerConfig.Image,
            HostConfig: containerConfig.HostConfig,
            Env: containerConfig.Env,
            Labels: containerConfig.Labels
        }
        return (await this._dockerClient.createContainer(localContainerContext)).start();
    }

    private async listContainers(options: {}): Promise<LocalContainerService[]> 
    {
        const containers = await this._dockerClient.listContainers(options);
        return containers.map((container: Dockerode.ContainerInfo) => ({
            type: ServiceTypeMapping[container.Labels['type']],
            state: this.mapServiceState(container),
            name: container.Names[0].substring(1),
            Containers: 
            [{
                name: container.Names[0].substring(1),
                Image: container.Image,
                Labels: container.Labels,
            }]
        }));
    }

    private mapServiceState(container: Dockerode.ContainerInfo): ServiceState 
    {
        const state = container.State;
        const status = container.Status;
        if (status.includes('(healthy)')) {
            return ServiceState.RUNNING;
        } else if (state === 'running') {
            return ServiceState.PENDING;
        } else {
            return ServiceState.INACTIVE;
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
