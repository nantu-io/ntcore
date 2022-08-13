import { Request, Response } from 'express';
import { Experiment, ExperimentState } from "../providers/experiment/ExperimentProvider";
import { workspaceProvider, experimentProvider } from "../libs/config/AppModule";
import { storageProvider } from "../libs/config/AppModule";
import { Framework } from "../commons/Framework";
import { Runtime } from "../commons/Runtime";
import { ErrorHandler } from '../libs/utils/ErrorHandler';
import { RequestValidator } from '../libs/utils/RequestValidator';
import { appConfig } from '../libs/config/AppConfigProvider';

const AUTH_USER_HEADER_NAME = "X-NTCore-Auth-User";

export class ExperimentController 
{
    public constructor()
    {
        this.createExperimentV1 = this.createExperimentV1.bind(this);
        this.listExperimentsV1 = this.listExperimentsV1.bind(this);
        this.getExperimentsV1 = this.getExperimentsV1.bind(this);
        this.deleteExperimentV1 = this.deleteExperimentV1.bind(this);
        this.registerExperimentV1 = this.registerExperimentV1.bind(this);
        this.getRegistryV1 = this.getRegistryV1.bind(this);
        this.deregisterExperimentV1 = this.deregisterExperimentV1.bind(this);
    }

    /**
     * Endpoint to create experiment.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -H "Content-Type: application/json" -d '{"model": "Logistic Regression", "parameters": {"penalty": "l2"}, "metrics": {"auc":0.9}}' \
     *      -X POST http://localhost:8180/dsp/api/v1/workspace/C123/experiment
     */
    public async createExperimentV1(
        req: Request<{workspaceId: string}, {}, {description: string, runtime: Runtime, framework: Framework, parameters: string, metrics: string}, {}>, 
        res: Response<Experiment>) 
    {
        const { workspaceId } = req.params;
        const { description, runtime, framework, parameters, metrics } = req.body;
        try {
            RequestValidator.validateRequest(workspaceId);
            const state = "UNREGISTERED" as ExperimentState;
            const version = await workspaceProvider.incrementVersion(workspaceId);
            const createdBy = req.get(AUTH_USER_HEADER_NAME) ?? appConfig.account.username;
            const experiment: Experiment = {
                workspaceId,
                version,
                runtime,
                framework,
                parameters: JSON.parse(parameters),
                metrics: JSON.parse(metrics),
                description,
                state,
                createdBy: createdBy,
                createdAt: Math.floor((new Date()).getTime()/1000)
            }
            Promise.all([storageProvider.putObject(workspaceId, version), experimentProvider.create(experiment)]);
            res.status(201).send(experiment);
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }

    /**
     * Endpoint to list experiment based on the given workspace id.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl http://localhost:8180/dsp/api/v1/workspace/{workspaceId}/experiments
     */
    public async listExperimentsV1(
        req: Request<{workspaceId: string}, {}, {}, {}>,
        res: Response<Experiment[]>)
    {
        const { workspaceId } = req.params;
        try {
            RequestValidator.validateRequest(workspaceId);
            const experiments = await experimentProvider.list(workspaceId);
            res.status(200).send(experiments);
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }

    /**
     * Endpoint to get an experiment based on the given workspace id and version.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl http://localhost:8180/dsp/api/v1/workspace/{workspaceId}/experiment/{version}
     */
    public async getExperimentsV1(
        req: Request<{workspaceId: string, version: string}, {}, {}, {}>,
        res: Response<Experiment>)
    {
        const { workspaceId, version } = req.params;
        try {
            RequestValidator.validateRequest(workspaceId, version);
            const experiment = await experimentProvider.read(workspaceId, parseInt(version));
            res.status(200).send(experiment);
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }

    /**
     * Endpoint to delete a experiment version.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X DELETE http://localhost:8180/dsp/api/v1/workspace/{id}/experiment/{version}
     */
    public async deleteExperimentV1(
        req: Request<{workspaceId: string, version: string}, {}, {}, {}>,
        res: Response<Experiment>) 
    {
        const { workspaceId, version } = req.params;
        try {
            RequestValidator.validateRequest(workspaceId, version);
            await experimentProvider.delete(workspaceId, parseInt(version))
            res.status(201).send();
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }
    
    /**
     * Endpoint to register an experiment.
     * @param req Request
     * @param res Response.
     * Example: curl -X POST http://localhost:8180/dsp/api/v1/workspace/{workspace_id}/registry/{version}
     */
    public async registerExperimentV1(
        req: Request<{workspaceId: string}, {}, {version: string}, {}>,
        res: Response<Experiment>)
    {
        const { workspaceId } = req.params;
        const { version } = req.body;
        try {
            RequestValidator.validateRequest(workspaceId, version);
            await experimentProvider.register(workspaceId, parseInt(version));
            res.status(200).send();
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }

    /**
     * Endpoint to register an experiment.
     * @param req Request
     * @param res Response.
     * Example: curl http://localhost:8180/dsp/api/v1/workspace/{workspace_id}/registry
     */
    public async deregisterExperimentV1(
        req: Request<{workspaceId: string}, {}, {version: string}, {}>,
        res: Response<Experiment>)
    {
        const workspaceId = req.params.workspaceId;
        try {
            RequestValidator.validateRequest(workspaceId);
            const registry = await experimentProvider.getRegistry(workspaceId);
            await experimentProvider.deregister(workspaceId, registry.version);
            res.status(201).send();
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }

    /**
     * Endpoint to register an experiment.
     * @param req Request
     * @param res Response.
     * Example: curl http://localhost:8180/dsp/api/v1/workspace/{workspace_id}/registry
     */
    public async getRegistryV1(
        req: Request<{workspaceId: string}, {}, {version: string}, {}>,
        res: Response<Experiment>)
    {
        const { workspaceId }= req.params;
        try {
            RequestValidator.validateRequest(workspaceId);
            const registry = await experimentProvider.getRegistry(workspaceId);
            res.status(200).json(registry);
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }
}