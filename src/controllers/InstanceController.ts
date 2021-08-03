import { Request, Response } from 'express';
import { GenericServiceStateProvider, GenericService, ServiceState } from "../providers/container/GenericServiceProvider";
import { ContainerProviderFactory, ServiceConfigProviderFactory, ServiceStateProviderFactory } from '../providers/container/ServiceProviderFactory';
import { GenericServiceProvider, GenericServiceConfigProvider, ServiceTypeMapping } from "../providers/container/GenericServiceProvider";
import { waitUntil } from 'async-wait-until';
import { RuntimeMapping } from '../commons/Runtime';

export class InstanceController {
    private readonly _configProvider: GenericServiceConfigProvider;
    private readonly _serviceProvider: GenericServiceProvider;
    private readonly _serviceStateProvider: GenericServiceStateProvider;

    public constructor() {
        this._serviceProvider = new ContainerProviderFactory().createProvider();
        this._configProvider = new ServiceConfigProviderFactory().createProvider();
        this._serviceStateProvider = new ServiceStateProviderFactory().createProvider();
        this.createServiceV1 = this.createServiceV1.bind(this);
        this.getServiceStateV1 = this.getServiceStateV1.bind(this);
        this.stopServiceV1 = this.stopServiceV1.bind(this);
        this.deleteServiceV1 = this.deleteServiceV1.bind(this);
        this.listServicesV1 = this.listServicesV1.bind(this);
        this.createWorkspaceV1 = this.createWorkspaceV1.bind(this);
    }

    /**
     * Endpoint to create a service.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -H "Content-Type: application/json" -d '{"type":"JUPYTER", "cpus":1, "memory":2, "runtime": "python-3.8"}' -X POST http://localhost:8180/dsp/api/v1/service
     */
    public createServiceV1(req: Request, res: Response) {
        const type = ServiceTypeMapping[req.body.type];
        const runtime = RuntimeMapping[req.body.runtime];
        const cpus = req.body.cpus ? parseFloat(req.body.cpus) : 0;
        const memory = req.body.memory ? parseInt(req.body.memory) : 0;
        const packages = (req.body.packages) ? req.body.packages : [];
        const username = 'ntcore';
        const name = `${type.toLowerCase()}_${username}`;
        const config = this._configProvider.createDevelopmentConfig(name, type, runtime, cpus, memory, packages);
        this._serviceStateProvider.record(config, username, ServiceState.PENDING, runtime, cpus, memory, packages)
            .then(() => Promise.resolve(res.status(201).send({ name: name, status: ServiceState.PENDING })))
            .then(() => this._serviceProvider.provision(config))
            .then(() => this._serviceProvider.start(config), (err) => Promise.reject(err))
            .then(() => this.waitForInstanceState(config, ServiceState.RUNNING), (err) => Promise.reject(err))
            .then(() => this._serviceStateProvider.record(config, username, ServiceState.RUNNING), (err) => Promise.reject(err))
            .catch((err) => this.handleServiceProviderError(err, config, username));
    }

    /**
     * Endpoint to stop a service.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -H 'Content-Type: application/json' -X PUT http://localhost:8180/dsp/api/v1/service/:name
     */
    public stopServiceV1(req: Request, res: Response) {
        const username = 'ntcore';
        const name = req.params.name;
        const config = this._configProvider.createDevelopmentConfig(name);
        this._serviceProvider.getState(config)
            .then(() => this._serviceStateProvider.record(config, username, ServiceState.STOPPING))
            .then(() => {res.status(201).send(config)})
            .then(() => this._serviceProvider.stop(config))
            .then(() => this.waitForInstanceState(config, ServiceState.INACTIVE), (err) => Promise.reject(err))
            .then(() => this._serviceStateProvider.record(config, username, ServiceState.STOPPED), (err) => Promise.reject(err))
            .catch((err) => this.handleServiceProviderError(err, config, username));
    }

    /**
     * Endpoint to delete a service.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X DELETE http://localhost:8180/dsp/api/v1/service/:name
     */
    public deleteServiceV1(req: Request, res: Response) {
        const username = 'ntcore';
        const name = req.params.name;
        const config = this._configProvider.createDevelopmentConfig(name);
        this._serviceProvider.getState(config)
            .then(() => this._serviceStateProvider.record(config, username, ServiceState.STOPPING))
            .then(() => {res.status(201).send(config)})
            .then(() => this._serviceProvider.stop(config))
            .then(() => this.waitForInstanceState(config, ServiceState.INACTIVE), (err) => Promise.reject(err))
            .then(() => this._serviceProvider.delete(config), (err) => Promise.reject(err))
            .then(() => this._serviceStateProvider.record(config, username, ServiceState.INACTIVE), (err) => Promise.reject(err))
            .catch((err) => this.handleServiceProviderError(err, config, username));
    }

    /**
     * Endpoint to update the variables of container.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X PUT -H "Content-Type: application/json" -d '{"vars":["foo=bar"]}' 'http://localhost:8180/dsp/api/v1/service/:name/vars'
     */
    public async updateServiceVarV1(req: Request, res: Response) {
        if (!(req.body.vars instanceof Array)) {
            res.status(400).send({ error: "Vars should be an array." });
            return;
        }
        try {
            const command = `echo '${req.body.vars.join('\n')}' > ~/.ntcorevar`;
            const service = await this._serviceProvider.exec(req.params.name, command);
            res.status(201).send(service);
        } catch (e) {
            res.status(500).send({ error: `Failed to update env variables: ${e}` });
        }
    }

    /**
     * Endpoint to create workspace in the given container.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X POST 'http://localhost:8180/dsp/api/v1/service/:name/workspace/:workspaceId'
     */
     public createWorkspaceV1(req: Request, res: Response) {
        const name = req.params.name;
        const workspaceId = req.params.workspaceId;
        const command = `mkdir -p $DSP_INSTANCE_HOME/${workspaceId}`;
        this._serviceProvider.exec(name, command)
            .then(() => res.status(201).send({ info: `Created workspace ${workspaceId} in container ${name}` }), () => Promise.reject())
            .catch((err) => res.status(500).send({ error: `Failed to create workspace ${workspaceId} in container ${name}: ${err}` }));
    }

    /**
     * Endpoint to list services based on the given username.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X GET 'http://localhost:8180/dsp/api/v1/services'
     */
    public listServicesV1(req: Request, res: Response) {
        this._serviceStateProvider.list('ntcore')
            .then((services) => res.status(200).send(services))
            .catch((err) => res.status(500).send({ error: `Failed to list local containers: ${err}` }));
    }

    /**
     * Endpoint to retrieve a service object based on the given service name.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/service/{name}
     */
    public getServiceStateV1(req: Request, res: Response) {
        const name = req.params.name;
        this._serviceStateProvider.get(name, 'ntcore')
            .then((state) => Promise.resolve(res.status(200).send(state)))
            .catch((err) => res.status(500).send({ error: `Failed to get instance state: ${err}` }));
    }

    /**
     * Wait until the actual service state equals to the target service state.
     * @param config service configuration.
     * @param targetState target service state.
     * @returns service configuration.
     */
    private async waitForInstanceState(config: GenericService, targetState: ServiceState) {
        await waitUntil(async () => (await this._serviceProvider.getState(config)).state === targetState, 
            { timeout: 900000, intervalBetweenAttempts: 5000 });
        return config;
    }

    private async handleServiceProviderError(err: any, service: GenericService, username: string) {
        await this.synchronizeServiceState(service, username);
        console.error(err);
    }

    private async synchronizeServiceState(service: GenericService, username: string) {
        const recordStatePromise = this._serviceStateProvider.get(service.name, username);
        const actualStatePromise = this._serviceProvider.getState(service);
        Promise.all([recordStatePromise, actualStatePromise]).then((values) => {
            const recordState = values[0];
            const actualState = values[1];
            if (!actualState.state) {
                this._serviceStateProvider.record(service, username, ServiceState.INACTIVE);
            } else if (recordState.state !== actualState.state) {
                this._serviceStateProvider.record(service, username, actualState.state);
            }
        })
    }
}