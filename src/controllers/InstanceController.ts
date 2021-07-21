import { Request, Response } from 'express';
import { ProviderType } from "../commons/ProviderType";
import { 
    GenericServiceStateProvider, 
    GenericService, 
    ServiceState 
} from "../providers/container/GenericServiceProvider";
import { 
    ContainerProviderFactory, 
    ServiceConfigProviderFactory, 
    ServiceStateProviderFactory } from '../providers/container/ServiceProviderFactory';
import { 
    GenericServiceProvider, 
    GenericServiceConfigProvider,
    ServiceTypeMapping
} from "../providers/container/GenericServiceProvider";
import { waitUntil } from 'async-wait-until';
import { RuntimeMapping } from '../commons/Runtime';

export class InstanceController {
    private readonly _configProvider: GenericServiceConfigProvider;
    private readonly _serviceProvider: GenericServiceProvider;
    private readonly _serviceStateProvider: GenericServiceStateProvider;

    public constructor(providerType: ProviderType) {
        this._serviceProvider = new ContainerProviderFactory().createProvider(providerType);
        this._configProvider = new ServiceConfigProviderFactory().createProvider(providerType);
        this._serviceStateProvider = new ServiceStateProviderFactory().createProvider(providerType);
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
     * curl -H "Content-Type: application/json" -d '{"type":"JUPYTER", "cpus":1, "memory":2, runtime: 'python-3.8'}' -X POST http://localhost:8180/dsp/api/v1/service
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
            .catch((err) => this.handleServiceError(err, username));
    }

    /**
     * Endpoint to stop a service.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -H 'Content-Type: application/json' -X PUT 'http://localhost:8180/dsp/api/v1/service/:name'
     */
    public stopServiceV1(req: Request, res: Response) {
        const username = 'ntcore';
        const name = req.params.name;
        const config = this._configProvider.createDevelopmentConfig(name);
        this._serviceProvider.getState(config)
            .then((conf) => this._serviceStateProvider.record(conf, username, ServiceState.STOPPING))
            .then((conf) => {res.status(201).send(conf); return Promise.resolve(conf)})
            .then((conf) => this._serviceProvider.stop(conf))
            .then((conf) => this.waitForInstanceState(conf, ServiceState.INACTIVE), (err) => Promise.reject(err))
            .then((conf) => this._serviceStateProvider.record(conf, username, ServiceState.STOPPED), (err) => Promise.reject(err))
            .catch((err) => this.handleServiceError(err, username));
    }

    /**
     * Endpoint to delete a service.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X DELETE 'http://localhost:8180/dsp/api/v1/service/:name'
     */
    public deleteServiceV1(req: Request, res: Response) {
        const username = 'ntcore';
        const name = req.params.name;
        const config = this._configProvider.createDevelopmentConfig(name);
        this._serviceProvider.getState(config)
            .then((conf) => this._serviceStateProvider.record(conf, username, ServiceState.STOPPING))
            .then((conf) => {res.status(201).send(conf); return Promise.resolve(conf)})
            .then((conf) => this._serviceProvider.stop(conf))
            .then((conf) => this.waitForInstanceState(conf, ServiceState.INACTIVE), (err) => Promise.reject(err))
            .then((conf) => this._serviceProvider.delete(conf), (err) => Promise.reject(err))
            .then((conf) => this._serviceStateProvider.record(conf, username, ServiceState.INACTIVE), (err) => Promise.reject(err))
            .catch((err) => this.handleServiceError(err, username));
    }

    /**
     * Endpoint to update the variables of container.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X PUT -H "Content-Type: application/json" -d '{"vars":["foo=bar"]}' 'http://localhost:8180/dsp/api/v1/service/:name/vars'
     */
    public updateServiceVarV1(req: Request, res: Response) {
        const vars = req.body.vars;
        if (!(vars instanceof Array)) {
            return res.status(400).send({ error: `Vars should be an array.` });
        }
        const name = req.params.name;
        const command = `echo '${vars.join('\n')}' > ~/.ntcorevar`;
        this._serviceProvider.exec(name, command)
            .then((conf) => res.status(201).send(conf), () => Promise.reject())
            .catch((err) => res.status(500).send({ error: `Failed to update env variables: ${err}` }));
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

    private async waitForInstanceState(config: GenericService, targetState: ServiceState) {
        await waitUntil(async () => (await this._serviceProvider.getState(config)).state === targetState, 
            { timeout: 900000, intervalBetweenAttempts: 5000 });
        return config;
    }

    private async handleServiceError(err: any, username: string) {
        const services = await this._serviceStateProvider.list(username);
        await this.synchronizeServiceStates(username, services);
        console.error(err);
    }

    private async synchronizeServiceStates(username: string, services: GenericService[]) {
        const actualStates = await this._serviceProvider.listServices();
        const actualStateMap = actualStates.reduce((res, s) => { res[s.name] = s.state; return res }, {});
        (await this._serviceStateProvider.list(username))
        .filter(s => !actualStateMap[s.name] || actualStateMap[s.name].state !== s.state)
        .map(s => {
            if (actualStateMap[s.name]) this._serviceStateProvider.record(s, username, actualStateMap[s.name]);
            else this._serviceStateProvider.record(s, username, ServiceState.INACTIVE);
        });
        return services;
    }
}