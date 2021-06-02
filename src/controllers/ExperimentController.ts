import { Request, Response } from 'express';
import { GenericExperimentProvider } from "../providers/experiment/GenericExperimentProvider";
import { ExperimentProviderFactory } from "../providers/experiment/ExperimentProviderFactory";
import { Util } from '../commons/Util';
import { Runtime } from '../commons/Runtime';
import { ProviderType } from '../commons/ProviderType';
import { DeploymentProviderFactory } from '../providers/deployment/DeploymentProviderFactory';
import { GenericWorkspaceProvider } from '../providers/workspace/GenericWorkspaceProvider';
import { WorkpaceProviderFactory } from '../providers/workspace/WorkspaceProviderFactory';
import { ContainerProviderFactory } from '../providers/container/ServiceProviderFactory';
import { ServiceConfigProviderFactory } from '../providers/container/ServiceProviderFactory';
import { waitUntil } from 'async-wait-until';
import { 
    GenericDeploymentProvider, 
    DeploymentStatus, 
    IllegalStateError,
} from '../providers/deployment/GenericDeploymentProvider';
import { 
    GenericServiceProvider, 
    GenericServiceConfigProvider, 
    ServiceState,
    ServiceTypeMapping, 
    ServiceType
} from '../providers/container/GenericServiceProvider';
import { Framework } from '../commons/Framework';

export class ExperimentController {
    private readonly _workspaceProvider: GenericWorkspaceProvider;
    private readonly _experimentProvider: GenericExperimentProvider;
    private readonly _deploymentProvider: GenericDeploymentProvider;
    private readonly _serviceProvider: GenericServiceProvider;
    private readonly _configProvider: GenericServiceConfigProvider;

    public constructor() {
        this._workspaceProvider = new WorkpaceProviderFactory().createProvider(ProviderType.LOCAL);
        this._experimentProvider = new ExperimentProviderFactory().createProvider(ProviderType.LOCAL);
        this._deploymentProvider = new DeploymentProviderFactory().createProvider(ProviderType.LOCAL);
        this._serviceProvider = new ContainerProviderFactory().createProvider(ProviderType.LOCAL);
        this._configProvider = new ServiceConfigProviderFactory().createProvider(ProviderType.LOCAL);
        this.createExperimentV1 = this.createExperimentV1.bind(this);
        this.listExperimentsV1 = this.listExperimentsV1.bind(this);
        this.getExperimentsV1 = this.getExperimentsV1.bind(this);
        this.uploadModelV1 = this.uploadModelV1.bind(this);
        this.downloadModelV1 = this.downloadModelV1.bind(this);
        this.deployModelV1 = this.deployModelV1.bind(this);
        this.deleteExperimentV1 = this.deleteExperimentV1.bind(this);
    }

    /**
     * Endpoint to create experiment.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -H "Content-Type: application/json" -d '{"model": "Logistic Regression", "parameters": {"penalty": "l2"}, "metrics": {"auc":0.9}}' -X POST http://localhost:8180/dsp/api/v1/workspace/C123/experiment
     */
    public createExperimentV1(req: Request, res: Response) {
        const workspaceId = req.params.workspaceId;
        const description = req.body.description;
        const runtime = req.body.runtime;
        const framework = req.body.framework;
        const parameters = JSON.parse(req.body.parameters);
        const metrics = JSON.parse(req.body.metrics);
        const base64 = req.body.model;
        this._workspaceProvider.incrementVersion(workspaceId)
            .then((version) => this._experimentProvider.create({
                workspaceId,
                version,
                runtime,
                framework,
                parameters,
                metrics,
                description,
                createdBy: 'ntcore',
                createdAt: new Date()
            }))
            .then((version) => this._experimentProvider.saveModel(workspaceId, version, base64))
            .then((version) => Promise.resolve(res.status(201).send({workspaceId, version}))); 
    }

    /**
     * Endpoint to list experiment based on the given workspace id.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl http://localhost:8180/dsp/api/v1/workspace/{workspaceId}/experiments
     */
    public listExperimentsV1(req: Request, res: Response) {
        const workspaceId = req.params.workspaceId;
        const experiments = this._experimentProvider.list(workspaceId);
        experiments.then(w => res.status(200).send(w));
    }

    /**
     * Endpoint to get an experiment based on the given workspace id and version.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl http://localhost:8180/dsp/api/v1/workspace/{workspaceId}/experiment/{version}
     */
    public getExperimentsV1(req: Request, res: Response) {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.params.version);
        const experiment = this._experimentProvider.read(workspaceId, version);
        experiment.then(w => res.status(200).send(w));
    }

    /**
     * Endpoint to upload a model file based on the given workspace id and version.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl -F "model=@model.pkl" localhost:8180/dsp/api/v1/workspace/{workspaceId}/model/{version}
     */
    public uploadModelV1(req: Request, res: Response) {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.params.version);
        const base64 = req.body.model;
        this._experimentProvider.saveModel(workspaceId, version, base64)
            .then(w => res.status(200).send(w));
    }

    /**
     * Endpoint to download a model based on the given workspace id and version.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl localhost:8180/dsp/api/v1/workspace/{workspaceId}/model/{version}
     */
    public downloadModelV1(req: Request, res: Response) {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.params.version);
        this._experimentProvider.loadModel(workspaceId, version)
            .then((model) => res.download(model));
    }

    /**
     * Endpoint to deploy a model based on the given workspace id and version.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl -X POST -H "Content-Type: application/json" localhost:8180/dsp/api/v1/workspace/{workspaceId}/model/{version}/deploy
     */
    public deployModelV1(req: Request, res: Response) {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.params.version);
        const runtime = Runtime.PYTHON_38;
        const framework = Framework.SKLEARN;
        const deploymentId = Util.createDeploymentId();
        const type = ServiceTypeMapping[`FLASK_${framework.toUpperCase()}`];
        const cpu = 1;
        const memory = 2;
        this._deploymentProvider.aquireLock(workspaceId, version)
            .then(() => this.createDeployment(workspaceId, deploymentId, version), (err) => this.handleLockAquisitionError(res, err))
            .then(() => Promise.resolve(res.status(201).send({info: `Started deployment ${deploymentId}`})), (err) => Promise.reject(err))
            .then(() => Promise.resolve(this._configProvider.createDeploymentConfig(type, workspaceId, version, runtime, framework, cpu, memory)), (err) => Promise.reject(err))
            .then((config) => this._serviceProvider.provision(config), (err) => Promise.reject(err))
            .then((config) => this._serviceProvider.start(config), (err) => Promise.reject(err))
            .then(() => this.waitForServiceRunning(type, workspaceId), (err) => Promise.reject(err))
            .then(() => this._deploymentProvider.releaseLock(workspaceId), (err) => Promise.reject(err))
            .then(() => this._deploymentProvider.updateStatus(workspaceId, deploymentId, DeploymentStatus.SUCCEED), (err) => Promise.reject(err))
            .catch((err) => this.handleDeploymentError(err, workspaceId, deploymentId));
    }

    /**
     * Endpoint to delete a experiment version.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X DELETE http://localhost:8180/dsp/api/v1/workspace/{id}/experiment/{version}
     */
     public deleteExperimentV1(req: Request, res: Response) {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.params.version);
        this._experimentProvider.delete(workspaceId, version)
            .then(() => this._experimentProvider.deleteModel(workspaceId, version))
            .then(() => res.status(201).send({info: 'Successfully deleted experiment.'}));
    }

    private handleLockAquisitionError(res: Response, err: any) {
        if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
            res.status(400).send({error: 'Deployment in progress'});
        } else {
            res.status(500).send({error: err.toString()});
        }
        return Promise.reject(new IllegalStateError('Unable to aquire deployment lock'))
    }

    private handleDeploymentError(error: Error, workspaceId: string, deploymentId: string) {
        if (!(error instanceof IllegalStateError)) {
            this._deploymentProvider.releaseLock(workspaceId);
            this._deploymentProvider.updateStatus(workspaceId, deploymentId, DeploymentStatus.FAILED);
        }
        console.error(error);
    }

    private createDeployment(workspaceId: string, deploymentId: string, version: number) {
        return this._deploymentProvider.create({
            workspaceId,
            deploymentId,
            version,
            status: DeploymentStatus.PENDING,
            createdBy: 'ntcore',
            createdAt: new Date(),
        });
    }

    private async waitForServiceRunning(type: ServiceType, workspaceId: string) {
        const config = this._configProvider.createDeploymentConfig(type, workspaceId);
        await waitUntil(async () => (await this._serviceProvider.getState(config)).state === ServiceState.RUNNING,
            { timeout: 300000, intervalBetweenAttempts: 5000 });
        return config;
    }
}