import { Request, Response } from 'express';
import { Experiment, ExperimentState } from "../providers/experiment/ExperimentProvider";
import { workspaceProvider, experimentProvider } from "../libs/config/AppModule";
import { storageProvider } from "../libs/config/AppModule";
import { appConfig } from '../libs/config/AppConfigProvider';

const AUTH_USER_HEADER_NAME = "X-NTCore-Auth-User";

export class ExperimentController 
{
    public constructor()
    {
        this.createExperimentV1 = this.createExperimentV1.bind(this);
        this.listExperimentsV1 = this.listExperimentsV1.bind(this);
        this.getExperimentsV1 = this.getExperimentsV1.bind(this);
        this.downloadModelV1 = this.downloadModelV1.bind(this);
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
     * curl -H "Content-Type: application/json" -d '{"model": "Logistic Regression", "parameters": {"penalty": "l2"}, "metrics": {"auc":0.9}}' -X POST http://localhost:8180/dsp/api/v1/workspace/C123/experiment
     */
    public async createExperimentV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const description = req.body.description;
        const runtime = req.body.runtime;
        const framework = req.body.framework;
        const parameters = JSON.parse(req.body.parameters);
        const metrics = JSON.parse(req.body.metrics);
        const state = ExperimentState.UNREGISTERED;
        const version = await workspaceProvider.incrementVersion(workspaceId);
        const createdBy = req.get(AUTH_USER_HEADER_NAME) ?? appConfig.account.username;
        const experiment: Experiment = {
            workspaceId,
            version,
            runtime,
            framework,
            parameters,
            metrics,
            description,
            state,
            createdBy: createdBy,
            createdAt: new Date()
        }
        if (req.body.model) {
            experiment.model = Buffer.from(req.body.model, 'base64');
        } else {
            await storageProvider.putObject(workspaceId, version);
        }
        try {
            await experimentProvider.create(experiment);
            res.status(201).send({workspaceId, version});
        } catch (err) {
            res.status(500).send({error: `Unable to create experiment: ${err}`});
        }
    }

    /**
     * Endpoint to list experiment based on the given workspace id.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl http://localhost:8180/dsp/api/v1/workspace/{workspaceId}/experiments
     */
    public async listExperimentsV1(req: Request, res: Response)
    {
        const workspaceId = req.params.workspaceId;
        try {
            const experiments = await experimentProvider.list(workspaceId);
            res.status(200).send(experiments);
        } catch (err) {
            res.status(500).send({error: `Unable to list experiments: ${err}`});
        }
    }

    /**
     * Endpoint to get an experiment based on the given workspace id and version.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl http://localhost:8180/dsp/api/v1/workspace/{workspaceId}/experiment/{version}
     */
    public async getExperimentsV1(req: Request, res: Response)
    {
        const workspaceId = req.params.workspaceId;
        try {
            const version = parseInt(req.params.version);
            const experiment = await experimentProvider.read(workspaceId, version);
            res.status(200).send(experiment);
        } catch (err) {
            res.status(500).send({error: `Unable to get experiment: ${err}`});
        }
    }

    /**
     * Endpoint to download a model based on the given workspace id and version.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl localhost:8180/dsp/api/v1/workspace/{workspaceId}/model/{version}
     */
    public async downloadModelV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.params.version);
        try {
            const buffer = await experimentProvider.loadModel(workspaceId, version);
            const model = Buffer.from(buffer['model'], 'binary');
            res.writeHead(200, {'Content-Type': 'application/octet-stream', 'Content-Length': model.length});
            res.end(model);
        } catch (err) {
            res.status(500).send({error: `Unable to download model: ${err}`});
        }
    }

    /**
     * Endpoint to delete a experiment version.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X DELETE http://localhost:8180/dsp/api/v1/workspace/{id}/experiment/{version}
     */
    public async deleteExperimentV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.params.version);
        try {
            await experimentProvider.delete(workspaceId, version)
            res.status(201).send({info: 'Successfully deleted experiment.'});
        } catch (err) {
            res.status(500).send({error: `Unable to delete experiment: ${err}`});
        }
    }
    
    /**
     * Endpoint to register an experiment.
     * @param req Request
     * @param res Response.
     * Example: curl -X POST http://localhost:8180/dsp/api/v1/workspace/{workspace_id}/registry/{version}
     */
    public async registerExperimentV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.body.version);
        try {
            await experimentProvider.register(workspaceId, version);
            res.status(200).send({info: `Registered version ${version}`});
        } catch (err) {
            res.status(500).send({error: `Unable to register experiment: ${err}`});
        }
    }

    /**
     * Endpoint to register an experiment.
     * @param req Request
     * @param res Response.
     * Example: curl http://localhost:8180/dsp/api/v1/workspace/{workspace_id}/registry
     */
    public async deregisterExperimentV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        try {
            const registry = await experimentProvider.getRegistry(workspaceId);
            await experimentProvider.deregister(workspaceId, registry.version);
            res.status(200).send({info: `Unregistered experimnt in workspace ${workspaceId}`});
        } catch (err) {
            res.status(500).send({error: `Unable to unregister experiments: ${err}`});
        }
    }

    /**
     * Endpoint to register an experiment.
     * @param req Request
     * @param res Response.
     * Example: curl http://localhost:8180/dsp/api/v1/workspace/{workspace_id}/registry
     */
    public async getRegistryV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        try {
            const registry = await experimentProvider.getRegistry(workspaceId);
            res.status(200).json(registry);
        } catch (err) {
            res.status(500).send({error: `Unable to get registered experiment: ${err}`});
        }
    }
}