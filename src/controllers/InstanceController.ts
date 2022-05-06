import { Request, Response } from 'express';
import { IContainerGroup, ContainerGroupState } from "../providers/container/ContainerGroupProvider";
import { ContainerProviderFactory, ContainerGroupConfigProviderFactory } from '../providers/container/ContainerGroupProviderFactory';
import { IContainerGroupProvider, IContainerGroupConfigProvider, ContainerGroupTypeMapping } from "../providers/container/ContainerGroupProvider";
import { waitUntil } from 'async-wait-until';
import { RuntimeMapping } from '../commons/Runtime';
import { ContainerTimeoutException } from "../commons/Errors"
import { containerGroupStateProvider } from "../libs/config/AppModule";

export class InstanceController 
{
    private readonly _configProvider: IContainerGroupConfigProvider;
    private readonly _serviceProvider: IContainerGroupProvider;

    public constructor() 
    {
        this._serviceProvider = new ContainerProviderFactory().createProvider();
        this._configProvider = new ContainerGroupConfigProviderFactory().createProvider();
        this.createServiceV1 = this.createServiceV1.bind(this);
        this.getServiceStateV1 = this.getServiceStateV1.bind(this);
        this.stopServiceV1 = this.stopServiceV1.bind(this);
        this.deleteServiceV1 = this.deleteServiceV1.bind(this);
        this.listServicesV1 = this.listServicesV1.bind(this);
    }

    /**
     * Endpoint to create a service.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -H "Content-Type: application/json" -d '{"type":"JUPYTER", "cpus":1, "memory":2, "runtime": "python-3.8"}' -X POST http://localhost:8180/dsp/api/v1/service
     */
    public async createServiceV1(req: Request, res: Response) 
    {
        const type = ContainerGroupTypeMapping[req.body.type];
        const runtime = RuntimeMapping[req.body.runtime];
        const cpus = req.body.cpus ? parseFloat(req.body.cpus) : 0;
        const memory = req.body.memory ? parseInt(req.body.memory) : 0;
        const packages = (req.body.packages) ? req.body.packages : [];
        const username = 'ntcore';
        const name = `${type.toLowerCase()}_${username}`;
        const config = this._configProvider.createDevelopmentConfig(name, type, runtime, cpus, memory, packages);

        try {
            await containerGroupStateProvider.record(config, username, ContainerGroupState.PENDING, runtime, cpus, memory, packages);
            res.status(201).send({ name: name, status: ContainerGroupState.PENDING });
            await this._serviceProvider.provision(config);
            await this._serviceProvider.start(config);
            const result = await this.waitForInstanceState(config, ContainerGroupState.RUNNING);
            const state = result ? ContainerGroupState.RUNNING : ContainerGroupState.INACTIVE;
            await containerGroupStateProvider.record(config, username, state);
        } catch (err) {
            await this.handleServiceProviderError(err, config, username);
        }
    }

    /**
     * Endpoint to stop a service.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -H 'Content-Type: application/json' -X PUT http://localhost:8180/dsp/api/v1/service/:name
     */
    public async stopServiceV1(req: Request, res: Response) 
    {
        const username = 'ntcore';
        const name = req.params.name;
        const config = this._configProvider.createDevelopmentConfig(name);

        try {
            await this._serviceProvider.getState(config);
            await containerGroupStateProvider.record(config, username, ContainerGroupState.STOPPING);
            res.status(201).send(config);
            await this._serviceProvider.stop(config);
            await this.waitForInstanceState(config, ContainerGroupState.INACTIVE);
            await containerGroupStateProvider.record(config, username, ContainerGroupState.STOPPED);
        } catch (err) {
            await this.handleServiceProviderError(err, config, username);
        }
    }

    /**
     * Endpoint to delete a service.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X DELETE http://localhost:8180/dsp/api/v1/service/:name
     */
    public async deleteServiceV1(req: Request, res: Response) 
    {
        const username = 'ntcore';
        const name = req.params.name;
        const config = this._configProvider.createDevelopmentConfig(name);

        try {
            await this._serviceProvider.getState(config);
            await containerGroupStateProvider.record(config, username, ContainerGroupState.STOPPING);
            res.status(201).send(config);
            await this._serviceProvider.stop(config);
            await this.waitForInstanceState(config, ContainerGroupState.INACTIVE);
            await this._serviceProvider.delete(config);
            await containerGroupStateProvider.record(config, username, ContainerGroupState.INACTIVE);
        } catch (err) {
            await this.handleServiceProviderError(err, config, username);
        }
    }

    /**
     * Endpoint to list services based on the given username.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X GET 'http://localhost:8180/dsp/api/v1/services'
     */
    public async listServicesV1(req: Request, res: Response) 
    {
        try {
            const services = await containerGroupStateProvider.list('ntcore');
            res.status(200).send(services);
        } catch (err) {
            res.status(500).send({ error: `Failed to list local containers: ${err}` });
        }
    }

    /**
     * Endpoint to retrieve a service object based on the given service name.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/service/{name}
     */
    public async getServiceStateV1(req: Request, res: Response) 
    {
        try {
            const state = await containerGroupStateProvider.get(req.params.name, 'ntcore');
            res.status(200).send(state);
        } catch (err) {
            res.status(500).send({ error: `Failed to get instance state: ${err}` });
        }
    }

    /**
     * Wait until the actual service state equals to the target service state.
     * @param config service configuration.
     * @param targetState target service state.
     * @returns service configuration.
     */
    private async waitForInstanceState(config: IContainerGroup, targetState: ContainerGroupState) 
    {
        try {
            return await waitUntil(async () => (await this._serviceProvider.getState(config)).state === targetState, 
                { timeout: 900000, intervalBetweenAttempts: 5000 });
        } catch (err) {
            throw new ContainerTimeoutException(err);
        }
    }

    private async handleServiceProviderError(err: any, service: IContainerGroup, username: string) 
    {
        if (err instanceof ContainerTimeoutException) {
            await containerGroupStateProvider.record(service, username, ContainerGroupState.INACTIVE);
        } else {
            await this.synchronizeServiceState(service, username);
        }
        console.error(err);
    }

    private async synchronizeServiceState(service: IContainerGroup, username: string) 
    {
        const recordStatePromise = containerGroupStateProvider.get(service.name, username);
        const actualStatePromise = this._serviceProvider.getState(service);
        // Wait until both promises are finished.
        Promise.all([recordStatePromise, actualStatePromise]).then(async (values) => {
            const recordState = values[0];
            const actualState = values[1];
            if (!actualState.state) {
                await containerGroupStateProvider.record(service, username, ContainerGroupState.INACTIVE);
            } else if (recordState.state !== actualState.state) {
                await containerGroupStateProvider.record(service, username, actualState.state);
            }
        })
    }
}